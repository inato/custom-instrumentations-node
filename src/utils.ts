import { DiagLogLevel } from "@opentelemetry/api";
import {
  ParentBasedSampler,
  Sampler,
  SamplingDecision,
} from "@opentelemetry/sdk-trace-node";

const logLevelMap: { [key: string]: DiagLogLevel } = {
  ALL: DiagLogLevel.ALL,
  VERBOSE: DiagLogLevel.VERBOSE,
  DEBUG: DiagLogLevel.DEBUG,
  INFO: DiagLogLevel.INFO,
  WARN: DiagLogLevel.WARN,
  ERROR: DiagLogLevel.ERROR,
  NONE: DiagLogLevel.NONE,
};

export function getLogLevelFromEnv(): DiagLogLevel {
  const rawLogLevel = process.env.OTEL_LOG_LEVEL;

  // NOTE: as per specification we should actually only register if something is set, but our previous implementation
  // always registered a logger, even when nothing was set. Falling back to 'INFO' here to keep the same behavior as
  // with previous implementations.
  // Also: no point in warning - no logger is registered yet
  return (
    logLevelMap[rawLogLevel?.trim().toUpperCase() ?? "INFO"] ??
    DiagLogLevel.INFO
  );
}

class CustomRootSampler implements Sampler {
  shouldSample: Sampler["shouldSample"] = (
    context,
    traceId,
    spanName,
    spanKind,
    attributes
  ) => {
    if (
      spanName === "pg-pool.connect" ||
      spanName === "GET" ||
      spanName === "GET /" ||
      spanName.startsWith("grpc.google") ||
      spanName.startsWith("pg.query")
    ) {
      return { decision: SamplingDecision.NOT_RECORD };
    }
    console.log({
      spanName,
      attributes,
      // @ts-expect-error
      context: context._currentContext,
    });
    return {
      decision: SamplingDecision.RECORD_AND_SAMPLED,
    };
  };
  toString() {
    return "Inato custom root sampler";
  }
}

export class CustomSampler extends ParentBasedSampler {
  constructor() {
    super({ root: new CustomRootSampler() });
  }
}
