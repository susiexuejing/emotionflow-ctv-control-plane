# EF-302 Provider-Side Redaction Mechanism v1.2

## Current status

This is a reviewed, **non-executable fail-closed baseline**, not an audit runner. It is safe precisely because it has no Function Compute handler, no cloud identity, no collector, and no invocation path. No cloud resource may be created or invoked from this revision.

It produces only `unknown` until a new immutable package implements and independently proves all adapters below.

## Required future architecture

```
Provisioner → isolated Function Compute sanitizer → approved private Alibaba Cloud endpoints
                                                └→ sanitized attestation only
```

The future sanitizer must have no HTTP endpoint, no trigger, no retry, no asynchronous destination, and no caller input. A governed operator may invoke it once only after every proof below is present.

## Required executable adapters

| Adapter | Required binding | Failure behavior |
|---|---|---|
| Sealed runtime manifest | Fixed window/region; exact role, instance, old-run selector; event-allowlist digest; deployment artifact digest | No deployment/query; unknown |
| Complete collector | Fixed private endpoint and request parameters; all pages consumed to explicit termination; parse and filter checks | No result from that source; unknown |
| Control-plane teardown finalizer | After function and runtime identity are disabled/deleted, independently verify both states before allowing any disablement claim | No disablement claim; unknown |

The adapters must discard raw response objects before producing minimal normalized fields. Code may not call `console`, create files, attach diagnostics, or serialize an exception object. Any API/parse/validation error is only `coverage=unknown`, `outcome=unknown`.

## Fixed source policy

| Source | Status in this authorization |
|---|---|
| ActionTrail | May be enabled only by a later reviewed sealed collector |
| ECS Cloud Assistant | May be enabled only by a later reviewed sealed collector |
| Model Studio audit | Permanently unavailable/unknown; do not query |
| Billing | Permanently unavailable/unknown; do not query |

## Required future preflight proofs

1. Source and artifact SHA are independently reviewed and unchanged.
2. SLS logging is disabled for the function.
3. Function public Internet access is disabled.
4. The function has no VPC route to product/database resources.
5. Each enabled collector has an existing private provider-endpoint path. This authorization does not create VPCs, NAT gateways, PrivateLink endpoints, security groups, SLS projects/logstores, OSS buckets, or network rules.
6. Runtime policy equals the reviewed digest; no attached system policies.
7. The function timeout is 15 minutes or less and concurrency is one.
8. The sealed scope manifest and event-allowlist digest are bound to the deployed package.
9. The post-run control-plane disablement/deletion check is ready before invocation.

A failed proof prevents deployment or invocation and leaves the audit `unknown`.

## Future single-run procedure

1. Provision the isolated function and runtime role.
2. Verify every preflight proof without invoking collectors.
3. Invoke once through the governed operator path.
4. Read only the schema-valid sanitized response.
5. Disable/delete the function and runtime role immediately.
6. Independently verify disablement/deletion in the provider control plane.
7. Seal only the permitted aggregate evidence.

No retry is permitted for any failure. A failure is an audit result, not a reason to rerun.
