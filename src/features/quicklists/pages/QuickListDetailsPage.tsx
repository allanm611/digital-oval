import { useState, useEffect, useRef } from "react";
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
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import BackButton from "../../../shared/components/ui/BackButton";
import CreateCommunicationModal from "../../communications/components/CreateCommunicationModal";
import EditQuickListModal from "../components/EditQuickListModal";

export default function QuickListDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success: showToast, error: showError } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [quicklist, setQuicklist] = useState<QuickList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<
    "overview" | "data" | "logs"
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

  const [isCommunicateModalOpen, setIsCommunicateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [tableMapping, setTableMapping] =
    useState<QuickListTableMapping | null>(null);
  const [uploadTypeSchema, setUploadTypeSchema] =
    useState<UploadTypeSchema | null>(null);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [loadingSchema, setLoadingSchema] = useState(false);
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
      showError(
        "Error loading quicklist",
        err instanceof Error ? err.message : "Failed to load quicklist details",
      );
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

        // Extract columns from data - show all columns, not just first 10
        if (response.data && response.data.length > 0) {
          const firstRow = response.data[0];
          const extractedColumns = Object.keys(firstRow).filter(
            (key) =>
              !["id", "quicklist_id", "created_at", "row_number"].includes(key),
          );
          setDataColumns(extractedColumns);
        } else {
          setDataColumns([]);
        }
      }
    } catch (err) {
      showError(
        "Error loading data",
        err instanceof Error ? err.message : "Failed to load quicklist data",
      );
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
      showError(
        "Error loading import logs",
        err instanceof Error ? err.message : "Failed to load import logs",
      );
    } finally {
      setLoadingLogs(false);
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
      showError(
        "Error exporting quicklist",
        err instanceof Error ? err.message : "Failed to export quicklist",
      );
    }
  };

  const handleCommunicate = () => {
    if (quicklist) {
      setIsCommunicateModalOpen(true);
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
      showError(
        "Error updating quicklist",
        err instanceof Error ? err.message : "Failed to update QuickList",
      );
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
      navigate("/dashboard/quicklists");
    } catch (err) {
      showError(
        "Error deleting quicklist",
        err instanceof Error ? err.message : "Failed to delete QuickList",
      );
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
      : "/dashboard/quicklists";
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4 flex-wrap">
          <BackButton
            fallbackTo="/dashboard/quicklists"
            onClick={navigateBack}
          />
          <div className="min-w-0">
            <h1
              className={`${tw.mainHeading} ${tw.textPrimary} break-words text-base sm:text-2xl`}
            >
              {quicklist.name}
            </h1>
            {quicklist.description && (
              <p className={`${tw.textSecondary} text-sm mt-1 break-words`}>
                {quicklist.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button
            onClick={handleEdit}
            className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap`}
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
              className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap`}
            >
              <MoreVertical className="w-4 h-4" />
              More
            </button>
            {showMoreMenu && (
              <div
                className={`absolute right-0 top-full mt-1 w-48 bg-white ${tw.rounded} shadow-lg border border-gray-200 py-1 z-10`}
              >
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
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    handleExport("json");
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
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
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveSection(tab.id as "overview" | "data" | "logs")
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
          className={`bg-white border border-gray-200 ${tw.rounded} overflow-hidden`}
        >
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* QuickList Information */}
                <div
                  className={`bg-gray-50 ${tw.rounded} p-4 border border-gray-100`}
                >
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    QuickList Information
                  </h3>
                  <div className="space-y-3">
                    <div className={infoRowClass}>
                      <span className="text-sm text-gray-600">Name</span>
                      <span className={`${infoValueClass} text-gray-900`}>
                        {quicklist.name}
                      </span>
                    </div>
                    {quicklist.description && (
                      <div className={infoRowClass}>
                        <span className="text-sm text-gray-600">
                          Description
                        </span>
                        <span className={`${infoValueClass} text-gray-900`}>
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
                        <span className="text-sm text-gray-600">File Name</span>
                        <span className={`${infoValueClass} text-gray-900`}>
                          {quicklist.original_filename}
                        </span>
                      </div>
                    )}
                    {quicklist.created_by && (
                      <div className={infoRowClass}>
                        <span className="text-sm text-gray-600">
                          Created By
                        </span>
                        <span className={`${infoValueClass} text-gray-900`}>
                          {quicklist.created_by}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* File Information */}
                <div
                  className={`bg-gray-50 ${tw.rounded} p-4 border border-gray-100`}
                >
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
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
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white self-start sm:self-auto"
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
                        <span className="text-sm text-gray-600">
                          Processing Error
                        </span>
                        <span className={`${infoValueClass} text-red-600`}>
                          {quicklist.processing_error}
                        </span>
                      </div>
                    )}
                    {quicklist.processing_time_ms != null && (
                      <div className={infoRowClass}>
                        <span className="text-sm text-gray-600">
                          Processing Time
                        </span>
                        <span className={`${infoValueClass} text-gray-900`}>
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
                          <span className="text-sm text-gray-600">
                            Schema Name
                          </span>
                          <span className="text-sm font-medium text-gray-900 font-mono">
                            {tableMapping.schema_name || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start py-2">
                          <span className="text-sm text-gray-600">
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
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      Table Mapping
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start py-2">
                        <span className="text-sm text-gray-600">
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
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      Upload Type Schema
                    </h3>
                    <div className="space-y-3">
                      {uploadTypeSchema.description && (
                        <div className="py-2">
                          <span className="text-sm text-gray-600">
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
                        <span className="text-sm text-gray-600">
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
                        <span className="text-sm text-gray-600">
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
                        <span className="text-sm text-gray-600">
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
                    className={`bg-gray-50 ${tw.rounded} p-4 border border-gray-100`}
                  >
                    <p className="text-xs text-gray-500">Upload Type</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {quicklist.upload_type}
                    </p>
                  </div>

                  <div
                    className={`bg-gray-50 ${tw.rounded} p-4 border border-gray-100`}
                  >
                    <p className="text-xs text-gray-500">Rows Imported</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {quicklist.rows_imported != null
                        ? quicklist.rows_imported.toLocaleString()
                        : "N/A"}
                    </p>
                  </div>

                  <div
                    className={`bg-gray-50 ${tw.rounded} p-4 border border-gray-100`}
                  >
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(quicklist.created_at)}
                    </p>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div
                  className={`bg-gray-50 ${tw.rounded} p-4 border border-gray-100`}
                >
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    Activity Timeline
                  </h3>
                  <div className="space-y-3">
                    <div className={timelineRowClass}>
                      <span className="text-sm text-gray-600">Created</span>
                      <span className={`${infoValueClass} text-gray-900`}>
                        {formatDate(quicklist.created_at)}
                      </span>
                    </div>
                    {quicklist.updated_at && (
                      <div className={timelineRowClass}>
                        <span className="text-sm text-gray-600">Updated</span>
                        <span className={`${infoValueClass} text-gray-900`}>
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
              <div
                className={`border border-gray-200 ${tw.rounded} overflow-hidden`}
              >
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-sm"
                    style={{
                      borderCollapse: "separate",
                      borderSpacing: "0 6px",
                    }}
                  >
                    <thead
                      className={`border-b ${tw.borderDefault}`}
                      style={{ background: color.surface.tableHeader }}
                    >
                      <tr>
                        <th
                          className={`px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap min-w-[80px]`}
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Row
                        </th>
                        {dataColumns.map((column) => (
                          <th
                            key={column}
                            className={`px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap min-w-[120px]`}
                            style={{ color: color.surface.tableHeaderText }}
                          >
                            {column.replace(/_/g, " ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, index) => (
                        <tr
                          key={row.id}
                          className="hover:bg-gray-50/40 transition-colors rounded"
                        >
                          <td
                            className="px-6 py-4 text-gray-900 font-medium rounded-l-md"
                            style={{ backgroundColor: tableBodyBackground }}
                          >
                            {index + 1}
                          </td>
                          {dataColumns.map((column, columnIndex) => (
                            <td
                              key={column}
                              className={`px-6 py-4 text-gray-600 ${
                                columnIndex === dataColumns.length - 1
                                  ? "rounded-r-md"
                                  : ""
                              }`}
                              style={{ backgroundColor: tableBodyBackground }}
                            >
                              {(row as Record<string, unknown>)[column] !==
                                undefined &&
                              (row as Record<string, unknown>)[column] !== null
                                ? String(
                                    (row as Record<string, unknown>)[column],
                                  )
                                : "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
              <div
                className={`border border-gray-200 ${tw.rounded} overflow-hidden`}
              >
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-sm min-w-[720px]"
                    style={{
                      borderCollapse: "separate",
                      borderSpacing: "0 6px",
                    }}
                  >
                    <thead
                      className={`border-b ${tw.borderDefault}`}
                      style={{ background: color.surface.tableHeader }}
                    >
                      <tr>
                        <th
                          className={`px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap`}
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Row Number
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap`}
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Status
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap`}
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Error Message
                        </th>
                        <th
                          className={`px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap`}
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {importLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-gray-50/30 transition-colors rounded"
                        >
                          <td
                            className="px-6 py-4 text-gray-900 font-medium rounded-l-md whitespace-nowrap"
                            style={{ backgroundColor: tableBodyBackground }}
                          >
                            {log.row_number}
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap"
                            style={{ backgroundColor: tableBodyBackground }}
                          >
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                                log.import_status === "success"
                                  ? "bg-green-100 text-green-800"
                                  : log.import_status === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {log.import_status}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 text-gray-600"
                            style={{ backgroundColor: tableBodyBackground }}
                          >
                            {log.error_message || "-"}
                          </td>
                          <td
                            className="px-6 py-4 text-gray-600 rounded-r-md whitespace-nowrap"
                            style={{ backgroundColor: tableBodyBackground }}
                          >
                            {formatDate(log.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
            setIsCommunicateModalOpen(false);
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
    </div>
  );
}
