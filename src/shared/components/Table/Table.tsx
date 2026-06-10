import React, { useMemo, useState, useRef, useEffect, MouseEvent } from "react";
import { ChevronDown, ArrowUp, ArrowDown, MoreVertical } from "lucide-react";
import { TableProps, TableColumn, SortConfig } from "./types";
import { tw, color } from "../../utils/utils";
import LoadingSpinner from "../ui/LoadingSpinner";
import Checkbox from "../ui/Checkbox";
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
  enableRowSelection = false,
  selectedRows = [],
  onRowSelectChange,
  getRowId = (row, index) => row.id || index,
  style = {},
  rowClassName = "",
  headerClassName = "",
  tableClassName = "",
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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const tableRef = useRef<HTMLDivElement | null>(null);

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

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentIndex = (currentPage - 1) * pageSize;

  // Apply sorting to data
  const sortedData = useMemo(() => {
    if (sortConfigs.length === 0) return data;

    const sorted = [...data].sort((a, b) => {
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
  }, [data, sortConfigs]);

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

  if (pageData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <h3 className={`${tw.cardHeading} text-gray-900 mb-1`}>No data found</h3>
        <p className={`${tw.textMuted} text-sm`}>Try adjusting your filters or search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={tableRef}
        className={`${tw.rounded} border ${borderColor} ${tableWrapperClassName}`}
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
                    className={`px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap group relative ${
                      headerClassName
                    } ${styleHeaderClassName}`}
                    style={{
                      color: headerTextColor || color.surface.tableHeaderText,
                      background: headerBackground || color.surface.tableHeader,
                      position: 'sticky',
                      top: 0,
                      zIndex: 20,
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
                {visibleColumns.map((col) => {
                  const sortConfig = sortConfigs.find((s) => s.columnId === col.id);
                  const isSortable = col.sortable !== false && col.id !== 'actions';

                  return (
                    <th
                      key={col.id}
                      className={`px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap group relative ${
                        headerClassName
                      } ${styleHeaderClassName}`}
                      style={{
                        color: headerTextColor || color.surface.tableHeaderText,
                        background: headerBackground || color.surface.tableHeader,
                        position: 'sticky',
                        top: 0,
                        zIndex: 20,
                        width: columnWidths[col.id] ? `${columnWidths[col.id]}px` : undefined,
                        minWidth: columnWidths[col.id] ? `${columnWidths[col.id]}px` : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{col.label}</span>

                        {/* Sort Icon & Menu */}
                        <div className="flex items-center gap-1">
                          {isSortable && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSort?.(col.id, false);
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
                                setMenuPosition({
                                  top: rect.bottom + 4,
                                  left: rect.left,
                                });
                              }
                              setOpenColumnMenu(openColumnMenu === col.id ? null : col.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20"
                            title="Column options"
                          >
                            <MoreVertical size={16} className="text-gray-900" />
                          </button>
                        </div>
                      </div>

                      {/* Resize Handle */}
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

                      {/* Dropdown Menu */}
                      {openColumnMenu === col.id && createPortal(
                        <div
                          ref={menuRef}
                          className="fixed bg-white border border-gray-200 rounded shadow-lg py-2 z-50"
                          style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                            minWidth: '150px',
                          }}
                        >
                          {isSortable && (
                            <>
                              <button
                                onClick={() => {
                                  onSort?.(col.id, false);
                                  setOpenColumnMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                Sort Ascending
                              </button>
                              <button
                                onClick={() => {
                                  onSort?.(col.id, false);
                                  setOpenColumnMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                Sort Descending
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setOpenColumnMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            Filter
                          </button>
                          <button
                            onClick={() => {
                              setOpenColumnMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            Search
                          </button>
                          <button
                            onClick={() => {
                              onManageColumnsClick?.();
                              setOpenColumnMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
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
                    <tr className={`transition-colors ${rowClassName} ${styleRowClassName}`}>
                      {/* Selection Checkbox */}
                      {enableRowSelection && (
                        <td
                          className={`px-6 py-4 ${cellClassName}`}
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
                      {visibleColumns.map((col, colIdx) => (
                        <td
                          key={`${rowId}-${col.id}`}
                          className={`px-6 py-4 ${cellClassName}`}
                          style={{
                            backgroundColor: bgColor,
                            width: columnWidths[col.id] ? `${columnWidths[col.id]}px` : undefined,
                            minWidth: columnWidths[col.id] ? `${columnWidths[col.id]}px` : undefined,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {renderCellContent(col, row)}
                            {/* Expand button after first column content */}
                            {colIdx === 0 && expandedContent && (
                              <button
                                onClick={() => handleRowExpand(rowId)}
                                className={`p-2 ${tw.rounded} hover:bg-gray-100 transition-colors`}
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
                      ))}
                    </tr>

                    {/* Expanded Content Row */}
                    {isExpanded && expandedContent && (
                      <tr>
                        <td colSpan={visibleColumns.length + (expandedContent ? 1 : 0)}>
                          <div
                            className={`px-6 py-4 border-t ${borderColor}`}
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
    </div>
  );
}
