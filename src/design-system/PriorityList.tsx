import { useState, type ReactNode } from "react";
import clsx from "clsx";
import Icon from "./Icon";
import Pill from "./Pill";

export interface PriorityItem {
  id: string;
  label: string;
  /** Secondary text or element rendered under/next to the label. */
  meta?: ReactNode;
  /** Dimmed and excluded from the "primary" designation. */
  disabled?: boolean;
  /** Extra content rendered at the row's right edge (e.g. a toggle). */
  trailing?: ReactNode;
}

interface PriorityListProps {
  items: PriorityItem[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  /** Badge shown on the first non-disabled item. Pass null to hide. */
  primaryLabel?: string | null;
  className?: string;
}

/**
 * Drag-to-reorder ranked list. The topmost non-disabled item is treated as
 * primary. Same HTML5 drag mechanic as GatewayTable.
 */
export default function PriorityList({
  items,
  onReorder,
  primaryLabel = "Primary",
  className,
}: PriorityListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const primaryId = items.find((item) => !item.disabled)?.id;

  return (
    <ul className={clsx("border border-divider rounded-lg divide-y divide-divider overflow-hidden", className)}>
      {items.length === 0 && (
        <li className="px-4 py-6 text-center text-sm text-light-grey">Nothing to prioritize yet.</li>
      )}
      {items.map((item, i) => (
        <li
          key={item.id}
          draggable
          onDragStart={(e) => {
            setDragIndex(i);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (i !== dragIndex) setDropTarget(i);
          }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIndex !== null && dragIndex !== i) onReorder(dragIndex, i);
            setDragIndex(null);
            setDropTarget(null);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setDropTarget(null);
          }}
          className={clsx(
            "flex items-center gap-3 px-3 py-2.5 bg-white select-none transition",
            "hover:cursor-grab active:cursor-grabbing",
            dropTarget === i && "bg-primary_light2",
            dragIndex === i && "opacity-50",
            item.disabled && "opacity-60"
          )}
        >
          <Icon name="grip" size={15} className="text-light-grey shrink-0 pointer-events-none" />
          <span className="w-5 text-xs font-bold text-light-grey tabular-nums shrink-0">{i + 1}</span>
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-dark-grey truncate">{item.label}</span>
            {item.meta}
            {primaryLabel && item.id === primaryId && <Pill variant="success">{primaryLabel}</Pill>}
            {item.disabled && <Pill variant="neutral">Disabled</Pill>}
          </div>
          {item.trailing && <div className="shrink-0">{item.trailing}</div>}
        </li>
      ))}
    </ul>
  );
}
