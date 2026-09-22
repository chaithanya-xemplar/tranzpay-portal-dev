import type { ProcessorCode, PaymentType } from "./types";

export interface FieldConfig {
  name: string;
  apiName: string;
  label: string;

  type?: "text" | "number" | "password" | "select";
  readOnly?: boolean;
  placeholder?: string;

  options?: { label: string; value: string }[];
}

export interface ProcessorConfig {
  processorType: string;
  supportedPayments: PaymentType[];

  ACH?: FieldConfig[];
  CC?: FieldConfig[];
}

export const PROCESSOR_CONFIG: Record<ProcessorCode, ProcessorConfig> = {
  /* ---------------- PaymentXP ---------------- */
  PXP: {
    processorType: "PaymentXp",
    supportedPayments: ["ACH", "CC"],

    ACH: [
      { name: "merchantId", apiName: "MerchantID", label: "PXP Merchant ID" },
      {
        name: "merchantKey",
        apiName: "MerchantKey",
        label: "PXP Merchant Key",
        type: "password",
      },
    ],

    CC: [
      { name: "merchantId", apiName: "MerchantID", label: "PXP Merchant ID" },
      {
        name: "merchantKey",
        apiName: "MerchantKey",
        label: "PXP Merchant Key",
        type: "password",
      },
    ],
  },

  /* ---------------- First Data ---------------- */
  FD: {
    processorType: "FirstData",
    supportedPayments: ["CC"],

    CC: [
      {
        name: "posCondCode",
        apiName: "POSCondCode",
        label: "POS Condition Code",
        type: "select",
        options: [
          { label: "Ecommerce", value: "Ecommerce" },
          { label: "Moto", value: "Moto" },
        ],
      },
      { name: "merchantId", apiName: "MerchantID", label: "Merchant ID" },
      { name: "terminalId", apiName: "TerminalID", label: "Terminal ID" },
      { name: "did", apiName: "DID", label: "DID", readOnly: true },
      { name: "tppId", apiName: "TppID", label: "TPP ID" },
      { name: "transArmorTokenType", apiName: "TransArmorTokenType", label: "TransArmor Token Type" },
      { name: "merchCatCode", apiName: "MerchCatCode", label: "Merchant Category Code", type: "number" },
      { name: "descriptor", apiName: "Descriptor", label: "Descriptor" },
    ],
  },

  /* ---------------- Tranzpay ---------------- */
  TPY: {
    processorType: "Tranzpay",
    supportedPayments: ["ACH"],

    ACH: [
      { name: "companyId", apiName: "CompanyID", label: "Company ID", type: "number" },
      { name: "depositAccountNumber", apiName: "DepositAccountNumber", label: "Deposit Account Number", type: "number" },
      { name: "depositRoutingNumber", apiName: "DepositRoutingNumber", label: "Deposit Routing Number", type: "number" },
      { name: "descriptor", apiName: "Descriptor", label: "Descriptor" },
    ],
  },

  NMI: {
    processorType: "NMI",
    supportedPayments: ["CC"],

    CC: [
      { name: "securityKey", apiName: "SecurityKey", label: "Security Key", type: "password" },
      { name: "processorId", apiName: "ProcessorID", label: "Processor ID" },
    ],
  },

  TSYS: {
    processorType: "TSYS",
    supportedPayments: ["CC"],

    CC: [
      { name: "acquirerBIN", apiName: "AcquirerBIN", label: "Acquirer BIN", type: "number" },
      { name: "merchantCategoryCode", apiName: "MerchantCategoryCode", label: "Merchant Category Code", type: "number" },
      { name: "merchantNumber", apiName: "MerchantNumber", label: "Merchant Number" },
      { name: "storeNumber", apiName: "StoreNumber", label: "Store Number", type: "number" },
      { name: "terminalNumber", apiName: "TerminalNumber", label: "Terminal Number", type: "number" },
      { name: "timeZoneDifferential", apiName: "TimeZoneDifferential", label: "Time Zone Differential", type: "number" },
      { name: "terminalIDNumber", apiName: "TerminalIDNumber", label: "Terminal ID Number", type: "number" },
      { name: "agentBankNumber", apiName: "AgentBankNumber", label: "Agent Bank Number", type: "number" },
      { name: "authenticationCode", apiName: "AuthenticationCode", label: "Authentication Code" },
      { name: "token", apiName: "Token", label: "Token", readOnly: true },
    ],
  },
};