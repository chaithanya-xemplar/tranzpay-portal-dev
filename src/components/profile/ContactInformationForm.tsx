import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  contactInformationSchema,
  type ContactInformationValues,
} from "../../schemas/contactInformationSchema";
// import { useUpdateContactInfo } from "../../services/profile/profileApi";
import FieldError from "../../design-system/FieldError";
import { US_STATES } from "../../constants/constants";
import Button from "../../design-system/Button";
import { formatPhoneNumber } from "../../utils/formatters";

const ContactInformationForm = () => {
  // const mutation = useUpdateContactInfo();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactInformationValues>({
    resolver: zodResolver(contactInformationSchema),
  });

  const values = watch();

  const updatePhoneField = (
    field: "primaryPhone" | "secondaryPhone",
    value: string
  ) => {
    setValue(field, formatPhoneNumber(value), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onSubmit = (data: ContactInformationValues) => {
    // mutation.mutate(data);
    void data;
  };

  const fieldClass = "flex flex-col w-full";

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 pb-8 w-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Contact Information</h2>

        <Button
          variant="primary"
          className="font-semibold text-sm border cursor-pointer"
          icon="save"
          iconPosition="left"
          // disabled={mutation.isPending}
          onClick={handleSubmit(onSubmit)}
        >
          Save
        </Button>
      </div>

      <form
        className="grid gap-4"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        }}
      >

        <fieldset disabled className="contents">
          {/* Company Name */}
          <div className={fieldClass}>
            <label className="label-base" htmlFor="companyName">
              Company Name
            </label>
            <input
              id="companyName"
              {...register("companyName")}
              className={`input-base-form w-full ${errors.companyName ? "error" : ""}`}
              placeholder="Enter Company Name"
            />
            <FieldError message={errors.companyName?.message} />
          </div>

          {/* Address 1 */}
          <div className={fieldClass}>
            <label className="label-base" htmlFor="address1">
              Address Line 1
            </label>
            <input
              id="address1"
              {...register("address")}
              className={`input-base-form w-full ${errors.address ? "error" : ""}`}
              placeholder="Enter Address line 1"
            />
            <FieldError message={errors.address?.message} />
          </div>

          {/* Address 2 */}
          <div className={fieldClass}>
            <label className="label-base" htmlFor="address2">
              Address Line 2
            </label>
            <input
              id="address2"
              {...register("address2")}
              className={`input-base-form w-full ${errors.address2 ? "error" : ""}`}
              placeholder="Enter Address line 2"
            />
            <FieldError message={errors.address2?.message} />
          </div>

          {/* City */}
          <div className={fieldClass}>
            <label className="label-base" htmlFor="city">
              City
            </label>
            <input
              id="city"
              {...register("city")}
              className={`input-base-form w-full ${errors.city ? "error" : ""}`}
              placeholder="Enter City Name"
            />
            <FieldError message={errors.city?.message} />
          </div>

          {/* State */}
          <div className={fieldClass}>
            <label className="label-base" htmlFor="state">
              State
            </label>

            <div className="select-wrapper">
              <select
                id="state"
                {...register("state")}
                className={`input-base-form w-full select-custom ${
                  errors.state ? "error" : ""
                }`}
              >
                <option value="">Select State</option>

                {US_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>

            <FieldError message={errors.state?.message} />
          </div>

          {/* Zip Code */}
          <div className={fieldClass}>
            <label className="label-base" htmlFor="zipCode">
              Zip Code
            </label>

            <input
              id="zipCode"
              {...register("zipCode")}
              className={`input-base-form w-full ${errors.zipCode ? "error" : ""}`}
              placeholder="Enter Zip Code"
            />

            <FieldError message={errors.zipCode?.message} />
          </div>

          {/* Primary Phone */}
          <div className={fieldClass}>
            <label className="label-base" htmlFor="primaryPhone">
              Primary Phone
            </label>

            <input
              id="primaryPhone"
              {...register("primaryPhone")}
              value={formatPhoneNumber(values.primaryPhone ?? "")}
              onChange={(event) =>
                updatePhoneField("primaryPhone", event.target.value)
              }
              className={`input-base-form w-full ${errors.primaryPhone ? "error" : ""}`}
              placeholder="(___) ___-____"
            />

            <FieldError message={errors.primaryPhone?.message} />
          </div>

          {/* Secondary Phone */}
          <div className={fieldClass}>
            <label className="label-base" htmlFor="secondaryPhone">
              Secondary Phone
            </label>

            <input
              id="secondaryPhone"
              {...register("secondaryPhone")}
              value={formatPhoneNumber(values.secondaryPhone ?? "")}
              onChange={(event) =>
                updatePhoneField("secondaryPhone", event.target.value)
              }
              className={`input-base-form w-full ${
                errors.secondaryPhone ? "error" : ""
              }`}
              placeholder="(___) ___-____"
            />

            <FieldError message={errors.secondaryPhone?.message} />
          </div>
      </fieldset>
      </form>
    </div>
  );
};

export default ContactInformationForm;
