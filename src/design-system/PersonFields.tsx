import clsx from "clsx";
import { formatPhoneNumber } from "../utils/formatters";
import Field from "./Field";
import Icon from "./Icon";

export interface PersonValues {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
}

interface PersonFieldsProps {
  values: PersonValues;
  onChange: (field: keyof PersonValues, value: string) => void;
  errors?: Partial<Record<keyof PersonValues, string>>;
  idPrefix?: string;
  showTitle?: boolean;
  showPhone?: boolean;
}

export default function PersonFields({
  values,
  onChange,
  errors,
  idPrefix = "person",
  showTitle = true,
  showPhone = true,
}: PersonFieldsProps) {
  const fieldId = (field: keyof PersonValues) => `${idPrefix}-${field}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
      <Field label="First Name" required error={errors?.firstName} id={fieldId("firstName")}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-light-grey pointer-events-none">
            <Icon name="user" size={16} />
          </span>
          <input
            id={fieldId("firstName")}
            className={clsx("input-base-form pl-10!", errors?.firstName && "error")}
            placeholder="Renee"
            value={values.firstName}
            onChange={(event) => onChange("firstName", event.target.value)}
          />
        </div>
      </Field>
      <Field label="Last Name" required error={errors?.lastName} id={fieldId("lastName")}>
        <input
          id={fieldId("lastName")}
          className={clsx("input-base-form", errors?.lastName && "error")}
          placeholder="Park"
          value={values.lastName}
          onChange={(event) => onChange("lastName", event.target.value)}
        />
      </Field>
      {showTitle && (
        <Field label="Title" error={errors?.title} id={fieldId("title")}>
          <input
            id={fieldId("title")}
            className={clsx("input-base-form", errors?.title && "error")}
            placeholder="Account Owner"
            value={values.title}
            onChange={(event) => onChange("title", event.target.value)}
          />
        </Field>
      )}
      {showPhone && (
        <Field label="Phone" error={errors?.phone} id={fieldId("phone")}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-light-grey pointer-events-none">
              <Icon name="phone" size={16} />
            </span>
            <input
              id={fieldId("phone")}
              type="tel"
              className={clsx("input-base-form pl-10!", errors?.phone && "error")}
              placeholder="(843) 555-0142"
              value={formatPhoneNumber(values.phone)}
              onChange={(event) => onChange("phone", formatPhoneNumber(event.target.value))}
            />
          </div>
        </Field>
       )}
      <Field className="sm:col-span-2" label="Email" required error={errors?.email} id={fieldId("email")}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-light-grey pointer-events-none">
            <Icon name="mail" size={16} />
          </span>
          <input
            id={fieldId("email")}
            type="email"
            className={clsx("input-base-form pl-10!", errors?.email && "error")}
            placeholder="renee@account.com"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
          />
        </div>
      </Field>
    </div>
  );
}
