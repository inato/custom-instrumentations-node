# inspired from https://github.com/open-telemetry/opentelemetry-operator/blob/main/autoinstrumentation/nodejs/Dockerfile
FROM node:22 AS build

WORKDIR /operator-build
COPY . .

RUN corepack enable

RUN pnpm install --shamefully-hoist

RUN pnpm build

RUN pnpm prune --prod

FROM busybox

COPY --from=build /operator-build/build /autoinstrumentation

COPY --from=build /operator-build/node_modules /autoinstrumentation/node_modules

RUN chmod -R go+r /autoinstrumentation

RUN ln /autoinstrumentation/register.js /autoinstrumentation/autoinstrumentation.js