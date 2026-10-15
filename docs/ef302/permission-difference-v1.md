# EF-302 Provider-Side Sanitizer — Permission Difference v1.3

## Current decision: non-executable fail-closed baseline

The reviewed public source contains no sealed runtime manifest, complete-collection adapter, or control-plane teardown adapter. Therefore no Function Compute service, runtime role, provisioner, trigger, or invocation may be created from this revision. It can produce only a schema-valid `unknown` attestation in an offline test; it cannot perform an EF-302 audit.

A future executable package requires a new immutable source/artifact digest and a fresh independent review before any cloud identity or resource is considered.

## Required future identities

| Identity | Lifetime | Purpose |
|---|---:|---|
| `EmotionFlowEF302SanitizerRuntime` | One Function Compute execution, ≤15 minutes | May exist only after a reviewed package embeds sealed manifest, collection, and teardown adapters. |
| `EmotionFlowEF302Provisioner` | Existing administrator session; removed from the path after setup | May exist only after the same gate; it performs the one setup/teardown sequence. |
| CTO Platform | No new cloud read permissions | Receives only the sanitized attestation. |

No RAM user, console login, long-lived AccessKey, OIDC token issuance, or public function trigger is granted to the runtime identity.

## Proposed runtime allowlist — not yet grantable

If and only if the future package passes review, its runtime policy may contain only these source actions, each bounded in the package to the fixed scope:

| Service | Allow | Rationale |
|---|---|---|
| ActionTrail | `actiontrail:LookupEvents` | Correlate OIDC role assumption and ECS control-plane event metadata. |
| ECS Cloud Assistant | `ecs:DescribeInvocations`, `ecs:DescribeInvocationResults` | Determine whether a correlated invocation exists and its lifecycle only. Raw fields remain transient inside the sanitizer. |

`actiontrail:LookupEvents` cannot be resource-scoped by RAM. A future immutable package must bind fixed time, role/session, target instance, old-run selector, and event allowlist before any query. The public baseline provides none of those executable adapters.

## Explicitly never granted

- Any ECS write, command, terminal, upload, file transfer, reboot, deployment, retry, or `RunCommand`.
- `ecs:DescribeCommands` (unnecessary and may expose command content).
- Model Studio/BaiLian audit, inference, workspace, API key, data, SLS, or inference-log permission.
- BSS/Model Studio billing read, download, or export permission.
- RAM/IAM/STS mutation, key management, secret access, instance metadata, databases, VPC resources, NAT, PrivateLink creation, OSS, SLS, outbound public Internet, or product APIs.
- `fc:InvokeFunction` for CTO Platform, any HTTP trigger, timer/event trigger, retry, or async destination.

Model Studio audit logs and precise bill records have no currently approved narrow machine interface in this contract. They are permanently reported as `unavailable/unknown`, not accessed through a broad console or system read policy.

## Future provisioning and rollback gate

Only a separately reviewed executable package may allow the Provisioner to:
1. create the isolated Function Compute function and runtime role;
2. attach the exact reviewed runtime policy;
3. set logging disabled, no public Internet, no trigger, and runtime timeout ≤15 minutes;
4. verify the private provider-endpoint path without invoking the audit;
5. perform one governed invocation;
6. immediately disable/delete the runtime role/function and independently verify both control-plane states.

If any step would require creating VPC, NAT, PrivateLink, logging, object storage, or a broader policy, stop before that step. Report `unknown`.
