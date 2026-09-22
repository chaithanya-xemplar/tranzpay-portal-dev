import { type ReactNode } from "react";
import clsx from "clsx";

interface DividerTitleProps {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
  lineClassName?: string;
}

export default function DividerTitle({
  title,
  action,
  className,
  titleClassName,
  lineClassName,
}: DividerTitleProps) {
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <span className={clsx("h-px w-4 shrink-0 bg-divider", lineClassName)} />
      <h3
        className={clsx(
          "shrink-0 text-xs font-bold uppercase tracking-wider text-medium-grey/70",
          titleClassName
        )}
      >
        {title}
      </h3>
      {action && <div className="shrink-0 normal-case tracking-normal">{action}</div>}
      <span className={clsx("h-px min-w-0 flex-1 bg-divider", lineClassName)} />
    </div>
  );
}

export type { DividerTitleProps };
