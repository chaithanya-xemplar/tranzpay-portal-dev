import { useState } from "react";
import clsx from "clsx";
import Icon from "./Icon";

interface SecretInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value"> {
  value: string;
  onChange?: (value: string) => void;
  error?: boolean;
  leftIcon?: React.ReactNode;
}

/**
 * Masked input with an eye toggle for secrets (SSNs, gateway passwords,
 * API keys). Renders as type="password" until revealed; autocomplete is off.
 */
export default function SecretInput({
  value,
  onChange,
  error = false,
  leftIcon,
  className,
  disabled,
  readOnly,
  ...props
}: SecretInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={clsx("relative", className)}>
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-light-grey">
          {leftIcon}
        </span>
      )}
      <input
        type={visible ? "text" : "password"}
        autoComplete="off"
        spellCheck={false}
        className={clsx(
          "input-base-form pr-10",
          leftIcon && "pl-10!",
          error && "border-error focus:border-error",
          (disabled || readOnly) && "text-light-grey"
        )}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? "Hide value" : "Show value"}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-light-grey hover:text-dark-grey transition"
      >
        <Icon name={visible ? "eye-off" : "eye"} size={16} />
      </button>
    </div>
  );
}
