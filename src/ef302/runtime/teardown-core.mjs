const ALLOWED_LIFECYCLE = Object.freeze([
  "succeeded",
  "failed",
  "not-applicable",
  "unknown"
]);

/**
 * Invokes only the private-artifact teardown callback after the single
 * permitted audit attempt. The callback owns provider-specific disablement;
 * this public core receives no role, policy, account, token, selector,
 * command, endpoint, or credential.
 */
export async function teardownAfterSingleAudit(disableIdentity, { invocationCount } = {}) {
  if (typeof disableIdentity !== "function") {
    throw new Error("EF-302 fail-closed: teardown callback is required");
  }
  if (invocationCount !== 1) {
    throw new Error("EF-302 fail-closed: teardown requires exactly one invocation");
  }

  let lifecycle = "unknown";
  try {
    const result = await disableIdentity();
    lifecycle = result && ALLOWED_LIFECYCLE.includes(result.lifecycle_status)
      ? result.lifecycle_status
      : "unknown";
  } catch {
    lifecycle = "failed";
  }

  if (lifecycle !== "succeeded") {
    throw new Error("EF-302 fail-closed: audit identity disablement not proven");
  }

  return Object.freeze({
    outcome: "present",
    lifecycle_status: "succeeded"
  });
}
