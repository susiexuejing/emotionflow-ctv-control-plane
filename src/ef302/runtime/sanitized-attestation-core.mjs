export const EF302_ALLOWED_OUTCOMES = Object.freeze(["present", "absent", "unknown"]);
export const EF302_ALLOWED_COVERAGE = Object.freeze([
  "complete",
  "unavailable",
  "retention-gap",
  "unknown"
]);
export const EF302_ALLOWED_LIFECYCLE = Object.freeze([
  "succeeded",
  "failed",
  "not-applicable",
  "unknown"
]);

const REQUIRED_SOURCES = Object.freeze([
  "sts",
  "ecs_command",
  "target_instance",
  "model_studio",
  "billing"
]);

function safeValue(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function normalizedSource(record, observedAt) {
  const source = record && typeof record === "object" ? record : {};
  return Object.freeze({
    coverage: safeValue(source.coverage, EF302_ALLOWED_COVERAGE, "unknown"),
    outcome: safeValue(source.outcome, EF302_ALLOWED_OUTCOMES, "unknown"),
    aggregate_count: nonNegativeInteger(source.aggregate_count),
    lifecycle_status: safeValue(source.lifecycle_status, EF302_ALLOWED_LIFECYCLE, "unknown"),
    observed_at: typeof observedAt === "string" ? observedAt : null
  });
}

/**
 * Emits the only data that may leave the provider boundary. It never copies
 * raw records, selectors, request identifiers, command data, or diagnostics.
 */
export function buildSanitizedSources(records, observedAt) {
  const input = records && typeof records === "object" ? records : {};
  return Object.freeze(Object.fromEntries(
    REQUIRED_SOURCES.map((name) => [name, normalizedSource(input[name], observedAt)])
  ));
}

export function concludeSanitizedSources(sources) {
  const values = Object.values(sources || {});
  if (values.length !== REQUIRED_SOURCES.length) return "unknown";
  if (values.some((source) => source.coverage !== "complete")) return "unknown";
  if (values.some((source) => source.outcome === "present")) return "evidence-found";
  if (values.every((source) => source.outcome === "absent")) return "no-evidence-found";
  return "unknown";
}
