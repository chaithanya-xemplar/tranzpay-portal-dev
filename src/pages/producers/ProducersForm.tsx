// src/pages/ProducersForm.tsx
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  producerSchema,
  type ProducerFormValues,
} from "../../schemas/producersSchema";
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

interface MerchantDetails {
  merchantName: string;
}

interface ProducersFormProps {
  initialValues?: Partial<ProducerFormValues>;
  onSubmit: (values: ProducerFormValues) => Promise<void> | void;
  formRef?: React.RefObject<
    ReturnType<typeof useForm<ProducerFormValues>> | null
  >;
  merchantDetails?: MerchantDetails;
  mode?: "create" | "edit";
}

export default function ProducersForm({
  initialValues,
  onSubmit,
  formRef,
  merchantDetails,
}: ProducersFormProps) {
  const form = useForm<ProducerFormValues>({
    resolver: zodResolver(producerSchema),
    defaultValues: {
      ...initialValues,
      userStatus: initialValues?.userStatus ?? true,
    } as ProducerFormValues,
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

  /* ---------------- Reset on initialValues change ---------------- */
  useEffect(() => {
    if (initialValues) {
      reset({
        ...initialValues,
        userStatus: initialValues?.userStatus ?? true,
      } as ProducerFormValues);
    }
  }, [initialValues, reset]);

  useEffect(() => {
    if (initialValues?.producerId) {
      form.setValue("producerId", initialValues.producerId, {
        shouldValidate: false,
      });
    }
  }, [initialValues?.producerId, form]);

  useEffect(() => {
    if (formRef) {
      formRef.current = form;
    }
  }, [form, formRef]);

  const handleFormSubmit = (data: ProducerFormValues) => {
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
    firstName: values.contactFirst ?? "",
    lastName: values.contactLast ?? "",
    title: "",
    email: values.email ?? "",
    phone: values.primaryPhone ?? "",
  };

  type ProducerTextField =
    | "address1"
    | "address2"
    | "city"
    | "state"
    | "zipCode"
    | "contactFirst"
    | "contactLast"
    | "email"
    | "primaryPhone"
    | "secondaryPhone";

  const updateTextField = (field: ProducerTextField, value: string) => {
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
          title="Producer Information"
          subtitle="Create and maintain the producer account details."
          action={
            initialValues?.merchantId ? (
              <Controller
                name="userStatus"
                control={control}
                render={({ field }) => (
                  <Toggle
                    checked={!!field.value}
                    onChange={field.onChange}
                    label={watch("userStatus") ? "Active" : "Inactive"}
                  />
                )}
              />
            ) : null
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-divider p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <Input
          label="Company Name"
          id="companyName"
          placeholder="Enter Company Name"
          error={errors.companyName?.message}
          containerClassName={fieldClass}
          {...register("companyName")}
        />

        {merchantDetails?.merchantName && (
          <Input
            label="Merchant Account"
            id="merchantAccount"
            value={merchantDetails.merchantName}
            readOnly
            placeholder="Merchant Account"
            containerClassName={fieldClass}
          />
        )}

        <Input
          label="Tranzpay Identifier"
          id="tranzPayIdentifier"
          placeholder="Enter Tranzpay Identifier"
          error={errors.tranzPayIdentifier?.message}
          containerClassName={fieldClass}
          {...register("tranzPayIdentifier")}
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

      <div className="grid grid-cols-1 gap-5 border-t border-divider p-5 lg:grid-cols-2 lg:items-start">
        <section>
          <SectionTitle
            title="Personal Details"
            subtitle="Main contact details for the producer account."
            className="mb-4"
          />
          <PersonFields
            idPrefix="producer-contact"
            showTitle={false}
            showPhone={false}
            values={personValues}
            errors={{
              firstName: errors.contactFirst?.message,
              lastName: errors.contactLast?.message,
              email: errors.email?.message,
            }}
            onChange={(field, value) => {
              const fieldMap = {
                firstName: "contactFirst",
                lastName: "contactLast",
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
            subtitle="Business mailing address for this producer."
            className="mb-4"
          />
          <AddressBlock
            idPrefix="producer-address"
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
