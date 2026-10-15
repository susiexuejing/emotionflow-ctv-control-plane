# EF-302 Sealed Runtime Core v1

## Purpose

This source is the first **reviewable runtime-core component** after the non-executable
baseline merged as `256fc1e…`. It is not a collector, Function Compute handler,
provisioner, policy, trigger, or cloud deployment.

It has two narrow responsibilities:

1. fail closed unless an external sealed deployment envelope proves every mandatory
   control; and
2. reduce already-sanitized source outcomes to the exact public attestation whitelist.

## Deliberate exclusions

This PR contains no:

- Alibaba Cloud account, role, instance, network, endpoint, old-run, or event selector;
- credentials, secrets, metadata access, SDK, API client, Function Compute handler,
  deployment template, trigger, invocation, retry, or command execution;
- provider record, request identifier, command, raw output, product/user/database data,
  prompt/response, Model Studio/BaiLian, or billing access.

The files cannot create or invoke a cloud resource.

## Deployment gate

A later, separately reviewed package may only call
`assertSealedDeploymentEnvelope` with an envelope whose source commit, artifact,
scope-manifest, independent-review, runtime-policy, output-whitelist, private-path,
and logging-disabled proofs are all immutable SHA-256 digests.

The gate rejects any deviation from:

- one invocation;
- maximum 15-minute runtime;
- zero retries and triggers;
- disabled public Internet, HTTP/event triggers, async mode, logs, raw output,
  product/database/secret access.

A later private deployment artifact must bind actual selectors without placing them
in this public repository. Passing this gate is necessary but not sufficient for
provisioning.

## Review requirement

Merge requires an independent review. After merge, the next source increment must
supply the sealed collector and teardown adapters together with their immutable
artifact digest. No cloud resource may be created from this PR alone.
