import type { ReactNode } from "react";
import { Checkbox, DividerTitle, Field, Icon, Input, RichText, ToggleRow } from "../../../../../design-system";
import { formatIntegerInput } from "../../../../../utils/formatters";
import { SUGGESTED_REQUIRED_FIELDS } from "../../../model/constants";
import type {
  AccountLimits,
  MerchantAdvancedSettings,
  MerchantBehavior,
  PaymentPageLabels,
} from "../../../model/types";
import AchVerifiSection from "./AchVerifiSection";
import ApiCustomFieldsEditor from "./ApiCustomFieldsEditor";
import ChipPicker from "./ChipPicker";
import CustomFieldsTable from "./CustomFieldsTable";
import ViewControlMatrix from "./ViewControlMatrix";

interface AdvancedSettingsPanelProps {
  advanced: MerchantAdvancedSettings;
  update: (patch: Partial<MerchantAdvancedSettings>) => void;
  /** Field error lookup by path relative to `advanced.` (touched-gated by caller). */
  error: (path: string) => string | undefined;
}

function Section({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <DividerTitle title={title} />
        {intro && <p className="text-xs text-light-grey mt-1 pl-7">{intro}</p>}
      </div>
      <div className="rounded-xl border border-divider bg-white p-5 shadow-sm">
        <div className="space-y-3">{children}</div>
      </div>
    </section>
  );
}

const LIMIT_FIELDS: { key: keyof AccountLimits; label: string; placeholder: string }[] = [
  { key: "ccApprovedMonthlyVolume", label: "Approved Monthly Volume", placeholder: "$500,000" },
  { key: "ccHighTicket", label: "High Ticket", placeholder: "$2,500" },
  { key: "ccThresholdPercent", label: "Threshold Percentage", placeholder: "80%" },
  { key: "achApprovedMonthlyVolume", label: "Approved Monthly Volume", placeholder: "$250,000" },
  { key: "achHighTicket", label: "High Ticket", placeholder: "$5,000" },
  { key: "achThresholdPercent", label: "Threshold Percentage", placeholder: "80%" },
];

const LABEL_FIELDS: { key: Exclude<keyof PaymentPageLabels, "policyNumberRequired">; label: string; placeholder: string }[] = [
  { key: "paymentAmount", label: "Payment Amount", placeholder: "Amount" },
  { key: "accountType", label: "Account Type", placeholder: "Type" },
  { key: "firstName", label: "First Name", placeholder: "First" },
  { key: "lastName", label: "Last Name", placeholder: "Last" },
  { key: "businessName", label: "Business Name", placeholder: "Account Holder" },
  { key: "address", label: "Address", placeholder: "Address" },
  { key: "city", label: "City", placeholder: "City" },
  { key: "state", label: "State", placeholder: "State" },
  { key: "zip", label: "Zip", placeholder: "Zip" },
  { key: "siteFee", label: "Site Fee", placeholder: "Site Fee*" },
];

