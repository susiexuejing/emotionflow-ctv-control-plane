# EF-302 Controlled Sanitized Audit Exporter — Contract v1.1

**Status:** review-required and fail-closed. No cloud identity, policy, query, or audit run is permitted until an independent approval is recorded for this exact commit.

## Immutable audit scope

- Audit window: `2026-10-13T03:30:00Z` to `2026-10-13T04:45:00Z`
- ECS region: `cn-wulanchabu`
- Subject: the pre-existing EF-298 CTV invoker role and its temporary sessions only.
- Target: the pre-approved DEV instance, represented here by the sealed deployment selector `EF302_TARGET_INSTANCE`.
- Run limit: one successful start. Any second start must fail closed.
- Lifetime: the audit identity must expire immediately after the run; no console login and no long-lived access key.

The sealed selector is intentionally **not** stored in this public repository. At deployment, the operator must attest that it resolves to exactly the CEO-approved DEV instance and role. Its digest is recorded only in the sanitized attestation.

## Evidence acquisition rule

This contract does **not** authorize direct provider APIs that can return raw events, command content, command output, prompts, responses, or billing line items.

A source can be queried only after a provider-side or separately approved redacting mechanism proves that the audit identity can receive *only* the schema-whitelisted fields. Until that proof exists for a source, the exporter must record `coverage=unavailable`, `outcome=unknown`, make no source query, and keep the overall conclusion `unknown`.

No caller-supplied filters, regions, resources, command IDs, time windows, or output formats are accepted.

## Network rule

Arbitrary internet egress is prohibited. A future approved redacting mechanism may use only the fixed Alibaba Cloud service endpoint(s) required for the fixed audit window and allowlist; it may not contact any other destination. This contract itself grants no endpoint access.

## Prohibited operations and data

No `RunCommand`, command creation/modification, dispatch, retry, Cloud Shell, terminal, file transfer, role assumption beyond the audit trust path, policy/configuration changes, token issuance, or workflow execution.

It must not read secrets, instance metadata, host credentials, product data, databases, user data, raw provider events, command content, command output, prompts, responses, inference logs, or billing line items.

EF-301 remains blocked. EF-297, CTV execution, BaiLian/model invocation, and `ef235_identity_write_probe_v1` remain prohibited.

## Data handling

Only the schema-defined sanitized attestation may enter CTO Platform, GitHub, Jira, Confluence, or the audit report. No raw provider record may be logged, persisted, exported, or attached.

A deployment is invalid unless it records:
- immutable source commit SHA;
- reviewer identity and approval;
- approved policy-diff digest;
- output-whitelist digest;
- sealed-selector attestation;
- provider-side redaction proof for every queried source;
- identity disablement confirmation after the single run.
