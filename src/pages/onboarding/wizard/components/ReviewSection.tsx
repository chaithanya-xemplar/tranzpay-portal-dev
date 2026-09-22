import type { ReactNode } from "react";
import clsx from "clsx";
import { Button, Icon } from "../../../../design-system";

interface ReviewSectionProps {
  number: string;
  title: string;
  issueCount: number;
  onEdit: () => void;
  children: ReactNode;
}

export default function ReviewSection({
  number,
  title,
  issueCount,
  onEdit,
  children,
}: ReviewSectionProps) {
  const hasIssues = issueCount > 0;

  return (
    <section
      className={clsx(
        "overflow-hidden rounded-lg bg-white shadow-sm",
        hasIssues ? "border-2 border-error" : "border border-divider"
      )}
    >
      <div
        className={clsx(
          "flex items-center justify-between gap-4 px-5 py-4",
          hasIssues ? "bg-error-bg border-b border-error" : "border-b border-divider"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={clsx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
              hasIssues
                ? "bg-review-issue-number-bg text-review-issue-badge"
                : "bg-review-clean-number-bg text-primary"
            )}
          >
            {number}
          </span>

          <h3 className="truncate text-base font-bold text-dark-grey">
            {title}
          </h3>

          {hasIssues && (
            <span className="inline-flex items-center gap-1 rounded-full bg-review-issue-badge px-2.5 py-0.5 text-[11px] font-bold leading-none text-white">
              <Icon name="warning" size={11} />
              {issueCount} issue{issueCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant="ghost"
          icon="edit"
          iconPosition="left"
          onClick={onEdit}
          className="text-medium-grey hover:bg-transparent hover:text-medium-grey"
        >
          {hasIssues ? "Fix" : "Edit"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-x-16 gap-y-4 px-5 py-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export function ReviewRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("min-w-0 text-sm", className)}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-medium-grey/70">
        {label}
      </div>

      <div className="mt-0.5 break-words text-sm whitespace-pre-line text-dark-grey">
        {value || "—"}
      </div>
    </div>
  );
}
