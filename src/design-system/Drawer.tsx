import { useEffect, useId, useRef, type ReactNode } from "react";
import clsx from "clsx";
import closeIcon from "../assets/icon-close.svg";

type DrawerSide = "left" | "right";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  side?: DrawerSide;
  width?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

const sideStyles: Record<DrawerSide, string> = {
  left: "left-0 top-0",
  right: "right-0 top-0",
};

const enterStyles: Record<DrawerSide, string> = {
  left: "translate-x-0",
  right: "translate-x-0",
};

const exitStyles: Record<DrawerSide, string> = {
  left: "-translate-x-full",
  right: "translate-x-full",
};

export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  side = "right",
  width = "w-96",
  className,
  headerClassName,
  contentClassName,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  /* Per instance, not a fixed string: a page routinely mounts several drawers
     at once (they stay in the DOM while closed), and a shared id makes every
     one of them borrow the first drawer's heading as its accessible name. */
  const titleId = useId();
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    setTimeout(() => {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement.current?.focus();
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={clsx(
          "fixed z-50 h-full bg-white shadow-xl transition-transform duration-300 ease-in-out outline-none",
          sideStyles[side],
          width,
          className,
          open ? enterStyles[side] : exitStyles[side]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={clsx("flex items-center justify-between px-4 py-3 border-b border-divider", headerClassName)}>
            {title && (
              <div>
                <h2 id={titleId} className="font-bold text-dark-grey">
                  {title}
                </h2>
                {subtitle && <p className="text-sm text-medium-grey">{subtitle}</p>}
              </div>
            )}
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="text-light-grey hover:text-dark-grey transition"
            >
              <img src={closeIcon} alt="" />
            </button>
          </div>
        <div className={clsx("p-4 overflow-y-auto h-[calc(100%-53px)]", contentClassName)}>{children}</div>
      </div>
    </>
  );
}
