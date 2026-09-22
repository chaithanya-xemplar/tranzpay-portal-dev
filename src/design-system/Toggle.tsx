import { forwardRef } from "react";
import clsx from "clsx";

interface ToggleProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: React.ReactNode;
  onChange?: (checked: boolean) => void;
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, onChange, className, checked, disabled, ...props }, ref) => {
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
          role="switch"
          {...props}
        />
        <span
          className={clsx(
            "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50",
            checked ? "bg-primary" : "bg-gray-300"
          )}
        >
          <span
            className={clsx(
              "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out",
              checked ? "translate-x-4" : "translate-x-0"
            )}
          />
        </span>
        {label && (
          <span className="text-sm text-medium-grey select-none">{label}</span>
        )}
      </label>
    );
  }
);

Toggle.displayName = "Toggle";
export default Toggle;
