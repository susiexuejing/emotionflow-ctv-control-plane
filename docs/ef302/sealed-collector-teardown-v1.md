# EF-302 Sealed Collector and Teardown Cores v1

## Scope

This source increment completes the two **public, non-provider-specific cores** required
by the runtime gate merged in PR #6:

- `sealed-collector-core.mjs` accepts exactly three fixed, private-artifact adapters
  (`sts`, `ecs_command`, `target_instance`), validates the timestamp before any
  adapter is called, and immediately reduces every adapter result to the existing output
  whitelist.
- `model_studio` and `billing` are permanently constructed as
  `unavailable/unknown`; no adapter can read or override either source.
- `teardown-core.mjs` requires an immutable execution-record digest proving exactly
  one run, then requires separate successful teardown proofs for both the temporary
  function and its runtime identity.

## Deliberate exclusions

These cores contain **no** cloud SDK/API client, resource selector, account/role/instance
identifier, command, endpoint, trigger, HTTP handler, retry, OIDC logic, secret access,
provider query, product/database access, raw record storage, logging, cache, or network
configuration.

They cannot provision or invoke a cloud resource. They do not make EF-302 audit-complete.

## Private executable artifact requirement

A future, separately reviewed private artifact must bind:

1. the already approved time window, region, existing role, DEV instance, and old-run
   correlation;
2. a minimal provider-side reader and reducer only for the three permitted sources;
3. a one-shot runtime policy: maximum 15 minutes, one invocation, zero retries/triggers,
   no public Internet and no raw logging/output;
4. immutable execution-record proof, then immediate verified teardown of both temporary
   function and runtime identity.

The private artifact must provide immutable digests to
`assertSealedDeploymentEnvelope` before any provisioning is reconsidered. It must not
put private selectors or provider-native records in this public repository.

## Review criteria

An independent reviewer must verify that:

- only the three permitted adapter names are accepted;
- Model Studio and billing are never read and remain `unavailable/unknown`;
- only the pre-existing whitelisted fields can leave the adapter boundary;
- invalid timestamps stop before any provider reader; any reader failure becomes
  `unknown`;
- an immutable one-run proof and two teardown proofs are required;
- no new cloud capability is embedded in this public source.

Until the private artifact, its immutable digest, and its independent review exist, the
provider-side audit remains unexecutable and EF-302 remains `unknown`.
