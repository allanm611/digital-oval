import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  BarChart3,
  Play,
  RefreshCw,
  Search,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { etlService } from "../services/etlService";
import { EtlFileRegistryRowType, FileStatsResponse } from "../types/etl";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import FetchControlsModal from "../components/FetchControlsModal";

const PAGE_SIZE = 15;

type StatusFilter = "all" | "pending" | "processing" | "completed" | "failed";
type CategoryFilter = "all" | "CDR" | "TDR" | string;
type FetchMode = "immediate" | "by-time" | "by-range";

export default function EtlFileRegistryPage() {
  const { error: showError, success } = useToast();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Fetch controls modal
  const [fetchModalMode, setFetchModalMode] = useState<FetchMode | null>(null);
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);
  const [showFetchDropdown, setShowFetchDropdown] = useState(false);

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

  const handleReprocess = async (file: EtlFileRegistryRowType) => {
    const confirmed = await confirm({
      title: t.etl.reprocessFile,
      message: `${t.etl.reprocessFileConfirmation.replace("{fileName}", file.file_name)}`,
      type: "info",
      confirmText: t.etl.reprocess,
      cancelText: t.common.cancel,
    });

    if (!confirmed) return;

    try {
      const response = await etlService.reprocessFile({
        id: file.id,
        user_id: user?.user_id,
      });

      if (response.success) {
        success(
          t.etl.fileReprocessed,
          `${file.file_name} ${t.etl.fileReprocessed}.`,
        );
        await loadRegistry();
      }
    } catch (err) {
      showError(
        t.etl.failedToReprocessFile,
        (err as Error).message || t.etl.pleaseRetry,
      );
    }
  };

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
    const statusMap: Record<
      string,
      { bg: string; text: string; icon: React.ReactNode }
    > = {
      pending: {
        bg: "rgba(251,191,36,0.12)",
        text: "#000",
        icon: <Clock size={14} />,
      },
      processing: {
        bg: "rgba(59,129,105,0.12)",
        text: "#000",
        icon: <Loader2 size={14} className="animate-spin" />,
      },
      completed: {
        bg: "rgba(16,185,129,0.12)",
        text: "#000",
        icon: <CheckCircle size={14} />,
      },
      failed: {
        bg: "rgba(251,113,133,0.12)",
        text: "#000",
        icon: <AlertTriangle size={14} />,
      },
    };

    const config = statusMap[status] || statusMap.pending;
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.text }}
      >
        {config.icon}
        {status}
      </span>
    );
  };

  const isEmptyState = !isLoadingFiles && files.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            {t.etl.fileRegistry}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {t.etl.fileRegistryDescription}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFetchDropdown(!showFetchDropdown)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Play className="h-4 w-4" />
              {t.etl.fetchControlsButton}
              <ChevronDown className="h-4 w-4" />
            </button>

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

          <button
            type="button"
            onClick={() => navigate("/dashboard/etl/analytics")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white ${tw.rounded}`}
            style={{ backgroundColor: color.primary.action }}
          >
            <BarChart3 className="h-4 w-4" />
            {t.etl.analytics}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: t.etl.totalFiles, value: stats.data.total_files ?? 0 },
            { label: t.etl.completed, value: stats.data.completed_files ?? 0 },
            { label: t.etl.pending, value: stats.data.pending_files ?? 0 },
            { label: t.etl.failed, value: stats.data.failed_files ?? 0 },
            { label: t.etl.processingFilesStatus, value: stats.data.processing_files ?? 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${tw.rounded} border p-4`}
              style={{
                borderColor: color.border.default,
                backgroundColor: color.surface.cards,
              }}
            >
              <p className={`${tw.textSecondary} text-sm mb-2`}>{stat.label}</p>
              <p className={`${tw.mainHeading} text-2xl font-bold`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="text"
            placeholder={t.etl.searchByFileName}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${tw.rounded} border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-gray-300 focus:outline-none`}
          />
        </div>
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

      {/* Table */}
      <div className={`${tw.rounded} border border-gray-200`}>
        {isLoadingFiles ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner variant="modern" size="lg" color="primary" />
            <p className="mt-4 text-sm text-gray-500">
              {t.etl.loadingFileRegistry}
            </p>
          </div>
        ) : isEmptyState ? (
          <div className="py-16 text-center bg-white">
            <Download size={24} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t.etl.noFilesFound}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {t.etl.adjustFiltersOrRefresh}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[1000px] text-sm"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr className="text-left text-xs uppercase tracking-wide text-black">
                  <th className="px-6 py-4 font-medium">{t.etl.fileNameHeader}</th>
                  <th className="px-6 py-4 font-medium">{t.etl.categoryHeader}</th>
                  <th className="px-6 py-4 font-medium">{t.etl.statusHeader}</th>
                  <th className="px-6 py-4 font-medium">{t.etl.rowsProcessedHeader}</th>
                  <th className="px-6 py-4 font-medium">{t.etl.sizeHeader}</th>
                  <th className="px-6 py-4 font-medium">{t.etl.updatedHeader}</th>
                  <th className="px-6 py-4 text-right font-medium">{t.etl.actionsHeader}</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="transition-colors text-sm">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <button
                        type="button"
                        className="font-semibold text-black hover:underline"
                      >
                        {file.file_name}
                      </button>
                    </td>
                    <td
                      className="px-6 py-4 text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm font-medium">
                        {file.file_category || "—"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {getStatusBadge(file.processing_status || "pending")}
                    </td>
                    <td
                      className="px-6 py-4 text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="text-sm">
                        {file.rows_inserted ?? 0} / {file.rows_parsed ?? 0}
                      </div>
                      {file.rows_failed ? (
                        <p className="text-xs text-red-600">
                          {file.rows_failed} failed
                        </p>
                      ) : null}
                    </td>
                    <td
                      className="px-6 py-4 text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {file.data_size_mb
                        ? `${Number(file.data_size_mb).toFixed(2)} MB`
                        : "—"}
                    </td>
                    <td
                      className="px-6 py-4 text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="text-sm">
                        {file.updated_at
                          ? new Date(file.updated_at).toLocaleDateString()
                          : "—"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          title={t.etl.viewDetails}
                          className={`inline-flex items-center justify-center ${tw.rounded} p-2 text-black transition-colors hover:bg-gray-100`}
                        >
                          <Eye size={16} />
                        </button>
                        {file.processing_status === "failed" && (
                          <button
                            type="button"
                            onClick={() => handleReprocess(file)}
                            title={t.etl.reprocessFileAction}
                            className={`inline-flex items-center justify-center ${tw.rounded} p-2 text-black transition-colors hover:bg-gray-100`}
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoadingFiles && files.length > 0 && (
        <div
          className={`flex flex-col items-center justify-between gap-3 ${tw.rounded} border border-gray-200 bg-white px-6 py-4 text-sm text-gray-600 md:flex-row`}
        >
          <p>
            {`Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} files`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className={`${tw.rounded} border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {t.etl.prev}
            </button>
            <span className="text-gray-500">
              {`Page ${page} of ${totalPages}`}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className={`${tw.rounded} border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {t.etl.nextButton}
            </button>
          </div>
        </div>
      )}

      {/* Fetch Controls Modal */}
      <FetchControlsModal
        mode={fetchModalMode}
        isOpen={isFetchModalOpen}
        onClose={handleFetchModalClose}
        onSuccess={(executionId, timeFilter) => {
          // Set category filter to match what was fetched
          if (timeFilter?.category) {
            setCategoryFilter(timeFilter.category as CategoryFilter);
          }
          setPage(1);
          loadRegistry();
          loadStats();
        }}
      />
    </div>
  );
}
