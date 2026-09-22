import { type ReactNode } from "react";
import clsx from "clsx";

type PillVariant = "success" | "warning" | "error" | "info" | "neutral" | "primary";

interface PillProps {
  children: ReactNode;
  variant?: PillVariant;
  className?: string;
}

const variantStyles: Record<PillVariant, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-primary_light2 text-primary",
  neutral: "bg-neutral-bg text-medium-grey",
  primary: "bg-primary text-white",
};

export default function Pill({ children, variant = "neutral", className }: PillProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full leading-none",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
