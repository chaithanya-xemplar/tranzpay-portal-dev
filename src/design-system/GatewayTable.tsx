import { useState, useRef, type ReactNode } from "react";
import clsx from "clsx";
import Icon from "./Icon";
import Button from "./Button";

export interface GatewayColumn<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => ReactNode;
  className?: string;
}

interface GatewayTableProps<T> {
  columns: GatewayColumn<T>[];
  rows: T[];
  onAdd?: () => void;
  onEdit?: (row: T, index: number) => void;
  onDelete?: (row: T, index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  emptyMessage?: string;
  className?: string;
}

export default function GatewayTable<T extends { id?: string | number }>({
  columns,
  rows,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
  emptyMessage = "No items yet. Click Add to create one.",
  className,
}: GatewayTableProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const dragNode = useRef<HTMLElement | null>(null);

  const handleDragStart = (i: number) => (e: React.DragEvent) => {
    setDragIndex(i);
    dragNode.current = e.currentTarget as HTMLElement;
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragOver = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (i !== dragIndex) {
      setDropTarget(i);
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== i) {
      onReorder?.(dragIndex, i);
    }
    setDragIndex(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    dragNode.current?.classList.remove("opacity-50");
    setDragIndex(null);
    setDropTarget(null);
  };

  const draggable = Boolean(onReorder);

  return (
    <div className={clsx("border border-divider rounded-lg overflow-hidden", className)}>
      {onAdd && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-divider bg-white">
          <span className="text-sm font-semibold text-dark-grey">
            {rows.length} item{rows.length !== 1 ? "s" : ""}
          </span>
          <Button size="sm" variant="outline" icon="plus" onClick={onAdd}>
            Add
          </Button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Icon name="file" size={40} className="text-divider mb-3" />
          <p className="text-sm text-light-grey">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-divider2 border-b border-divider">
                {draggable && (
                  <th className="w-10 px-2 py-2.5" />
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={clsx(
                      "text-left text-xs font-bold text-medium-grey px-4 py-2.5",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="text-right text-xs font-bold text-medium-grey px-4 py-2.5 w-20">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  draggable={draggable}
                  onDragStart={handleDragStart(i)}
                  onDragOver={handleDragOver(i)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop(i)}
                  onDragEnd={handleDragEnd}
                  className={clsx(
                    "border-b border-divider last:border-b-0 transition select-none",
                    dropTarget === i && "bg-primary_light2",
                    dragIndex === i && "opacity-50",
                    draggable && "hover:cursor-grab active:cursor-grabbing"
                  )}
                >
                  {draggable && (
                    <td className="w-10 px-2 py-2.5 text-light-grey">
                      <Icon name="more-vertical" size={15} className="pointer-events-none" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={clsx("px-4 py-2.5 text-dark-grey", col.className)}>
                      {col.render(row, i)}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(row, i)}
                            className="p-1.5 rounded text-light-grey hover:text-primary hover:bg-primary_light2 transition"
                            title="Edit"
                          >
                            <Icon name="edit" size={15} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(row, i)}
                            className="p-1.5 rounded text-light-grey hover:text-error hover:bg-error-bg transition"
                            title="Delete"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
