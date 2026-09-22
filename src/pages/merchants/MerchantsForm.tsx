import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  merchantSchema,
  type MerchantFormValues,
} from "../../schemas/merchantsSchema";
import { TIME_ZONES } from "../../constants/constants";
import { formatPhoneNumber } from "../../utils/formatters";
import {
  AddressBlock,
  Button,
  Input,
  PersonFields,
  SectionTitle,
  Select,
  Toggle,
} from "../../design-system";

interface CorpDetails {
  corporateId: number;
  corpName: string;
}

interface MerchantsFormProps {
  initialValues?: Partial<MerchantFormValues>;
  onSubmit: (values: MerchantFormValues) => Promise<void> | void;
  mode?: "create" | "edit";
  corpDetails?: CorpDetails;
  isSubmitting?: boolean;
}

export default function MerchantsForm({
  initialValues,
  onSubmit,
  mode = "create",
  corpDetails,
  isSubmitting,
}: MerchantsFormProps) {
  const corpName = corpDetails?.corpName ?? "";
  const defaultValues = {
    ...initialValues,
    addProducerToTrack: initialValues?.addProducerToTrack ?? corpName,
  } as MerchantFormValues;

  const form = useForm<MerchantFormValues>({
    resolver: zodResolver(merchantSchema),
    defaultValues,
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
      reset({
        ...initialValues,
        addProducerToTrack: initialValues.addProducerToTrack ?? corpName,
      } as MerchantFormValues);
    } else {
      setValue("addProducerToTrack", corpName, { shouldDirty: false });
    }
  }, [initialValues, corpName, reset, setValue]);

  const handleReset = () => {
    if (mode === "edit" && initialValues) {
      reset(initialValues as MerchantFormValues);
    } else {
      reset({
        addProducerToTrack: corpName,
      } as MerchantFormValues);
    }
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

  type MerchantTextField =
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

  const updateTextField = (field: MerchantTextField, value: string) => {
    setValue(field, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="px-4 py-4">
        <SectionTitle
          title="Basic Information"
          subtitle="Create and maintain the merchant account details."
          action={
            <div className="flex flex-wrap items-center justify-end gap-3">
              {mode === "edit" && initialValues?.merchantId && (
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
              )}

              <Button
                variant="outline"
                className="cursor-pointer border text-sm font-semibold"
                icon="refresh"
                iconPosition="left"
                onClick={handleReset}
                type="button"
              >
                Reset
              </Button>

              <Button
                variant="primary"
                className="cursor-pointer border text-sm font-semibold"
                icon="save"
                iconPosition="left"
                type="submit"
                disabled={isSubmitting}
              >
                {mode === "create" ? "Submit" : "Save"}
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-divider p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <Input
          label="Company Name"
          id="companyName"
          placeholder="Company Name"
          error={errors.companyName?.message}
          containerClassName={fieldClass}
          {...register("companyName")}
        />

        <Input
          label="Corp Account"
          id="addProducerToTrack"
          readOnly
          error={errors.addProducerToTrack?.message}
          containerClassName={fieldClass}
          {...register("addProducerToTrack")}
        />

        {mode !== "create" && (
          <Input
            label="Integration"
            id="integration"
            readOnly={mode === "edit"}
            placeholder="Enter Integration"
            error={errors.integration?.message}
            containerClassName={fieldClass}
            {...register("integration")}
          />
        )}

        <Input
          label="Tranzpay Identifier"
          id="tranzpayIdentifier"
          placeholder="Enter Tranzpay Identifier"
          error={errors.tranzpayIdentifier?.message}
          containerClassName={fieldClass}
          {...register("tranzpayIdentifier")}
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
            subtitle="Main contact details for the merchant account."
            className="mb-4"
          />
          <PersonFields
            idPrefix="merchant-contact"
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
            subtitle="Business mailing address for this merchant."
            className="mb-4"
          />
          <AddressBlock
            idPrefix="merchant-address"
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
