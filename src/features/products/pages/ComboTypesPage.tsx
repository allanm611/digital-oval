import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Trash2, Plus, Loader2, MoreHorizontal } from "lucide-react";
import { createPortal } from "react-dom";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import { color, tw, button, zIndex } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { comboTypeService, ComboType } from "../services/comboTypeService";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

export default function ComboTypesPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();

  const [comboTypes, setComboTypes] = useState<ComboType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [comboToDelete, setComboToDelete] = useState<ComboType | null>(null);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteCombo } = useDeleteConfirm({
    onDelete: async (id) => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      setComboTypes((prev) => prev.filter((c) => c.id !== numId));
      await comboTypeService.deleteComboType(numId);
    },
    itemLabel: "Combo Type",
  });

  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);
  const actionMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const dropdownMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const loadComboTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await comboTypeService.getAllComboTypes();
      setComboTypes(response.data || []);
    } catch (error) {
      showError(extractBackendError(error, "Failed to load combo types. Please try again."));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadComboTypes();
  }, [loadComboTypes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      let isOutside = true;

      Object.values(actionMenuRefs.current).forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          isOutside = false;
        }
      });

      Object.values(dropdownMenuRefs.current).forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          isOutside = false;
        }
      });

      if (isOutside) {
        setShowActionMenu(null);
        setDropdownPosition(null);
      }
    };

    if (showActionMenu !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showActionMenu]);

  const handleActionMenuToggle = (
    comboId: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (showActionMenu === comboId) {
      setShowActionMenu(null);
      setDropdownPosition(null);
    } else {
      setShowActionMenu(comboId);

      if (event && event.currentTarget) {
        const button = event.currentTarget;
        const buttonRect = button.getBoundingClientRect();
        const dropdownWidth = 256;
        const spacing = 4;
        const padding = 8;

        const top = buttonRect.bottom + spacing;
        let left = buttonRect.right - dropdownWidth;

        if (left + dropdownWidth > window.innerWidth - padding) {
          left = window.innerWidth - dropdownWidth - padding;
        }
        if (left < padding) {
          left = padding;
        }

        setDropdownPosition({
          top,
          left,
          maxHeight: window.innerHeight - buttonRect.bottom - 16,
        });
      }
    }
  };

  const handleDeleteClick = (combo: ComboType) => {
    setComboToDelete(combo);
    openDeleteConfirm(combo.id, combo.name);
    setShowActionMenu(null);
  };

  // Table columns definition
  const defaultColumns: TableColumn<ComboType>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
      render: (value) => (
        <div className={`${tw.tableFirstColumn} ${tw.textPrimary} truncate`} title={value as string}>
          {value}
        </div>
      ),
    },
    {
      id: "description",
      label: "Description",
      visible: true,
      render: (value) => (
        <div className={`text-sm ${tw.textSecondary} max-w-md truncate`} title={value ? String(value) : "-"}>
          {value || "-"}
        </div>
      ),
    },
    {
      id: "combo_resources",
      label: "Resources",
      visible: true,
      sortable: false,
      render: (value, combo) => (
        <span className={`text-sm ${tw.textSecondary} text-center`}>
          {(combo.combo_resources?.length || 0)}
        </span>
      ),
    },
    {
      id: "is_active",
      label: "Status",
      visible: true,
      render: (value) => (
        <span className={`text-sm ${tw.textSecondary} text-center`}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (value, combo) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => navigate(`/dashboard/combo-types/${combo.id}`)}
            className={`p-2 icon-delete ${tw.rounded} transition-colors`}
            style={{
              color: color.primary.action,
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${color.primary.action}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/dashboard/combo-types/${combo.id}/edit`)}
            className={`p-2 icon-delete ${tw.rounded} transition-colors`}
            style={{
              color: color.primary.action,
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${color.primary.action}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <div className="relative" ref={(el) => {
            actionMenuRefs.current[combo.id] = el;
          }}>
            <button
              onClick={(e) => handleActionMenuToggle(combo.id, e)}
              className={`p-2 icon-delete ${tw.rounded} transition-colors`}
              style={{
                color: color.primary.action,
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${color.primary.action}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      ),
    },
  ];

  const {
    columns,
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
  } = useTable({
    tableId: "combo-types-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const filteredComboTypes = comboTypes.filter(
    (combo) =>
      combo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (combo.description && combo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle pagination slicing
  const paginatedComboTypes = filteredComboTypes.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, tableHandlePageChange]);

  return (
    <div className="space-y-6">
      <BackButton
       
        showBreadcrumb={true}
        currentLabel="Combo Types"
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            Combo Types
          </h1>
          <p className={`text-sm ${tw.textSecondary} mt-1`}>
            Define and manage different types of product combinations
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/combo-types/create")}
          className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create
        </button>
      </div>

      <div className="my-5">
        <SearchInput
          placeholder="Search combo types by name or description..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className={`${tw.rounded} overflow-hidden`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner variant="modern" size="lg" color="primary" className="mr-3" />
            <span className={`${tw.textSecondary}`}>Loading combo types...</span>
          </div>
        ) : filteredComboTypes.length === 0 ? (
          <div className="text-center py-12">
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? "No combo types found" : "No combo types yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm ? "Try adjusting your search terms" : "Create your first combo type"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate("/dashboard/combo-types/create")}
                className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 mx-auto`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Combo Type
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <Table<ComboType>
              columns={columns}
              data={paginatedComboTypes}
              totalItems={filteredComboTypes.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={isLoading}
              onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {/* Pagination */}
            {!isLoading && paginatedComboTypes.length > 0 && filteredComboTypes.length > 0 && (
              <Pagination
                currentPage={tableCurrentPage}
                pageSize={tablePageSize}
                totalItems={filteredComboTypes.length}
                onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              />
            )}

            {/* Action Menus via Portal */}
            {paginatedComboTypes.map((combo) => {
              if (showActionMenu === combo.id && dropdownPosition) {
                return createPortal(
                  <div
                    ref={(el) => {
                      dropdownMenuRefs.current[combo.id] = el;
                    }}
                    className={`fixed bg-white border border-gray-200 ${tw.rounded} shadow-xl py-3 w-64`}
                    style={{
                      zIndex: zIndex.popover,
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      maxHeight: `${dropdownPosition.maxHeight}px`,
                      overflowY: "auto",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(combo);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-4" />
                      Delete
                    </button>
                  </div>,
                  document.body,
                );
              }
              return null;
            })}
          </>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => {
          closeDeleteConfirm();
          setComboToDelete(null);
        }}
        onConfirm={async () => {
          try {
            await confirmDeleteCombo(deleteConfirm.id);
            showSuccess("Combo type deleted successfully");
          } catch (error) {
            showError("Failed to delete combo type", extractBackendError(error, "Failed to delete combo type. Please try again."));
          }
        }}
        title="Delete Combo Type"
        description="This action cannot be undone."
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}

