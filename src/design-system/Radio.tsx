import { forwardRef } from "react";
import clsx from "clsx";

interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: React.ReactNode;
  onChange?: (value: string) => void;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, onChange, className, value, checked, disabled, ...props }, ref) => {
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
          type="radio"
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className="sr-only peer"
          {...props}
        />
        <span
          className={clsx(
            "w-5 h-5 flex items-center justify-center rounded-full border-2 shrink-0 transition-colors",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50",
            checked
              ? "border-primary"
              : "border-light-grey bg-white",
            disabled && "bg-neutral-bg border-divider"
          )}
        >
          {checked && (
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          )}
        </span>
        {label && (
          <span className="text-sm text-medium-grey select-none">{label}</span>
        )}
      </label>
    );
  }
);

Radio.displayName = "Radio";
export default Radio;
