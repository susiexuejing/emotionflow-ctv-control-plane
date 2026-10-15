# EF-302 Provider-Side Sanitized Audit — Contract v1.2

**Status:** implementation-authorized by CEO; still fail-closed. This contract authorizes only the EF-302 historical audit.

## Immutable scope

- Audit window: `2026-10-13T03:30:00Z` to `2026-10-13T04:45:00Z`.
- Region: `cn-wulanchabu`.
- Subject: the pre-existing EF-298 CTV invoker role, its temporary sessions, the approved DEV instance, and the old run correlation only.
- Runtime: one non-interactive provider-side sanitizer, maximum session/runtime **15 minutes**, one governed invocation, then immediate disablement.
- The sealed target selector and actual cloud identifiers are deployment-only and must not enter this repository, logs, or attestations.

## Provider-side boundary

A dedicated Function Compute sanitizer may read provider responses **only in transient Alibaba Cloud process memory**. It is the sole component permitted to see raw provider records. It must never persist, emit, log, cache, upload, or transmit them outside the Alibaba Cloud controlled boundary.

The Function Compute runtime must have:
- Simple Log Service logging disabled;
- no HTTP/public trigger, no event trigger, no retry, no Runner, and no caller-supplied input;
- public Internet disabled; private service access only after a deployment preflight proves the required existing private endpoint path;
- no VPC/product/database route except the approved private Alibaba Cloud service endpoint path;
- no access key, secret input, instance metadata, or user/product data.

If a private endpoint path or source-specific permission cannot be proven before deployment, that source is not queried and reports `coverage=unavailable`, `outcome=unknown`.

## Sources and output

The sanitizer may emit only the fields defined in `sanitized-attestation-v1.schema.json`:
- `present / absent / unknown`;
- aggregate count;
- lifecycle status;
- observed time;
- audit coverage status.

It may not emit command content, instance details, raw output, API key, request ID, Prompt, Response, raw event, bill line, workspace, model, or user/product data.

A source is enabled only when its adapter and redaction proof are listed in `provider-side-redaction-mechanism-v1.md`. Unsupported Model Studio audit-log or billing access remains `unknown`; it must not be replaced by console scraping, inference-log delivery, SLS, OSS, browser automation, or a broader read policy.

## Non-negotiable exclusions

No command execution, dispatch, retry, workflow run, OIDC issuance, BaiLian/model call, CTV execution, product access, database access, configuration mutation by the runtime, or use/alteration of `ef235_identity_write_probe_v1`.

EF-301 remains Blocked. EF-297 remains prohibited.

## Completion gate

A run is valid only when it binds:
- immutable source commit SHA;
- independent review record for that SHA;
- approved runtime-policy digest;
- output-whitelist digest;
- sealed-selector attestation;
- private-path and logging-disabled proof;
- single-run record;
- identity disablement confirmation.

Any missing proof means no query and an overall `unknown` conclusion.
