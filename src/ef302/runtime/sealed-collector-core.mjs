import { buildSanitizedSources } from "./sanitized-attestation-core.mjs";

const ADAPTER_SOURCES = Object.freeze([
  "sts",
  "ecs_command",
  "target_instance"
]);

const FIXED_UNAVAILABLE_SOURCES = Object.freeze([
  "model_studio",
  "billing"
]);

const ALLOWED_RECORD_KEYS = Object.freeze([
  "coverage",
  "outcome",
  "aggregate_count",
  "lifecycle_status"
]);

function assertObservedAt(observedAt) {
  if (typeof observedAt !== "string" || !Number.isFinite(Date.parse(observedAt))) {
    throw new Error("EF-302 fail-closed: observed_at is required");
  }
  return observedAt;
}

function assertAdapterSet(adapters) {
  if (!adapters || typeof adapters !== "object") {
    throw new Error("EF-302 fail-closed: adapters are required");
  }
  const keys = Object.keys(adapters).sort();
  const expected = [...ADAPTER_SOURCES].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    throw new Error("EF-302 fail-closed: adapter set mismatch");
  }
  for (const name of ADAPTER_SOURCES) {
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

function permanentlyUnavailableRecord() {
  return Object.freeze({
    coverage: "unavailable",
    outcome: "unknown",
    aggregate_count: 0,
    lifecycle_status: "unknown"
  });
}

/**
 * The private artifact supplies only the three permitted fixed source adapters.
 * Model Studio and billing are permanently unavailable: this core never invokes
 * an adapter for either source. It accepts no selector, request, command,
 * identity, network, credential, account, instance, or retry configuration.
 */
export async function collectSealedProviderEvidence(adapters, { observedAt } = {}) {
  const timestamp = assertObservedAt(observedAt);
  assertAdapterSet(adapters);
  const reduced = Object.fromEntries(
    FIXED_UNAVAILABLE_SOURCES.map((name) => [name, permanentlyUnavailableRecord()])
  );

  for (const name of ADAPTER_SOURCES) {
    try {
      reduced[name] = reducedRecord(await adapters[name]());
    } catch {
      reduced[name] = {};
    }
  }

  return buildSanitizedSources(reduced, timestamp);
}
