import { AddressBlock, Combobox, Icon, Input, PersonFields, SegmentToggle } from "../../../../design-system";
import { useAccountOptions } from "../../../../services/onboarding/onboardingApi";
import { formatPhoneNumber } from "../../../../utils/formatters";
import { createAddress, createPerson } from "../../model/defaults";
import type { AddressValues, PersonValues } from "../../model/types";
import StepSection from "../components/StepSection";
import type { StepProps } from "../stepProps";

export default function AccountStep({ session, patch, fieldErrors }: StepProps) {
  const { account } = session;
  const { data: accountOptions = [] } = useAccountOptions();
  const touched = session.visitedSteps.includes("account");
  const err = (path: string) => (touched ? fieldErrors[`account.${path}`] : undefined);

  const setMode = (mode: "existing" | "new") => {
    if (mode === account.mode) return;

    patch((d) => ({
      ...d,
      account: {
        mode,
        existing: null,
        newAccount: { name: "", contact: createPerson(), address: createAddress() },
      },
    }));
  };

  const selectExisting = (id: string) => {
    const selected = accountOptions.find((a) => a.id === id) ?? null;
    patch((d) => ({ ...d, account: { ...d.account, existing: selected } }));
  };

  const setNewAccount = (updates: Partial<{ name: string; contact: PersonValues; address: AddressValues }>) => {
    patch((d) => ({
      ...d,
      account: { ...d.account, newAccount: { ...d.account.newAccount, ...updates } },
    }));
  };

  const contact = account.existing?.contact;
  const existingAddress = account.existing?.address;
  const existingAddressLabel = existingAddress
    ? [existingAddress.line1, existingAddress.city, existingAddress.state, existingAddress.zip]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="rounded-lg border border-primary_light1/40 bg-gradient-to-br from-blue-50 to-white px-8 py-4 text-xs leading-6 text-dark-grey">
        An <strong>Account</strong> is a group of Companies - effectively a Company Group. Every onboarding belongs to
        exactly one Account. Pick an existing Account or create a new one.
      </div>

      <StepSection title="Account">
        <SegmentToggle
          options={[
            { label: "Select existing", value: "existing", icon: "search" },
            { label: "Create new", value: "new", icon: "plus" },
          ]}
          value={account.mode}
          onChange={setMode}
        />

        {account.mode === "existing" ? (
          <div className="mt-4 space-y-4">
            <Combobox
              label="Account Name"
              required
              placeholder="Search accounts by name..."
              options={accountOptions.map((a) => ({ label: a.name, value: a.id }))}
              value={account.existing?.id ?? ""}
              onChange={selectExisting}
              error={err("existing") && "An Account must be selected."}
            />
            {account.existing && (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-divider bg-divider2/70 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary">
                    <Icon name="layers" size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-dark-grey">{account.existing.name}</p>
                    <p className="font-mono text-xs text-medium-grey">
                      {account.existing.id} - existing Account
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                  Selected
                </span>
              </div>
            )}
            <p className="text-xs text-light-grey">Start typing to filter across all existing Accounts.</p>
          </div>
        ) : (
          <div className="mt-4">
            <Input
              label="Account Name"
              placeholder="Atlas Holdings Group"
              value={account.newAccount.name}
              onChange={(e) => setNewAccount({ name: e.target.value })}
              error={err("newAccount.name")}
              required
            />
          </div>
        )}
      </StepSection>

      {account.mode === "existing" ? (
        account.existing && contact ? (
          <StepSection title="Primary Contact">
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-md border border-divider bg-divider2/70 px-4 py-3 text-sm text-medium-grey">
                <Icon name="lock" size={15} className="mt-0.5 shrink-0 text-light-grey" />
                <p>
                  This Account already exists. Its contact details are read-only here - edit them from{" "}
                  <strong className="text-dark-grey">Admin &gt; Accounts</strong>.
                </p>
              </div>
              <dl className="text-sm">
                {[
                  ["Name", `${contact.firstName} ${contact.lastName}`.trim() || "-"],
                  ["Title", contact.title || "-"],
                  ["Email", contact.email || "-"],
                  ["Phone", formatPhoneNumber(contact.phone) || "-"],
                  ["Address", existingAddressLabel || "-"],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[10rem_1fr] border-b border-divider py-2 last:border-b-0">
                    <dt className="text-xs font-medium text-light-grey">{label}</dt>
                    <dd className="font-semibold text-dark-grey">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </StepSection>
        ) : (
        <>
          <StepSection title="Primary Contact">
            <div className="flex items-center justify-center gap-3 text-sm text-medium-grey">
              <span><Icon name="user" size={18} className="mt-0.5 shrink-0 text-light-grey" /></span>
                <span><p className="text-xs text-light-grey">Select an existing Account above to view its primary contact.</p></span>
            </div>
          </StepSection>
        </>
      ) ): (
        <>
          <StepSection title="Primary Contact">
            <p className="text-xs text-light-grey pb-3">The person responsible for this Account. Used for account-level correspondence.</p>
            <PersonFields
              values={account.newAccount.contact}
              onChange={(field, value) =>
                setNewAccount({ contact: { ...account.newAccount.contact, [field]: value } })
              }
              errors={{
                firstName: err("newAccount.contact.firstName"),
                lastName: err("newAccount.contact.lastName"),
                email: err("newAccount.contact.email"),
                phone: err("newAccount.contact.phone"),
              }}
            />
          </StepSection>
          <StepSection title="Contact Address">
            <AddressBlock
              idPrefix="account-address"
              values={account.newAccount.address}
              onChange={(field, value) =>
                setNewAccount({ address: { ...account.newAccount.address, [field]: value } })
              }
              errors={{
                line1: err("newAccount.address.line1"),
                city: err("newAccount.address.city"),
                state: err("newAccount.address.state"),
                zip: err("newAccount.address.zip"),
              }}
            />
          </StepSection>
        </>
      )}
    </div>
  );
}
