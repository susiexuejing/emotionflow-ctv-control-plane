export const EF302_WINDOW = Object.freeze({
  start: "2026-10-13T03:30:00Z",
  end: "2026-10-13T04:45:00Z"
});

export const EF302_REGION = "cn-wulanchabu";

/**
 * This public baseline is intentionally non-executable. It contains neither
 * a sealed runtime manifest nor a control-plane teardown adapter. A later
 * reviewed deployment package must replace this sentinel with verified
 * adapters before any provider query can be enabled.
 */
export const EF302_EXECUTABLE = false;

const REQUIRED_SOURCES = Object.freeze([
  "sts",
  "ecs_command",
  "target_instance",
  "model_studio",
  "billing"
]);

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

function unknownSource(observedAt) {
  return {
    ...UNKNOWN_SOURCE,
    observed_at: isIsoTimestamp(observedAt) ? observedAt : EF302_WINDOW.end
  };
}

/**
 * Model Studio and billing are permanently unavailable in this authorization.
 * No caller can override this outcome.
 */
export function unavailableSource(observedAt) {
  return {
    coverage: "unavailable",
    outcome: "unknown",
    aggregate_count: 0,
    lifecycle_status: "unknown",
    observed_at: isIsoTimestamp(observedAt) ? observedAt : EF302_WINDOW.end
  };
}

/**
 * Deliberately rejects all provider records and proof-shaped input. Accepting
 * such input would let a caller forge scope, pagination, or filter evidence.
 */
export function sanitizeCollectedSource({ observedAt } = {}) {
  return unknownSource(observedAt);
}

function fixedSources(observedAt) {
  return Object.freeze({
    sts: unknownSource(observedAt),
    ecs_command: unknownSource(observedAt),
    target_instance: unknownSource(observedAt),
    model_studio: unavailableSource(observedAt),
    billing: unavailableSource(observedAt)
  });
}

export function conclude(sources) {
  if (!sources || REQUIRED_SOURCES.some((name) => !Object.hasOwn(sources, name))) {
    return "unknown";
  }
  return "unknown";
}

/**
 * No attestation from this baseline may state that an identity was disabled,
 * that a collection was complete, or that evidence was absent/present.
 */
export function buildFailClosedAttestation({
  sourceCommitSha,
  scopeManifestDigest,
  observedAt
}) {
  if (!isCommitSha(sourceCommitSha) || !isSha256(scopeManifestDigest)) {
    throw new Error("EF-302 provenance is incomplete");
  }

  const sources = fixedSources(observedAt);
  return Object.freeze({
    schema_version: "ef302-sanitized-attestation-v1",
    audit_window_utc: EF302_WINDOW,
    region: EF302_REGION,
    source_commit_sha: sourceCommitSha,
    scope_manifest_digest: scopeManifestDigest,
    sources,
    conclusion: conclude(sources)
  });
}

/**
 * Callers must not create or invoke a runtime from this source revision.
 */
export function assertExecutableRuntime() {
  throw new Error(
    "EF-302 is fail-closed: sealed manifest and verified teardown adapters are absent"
  );
}
