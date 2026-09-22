import { type ReactNode } from "react";
import clsx from "clsx";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export default function SectionTitle({
  title,
  subtitle,
  action,
  className,
}: SectionTitleProps) {
  return (
    <div className={clsx("flex items-center justify-between", className)}>
      <div>
        <h3 className="text-sm font-bold text-dark-grey">{title}</h3>
        {subtitle && (
          <p className="text-xs text-light-grey mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
