import { Alert, Button, DividerTitle, Icon, Input, Select, Toggle } from "../../../../design-system";
import { createProfile } from "../../model/defaults";
import type { ProcessingProfile } from "../../model/types";
import type { StepProps } from "../stepProps";

export default function ProfilesStep({ session, patch, fieldErrors }: StepProps) {
  const { merchants, profiles } = session;
  const touched = session.visitedSteps.includes("profiles");
  const err = (index: number, path: string) =>
    touched ? fieldErrors[`profiles.${index}.${path}`] : undefined;

  const updateProfile = (id: string, updates: Partial<ProcessingProfile>) => {
    patch((d) => ({
      ...d,
      profiles: d.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  };

  const addProfile = () => {
    patch((d) => ({ ...d, profiles: [...d.profiles, createProfile(merchants[0]?.id ?? "")] }));
  };

  const removeProfile = (id: string) => {
    patch((d) => ({ ...d, profiles: d.profiles.filter((p) => p.id !== id) }));
  };

  const uncoveredMerchants = touched
    ? merchants.filter((m) => !profiles.some((p) => p.merchantId === m.id))
    : [];
  const activeProfileCount = profiles.filter((profile) => profile.active).length;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="rounded-lg border border-primary_light1/40 bg-gradient-to-br from-blue-50 to-white px-8 py-4 text-xs leading-6 text-dark-grey">
       A <strong>Processing Profile</strong> is a transaction bucket used to segment a merchant's activity (e.g., by department or product line). One default profile is created automatically for each merchant — add more as needed. The <strong>GUID</strong> is assigned automatically when a profile is created and never changes, even if you rename the label.
      </div>
      {uncoveredMerchants.length > 0 && (
        <Alert variant="error">
          {uncoveredMerchants.map((m) => m.dba || "Unnamed merchant").join(", ")}: every merchant
          needs at least one Processing Profile.
        </Alert>
      )}

      <div className="space-y-4">
        <DividerTitle
          title={
            <span className="inline-flex items-center gap-5">
              <span>Processing Profiles</span>
              <span className="text-[11px] font-bold tracking-wider text-medium-grey">
                {profiles.length} {profiles.length === 1 ? "Profile" : "Profiles"} ·{" "}
                {activeProfileCount} Active
              </span>
            </span>
          }
          action={
            <Button
              size="md"
              icon="plus"
              iconPosition="left"
              disabled={merchants.length === 0}
              onClick={addProfile}
            >
              Add Processing Profile
            </Button>
          }
        />

        {profiles.length === 0 ? (
          <div className="rounded-lg border border-divider bg-white py-8 text-center text-sm text-light-grey">
            {merchants.length === 0
              ? (<>
                <div className="flex min-h-18 flex-col items-center justify-center gap-3 text-center text-sm text-medium-grey px-5">
                  <Icon name="layers" size={22} className="text-medium-grey" />
                  <span>No merchants yet. Add at least one merchant on the Merchants step — a default Processing Profile is created automatically for each.</span>
                </div>
              </>)
              : "No profiles yet. Click Add Processing Profile."}
          </div>
        ) : (
          <div className="border border-divider rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-divider2 border-b border-divider">
                  {["Merchant", "Label", "Active", ""].map((header) => (
                    <th key={header} className="text-left text-xs font-bold text-medium-grey px-4 py-3">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile, index) => (
                  <tr
                    key={profile.id}
                    className="border-b border-divider last:border-b-0 align-middle transition-colors hover:bg-divider2"
                  >
                    <td className="px-4 py-3 w-[35%]">
                      <Select
                        aria-label="Merchant"
                        placeholder="Assign to merchant"
                        options={merchants.map((merchant, merchantIndex) => ({
                          label: merchant.dba || `Merchant ${merchantIndex + 1}`,
                          value: merchant.id,
                        }))}
                        value={profile.merchantId}
                        onChange={(merchantId) => updateProfile(profile.id, { merchantId })}
                        error={err(index, "merchantId")}
                      />
                    </td>
                    <td className="px-4 py-3 w-[45%]">
                      <Input
                        aria-label="Label"
                        placeholder="e.g. Coastline Wellness Default"
                        value={profile.label}
                        onChange={(event) => updateProfile(profile.id, { label: event.target.value })}
                        error={err(index, "label")}
                      />
                    </td>
                    <td className="px-4 py-3 w-32">
                      <Toggle
                        checked={profile.active}
                        onChange={(active) => updateProfile(profile.id, { active })}
                      />
                    </td>
                    <td className="px-4 py-3 text-right w-14">
                      <button
                        type="button"
                        onClick={() => removeProfile(profile.id)}
                        className="p-1.5 rounded text-light-grey hover:text-error hover:bg-error-bg transition"
                        title="Delete"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
