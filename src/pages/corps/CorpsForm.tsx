import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { corpSchema, type CorpFormValues } from "../../schemas/corpsSchema";
import { TIME_ZONES } from "../../constants/constants";
import { formatPhoneNumber } from "../../utils/formatters";
import {
  AddressBlock,
  Input,
  PersonFields,
  SectionTitle,
  Select,
  Toggle,
} from "../../design-system";

interface CorpFormProps {
  initialValues?: Partial<CorpFormValues>;
  onSubmit: (values: CorpFormValues) => Promise<void> | void;
  formRef?: React.RefObject<ReturnType<typeof useForm<CorpFormValues>> | null>;
  mode?: "create" | "edit";
}

export default function CorpForm({
  initialValues,
  onSubmit,
  formRef,
}: CorpFormProps) {
  const form = useForm<CorpFormValues>({
    resolver: zodResolver(corpSchema),
    defaultValues: initialValues ?? {},
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (initialValues) {
      reset(initialValues); // prepopulate form when editing
    }
  }, [initialValues, reset]);

  useEffect(() => {
    if (formRef) {
      formRef.current = form;
    }
  }, [form, formRef]);

  const handleFormSubmit = (data: CorpFormValues) => {
    onSubmit?.(data);
  };

  const fieldClass = "min-w-[220px]";
  const timeZoneOptions = TIME_ZONES.map((zone) => ({
    label: zone,
    value: zone,
  }));
  const values = watch();

  const addressValues = {
    line1: values.address1 ?? "",
    line2: values.address2 ?? "",
    city: values.city ?? "",
    state: values.state ?? "",
    zip: values.zipCode ?? "",
  };

  const personValues = {
    firstName: values.contactFirstName ?? "",
    lastName: values.contactLastName ?? "",
    title: "",
    email: values.email ?? "",
    phone: values.primaryPhone ?? "",
  };

  type CorpTextField =
    | "address1"
    | "address2"
    | "city"
    | "state"
    | "zipCode"
    | "contactFirstName"
    | "contactLastName"
    | "email"
    | "primaryPhone"
    | "secondaryPhone";

  const updateTextField = (field: CorpTextField, value: string) => {
    setValue(field, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="px-4 py-4">
        <SectionTitle
          title="Corp Information"
          subtitle="Create and maintain the primary business contact details."
          action={
            initialValues?.corporateId ? (
              <Controller
                name="userStatus"
                control={form.control}
                render={({ field }) => (
                  <Toggle
                    checked={!!field.value}
                    onChange={field.onChange}
                    label={form.watch("userStatus") ? "Active" : "Inactive"}
                  />
                )}
              />
            ) : null
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-5 border-t border-divider">
        <Input
          label="Company Name"
          id="companyName"
          placeholder="Enter Company Name"
          error={errors.companyName?.message}
          containerClassName={fieldClass}
          {...register("companyName")}
        />

        <Controller
          name="timeZone"
          control={control}
          render={({ field }) => (
            <Select
              label="Time Zone"
              id="timeZone"
              placeholder="Select Time Zone"
              options={timeZoneOptions}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.timeZone?.message}
              containerClassName={fieldClass}
            />
          )}
        />
      </div>
<div className="grid grid-cols-2 gap-5 border-t border-divider p-5 lg:grid-cols-2 lg:items-start">
{/* <div className="flex flex-col gap-5 border-t border-divider p-5"> */}
      <section>
          <SectionTitle
            title="Personal Details"
            subtitle="Main contact details for the corp account."
            className="mb-4"
          />
          <PersonFields
            idPrefix="corp-contact"
            showTitle={false}
            showPhone={false}
            values={personValues}
            errors={{
              firstName: errors.contactFirstName?.message,
              lastName: errors.contactLastName?.message,
              email: errors.email?.message,
            }}
            onChange={(field, value) => {
              const fieldMap = {
                firstName: "contactFirstName",
                lastName: "contactLastName",
                email: "email",
              } as const;

              if (field === "title" || field === "phone") return;
              updateTextField(fieldMap[field], value);
            }}
          />

          <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
            <Input
              label="Primary Phone"
              id="primaryPhone"
              placeholder="(___) ___-____"
              error={errors.primaryPhone?.message}
              {...register("primaryPhone")}
              value={formatPhoneNumber(values.primaryPhone ?? "")}
              onChange={(event) =>
                updateTextField(
                  "primaryPhone",
                  formatPhoneNumber(event.target.value)
                )
              }
            />

            <Input
              label="Secondary Phone"
              id="secondaryPhone"
              placeholder="(___) ___-____"
              error={errors.secondaryPhone?.message}
              {...register("secondaryPhone")}
              value={formatPhoneNumber(values.secondaryPhone ?? "")}
              onChange={(event) =>
                updateTextField(
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
            subtitle="Business mailing address for this corp."
            className="mb-4"
          />
          <AddressBlock
            idPrefix="corp-address"
            values={addressValues}
            errors={{
              line1: errors.address1?.message,
              line2: errors.address2?.message,
              city: errors.city?.message,
              state: errors.state?.message,
              zip: errors.zipCode?.message,
            }}
            onChange={(field, value) => {
              const fieldMap = {
                line1: "address1",
                line2: "address2",
                city: "city",
                state: "state",
                zip: "zipCode",
              } as const;

              updateTextField(fieldMap[field], value);
            }}
          />
        </section>
      </div>
    </form>
  );
}
