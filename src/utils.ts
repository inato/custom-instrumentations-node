/**
 * This is copied from https://github.com/open-telemetry/opentelemetry-js-contrib/blob/b520d048465d9b3dfdf275976010c989d2a78a2c/metapackages/auto-instrumentations-node/src/utils.ts#L308
 */
import { DiagLogLevel } from "@opentelemetry/api";

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

  return (
    logLevelMap[rawLogLevel?.trim().toUpperCase() ?? "INFO"] ??
    DiagLogLevel.INFO
  );
}
