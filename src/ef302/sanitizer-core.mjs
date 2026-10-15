export const EF302_WINDOW = Object.freeze({
  start: "2026-10-13T03:30:00Z",
  end: "2026-10-13T04:45:00Z"
});

export const EF302_REGION = "cn-wulanchabu";

const REQUIRED_SOURCES = Object.freeze([
  "sts",
  "ecs_command",
  "target_instance",
  "model_studio",
  "billing"
]);

const APPROVED_ADAPTERS = Object.freeze({
  sts: "actiontrail-control-plane-v1",
  ecs_command: "ecs-invocation-metadata-v1",
  target_instance: "ecs-invocation-metadata-v1"
});

const UNKNOWN_SOURCE = Object.freeze({
  coverage: "unknown",
  outcome: "unknown",
  aggregate_count: 0,
  lifecycle_status: "unknown",
  observed_at: EF302_WINDOW.end
});

function isSha256(value) {
  return typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value);
}

function isCommitSha(value) {
  return typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
}

function isIsoTimestamp(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isIsoInWindow(value) {
  const instant = Date.parse(value);
  return Number.isFinite(instant) &&
    instant >= Date.parse(EF302_WINDOW.start) &&
    instant <= Date.parse(EF302_WINDOW.end);
}

function lifecycle(values) {
  if (values.every((value) => value === "succeeded")) return "succeeded";
  if (values.some((value) => value === "failed")) return "failed";
  return "unknown";
}

function unknownSource(observedAt) {
  return {
    ...UNKNOWN_SOURCE,
    observed_at: isIsoTimestamp(observedAt) ? observedAt : EF302_WINDOW.end
  };
}

function validScopeProof(proof, source, adapterId, scopeManifestDigest) {
  return proof?.schema_version === "ef302-scope-proof-v1" &&
    proof.source === source &&
    proof.adapter_id === adapterId &&
    proof.scope_manifest_digest === scopeManifestDigest &&
    proof.region === EF302_REGION &&
    proof.audit_window_utc?.start === EF302_WINDOW.start &&
    proof.audit_window_utc?.end === EF302_WINDOW.end &&
    proof.sealed_role_selector_bound === true &&
    proof.sealed_instance_selector_bound === true &&
    proof.old_run_selector_bound === true &&
    proof.event_allowlist_bound === true &&
    isSha256(proof.event_allowlist_digest);
}

function validCollectionProof(proof, source, adapterId, scopeManifestDigest) {
  return validScopeProof(proof, source, adapterId, scopeManifestDigest) &&
    proof.collection_complete === true &&
    proof.pagination_exhausted === true &&
    proof.provider_filters_applied === true &&
    proof.parse_success === true;
}

function validNormalizedRecord(record) {
  return record &&
    Object.keys(record).every((key) =>
      ["in_scope", "occurred_at", "lifecycle_status"].includes(key)) &&
    record.in_scope === true &&
    isIsoInWindow(record.occurred_at) &&
    ["succeeded", "failed", "unknown"].includes(record.lifecycle_status);
}

/**
 * Accepts only minimal normalized records from a sealed in-process provider
 * adapter. The adapter must discard raw provider objects before this function
 * is called. Arbitrary callbacks, selectors, and unsealed scope inputs are
 * deliberately rejected.
 */
export function sanitizeCollectedSource({
  source,
  adapterId,
  adapterProof,
  scopeManifestDigest,
  records,
  observedAt
}) {
  try {
    if (
      !Object.hasOwn(APPROVED_ADAPTERS, source) ||
      APPROVED_ADAPTERS[source] !== adapterId ||
      !isSha256(scopeManifestDigest) ||
      !isIsoTimestamp(observedAt) ||
      !Array.isArray(records) ||
      !validCollectionProof(adapterProof, source, adapterId, scopeManifestDigest) ||
      !records.every(validNormalizedRecord)
    ) {
      return unknownSource(observedAt);
    }

    return {
      coverage: "complete",
      outcome: records.length === 0 ? "absent" : "present",
      aggregate_count: records.length,
      lifecycle_status: records.length === 0
        ? "not-applicable"
        : lifecycle(records.map((record) => record.lifecycle_status)),
      observed_at: observedAt
    };
  } catch {
    return unknownSource(observedAt);
  }
}

export function unavailableSource(observedAt) {
  return {
    coverage: "unavailable",
    outcome: "unknown",
    aggregate_count: 0,
    lifecycle_status: "unknown",
    observed_at: isIsoTimestamp(observedAt) ? observedAt : EF302_WINDOW.end
  };
}

function isSanitizedSource(source) {
  return source &&
    ["complete", "unavailable", "retention-gap", "unknown"].includes(source.coverage) &&
    ["present", "absent", "unknown"].includes(source.outcome) &&
    Number.isInteger(source.aggregate_count) &&
    source.aggregate_count >= 0 &&
    ["succeeded", "failed", "not-applicable", "unknown"].includes(source.lifecycle_status) &&
    isIsoTimestamp(source.observed_at);
}

function hasExpectedSources(sources) {
  return sources &&
    Object.keys(sources).length === REQUIRED_SOURCES.length &&
    REQUIRED_SOURCES.every((name) => Object.hasOwn(sources, name) && isSanitizedSource(sources[name]));
}

export function conclude(sources) {
  if (!hasExpectedSources(sources)) return "unknown";

  const sourceValues = REQUIRED_SOURCES.map((name) => sources[name]);
  if (sourceValues.some((source) => source.coverage !== "complete")) {
    return "unknown";
  }
  if (sourceValues.some((source) => source.outcome === "present")) {
    return "evidence-found";
  }
  if (sourceValues.every((source) => source.outcome === "absent")) {
    return "no-evidence-found";
  }
  return "unknown";
}

function validTeardownProof(proof, sourceCommitSha, scopeManifestDigest) {
  return proof?.schema_version === "ef302-teardown-proof-v1" &&
    proof.source_commit_sha === sourceCommitSha &&
    proof.scope_manifest_digest === scopeManifestDigest &&
    proof.runtime_identity_disabled === true &&
    proof.function_disabled_or_deleted === true &&
    proof.control_plane_verified === true &&
    isIsoTimestamp(proof.observed_at);
}

/**
 * This finalizer is callable only after the provider control plane has
 * confirmed both function disablement/deletion and runtime-identity
 * disablement. Missing or malformed proof emits no attestation.
 */
export function buildAttestation({
  sourceCommitSha,
  scopeManifestDigest,
  sources,
  teardownProof
}) {
  if (
    !isCommitSha(sourceCommitSha) ||
    !isSha256(scopeManifestDigest) ||
    !hasExpectedSources(sources) ||
    !validTeardownProof(teardownProof, sourceCommitSha, scopeManifestDigest)
  ) {
    throw new Error("EF-302 finalization proof is incomplete");
  }

  return Object.freeze({
    schema_version: "ef302-sanitized-attestation-v1",
    audit_window_utc: EF302_WINDOW,
    region: EF302_REGION,
    source_commit_sha: sourceCommitSha,
    scope_manifest_digest: scopeManifestDigest,
    sources,
    conclusion: conclude(sources),
    identity_disabled: true
  });
}
