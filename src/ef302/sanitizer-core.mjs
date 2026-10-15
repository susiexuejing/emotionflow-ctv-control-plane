export const EF302_WINDOW = Object.freeze({
  start: "2026-10-13T03:30:00Z",
  end: "2026-10-13T04:45:00Z"
});

export const EF302_REGION = "cn-wulanchabu";

const UNKNOWN_SOURCE = Object.freeze({
  coverage: "unknown",
  outcome: "unknown",
  aggregate_count: 0,
  lifecycle_status: "unknown",
  observed_at: EF302_WINDOW.end
});

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

/**
 * The caller may pass raw provider records, but this function returns only
 * whitelisted aggregate fields. Callers must discard raw records immediately
 * after this function returns and must never log them.
 */
export function sanitizeSource({ records, matchesScope, getTime, getLifecycle, observedAt }) {
  try {
    if (!Array.isArray(records) || typeof matchesScope !== "function") {
      return { ...UNKNOWN_SOURCE, observed_at: observedAt ?? EF302_WINDOW.end };
    }

    const relevant = [];
    for (const record of records) {
      if (matchesScope(record) && isIsoInWindow(getTime(record))) {
        relevant.push(record);
      }
    }

    return {
      coverage: "complete",
      outcome: relevant.length === 0 ? "absent" : "present",
      aggregate_count: relevant.length,
      lifecycle_status: relevant.length === 0
        ? "not-applicable"
        : lifecycle(relevant.map((record) => getLifecycle(record))),
      observed_at: observedAt
    };
  } catch {
    return { ...UNKNOWN_SOURCE, observed_at: observedAt ?? EF302_WINDOW.end };
  }
}

export function unavailableSource(observedAt) {
  return {
    coverage: "unavailable",
    outcome: "unknown",
    aggregate_count: 0,
    lifecycle_status: "unknown",
    observed_at: observedAt
  };
}

export function conclude(sources) {
  const sourceValues = Object.values(sources);
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

export function buildAttestation({ sourceCommitSha, scopeManifestDigest, sources }) {
  return Object.freeze({
    schema_version: "ef302-sanitized-attestation-v1",
    audit_window_utc: EF302_WINDOW,
    region: EF302_REGION,
    source_commit_sha: sourceCommitSha,
    scope_manifest_digest: scopeManifestDigest,
    sources,
    conclusion: conclude(sources),
    // This value is supplied only after teardown succeeds.
    identity_disabled: true
  });
}
