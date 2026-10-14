# EF-302 Audit Exporter — Permission Difference v1

**Purpose:** read historical evidence for one incident; never operate the DEV instance.

## Identity and trust

Create a separate non-interactive identity: `EmotionFlowEF302AuditReader`.

- Trust: only the approved Central CTO Platform workload identity; no console sign-in, no RAM user, no main-account principal, no interactive federation, no access key.
- Session: one use, time-bound to the audit run, then explicitly disabled/deleted.
- Scope binding: deployment must bind the exact, sealed approved role and target instance. This public file holds no cloud account, instance, network, secret, or product identifier.

## Allowlist — pending cloud-policy syntax validation

| Source | Read capability | Scope |
|---|---|---|
| ActionTrail | `actiontrail:LookupEvents` | Fixed time window; exporter-side allowlist of relevant OIDC/ECS events only. No event export. |
| ECS | `ecs:DescribeInvocations`, `ecs:DescribeInvocationResults`, `ecs:DescribeCommands` | The sealed target instance and pre-existing command correlation only. |
| Model Studio | Product-native audit-metadata read capability only | Fixed window; audit metadata only. No workspaces, API keys, requests, datasets, inference logs, SLS, prompts, or responses. |
| Billing | Narrow Model Studio charge-presence query only | Fixed window and product category. Return only `zero/nonzero/unavailable/unknown`. |

## Explicit denies

- All write and execution APIs, including `ecs:RunCommand`, command lifecycle mutation, terminal, file transfer, reboot, deploy, and retry.
- All STS role assumption except the one preconfigured audit trust path.
- IAM/RAM/OIDC policy, role, provider, access-key, console-login, or configuration mutations.
- Secret managers, KMS decrypt, ECS instance metadata, host credentials, databases, volumes, product APIs, user data, networking, and public internet.
- BaiLian/Model Studio inference, API-key, data-space, workspace, file, batch, log-delivery, and inference-log access.
- Billing download, export, invoice, subscription, payment, and all non-Model-Studio billing views.
- Any logging or artifact persistence of provider records.

## Important restriction

A direct ActionTrail lookup and broad billing read policy cannot be resource-scoped tightly enough for this incident. They must therefore be exposed only through the fixed exporter, which filters in memory and emits the schema-defined attestation. Direct platform access to ActionTrail, BSS, or Model Studio must remain absent.

## Rollback

1. Terminate the exporter after its first attestation.
2. Disable/delete `EmotionFlowEF302AuditReader` and remove its trust relationship.
3. Revoke the policy attachment.
4. Preserve only the sanitized attestation, source SHA, policy-diff digest, review record, and disablement result.
5. If any source cannot be bounded to this contract, abort before querying and report `unknown`.
