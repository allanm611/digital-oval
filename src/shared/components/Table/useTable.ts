import { useState, useCallback, useEffect } from "react";
import { TableColumn, UseTableProps, SortConfig } from "./types";

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_STORAGE_KEY = "app-pagination-page-size";

export function useTable<T = any>({
  tableId,
  defaultColumns,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  persistToLocalStorage = true,
}: UseTableProps<T>) {
  const storageKey = `table-state:${tableId}`;

  // Get initial page size from localStorage or use default
  const getInitialPageSize = () => {
    try {
      const stored = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
      return stored ? Number(stored) : defaultPageSize;
    } catch (e) {
      return defaultPageSize;
    }
  };

  // Initialize columns from localStorage or defaults
  const [columns, setColumns] = useState<TableColumn<T>[]>(() => {
    if (!persistToLocalStorage) return defaultColumns;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge stored visibility/order with current default columns to handle new columns
        return defaultColumns.map((col) => {
          const storedCol = parsed.find((c: TableColumn) => c.id === col.id);
          return storedCol ? { ...col, visible: storedCol.visible } : col;
        });
      }
    } catch (error) {
      console.error(`Failed to load table state from localStorage for ${tableId}:`, error);
    }

    return defaultColumns;
  });

  const [expandedRowId, setExpandedRowId] = useState<number | string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(getInitialPageSize());
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([]);

  // Update columns when defaultColumns structure changes (not on every render)
  useEffect(() => {
    setColumns((prevColumns) => {
      // Only update if column count changed or first columns don't match
      if (prevColumns.length !== defaultColumns.length ||
          prevColumns[0]?.id !== defaultColumns[0]?.id) {
        return defaultColumns.map((col) => {
          const prevCol = prevColumns.find((c) => c.id === col.id);
          return prevCol ? { ...col, visible: prevCol.visible } : col;
        });
      }
      return prevColumns;
    });
  }, [defaultColumns.length]);

  // Save columns to localStorage when they change
  useEffect(() => {
    if (!persistToLocalStorage) return;

    try {
      const toStore = columns.map((col) => ({
        id: col.id,
        visible: col.visible,
      }));
      localStorage.setItem(storageKey, JSON.stringify(toStore));
    } catch (error) {
      console.error(`Failed to save table state to localStorage for ${tableId}:`, error);
    }
  }, [columns, tableId, storageKey, persistToLocalStorage]);

  // Toggle column visibility
  const toggleColumn = useCallback((columnId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col,
      ),
    );
  }, []);

  // Reorder columns
  const reorderColumns = useCallback((newColumns: TableColumn<T>[]) => {
    setColumns(newColumns);
  }, []);

  // Reset to default columns
  const resetToDefaults = useCallback(() => {
    setColumns(defaultColumns);
  }, [defaultColumns]);

  // Get visible columns
  const getVisibleColumns = useCallback(() => {
    return columns.filter((col) => col.visible);
  }, [columns]);

  // Expand/collapse row
  const toggleRowExpansion = useCallback((rowId: number | string | null) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Reset page to 1 (useful when filters change)
  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    try {
      localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(newPageSize));
    } catch (e) {
      console.error("Failed to save page size preference:", e);
    }
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  // Handle column sort
  const handleSort = useCallback((columnId: string, multiSelect: boolean = false, direction?: 'asc' | 'desc') => {
    setSortConfigs((prev) => {
      if (direction === undefined) {
        // If direction is explicitly undefined, clear the sort for this column
        return prev.filter((s) => s.columnId !== columnId);
      }

      if (direction) {
        // If direction is specified, set that direction directly
        const existing = prev.find((s) => s.columnId === columnId);
        if (existing && existing.direction === direction) {
          return prev;
        }
        return [{ columnId, direction, priority: 0 }];
      }

      // If multi-select (ctrl/cmd+click), add to sort
      if (multiSelect) {
        const existing = prev.find((s) => s.columnId === columnId);
        if (existing) {
          // Cycle through directions: asc -> desc -> remove
          if (existing.direction === 'asc') {
            return prev.map((s) =>
              s.columnId === columnId ? { ...s, direction: 'desc' } : s
            );
          } else {
            return prev.filter((s) => s.columnId !== columnId);
          }
        } else {
          return [
            ...prev,
            {
              columnId,
              direction: 'asc',
              priority: prev.length,
            },
          ];
        }
      } else {
        // Single sort - replace all with new sort
        const existing = prev.find((s) => s.columnId === columnId);
        if (existing) {
          // Cycle: asc -> desc -> remove
          if (existing.direction === 'asc') {
            return [{ columnId, direction: 'desc', priority: 0 }];
          } else {
            return [];
          }
        } else {
          return [{ columnId, direction: 'asc', priority: 0 }];
        }
      }
    });
  }, []);

  // Clear all sorts
  const clearSort = useCallback(() => {
    setSortConfigs([]);
  }, []);

  return {
    // Column management
    columns,
    setColumns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
    getVisibleColumns,

    // Row expansion
    expandedRowId,
    setExpandedRowId,
    toggleRowExpansion,

    // Pagination
    currentPage,
    pageSize,
    setCurrentPage,
    handlePageChange,
    handlePageSizeChange,
    resetPage,

    // Sorting
    sortConfigs,
    handleSort,
    clearSort,
  };
}
