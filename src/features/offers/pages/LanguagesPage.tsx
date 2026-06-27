import { useState, useEffect, useCallback, useRef } from "react";
import { Edit, Trash2, Plus, Loader2, Power, PowerOff, MoreHorizontal } from "lucide-react";
import { createPortal } from "react-dom";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { languageService, Language } from "../../configurations/services/languageService";
import { useLanguage } from "../../../contexts/LanguageContext";
import LanguageModal from "../../configurations/components/LanguageModal";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

export default function LanguagesPage() {
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [toggling, setToggling] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [languageToDelete, setLanguageToDelete] = useState<Language | null>(null);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteLanguage } = useDeleteConfirm({
    onDelete: async (id) => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      setLanguages((prev) => prev.filter((l) => l.id !== numId));
      await languageService.deleteLanguage(numId);
    },
    itemLabel: "Language",
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

  const loadLanguages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await languageService.getLanguages();
      setLanguages(data || []);
    } catch (error) {
      showError(extractBackendError(error, "Failed to load languages. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

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
    languageId: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (showActionMenu === languageId) {
      setShowActionMenu(null);
      setDropdownPosition(null);
    } else {
      setShowActionMenu(languageId);

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

  const handleToggleActive = async (language: Language) => {
    setToggling(language.id);
    try {
      await languageService.updateLanguage(language.id, {
        is_active: !language.is_active,
      });
      setLanguages((prev) =>
        prev.map((l) =>
          l.id === language.id ? { ...l, is_active: !l.is_active } : l
        )
      );
      showSuccess(
        `Language ${!language.is_active ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      showError("Failed to update language", extractBackendError(error, "Failed to update language. Please try again."));
    } finally {
      setToggling(null);
    }
  };

  const handleDeleteClick = (language: Language) => {
    setLanguageToDelete(language);
    openDeleteConfirm(language.id, language.name);
  };


  const handleOpenCreateModal = () => {
    setEditingLanguage(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (language: Language) => {
    setEditingLanguage(language);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingLanguage(null);
  };

  const handleModalSubmit = async () => {
    await loadLanguages();
    handleModalClose();
  };

  // Table columns definition
  const defaultColumns: TableColumn<Language>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
    },
    {
      id: "language_code",
      label: "Code",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
    },
    {
      id: "country",
      label: "Country",
      visible: true,
      filterConfig: { type: 'text' },
    },
    {
      id: "is_active",
      label: "Status",
      visible: true,
      filterConfig: { type: 'select', options: ['active', 'inactive'] },
    },
    {
      id: "description",
      label: "Description",
      visible: true,
      filterConfig: { type: 'text' },
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (value, language) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handleOpenEditModal(language)}
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
          <ActivateDeactivateButton
            isActive={language.is_active}
            onToggle={() => handleToggleActive(language)}
            disabled={toggling === language.id}
            isLoading={toggling === language.id}
            title={language.is_active ? "Deactivate" : "Activate"}
          />
          <div className="relative" ref={(el) => {
            actionMenuRefs.current[language.id] = el;
          }}>
            <button
              onClick={(e) => handleActionMenuToggle(language.id, e)}
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
    toggleColumn,
  } = useTable({
    tableId: "languages-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const filteredLanguages = languages.filter(
    (language) =>
      language.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (language.description && language.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (language.language_code && language.language_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle pagination slicing
  const paginatedLanguages = filteredLanguages.slice(
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
        currentLabel="Languages"
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            Languages
          </h1>
          <p className={`text-sm ${tw.textSecondary} mt-1`}>
            Manage available languages and locales for offer creatives
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create
        </button>
      </div>

      <div className="my-5">
        <SearchInput
          placeholder="Search languages by name, code, or description..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
          }}
        />
      </div>

      <div className={`${tw.rounded} overflow-hidden`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner variant="modern" size="lg" color="primary" className="mr-3" />
            <span className={`${tw.textSecondary}`}>Loading languages...</span>
          </div>
        ) : filteredLanguages.length === 0 ? (
          <div className="text-center py-12">
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? "No languages found" : "No languages yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm ? "Try adjusting your search terms" : "Create your first language"}
            </p>
            {!searchTerm && (
              <button
                onClick={handleOpenCreateModal}
                className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 mx-auto`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Language
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <Table<Language>
              columns={columns}
              data={paginatedLanguages}
              totalItems={filteredLanguages.length}
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
            {!isLoading && paginatedLanguages.length > 0 && filteredLanguages.length > 0 && (
              <Pagination
                currentPage={tableCurrentPage}
                pageSize={tablePageSize}
                totalItems={filteredLanguages.length}
                onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              />
            )}

            {/* Action Menus via Portal */}
            {paginatedLanguages.map((language) => {
              if (showActionMenu === language.id && dropdownPosition) {
                return createPortal(
                  <div
                    ref={(el) => {
                      dropdownMenuRefs.current[language.id] = el;
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
                        handleDeleteClick(language);
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
          setLanguageToDelete(null);
        }}
        onConfirm={async () => {
          try {
            await confirmDeleteLanguage(deleteConfirm.id);
            showSuccess("Language deleted successfully");
          } catch (error) {
            showError("Failed to delete language", extractBackendError(error, "Failed to delete language. Please try again."));
          }
        }}
        title="Delete Language"
        description="This may affect existing creatives using this language."
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
      />

      <LanguageModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        editingLanguage={editingLanguage}
      />
    </div>
  );
}
