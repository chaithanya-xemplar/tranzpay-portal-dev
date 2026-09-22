import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function useDebouncedBool(value: boolean, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function GlobalSpinner() {
  // queries tagged meta.tableScoped render their own spinner inside GenericTable
  const fetching = useIsFetching({ predicate: (q) => q.meta?.tableScoped !== true }) > 0;
  const mutating = useIsMutating() > 0;
  const active = useDebouncedBool(fetching || mutating, 200);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-white/50 backdrop-blur-sm flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 border-2 border-grey-300 border-t-grey-700 rounded-full animate-spin" />
        <p className="text-sm text-grey-700">Loading…</p>
      </div>
    </div>
  );
}
