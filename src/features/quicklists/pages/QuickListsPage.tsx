import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Search,
  FileText,
  Download,
  Trash2,
  Eye,
  Database,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import { color, tw, components } from "../../../shared/utils/utils";
import CreateButton from "../../../shared/components/ui/CreateButton";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { quicklistService } from "../services/quicklistService";
import {
  QuickList,
  QuickListStats,
  CreateQuickListRequest,
} from "../types/quicklist";
import CreateQuickListModal from "../components/CreateQuickListModal";
import EditQuickListModal from "../components/EditQuickListModal";

export default function QuickListsPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quicklistToDelete, setQuicklistToDelete] = useState<QuickList | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [quicklists, setQuicklists] = useState<QuickList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<QuickListStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQuickList, setEditQuickList] = useState<QuickList | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    loadInitialData();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Skip the first render to avoid double loading
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Reset to page 1 and reload when search changes
    loadQuickLists(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    // Load quicklists when page changes (skip initial mount)
    if (!isInitialMount.current && pagination.page > 0) {
      loadQuickLists(pagination.page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

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
      const initialLimit = 10;
      // Load quicklists
      const quicklistsRes = await quicklistService.getAllQuickLists({
        limit: initialLimit,
        offset: 0,
      });

      if (quicklistsRes.success) {
        setQuicklists(quicklistsRes.data || []);
        if (quicklistsRes.pagination) {
          setPagination({
            page: 1,
            limit: quicklistsRes.pagination.limit || initialLimit,
            total: quicklistsRes.pagination.total,
            hasMore: quicklistsRes.pagination.hasMore,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
      showError("Failed to load QuickLists");
    } finally {
      setLoading(false);
    }
  };

  const loadQuickLists = async (page: number = pagination.page) => {
    try {
      setLoading(true);
      const offset = (page - 1) * pagination.limit;
      let response;
      if (searchTerm) {
        response = await quicklistService.searchQuickLists({
          q: searchTerm,
          limit: pagination.limit,
          offset,
        });
      } else {
        response = await quicklistService.getAllQuickLists({
          limit: pagination.limit,
          offset,
        });
      }

      if (response.success) {
        setQuicklists(response.data || []);
        if (response.pagination) {
          setPagination({
            page,
            limit: response.pagination.limit,
            total: response.pagination.total,
            hasMore: response.pagination.hasMore,
          });
        }
      } else {
        throw new Error(
          "error" in response ? response.error : "Failed to load QuickLists",
        );
      }
    } catch (err) {
      console.error("Failed to load quicklists:", err);
      showError("Failed to load QuickLists");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuickList = async (request: CreateQuickListRequest) => {
    try {
      const response = await quicklistService.createQuickList(request);

      if (!response.success) {
        throw new Error(
          "error" in response ? response.error : "Failed to create QuickList",
        );
      }

      // Check for validation errors even if upload was successful
      if (response.data && (response.data.has_errors || response.data.rows_failed > 0)) {
        const errorCount =
          response.data.errors?.length || response.data.rows_failed;
        const errorDetails =
          response.data.errors
            ?.slice(0, 5)
            .map((e) => `Row ${e.row_number}: ${e.error}`)
            .join("\n") || "";

        showError(
          `QuickList created with ${errorCount} validation errors ${
            errorDetails ? `\n\n${errorDetails}` : ""
          }`,
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
          setCommunicateQuickList(quicklistResponse.data);
          setIsCommunicateModalOpen(true);
        }
      }

      // Reload stats and quicklists
      await loadStats();
      // Reload the quicklists list to show the new one
      // Small delay to allow backend to process the file
      setTimeout(async () => {
        await loadQuickLists(1); // Always reload from page 1 to see the new quicklist
      }, 2000);
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
    navigate(`/dashboard/quicklists/${quicklist.id}`);
  };

  const handleDelete = (quicklist: QuickList) => {
    setQuicklistToDelete(quicklist);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!quicklistToDelete) return;

    setIsDeleting(true);
    try {
      await quicklistService.deleteQuickList(quicklistToDelete.id);
      showToast(
        t.quickList.deletedSuccess.replace("{name}", quicklistToDelete.name),
      );
      setShowDeleteModal(false);
      setQuicklistToDelete(null);
      // Reload both stats and quicklists
      await loadStats();
      await loadQuickLists();
    } catch (err) {
      console.error("Failed to delete quicklist:", err);
      showError(t.quickList.deletedFailed, t.common.loading);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setQuicklistToDelete(null);
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
        await loadQuickLists(pagination.page);
        await loadStats();
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

  const totalPages = Math.ceil(pagination.total / pagination.limit);

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
          <CreateButton onClick={() => setIsCreateModalOpen(true)} />
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
        <div className="flex-1 relative">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${tw.textMuted}`}
          />
          <input
            type="text"
            placeholder="Search QuickLists by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 text-sm ${components.input.default}`}
          />
        </div>
      </div>

      {/* QuickLists Table */}
      <div
        className={` ${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner
              variant="modern"
              size="xl"
              color="primary"
              className="mb-4"
            />
            <p className={`${tw.textMuted} font-medium text-sm`}>
              Loading QuickLists...
            </p>
          </div>
        ) : quicklists.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm
                ? "No QuickLists match your search."
                : "No QuickLists yet. Create your first QuickList to get started."}
            </p>
            {!searchTerm && (
              <CreateButton
                onClick={() => setIsCreateModalOpen(true)}
                className="mx-auto"
              />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[900px]"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    {t.quickList.name}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    {t.quickList.rows}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    {t.quickList.status}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    {t.quickList.createdAt}
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    {t.quickList.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {quicklists.map((quicklist) => (
                  <tr key={quicklist.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => handleViewDetails(quicklist)}
                          className={`font-semibold text-sm sm:text-base ${tw.textPrimary} truncate`}
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
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {quicklist.rows_imported != null
                        ? quicklist.rows_imported.toLocaleString()
                        : "N/A"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {quicklist.processing_status
                        ? quicklist.processing_status.charAt(0).toUpperCase() + quicklist.processing_status.slice(1)
                        : "N/A"}
                    </td>
                    <td
                      className={`px-6 py-4 hidden md:table-cell text-sm ${tw.textMuted}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {new Date(quicklist.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </td>
                    <td
                      className="px-6 py-4 text-sm font-medium"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(quicklist)}
                          className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200 cursor-pointer`}
                          title={t.quickList.edit}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(quicklist)}
                          className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200 cursor-pointer`}
                          title={t.quickList.viewDetails}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExport(quicklist, "csv")}
                          className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200 cursor-pointer`}
                          title={t.quickList.export}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(quicklist)}
                          className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-all duration-200 cursor-pointer`}
                          title={t.quickList.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination - Outside table container */}
      {!loading && pagination.total > 0 && (
        <div
          className={`bg-white ${tw.rounded} shadow-sm border ${tw.borderDefault} px-4 sm:px-6 py-4 overflow-x-auto`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div
              className={`text-base ${tw.textSecondary} text-center sm:text-left`}
            >
              Showing{" "}
              {Math.min(
                (pagination.page - 1) * pagination.limit + 1,
                pagination.total,
              )}{" "}
              to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total.toLocaleString()} QuickLists
            </div>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page <= 1}
                className={`px-3 py-2 text-base border ${tw.borderDefault} ${tw.rounded} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
              >
                Previous
              </button>
              <span className={`text-base ${tw.textSecondary} px-2`}>
                Page {pagination.page} of {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
                disabled={pagination.page >= totalPages}
                className={`px-3 py-2 text-base border ${tw.borderDefault} ${tw.rounded} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={t.quickList.deleteQuickList}
        description="Are you sure you want to delete this QuickList? This action cannot be undone."
        itemName={quicklistToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText={t.quickList.deleteConfirmText}
        cancelText={t.common.cancel}
      />
    </div>
  );
}
