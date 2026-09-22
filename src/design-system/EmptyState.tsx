import { type ReactNode } from "react";
import clsx from "clsx";
import Icon from "./Icon";
import type { IconName } from "./Icon";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon = "file",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-divider2 flex items-center justify-center mb-4">
        <Icon name={icon} size={28} className="text-light-grey" />
      </div>
      <h3 className="text-sm font-bold text-dark-grey mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-light-grey max-w-xs mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
