# EF-302 Provider-Side Redaction Mechanism v1

## Purpose

Perform one historical, read-only EF-302 audit without transmitting raw cloud records outside Alibaba Cloud. The mechanism is deliberately smaller than a general audit platform.

## Architecture

```
Provisioner → isolated Function Compute sanitizer → approved private Alibaba Cloud endpoints
                                                └→ sanitized attestation only
```

The sanitizer has no HTTP endpoint, no trigger, no retry, no asynchronous destination, and no caller input. A governed operator invokes it once only after every proof below is present.

## Fixed collectors

| Collector | Fixed filter | Raw data rule | Output |
|---|---|---|---|
| ActionTrail | Window + approved role/session + allowlisted OIDC/ECS events | Inspect only in process memory | present/absent/unknown, count, lifecycle, time, coverage |
| ECS Cloud Assistant | Sealed target + ActionTrail correlation only | Inspect only in process memory | present/absent/unknown, count, lifecycle, time, coverage |
| Model Studio audit | No approved narrow machine collector | Do not query | unavailable/unknown |
| Billing | No approved narrow machine collector | Do not query | unavailable/unknown |

The collectors must discard raw response objects before creating the attestation. The code must not call `console`, create files, attach diagnostics, or serialize an exception object. Any API/parse/validation error becomes only `coverage=unknown`, `outcome=unknown`.

## Required preflight proofs

1. Source SHA is independently reviewed and unchanged.
2. SLS logging is disabled for the function.
3. Function public Internet access is disabled.
4. The function has no VPC route to product/database resources.
5. Each enabled collector has an existing private provider-endpoint path. This authorization does not create VPCs, NAT gateways, PrivateLink endpoints, security groups, SLS projects/logstores, OSS buckets, or network rules.
6. Runtime policy equals the digest of `permission-difference-v1.md`; no attached system policies.
7. The function timeout is 15 minutes or less and concurrency is one.
8. The post-run disablement step is ready before invocation.

A failed proof prevents invocation and returns no record beyond a sanitized `unknown` status.

## Single-run procedure

1. Provision the isolated function and its runtime role.
2. Verify the preflight proofs without invoking collectors.
3. Invoke once through the governed operator path.
4. Read only the schema-valid sanitized response.
5. Disable/delete the function and runtime role immediately.
6. Seal the sanitized attestation with the source/policy/whitelist digests.

No retry is permitted for any failure. A failure is an audit result, not a reason to rerun.

## Fail-closed result rule

- Any missing proof, unavailable source, retention gap, or redaction error yields `unknown`.
- `no-evidence-found` requires every source to be complete and absent.
- `evidence-found` requires every source to be complete and at least one source present.
