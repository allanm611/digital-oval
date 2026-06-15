import { useState, useEffect, useCallback } from "react";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { useNavigate } from "react-router-dom";
import {
  Download,
  BarChart3,
  Play,
  ChevronDown,
  FileText,
  CheckCircle,
  Upload,
  X,
  AlertTriangle,
} from "lucide-react";
import { etlService } from "../services/etlService";
import { EtlFileRegistryRowType, FileStatsResponse } from "../types/etl";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  color,
  tw,
  button,
  getButtonStyles,
} from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import FetchControlsModal from "../components/FetchControlsModal";
import { PermissionGate } from "../../auth/components/PermissionGate";
import DateFormatter from "../../../shared/components/DateFormatter";

const PAGE_SIZE = 15;

type StatusFilter = "all" | "pending" | "processing" | "completed" | "failed";
type CategoryFilter = "all" | "CDR" | "TDR" | string;
type FetchMode = "immediate" | "by-time" | "by-range";

export default function EtlFileRegistryPage() {
  const { error: showError, success } = useToast();
  const languageContext = useLanguage();
  const t = languageContext.t as Record<string, Record<string, string>>;
  const navigate = useNavigate();

  // Fetch controls modal
  const [fetchModalMode, setFetchModalMode] = useState<FetchMode | null>(null);
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);
  const [showFetchDropdown, setShowFetchDropdown] = useState(false);

  // Upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<"CDR" | "TDR">("CDR");
  const [uploadPreview, setUploadPreview] = useState<{
    headers: string[];
    rows: Record<string, string>[];
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<FileStatsResponse | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Registry table data
  const [files, setFiles] = useState<EtlFileRegistryRowType[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Table columns definition
  const defaultColumns: TableColumn<EtlFileRegistryRowType>[] = [
    {
      id: "file_name",
      label: "File Name",
      visible: true,
      render: (value) => (
        <div className={`${tw.tableFirstColumn} text-sm`}>
          {value || "—"}
        </div>
      ),
    },
    {
      id: "file_category",
      label: "Category",
      visible: true,
      render: (value) => (
        <span className="text-sm text-gray-600">{value || "—"}</span>
      ),
    },
    {
      id: "processing_status",
      label: "Status",
      visible: true,
      render: (value) => (
        <span className="text-sm text-gray-600">{getStatusBadge(value)}</span>
      ),
    },
    {
      id: "record_count",
      label: "Records",
      visible: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? <NumberFormatter value={Number(value)} /> : "—"}
        </span>
      ),
    },
    {
      id: "created_at",
      label: "Created",
      visible: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          <DateFormatter date={value as string} useUserTimezone />
        </span>
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
    tableId: "etl-files-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  // Load stats
  const loadStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const response = await etlService.getFileStats();
      setStats(response);
    } catch (err) {
      showError(
        t.etl.failedToLoadStatistics,
        (err as Error).message || t.etl.pleaseRetryLater,
      );
    } finally {
      setIsLoadingStats(false);
    }
  }, [showError, t.etl]);

  // Load registry
  const loadRegistry = useCallback(async () => {
    setIsLoadingFiles(true);
    try {
      const response = await etlService.getFileRegistry({
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });

      const filesList = Array.isArray(response.data) ? response.data : [];
      setFiles(filesList);

      if (response.pagination) {
        setTotalCount(response.pagination.total);
      }
    } catch (err) {
      showError(
        t.etl.failedToLoadFileRegistry,
        (err as Error).message || t.etl.unableToFetchFiles,
      );
      setFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [page, categoryFilter, statusFilter, showError, t.etl]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter]);

  const handleFetchModalOpen = (mode: FetchMode) => {
    setFetchModalMode(mode);
    setIsFetchModalOpen(true);
    setShowFetchDropdown(false);
  };

  const handleFetchModalClose = () => {
    setIsFetchModalOpen(false);
    setFetchModalMode(null);
  };

  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: t.etl.allStatuses, value: "all" },
    { label: t.etl.pending, value: "pending" },
    { label: t.etl.processingFilesStatus, value: "processing" },
    { label: t.etl.completed, value: "completed" },
    { label: t.etl.failed, value: "failed" },
  ];

  const categoryOptions: { label: string; value: CategoryFilter }[] = [
    { label: t.etl.allCategories, value: "all" },
    { label: t.etl.cdr, value: "CDR" },
    { label: t.etl.tdr, value: "TDR" },
  ];

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const getStatusBadge = (status: string) => {
    return <span className="text-black text-sm">{status}</span>;
  };

  const isEmptyState = !isLoadingFiles && files.length === 0;

  // Frontend filtering for search term
  const filteredFiles = files.filter((file) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      file.file_name?.toLowerCase().includes(searchLower) ||
      file.file_category?.toLowerCase().includes(searchLower) ||
      file.processing_status?.toLowerCase().includes(searchLower)
    );
  });

  const displayedFiles = filteredFiles.length > 0 ? filteredFiles : files;
  const showNoResults =
    !isLoadingFiles && searchTerm && filteredFiles.length === 0;

  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton
          showBreadcrumb={true}
          currentLabel="ETL"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowFetchDropdown(!showFetchDropdown)}
            className="inline-flex items-center gap-2 transition-colors"
            style={getButtonStyles(button.action)}
          >
            {t.etl.fetchControlsButton}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showFetchDropdown ? "rotate-180" : ""}`}
            />{" "}
          </button>

          <div className="relative">
            {showFetchDropdown && (
              <div
                className={`absolute top-full right-0 mt-2 ${tw.rounded} border shadow-lg z-40`}
                style={{
                  backgroundColor: color.surface.background,
                  borderColor: color.border.default,
                  minWidth: "200px",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleFetchModalOpen("immediate")}
                  className={`w-full text-left px-4 py-2.5 hover:opacity-70 transition-opacity text-sm ${tw.textPrimary}`}
                >
                  {t.etl.fetchNow}
                </button>
                <button
                  type="button"
                  onClick={() => handleFetchModalOpen("by-time")}
                  className={`w-full text-left px-4 py-2.5 hover:opacity-70 transition-opacity text-sm ${tw.textPrimary}`}
                >
                  {t.etl.fetchByTime}
                </button>
                <button
                  type="button"
                  onClick={() => handleFetchModalOpen("by-range")}
                  className={`w-full text-left px-4 py-2.5 hover:opacity-70 transition-opacity text-sm ${tw.textPrimary}`}
                >
                  {t.etl.fetchByDateRange}
                </button>
              </div>
            )}
          </div>
          <PermissionGate permission="etl.create">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 transition-colors"
              style={getButtonStyles(button.action)}
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
          </PermissionGate>

          <button
            type="button"
            onClick={() => navigate("/dashboard/etl/analytics")}
            className={`inline-flex items-center gap-2 ${tw.borderedButton}`}
            style={{
              borderColor: color.primary.action,
              color: color.primary.action,
            }}
          >
            <BarChart3 className="h-4 w-4" />
            {t.etl.analytics}
          </button>
        </div>
      </div>
      <p className={`${tw.textSecondary} text-sm mt-1`}>
        {t.etl.fileRegistryDescription}
      </p>

      <div className="mt-6">
      {/* Stats Cards */}
      {!isLoadingStats &&
        stats &&
        (() => {
          const statsArray = Array.isArray(stats.data) ? stats.data : [];

          const totalCdrFiles = statsArray
            .filter(
              (row: Record<string, unknown>) => row.file_category === "CDR",
            )
            .reduce(
              (sum: number, row: Record<string, unknown>) =>
                sum + parseInt((row.file_count as string) || "0", 10),
              0,
            );

          const totalTdrFiles = statsArray
            .filter(
              (row: Record<string, unknown>) => row.file_category === "TDR",
            )
            .reduce(
              (sum: number, row: Record<string, unknown>) =>
                sum + parseInt((row.file_count as string) || "0", 10),
              0,
            );

          const completedCdrFiles = statsArray
            .filter(
              (row: Record<string, unknown>) =>
                row.file_category === "CDR" &&
                row.processing_status === "completed",
            )
            .reduce(
              (sum: number, row: Record<string, unknown>) =>
                sum + parseInt((row.file_count as string) || "0", 10),
              0,
            );

          const completedTdrFiles = statsArray
            .filter(
              (row: Record<string, unknown>) =>
                row.file_category === "TDR" &&
                row.processing_status === "completed",
            )
            .reduce(
              (sum: number, row: Record<string, unknown>) =>
                sum + parseInt((row.file_count as string) || "0", 10),
              0,
            );

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <FileText
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Total CDR Files
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalCdrFiles}
                </p>
              </div>

              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <FileText
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Total TDR Files
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalTdrFiles}
                </p>
              </div>

              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Completed CDR
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {completedCdrFiles}
                </p>
              </div>

              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Completed TDR
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {completedTdrFiles}
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Filters */}
      <div className="space-y-4 mt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <SearchInput
          placeholder={t.etl.searchByFileName}
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <HeadlessSelect
          options={statusOptions}
          value={statusFilter}
          onChange={(v) => setStatusFilter((v as StatusFilter) || "all")}
          placeholder={t.etl.statusPlaceholder}
          className="md:w-48"
        />
        <HeadlessSelect
          options={categoryOptions}
          value={categoryFilter}
          onChange={(v) => setCategoryFilter((v as CategoryFilter) || "all")}
          placeholder={t.etl.categoryPlaceholder}
          className="md:w-48"
        />
      </div>
      </div>

      {/* Table */}
      <div>
        {isLoadingFiles ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner variant="modern" size="lg" color="primary" />
            <p className="mt-4 text-sm text-gray-500">
              {t.etl.loadingFileRegistry}
            </p>
          </div>
        ) : isEmptyState || showNoResults ? (
          <div className="py-16 text-center bg-white">
            <Download size={24} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              {showNoResults ? "No matching files found" : t.etl.noFilesFound}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {showNoResults
                ? "Try adjusting your search term or filters"
                : t.etl.adjustFiltersOrRefresh}
            </p>
          </div>
        ) : (
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<EtlFileRegistryRowType>
              columns={columns}
              data={displayedFiles}
              totalItems={totalCount}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={isLoadingFiles}
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
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoadingFiles && files.length > 0 && (
        <Pagination
          currentPage={tableCurrentPage}
          pageSize={tablePageSize}
          totalItems={totalCount}
          onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
        />
      )}

      {/* Fetch Controls Modal */}
      <FetchControlsModal
        mode={fetchModalMode}
        isOpen={isFetchModalOpen}
        onClose={handleFetchModalClose}
        onSuccess={(_, timeFilter) => {
          // Set category filter to match what was fetched
          if (timeFilter?.category) {
            setCategoryFilter(timeFilter.category as CategoryFilter);
          }
          setPage(1);
          loadRegistry();
          loadStats();
        }}
      />

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`bg-white ${tw.rounded} shadow-lg w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
                Upload CDR/TDR File
              </h2>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                  setUploadPreview(null);
                  setUploadError(null);
                }}
                className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* File Input */}
            <div>
              <label
                className={`text-sm font-medium ${tw.textPrimary} block mb-2`}
              >
                Select File
              </label>
              <div
                className={`border-2 border-dashed ${tw.rounded} p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
                style={{ borderColor: color.border.default }}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className={`text-sm ${tw.textPrimary}`}>
                  {uploadFile
                    ? uploadFile.name
                    : "Click to select or drag file"}
                </p>
                <p className={`text-xs ${tw.textMuted} mt-1`}>
                  .cdr or .tdr file
                </p>
              </div>
              <Input
                id="file-input"
                type="file"
                accept=".cdr,.tdr"
                onChange={(value) => {
                  const file = e.target.files?.[0];
                  setUploadError(null);

                  // Validate file extension
                  if (file) {
                    const extension = file.name.split(".").pop()?.toLowerCase();
                    if (!["cdr", "tdr"].includes(extension || "")) {
                      showError(
                        "Invalid File",
                        "Please select a .cdr or .tdr file",
                      );
                      e.target.value = "";
                      return;
                    }
                  }

                  setUploadFile(file || null);

                  // Parse file for preview
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const content = event.target?.result as string;
                        const lines = content
                          .split("\n")
                          .filter((line) => line.trim());

                        if (lines.length > 0) {
                          // Parse headers from first line
                          const delimiter = ",";
                          const headers = lines[0]
                            .split(delimiter)
                            .map((h) => h.trim());

                          // Parse up to 5 rows for preview
                          const rows = lines.slice(1, 6).map((line) => {
                            const values = line
                              .split(delimiter)
                              .map((v) => v.trim());
                            const row: Record<string, string> = {};
                            headers.forEach((header, idx) => {
                              row[header] = values[idx] || "";
                            });
                            return row;
                          });

                          setUploadPreview({ headers, rows });
                        }
                      } catch (err) {
                        console.error("Failed to parse file:", err);
                        setUploadPreview(null);
                      }
                    };
                    reader.readAsText(file);
                  } else {
                    setUploadPreview(null);
                  }
                }}
                className="hidden"
              />
            </div>

            {/* File Category */}
            <div>
              <label
                className={`text-sm font-medium ${tw.textPrimary} block mb-2`}
              >
                File Category
              </label>
              <HeadlessSelect
                options={[
                  { value: "CDR", label: "CDR" },
                  { value: "TDR", label: "TDR" },
                ]}
                value={uploadCategory}
                onChange={(val) =>
                  setUploadCategory((val as "CDR" | "TDR") || "CDR")
                }
                placeholder="Select category"
                className="w-full"
              />
            </div>

            {/* File Preview */}
            {uploadPreview && uploadPreview.rows.length > 0 && (
              <div>
                <label
                  className={`text-sm font-medium ${tw.textPrimary} block mb-2`}
                >
                  Preview ({uploadPreview.rows.length} row
                  {uploadPreview.rows.length !== 1 ? "s" : ""})
                </label>
                <div
                  className="overflow-x-auto border rounded"
                  style={{ borderColor: color.border.default }}
                >
                  <table
                    className="w-full text-xs"
                    style={{ borderCollapse: "collapse" }}
                  >
                    <thead
                      style={{ backgroundColor: color.surface.tableHeader }}
                    >
                      <tr>
                        {uploadPreview.headers.map((header) => (
                          <th
                            key={header}
                            className="px-3 py-2 text-left font-semibold uppercase tracking-wider"
                            style={{
                              color: color.surface.tableHeaderText,
                              borderRight: `1px solid ${color.border.default}`,
                            }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadPreview.rows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 transition-colors"
                          style={{
                            borderBottom: `1px solid ${color.border.default}`,
                          }}
                        >
                          {uploadPreview.headers.map((header) => (
                            <td
                              key={`${idx}-${header}`}
                              className="px-3 py-2 whitespace-nowrap"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                                color: color.text.primary,
                                borderRight: `1px solid ${color.border.default}`,
                              }}
                            >
                              {row[header] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <p className="text-sm text-red-600">{uploadError}</p>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                  setUploadPreview(null);
                  setUploadError(null);
                }}
                className="transition-colors disabled:opacity-60"
                style={getButtonStyles(button.bordered)}
              >
                Cancel
              </button>
              <button
                disabled={isUploading || !uploadFile}
                onClick={async () => {
                  if (!uploadFile) {
                    setUploadError("Please select a file");
                    return;
                  }

                  setIsUploading(true);
                  setUploadError(null);
                  try {
                    const response = await etlService.uploadFile(uploadFile);

                    if (response.success) {
                      success(
                        t.etl.fileUploaded || "Success",
                        `File ${uploadFile.name} uploaded successfully (${uploadCategory})`,
                      );
                      setIsUploadModalOpen(false);
                      setUploadFile(null);
                      setUploadPreview(null);
                      setUploadCategory("CDR");
                      setUploadError(null);

                      // Reload registry and stats to show the new file
                      await loadRegistry();
                      await loadStats();
                    } else {
                      // Display user-friendly error for duplicate file
                      if (
                        response.message &&
                        (response.message.includes("duplicate key") ||
                          response.message.includes("unique constraint"))
                      ) {
                        setUploadError(
                          `A file named "${uploadFile.name}" already exists in the ${uploadCategory} category.`,
                        );
                      } else {
                        const errorMessage =
                          response.error ||
                          response.message ||
                          "An error occurred during upload";
                        setUploadError(errorMessage);
                      }
                    }
                  } catch (err) {
                    const errorMsg =
                      (err as Error).message || "Failed to upload file";
                    // Show user-friendly message for duplicate file error
                    if (
                      errorMsg.includes("duplicate key") ||
                      errorMsg.includes("unique constraint")
                    ) {
                      setUploadError(
                        `A file named "${uploadFile.name}" already exists in the ${uploadCategory} category.`,
                      );
                    } else {
                      setUploadError(errorMsg);
                    }
                  } finally {
                    setIsUploading(false);
                  }
                }}
                className={`px-4 py-2 text-white ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: color.primary.action }}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
