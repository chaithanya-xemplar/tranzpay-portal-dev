import { forwardRef } from "react";
import clsx from "clsx";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: React.ReactNode;
  onChange?: (checked: boolean) => void;
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, onChange, className, disabled, checked, indeterminate, ...props }, ref) => {
    return (
      <label
        className={clsx(
          "inline-flex items-center gap-2",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only peer"
          {...props}
        />
        <span
          className={clsx(
            "w-5 h-5 flex items-center justify-center rounded border-2 shrink-0 transition-colors",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50",
            checked || indeterminate
              ? "bg-primary border-primary text-white"
              : "border-light-grey bg-white",
            disabled && "bg-neutral-bg border-divider"
          )}
        >
          {indeterminate ? (
            <span className="w-2.5 h-0.5 bg-white rounded-full" />
          ) : checked ? (
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
        {label && (
          <span className="text-sm text-medium-grey select-none">{label}</span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
export default Checkbox;
