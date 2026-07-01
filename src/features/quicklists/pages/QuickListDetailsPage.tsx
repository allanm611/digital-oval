import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Database,
  Download,
  Send,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { quicklistService } from "../services/quicklistService";
import {
  QuickList,
  QuickListData,
  ImportLog,
  QuickListTableMapping,
  UploadTypeSchema,
} from "../types/quicklist";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import BackButton from "../../../shared/components/ui/BackButton";
import CreateCommunicationModal from "../../../shared/components/CreateCommunicationModal";
import EditQuickListModal from "../components/EditQuickListModal";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import ManageQuickListCustomersModal from "../components/ManageQuickListCustomersModal";
import { formatDate, formatDateWithTimezone } from "../../../shared/services/dateService";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

export default function QuickListDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success: showToast, error: showError } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [quicklist, setQuicklist] = useState<QuickList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<
    "overview" | "data" | "logs" | "audit-trail"
  >("overview");

  // Data states
  const [data, setData] = useState<QuickListData[]>([]);
  const [dataColumns, setDataColumns] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataPagination, setDataPagination] = useState<{
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  } | null>(null);

  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsPagination, setLogsPagination] = useState<{
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  } | null>(null);

  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [loadingAuditTrail, setLoadingAuditTrail] = useState(false);
  const [auditTrailPagination, setAuditTrailPagination] = useState<{
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  } | null>(null);

  const [isCommunicateModalOpen, setIsCommunicateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageCustomersModalOpen, setIsManageCustomersModalOpen] =
    useState(false);
  const [manageCustomersMode, setManageCustomersMode] = useState<"add" | "remove">(
    "add",
  );
  const [isManagingCustomers, setIsManagingCustomers] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [tableMapping, setTableMapping] =
    useState<QuickListTableMapping | null>(null);
  const [uploadTypeSchema, setUploadTypeSchema] =
    useState<UploadTypeSchema | null>(null);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [showDataColumnPicker, setShowDataColumnPicker] = useState(false);
  const [showLogsColumnPicker, setShowLogsColumnPicker] = useState(false);
  const [showAuditColumnPicker, setShowAuditColumnPicker] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadQuickListDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (quicklist && activeSection === "data") {
      loadData();
    }
  }, [quicklist?.id, activeSection]);

  useEffect(() => {
    if (quicklist && activeSection === "logs") {
      loadImportLogs();
    }
  }, [quicklist?.id, activeSection]);

  useEffect(() => {
    if (quicklist && activeSection === "audit-trail") {
      loadAuditTrail();
    }
  }, [quicklist?.id, activeSection]);

  // Commented out - Table mapping and schema loading
  // useEffect(() => {
  //   if (quicklist?.upload_type) {
  //     loadTableMapping();
  //     loadUploadTypeSchema();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [quicklist?.upload_type]);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadQuickListDetails = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const quicklistId = parseInt(id);
      const response = await quicklistService.getQuickListById(
        quicklistId,
        true,
      );

      if (response.success) {
        setQuicklist(response.data);
      }
    } catch (err) {
      showError("Error loading quicklist", extractBackendError(error, "Error loading quicklist. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    if (!quicklist) return;

    try {
      setLoadingData(true);
      
      const response = await quicklistService.getQuickListData(quicklist.id, {
        limit: 50,
        offset: 0,
      });

      if (response.success) {
        setData(response.data || []);
        setDataPagination(response.pagination || null);

        // Extract columns - try row_data first, fall back to top-level fields
        if (response.data && response.data.length > 0) {
          const firstRow = response.data[0];

          // Check if row_data exists and is an object
          if (firstRow.row_data && typeof firstRow.row_data === "object") {
            const extractedColumns = Object.keys(firstRow.row_data);
            setDataColumns(extractedColumns);
          } else {
            // Fall back to original method - extract top-level fields
            const extractedColumns = Object.keys(firstRow).filter(
              (key) =>
                !["id", "quicklist_id", "created_at", "row_number"].includes(
                  key,
                ),
            );
            setDataColumns(extractedColumns);
          }
        } else {
          setDataColumns([]);
        }
      }
    } catch (err) {
      console.error("📊 Error loading data:", err);
      showError("Error loading data", extractBackendError(error, "Error loading data. Please try again."));
    } finally {
      setLoadingData(false);
    }
  };

  const loadImportLogs = async () => {
    if (!quicklist) return;

    try {
      setLoadingLogs(true);
      
      const response = await quicklistService.getImportLogs(quicklist.id, {
        limit: 100,
        offset: 0,
        skipCache: true,
      });

      if (response.success) {
        setImportLogs(response.data || []);
        setLogsPagination(response.pagination || null);
      }
    } catch (err) {
      console.error("❌ Error loading import logs:", err);
      showError("Error loading import logs", extractBackendError(err, "Error loading import logs. Please try again."));
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadAuditTrail = async () => {
    if (!quicklist) return;

    try {
      setLoadingAuditTrail(true);
      
      const response = await quicklistService.getAuditTrail(quicklist.id, {
        limit: 100,
        offset: 0,
      });

      if (response.success) {
        setAuditTrail(response.data || []);
        setAuditTrailPagination(response.pagination || null);
      }
    } catch (err) {
      console.error("❌ Error loading audit trail:", err);
      showError("Error loading audit trail", extractBackendError(err, "Error loading audit trail. Please try again."));
    } finally {
      setLoadingAuditTrail(false);
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    if (!quicklist) return;

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
      showToast(`QuickList exported as ${format.toUpperCase()}`);
    } catch (err) {
      showError("Error exporting quicklist", extractBackendError(error, "Error exporting quicklist. Please try again."));
    }
  };

  const handleCommunicate = () => {
    if (quicklist) {
      setIsCommunicateModalOpen(true);
    }
  };

  const handleAddCustomer = () => {
    if (quicklist) {
      setManageCustomersMode("add");
      setIsManageCustomersModalOpen(true);
    }
  };

  const handleRemoveCustomer = () => {
    if (quicklist) {
      setManageCustomersMode("remove");
      setIsManageCustomersModalOpen(true);
    }
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdateQuickList = async (request: {
    name: string;
    description?: string | null;
  }) => {
    if (!quicklist) return;

    try {
      const response = await quicklistService.updateQuickList(
        quicklist.id,
        request,
      );
      if (response.success) {
        setQuicklist(response.data);
        showToast("QuickList updated successfully");
        setIsEditModalOpen(false);
      }
    } catch (err) {
      showError("Error updating quicklist", extractBackendError(error, "Error updating quicklist. Please try again."));
      throw err;
    }
  };

  const handleDelete = () => {
    if (!quicklist) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!quicklist) return;

    setIsDeleting(true);
    try {
      await quicklistService.deleteQuickList(quicklist.id);
      showToast(`QuickList "${quicklist.name}" deleted successfully`);
      setShowDeleteModal(false);
      navigate("/dashboard/quick-lists");
    } catch (err) {
      showError("Error deleting quicklist", extractBackendError(error, "Error deleting quicklist. Please try again."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const loadTableMapping = async () => {
    if (!quicklist?.upload_type) return;

    try {
      setLoadingMapping(true);
      const response = await quicklistService.getTableMappingByUploadType(
        quicklist.upload_type,
        true,
      );
      if (response.success) {
        setTableMapping(response.data);
      }
    } catch (err) {
      // Silently fail - mapping might not exist
      console.error("Failed to load table mapping:", err);
    } finally {
      setLoadingMapping(false);
    }
  };

  const loadUploadTypeSchema = async () => {
    if (!quicklist?.upload_type) return;

    try {
      setLoadingSchema(true);
      const response = await quicklistService.getUploadTypeSchema(
        quicklist.upload_type,
        true,
      );
      if (response.success) {
        setUploadTypeSchema(response.data);
      }
    } catch (err) {
      // Silently fail - schema might not exist
      console.error("Failed to load upload type schema:", err);
    } finally {
      setLoadingSchema(false);
    }
  };

  const returnTo = (
    location.state as { returnTo?: { pathname: string; state?: unknown } }
  )?.returnTo;

  const navigateBack = () => {
    if (returnTo) {
      navigate(returnTo.pathname, {
        replace: true,
        state: returnTo.state,
      });
      return;
    }

    // Navigate back based on current route context
    const currentPath = location.pathname;
    const isManualBroadcast = currentPath.includes("/manual-communication/");
    const fallbackPath = isManualBroadcast
      ? "/dashboard/manual-communications"
      : "/dashboard/quick-lists";
    navigateBackOrFallback(navigate, fallbackPath);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return formatDateWithTimezone(dateString, getSettingsTimezoneOffset(), "YYYY-MM-DD HH:mm", true);
  };

  const formatCellValue = (value: unknown): string => {
    if (value === undefined || value === null) {
      return "-";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    const stringValue = String(value);

    // Handle scientific notation (e.g., 1.254E+11)
    if (stringValue.includes("E") || stringValue.includes("e")) {
      try {
        const num = Number(value);
        if (!isNaN(num) && Number.isInteger(num)) {
          // Use fixed notation to avoid scientific notation
          return num.toFixed(0);
        }
      } catch {
        // Fallback to original string
      }
    }

    return stringValue;
  };

  // Data table columns
  const dataDefaultColumns: TableColumn<QuickListData>[] = useMemo(() => {
    const columns: TableColumn<QuickListData>[] = [
      {
        id: "row_number",
        label: "Row",
        visible: true,
        sortable: true,
        render: (_, row: any) => {
          const index = data.findIndex((d) => d.id === row.id);
          return index + 1;
        },
      },
    ];

    dataColumns.forEach((column) => {
      columns.push({
        id: column,
        label: column.replace(/_/g, " "),
        visible: true,
        sortable: true,
        filterConfig: { type: 'text' },
        render: (_, row: any) => {
          const rowDataObj = (row as Record<string, unknown>)
            .row_data as Record<string, unknown> | undefined;
          let value: any;
          if (rowDataObj && rowDataObj[column] !== undefined) {
            value = rowDataObj[column];
          } else {
            value = (row as Record<string, unknown>)[column];
          }
          return formatCellValue(value);
        },
      });
    });

    return columns;
  }, [data, dataColumns]);

  const importLogsDefaultColumns: TableColumn<ImportLog>[] = useMemo(() => [
    {
      id: "row_number",
      label: "Row Number",
      visible: true,
      sortable: true,
      filterConfig: { type: 'number' },
      render: (value) => value,
    },
    {
      id: "import_status",
      label: "Status",
      visible: true,
      sortable: true,
      filterConfig: { type: 'select', options: ['success', 'failed', 'pending'] },
      render: (value) => {
        const status = value as string;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
              status === "success"
                ? "bg-green-100 text-green-800"
                : status === "failed"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      id: "error_message",
      label: "Error Message",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
      render: (value) => value || "-",
    },
    {
      id: "created_at",
      label: "Created",
      visible: true,
      sortable: true,
      filterConfig: { type: 'date' },
      render: (value) => formatDate(value as string),
    },
  ], [formatDate]);

  const auditTrailDefaultColumns: TableColumn<any>[] = useMemo(() => [
    {
      id: "member_id",
      label: "Member ID",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
      render: (value) => value || "-",
    },
    {
      id: "identifier",
      label: "Identifier",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
      render: (value) => value || "-",
    },
    {
      id: "identifier_type",
      label: "Type",
      visible: true,
      sortable: true,
      filterConfig: { type: 'select', options: ['msisdn', 'email', 'id'] },
      render: (value) => {
        const type = value as string;
        const displayMap: Record<string, string> = {
          msisdn: "Phone",
          email: "Email",
          id: "ID",
        };
        return displayMap[type] || type;
      },
    },
    {
      id: "removed_at",
      label: "Removed At",
      visible: true,
      sortable: true,
      filterConfig: { type: 'date' },
      render: (value) => formatDate(value as string),
    },
    {
      id: "removed_by",
      label: "Removed By",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
      render: (value) => value || "-",
    },
  ], [formatDate]);

  // Memoized column definitions
  const dataTableColumns = dataDefaultColumns;
  const importLogsColumns = importLogsDefaultColumns;
  const auditTrailColumns = auditTrailDefaultColumns;

  // useTable hooks for managing sorting, filtering, column management
  const {
    columns: dataColumns_,
    currentPage: dataCurrentPage,
    pageSize: dataPageSize,
    handlePageChange: handleDataPageChange,
    handlePageSizeChange: handleDataPageSizeChange,
    sortConfigs: dataSortConfigs,
    handleSort: handleDataSort,
    toggleColumn: handleDataToggleColumn,
  } = useTable({
    tableId: "quicklist-data-table",
    defaultColumns: dataDefaultColumns,
    persistToLocalStorage: true,
  });

  const {
    columns: logsColumns_,
    currentPage: logsCurrentPage,
    pageSize: logsPageSize,
    handlePageChange: handleLogsPageChange,
    handlePageSizeChange: handleLogsPageSizeChange,
    sortConfigs: logsSortConfigs,
    handleSort: handleLogsSort,
    toggleColumn: handleLogsToggleColumn,
  } = useTable({
    tableId: "quicklist-import-logs-table",
    defaultColumns: importLogsDefaultColumns,
    persistToLocalStorage: true,
  });

  const {
    columns: auditColumns_,
    currentPage: auditCurrentPage,
    pageSize: auditPageSize,
    handlePageChange: handleAuditPageChange,
    handlePageSizeChange: handleAuditPageSizeChange,
    sortConfigs: auditSortConfigs,
    handleSort: handleAuditSort,
    toggleColumn: handleAuditToggleColumn,
  } = useTable({
    tableId: "quicklist-audit-trail-table",
    defaultColumns: auditTrailDefaultColumns,
    persistToLocalStorage: true,
  });

  // Debug logs

  const infoRowClass =
    "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 py-2";
  const infoValueClass =
    "text-sm font-medium text-left sm:text-right break-words";
  const timelineRowClass =
    "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 py-2";
  const tableBodyBackground = color.surface.tablebodybg;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner variant="modern" size="lg" color="primary" />
      </div>
    );
  }

  if (!quicklist && !isLoading) {
    return (
      <div className="p-6">
        <div
          className={`bg-red-50 border border-red-200 ${tw.rounded} p-6 text-center`}
        >
          <p className="text-red-600">QuickList not found</p>
          <button
            onClick={navigateBack}
            className={`mt-4 px-4 py-2 bg-red-600 text-white ${tw.rounded} hover:bg-red-700`}
          >
            Back to QuickLists
          </button>
        </div>
      </div>
    );
  }

  if (!quicklist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner variant="modern" size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton
          showBreadcrumb={true}
          currentLabel="QuickList Details"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleEdit}
            className={`px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors flex items-center justify-center gap-2 whitespace-nowrap`}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--c-text-primary)',
              border: '1px solid var(--c-text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleCommunicate}
            className={`px-4 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors flex items-center justify-center gap-2 whitespace-nowrap`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Send className="w-4 h-4" />
            Send Communication
          </button>
          {/* More Menu */}
          <div className="relative flex-shrink-0" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors flex items-center justify-center gap-2 whitespace-nowrap`}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--c-text-primary)',
                border: '1px solid var(--c-text-primary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <MoreVertical className="w-4 h-4" />
              More
            </button>
            {showMoreMenu && (
              <div
                className={`absolute right-0 top-full mt-1 w-48 ${tw.rounded} shadow-lg py-1 z-10`}
                style={{
                  backgroundColor: 'var(--c-surface-cards)',
                  border: '1px solid var(--c-border-default)',
                }}
              >
                <button
                  onClick={() => {
                    handleAddCustomer();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--c-text-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                  Add Customer
                </button>
                <button
                  onClick={() => {
                    handleRemoveCustomer();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--c-text-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <UserMinus className="w-4 h-4" />
                  Remove Customer
                </button>
                <button
                  onClick={() => {
                    handleDelete();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => {
                    handleExport("csv");
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--c-text-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    handleExport("json");
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--c-text-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <style>{`
        @media (max-width: 640px) {
          .quicklist-tabs::-webkit-scrollbar {
            display: none;
          }
          .quicklist-tabs {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
      <div className="quicklist-tabs flex gap-1 border-b border-gray-200 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: FileText },
          { id: "data", label: "Data", icon: Database },
          { id: "logs", label: "Import Logs", icon: AlertCircle },
          { id: "audit-trail", label: "Audit Trail", icon: AlertCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveSection(tab.id as "overview" | "data" | "logs" | "audit-trail")
            }
            className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 relative flex-shrink-0 ${
              activeSection === tab.id
                ? "text-black"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeSection === tab.id && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: color.primary.accent }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSection === "overview" && (
        <div
          className={`${tw.rounded} overflow-hidden`}
          style={{
            backgroundColor: 'var(--c-surface-background)',
            border: '1px solid var(--c-border-default)',
          }}
        >
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* QuickList Information */}
                <div
                  className={`${tw.rounded} p-4`}
                  style={{
                    // backgroundColor: 'var(--c-quicklist-inner-card)',
                  }}
                >
                  <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--c-text-primary)' }}>
                    QuickList Information
                  </h3>
                  <div className="space-y-3">
                    {quicklist.description && (
                      <div className={infoRowClass}>
                        <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                          Description
                        </span>
                        <span className={infoValueClass} style={{ color: 'var(--c-text-primary)' }}>
                          {quicklist.description}
                        </span>
                      </div>
                    )}
                    <div className={infoRowClass}>
                      <span className="text-sm text-gray-600">Upload Type</span>
                      <span className={`${infoValueClass} text-gray-900`}>
                        {quicklist.upload_type}
                      </span>
                    </div>
                    {quicklist.original_filename && (
                      <div className={infoRowClass}>
                        <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>File Name</span>
                        <span className={infoValueClass} style={{ color: 'var(--c-text-primary)' }}>
                          {quicklist.original_filename}
                        </span>
                      </div>
                    )}
                    {quicklist.created_by && (
                      <div className={infoRowClass}>
                        <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                          Created By
                        </span>
                        <span className={infoValueClass} style={{ color: 'var(--c-text-primary)' }}>
                          {quicklist.created_by}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* File Information */}
                <div
                  className={`${tw.rounded} p-4`}
                  style={{
                    // backgroundColor: 'var(--c-quicklist-inner-card)',
                  }}
                >
                  <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--c-text-primary)' }}>
                    File Information
                  </h3>
                  <div className="space-y-3">
                    <div className={infoRowClass}>
                      <span className="text-sm text-gray-600">File Size</span>
                      <span className={`${infoValueClass} text-gray-900`}>
                        {quicklist.file_size_bytes != null
                          ? formatFileSize(quicklist.file_size_bytes)
                          : "N/A"}
                      </span>
                    </div>
                    <div className={infoRowClass}>
                      <span className="text-sm text-gray-600">
                        Rows Imported
                      </span>
                      <span className={`${infoValueClass} text-gray-900`}>
                        {quicklist.rows_imported != null
                          ? quicklist.rows_imported.toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className={infoRowClass}>
                      <span className="text-sm text-gray-600">Rows Failed</span>
                      <span className={`${infoValueClass} text-gray-900`}>
                        {quicklist.rows_failed != null
                          ? quicklist.rows_failed.toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className={infoRowClass}>
                      <span className="text-sm text-gray-600">
                        Processing Status
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium  self-start sm:self-auto`}
                        style={{ backgroundColor: color.primary.accent }}
                      >
                        {quicklist.processing_status
                          ? quicklist.processing_status
                              .charAt(0)
                              .toUpperCase() +
                            quicklist.processing_status.slice(1)
                          : "N/A"}
                      </span>
                    </div>
                    {quicklist.processing_error && (
                      <div className={infoRowClass}>
                        <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                          Processing Error
                        </span>
                        <span className={`${infoValueClass} text-red-600`}>
                          {quicklist.processing_error}
                        </span>
                      </div>
                    )}
                    {quicklist.processing_time_ms != null && (
                      <div className={infoRowClass}>
                        <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                          Processing Time
                        </span>
                        <span className={infoValueClass} style={{ color: 'var(--c-text-primary)' }}>
                          {quicklist.processing_time_ms}ms
                        </span>
                      </div>
                    )}
                    <div className={infoRowClass}>
                      <span className="text-sm text-gray-600">Table Name</span>
                      <span className={`${infoValueClass} text-gray-900`}>
                        {quicklist.data_table_name || "N/A"}
                      </span>
                    </div>
                    {/* Commented out - Table mapping details */}
                    {/* {tableMapping && (
                      <>
                        <div className="flex justify-between items-start py-2">
                          <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                            Schema Name
                          </span>
                          <span className="text-sm font-medium text-gray-900 font-mono">
                            {tableMapping.schema_name || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start py-2">
                          <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                            Total Rows in Table
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {tableMapping.total_rows?.toLocaleString() || "N/A"}
                          </span>
                        </div>
                      </>
                    )} */}
                  </div>
                </div>

                {/* Commented out - Table Mapping Information */}
                {/* {tableMapping && (
                  <div className={`bg-gray-50 ${tw.rounded} p-4 border border-gray-100`}>
                    <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--c-text-primary)' }}>
                      Table Mapping
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start py-2">
                        <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                          Full Table Name
                        </span>
                        <span className="text-sm font-medium text-gray-900 font-mono text-right">
                          {tableMapping.table_name || "N/A"}
                        </span>
                      </div>
                      {tableMapping.column_mappings &&
                        Object.keys(tableMapping.column_mappings).length >
                          0 && (
                          <div className="py-2">
                            <span className="text-sm text-gray-600 block mb-2">
                              Column Mappings
                            </span>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {Object.entries(tableMapping.column_mappings).map(
                                ([displayName, columnName]) => (
                                  <div
                                    key={displayName}
                                    className="flex justify-between items-start text-xs"
                                  >
                                    <span className="text-gray-600 font-medium">
                                      {displayName}:
                                    </span>
                                    <span className="text-gray-900 font-mono ml-2">
                                      {columnName}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )} */}

                {/* Commented out - Upload Type Schema */}
                {/* {uploadTypeSchema && (
                  <div className={`bg-gray-50 ${tw.rounded} p-4 border border-gray-100`}>
                    <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--c-text-primary)' }}>
                      Upload Type Schema
                    </h3>
                    <div className="space-y-3">
                      {uploadTypeSchema.description && (
                        <div className="py-2">
                          <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                            Description
                          </span>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {uploadTypeSchema.description}
                          </p>
                        </div>
                      )}
                      {uploadTypeSchema.expected_columns && (
                        <div className="py-2">
                          <span className="text-sm text-gray-600 block mb-2">
                            Expected Columns (
                            {Array.isArray(uploadTypeSchema.expected_columns)
                              ? uploadTypeSchema.expected_columns.length
                              : Object.keys(uploadTypeSchema.expected_columns)
                                  .length}
                            )
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(uploadTypeSchema.expected_columns)
                              ? uploadTypeSchema.expected_columns.map(
                                  (col, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                                    >
                                      {col}
                                    </span>
                                  )
                                )
                              : Object.keys(
                                  uploadTypeSchema.expected_columns
                                ).map((col, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                                  >
                                    {col}
                                  </span>
                                ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-start py-2">
                        <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                          Allow Extra Columns
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {uploadTypeSchema.validation_rules
                            ?.allow_extra_columns
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between items-start py-2">
                        <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                          Require All Columns
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {uploadTypeSchema.validation_rules
                            ?.require_all_columns
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between items-start py-2">
                        <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                          Max File Size
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {uploadTypeSchema.file_constraints
                            ?.max_file_size_mb || "N/A"}{" "}
                          MB
                        </span>
                      </div>
                    </div>
                  </div>
                )} */}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`${tw.rounded} p-4`}
                  >
                    <p className="text-xs" style={{ color: 'var(--c-text-secondary)' }}>Upload Type</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--c-text-primary)' }}>
                      {quicklist.upload_type}
                    </p>
                  </div>

                  <div
                    className={`${tw.rounded} p-4`}
                  >
                    <p className="text-xs" style={{ color: 'var(--c-text-secondary)' }}>Rows Imported</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--c-text-primary)' }}>
                      {quicklist.rows_imported != null
                        ? quicklist.rows_imported.toLocaleString()
                        : "N/A"}
                    </p>
                  </div>

                  <div
                    className={`${tw.rounded} p-4`}
                  >
                    <p className="text-xs" style={{ color: 'var(--c-text-secondary)' }}>Created</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--c-text-primary)' }}>
                      {formatDate(quicklist.created_at)}
                    </p>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div
                  className={`${tw.rounded} p-4`}
                  style={{
                    backgroundColor: 'transparent',
                  }}
                >
                  <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--c-text-primary)' }}>
                    Activity Timeline
                  </h3>
                  <div className="space-y-3">
                    <div className={timelineRowClass}>
                      <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>Created</span>
                      <span className={infoValueClass} style={{ color: 'var(--c-text-primary)' }}>
                        {formatDate(quicklist.created_at)}
                      </span>
                    </div>
                    {quicklist.updated_at && (
                      <div className={timelineRowClass}>
                        <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>Updated</span>
                        <span className={infoValueClass} style={{ color: 'var(--c-text-primary)' }}>
                          {formatDate(quicklist.updated_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === "data" && (
        <div>
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner
                variant="modern"
                size="lg"
                color="primary"
                className="mr-3"
              />
              <span className={`${tw.textSecondary}`}>Loading data...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-base font-medium text-gray-900 mb-1">
                No Data Available
              </p>
              <p className="text-sm text-gray-500">
                No data rows found for this quicklist.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dataPagination && dataPagination.total > data.length && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-sm text-gray-600">
                    Showing {data.length} of {dataPagination.total} rows
                  </p>
                </div>
              )}
              <Table<QuickListData>
                columns={dataColumns_}
                data={data}
                totalItems={dataPagination?.total || data.length}
                currentPage={dataCurrentPage}
                pageSize={dataPageSize}
                isLoading={loadingData}
                onPageChange={handleDataPageChange}
                onPageSizeChange={handleDataPageSizeChange}
                onSort={handleDataSort}
                sortConfigs={dataSortConfigs}
                onHideColumn={handleDataToggleColumn}
                onManageColumnsClick={() => setShowDataColumnPicker(true)}
              />
              {data.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={dataCurrentPage}
                    pageSize={dataPageSize}
                    totalItems={dataPagination?.total || data.length}
                    onPageChange={handleDataPageChange}
                    onPageSizeChange={handleDataPageSizeChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeSection === "logs" && (
        <div>
          {loadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner
                variant="modern"
                size="lg"
                color="primary"
                className="mr-3"
              />
              <span className={`${tw.textSecondary}`}>
                Loading import logs...
              </span>
            </div>
          ) : importLogs.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-base font-medium text-gray-900 mb-1">
                No Import Logs
              </p>
              <p className="text-sm text-gray-500">
                No import logs available for this quicklist.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logsPagination && logsPagination.total > importLogs.length && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-sm text-gray-600">
                    Showing {importLogs.length} of {logsPagination.total} logs
                  </p>
                </div>
              )}
              
              <Table<ImportLog>
                columns={logsColumns_}
                data={importLogs}
                totalItems={logsPagination?.total || importLogs.length}
                currentPage={logsCurrentPage}
                pageSize={logsPageSize}
                isLoading={loadingLogs}
                onPageChange={handleLogsPageChange}
                onPageSizeChange={handleLogsPageSizeChange}
                onSort={handleLogsSort}
                sortConfigs={logsSortConfigs}
                onHideColumn={handleLogsToggleColumn}
                onManageColumnsClick={() => setShowLogsColumnPicker(true)}
              />
              {importLogs.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={logsCurrentPage}
                    pageSize={logsPageSize}
                    totalItems={logsPagination?.total || importLogs.length}
                    onPageChange={handleLogsPageChange}
                    onPageSizeChange={handleLogsPageSizeChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeSection === "audit-trail" && (
        <div>
          {loadingAuditTrail ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner
                variant="modern"
                size="lg"
                color="primary"
                className="mr-3"
              />
              <span className={`${tw.textSecondary}`}>
                Loading audit trail...
              </span>
            </div>
          ) : auditTrail.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-base font-medium text-gray-900 mb-1">
                No Removed Members
              </p>
              <p className="text-sm text-gray-500">
                No members have been removed from this quicklist.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditTrailPagination && auditTrailPagination.total > auditTrail.length && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-sm text-gray-600">
                    Showing {auditTrail.length} of {auditTrailPagination.total} removed members
                  </p>
                </div>
              )}
              
              <Table<any>
                columns={auditColumns_}
                data={auditTrail}
                totalItems={auditTrailPagination?.total || auditTrail.length}
                currentPage={auditCurrentPage}
                pageSize={auditPageSize}
                isLoading={loadingAuditTrail}
                onPageChange={handleAuditPageChange}
                onPageSizeChange={handleAuditPageSizeChange}
                onSort={handleAuditSort}
                sortConfigs={auditSortConfigs}
                onHideColumn={handleAuditToggleColumn}
                onManageColumnsClick={() => setShowAuditColumnPicker(true)}
              />
              {auditTrail.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={auditCurrentPage}
                    pageSize={auditPageSize}
                    totalItems={auditTrailPagination?.total || auditTrail.length}
                    onPageChange={handleAuditPageChange}
                    onPageSizeChange={handleAuditPageSizeChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Communication Modal */}
      {isCommunicateModalOpen && quicklist && (
        <CreateCommunicationModal
          isOpen={isCommunicateModalOpen}
          onClose={() => setIsCommunicateModalOpen(false)}
          quicklist={quicklist}
          onSuccess={(result) => {
            showToast(
              `Communication sent successfully! ${result.total_messages_sent} messages sent.`,
            );
          }}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && quicklist && (
        <EditQuickListModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateQuickList}
          initialName={quicklist.name}
          initialDescription={quicklist.description || null}
        />
      )}

      {/* Manage Customers Modal */}
      {isManageCustomersModalOpen && quicklist && (
        <ManageQuickListCustomersModal
          isOpen={isManageCustomersModalOpen}
          onClose={() => setIsManageCustomersModalOpen(false)}
          quicklist={quicklist}
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
                      quicklist.id,
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
                    `${customers.length} customer${customers.length !== 1 ? "s" : ""} added to ${quicklist.name}`,
                  );
                  // Optimistic update: increment rows_imported immediately (no full reload)
                  if (quicklist) {
                    setQuicklist((prev) =>
                      prev ? { ...prev, rows_imported: (prev.rows_imported ?? 0) + customers.length } : prev,
                    );
                  }
                }
              } else {
                // Remove customers one by one
                // Note: For removal, we need the member_id from the quicklist data
                // For now, using customer_id as member_id (assuming they match)
                const results = await Promise.all(
                  customers.map((customer) =>
                    quicklistService.removeMemberFromQuickList(
                      quicklist.id,
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
                    `${customers.length} customer${customers.length !== 1 ? "s" : ""} removed from ${quicklist.name}`,
                  );
                  // Optimistic update: decrement rows_imported immediately (no full reload)
                  if (quicklist) {
                    setQuicklist((prev) =>
                      prev ? { ...prev, rows_imported: Math.max(0, (prev.rows_imported ?? 0) - customers.length) } : prev,
                    );
                  }
                }
              }

              setIsManageCustomersModalOpen(false);
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete QuickList"
        description="Are you sure you want to delete this QuickList? This action cannot be undone and will delete all associated data."
        itemName={quicklist?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete QuickList"
        cancelText="Cancel"
      />

      {/* Column Picker Modals */}
      <ColumnPickerModal
        isOpen={showDataColumnPicker}
        columns={dataColumns_}
        onClose={() => setShowDataColumnPicker(false)}
        onToggleColumn={handleDataToggleColumn}
        onResetToDefaults={() => {}}
      />

      <ColumnPickerModal
        isOpen={showLogsColumnPicker}
        columns={logsColumns_}
        onClose={() => setShowLogsColumnPicker(false)}
        onToggleColumn={handleLogsToggleColumn}
        onResetToDefaults={() => {}}
      />

      <ColumnPickerModal
        isOpen={showAuditColumnPicker}
        columns={auditColumns_}
        onClose={() => setShowAuditColumnPicker(false)}
        onToggleColumn={handleAuditToggleColumn}
        onResetToDefaults={() => {}}
      />
    </div>
  );
}
