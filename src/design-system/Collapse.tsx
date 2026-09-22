import { useState, type ReactNode } from "react";
import clsx from "clsx";

interface CollapseProps {
  title: string;
  /** Optional hint line rendered under the title. */
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export default function Collapse({
  title,
  subtitle,
  children,
  defaultOpen = true,
  className,
}: CollapseProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={clsx("border border-divider rounded-lg bg-white overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-dark-grey bg-white hover:bg-divider2 transition rounded-t-lg"
      >
        {subtitle ? (
          <span className="text-left">
            <span className="block">{title}</span>
            <span className="block text-xs font-normal text-light-grey mt-0.5">{subtitle}</span>
          </span>
        ) : (
          title
        )}
        <svg
          className={clsx(
            "w-4 h-4 text-light-grey transition-transform duration-200",
            open && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={clsx(
          "grid transition-[grid-template-rows,opacity] duration-200",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
