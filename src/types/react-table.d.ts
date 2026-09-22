import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta {
    width?: string;
    /**
     * Rendered on screen but withheld from an export. Use for columns whose
     * raw value must never reach a file — anything the cell renderer masks or
     * truncates and `exportValue` cannot faithfully reproduce.
     */
    exportable?: boolean;
    /**
     * The cell's value as it should appear in an export. A CSV is assembled
     * from row data, not from the rendered DOM, so any column whose cell
     * renderer masks or formats a value MUST supply this — otherwise the file
     * carries the raw value the grid deliberately hides.
     */
    exportValue?: (value: unknown, row: Record<string, unknown>) => string;
  }
}
