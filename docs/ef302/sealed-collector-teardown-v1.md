# EF-302 Sealed Collector and Teardown Cores v1

## Scope

This source increment completes the two **public, non-provider-specific cores** required
by the runtime gate merged in PR #6:

- `sealed-collector-core.mjs` accepts exactly five fixed, private-artifact adapters
  (`sts`, `ecs_command`, `target_instance`, `model_studio`, `billing`), reduces
  each result immediately to the existing output whitelist, and converts a failed adapter
  to `unknown`.
- `teardown-core.mjs` requires exactly one invocation and requires the private artifact
  to prove identity disablement; any missing/failed/unknown proof fails closed.

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
2. a minimal provider-side reader and reducer for each of the five fixed sources;
3. a one-shot runtime policy: maximum 15 minutes, one invocation, zero retries/triggers,
   no public Internet and no raw logging/output;
4. immediate identity disablement through the teardown callback.

The private artifact must provide immutable digests to
`assertSealedDeploymentEnvelope` before any provisioning is reconsidered. It must not
put private selectors or provider-native records in this public repository.

## Review criteria

An independent reviewer must verify that:

- only the five fixed adapter names are accepted;
- only the pre-existing whitelisted fields can leave the adapter boundary;
- any missing adapter, adapter failure, non-single invocation, or teardown proof failure
  stops execution;
- no new cloud capability is embedded in this public source.

Until the private artifact, its immutable digest, and its independent review exist, the
provider-side audit remains unexecutable and EF-302 remains `unknown`.
