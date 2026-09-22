import clsx from "clsx";

export interface TimeValue {
  hour: string;
  minute: string;
  meridiem: "AM" | "PM";
}

interface TimePickerProps {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  /** Trailing label, e.g. a timezone hint ("PT"). */
  suffix?: string;
  hours?: string[];
  minutes?: string[];
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

const DEFAULT_HOURS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const DEFAULT_MINUTES = ["00", "15", "30", "45"];

export default function TimePicker({
  value,
  onChange,
  suffix,
  hours = DEFAULT_HOURS,
  minutes = DEFAULT_MINUTES,
  disabled = false,
  error = false,
  className,
}: TimePickerProps) {
  const selectClass = clsx("input-base-form w-auto", error && "error");

  return (
    <div className={clsx("flex items-center gap-2", disabled && "opacity-50", className)}>
      <select
        aria-label="Hour"
        className={selectClass}
        value={value.hour}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, hour: e.target.value })}
      >
        {hours.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-sm text-light-grey">:</span>
      <select
        aria-label="Minute"
        className={selectClass}
        value={value.minute}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, minute: e.target.value })}
      >
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        aria-label="AM or PM"
        className={selectClass}
        value={value.meridiem}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, meridiem: e.target.value as "AM" | "PM" })}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
      {suffix && <span className="text-xs font-semibold text-light-grey">{suffix}</span>}
    </div>
  );
}
