# @inato/custom-instrumentations-node

## 0.5.2

### Patch Changes

- be2bcdb: Bump `@opentelemetry/sdk-node` to 0.220.0, `@opentelemetry/auto-instrumentations-node` to 0.78.0 and `@opentelemetry/sdk-trace-node` to 2.9.0 so the bundled `@opentelemetry/propagator-jaeger` is 2.9.0 (GHSA-45rx-2jwx-cxfr, DoS on a malformed Jaeger header). Also refresh the lockfile so `brace-expansion` resolves to 2.1.4 (GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895) [SECURITY]
- dda74e1: Update pnpm to v11.11.0 [SECURITY]

## 0.5.1

### Patch Changes

- 9f1f97b: Update pnpm to v11 [SECURITY]

## 0.5.0

### Minor Changes

- c550c3f: Disable @opentelemetry/instrumentation-runtime-node

### Patch Changes

- d357b29: Update pnpm to v10 [SECURITY]

## 0.4.0

### Minor Changes

- f989f3d: Bump opentelemetry dependencies

## 0.3.0

### Minor Changes

- 5cf43d2: Ignore undici calls to /v1/(metrics|traces|logs)

## 0.2.0

### Minor Changes

- aff509a: Use OIDC for publishing

## 0.1.2

### Patch Changes

- ed7b0e0: fix pnpm install using --shamefully-hoist option

## 0.1.1

### Patch Changes

- 4fa622a: add changesets
