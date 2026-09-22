import { forwardRef } from "react";
import clsx from "clsx";
import FieldError from "../FieldError";

export type SelectOption = {
  label: string;
  value: string | number;
};

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
  containerClassName?: string;
  /** @deprecated Use className instead */
  selectClassName?: string;
  helper?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      placeholder = "Select",
      onChange,
      className,
      containerClassName,
      selectClassName,
      id,
      helper,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name;

    return (
      <div className={clsx("flex flex-col gap-1", containerClassName)}>
        {label && (
          <label className="label-base" htmlFor={selectId}>
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <div className="select-wrapper">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              "input-base-form select-custom",
              error && "error",
              selectClassName,
              className
            )}
            onChange={(e) => onChange?.(e.target.value)}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {helper && <p className="helper-base">{helper}</p>}
        <FieldError message={error} />
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
