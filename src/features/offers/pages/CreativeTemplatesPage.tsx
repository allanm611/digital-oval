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
import { creativeTemplateService } from "../../configurations/services/creativeTemplateService";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

interface CreativeTemplate {
  id: number;
  name: string;
  description?: string;
  code?: string;
  primaryChannel?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function CreativeTemplatesPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();

  const [templates, setTemplates] = useState<CreativeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [templateToDelete, setTemplateToDelete] = useState<CreativeTemplate | null>(null);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteTemplate } = useDeleteConfirm({
    onDelete: async (id) => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      setTemplates((prev) => prev.filter((t) => t.id !== numId));
      await creativeTemplateService.deleteCreativeTemplate(numId);
    },
    itemLabel: "Creative Template",
  });

  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const actionMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const dropdownMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await creativeTemplateService.getCreativeTemplates();
      setTemplates(response.data || []);
    } catch (error) {
      showError(extractBackendError(error, "Failed to load creative templates. Please try again."));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

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
    templateId: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (showActionMenu === templateId) {
      setShowActionMenu(null);
      setDropdownPosition(null);
    } else {
      setShowActionMenu(templateId);

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

  const handleDeleteClick = (template: CreativeTemplate) => {
    setTemplateToDelete(template);
    openDeleteConfirm(template.id, template.name);
    setShowActionMenu(null);
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (template.code && template.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Table columns definition
  const defaultColumns: TableColumn<CreativeTemplate>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
    },
    {
      id: "code",
      label: "Code",
      visible: true,
    },
    {
      id: "primaryChannel",
      label: "Channel",
      visible: true,
    },
    {
      id: "description",
      label: "Description",
      visible: true,
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (value, template) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => navigate(`/dashboard/creative-templates/${template.id}`)}
            className={`p-0 icon-delete ${tw.rounded} transition-colors`}
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
            onClick={() => navigate(`/dashboard/creative-templates/${template.id}/edit`)}
            className={`p-0 icon-delete ${tw.rounded} transition-colors`}
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
            actionMenuRefs.current[template.id] = el;
          }}>
            <button
              onClick={(e) => handleActionMenuToggle(template.id, e)}
              className={`p-0 icon-delete ${tw.rounded} transition-colors`}
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
    toggleColumn,
  } = useTable({
    tableId: "creative-templates-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  // Reset to page 1 when search changes
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, tableHandlePageChange]);

  return (
    <div className="space-y-6">
      <BackButton
       
        showBreadcrumb={true}
        currentLabel="Creative Templates"
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            Creative Templates
          </h1>
          <p className={`text-sm ${tw.textSecondary} mt-1`}>
            Manage reusable creative templates for SMS, Email, Push, and other channels
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/creative-templates/create")}
          className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create
        </button>
      </div>

      <div className="my-5">
        <SearchInput
          placeholder="Search creative templates by name, code, or description..."
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
            <span className={`${tw.textSecondary}`}>Loading creative templates...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? "No creative templates found" : "No creative templates yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm ? "Try adjusting your search terms" : "Create your first creative template"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate("/dashboard/creative-templates/create")}
                className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 mx-auto`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Creative Template
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <Table<CreativeTemplate>
              columns={columns}
              data={filteredTemplates}
              totalItems={filteredTemplates.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={isLoading}
              onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {/* Pagination */}
            {!isLoading && filteredTemplates.length > 0 && filteredTemplates.length > 0 && (
              <Pagination
                currentPage={tableCurrentPage}
                pageSize={tablePageSize}
                totalItems={filteredTemplates.length}
                onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              />
            )}

            {/* Action Menus via Portal */}
            {filteredTemplates.map((template) => {
              if (showActionMenu === template.id && dropdownPosition) {
                return createPortal(
                  <div
                    ref={(el) => {
                      dropdownMenuRefs.current[template.id] = el;
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
                        handleDeleteClick(template);
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
          setTemplateToDelete(null);
        }}
        onConfirm={async () => {
          try {
            await confirmDeleteTemplate(deleteConfirm.id);
            showSuccess("Creative Template deleted successfully");
          } catch (error) {
            showError("Failed to delete creative template", extractBackendError(error, "Failed to delete creative template. Please try again."));
          }
        }}
        title="Delete Creative Template"
        description="This does not remove existing creatives."
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}
