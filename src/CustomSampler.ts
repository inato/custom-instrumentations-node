import {
  Sampler,
  SamplingDecision,
  ParentBasedSampler,
} from "@opentelemetry/sdk-trace-node";

/**
 * CustomRootSampler filters out root spans that are useless:
 * - spanName === 'pg-pool.connect' -> most likely a direct call to the db for diagnostics
 * - spanName === 'GET' -> most likely a direct call to configcat or a CDN
 * - spanName === 'GET /' -> somebody hitting the route '/'
 * - spanName ~ 'pg.query*' -> most likely a direct call to the db for diagnostics
 * - spanName ~ 'grpc.google*' -> most likely opening up a connection with GCP PubSub subscriber
 */
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
    return {
      decision: SamplingDecision.RECORD_AND_SAMPLED,
    };
  };
  toString() {
    return "Inato custom root sampler";
  }
}

/**
 * CustomSampler extends ParentBasedSampler and filter out
 * root spans that are useless (see CustomRootSampler)
 */
export class CustomSampler extends ParentBasedSampler {
  constructor() {
    super({ root: new CustomRootSampler() });
  }
}
