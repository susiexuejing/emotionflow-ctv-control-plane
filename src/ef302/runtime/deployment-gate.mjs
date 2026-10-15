export const EF302_RUNTIME_LIMITS = Object.freeze({
  maxRuntimeMinutes: 15,
  invocationLimit: 1,
  retryCount: 0,
  triggerCount: 0
});

const HEX_40 = /^[0-9a-f]{40}$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/;

const REQUIRED_DIGESTS = Object.freeze([
  "artifact_sha256",
  "scope_manifest_sha256",
  "independent_review_sha256",
  "runtime_policy_sha256",
  "output_whitelist_sha256",
  "private_path_proof_sha256",
  "logging_disabled_proof_sha256"
]);

const ALLOWED_ENVELOPE_KEYS = Object.freeze([
  "source_commit_sha",
  ...REQUIRED_DIGESTS,
  "max_runtime_minutes",
  "invocation_limit",
  "retry_count",
  "trigger_count",
  "public_internet_enabled",
  "logging_enabled",
  "http_trigger_enabled",
  "event_trigger_enabled",
  "async_enabled",
  "raw_output_enabled",
  "product_access_enabled",
  "database_access_enabled",
  "secret_access_enabled"
]);

function assertNoUnexpectedFields(envelope) {
  for (const key of Object.keys(envelope)) {
    if (!ALLOWED_ENVELOPE_KEYS.includes(key)) {
      throw new Error(`EF-302 fail-closed: unregistered field ${key}`);
    }
  }
}

function requireExact(value, expected, label) {
  if (value !== expected) throw new Error(`EF-302 fail-closed: ${label}`);
}

function requireDigest(value, label) {
  if (typeof value !== "string" || !SHA256.test(value)) {
    throw new Error(`EF-302 fail-closed: invalid ${label}`);
  }
}

function requireBoolean(value, expected, label) {
  if (value !== expected) throw new Error(`EF-302 fail-closed: ${label}`);
}

/**
 * Validates only a sealed deployment envelope. It intentionally returns no
 * resource selector, account identifier, command, event, prompt, or payload.
 * A caller must stop before provisioning when any proof is absent.
 */
export function assertSealedDeploymentEnvelope(envelope, { sourceCommitSha }) {
  if (!envelope || typeof envelope !== "object" || !HEX_40.test(sourceCommitSha)) {
    throw new Error("EF-302 fail-closed: invalid provenance");
  }

  assertNoUnexpectedFields(envelope);
  requireExact(envelope.source_commit_sha, sourceCommitSha, "source commit mismatch");
  for (const key of REQUIRED_DIGESTS) requireDigest(envelope[key], key);

  requireExact(envelope.max_runtime_minutes, EF302_RUNTIME_LIMITS.maxRuntimeMinutes, "runtime limit");
  requireExact(envelope.invocation_limit, EF302_RUNTIME_LIMITS.invocationLimit, "invocation limit");
  requireExact(envelope.retry_count, EF302_RUNTIME_LIMITS.retryCount, "retry count");
  requireExact(envelope.trigger_count, EF302_RUNTIME_LIMITS.triggerCount, "trigger count");

  requireBoolean(envelope.public_internet_enabled, false, "public internet must be disabled");
  requireBoolean(envelope.logging_enabled, false, "logging must be disabled");
  requireBoolean(envelope.http_trigger_enabled, false, "HTTP trigger must be disabled");
  requireBoolean(envelope.event_trigger_enabled, false, "event trigger must be disabled");
  requireBoolean(envelope.async_enabled, false, "async invocation must be disabled");
  requireBoolean(envelope.raw_output_enabled, false, "raw output must be disabled");
  requireBoolean(envelope.product_access_enabled, false, "product access must be disabled");
  requireBoolean(envelope.database_access_enabled, false, "database access must be disabled");
  requireBoolean(envelope.secret_access_enabled, false, "secret access must be disabled");

  return Object.freeze({
    source_commit_sha: envelope.source_commit_sha,
    artifact_sha256: envelope.artifact_sha256,
    scope_manifest_sha256: envelope.scope_manifest_sha256,
    independent_review_sha256: envelope.independent_review_sha256,
    runtime_policy_sha256: envelope.runtime_policy_sha256,
    output_whitelist_sha256: envelope.output_whitelist_sha256,
    private_path_proof_sha256: envelope.private_path_proof_sha256,
    logging_disabled_proof_sha256: envelope.logging_disabled_proof_sha256,
    max_runtime_minutes: envelope.max_runtime_minutes,
    invocation_limit: envelope.invocation_limit
  });
}
