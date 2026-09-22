import { Icon } from "../../../../design-system";
import { useToast } from "../../../../design-system/toast/ToastContext";

interface CopyFieldProps {
  label: string;
  value: string;
  /** Mask the displayed value (the full value is still copied). */
  masked?: boolean;
}

export default function CopyField({ label, value, masked = false }: CopyFieldProps) {
  const { toast } = useToast();

  const display = masked && value.length > 8 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ variant: "success", title: `${label} copied` });
    } catch {
      toast({ variant: "error", title: "Copy failed", description: "Clipboard access was blocked." });
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border border-divider rounded-lg bg-divider2/40">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-light-grey uppercase tracking-wider">{label}</p>
        <p className="font-mono text-sm text-dark-grey truncate">{display || "—"}</p>
      </div>
      {value && (
        <button
          type="button"
          onClick={() => void copy()}
          className="shrink-0 p-2 rounded-md text-light-grey hover:text-primary hover:bg-primary_light2 transition"
          title={`Copy ${label}`}
        >
          <Icon name="copy" size={16} />
        </button>
      )}
    </div>
  );
}
