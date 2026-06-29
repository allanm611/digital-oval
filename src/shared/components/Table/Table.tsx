import React, { useMemo, useState, useRef, useEffect, MouseEvent } from "react";
import { ChevronDown, ArrowUp, ArrowDown, MoreVertical, Filter, Settings, Eye, EyeOff, X } from "lucide-react";
import { TableProps, TableColumn, SortConfig } from "./types";
import { tw, color } from "../../utils/utils";
import { buttons } from "../../utils/tokens";
import LoadingSpinner from "../ui/LoadingSpinner";
import Checkbox from "../ui/Checkbox";
import Radio from "../ui/Radio";
import Input from "../ui/Input";
import HeadlessSelect from "../ui/HeadlessSelect";
import { FilterBuilder } from "./FilterBuilder";
import { createPortal } from "react-dom";

export function Table<T extends { id?: number | string } = any>({
  columns,
  data,
  totalItems,
  currentPage,
  pageSize,
  isLoading = false,
  expandedContent,
  expandedRowId,
  onExpandChange,
  onPageChange,
  onSort,
  sortConfigs = [],
  onManageColumnsClick,
  onHideColumn,
  onFilteredCountChange,
  enableRowSelection = false,
  selectedRows = [],
  onRowSelectChange,
  getRowId = (row, index) => row.id || index,
  style = {},
  rowClassName = "",
  headerClassName = "",
  tableClassName = "",
  clearFiltersKey = 0,
}: TableProps<T>) {
  const {
    headerBackground,
    headerTextColor,
    rowBackground,
    borderColor = "border-gray-200",
    rowSpacing = "0 8px",
    headerClassName: styleHeaderClassName = "",
    rowClassName: styleRowClassName = "",
    cellClassName = "",
    tableWrapperClassName = "",
  } = style;

  const [openColumnMenu, setOpenColumnMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [columnFilters, setColumnFilters] = useState<{ [columnId: string]: any }>({});
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [filterFromColumnId, setFilterFromColumnId] = useState<string | null>(null);
  const [autoSizedOnce, setAutoSizedOnce] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const tableRef = useRef<HTMLDivElement | null>(null);
  const headersRef = useRef<{ [key: string]: HTMLElement | null }>({});

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        const isButtonClick = Object.values(buttonRefs.current).some(btn => btn?.contains(target));
        if (!isButtonClick) {
          setOpenColumnMenu(null);
        }
      }
    };

    if (openColumnMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openColumnMenu]);

  // Handle column resize
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!resizingColumn) return;

      const delta = e.clientX - startX;
      const newWidth = Math.max(100, startWidth + delta);
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingColumn, startX, startWidth]);

  // Clear filters when clearFiltersKey changes
  useEffect(() => {
    setColumnFilters({});
  }, [clearFiltersKey]);

  // Reset to page 1 when filters change
  useEffect(() => {
    onPageChange?.(1);
  }, [columnFilters, onPageChange]);

  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    const thElement = (e.currentTarget as HTMLElement).closest('th');
    if (thElement) {
      setResizingColumn(columnId);
      setStartX(e.clientX);
      setStartWidth(thElement.offsetWidth);
    }
  };

  const handleRowSelect = (rowId: number | string) => {
    const updated = selectedRows.includes(rowId)
      ? selectedRows.filter(id => id !== rowId)
      : [...selectedRows, rowId];
    onRowSelectChange?.(updated);
  };

  const handleSelectAll = () => {
    if (selectedRows.length === pageData.length) {
      onRowSelectChange?.([]);
    } else {
      const allRowIds = pageData.map((row, idx) => getRowId(row, idx));
      onRowSelectChange?.(allRowIds);
    }
  };

  // Get visible columns
  const visibleColumns = useMemo(
    () => columns.filter((col) => col.visible),
    [columns],
  );

  // Auto-scroll to newly visible columns
  useEffect(() => {
    if (tableRef.current && visibleColumns.length > 0) {
      requestAnimationFrame(() => {
        if (tableRef.current) {
          // Scroll to the end to show newly added columns
          tableRef.current.scrollLeft = tableRef.current.scrollWidth - tableRef.current.clientWidth;
        }
      });
    }
  }, [visibleColumns.map((c) => c.id).join(',')]); // Track visible column IDs

  // Debug: Log row heights and column info
  useEffect(() => {
    const rows = tableRef.current?.querySelectorAll('tbody tr');
    if (rows && rows.length > 0) {
      const firstRow = rows[0];
      const computedStyle = window.getComputedStyle(firstRow);
      const height = firstRow.offsetHeight;
      console.log('🔍 Table Row Height Debug:', {
        offsetHeight: height,
        minHeight: computedStyle.minHeight,
        paddingTop: computedStyle.paddingTop,
        paddingBottom: computedStyle.paddingBottom,
        visibleColumnsCount: visibleColumns.length,
        hasActionsColumn: visibleColumns.some(col => col.id === 'actions'),
      });

      // Log each cell height in first row
      const cells = firstRow.querySelectorAll('td');
      console.log('📊 Cell heights:', Array.from(cells).map((cell, idx) => ({
        columnId: visibleColumns[idx]?.id,
        height: (cell as HTMLElement).offsetHeight,
        paddingTop: window.getComputedStyle(cell).paddingTop,
        paddingBottom: window.getComputedStyle(cell).paddingBottom,
      })));
    }
  }, [visibleColumns]);

  // Auto-size columns on first load based on content
  useEffect(() => {
    if (!autoSizedOnce && visibleColumns.length > 0 && data.length > 0) {
      requestAnimationFrame(() => {
        const newWidths: { [key: string]: number } = {};
        const padding = 48; // px-6 = 24px on each side

        visibleColumns.forEach((col) => {
          if (headersRef.current[col.id]) {
            const headerEl = headersRef.current[col.id];
            const headerText = (headerEl?.textContent || col.label || '').trim();
            const headerWidth = headerText.length * 8 + padding; // Rough estimate: ~8px per character

            // Sample first few rows to estimate content width
            let maxContentWidth = headerWidth;
            for (let i = 0; i < Math.min(5, data.length); i++) {
              const cellContent = col.render
                ? col.render(data[i][col.id as keyof typeof data[i]], data[i])
                : data[i][col.id as keyof typeof data[i]];

              const text = typeof cellContent === 'string' ? cellContent : String(cellContent || '');
              const contentWidth = Math.min(text.length * 8 + padding, 300); // Cap at 300px
              maxContentWidth = Math.max(maxContentWidth, contentWidth);
            }

            newWidths[col.id] = Math.max(100, Math.min(maxContentWidth, 400)); // Min 100px, max 400px
          }
        });

        if (Object.keys(newWidths).length > 0) {
          setColumnWidths(newWidths);
          setAutoSizedOnce(true);
        }
      });
    }
  }, [autoSizedOnce, visibleColumns, data]);

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentIndex = (currentPage - 1) * pageSize;

  // Apply filters and sorting to data
  const sortedData = useMemo(() => {
    let filtered = [...data];

    // Apply column filters
    Object.entries(columnFilters).forEach(([columnId, filterCondition]) => {
      if (!filterCondition || !filterCondition.operator) return;

      const column = columns.find(c => c.id === columnId);
      if (!column?.filterConfig) return;

      filtered = filtered.filter((row) => {
        const value = row[columnId as keyof T];
        const filterType = column.filterConfig!.type;
        const operator = filterCondition.operator;
        const filterValue = filterCondition.value;

        // Handle operators without values
        if (operator === 'is empty') {
          return value === null || value === undefined || String(value).trim() === '';
        }
        if (operator === 'is not empty') {
          return value !== null && value !== undefined && String(value).trim() !== '';
        }

        if (filterType === 'text') {
          const stringValue = String(value || '').toLowerCase();
          const filterStr = String(filterValue || '').toLowerCase();

          switch (operator) {
            case 'contains':
              return stringValue.includes(filterStr);
            case 'does not contain':
              return !stringValue.includes(filterStr);
            case 'equals':
              return stringValue === filterStr;
            case 'does not equal':
              return stringValue !== filterStr;
            case 'starts with':
              return stringValue.startsWith(filterStr);
            case 'ends with':
              return stringValue.endsWith(filterStr);
            case 'is any of':
              return filterStr.split(',').map(s => s.trim()).includes(stringValue);
            default:
              return true;
          }
        } else if (filterType === 'number') {
          const numValue = Number(value) || 0;
          const filterNum = Number(filterValue);

          switch (operator) {
            case '=':
              return numValue === filterNum;
            case '!=':
              return numValue !== filterNum;
            case '>':
              return numValue > filterNum;
            case '>=':
              return numValue >= filterNum;
            case '<':
              return numValue < filterNum;
            case '<=':
              return numValue <= filterNum;
            case 'is any of':
              const nums = filterStr.split(',').map(s => Number(s.trim()));
              return nums.includes(numValue);
            default:
              return true;
          }
        } else if (filterType === 'select' || filterType === 'multiselect') {
          switch (operator) {
            case 'is':
              return value === filterValue;
            case 'is not':
              return value !== filterValue;
            case 'is any of':
              if (Array.isArray(filterValue)) {
                return filterValue.includes(value);
              }
              return value === filterValue;
            default:
              return true;
          }
        } else if (filterType === 'date') {
          switch (operator) {
            case 'is':
              return new Date(value).toDateString() === new Date(filterValue).toDateString();
            case 'is not':
              return new Date(value).toDateString() !== new Date(filterValue).toDateString();
            case 'is after':
              return new Date(value).getTime() > new Date(filterValue).getTime();
            case 'is on or after':
              return new Date(value).getTime() >= new Date(filterValue).getTime();
            case 'is before':
              return new Date(value).getTime() < new Date(filterValue).getTime();
            case 'is on or before':
              return new Date(value).getTime() <= new Date(filterValue).getTime();
            default:
              return true;
          }
        }
        return true;
      });
    });

    // Apply sorting
    if (sortConfigs.length === 0) return filtered;

    const sorted = filtered.sort((a, b) => {
      for (const sort of sortConfigs) {
        const aVal = a[sort.columnId as keyof T];
        const bVal = b[sort.columnId as keyof T];

        let comparison = 0;
        if (aVal === null || aVal === undefined) comparison = 1;
        else if (bVal === null || bVal === undefined) comparison = -1;
        else if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });

    return sorted;
  }, [data, sortConfigs, columnFilters, columns]);

  // Notify parent of actual filtered count
  useEffect(() => {
    onFilteredCountChange?.(sortedData.length);
  }, [sortedData.length, onFilteredCountChange]);

  // Get current page data (in case data passed is already paginated, we don't need to slice)
  const pageData = useMemo(() => {
    // If data length < totalItems, parent is already paginating - use data as-is
    if (sortedData.length < totalItems) {
      return sortedData;
    }
    // If data length == totalItems, parent passed all data - slice locally
    if (sortedData.length === totalItems) {
      return sortedData.slice(currentIndex, currentIndex + pageSize);
    }
    // Fallback
    return sortedData;
  }, [sortedData, currentIndex, pageSize, totalItems]);

  const handlePageChange = (page: number) => {
    if (onPageChange && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handleRowExpand = (rowId: number | string) => {
    if (onExpandChange) {
      onExpandChange(expandedRowId === rowId ? null : rowId);
    }
  };

  // Render cell content
  const renderCellContent = (col: TableColumn<T>, row: T) => {
    if (col.render) {
      return col.render(row[col.id as keyof T], row);
    }
    return row[col.id as keyof T];
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" className="mb-4" />
        <p className={`${tw.textMuted} font-medium text-sm`}>Loading table...</p>
      </div>
    );
  }

  // Get filter display value
  const getFilterDisplayValue = (columnId: string, filterCondition: any): string => {
    if (!filterCondition) return '';

    const operator = filterCondition.operator;
    const value = filterCondition.value;

    if (['is empty', 'is not empty'].includes(operator)) {
      return operator;
    }

    const valueStr = Array.isArray(value) ? value.join(', ') : String(value || '');
    return `${operator} ${valueStr}`;
  };


  return (
    <div className="space-y-4">
      {Object.keys(columnFilters).length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            {Object.entries(columnFilters).map(([columnId, filterValue]) => {
            const column = columns.find(c => c.id === columnId);
            return (
              <div
                key={columnId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: 'var(--c-surface-cards)',
                  border: '1px solid var(--c-text-secondary)',
                  color: 'var(--c-text-primary)',
                }}
              >
                <span>
                  {column?.label}: {getFilterDisplayValue(columnId, filterValue)}
                </span>
                <button
                  onClick={() => {
                    setColumnFilters(prev => {
                      const next = { ...prev };
                      delete next[columnId];
                      return next;
                    });
                  }}
                  className="hover:opacity-70 transition-opacity ml-1"
                  title="Remove filter"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
          <button
            onClick={() => setColumnFilters({})}
            className="text-sm font-medium px-3 py-1.5 rounded"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--c-text-primary)',
              border: '1px solid var(--c-text-secondary)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Clear all
          </button>
          </div>
        </>
      )}

      {pageData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <h3 className={`${tw.cardHeading} text-gray-900 mb-1`}>No data found</h3>
          <p className={`${tw.textMuted} text-sm`}>Try adjusting your filters or search criteria.</p>
        </div>
      ) : (
        <div
          ref={tableRef}
          className={`${tw.rounded} ${tableWrapperClassName}`}
          style={{
            maxHeight: 'min(calc(100vh - 350px), 800px)',
            minHeight: '300px',
            overflowY: 'auto',
            overflowX: 'auto',
            userSelect: resizingColumn ? 'none' : 'auto',
          }}
        >
        <table className={`w-full ${tableClassName}`} style={{ borderCollapse: "separate", borderSpacing: rowSpacing }}>
            {/* Header */}
            <thead
              style={{
                background: headerBackground || color.surface.tableHeader,
              }}
            >
              <tr>
                {enableRowSelection && (
                  <th
                    className={`px-6 py-3 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap group relative ${
                      headerClassName
                    } ${styleHeaderClassName}`}
                    style={{
                      color: headerTextColor || color.surface.tableHeaderText,
                      background: headerBackground || color.surface.tableHeader,
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      width: '60px',
                      minWidth: '60px',
                    }}
                  >
                    <Checkbox
                      id="select-all-rows"
                      checked={pageData.length > 0 && selectedRows.length === pageData.length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                  </th>
                )}
                {visibleColumns.map((col, colIndex) => {
                  const sortConfig = sortConfigs.find((s) => s.columnId === col.id);
                  const isSortable = col.sortable !== false && col.id !== 'actions';
                  const isLastColumn = colIndex === visibleColumns.length - 1;

                  // Calculate cumulative width for sticky positioning
                  let cumulativeWidth = enableRowSelection ? 60 : 0;
                  for (let i = 0; i < colIndex; i++) {
                    cumulativeWidth += columnWidths[visibleColumns[i].id] || 120;
                  }

                  const isFrozen = col.visible;
                  const stickyStyle = isFrozen && !isLastColumn
                    ? { left: `${cumulativeWidth}px`, zIndex: 20 }
                    : isFrozen && isLastColumn
                    ? { right: 0, zIndex: 20 }
                    : {};

                  return (
                    <th
                      key={col.id}
                      ref={(el) => {
                        if (el) headersRef.current[col.id] = el;
                      }}
                      className={`px-6 py-3 ${!col.headerClassName ? 'text-left' : ''} text-sm font-medium uppercase tracking-wider whitespace-nowrap group relative ${
                        col.headerClassName || headerClassName
                      } ${styleHeaderClassName}`}
                      style={{
                        color: headerTextColor || color.surface.tableHeaderText,
                        background: headerBackground || color.surface.tableHeader,
                        position: 'sticky',
                        top: 0,
                        width: columnWidths[col.id] ? `${columnWidths[col.id]}px` : undefined,
                        minWidth: columnWidths[col.id] ? `${columnWidths[col.id]}px` : undefined,
                        ...stickyStyle,
                      }}
                    >
                      <div className={`flex items-center ${col.id === 'actions' ? 'justify-end' : 'justify-between'}`}>
                        <span className="truncate">{col.label}</span>

                        {/* Sort Icon & Menu */}
                        <div className="flex items-center gap-1">
                          {isSortable && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (sortConfig) {
                                  onSort?.(col.id, false, sortConfig.direction === 'asc' ? 'desc' : undefined);
                                } else {
                                  onSort?.(col.id, false, 'asc');
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20"
                              title="Sort column"
                            >
                              {sortConfig ? (
                                <div className="flex items-center gap-1">
                                  {sortConfig.direction === 'asc' ? (
                                    <ArrowUp size={14} className="text-gray-900" />
                                  ) : (
                                    <ArrowDown size={14} className="text-gray-900" />
                                  )}
                                  {sortConfigs.length > 1 && (
                                    <span className="text-xs font-bold text-gray-900">
                                      {sortConfig.priority + 1}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <ArrowUp size={14} className="text-gray-900" />
                              )}
                            </button>
                          )}

                          {/* Column Menu Button */}
                          <button
                            ref={(el) => {
                              if (el) buttonRefs.current[col.id] = el;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const button = buttonRefs.current[col.id];
                              if (button) {
                                const rect = button.getBoundingClientRect();
                                const dropdownWidth = 200;
                                const spacing = 4;
                                setMenuPosition({
                                  top: rect.bottom + spacing,
                                  left: Math.max(spacing, rect.left - dropdownWidth - spacing),
                                });
                              }
                              setOpenColumnMenu(openColumnMenu === col.id ? null : col.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20"
                            title="Column options"
                          >
                            <MoreVertical size={16} style={{ color: 'var(--c-text-primary)' }} />
                          </button>
                        </div>
                      </div>

                      {/* Resize Handle - not for last column */}
                      {!isLastColumn && (
                        <div
                          onMouseDown={(e) => handleResizeStart(e, col.id)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 cursor-col-resize transition-colors opacity-0 group-hover:opacity-100"
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            height: '20px',
                            width: '2px',
                            cursor: 'col-resize',
                            userSelect: 'none',
                            backgroundColor: '#B1C5CE',
                          }}
                        />
                      )}

                      {/* Dropdown Menu */}
                      {openColumnMenu === col.id && createPortal(
                        <div
                          ref={menuRef}
                          className="fixed border border-gray-200 rounded shadow-lg py-2 z-50"
                          style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                            width: '200px',
                            backgroundColor: 'var(--c-surface-cards)',
                          }}
                        >
                          {col.id !== 'actions' && (
                            <>
                              {isSortable && (
                                <>
                                  <button
                                    onClick={() => {
                                      onSort?.(col.id, false, 'asc');
                                      setOpenColumnMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm flex items-center gap-3"
                                    style={{ color: 'var(--c-text-primary)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                  >
                                    <ArrowUp size={16} style={{ color: 'var(--c-text-secondary)' }} />
                                    Sort Ascending
                                  </button>
                                  <button
                                    onClick={() => {
                                      onSort?.(col.id, false, 'desc');
                                      setOpenColumnMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm flex items-center gap-3"
                                    style={{ color: 'var(--c-text-primary)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                  >
                                    <ArrowDown size={16} style={{ color: 'var(--c-text-secondary)' }} />
                                    Sort Descending
                                  </button>
                                  <button
                                    onClick={() => {
                                      onSort?.(col.id, false, undefined);
                                      setOpenColumnMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm flex items-center gap-3"
                                    style={{ color: 'var(--c-text-primary)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                  >
                                    <X size={16} style={{ color: 'var(--c-text-secondary)' }} />
                                    Unsort
                                  </button>
                                </>
                              )}
                              {col.filterConfig && (
                                <button
                                  onClick={() => {
                                    setFilterFromColumnId(col.id);
                                    setIsFilterBuilderOpen(true);
                                    setOpenColumnMenu(null);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm flex items-center gap-3"
                                  style={{ color: 'var(--c-text-primary)' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                  <Filter size={16} style={{ color: 'var(--c-text-secondary)' }} />
                                  Filters
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => {
                              onHideColumn?.(col.id);
                              setOpenColumnMenu(null);
                            }}
                            className="w-full text-left px-4 py-3 text-sm flex items-center gap-3"
                            style={{ color: 'var(--c-text-primary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <EyeOff size={16} style={{ color: 'var(--c-text-secondary)' }} />
                            Hide Column
                          </button>
                          <button
                            onClick={() => {
                              onManageColumnsClick?.();
                              setOpenColumnMenu(null);
                            }}
                            className="w-full text-left px-4 py-3 text-sm flex items-center gap-3"
                            style={{ color: 'var(--c-text-primary)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <Settings size={16} style={{ color: 'var(--c-text-secondary)' }} />
                            Manage Columns
                          </button>
                        </div>,
                        document.body
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {pageData.map((row, rowIndex) => {
                const rowId = getRowId(row, rowIndex);
                const isExpanded = expandedRowId === rowId;
                const bgColor = rowBackground || color.surface.tablebodybg;

                return (
                  <React.Fragment key={rowId}>
                    {/* Main Row */}
                    <tr className={`transition-colors ${rowClassName} ${styleRowClassName} min-h-[44px]`}>
                      {/* Selection Checkbox */}
                      {enableRowSelection && (
                        <td
                          className={`px-6 py-3 ${cellClassName}`}
                          style={{
                            backgroundColor: bgColor,
                            width: '60px',
                            minWidth: '60px',
                          }}
                        >
                          <Checkbox
                            id={`row-${rowId}`}
                            checked={selectedRows.includes(rowId)}
                            onChange={() => handleRowSelect(rowId)}
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                          />
                        </td>
                      )}
                      {/* Data Cells */}
                      {visibleColumns.map((col, colIdx) => {
                        // Calculate cumulative width for sticky positioning
                        let cumulativeWidth = enableRowSelection ? 60 : 0;
                        for (let i = 0; i < colIdx; i++) {
                          cumulativeWidth += columnWidths[visibleColumns[i].id] || 120;
                        }

                        const isFrozen = col.visible;
                        const isLastColumn = colIdx === visibleColumns.length - 1;
                        const stickyStyle = isFrozen && !isLastColumn
                          ? { left: `${cumulativeWidth}px`, zIndex: 15 }
                          : isFrozen && isLastColumn
                          ? { right: 0, zIndex: 15 }
                          : {};

                        return (
                        <td
                          key={`${rowId}-${col.id}`}
                          className={`px-6 py-3 text-sm ${colIdx === 0 ? `font-semibold text-gray-900` : `text-gray-900`} ${cellClassName}`}
                          style={{
                            backgroundColor: bgColor,
                            width: columnWidths[col.id] ? `${columnWidths[col.id]}px` : undefined,
                            minWidth: columnWidths[col.id] ? `${columnWidths[col.id]}px` : undefined,
                            position: isFrozen ? 'sticky' : undefined,
                            ...stickyStyle,
                          }}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="truncate flex-1">
                              {renderCellContent(col, row)}
                            </div>
                            {/* Expand button after first column content */}
                            {colIdx === 0 && expandedContent && (
                              <button
                                onClick={() => handleRowExpand(rowId)}
                                className={`p-2 ${tw.rounded} hover:bg-gray-100 transition-colors flex-shrink-0`}
                                title={isExpanded ? "Collapse" : "Expand"}
                              >
                                <ChevronDown
                                  size={16}
                                  className={`transition-transform text-gray-900 ${isExpanded ? "rotate-180" : ""}`}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                        );
                      })}
                    </tr>

                    {/* Expanded Content Row */}
                    {isExpanded && expandedContent && (
                      <tr>
                        <td colSpan={visibleColumns.length + (expandedContent ? 1 : 0)}>
                          <div
                            className={`px-6 py-3 border-t ${borderColor}`}
                            style={{ backgroundColor: bgColor }}
                          >
                            {expandedContent(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Filter Builder Modal */}
      <FilterBuilder
        columns={columns}
        isOpen={isFilterBuilderOpen}
        onClose={() => {
          setIsFilterBuilderOpen(false);
          setFilterFromColumnId(null);
        }}
        onApply={(filters) => {
          setColumnFilters(filters);
        }}
        currentFilters={columnFilters}
        defaultColumnId={filterFromColumnId}
      />
    </div>
  );
}
