import { useState } from "react";
import clsx from "clsx";
import { AddressBlock, Alert, Button, Card, Checkbox, Collapse, DividerTitle, Icon, Input } from "../../../../design-system";
import { createDefaultProfile, createMerchant } from "../../model/defaults";
import type { OnboardingMerchant } from "../../model/types";
import AdvancedSettingsPanel from "../components/advanced/AdvancedSettingsPanel";
import StepSection from "../components/StepSection";
import type { StepProps } from "../stepProps";

export default function MerchantsStep({ session, patch, fieldErrors }: StepProps) {
  const { merchants } = session;
  const [newDba, setNewDba] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(merchants[0]?.id ?? null);
  const touched = session.visitedSteps.includes("merchants");
  const err = (index: number, path: string) =>
    touched ? fieldErrors[`merchants.${index}.${path}`] : undefined;

  const addMerchant = () => {
    const merchant = createMerchant(newDba.trim(), newAlias.trim());
    const profile = createDefaultProfile(merchant);
    patch((d) => ({
      ...d,
      merchants: [...d.merchants, merchant],
      profiles: [...d.profiles, profile],
    }));
    setNewDba("");
    setNewAlias("");
    setSelectedId(merchant.id);
  };

  const removeMerchant = (id: string) => {
    patch((d) => ({
      ...d,
      merchants: d.merchants.filter((m) => m.id !== id),
      profiles: d.profiles.filter((p) => p.merchantId !== id),
    }));
    if (selectedId === id) setSelectedId(null);
  };

  const updateMerchant = (id: string, updates: Partial<OnboardingMerchant>) => {
    patch((d) => ({
      ...d,
      merchants: d.merchants.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  };

  const selected = merchants.find((m) => m.id === selectedId) ?? null;
  const selectedIndex = selected ? merchants.findIndex((m) => m.id === selected.id) : -1;
  const merchantContact = (merchant: OnboardingMerchant) => {
    const name = [merchant.contactFirstName, merchant.contactLastName].filter(Boolean).join(" ").trim();
    return name || merchant.email || merchant.phone || "-";
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="rounded-lg border border-primary_light1/40 bg-gradient-to-br from-blue-50 to-white px-8 py-4 text-xs leading-6 text-dark-grey">
        A <strong>Merchant</strong> is a bank merchant account under this Company. Add as many as you need — each gets its own processing configuration on the next step.
      </div>
      {touched && merchants.length === 0 && (
        <Alert variant="error">At least one merchant is required.</Alert>
      )}

      <StepSection
        title="Add New Merchant"
      >
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="DBA"
            placeholder="Coastline Wellness"
            containerClassName="w-64"
            leftIcon={<Icon name="building" size={15} />}
            value={newDba}
            onChange={(e) => setNewDba(e.target.value)}
          />
          <Input
            label="Alias"
            placeholder="coastline-wellness"
            containerClassName="w-64"
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
          />
          <Button
            icon="plus"
            iconPosition="left"
            disabled={!newDba.trim() || !newAlias.trim()}
            onClick={addMerchant}
          >
            Add Merchant
          </Button>
        </div>
      </StepSection>

      <>
        <DividerTitle
          title={<div className="flex gap-5">
          <span>Merchants</span>
          <span className="text-[11px] font-bold tracking-wider text-medium-grey/70 ">
            <span className="text-[11px] ml-4">
              {merchants.length} {merchants.length === 1 ? "Merchant" : "Merchants"}
            </span>
          </span>
        </div>
        }
        />
        <div className="border border-divider rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-divider2 border-b border-divider">
                {["DBA", "Alias", "Physical Location", "Contact", ""].map((h) => (
                  <th key={h} className="text-left text-xs font-bold text-medium-grey px-4 py-2.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {merchants.length === 0 ? (
                <tr className="bg-white">
                  <td colSpan={5} className="h-[124px] px-4 py-9 text-center text-sm text-medium-grey">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Icon name="building" size={26} className="text-medium-grey" />
                      <span>No merchants yet. Add at least one using the form above.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                merchants.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={clsx(
                      "border-b border-divider last:border-b-0 cursor-pointer transition",
                      selectedId === m.id ? "bg-primary_light2/40" : "hover:bg-divider2/50"
                    )}
                  >
                    <td className="px-4 py-2.5 font-semibold text-dark-grey">{m.dba || "-"}</td>
                    <td className="px-4 py-2.5 text-medium-grey">{m.alias || "-"}</td>
                    <td className="px-4 py-2.5 text-medium-grey">
                      {m.useCompanyMailingAddress ? "Company mailing address" : m.address.city || "Custom"}
                    </td>
                    <td className="px-4 py-2.5 text-medium-grey">{merchantContact(m)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        className="p-1.5 rounded text-light-grey hover:text-error hover:bg-error-bg transition"
                        title="Remove merchant and its profiles"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMerchant(m.id);
                        }}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </>

      <div className="space-y-4">
        <DividerTitle title="Merchant Details" />

        {selected && selectedIndex >= 0 ? (
          <Card className="rounded-xl border border-divider p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-divider pb-4">
              <h3 className="text-base font-bold text-dark-grey">
                {selected.dba || "Merchant"}
              </h3>
              {selected.alias && (
                <span className="font-mono text-xs text-medium-grey">{selected.alias}</span>
              )}
              <span className="rounded bg-primary_light2 px-2 py-1 font-mono text-[10px] font-bold text-primary">
                {`MER-${selected.id.replace(/^mer_/, "").replace(/-/g, "").slice(0, 6).toUpperCase() || "NEW"}`}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <DividerTitle title="Basic Information" />
              <div className="rounded-xl border border-divider p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="DBA"
                    value={selected.dba}
                    onChange={(e) => updateMerchant(selected.id, { dba: e.target.value })}
                    error={err(selectedIndex, "dba")}
                    required
                  />
                  <Input
                    label="Alias"
                    value={selected.alias}
                    onChange={(e) => updateMerchant(selected.id, { alias: e.target.value })}
                    error={err(selectedIndex, "alias")}
                    required
                    helper="Short identifier for this merchant."
                  />
                </div>
              </div>

              <DividerTitle title="Physical Location" />
              <div className="rounded-xl border border-divider p-6">
                <div className="space-y-4">
                  <Checkbox
                    label="Use Company Mailing Address"
                    checked={selected.useCompanyMailingAddress}
                    onChange={(checked) =>
                      updateMerchant(selected.id, { useCompanyMailingAddress: checked })
                    }
                  />
                  {selected.useCompanyMailingAddress ? (
                    <div className="flex items-center gap-2 rounded-md border border-divider bg-divider2/60 px-3 py-2 text-sm text-medium-grey">
                      <Icon name="building" size={14} className="shrink-0 text-light-grey" />
                      <span>
                        {session.company.mailingAddress.line1
                          ? [
                              session.company.mailingAddress.line1,
                              session.company.mailingAddress.city,
                              session.company.mailingAddress.state,
                              session.company.mailingAddress.zip,
                            ]
                              .filter(Boolean)
                              .join(", ")
                          : "No Company mailing address entered yet - add it on the Company step."}
                      </span>
                    </div>
                  ) : (
                    <AddressBlock
                      idPrefix={`merchant-address-${selected.id}`}
                      values={selected.address}
                      onChange={(field, value) =>
                        updateMerchant(selected.id, { address: { ...selected.address, [field]: value } })
                      }
                      errors={{
                        line1: err(selectedIndex, "address.line1"),
                        city: err(selectedIndex, "address.city"),
                        state: err(selectedIndex, "address.state"),
                        zip: err(selectedIndex, "address.zip"),
                      }}
                    />
                  )}
                </div>
              </div>

              {/* <DividerTitle title="Merchant Contact" />
              <div className="rounded-xl border border-divider p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Contact First Name"
                    value={selected.contactFirstName}
                    onChange={(e) => updateMerchant(selected.id, { contactFirstName: e.target.value })}
                  />
                  <Input
                    label="Contact Last Name"
                    value={selected.contactLastName}
                    onChange={(e) => updateMerchant(selected.id, { contactLastName: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={selected.email}
                    onChange={(e) => updateMerchant(selected.id, { email: e.target.value })}
                    error={err(selectedIndex, "email")}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={selected.phone}
                    onChange={(e) => updateMerchant(selected.id, { phone: e.target.value })}
                    error={err(selectedIndex, "phone")}
                  />
                </div>
              </div> */}

              <Collapse
                title="Advanced merchant settings"
                subtitle="Limits, custom fields, ACHVerifi, refund policy - most merchants can skip this."
                defaultOpen={false}
                className="border-dashed"
              >
                <AdvancedSettingsPanel
                  advanced={selected.advanced}
                  update={(patch) =>
                    updateMerchant(selected.id, { advanced: { ...selected.advanced, ...patch } })
                  }
                  error={(path) => err(selectedIndex, `advanced.${path}`)}
                />
              </Collapse>
            </div>
          </Card>
        ) : (
          <Card className="rounded-xl border border-divider p-5 shadow-sm">
            <div className="flex min-h-11 items-center justify-center gap-3 text-sm text-medium-grey">
              <Icon name="building" size={18} className="text-medium-grey" />
              <span>Select a merchant from the grid above to view and edit its settings.</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
