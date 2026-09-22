import clsx from "clsx";
import { Icon } from "../../../../../design-system";

interface ChipPickerProps {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}

/** Toggleable chip row (Required Custom Fields suggestions). */
export default function ChipPicker({ options, selected, onToggle }: ChipPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option)}
            className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition",
              active
                ? "border-primary bg-primary_light2/40 text-primary"
                : "border-divider text-medium-grey hover:border-light-grey hover:text-dark-grey"
            )}
          >
            <Icon name={active ? "check" : "plus"} size={12} />
            {option}
          </button>
        );
      })}
    </div>
  );
}
