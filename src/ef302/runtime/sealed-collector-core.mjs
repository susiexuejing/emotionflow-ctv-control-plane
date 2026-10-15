import { buildSanitizedSources } from "./sanitized-attestation-core.mjs";

const REQUIRED_SOURCES = Object.freeze([
  "sts",
  "ecs_command",
  "target_instance",
  "model_studio",
  "billing"
]);

const ALLOWED_RECORD_KEYS = Object.freeze([
  "coverage",
  "outcome",
  "aggregate_count",
  "lifecycle_status"
]);

function assertAdapterSet(adapters) {
  if (!adapters || typeof adapters !== "object") {
    throw new Error("EF-302 fail-closed: adapters are required");
  }
  const keys = Object.keys(adapters).sort();
  const expected = [...REQUIRED_SOURCES].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    throw new Error("EF-302 fail-closed: adapter set mismatch");
  }
  for (const name of REQUIRED_SOURCES) {
    if (typeof adapters[name] !== "function") {
      throw new Error(`EF-302 fail-closed: invalid adapter ${name}`);
    }
  }
}

function reducedRecord(candidate) {
  const source = candidate && typeof candidate === "object" ? candidate : {};
  const result = {};
  for (const key of ALLOWED_RECORD_KEYS) result[key] = source[key];
  return result;
}

/**
 * The private artifact supplies one fixed source adapter per approved source.
 * This core deliberately accepts no selector, request, command, identity,
 * network, credential, account, instance, or retry configuration.
 *
 * An adapter may examine provider-native data only inside the provider boundary.
 * This function keeps only the four whitelisted aggregate fields and does not
 * log, return, cache, or forward adapter-native material.
 */
export async function collectSealedProviderEvidence(adapters, { observedAt } = {}) {
  assertAdapterSet(adapters);
  const reduced = {};

  for (const name of REQUIRED_SOURCES) {
    try {
      reduced[name] = reducedRecord(await adapters[name]());
    } catch {
      reduced[name] = {};
    }
  }

  return buildSanitizedSources(reduced, observedAt);
}
