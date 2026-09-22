import { type ReactNode } from "react";
import clsx from "clsx";

interface FieldProps {
  children: ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
  helper?: string;
  id?: string;
  className?: string;
}

export default function Field({
  children,
  label,
  required,
  error,
  helper,
  id,
  className,
}: FieldProps) {
  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      {label && (
        <label htmlFor={id} className="label-base">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="error-base">{error}</p>}
      {helper && !error && <p className="helper-base mt-0.5">{helper}</p>}
    </div>
  );
}
