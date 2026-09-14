# @inato/custom-instrumentations-node

Inato's OpenTelemetry auto-instrumentation for Node.js services. It wraps the upstream [`@opentelemetry/auto-instrumentations-node`](https://github.com/open-telemetry/opentelemetry-js-contrib/tree/main/metapackages/auto-instrumentations-node) `register` entrypoint with Inato-specific configuration, so every Node.js service gets the same tracing setup without carrying that code itself.

## What it does

Loading `@inato/custom-instrumentations-node/register` before the application starts an OpenTelemetry `NodeSDK` with:

- **All Node auto-instrumentations** from the upstream metapackage, plus the standard resource detectors.
- **A custom root sampler** (`CustomSampler`) that drops traces nobody looks at: `pg-pool.connect` and `pg.query*` root spans (diagnostic DB calls), bare `GET` root spans (ConfigCat, CDN calls), `GET /` (health-check style hits on the root route) and `grpc.google*` root spans (GCP Pub/Sub connection setup). Child spans follow their parent's decision.
- **Trimmed GraphQL spans**: resolver spans are merged, trivial resolvers are skipped and depth is capped at 3.
- **No self-telemetry**: outgoing `undici` requests to `/v1/traces`, `/v1/metrics` and `/v1/logs` (the SDK talking to the collector) are not instrumented.
- **`@opentelemetry/instrumentation-runtime-node` disabled.**
- **Graceful shutdown** on `SIGTERM` and `beforeExit`, so buffered spans are flushed.

Exporter endpoint, protocol, service name and the like are not set here. They come from the standard `OTEL_*` environment variables. `OTEL_LOG_LEVEL` controls the SDK's own diagnostic logging (default `INFO`).

The package also exports `CustomSampler` from its main entrypoint for services that build their own SDK but want the same sampling rules.

Source: [src/register.ts](src/register.ts), [src/CustomSampler.ts](src/CustomSampler.ts).

## Who consumes it

There are two distribution channels, aimed at two different consumers.

### 1. Kubernetes workloads, via the OpenTelemetry Operator (Docker image)

This is the production path. The [Dockerfile](Dockerfile) builds the package with all its dependencies hoisted into a single directory and copies it into a `busybox` image at `/autoinstrumentation`, with `register.js` linked as `autoinstrumentation.js`. This is the layout the [OpenTelemetry Operator](https://github.com/open-telemetry/opentelemetry-operator) expects for a Node.js auto-instrumentation image.

The image is published as `ghcr.io/inato/custom-instrumentations-nodejs:<version>` and referenced from the `Instrumentation` custom resource in the `inato/infrastructure` repo (`opentelemetry/autoinstrumentation/templates/instrumentation.yaml`). The operator injects it as an init container into annotated pods and sets `NODE_OPTIONS` so Node loads it at startup. Services need no code change and no dependency on this package.

Renovate in the infrastructure repo watches the image tag and opens a PR when a new version is published here.

### 2. Local development, via npm

The package is published publicly to npm as `@inato/custom-instrumentations-node`. Services add it as a devDependency to reproduce production tracing locally against a local collector. The marketplace does this by setting in `packages/server/.env`:

```shell
NODE_OPTIONS="--require=@inato/custom-instrumentations-node/register"
OTEL_SERVICE_NAME=otel-auto-node
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
```

The same `NODE_OPTIONS` works for any Node.js process, including one running outside Kubernetes.

## How it is published

Releases are driven by [Changesets](https://github.com/changesets/changesets) and run from [.github/workflows/release.yml](.github/workflows/release.yml) on every push to `main`:

1. **Build** compiles TypeScript to `build/`.
2. **Release** runs `changesets/action`. If pending changesets exist under `.changeset/`, it opens or updates a "Version Packages" PR that bumps `package.json` and `CHANGELOG.md`. When that PR is merged, the same job publishes the new version to npm using OIDC trusted publishing, so no npm token is stored in the repo.
3. **Publish** runs only when the merged commit message contains "Version Packages", meaning a release just happened. It builds the Docker image for `linux/amd64` and `linux/arm64` and pushes it to GHCR tagged with the new version.

So the npm package and the Docker image always carry the same version number and ship together.

Every pull request also gets a **snapshot** build published with [pkg-pr-new](https://github.com/stackblitz-labs/pkg.pr.new) ([.github/workflows/snapshot.yml](.github/workflows/snapshot.yml)), which lets a consumer try a branch before it is released.

### Dependency updates

Renovate is configured for security fixes only; routine version bumps are disabled ([renovate.json](renovate.json)). Renovate security PRs get a patch changeset added automatically by [.github/workflows/renovate-changeset.yml](.github/workflows/renovate-changeset.yml), so merging one produces a release.

## Development

Requirements: the Node.js version in [.node-version](.node-version) and pnpm (the version is pinned in `package.json` `packageManager`; `corepack enable` picks it up).

```shell
pnpm install
pnpm build          # tsc -p . -> build/
```

There is no test suite. To try a change end to end, point a local service at your build:

```shell
NODE_OPTIONS="--require=/path/to/custom-instrumentations-node/build/register.js" node your-app.js
```

### Making a change

1. Edit `src/`, run `pnpm build`.
2. Add a changeset describing the change: `pnpm changeset` (or write a file under `.changeset/`). Use `minor` for behaviour changes such as new sampling rules or OpenTelemetry bumps, `patch` for fixes.
3. Open a PR. Merging to `main` produces a "Version Packages" PR; merging that one publishes to npm and GHCR.
4. Bump the image tag in `inato/infrastructure` (Renovate will propose it) to roll the change out to Kubernetes.
