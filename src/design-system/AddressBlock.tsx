import clsx from "clsx";
import Field from "./Field";
import { US_STATES } from "../constants/constants";

export interface AddressValues {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressBlockProps {
  values: AddressValues;
  onChange: (field: keyof AddressValues, value: string) => void;
  errors?: Partial<Record<keyof AddressValues, string>>;
  idPrefix?: string;
}

export default function AddressBlock({ values, onChange, errors, idPrefix = "addr" }: AddressBlockProps) {
  const fieldId = (field: keyof AddressValues) => `${idPrefix}-${field}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-5 gap-y-3">
      <Field className="sm:col-span-4" label="Address Line 1" required error={errors?.line1} id={fieldId("line1")}>
        <input
          id={fieldId("line1")}
          className={clsx("input-base-form", errors?.line1 && "error")}
          placeholder="123 Main St"
          value={values.line1}
          onChange={(event) => onChange("line1", event.target.value)}
        />
      </Field>
      <Field className="sm:col-span-4" label="Address Line 2" error={errors?.line2} id={fieldId("line2")}>
        <input
          id={fieldId("line2")}
          className={clsx("input-base-form", errors?.line2 && "error")}
          placeholder="Suite 200"
          value={values.line2}
          onChange={(event) => onChange("line2", event.target.value)}
        />
      </Field>
      <Field className="sm:col-span-2" label="City" required error={errors?.city} id={fieldId("city")}>
        <input
          id={fieldId("city")}
          className={clsx("input-base-form", errors?.city && "error")}
          placeholder="Charleston"
          value={values.city}
          onChange={(event) => onChange("city", event.target.value)}
        />
      </Field>
      <Field label="State" required error={errors?.state} id={fieldId("state")}>
        <div className="select-wrapper">
          <select
            id={fieldId("state")}
            className={clsx("input-base-form select-custom", errors?.state && "error")}
            value={values.state}
            onChange={(event) => onChange("state", event.target.value)}
          >
            <option value="">Select</option>
            {US_STATES.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
        </div>
      </Field>
      <Field label="ZIP" required error={errors?.zip} id={fieldId("zip")}>
        <input
          id={fieldId("zip")}
          className={clsx("input-base-form", errors?.zip && "error")}
          placeholder="29401"
          value={values.zip}
          onChange={(event) => onChange("zip", event.target.value)}
          maxLength={10}
        />
      </Field>
    </div>
  );
}
