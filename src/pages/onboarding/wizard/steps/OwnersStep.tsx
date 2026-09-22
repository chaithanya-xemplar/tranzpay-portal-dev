import { useState } from "react";
import clsx from "clsx";
import { AddressBlock, Alert, Button, Field, Icon, Input } from "../../../../design-system";
import { formatIntegerInput, formatPhoneNumber } from "../../../../utils/formatters";
import { createParentCompany, createPrincipal } from "../../model/defaults";
import type { Owner, ParentCompanyOwner, PrincipalOwner } from "../../model/types";
import OwnershipTotalBar from "../components/OwnershipTotalBar";
import SsnInput from "../components/SsnInput";
import type { StepProps } from "../stepProps";
import StepSection from "../components/StepSection";

export default function OwnersStep({ session, patch, fieldErrors }: StepProps) {
  const { owners } = session;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const touched = session.visitedSteps.includes("owners");
  const err = (index: number, path: string) =>
    touched ? fieldErrors[`owners.${index}.${path}`] : undefined;

  const addOwner = (owner: Owner) => {
    patch((d) => ({ ...d, owners: [...d.owners, owner] }));
    setExpandedId(owner.id);
  };

  const updateOwner = (id: string, updates: Partial<PrincipalOwner> | Partial<ParentCompanyOwner>) => {
    patch((d) => ({
      ...d,
      owners: d.owners.map((o) => (o.id === id ? ({ ...o, ...updates } as Owner) : o)),
    }));
  };

  const removeOwner = (id: string) => {
    patch((d) => ({ ...d, owners: d.owners.filter((o) => o.id !== id) }));
    if (expandedId === id) setExpandedId(null);
  };

  const needsPrincipal = touched && !owners.some((o) => o.kind === "principal");
  const principalCount = owners.filter((owner) => owner.kind === "principal").length;
  const parentCompanyCount = owners.filter((owner) => owner.kind === "parentCompany").length;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="rounded-lg border border-primary_light1/40 bg-gradient-to-br from-blue-50 to-white px-8 py-4 text-xs leading-6 text-dark-grey">
        <strong>List everyone with ownership in this Company.</strong>
        <br />
        At least one <strong>Principal</strong> is required. Add as many Principals and Parent Companies as needed.
      </div>
      {needsPrincipal && <Alert variant="warning">At least one Principal owner is required.</Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[16rem] flex-1 items-center gap-3">
          <span className="h-px w-4 shrink-0 bg-divider" />
          <h3 className="shrink-0 text-xs font-bold uppercase tracking-wider text-medium-grey">
            Owners
          </h3>
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-medium-grey">
            {principalCount} Principal{" · "}{parentCompanyCount} Parent Companies
          </span>
          <span className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon="building"
              iconPosition="left"
              className="border-warning/30 bg-warning-bg text-warning hover:bg-warning-bg/80"
              onClick={() => addOwner(createParentCompany())}
            >
              Add Parent Company
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon="user"
              iconPosition="left"
              onClick={() => addOwner(createPrincipal())}
            >
              Add Principal
            </Button>
          </span>
          <span className="h-px min-w-0 flex-1 bg-divider" />

        </div>

      </div>

      {owners.length > 0 && <OwnershipTotalBar owners={owners} />}

      <div className="border border-divider rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-divider2 border-b border-divider">
              {["Type", "Name", "Ownership", "Contact", ""].map((h) => (
                <th key={h} className={clsx("text-left text-[11px] font-bold uppercase tracking-wider text-medium-grey px-4 py-3", h === "Ownership" && "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {owners.length > 0 ? (
              <>
                {owners.map((owner, i) => {
                const expanded = expandedId === owner.id;
                const name =
                  owner.kind === "principal"
                    ? owner.fullName || "-"
                    : owner.name || owner.fullName || "-";
                const email = owner.contactEmail;
                return (
                  <OwnerRow
                    key={owner.id}
                    owner={owner}
                    index={i}
                    name={name}
                    email={email}
                    expanded={expanded}
                    onToggle={() => setExpandedId(expanded ? null : owner.id)}
                    onRemove={() => removeOwner(owner.id)}
                    onUpdate={(updates) => updateOwner(owner.id, updates)}
                    err={err}
                  />
                );
                })}
              </>
            ) : (
              <tr>
                <td colSpan={5} className="h-[124px] px-4 py-9 text-center text-sm text-medium-grey">
                  <div className="flex flex-col items-center justify-center gap-3 text-sm text-medium-grey">
                    <Icon name="user" size={26} className="text-medium-grey" />
                    <span className="text-md text-dark-grey/60">No owners yet. Add at least one Principal to continue.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface OwnerRowProps {
  owner: Owner;
  index: number;
  name: string;
  email: string;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (updates: Partial<PrincipalOwner> | Partial<ParentCompanyOwner>) => void;
  err: (index: number, path: string) => string | undefined;
}

function OwnerRow({ owner, index, name, email, expanded, onToggle, onRemove, onUpdate, err }: OwnerRowProps) {
  return (
    <>
      <tr
        className={clsx("border-b border-divider last:border-b-0 cursor-pointer transition hover:bg-divider2/50", expanded && "bg-primary_light2/40")}
        onClick={onToggle}
      >
        <td className="px-4 py-4">
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
              owner.kind === "principal"
                ? "bg-primary_light2 text-primary"
                : "bg-warning-bg text-warning"
            )}
          >
            <Icon name={owner.kind === "principal" ? "user" : "building"} size={13} />
            {owner.kind === "principal" ? "Principal" : "Parent Company"}
          </span>
        </td>
        <td className="px-4 py-4 font-semibold text-dark-grey">{name}</td>
        <td className="px-4 py-4 text-right tabular-nums text-medium-grey">{owner.ownershipPct ? `${owner.ownershipPct}%` : "-"}</td>
        <td className="max-w-44 truncate px-4 py-4 text-medium-grey">{email || "-"}</td>
        <td className="px-4 py-4 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-6">
            <button
              type="button"
              className="rounded text-medium-grey transition hover:text-medium-grey"
              title={expanded ? "Collapse" : "Edit"}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              <Icon name={expanded ? "chevron-up" : "edit"} size={15} />
            </button>
            <button
              type="button"
              className="rounded text-medium-grey transition hover:text-error"
              title="Remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-divider last:border-b-0">
          <td colSpan={5} className="px-4 py-4 bg-divider2/40">
            {owner.kind === "principal" ? (
              <PrincipalEditor owner={owner} index={index} onUpdate={onUpdate} err={err} />
            ) : (
              <ParentCompanyEditor owner={owner} index={index} onUpdate={onUpdate} err={err} />
            )}
          </td>
        </tr>
      )}
    </>
  );
}

interface EditorProps<T extends Owner> {
  owner: T;
  index: number;
  onUpdate: (updates: Partial<T>) => void;
  err: (index: number, path: string) => string | undefined;
}

function PrincipalEditor({ owner, index, onUpdate, err }: EditorProps<PrincipalOwner>) {
  return (
    <div>
      <div className="space-y-5 max-w-5xl">
        <StepSection title="Principal Details">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Renee Park"
                leftIcon={<Icon name="user" size={16} />}
                value={owner.fullName}
                onChange={(e) => onUpdate({ fullName: e.target.value })}
                error={err(index, "fullName")}
                required
              />

              <Input
                label="Title"
                placeholder="CEO / Managing Member"
                value={owner.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                error={err(index, "title")}
              />
              <Input
                label="Ownership %"
                placeholder="25"
                inputMode="numeric"
                value={owner.ownershipPct}
                onChange={(e) => onUpdate({ ownershipPct: formatIntegerInput(e.target.value) })}
                error={err(index, "ownershipPct")}
                required
              />
              <Input
                label="Date of Birth"
                type="date"
                value={owner.dob}
                onChange={(e) => onUpdate({ dob: e.target.value })}
                error={err(index, "dob")}
                required
              />
              <Field label="SSN" error={err(index, "ssn")} required>
                <SsnInput
                  ssn={owner.ssn}
                  ssnProvided={owner.ssnProvided}
                  ssnLast4={owner.ssnLast4}
                  onChange={(ssn) => {
                    const digits = ssn.replace(/\D/g, "");
                    onUpdate({ ssn: "", ssnLast4: digits.slice(-4), ssnProvided: digits.length >= 4 });
                  }}
                />
              </Field>
              <Input
                label="Driver's License No."
                placeholder="D1234567"
                value={owner.driversLicense}
                onChange={(e) => onUpdate({ driversLicense: e.target.value })}
              />
            </div>
          </div>
        </StepSection>
      </div>

      <div className="space-y-5 py-4 max-w-5xl">
        <div className="space-y-5 max-w-5xl">
          <StepSection title="Home Address">
            <div>
              <AddressBlock
                idPrefix={`principal-home-address-${owner.id}`}
                values={owner.homeAddress}
                onChange={(field, value) => onUpdate({ homeAddress: { ...owner.homeAddress, [field]: value } })}
                errors={{
                  line1: err(index, "homeAddress.line1"),
                  city: err(index, "homeAddress.city"),
                  state: err(index, "homeAddress.state"),
                  zip: err(index, "homeAddress.zip"),
                }}
              />
            </div>
          </StepSection>
        </div>
      </div>
      <div className="space-y-5  py-4 max-w-5xl">
        <StepSection title="Contact" >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                leftIcon={<Icon name="mail" size={16} />}
                value={owner.contactEmail}
                onChange={(e) => onUpdate({ contactEmail: e.target.value })}
                error={err(index, "contactEmail")}
                placeholder="ops@atlasholdings.com"
                required
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="(843) 555-0142"
                leftIcon={<Icon name="phone" size={16} />}
                value={formatPhoneNumber(owner.contactPhone)}
                onChange={(e) => onUpdate({ contactPhone: formatPhoneNumber(e.target.value) })}
                error={err(index, "contactPhone")}
              />
            </div>
          </div>

        </StepSection>
      </div>
    </div>
  );
}

function ParentCompanyEditor({ owner, index, onUpdate, err }: EditorProps<ParentCompanyOwner>) {
  return (
    <div className="space-y-5 max-w-5xl">
      <StepSection title="Parent Company Details" >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              leftIcon={<Icon name="building" size={16} />}
              placeholder="Atlas Holdings, Inc."
              value={owner.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              error={err(index, "name")}
              required
            />
            <Input
              label="Tax ID (EIN)"
              placeholder="12-3456789"
              leftIcon={<Icon name="shield" size={16} />}
              value={owner.ein}
              onChange={(e) => onUpdate({ ein: e.target.value })}
              error={err(index, "ein")}
              required
            />
            <Input
              label="Ownership %"
              placeholder="25"
              inputMode="numeric"
              value={owner.ownershipPct}
              onChange={(e) => onUpdate({ ownershipPct: formatIntegerInput(e.target.value) })}
              error={err(index, "ownershipPct")}
              required
            />
          </div>
        </div>
      </StepSection>
      <div className="space-y-5 max-w-5xl">
        <StepSection title="Address" >
          <div>
            <AddressBlock
              idPrefix={`parent-company-address-${owner.id}`}
              values={owner.address}
              onChange={(field, value) => onUpdate({ address: { ...owner.address, [field]: value } })}
              errors={{
                line1: err(index, "address.line1"),
                city: err(index, "address.city"),
                state: err(index, "address.state"),
                zip: err(index, "address.zip"),
              }}
            />
          </div>
        </StepSection>
      </div>
      <div className="space-y-5 max-w-5xl">
        <StepSection title="Contact" >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                leftIcon={<Icon name="mail" size={16} />}
                value={owner.contactEmail}
                onChange={(e) => onUpdate({ contactEmail: e.target.value })}
                error={err(index, "contactEmail")}
                placeholder="ops@atlasholdings.com"
                required
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="(843) 555-0142"
                leftIcon={<Icon name="phone" size={16} />}
                value={formatPhoneNumber(owner.contactPhone)}
                onChange={(e) => onUpdate({ contactPhone: formatPhoneNumber(e.target.value) })}
                error={err(index, "contactPhone")}
              />
            </div>
          </div>

        </StepSection>
      </div>
    </div>
  );
}
