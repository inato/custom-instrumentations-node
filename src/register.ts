/**
 * This is mostly copied from https://github.com/open-telemetry/opentelemetry-js-contrib/blob/b520d048465d9b3dfdf275976010c989d2a78a2c/metapackages/auto-instrumentations-node/src/register.ts#L1
 */
import * as opentelemetry from "@opentelemetry/sdk-node";
import { diag, DiagConsoleLogger } from "@opentelemetry/api";
import {
  getNodeAutoInstrumentations,
  getResourceDetectors,
} from "@opentelemetry/auto-instrumentations-node";
import { getLogLevelFromEnv } from "./utils.js";
import { CustomSampler } from "./CustomSampler.js";

diag.setLogger(new DiagConsoleLogger(), getLogLevelFromEnv());

const sdk = new opentelemetry.NodeSDK({
  instrumentations: getNodeAutoInstrumentations({
    // we pass custom config to the graphql plugin to reduce the number of spans created
    "@opentelemetry/instrumentation-graphql": {
      mergeItems: true,
      ignoreTrivialResolveSpans: true,
      depth: 3,
    },
  }),
  resourceDetectors: getResourceDetectors(),
  // we use our custom sampler to filter out useless traces
  sampler: new CustomSampler(),
});

try {
  sdk.start();
  diag.info("OpenTelemetry automatic instrumentation started successfully");
} catch (error) {
  diag.error(
    "Error initializing OpenTelemetry SDK. Your application is not instrumented and will not produce telemetry",
    error
  );
}

async function shutdown(): Promise<void> {
  try {
    await sdk.shutdown();
    diag.debug("OpenTelemetry SDK terminated");
  } catch (error) {
    diag.error("Error terminating OpenTelemetry SDK", error);
  }
}

// Gracefully shutdown SDK if a SIGTERM is received
process.on("SIGTERM", shutdown);
// Gracefully shutdown SDK if Node.js is exiting normally
process.once("beforeExit", shutdown);
