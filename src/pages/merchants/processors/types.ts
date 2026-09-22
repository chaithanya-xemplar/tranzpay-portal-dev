/* ------------------------------------------------ */
/* Shared Types for Merchant Processor Module */
/* ------------------------------------------------ */

export type ProcessorCode = "PXP" | "FD" | "NMI" | "TPY" | "TSYS";

export type PaymentType = "ACH" | "CC";

export type Mode = "create" | "edit" | "view";

/**
 * API response structure when fetching a processor
 */
export interface ProcessorApiResponse {
  processorType: string;
  IsACHType: boolean;
  IsCCType: boolean;
  achConfiguration?: Record<string, string>;
  ccConfiguration?: Record<string, string>;
}

/* --------------------------------------------- */
/* Payload sent to API */
/* --------------------------------------------- */

export interface ProcessorPayload {
  processorType: string;
  IsACHType: boolean;
  IsCCType: boolean;
  achConfiguration: string;
  ccConfiguration: string;
}