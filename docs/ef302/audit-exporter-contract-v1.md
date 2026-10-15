# EF-302 Provider-Side Sanitized Audit — Contract v1.4

**Status:** CEO authorized the provider-side audit design. The current public source is an independently reviewed **non-executable fail-closed baseline**. It authorizes neither cloud resource creation nor audit invocation.

## Immutable scope

- Audit window: `2026-10-13T03:30:00Z` to `2026-10-13T04:45:00Z`.
- Region: `cn-wulanchabu`.
- Subject: the pre-existing EF-298 CTV invoker role, its temporary sessions, the approved DEV instance, and the old run correlation only.
- A future runtime: one non-interactive provider-side sanitizer, maximum session/runtime **15 minutes**, one governed invocation, then immediate disablement.
- The sealed target selector and actual cloud identifiers are deployment-only and must not enter this repository, logs, or attestations.

## Current fail-closed baseline

This revision contains neither:
1. a sealed runtime manifest adapter that binds the role, instance, old run, region, window, and event-allowlist digests to the deployed package;
2. a complete-collection adapter that proves fixed provider filters, parse success, response continuity, and exhausted pagination; nor
3. a control-plane teardown adapter that verifies function and runtime-identity disablement/deletion.

Therefore it has no collector, no deployable function handler, and no permitted runtime role. It can only produce `unknown`; it cannot emit `present`, `absent`, `complete`, or `identity_disabled=true`.

A later executable implementation requires a new immutable source/artifact digest and a fresh independent review. It must pass all completion gates below before any cloud resource is created.

## Future provider-side boundary

A future dedicated Function Compute sanitizer may read provider responses **only in transient Alibaba Cloud process memory**. It is the sole component permitted to see raw provider records. It must never persist, emit, log, cache, upload, or transmit them outside the Alibaba Cloud controlled boundary.

The future runtime must have:
- Simple Log Service logging disabled;
- no HTTP/public trigger, no event trigger, no retry, no Runner, and no caller-supplied input;
- public Internet disabled; private service access only after a deployment preflight proves the required existing private endpoint path;
- no VPC/product/database route except the approved private Alibaba Cloud service endpoint path;
- no access key, secret input, instance metadata, or user/product data.

If a private endpoint path or source-specific permission cannot be proven before deployment, that source is not queried and reports `coverage=unavailable`, `outcome=unknown`.

## Sources and output

Only the fixed fields in `sanitized-attestation-v1.schema.json` may leave the provider boundary:
- `present / absent / unknown`;
- aggregate count;
- lifecycle status;
- observed time;
- audit coverage status.

The output may not contain command content, instance details, raw output, API key, request ID, Prompt, Response, raw event, bill line, workspace, model, user/product data, or an unsupported claim of disablement.

Model Studio audit-log and billing access remain permanently `unavailable/unknown` under this authorization. They must not be replaced by console scraping, inference-log delivery, SLS, OSS, browser automation, or a broader read policy.

## Non-negotiable exclusions

No command execution, dispatch, retry, workflow run, OIDC issuance, BaiLian/model call, CTV execution, product access, database access, configuration mutation by the runtime, or use/alteration of `ef235_identity_write_probe_v1`.

EF-301 remains Blocked. EF-297 remains prohibited.

## Future completion gate

A later executable run is valid only when it binds:
- immutable source and artifact digests;
- independent review record for those digests;
- sealed-selector and event-allowlist adapter;
- complete-collection adapter for every enabled source;
- approved runtime-policy and output-whitelist digests;
- private-path and logging-disabled proof;
- single-run record;
- control-plane-confirmed function and identity disablement.

Any missing proof means no deployment, no query, and an overall `unknown` conclusion.
