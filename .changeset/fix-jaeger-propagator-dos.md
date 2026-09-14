---
"@inato/custom-instrumentations-node": patch
---

Bump `@opentelemetry/sdk-node` to 0.220.0, `@opentelemetry/auto-instrumentations-node` to 0.78.0 and `@opentelemetry/sdk-trace-node` to 2.9.0 so the bundled `@opentelemetry/propagator-jaeger` is 2.9.0 (GHSA-45rx-2jwx-cxfr, DoS on a malformed Jaeger header). Also refresh the lockfile so `brace-expansion` resolves to 2.1.4 (GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895) [SECURITY]
