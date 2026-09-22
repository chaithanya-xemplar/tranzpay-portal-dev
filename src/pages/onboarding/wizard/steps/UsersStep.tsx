import { useState } from "react";
import clsx from "clsx";
import { Alert, Button, Checkbox, DividerTitle, Field, Icon, Input, Pill, Toggle } from "../../../../design-system";
import { USER_TEMPLATES, userTemplateLabel } from "../../model/constants";
import { createUser } from "../../model/defaults";
import type { OnboardingUser } from "../../model/types";
import ApiKeyField from "../components/ApiKeyField";
import type { StepProps } from "../stepProps";

function TemplateSelect({
  value,
  onChange,
  error,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}) {
  return (
    <Field label={label} error={error}>
      <div className="select-wrapper">
        <select
          className={clsx("input-base-form select-custom", error && "error")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select a template</option>
          {USER_TEMPLATES.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </Field>
  );
}

export default function UsersStep({ session, patch, fieldErrors }: StepProps) {
  const { users } = session;
  const [draft, setDraft] = useState({ firstName: "", lastName: "", email: "", templateId: "", active: true });
  const [selectedId, setSelectedId] = useState<string | null>(users[0]?.id ?? null);
  const touched = session.visitedSteps.includes("users");
  const err = (index: number, path: string) =>
    touched ? fieldErrors[`users.${index}.${path}`] : undefined;

  const canAdd = Boolean(draft.firstName.trim() && draft.lastName.trim() && draft.email.trim() && draft.templateId);

  const addUser = () => {
    const user = createUser(draft);
    patch((d) => ({ ...d, users: [...d.users, user] }));
    setDraft({ firstName: "", lastName: "", email: "", templateId: "", active: true });
    setSelectedId(user.id);
  };

  const updateUser = (id: string, updates: Partial<OnboardingUser>) => {
    patch((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...updates } : u)) }));
  };

  const removeUser = (id: string) => {
    patch((d) => ({ ...d, users: d.users.filter((u) => u.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = users.find((u) => u.id === selectedId) ?? null;
  const selectedIndex = selected ? users.findIndex((u) => u.id === selected.id) : -1;

  return (
    <div className="space-y-5 max-w-5xl">
      {touched && users.length === 0 && <Alert variant="error">At least one user is required.</Alert>}

      <section className="space-y-4">
        <DividerTitle title="Add New User" />
        <div className="rounded-lg bg-white px-4 py-6 shadow-sm">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="First Name"
                placeholder="Renee"
                value={draft.firstName}
                onChange={(e) => setDraft((p) => ({ ...p, firstName: e.target.value }))}
              />
              <Input
                label="Last Name"
                placeholder="Park"
                value={draft.lastName}
                onChange={(e) => setDraft((p) => ({ ...p, lastName: e.target.value }))}
              />
              <Input
                label="Email"
                type="email"
                placeholder="renee@company.com"
                leftIcon={<Icon name="mail" size={16} />}
                value={draft.email}
                onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TemplateSelect
                label="Profile Template"
                value={draft.templateId}
                onChange={(templateId) => setDraft((p) => ({ ...p, templateId }))}
              />
              <Field label="Status">
                {/* height tracks the shared control height so this aligns with sibling inputs */}
                <div className="flex h-[var(--control-h-44)] items-center gap-2">
                  <Toggle
                    checked={draft.active}
                    onChange={(active) => setDraft((p) => ({ ...p, active }))}
                  />
                  <span className={clsx("flex items-center gap-1 text-sm font-semibold", draft.active ? "text-success" : "text-light-grey")}>
                    <span className={clsx("h-2 w-2 rounded-full", draft.active ? "bg-success" : "bg-light-grey")} />
                    {draft.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </Field>
            </div>
            <div className="flex justify-start">
              <Button
                icon="plus"
                iconPosition="left"
                disabled={!canAdd}
                onClick={addUser}
                className="w-full sm:w-auto"
              >
                Add User
              </Button>
            </div>
          </div>
        </div>
      </section>


      <DividerTitle
        title={<div className="flex gap-5">
          <span>User Details</span>
          <span className="text-[11px] font-bold tracking-wider text-medium-grey/70 ">
            {users.length} {users.length === 1 ? "User" : "Users"}
          </span>
        </div>
        }
      />
      <div className="border border-divider rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-divider2 border-b border-divider">
              {["Name", "Email", "Profile / Template", "Status", "API Access", ""].map((h) => (
                <th key={h} className="text-left text-xs font-bold text-medium-grey px-4 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              <>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedId(u.id)}
                    className={clsx(
                      "border-b border-divider last:border-b-0 cursor-pointer transition",
                      selectedId === u.id ? "bg-primary_light2/40" : "hover:bg-divider2/50"
                    )}
                  >
                    <td className="truncate px-4 py-2.5 font-semibold text-dark-grey">
                      {`${u.firstName} ${u.lastName}`.trim() || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-medium-grey">{u.email || "—"}</td>
                    <td className="px-4 py-2.5 text-medium-grey">{userTemplateLabel(u.templateId)}</td>
                    <td className="px-4 py-2.5">
                      <Pill variant={u.active ? "success" : "neutral"}>{u.active ? "Active" : "Inactive"}</Pill>
                    </td>
                    <td className="px-4 py-2.5 text-medium-grey">{u.apiAccess ? "Yes" : "No"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUser(u.id);
                        }}
                        className="p-1.5 rounded text-light-grey hover:text-error hover:bg-error-bg transition"
                        title="Remove"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

              </>) : (
              <>
                <tr>
                  <td colSpan={6} className="h-[124px] px-4 py-9 text-center text-sm text-medium-grey">
                    <div className="flex flex-col items-center justify-center gap-3 text-sm text-medium-grey">
                      <Icon name="user" size={26} className="text-medium-grey" />
                      <span className=" text-md text-dark-grey/60">No users yet. Add at least one using the form above.</span>
                    </div>
                  </td>
                </tr>
              </>
            )}

          </tbody>
        </table>
      </div>

      <DividerTitle
        title={<div className="flex gap-5">
          <span>User Details</span>
        </div>
        }
      />
        {selected && selectedIndex >= 0 ? (
          <section className="space-y-4">
            <div className="rounded-lg bg-white px-4 py-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-base font-bold text-dark-grey">
                    {`${selected.firstName} ${selected.lastName}`.trim() || "User"}
                  </h3>
                  <span className="rounded-full bg-primary_light2 px-2.5 py-1 text-[11px] font-bold text-primary">
                    {userTemplateLabel(selected.templateId)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle
                    checked={selected.active}
                    onChange={(active) => updateUser(selected.id, { active })}
                  />
                  <span className={clsx("flex items-center gap-1 text-sm font-semibold", selected.active ? "text-success" : "text-light-grey")}>
                    <span className={clsx("h-2 w-2 rounded-full", selected.active ? "bg-success" : "bg-light-grey")} />
                    {selected.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-divider pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="First Name"
                    value={selected.firstName}
                    onChange={(e) => updateUser(selected.id, { firstName: e.target.value })}
                    error={err(selectedIndex, "firstName")}
                  />
                  <Input
                    label="Last Name"
                    value={selected.lastName}
                    onChange={(e) => updateUser(selected.id, { lastName: e.target.value })}
                    error={err(selectedIndex, "lastName")}
                  />
                  <Input
                    label="Email"
                    type="email"
                    leftIcon={<Icon name="mail" size={16} />}
                    value={selected.email}
                    onChange={(e) => updateUser(selected.id, { email: e.target.value })}
                    error={err(selectedIndex, "email")}
                  />
                  <div className="sm:col-span-2 max-w-xs">
                    <TemplateSelect
                      label="Profile Template"
                      value={selected.templateId}
                      onChange={(templateId) => updateUser(selected.id, { templateId })}
                      error={err(selectedIndex, "templateId")}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-divider pt-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dark-grey">
                  <Icon name="lock" size={13} className="text-medium-grey" />
                  Security & Integration Settings
                </div>
                <Checkbox
                  label="Enable API Key Access"
                  checked={selected.apiAccess}
                  onChange={(apiAccess) => updateUser(selected.id, { apiAccess })}
                />
                {selected.apiAccess && (
                  <ApiKeyField
                    apiKey={selected.apiKey}
                    onChange={(apiKey) => updateUser(selected.id, { apiKey })}
                  />
                )}
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="flex items-center justify-center gap-3 text-sm text-medium-grey bg-white rounded-lg border border-divider py-8">
              <span><Icon name="user" size={18} className="mt-0.5 shrink-0 text-light-grey" /></span>
              <span><p className="text-xs text-light-grey">Select a user from the grid above to view and edit their settings.</p></span>
            </div>
          </>
        )}

    </div>
  );
}
