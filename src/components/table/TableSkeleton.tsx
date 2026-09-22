import clsx from "clsx";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

// deterministic widths (no Math.random — avoids layout shift on re-render)
const CELL_WIDTHS = ["85%", "55%", "70%", "45%", "75%", "60%", "50%", "65%"];

function ShimmerBar({ width, className }: { width: string; className?: string }) {
  return (
    <span
      className={clsx(
        "relative block h-3 overflow-hidden rounded bg-divider2",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent",
        className
      )}
      style={{ width }}
    />
  );
}

export default function TableSkeleton({ rows = 8, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="w-full" role="status" aria-label="Loading table data" aria-busy="true">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-primary_light2">
            {Array.from({ length: columns }).map((_, c) => (
              <th
                key={c}
                className="px-3 py-3 text-left border-t border-b border-primary_light1"
              >
                <ShimmerBar width={CELL_WIDTHS[(c * 3) % CELL_WIDTHS.length]} className="h-3.5" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b-2 border-dotted border-divider last:border-b-0">
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-3 py-3">
                  <ShimmerBar width={CELL_WIDTHS[(r + c * 2) % CELL_WIDTHS.length]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
