import React, { useEffect, useRef } from "react";
import alertIcon from "../../assets/icon-alert.svg";
import closeIcon from "../../assets/icon-close.svg";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  iconSrc?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  iconSrc,
  confirmLabel = "Yes",
  cancelLabel = "No",
  onConfirm,
  onClose,
  isLoading = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<
          HTMLElement
        >(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (!first || !last) return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Auto-focus first focusable element
    setTimeout(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative w-full max-w-md rounded-lg bg-white shadow-lg outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-divider px-6 py-4">
          <h2 id="confirm-dialog-title" className="text-base font-medium text-dark-grey">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 transition hover:text-gray-600"
          >
            <img src={closeIcon} alt="" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-4 p-4 text-center">
          {iconSrc ? (
            <img src={iconSrc} alt="" className="h-12 w-12 object-contain" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center">
              <img src={alertIcon} alt="" />
            </div>
          )}

          <p
            id="confirm-dialog-description"
            className="text-sm font-semibold text-medium-grey"
          >
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 px-8 pt-3 pb-8">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-[100px] rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-70"
          >
            {isLoading ? "Please wait..." : confirmLabel}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[100px] rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-70"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;