import React, { useEffect, useState } from "react";

import {
  AddressBlock,
  Input,
  PersonFields,
  SectionTitle,
  Select,
  Toggle,
} from "../../design-system";
import { TIME_ZONES } from "../../constants/constants";
import { formatPhoneNumber } from "../../utils/formatters";

export interface AccountFormValues {
  accountId?: string;
  companyName: string;
  timeZone: string;
  contactFirstName: string;
  contactLastName: string;
  title: string;
  email: string;
  primaryPhone: string;
  secondaryPhone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  status: boolean;
}

export const defaultAccountFormValues: AccountFormValues = {
  accountId: "",
  companyName: "",
  timeZone: "Eastern",
  contactFirstName: "",
  contactLastName: "",
  title: "Account Owner",
  email: "",
  primaryPhone: "",
  secondaryPhone: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zipCode: "",
  status: true,
};

export interface AccountFormHandle {
  submit: () => void;
  reset: () => void;
}

interface AccountFormProps {
  initialValues?: Partial<AccountFormValues>;
  onSubmit: (values: AccountFormValues) => void;
  formRef?: React.MutableRefObject<AccountFormHandle | null>;
  mode?: "create" | "edit";
}

export default function AccountForm({
  initialValues,
  onSubmit,
  formRef,
  mode = "edit",
}: AccountFormProps) {
  const [values, setValues] = useState<AccountFormValues>({
    ...defaultAccountFormValues,
    ...initialValues,
  });

  useEffect(() => {
    setValues({
      ...defaultAccountFormValues,
      ...initialValues,
    });
  }, [initialValues]);

  const updateField = (field: keyof AccountFormValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setValues({
      ...defaultAccountFormValues,
      ...initialValues,
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSubmit(values);
  };

  useEffect(() => {
    if (formRef) {
      formRef.current = {
        submit: () => onSubmit(values),
        reset: handleReset,
      };
    }
  });

  const fieldClass = "min-w-[220px]";
  const timeZoneOptions = TIME_ZONES.map((zone) => ({
    label: zone,
    value: zone,
  }));

  const addressValues = {
    line1: values.address1,
    line2: values.address2,
    city: values.city,
    state: values.state,
    zip: values.zipCode,
  };

  const personValues = {
    firstName: values.contactFirstName,
    lastName: values.contactLastName,
    title: values.title,
    email: values.email,
    phone: values.primaryPhone,
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-4 py-4">
        <SectionTitle
          title="Account Information"
          subtitle="Create and maintain the primary business contact details."
          action={
            <Toggle
              checked={values.status}
              onChange={(checked) => updateField("status", checked)}
              label={values.status ? "Active" : "Inactive"}
            />
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-divider p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {mode === "edit" && (
          <Input
            label="Account ID"
            id="accountId"
            value={values.accountId ?? ""}
            disabled
            containerClassName={fieldClass}
          />
        )}

        <Input
          label="Company Name"
          id="companyName"
          placeholder="Enter Company Name"
          value={values.companyName}
          onChange={(e) => updateField("companyName", e.target.value)}
          containerClassName={fieldClass}
          required
        />

        <Select
          label="Time Zone"
          id="timeZone"
          placeholder="Select Time Zone"
          options={timeZoneOptions}
          value={values.timeZone}
          onChange={(val) => updateField("timeZone", val)}
          containerClassName={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 border-t border-divider p-5 lg:grid-cols-2 lg:items-start">
        <section>
          <SectionTitle
            title="Personal Details"
            subtitle="Main contact details for the account."
            className="mb-4"
          />
          <PersonFields
            idPrefix="account-contact"
            showTitle={true}
            showPhone={false}
            values={personValues}
            onChange={(field, value) => {
              const fieldMap = {
                firstName: "contactFirstName",
                lastName: "contactLastName",
                title: "title",
                email: "email",
              } as const;

              if (field in fieldMap) {
                updateField(fieldMap[field as keyof typeof fieldMap], value);
              }
            }}
          />

          <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
            <Input
              label="Primary Phone"
              id="primaryPhone"
              placeholder="(___) ___-____"
              value={formatPhoneNumber(values.primaryPhone)}
              onChange={(event) =>
                updateField(
                  "primaryPhone",
                  formatPhoneNumber(event.target.value)
                )
              }
            />

            <Input
              label="Secondary Phone"
              id="secondaryPhone"
              placeholder="(___) ___-____"
              value={formatPhoneNumber(values.secondaryPhone)}
              onChange={(event) =>
                updateField(
                  "secondaryPhone",
                  formatPhoneNumber(event.target.value)
                )
              }
            />
          </div>
        </section>

        <section className="lg:border-l lg:border-divider lg:pl-5">
          <SectionTitle
            title="Address"
            subtitle="Business mailing address for this account."
            className="mb-4"
          />
          <AddressBlock
            idPrefix="account-address"
            values={addressValues}
            onChange={(field, value) => {
              const fieldMap = {
                line1: "address1",
                line2: "address2",
                city: "city",
                state: "state",
                zip: "zipCode",
              } as const;

              updateField(fieldMap[field], value);
            }}
          />
        </section>
      </div>
    </form>
  );
}

