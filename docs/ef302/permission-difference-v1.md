# EF-302 Provider-Side Sanitizer — Permission Difference v1.2

## Identities

| Identity | Lifetime | Purpose |
|---|---:|---|
| `EmotionFlowEF302SanitizerRuntime` | One Function Compute execution, ≤15 minutes | Read raw control-plane responses only in provider-side memory; emit only the sanitized schema. |
| `EmotionFlowEF302Provisioner` | Existing administrator session; removed from the path after setup | Create the one function, attach the runtime role, configure no-log/private-only settings, then disable the runtime identity after the run. |
| CTO Platform | No new cloud read permissions | Receives only the sanitized attestation. |

No RAM user, console login, long-lived AccessKey, OIDC token issuance, or public function trigger is granted to the runtime identity.

## Runtime allowlist

The runtime policy contains only these source actions, each bounded in code to the fixed scope:

| Service | Allow | Rationale |
|---|---|---|
| ActionTrail | `actiontrail:LookupEvents` | Correlate OIDC role assumption and ECS control-plane event metadata. |
| ECS Cloud Assistant | `ecs:DescribeInvocations`, `ecs:DescribeInvocationResults` | Determine whether a correlated invocation exists and its lifecycle only. Raw fields remain transient inside the sanitizer. |

`actiontrail:LookupEvents` cannot be resource-scoped by RAM, so the fixed time, role/session, and event allowlist are enforced in the immutable sanitizer code. No direct CTO Platform access is permitted.

## Explicitly not granted

- Any ECS write, command, terminal, upload, file transfer, reboot, deployment, retry, or `RunCommand`.
- `ecs:DescribeCommands` (unnecessary and may expose command content).
- Model Studio/BaiLian audit, inference, workspace, API key, data, SLS, or inference-log permission.
- BSS/Model Studio billing read, download, or export permission.
- RAM/IAM/STS mutation, key management, secret access, instance metadata, databases, VPC resources, NAT, PrivateLink creation, OSS, SLS, outbound public Internet, or product APIs.
- `fc:InvokeFunction` for CTO Platform, any HTTP trigger, timer/event trigger, retry, or async destination.

Model Studio audit logs and precise bill records have no currently approved narrow machine interface in this contract. They are deliberately reported as `unavailable/unknown`, not accessed through a broad console or system read policy.

## Provisioning and rollback

The Provisioner may perform the one approved setup and teardown only:
1. create the isolated Function Compute function and runtime role;
2. attach this exact runtime policy;
3. set logging disabled, no public Internet, no trigger, and runtime timeout ≤15 minutes;
4. verify the private provider-endpoint path without invoking the audit;
5. perform one governed invocation;
6. immediately disable/delete the runtime role/function and revoke the attachment.

If any step would require creating VPC, NAT, PrivateLink, logging, object storage, or a broader policy, stop before that step. Report `unknown`.

The post-run record retains only source SHA, policy digest, whitelist digest, coverage/outcome/count/status/time fields, and disablement confirmation.
