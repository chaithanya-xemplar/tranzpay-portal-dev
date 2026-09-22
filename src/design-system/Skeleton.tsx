import clsx from "clsx";

type SkeletonVariant = "text" | "circle" | "card" | "table-row";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  className?: string;
  lines?: number;
}

const base = "bg-divider2 rounded animate-pulse";

export default function Skeleton({
  variant = "text",
  width,
  height,
  className,
  lines = 3,
}: SkeletonProps) {
  if (variant === "circle") {
    return (
      <span
        className={clsx(base, "rounded-full", className)}
        style={{
          width: width || "2.5rem",
          height: height || width || "2.5rem",
        }}
      />
    );
  }

  if (variant === "card") {
    return (
      <div className={clsx("border border-divider rounded-lg p-4 space-y-3", className)} style={{ width: width || "100%" }}>
        <span className={clsx(base, "block h-4 w-3/4")} />
        <span className={clsx(base, "block h-3 w-full")} />
        <span className={clsx(base, "block h-3 w-5/6")} />
        <span className={clsx(base, "block h-8 w-24 mt-2 rounded-md")} />
      </div>
    );
  }

  if (variant === "table-row") {
    return (
      <div className={clsx("flex items-center gap-4 py-3 border-b border-divider last:border-b-0", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={clsx(base, "h-4", i === 0 ? "w-1/4" : i === 3 ? "w-1/6" : "w-1/5")}
          />
        ))}
      </div>
    );
  }

  // text variant
  if (lines > 1) {
    return (
      <div className={clsx("space-y-2", className)} style={{ width: width || "100%" }}>
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className={clsx(base, "block h-3")}
            style={{ width: i === lines - 1 ? "60%" : "100%" }}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      className={clsx(base, "block h-3", className)}
      style={{ width: width || "100%", height: height }}
    />
  );
}
