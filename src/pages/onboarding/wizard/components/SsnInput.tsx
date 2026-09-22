import { Icon } from "../../../../design-system";

interface SsnInputProps {
  ssn: string;
  ssnProvided: boolean;
  ssnLast4: string;
  onChange: (ssn: string) => void;
}

/**
 * SSN entry with resume awareness: SSNs are never persisted, so a resumed
 * draft has `ssnProvided` + `ssnLast4` but an empty value. The placeholder
 * signals the saved state; typing supplies a fresh value.
 */
export default function SsnInput({ ssn, ssnProvided, ssnLast4, onChange }: SsnInputProps) {
  const digits = (ssn || ssnLast4).replace(/\D/g, "").slice(-4);
  const maskPrefix = "\u2022\u2022\u2022-\u2022\u2022-";
  const value = digits ? `${maskPrefix}${digits}` : "";
  const placeholder = ssnProvided && ssnLast4 ? `${maskPrefix}${ssnLast4}` : `${maskPrefix}1234`;

  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-light-grey pointer-events-none">
        <Icon name="lock" size={16} />
      </span>
      <input
        type="text"
        autoComplete="off"
        spellCheck={false}
        className="input-base-form pl-11! font-mono tracking-wide"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode="numeric"
        maxLength={11}
      />
    </div>
  );
}
