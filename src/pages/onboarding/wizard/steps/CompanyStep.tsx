import { AddressBlock, Icon, Input, LogoUpload, Select } from "../../../../design-system";
import { formatPhoneNumber } from "../../../../utils/formatters";
import { ONBOARDING_TIMEZONES } from "../../model/constants";
import type { CompanySlice } from "../../model/types";
import StepSection from "../components/StepSection";
import type { StepProps } from "../stepProps";

export default function CompanyStep({ session, patch, fieldErrors }: StepProps) {
  const { company } = session;
  const touched = session.visitedSteps.includes("company");
  const err = (path: string) => (touched ? fieldErrors[`company.${path}`] : undefined);

  const set = (updates: Partial<CompanySlice>) => {
    patch((d) => ({ ...d, company: { ...d.company, ...updates } }));
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="rounded-lg border border-primary_light1/40 bg-gradient-to-br from-blue-50 to-white px-8 py-4 text-xs leading-6 text-dark-grey">
       A <strong>Company</strong> is the top-level business entity. One Company can own many Merchants. The Company time zone becomes the default for new users created later.
      </div>
      <StepSection title="Company Information" >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Legal Name"
            placeholder="Acme Holdings, Inc."
            leftIcon={<Icon name="building" size={16} />}
            value={company.legalName}
            onChange={(e) => set({ legalName: e.target.value })}
            error={err("legalName")}
            required
          />
          <Input
            label="Alias"
            placeholder="ACME-HLD"
            value={company.alias}
            onChange={(e) => set({ alias: e.target.value })}
            helper="Optional. Short identifier used internally."
          />
          <Input
            label="Federal Tax ID (EIN)"
            placeholder="12-3456789"
            leftIcon={<Icon name="shield" size={16} />}
            value={company.federalTaxId}
            onChange={(e) => set({ federalTaxId: e.target.value })}
            error={err("federalTaxId")}
            required
          />
          <Input
            label="Business Start Date"
            type="date"
            value={company.businessStartDate}
            onChange={(e) => set({ businessStartDate: e.target.value })}
          />
          <Input
            label="Website URL"
            placeholder="https://acme.com"
            value={company.website}
            onChange={(e) => set({ website: e.target.value })}
            error={err("website")}
          />
          <Input
            label="Type of Goods Sold (MCC Code)"
            placeholder="Enter an MCC code"
            value={company.mccCode}
            onChange={(e) => set({ mccCode: e.target.value })}
            helper="Merchant category code that best describes the business."
          />
          <Select
            label="Default Time Zone"
            containerClassName="sm:col-span-2"
            options={ONBOARDING_TIMEZONES}
            value={company.timezone}
            onChange={(value) => set({ timezone: value })}
          />
        </div>
        <p className="text-xs text-light-grey mt-2">Used as the default for new users created under this Company.</p>
      </StepSection>

      <StepSection title="Mailing Address">
        <AddressBlock
          idPrefix="company-mailing-address"
          values={company.mailingAddress}
          onChange={(field, value) =>
            set({ mailingAddress: { ...company.mailingAddress, [field]: value } })
          }
          errors={{
            line1: err("mailingAddress.line1"),
            city: err("mailingAddress.city"),
            state: err("mailingAddress.state"),
            zip: err("mailingAddress.zip"),
          }}
        />
      </StepSection>

      <StepSection
        title="Customer Service"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <p className="text-xs text-light-grey sm:col-span-2">
            Shown to cardholders on statements and receipts so they can reach the business.
          </p>
          <Input
            label="Customer Service Phone"
            placeholder="(843) 555-0142"
            leftIcon={<Icon name="phone" size={16} />}
            value={formatPhoneNumber(company.csPhone)}
            onChange={(e) => set({ csPhone: formatPhoneNumber(e.target.value) })}
            error={err("csPhone")}
          />
          <Input
            label="Customer Service Email"
            placeholder="support@acme.com"
            leftIcon={<Icon name="mail" size={16} />}
            value={company.csEmail}
            onChange={(e) => set({ csEmail: e.target.value })}
            error={err("csEmail")}
          />
        </div>
      </StepSection>

      <StepSection title="Branding">
        <p className="text-xs text-light-grey mb-2">
          logo
        </p>
        <LogoUpload
          value={company.logo}
          onChange={(logo) => set({ logo })}
          helper="JPG, JPEG, GIF or PNG · max 1 MB · recommended 200 × 50 px."
        />
      </StepSection>
    </div>
  );
}
