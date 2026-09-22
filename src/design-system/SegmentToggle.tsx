import clsx from "clsx";
import Icon from "../components/Icon/Icon";
import type { IconName } from "../components/Icon/iconMap";

export interface SegmentToggleOption<T extends string> {
  label: string;
  value: T;
  icon?: IconName;
}

interface SegmentToggleProps<T extends string> {
  options: SegmentToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}

export default function SegmentToggle<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  disabled = false,
  className,
}: SegmentToggleProps<T>) {
  return (
    <div
      role="radiogroup"
      className={clsx(
        "inline-flex items-center gap-0.5 rounded-lg border border-divider bg-divider2 p-0.5",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={clsx(
              "inline-flex items-center justify-center gap-1.5 rounded-md font-semibold transition",
              size === "sm" ? "px-4 py-2.5 text-xs" : "px-4 py-2 text-sm",
              active
                ? "bg-white text-primary shadow-sm"
                : "text-medium-grey hover:text-dark-grey"
            )}
          >
            {opt.icon && <Icon name={opt.icon} size={16} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
