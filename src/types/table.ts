export type SortDescriptor = { id: string; desc?: boolean };

export type TableFilter = {
  field: string;
  value: string ;
  operator?: string; 
};

export interface TableQueryParams {
  pageIndex: number; // 0-based
  pageSize: number;
  sorting?: SortDescriptor[]; // TanStack sorting shape
  globalFilter?: string;
  filters?: TableFilter[];
}

export interface ApiColumn {
  id: string;
  header: string;
  meta?: Record<string, unknown>;
}

export interface ApiTableResponse<T> {
  data: T[];
  total: number;
  columns: ApiColumn[]; // backend always sends columns
}
