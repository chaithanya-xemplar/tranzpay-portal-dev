import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ToastContext,
  type ToastOptions,
  type ToastVariant,
  type ToastContextValue,
} from "./ToastContext";

interface Toast extends ToastOptions {
  id: string;
  variant: ToastVariant;
  duration: number;
}

const TOAST_MAX = 5;

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-green-500 text-white",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

const variantIcons: Record<ToastVariant, ReactNode> = {
  success: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 2.82 18a1.65 1.65 0 0 0 1.44 2.42h15.48A1.65 1.65 0 0 0 21.18 18l-7.47-14.14a1.65 1.65 0 0 0-2.92 0z" />
    </svg>
  ),
  info: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  warning: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 2.82 18a1.65 1.65 0 0 0 1.44 2.42h15.48A1.65 1.65 0 0 0 21.18 18l-7.47-14.14a1.65 1.65 0 0 0-2.92 0z" />
    </svg>
  ),
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  const clearTimeoutFor = useCallback((id: string) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const dismiss: ToastContextValue["dismiss"] = useCallback(
    (id: string) => {
      clearTimeoutFor(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    },
    [clearTimeoutFor]
  );

  const toast: ToastContextValue["toast"] = useCallback(
    (options: ToastOptions) => {
      const id =
        options.id ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now() + Math.random()));

      const variant: ToastVariant = options.variant ?? "info";
      const duration = options.duration ?? 4000;

      const newToast: Toast = {
        id,
        variant,
        title: options.title,
        description: options.description,
        duration,
      };

      setToasts((prev) => {
        const next = [...prev, newToast];

        // enforce max visible toasts
        if (next.length > TOAST_MAX) {
          const overflow = next.length - TOAST_MAX;
          const removed = next.slice(0, overflow);
          removed.forEach((t) => clearTimeoutFor(t.id));
          return next.slice(overflow);
        }

        return next;
      });

      if (duration > 0) {
        const timeoutId = window.setTimeout(() => {
          dismiss(id);
        }, duration);
        timeoutsRef.current.set(id, timeoutId);
      }
    },
    [dismiss, clearTimeoutFor]
  );

  // 🔥 Fixes the "ref value will have changed" warning
  useEffect(() => {
    const timeouts = timeoutsRef.current;

    return () => {
      timeouts.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeouts.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      {/* Toast container (top-right) */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-end px-4">
        <div className="flex w-full max-w-sm flex-col gap-3">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md transition-all ${
                variantStyles[t.variant]
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {variantIcons[t.variant]}
              </div>

              <div className="flex-1 text-sm">
                {t.title && (
                  <div className="font-semibold leading-snug">{t.title}</div>
                )}
                {t.description && (
                  <div className="mt-0.5 text-xs leading-snug opacity-90">
                    {t.description}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs opacity-70 transition hover:bg-black/5 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};