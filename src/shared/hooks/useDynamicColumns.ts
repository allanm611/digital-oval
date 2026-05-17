import { useState, useEffect } from "react";

export interface ColumnConfig {
  id: string;
  label: string;
  visible?: boolean;
}

interface UseDynamicColumnsOptions {
  tableId: string;
  defaultColumns: ColumnConfig[];
  persistenceKey?: string;
}

export const useDynamicColumns = ({
  tableId,
  defaultColumns,
  persistenceKey = `columns_${tableId}`,
}: UseDynamicColumnsOptions) => {
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage or use defaults
  useEffect(() => {
    const stored = localStorage.getItem(persistenceKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setVisibleColumns(parsed);
      } catch {
        setVisibleColumns(defaultColumns);
      }
    } else {
      setVisibleColumns(defaultColumns);
    }
    setIsLoaded(true);
  }, [tableId, persistenceKey]);

  // Save to localStorage whenever columns change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(persistenceKey, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, persistenceKey, isLoaded]);

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const reorderColumns = (newOrder: ColumnConfig[]) => {
    setVisibleColumns(newOrder);
  };

  const resetToDefaults = () => {
    setVisibleColumns(defaultColumns);
    localStorage.removeItem(persistenceKey);
  };

  const getVisibleColumns = () => {
    return visibleColumns.filter((col) => col.visible !== false);
  };

  return {
    visibleColumns,
    allColumns: visibleColumns,
    isModalOpen,
    setIsModalOpen,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
    getVisibleColumns,
  };
};
