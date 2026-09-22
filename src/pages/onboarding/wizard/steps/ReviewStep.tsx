import { Spinner } from "../../../../design-system";
import { formatPhoneNumber } from "../../../../utils/formatters";
import { processorLabel, userTemplateLabel } from "../../model/constants";
import type { OnboardingMerchant, OnboardingSession, StepId } from "../../model/types";
import type { SessionValidation } from "../../model/validateSession";
import ReviewSection, { ReviewRow } from "../components/ReviewSection";
import ValidationBanner from "../components/ValidationBanner";

interface ReviewStepProps {
  session: OnboardingSession;
  validation: SessionValidation;
  onGoToStep: (stepId: StepId) => void;
  isActivating: boolean;
}

function fallback(value?: string | null): string {
  return value?.trim() || "—";
}

function joinBullet(parts: Array<string | null | undefined>): string {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" • ") || "—";
}

function formatAddress(a: { line1: string; line2?: string; city: string; state: string; zip: string }): string {
  return [a.line1, a.line2, a.city, a.state, a.zip].filter(Boolean).join(", ") || "—";
}

function formatPerson(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "—";
}

function formatBatchClose(config: OnboardingMerchant["processing"]["cc"]): string {
  return `${config.batchClose.hour}:${config.batchClose.minute} ${config.batchClose.meridiem} PT`;
}

function formatPricing(config: OnboardingMerchant["processing"]["cc"]): string {
  if (config.pricing.model === "traditional") return "Traditional";
  const suffix = config.pricing.format === "percent" ? "%" : "$";
  return `Convenience ${config.pricing.value || "?"}${suffix}`;
}

