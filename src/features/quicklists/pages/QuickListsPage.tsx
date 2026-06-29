import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  Database,
  CheckCircle,
  XCircle,
  Edit,
  Send,
  MoreHorizontal,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { color, tw, components, zIndex } from "../../../shared/utils/utils";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { quicklistService } from "../services/quicklistService";
import SearchInput from "../../../shared/components/ui/SearchInput";
import {
  QuickList,
  QuickListStats,
  CreateQuickListRequest,
} from "../types/quicklist";
import CreateQuickListModal from "../components/CreateQuickListModal";
import EditQuickListModal from "../components/EditQuickListModal";
import { PermissionGate } from "../../auth/components/PermissionGate";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import CreateCommunicationModal from "../../../shared/components/CreateCommunicationModal";
import ManageQuickListCustomersModal from "../components/ManageQuickListCustomersModal";
import QuickListDetailsExpandedRow from "../components/QuickListDetailsExpandedRow";
import DateFormatter from "../../../shared/components/DateFormatter";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";

export default function QuickListsPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [quicklistToDelete, setQuicklistToDelete] = useState<QuickList | null>(null);
  const [isManagingCustomers, setIsManagingCustomers] = useState(false);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteQuicklist } = useDeleteConfirm({
    onDelete: async (id) => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      setAllQuicklists((prev) => prev.filter((q) => q.id !== numId));
      await quicklistService.deleteQuicklist(numId);
    },
    itemLabel: "Quick List",
  });

  const [allQuicklists, setAllQuicklists] = useState<QuickList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [stats, setStats] = useState<QuickListStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQuickList, setEditQuickList] = useState<QuickList | null>(null);
  const isInitialMount = useRef(true);

  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isCommunicateModalOpen, setIsCommunicateModalOpen] = useState(false);
  const [quicklistToCommunicate, setQuicklistToCommunicate] =
    useState<QuickList | null>(null);
  const [isManageCustomersModalOpen, setIsManageCustomersModalOpen] =
    useState(false);
  const [manageCustomersMode, setManageCustomersMode] = useState<"add" | "remove">(
    "add",
  );
  const [selectedQuicklistForCustomer, setSelectedQuicklistForCustomer] =
    useState<QuickList | null>(null);
  const [clearFiltersKey, setClearFiltersKey] = useState(0);
  const actionMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dropdownMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    loadInitialData();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Skip the first render to avoid double loading
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Reset to page 1 when search changes (frontend filtering)
    setCurrentPage(1);
     
  }, [searchTerm]);

  // Frontend filtering handles pagination, no need to reload on page change

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await quicklistService.getStats({ skipCache: true });
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Load all quicklists for frontend filtering
      let allData: QuickList[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const quicklistsRes = await quicklistService.getAllQuickLists({
          limit: 100,
          offset,
        });

        if (quicklistsRes.success && quicklistsRes.data) {
          allData = [...allData, ...quicklistsRes.data];
          if (quicklistsRes.pagination?.hasMore) {
            offset += 100;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      setAllQuicklists(allData);
    } catch (err) {
      console.error("Failed to load initial data:", err);
      showError(extractBackendError(error, "Failed to load QuickLists. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  // Frontend filtering and pagination
  const filteredAndPaginatedQuicklists = useMemo(() => {
    let filtered = allQuicklists;

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (ql) =>
          ql.name.toLowerCase().includes(term) ||
          (ql.description && ql.description.toLowerCase().includes(term)),
      );
    }

    // Apply pagination
    const offset = (currentPage - 1) * PAGE_SIZE;
    const paginated = filtered.slice(offset, offset + PAGE_SIZE);

    return {
      filtered,
      paginated,
      total: filtered.length,
    };
  }, [allQuicklists, searchTerm, currentPage]);

  const handleCreateQuickList = async (request: CreateQuickListRequest) => {
    try {
      const response = await quicklistService.createQuickList(request);

      if (!response.success) {
        throw new Error(
          "error" in response ? response.error : "Failed to create QuickList",
        );
      }

      // Check for validation errors even if upload was successful
      if (
        response.data &&
        (response.data.has_errors || response.data.rows_failed > 0)
      ) {
        showToast(
          "QuickList created successfully, but import had errors. Check the import logs for details.",
        );
      } else {
        showToast("QuickList created successfully!");
      }

      setIsCreateModalOpen(false);

      // If manual entry, open communication modal automatically
      if (
        request.isManualEntry &&
        response.data &&
        response.data.quicklist_id
      ) {
        // Fetch the complete quicklist data by ID
        const quicklistResponse = await quicklistService.getQuickListById(
          response.data.quicklist_id,
        );
        if (quicklistResponse.success && quicklistResponse.data) {
          setQuicklistToCommunicate(quicklistResponse.data);
          setIsCommunicateModalOpen(true);
        }
      }

      // Reload stats and quicklists
      await loadStats();
      // Reload the quicklists list to show the new one immediately
      await loadInitialData(); // Always reload from page 1 to see the new quicklist
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to create quicklist:", err);
      const errorMessage =
        err instanceof Error ? err.message : t.quickList.createdFailed;
      // Filter out HTTP errors
      const userMessage =
        errorMessage.includes("HTTP error") || errorMessage.includes("status:")
          ? t.quickList.createdFailed
          : errorMessage;
      showError(t.quickList.createdFailed, userMessage);
      throw err; // Re-throw so the modal can handle it
    }
  };

  const handleViewDetails = (quicklist: QuickList) => {
    navigate(`/dashboard/quick-lists/${quicklist.id}`);
  };

  const handleFilteredCountChange = (count: number) => {
    // Updates when filters applied in the Table component
  };

  const handleDelete = (quicklist: QuickList) => {
    setQuicklistToDelete(quicklist);
    openDeleteConfirm(quicklist.id, quicklist.name);
  };

  const handleExport = async (quicklist: QuickList, format: "csv" | "json") => {
    try {
      const blob = await quicklistService.exportQuickList(quicklist.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quicklist.name}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast(
        t.quickList.exportSuccess.replace("{format}", format.toUpperCase()),
      );
    } catch (err) {
      console.error("Failed to export quicklist:", err);
      showError(t.quickList.exportFailed);
    }
  };

  const handleEdit = (quicklist: QuickList) => {
    setEditQuickList(quicklist);
    setIsEditModalOpen(true);
  };

  const handleUpdateQuickList = async (request: {
    name: string;
    description?: string | null;
  }) => {
    if (!editQuickList) return;

    try {
      const response = await quicklistService.updateQuickList(
        editQuickList.id,
        request,
      );
      if (response.success) {
        showToast(t.quickList.updatedSuccess);
        setIsEditModalOpen(false);
        setEditQuickList(null);
        await loadInitialData();
        await loadStats();
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Failed to update QuickList:", err);
      const errorMessage =
        err instanceof Error ? err.message : t.quickList.updatedFailed;
      // Filter out HTTP errors
      const userMessage =
        errorMessage.includes("HTTP error") || errorMessage.includes("status:")
          ? t.common.loading
          : errorMessage;
      showError(t.quickList.updatedFailed, userMessage);
      throw err;
    }
  };

  const handleActionMenuToggle = (
    quicklistId: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (showActionMenu === quicklistId) {
      setShowActionMenu(null);
      setDropdownPosition(null);
    } else {
      setShowActionMenu(quicklistId);

      // Calculate position from the clicked button
      if (event && event.currentTarget) {
        const button = event.currentTarget;
        const buttonRect = button.getBoundingClientRect();
        const dropdownWidth = 256; // w-64 = 256px
        const spacing = 4;
        const padding = 8;

        // Position dropdown below button
        const top = buttonRect.bottom + spacing;
        let left = buttonRect.right - dropdownWidth;

        // Adjust if dropdown extends beyond right edge
        if (left + dropdownWidth > window.innerWidth - padding) {
          left = window.innerWidth - dropdownWidth - padding;
        }

        // Adjust if dropdown extends beyond left edge
        if (left < padding) {
          left = padding;
        }

        setDropdownPosition({ top, left });
      }
    }
  };

  const handleSendCommunication = (quicklist: QuickList) => {
    setQuicklistToCommunicate(quicklist);
    setIsCommunicateModalOpen(true);
    setShowActionMenu(null);
  };

  const handleAddCustomer = (quicklist: QuickList) => {
    setSelectedQuicklistForCustomer(quicklist);
    setManageCustomersMode("add");
    setIsManageCustomersModalOpen(true);
    setShowActionMenu(null);
  };

  const handleRemoveCustomer = (quicklist: QuickList) => {
    setSelectedQuicklistForCustomer(quicklist);
    setManageCustomersMode("remove");
    setIsManageCustomersModalOpen(true);
    setShowActionMenu(null);
  };

  const quicklistStatsCards = [
    {
      name: "Total QuickLists",
      value: statsLoading
        ? "..."
        : (stats?.overall.total_quicklists || 0).toLocaleString(),
      icon: Database,
      color: color.tertiary.tag1,
    },
    {
      name: t.quickList.rowsImported,
      value: statsLoading
        ? "..."
        : (stats?.overall.total_rows_imported || 0).toLocaleString(),
      icon: CheckCircle,
      color: color.tertiary.tag4,
    },
    {
      name: t.quickList.rowsFailed,
      value: statsLoading
        ? "..."
        : (stats?.overall.total_rows_failed || 0).toLocaleString(),
      icon: XCircle,
      color: color.tertiary.tag2,
    },
  ];

  const defaultColumns: TableColumn<QuickList>[] = [
    {
      id: "name",
      label: t.quickList.name,
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
      render: (value, quicklist) => (
        <div>
          <button
            type="button"
            onClick={() => handleViewDetails(quicklist)}
            className={`${tw.tableFirstColumn} ${tw.textPrimary} truncate`}
            title={quicklist.name}
          >
            {quicklist.name}
          </button>
          {quicklist.description && (
            <div
              className={`text-xs sm:text-sm ${tw.textMuted} truncate mt-1`}
              title={quicklist.description}
            >
              {quicklist.description}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "rows_imported",
      label: t.quickList.rowsImported,
      visible: true,
      filterConfig: { type: "number" },
      render: (value) =>
        value != null ? (value as number).toLocaleString() : "N/A",
    },
    {
      id: "rows_failed",
      label: t.quickList.rowsFailed,
      visible: true,
      filterConfig: { type: "number" },
      render: (value) =>
        value != null ? (value as number).toLocaleString() : "N/A",
    },
    {
      id: "processing_status",
      label: t.quickList.status,
      visible: true,
      filterConfig: { type: "select", options: ["pending", "processing", "completed", "failed"] },
      render: (value) => (value as string || "N/A").replace(/_/g, " "),
    },
    {
      id: "created_at",
      label: t.quickList.createdAt,
      visible: true,
      filterConfig: { type: "date" },
      render: (value) => (
        <DateFormatter
          date={value as string}
          useUserTimezone
          useLocale
          year="numeric"
          month="short"
          day="numeric"
        />
      ),
    },
    {
      id: "actions",
      label: t.quickList.actions,
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (value, quicklist) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => navigate(`/dashboard/quick-lists/${quicklist.id}`)}
            className={`group p-0 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.action}]/10 transition-all duration-300`}
            title={t.quickList.viewDetails}
          >
            <Eye className="w-4 h-4" />
          </button>
          <PermissionGate permission="quicklists.update">
            <button
              onClick={() => handleEdit(quicklist)}
              className={`group p-0 ${tw.rounded} ${tw.textMuted} hover:bg-gray-100 transition-all duration-300`}
              title={t.quickList.edit}
            >
              <Edit className="w-4 h-4" />
            </button>
          </PermissionGate>
          <div className="relative" ref={(el) => {
            actionMenuRefs.current[quicklist.id] = el;
          }}>
            <button
              onClick={(e) => handleActionMenuToggle(quicklist.id, e)}
              className={`group p-0 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.action}]/10 transition-all duration-300`}
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
    expandedRowId,
    setExpandedRowId,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useTable({
    tableId: "quicklists-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>QuickLists</h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Manage standalone QuickLists for data storage and reuse
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PermissionGate permission="quicklists.create">
            <FeatureActionButton featureId="quicklists" action="create" onClick={() => setIsCreateModalOpen(true)} />
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {quicklistStatsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="h-5 w-5"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search QuickLists by name..."
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
          />
        </div>
      </div>

      {/* QuickLists Table */}
      <Table<QuickList>
        columns={columns}
        data={filteredAndPaginatedQuicklists.filtered}
        totalItems={filteredAndPaginatedQuicklists.total}
        currentPage={tableCurrentPage}
        pageSize={tablePageSize}
        isLoading={loading}
        onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
        onSort={handleSort}
        sortConfigs={sortConfigs}
        expandedRowId={expandedRowId}
        onExpandChange={setExpandedRowId}
        onFilteredCountChange={handleFilteredCountChange}
        clearFiltersKey={clearFiltersKey}
        onHideColumn={toggleColumn}
        onManageColumnsClick={() => setShowColumnPicker(true)}
        style={{
          headerBackground: color.surface.tableHeader,
          headerTextColor: color.surface.tableHeaderText,
          rowBackground: color.surface.tablebodybg,
          rowSpacing: "0 8px",
        }}
        expandedContent={(quicklist) => (
          <QuickListDetailsExpandedRow quicklist={quicklist} colSpan={columns.filter(c => c.visible).length} />
        )}
      />

      {/* Pagination */}
      {!loading && filteredAndPaginatedQuicklists.total > 0 && (
        <Pagination
          currentPage={tableCurrentPage}
          pageSize={tablePageSize}
          totalItems={filteredAndPaginatedQuicklists.total}
          onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
        />
      )}

      {/* Render dropdown menus via portal outside the table */}
      {filteredAndPaginatedQuicklists.filtered.map((quicklist) => {
        if (showActionMenu === quicklist.id && dropdownPosition) {
          return createPortal(
            <div
              key={`dropdown-${quicklist.id}`}
              ref={(el) => {
                dropdownMenuRefs.current[quicklist.id] = el;
              }}
              className={`fixed bg-white border border-gray-200 ${tw.rounded} shadow-xl py-3 w-64`}
              style={{
                zIndex: zIndex.popover,
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendCommunication(quicklist);
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-black hover:bg-gray-50 transition-colors"
              >
                <Send className="w-4 h-4 mr-4" />
                Send Communication
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddCustomer(quicklist);
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-black hover:bg-gray-50 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-4" />
                Add Customer
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveCustomer(quicklist);
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-black hover:bg-gray-50 transition-colors"
              >
                <UserMinus className="w-4 h-4 mr-4" />
                Remove Customer
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExport(quicklist, "csv");
                  setShowActionMenu(null);
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-black hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-4" />
                Export
              </button>

              <PermissionGate permission="quicklists.delete">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(quicklist);
                    setShowActionMenu(null);
                  }}
                  className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-4" />
                  Delete
                </button>
              </PermissionGate>
            </div>,
            document.body,
          );
        }
        return null;
      })}


      {/* Modals */}
      <CreateQuickListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateQuickList}
      />

      {/* Edit Modal */}
      {isEditModalOpen && editQuickList && (
        <EditQuickListModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditQuickList(null);
          }}
          onSubmit={handleUpdateQuickList}
          initialName={editQuickList.name}
          initialDescription={editQuickList.description || null}
        />
      )}

      {/* Send Communication Modal */}
      {isCommunicateModalOpen && quicklistToCommunicate && (
        <CreateCommunicationModal
          isOpen={isCommunicateModalOpen}
          onClose={() => {
            setIsCommunicateModalOpen(false);
            setQuicklistToCommunicate(null);
          }}
          quicklist={quicklistToCommunicate}
          onSuccess={(result) => {
            showToast(
              "Success",
              `Communication sent successfully! ${result.total_messages_sent} messages sent.`,
            );
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => {
          closeDeleteConfirm();
          setQuicklistToDelete(null);
        }}
        onConfirm={confirmDeleteQuicklist}
        title={t.quickList.deleteQuickList}
        description="Are you sure you want to delete this QuickList? This action cannot be undone."
        itemName={deleteConfirm.itemName}
        isLoading={isDeleting}
        confirmText={t.quickList.deleteConfirmText}
        cancelText={t.common.cancel}
      />

      {/* Manage Customers Modal */}
      {isManageCustomersModalOpen && selectedQuicklistForCustomer && (
        <ManageQuickListCustomersModal
          isOpen={isManageCustomersModalOpen}
          onClose={() => {
            setIsManageCustomersModalOpen(false);
            setSelectedQuicklistForCustomer(null);
          }}
          quicklist={selectedQuicklistForCustomer}
          mode={manageCustomersMode}
          isLoading={isManagingCustomers}
          onSubmit={async (customers) => {
            if (!user?.user_id) {
              showError("Error", "User ID not available");
              return;
            }

            setIsManagingCustomers(true);
            try {
              if (manageCustomersMode === "add") {
                // Add customers one by one
                const results = await Promise.all(
                  customers.map((customer) =>
                    quicklistService.addMemberToQuickList(
                      selectedQuicklistForCustomer.id,
                      customer.customer_phone || customer.customer_email || String(customer.customer_id),
                      customer.customer_phone ? "msisdn" : "email",
                      user.user_id,
                    ),
                  ),
                );

                // Check if all succeeded
                const allSucceeded = results.every((r) => r.success);
                if (!allSucceeded) {
                  showError("Partial Error", "Some customers could not be added. Please try again.");
                } else {
                  showToast(
                    `${customers.length} customer${customers.length !== 1 ? "s" : ""} added to ${selectedQuicklistForCustomer.name}`,
                  );
                }
              } else {
                // Remove customers one by one
                const results = await Promise.all(
                  customers.map((customer) =>
                    quicklistService.removeMemberFromQuickList(
                      selectedQuicklistForCustomer.id,
                      customer.customer_id,
                      user.user_id,
                    ),
                  ),
                );

                const allSucceeded = results.every((r) => r.success);
                if (!allSucceeded) {
                  showError("Partial Error", "Some customers could not be removed. Please try again.");
                } else {
                  showToast(
                    `${customers.length} customer${customers.length !== 1 ? "s" : ""} removed from ${selectedQuicklistForCustomer.name}`,
                  );
                }
              }

              setIsManageCustomersModalOpen(false);
              setSelectedQuicklistForCustomer(null);
            } catch (err) {
              showError(
                "Error",
                extractBackendError(err, `Failed to ${manageCustomersMode} customer${customers.length !== 1 ? "s" : ""}. Please try again.`),
              );
            } finally {
              setIsManagingCustomers(false);
            }
          }}
        />
      )}

      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns.map((col) => ({ id: col.id, label: col.label, visible: col.visible }))}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={(reorderedCols) => {
          const updatedColumns = columns.map((col) => {
            const reordered = reorderedCols.find((c) => c.id === col.id);
            return reordered ? { ...col, visible: reordered.visible } : col;
          });
          reorderColumns(updatedColumns);
        }}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  );
}
