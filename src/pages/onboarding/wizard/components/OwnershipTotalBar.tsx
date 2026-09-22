import clsx from "clsx";
import { Icon } from "../../../../design-system";
import type { Owner } from "../../model/types";

export default function OwnershipTotalBar({ owners }: { owners: Owner[] }) {
  const raw = owners.reduce((sum, o) => {
    const pct = Number(o.ownershipPct);
    return sum + (Number.isFinite(pct) ? pct : 0);
  }, 0);
  const total = Math.round(raw * 100) / 100;
  const hasZeroOwner = owners.some((o) => !(Number(o.ownershipPct) > 0));
  const balanced = owners.length > 0 && Math.abs(total - 100) <= 0.01 && !hasZeroOwner;

  const note = balanced
    ? "Balanced"
    : hasZeroOwner
    ? "Each owner must be greater than 0%"
    : "Must equal 100%";

  return (
    <div
      className={clsx(
        "flex items-center justify-between px-4 py-3 rounded-lg border text-sm",
        balanced ? "border-success/40 bg-success-bg text-success" : "border-error/40 bg-error-bg text-error"
      )}
    >
      <span className="flex items-center gap-3 font-semibold">
        <Icon name={balanced ? "check-circle" : "warning"} size={16} />
        <span>Total ownership</span>
        <span className="text-base font-bold tabular-nums">{total}%</span>
      </span>
      <span className="text-xs font-semibold">{note}</span>
    </div>
  );
}
