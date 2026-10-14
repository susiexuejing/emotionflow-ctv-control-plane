# EF-302 Controlled Sanitized Audit Exporter — Contract v1

**Status:** review-required; not deployable until an independent approval is recorded.

## Immutable audit scope

- Audit window: `2026-10-13T03:30:00Z` to `2026-10-13T04:45:00Z`
- ECS region: `cn-wulanchabu`
- Subject: the pre-existing EF-298 CTV invoker role and its temporary sessions only.
- Target: the pre-approved DEV instance, represented here by the sealed deployment selector `EF302_TARGET_INSTANCE`.
- Run limit: one successful start. Any second start must fail closed.
- Lifetime: the audit identity must expire immediately after the run; no console login and no long-lived access key.

The sealed selector is intentionally **not** stored in this public repository. At deployment, the operator must attest that it resolves to exactly the CEO-approved DEV instance and role. Its digest is recorded only in the sanitized attestation.

## Fixed read-only queries

1. ActionTrail: fixed time-window lookup for OIDC role assumption and Cloud Assistant/ECS control-plane events related to the approved role/session.
2. ECS Cloud Assistant: invocation and invocation-result metadata correlated to the sealed target only.
3. Model Studio: native audit metadata for the same time window only; no inference log access.
4. Billing: Model Studio charge-presence summary for the same window only.

The implementation must reject caller-supplied filters, regions, resources, command IDs, time windows, or output formats.

## Prohibited operations

No `RunCommand`, command creation/modification, dispatch, retry, Cloud Shell, terminal, file transfer, role assumption beyond this audit identity, policy/configuration changes, token issuance, or outbound network access.

It must not read secrets, instance metadata, host credentials, product data, databases, user data, prompts, responses, raw command content, raw command output, inference logs, or billing line items.

EF-301 remains blocked. EF-297, CTV execution, BaiLian/model invocation, and `ef235_identity_write_probe_v1` remain prohibited.

## Data handling

Raw provider records may be processed only in volatile memory inside the audit exporter to derive the output whitelist. They must not be written to logs, artifacts, GitHub, CTO Platform, Jira, Confluence, or the audit report. The process must emit exactly one sanitized attestation and then terminate.

A deployment is invalid unless it records:
- immutable source commit SHA;
- reviewer identity and approval;
- approved policy-diff digest;
- output-whitelist digest;
- sealed-selector attestation;
- identity disablement confirmation after the single run.
