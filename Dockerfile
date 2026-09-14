# inspired from https://github.com/open-telemetry/opentelemetry-operator/blob/main/autoinstrumentation/nodejs/Dockerfile

ARG NODE_VERSION
FROM node:${NODE_VERSION} AS build

WORKDIR /operator-build
COPY . .

RUN corepack enable

# Non-interactive: never prompt (e.g. for a node_modules purge) inside the build
ENV CI=true

RUN pnpm install

RUN pnpm build

RUN pnpm prune --prod

FROM busybox

COPY --from=build /operator-build/build /autoinstrumentation

COPY --from=build /operator-build/node_modules /autoinstrumentation/node_modules

RUN chmod -R go+r /autoinstrumentation

RUN ln /autoinstrumentation/register.js /autoinstrumentation/autoinstrumentation.js