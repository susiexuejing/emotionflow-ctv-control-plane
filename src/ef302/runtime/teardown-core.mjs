const SHA256 = /^sha256:[0-9a-f]{64}$/;
const ALLOWED_LIFECYCLE = Object.freeze([
  "succeeded",
  "failed",
  "not-applicable",
  "unknown"
]);

function assertAuthoritativeSingleUseProof(proof) {
  if (!proof || typeof proof !== "object") {
    throw new Error("EF-302 fail-closed: authoritative execution proof is required");
  }
  if (proof.invocation_count !== 1 || typeof proof.execution_record_sha256 !== "string" ||
      !SHA256.test(proof.execution_record_sha256)) {
    throw new Error("EF-302 fail-closed: single invocation is not proven");
  }
}

function succeededLifecycle(value) {
  return typeof value === "string" && ALLOWED_LIFECYCLE.includes(value) && value === "succeeded";
}

/**
 * The private artifact owns provider-specific disablement. Before it is called,
 * an immutable private execution-record digest must prove exactly one run. The
 * callback must independently prove successful teardown of both the temporary
 * function and its runtime identity. No provider selector, account, policy,
 * command, endpoint, token, or credential is accepted or returned here.
 */
export async function teardownAfterSingleAudit(disableTargets, { executionProof } = {}) {
  if (typeof disableTargets !== "function") {
    throw new Error("EF-302 fail-closed: teardown callback is required");
  }
  assertAuthoritativeSingleUseProof(executionProof);

  let result;
  try {
    result = await disableTargets();
  } catch {
    throw new Error("EF-302 fail-closed: teardown callback failed");
  }

  if (!result || typeof result !== "object" ||
      !succeededLifecycle(result.function_lifecycle_status) ||
      !succeededLifecycle(result.identity_lifecycle_status)) {
    throw new Error("EF-302 fail-closed: both teardown targets are not proven disabled");
  }

  return Object.freeze({
    outcome: "present",
    lifecycle_status: "succeeded"
  });
}
