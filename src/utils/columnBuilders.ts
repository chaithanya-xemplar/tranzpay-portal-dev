// src/utils/columnBuilders.ts
import type { ColumnDef, CellContext } from "@tanstack/react-table";
import type { ApiColumn } from "../../src/types/table";

export function prettifyHeader(k: string) {
  return k
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (s) => s.toUpperCase());
}

export function buildColumnsFromApi<T>(cols: ApiColumn[]): ColumnDef<T>[] {
  return cols.map((c) => {
    const id = c.id;
    return {
      accessorKey: id,
      id,
      header: c.header ?? prettifyHeader(id),
      cell: (ctx: CellContext<T, unknown>) => {
        const v = ctx.getValue();
        if (v === null || v === undefined || v === "") return "-";
        if (typeof v === "object") return JSON.stringify(v);
        return String(v);
      },
      meta: c.meta ?? {},
    } as ColumnDef<T>;
  });
}
