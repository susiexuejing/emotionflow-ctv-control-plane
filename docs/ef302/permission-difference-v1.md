# EF-302 Audit Exporter — Permission Difference v1.1

**Purpose:** establish only a future-safe boundary for historical evidence. It never operates the DEV instance.

## Identity and trust

Proposed separate non-interactive identity: `EmotionFlowEF302AuditReader`.

- Trust: only the approved Central CTO Platform workload identity; no console sign-in, RAM user, main-account principal, interactive federation, or access key.
- Session: one use, time-bound to the audit run, then explicitly disabled/deleted.
- Scope binding: deployment must bind the exact sealed approved role and target instance. This public file contains no cloud account, instance, network, secret, or product identifier.

## Current direct cloud permission delta: none

No direct ActionTrail, ECS Cloud Assistant, Model Studio, BSS, SLS, or other provider read permission may be attached to `EmotionFlowEF302AuditReader` in this version.

The previously considered ECS APIs are explicitly rejected: their responses can contain command content or command output, which this audit identity is forbidden to read. Direct ActionTrail and billing reads are also rejected because their returned records are broader than the approved output whitelist.

## Future source enablement gate

A source may be enabled only by a separately reviewed provider-side redacting mechanism that proves all of the following before any identity/policy attachment:

1. It accepts only the fixed time window, region, sealed target, and role/session correlation.
2. It exposes only the fields defined in `sanitized-attestation-v1.schema.json`.
3. It never returns raw event bodies, request parameters, command content/output, prompts/responses, API-key/workspace data, or billing line items to the audit identity.
4. It permits only fixed Alibaba Cloud service endpoints and rejects all arbitrary internet egress.
5. It can be disabled immediately after one run.

Without that proof, the source remains `unavailable`, no query is made, and the audit conclusion remains `unknown`.

## Explicit denies

- All execution and mutation APIs: commands, command lifecycle mutation, terminal, file transfer, reboot, deploy, retry, Cloud Shell, workflow dispatch, and configuration changes.
- All STS role assumption except the preconfigured audit trust path.
- IAM/RAM/OIDC policy, role, provider, access-key, console-login, or trust mutations.
- Secret managers, KMS decrypt, ECS instance metadata, host credentials, databases, volumes, product APIs, user data, and arbitrary internet access.
- BaiLian/Model Studio inference, API-key, data-space, workspace, file, batch, log-delivery, inference-log, prompt, and response access.
- Billing detail/download/export, invoice, subscription, payment, and all global billing views.
- Logging, artifact persistence, or export of any provider record.

## Rollback

1. Terminate the exporter after its first attestation.
2. Disable/delete `EmotionFlowEF302AuditReader` and remove its trust relationship.
3. Revoke only the separately approved redacting-mechanism policy attachment, if one exists.
4. Preserve only the sanitized attestation, source SHA, policy-diff digest, review record, and disablement result.
5. If any source cannot be bounded to this contract, abort before querying and report `unknown`.
