import clsx from "clsx";
import Toggle from "./Toggle";

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  className,
}: ToggleRowProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between py-3 px-4 border border-divider rounded-lg",
        disabled && "opacity-50",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-dark-grey">{label}</p>
        {description && (
          <p className="text-xs text-light-grey mt-0.5">{description}</p>
        )}
      </div>
      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
