import * as opentelemetry from "@opentelemetry/sdk-node";
import { diag, DiagConsoleLogger } from "@opentelemetry/api";
import {
  getNodeAutoInstrumentations,
  getResourceDetectors,
} from "@opentelemetry/auto-instrumentations-node";
import { CustomSampler, getLogLevelFromEnv } from "./utils.js";

diag.setLogger(new DiagConsoleLogger(), getLogLevelFromEnv());

const sdk = new opentelemetry.NodeSDK({
  instrumentations: getNodeAutoInstrumentations({
    "@opentelemetry/instrumentation-graphql": {
      mergeItems: true,
      ignoreTrivialResolveSpans: true,
      depth: 3,
    },
  }),
  resourceDetectors: getResourceDetectors(),
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
