import { Field, Icon, Input, SecretInput, Select, ToggleRow } from "../../../../../design-system";
import type { AchVerifiSettings } from "../../../model/types";

interface AchVerifiSectionProps {
  value: AchVerifiSettings;
  onChange: (patch: Partial<AchVerifiSettings>) => void;
  error: (path: string) => string | undefined;
}

/** ACHVerifi pre-validation: shared credentials by default, custom per merchant. */
export default function AchVerifiSection({ value, onChange, error }: AchVerifiSectionProps) {
  return (
    <div className="space-y-4">
      <ToggleRow
        label="Enable ACHVerifi"
        description="Pre-validate ACH accounts before sending."
        checked={value.enabled}
        onChange={(enabled) => onChange({ enabled })}
      />
      {value.enabled && (
        <div className="pl-4 border-l-2 border-divider space-y-4">
          <Field
            label="Account"
            helper="Most merchants use the default shared credentials. Choose Custom only if this merchant has its own ACHVerifi account."
          >
            <Select
              options={[
                { value: "default", label: "Use default account" },
                { value: "custom", label: "Custom account…" },
              ]}
              value={value.accountMode}
              onChange={(accountMode) =>
                onChange({ accountMode: accountMode as AchVerifiSettings["accountMode"] })
              }
            />
          </Field>
          {value.accountMode === "default" ? (
            <p className="flex items-center gap-2 text-sm text-medium-grey">
              <Icon name="check" size={15} className="text-success" />
              Using shared ACHVerifi credentials. No setup required.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Username"
                autoComplete="off"
                value={value.username}
                onChange={(e) => onChange({ username: e.target.value })}
                error={error("achVerifi.username")}
              />
              <Field
                label="Password"
                error={error("achVerifi.password")}
                helper={
                  value.passwordSet && !value.password
                    ? "A credential is saved for this draft — re-enter to change. Credentials are never stored in the browser."
                    : "Credentials are never stored in the browser."
                }
              >
                <SecretInput
                  value={value.password}
                  onChange={(password) =>
                    onChange({ password, passwordSet: password.length > 0 || value.passwordSet })
                  }
                  placeholder={value.passwordSet && !value.password ? "•••••••• (saved)" : ""}
                  error={Boolean(error("achVerifi.password"))}
                />
              </Field>
              <Input
                label="Account ID"
                placeholder="ACC-000000"
                value={value.accountId}
                onChange={(e) => onChange({ accountId: e.target.value })}
                error={error("achVerifi.accountId")}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
