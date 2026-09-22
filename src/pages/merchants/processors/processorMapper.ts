import { PROCESSOR_CONFIG } from "./processorConfig";
import type { ProcessorCode, PaymentType } from "./types";
import type { ProcessorPayload } from "./types";

export const mapFormToPayload = (
  code: ProcessorCode,
  data: Record<string, unknown>
): ProcessorPayload => {
  const config = PROCESSOR_CONFIG[code];

  const buildConfig = (type: PaymentType) => {
    const fields = config[type];
    if (!fields) return "";

    const apiConfig: Record<string, unknown> = {};

    fields.forEach((f) => {
      if (f.readOnly) return;

      apiConfig[f.apiName] = data[`${type}_${f.apiName}`];
    });

    return JSON.stringify(apiConfig);
  };

  const supportsACH = config.supportedPayments.includes("ACH");
  const supportsCC = config.supportedPayments.includes("CC");

  return {
    processorType: config.processorType,
    IsACHType: supportsACH,
    IsCCType: supportsCC,
    achConfiguration: supportsACH ? buildConfig("ACH") : "",
    ccConfiguration: supportsCC ? buildConfig("CC") : "",
  };
};