export default function AdvancedSettingsPanel({ advanced, update, error }: AdvancedSettingsPanelProps) {
  const behavior = advanced.behavior;
  const updateBehavior = (patch: Partial<MerchantBehavior>) =>
    update({ behavior: { ...behavior, ...patch } });
  const updateLabels = (patch: Partial<PaymentPageLabels>) =>
    update({ paymentPageLabels: { ...advanced.paymentPageLabels, ...patch } });
  const updateLimits = (patch: Partial<AccountLimits>) =>
    update({ accountLimits: { ...advanced.accountLimits, ...patch } });

  const toggleRequiredField = (option: string) => {
    const list = advanced.requiredFields;
    update({
      requiredFields: list.includes(option)
        ? list.filter((f) => f !== option)
        : [...list, option],
    });
  };

  return (
    <div className="space-y-5 pt-2 bg-white">
      <Section title="Account Limits">
        {(["cc", "ach"] as const).map((rail) => (
          <div key={rail} className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-dark-grey">
              <Icon name={rail === "cc" ? "card" : "bank"} size={14} />
              {rail === "cc" ? "Credit Card" : "ACH"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LIMIT_FIELDS.filter((f) => f.key.startsWith(rail === "cc" ? "cc" : "ach")).map((f) => (
                <Input
                  key={f.key}
                  label={f.label}
                  placeholder={f.placeholder}
                  inputMode={f.key.endsWith("ThresholdPercent") ? "numeric" : undefined}
                  value={advanced.accountLimits[f.key]}
                  onChange={(e) =>
                    updateLimits({
                      [f.key]: f.key.endsWith("ThresholdPercent")
                        ? formatIntegerInput(e.target.value)
                        : e.target.value,
                    })
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Required Custom Fields">
        <ChipPicker
          options={SUGGESTED_REQUIRED_FIELDS}
          selected={advanced.requiredFields}
          onToggle={toggleRequiredField}
        />
      </Section>

      <Section
        title="View Controls"
      >
        <p className="text-xs text-light-grey mb-2">
          Control which fields are visible to users in the portal. Hidden fields are still available via API.
        </p>
        <ViewControlMatrix
          value={advanced.viewControls}
          onChange={(viewControls) => update({ viewControls })}
        />
      </Section>

      <Section title="Behavior">
        <div className="space-y-2.5">
          <ToggleRow
            label="Custom Paylink"
            description="Enable a branded paylink endpoint for this merchant."
            checked={behavior.customPaylinkEnabled}
            onChange={(customPaylinkEnabled) => updateBehavior({ customPaylinkEnabled })}
          />
          {behavior.customPaylinkEnabled && (
            <div className="pl-4 border-l-2 border-divider">
              <Field
                label="Set Paylink Endpoint"
                error={error("behavior.customPaylink")}
                helper="Format: tranzpay.com/pay/{endpoint}"
              >
                <div className="flex items-stretch">
                  <span className="flex items-center px-3 text-sm text-medium-grey bg-divider2 border border-r-0 border-divider rounded-l-lg whitespace-nowrap">
                    tranzpay.com/pay/
                  </span>
                  <Input
                    aria-label="Paylink endpoint"
                    containerClassName="flex-1"
                    className="rounded-l-none"
                    value={behavior.customPaylink}
                    placeholder="postmanins"
                    onChange={(e) =>
                      updateBehavior({
                        customPaylink: e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase(),
                      })
                    }
                  />
                </div>
              </Field>
            </div>
          )}
          <ToggleRow
            label="Require CVV"
            checked={behavior.requireCvv}
            onChange={(requireCvv) => updateBehavior({ requireCvv })}
          />
          <ToggleRow
            label="Require Typed Signature"
            checked={behavior.requireTypedSignature}
            onChange={(requireTypedSignature) => updateBehavior({ requireTypedSignature })}
          />
          <ToggleRow
            label="Shared Customer Vault"
            checked={behavior.sharedVault}
            onChange={(sharedVault) => updateBehavior({ sharedVault })}
          />
          {behavior.sharedVault && (
            <div className="pl-4 border-l-2 border-divider">
              <Field
                label="Shared Processing Profile GUIDs"
                helper="Comma-separated list of Processing Profile GUIDs that share this vault."
              >
                <Input
                  value={behavior.sharedVaultProfileGuids}
                  placeholder="PRD-DEFAULT, PRD-1042, PRD-1187"
                  onChange={(e) => updateBehavior({ sharedVaultProfileGuids: e.target.value })}
                />
              </Field>
            </div>
          )}
          <ToggleRow
            label="Enable Subscriptions"
            description="Allow recurring subscription billing for this merchant."
            checked={behavior.enableSubscriptions}
            onChange={(enableSubscriptions) => updateBehavior({ enableSubscriptions })}
          />
          <ToggleRow
            label="Enable Products"
            description="Allow product catalog and itemized checkout."
            checked={behavior.enableProducts}
            onChange={(enableProducts) => updateBehavior({ enableProducts })}
          />
          <ToggleRow
            label="Generate Reference Number"
            description="Auto-generate a unique reference number for every transaction."
            checked={behavior.generateReferenceNumber}
            onChange={(generateReferenceNumber) => updateBehavior({ generateReferenceNumber })}
          />
        </div>
      </Section>

      <Section
        title="Payment Page Field Labels"
        
      >
        <p className="text-xs text-light-grey mb-2">
          Customize the labels shown to customers on payment pages. Leave blank to use defaults.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LABEL_FIELDS.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              placeholder={f.placeholder}
              value={advanced.paymentPageLabels[f.key]}
              onChange={(e) => updateLabels({ [f.key]: e.target.value })}
            />
          ))}
          <div className="flex items-end gap-3">
            <Input
              label="Policy Number"
              placeholder="Policy"
              containerClassName="flex-1"
              value={advanced.paymentPageLabels.policyNumber}
              onChange={(e) => updateLabels({ policyNumber: e.target.value })}
            />
            <Checkbox
              label="Required"
              className="pb-2.5"
              checked={advanced.paymentPageLabels.policyNumberRequired}
              onChange={(policyNumberRequired) => updateLabels({ policyNumberRequired })}
            />
          </div>
        </div>
      </Section>

      <Section title="Third Party Options">
        <div className="space-y-2.5">
          <ToggleRow
            label="Save customer to vault"
            description="Automatically save new customers to the vault after third-party transactions."
            checked={advanced.thirdParty.saveCustomerToVault}
            onChange={(saveCustomerToVault) =>
              update({ thirdParty: { ...advanced.thirdParty, saveCustomerToVault } })
            }
          />
          <ToggleRow
            label="Unlock third party fields"
            description="Allows payment page fields to be edited by customer, which are non-editable by default."
            checked={advanced.thirdParty.unlockThirdPartyFields}
            onChange={(unlockThirdPartyFields) =>
              update({ thirdParty: { ...advanced.thirdParty, unlockThirdPartyFields } })
            }
          />
        </div>
      </Section>

      <Section
        title="Custom Fields"
        intro=""
      >
        <p className="text-xs text-light-grey mb-2">  
          Up to 4 additional fields per payment type. Add a Spanish translation to show on Spanish-language pages.
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-dark-grey">
              <Icon name="card" size={14} /> Credit Card
            </p>
            <CustomFieldsTable
              fields={advanced.ccCustomFields}
              onChange={(ccCustomFields) => update({ ccCustomFields })}
            />
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-dark-grey">
              <Icon name="bank" size={14} /> ACH
            </p>
            <CustomFieldsTable
              fields={advanced.achCustomFields}
              onChange={(achCustomFields) => update({ achCustomFields })}
            />
          </div>
        </div>
      </Section>

      <Section
        title="(API) Custom Fields"
        intro=""
      >
        <p className="text-xs text-light-grey mb-2">
          Optional API-only custom fields (slots 5–20). They’re written via API and appear in postbacks and reports under the name you choose here. Most merchants don’t need any — add only what you use.
        </p>
        <ApiCustomFieldsEditor
          fields={advanced.apiCustomFields}
          onChange={(apiCustomFields) => update({ apiCustomFields })}
        />
      </Section>

      <Section title="Refund Policy">
        <Field helper="Shown to customers on receipts and payment pages. Format with the toolbar.">
          <RichText
            value={advanced.refundPolicy}
            onChange={(refundPolicy) => update({ refundPolicy })}
            placeholder="Describe your refund terms…"
          />
        </Field>
      </Section>

      <Section title="ACHVerifi">
        <AchVerifiSection
          value={advanced.achVerifi}
          onChange={(patch) => update({ achVerifi: { ...advanced.achVerifi, ...patch } })}
          error={error}
        />
      </Section>
    </div>
  );
}