/** Compact summary of non-default Advanced settings, or null when all default. */
function advancedSummary(merchant: OnboardingMerchant): string | null {
  const a = merchant.advanced;
  const parts: string[] = [];
  if (a.behavior.customPaylinkEnabled) parts.push(`Paylink: ${a.behavior.customPaylink || "—"}`);
  if (a.achVerifi.enabled) parts.push(`ACHVerifi (${a.achVerifi.accountMode})`);
  if (a.behavior.sharedVault) parts.push("Shared vault");
  if (a.behavior.enableSubscriptions) parts.push("Subscriptions");
  if (a.behavior.enableProducts) parts.push("Products");
  if (a.behavior.generateReferenceNumber) parts.push("Auto reference #");
  if (!a.behavior.requireCvv) parts.push("CVV off");
  if (!a.behavior.requireTypedSignature) parts.push("Signature off");
  if (Object.values(a.accountLimits).some((v) => v.trim())) parts.push("Account limits");
  const customFieldCount =
    [...a.ccCustomFields, ...a.achCustomFields].filter((f) => f.en.trim()).length +
    a.apiCustomFields.filter((f) => f.trim()).length;
  if (customFieldCount > 0) {
    parts.push(`${customFieldCount} custom field${customFieldCount === 1 ? "" : "s"}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function railSummary(merchant: OnboardingMerchant, rail: "cc" | "ach"): string {
  const { processing } = merchant;
  const config = processing[rail];
  if (!config.enabled) return "Disabled";

  const railProcessors = processing.processors.filter(
    (processor) => processor.enabled && processor.rails[rail]
  );
  const primary = processing.priority[rail]
    .map((id) => processing.processors.find((processor) => processor.id === id))
    .find((processor) => processor?.enabled && processor.rails[rail]);

  return joinBullet([
    primary ? `Primary: ${processorLabel(primary.processorCode)}` : "No primary processor",
    `${railProcessors.length} processor${railProcessors.length === 1 ? "" : "s"}`,
    formatPricing(config),
    `Batch ${formatBatchClose(config)}`,
  ]);
}

export default function ReviewStep({ session, validation, onGoToStep, isActivating }: ReviewStepProps) {
  const issues = (step: StepId) => validation.byStep[step]?.length ?? 0;
  const { account, company, owners, merchants, profiles, users } = session;

  const accountName = account.mode === "existing" ? account.existing?.name : account.newAccount.name;
  const accountContact =
    account.mode === "existing" ? account.existing?.contact : account.newAccount.contact;
  const accountAddress =
    account.mode === "existing" ? account.existing?.address : account.newAccount.address;

  return (
    <div className="space-y-8 max-w-5xl">
      {isActivating && (
        <div className="flex items-center gap-2 text-sm text-medium-grey">
          <Spinner size="sm" /> Activating…
        </div>
      )}

      <ValidationBanner validation={validation} onGoToStep={onGoToStep} />

      <ReviewSection number="01" title="Account" issueCount={issues("account")} onEdit={() => onGoToStep("account")}>
        <ReviewRow label="Account" value={`${fallback(accountName)} (${account.mode === "existing" ? "existing" : "new"})`} />
        <ReviewRow label="Account ID" value={account.mode === "existing" ? fallback(account.existing?.id) : "—"} />
        <ReviewRow label="Primary Contact" value={formatPerson(accountContact?.firstName, accountContact?.lastName)} />
        <ReviewRow label="Contact Email" value={fallback(accountContact?.email)} />
        <ReviewRow label="Contact Phone" value={fallback(formatPhoneNumber(accountContact?.phone ?? ""))} />
        <ReviewRow label="Contact Address" value={accountAddress ? formatAddress(accountAddress) : "—"} />
      </ReviewSection>

      <ReviewSection number="02" title="Company" issueCount={issues("company")} onEdit={() => onGoToStep("company")}>
        <ReviewRow label="Legal Name" value={fallback(company.legalName)} />
        <ReviewRow label="Alias" value={fallback(company.alias)} />
        <ReviewRow label="Federal Tax ID" value={fallback(company.federalTaxId)} />
        <ReviewRow label="Business Start Date" value={fallback(company.businessStartDate)} />
        <ReviewRow label="Website" value={fallback(company.website)} />
        <ReviewRow label="MCC Code" value={fallback(company.mccCode)} />
        <ReviewRow label="Default Time Zone" value={fallback(company.timezone)} />
        <ReviewRow label="Mailing Address" value={formatAddress(company.mailingAddress)} />
        <ReviewRow label="Customer Service" value={joinBullet([formatPhoneNumber(company.csPhone), company.csEmail])} />
        <ReviewRow label="Logo" value={company.logo ? "Uploaded" : "—"} />
      </ReviewSection>

      <ReviewSection number="03" title="Owners" issueCount={issues("owners")} onEdit={() => onGoToStep("owners")}>
        {owners.length === 0 ? (
          <p className="text-sm text-light-grey sm:col-span-2">No owners added.</p>
        ) : (
          owners.map((owner) => (
            <ReviewRow
              key={owner.id}
              label={owner.kind === "principal" ? "Principal" : "Parent Company"}
              value={
                owner.kind === "principal"
                  ? joinBullet([
                      owner.fullName,
                      `${owner.ownershipPct || "0"}%`,
                      owner.contactEmail,
                      formatPhoneNumber(owner.contactPhone),
                    ])
                  : joinBullet([owner.fullName, `${owner.ownershipPct || "0"}%`, owner.contactEmail, formatPhoneNumber(owner.contactPhone)])
              }
            />
          ))
        )}
      </ReviewSection>

      <ReviewSection number="04" title="Merchants" issueCount={issues("merchants")} onEdit={() => onGoToStep("merchants")}>
        {merchants.length === 0 ? (
          <p className="text-sm text-light-grey sm:col-span-2">No merchants added.</p>
        ) : (
          merchants.map((merchant, index) => {
            const adv = advancedSummary(merchant);
            return (
              <div key={merchant.id} className="contents">
                <ReviewRow
                  label={`Merchant ${index + 1}`}
                  value={joinBullet([merchant.dba, merchant.alias ? `(${merchant.alias})` : null])}
                />
                <ReviewRow
                  label="Physical Location"
                  value={
                    merchant.useCompanyMailingAddress
                      ? "Uses Company mailing address"
                      : formatAddress(merchant.address)
                  }
                />
                <ReviewRow
                  label="Contact"
                  value={joinBullet([formatPerson(merchant.contactFirstName, merchant.contactLastName), merchant.email, formatPhoneNumber(merchant.phone)])}
                />
                <ReviewRow
                  label="ACHVerifi"
                  value={merchant.advanced.achVerifi.enabled ? "On" : "Off"}
                />
                {adv && (
                  <ReviewRow
                    className="sm:col-span-2"
                    label="Advanced"
                    value={`Advanced: ${adv}`}
                  />
                )}
              </div>
            );
          })
        )}
      </ReviewSection>

      <ReviewSection number="04a" title="Processing" issueCount={issues("processing")} onEdit={() => onGoToStep("processing")}>
        {merchants.length === 0 ? (
          <p className="text-sm text-light-grey sm:col-span-2">No merchants configured.</p>
        ) : (
          merchants.map((merchant) => (
            <div key={merchant.id} className="contents">
              <ReviewRow
                label={`${merchant.dba || "Merchant"} — MID`}
                value={fallback(merchant.processing.mid)}
              />
              <ReviewRow
                label="Credit Card"
                value={railSummary(merchant, "cc")}
              />
              <ReviewRow
                label="ACH"
                value={railSummary(merchant, "ach")}
              />
            </div>
          ))
        )}
      </ReviewSection>

      <ReviewSection number="04b" title="Processing Profiles" issueCount={issues("profiles")} onEdit={() => onGoToStep("profiles")}>
        {profiles.length === 0 ? (
          <ReviewRow label="Profiles" value="None added" className="sm:col-span-2" />
        ) : (
          profiles.map((profile) => {
            const merchant = merchants.find((m) => m.id === profile.merchantId);
            return (
              <ReviewRow
                key={profile.id}
                label={profile.label || "Unlabeled"}
                value={joinBullet([merchant?.dba || "Unassigned", profile.active ? "Active" : "Inactive"])}
              />
            );
          })
        )}
      </ReviewSection>

      <ReviewSection number="05" title="Users" issueCount={issues("users")} onEdit={() => onGoToStep("users")}>
        {users.length === 0 ? (
          <p className="text-sm text-light-grey sm:col-span-2">No users added.</p>
        ) : (
          users.map((user) => (
            <ReviewRow
              key={user.id}
              label={formatPerson(user.firstName, user.lastName)}
              value={joinBullet([
                user.email,
                userTemplateLabel(user.templateId),
                user.active ? "Active" : "Inactive",
                user.apiAccess ? "API" : null,
              ])}
            />
          ))
        )}
      </ReviewSection>
    </div>
  );
}
