export type FilterType = 'text' | 'number' | 'select' | 'multiselect' | 'date';

export interface FilterConfig {
  type: FilterType;
  operators?: string[]; // e.g., ['contains', 'equals', 'startsWith']
  options?: string[] | number[]; // For select/multiselect filters
  placeholder?: string;
}

export interface TableColumn<T = any> {
  id: string;
  label: string;
  visible: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
  filterConfig?: FilterConfig;
  isActionColumn?: boolean;
  headerClassName?: string;
}

export interface SortConfig {
  columnId: string;
  direction: 'asc' | 'desc';
  priority: number;
}

export interface TableConfig {
  tableId: string;
  persistToLocalStorage?: boolean;
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export interface TableState {
  columns: TableColumn[];
  expandedRowId: number | string | null;
  currentPage: number;
  pageSize: number;
}

export interface UseTableProps<T = any> {
  tableId: string;
  defaultColumns: TableColumn<T>[];
  defaultPageSize?: number;
  persistToLocalStorage?: boolean;
}

export interface TableStyle {
  headerBackground?: string;
  headerTextColor?: string;
  rowBackground?: string;
  borderColor?: string;
  rowSpacing?: string;
  headerClassName?: string;
  rowClassName?: string;
  cellClassName?: string;
  tableWrapperClassName?: string;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
  expandedContent?: (row: T) => React.ReactNode;
  expandedRowId?: number | string | null;
  onExpandChange?: (rowId: number | string | null) => void;
  onColumnChange?: (columns: TableColumn<T>[]) => void;
  onPageChange?: (page: number) => void;
  onColumnVisibilityToggle?: (columnId: string) => void;
  onColumnReorder?: (columns: TableColumn<T>[]) => void;
  onSort?: (columnId: string, multiSelect: boolean) => void;
  sortConfigs?: SortConfig[];
  onManageColumnsClick?: () => void;
  onFilteredCountChange?: (count: number) => void;
  enableRowSelection?: boolean;
  selectedRows?: (number | string)[];
  onRowSelectChange?: (selectedRows: (number | string)[]) => void;
  getRowId?: (row: T, index: number) => number | string;
  style?: TableStyle;
  rowClassName?: string;
  headerClassName?: string;
  tableClassName?: string;
  clearFiltersKey?: number;
}
