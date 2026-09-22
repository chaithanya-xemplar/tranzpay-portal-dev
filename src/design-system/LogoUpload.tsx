import { useState, useRef, useCallback, type ChangeEvent } from "react";
import clsx from "clsx";
import Icon from "./Icon";
import Field from "./Field";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif"];
const MAX_SIZE = 1 * 1024 * 1024; // 1MB

interface LogoUploadProps {
  label?: string;
  value: string | null;
  onChange: (base64: string | null) => void;
  error?: string;
  helper?: string;
  disabled?: boolean;
  className?: string;
}

export default function LogoUpload({
  label,
  value,
  onChange,
  error,
  helper,
  disabled,
  className,
}: LogoUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndRead = useCallback(
    (file: File) => {
      setValidationError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setValidationError("Only JPG, JPEG, GIF, or PNG files are accepted.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setValidationError("File must be 1 MB or smaller.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndRead(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) validateAndRead(file);
    },
    [validateAndRead]
  );

  const handleRemove = () => {
    onChange(null);
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayError = error ?? validationError ?? undefined;

  return (
    <Field label={label} error={displayError} helper={helper} className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={clsx(
          "relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg px-4 py-3 text-center transition cursor-pointer",
          dragOver
            ? "border-primary bg-primary_light2"
            : "border-divider bg-[var(--control-fill)] hover:border-primary_light1",
          disabled && "opacity-50 pointer-events-none",
          value && "border-success bg-success-bg"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.gif"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled}
        />

        {value ? (
          <>
            <img
              src={value}
              alt="Logo preview"
              className="max-h-24 max-w-full object-contain mb-2"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              disabled={disabled}
              className="flex items-center gap-1 text-xs text-error hover:text-error/80 font-semibold mt-1"
            >
              <Icon name="trash" size={14} />
              Remove
            </button>
          </>
        ) : (
          <>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-divider bg-white">
              <Icon name="upload" size={20} className="text-medium-grey" />
            </span>
            <p className="text-sm font-normal text-secondary">
              <span className="font-semibold text-primary">Click to upload</span>
              {" or drag and drop"}
            </p>
            <p className="mt-1 font-mono text-[11px] font-normal tracking-wide text-secondary/80">
              JPG, JPEG, GIF or PNG · Max 1 MB · 200 × 50 px
            </p>
          </>
        )}
      </div>
    </Field>
  );
}
