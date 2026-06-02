import { useEffect, useState } from "react";
import {
  Plus,
  FileText,
  Eye,
  Edit,
  Trash2,
  Download,
  Database,
  CheckCircle,
  XCircle,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { button, color, tw, components } from "../../../shared/utils/utils";
import CreateQuickListModal, {
  QuickListFormValues,
} from "../../quicklists/components/CreateQuickListModal";
import { quicklistService } from "../../quicklists/services/quicklistService";
import {
  QuickListWithDetails,
  CreateQuickListRequest,
  QuickListStats,
} from "../../quicklists/types/quicklist";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import CreateButton from "../../../shared/components/ui/CreateButton";
import { formatDateWithTimezone } from "../../../shared/services/dateService";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";

export default function QuickListPage() {
  const { t } = useLanguage();
  const [lists, setLists] = useState<QuickListWithDetails[]>([]);
  const [filteredLists, setFilteredLists] = useState<QuickListWithDetails[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingList, setEditingList] = useState<QuickListWithDetails | null>(
    null,
  );
  const [modalInitialData, setModalInitialData] = useState<
    Partial<QuickListFormValues> | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<QuickListStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  });

  useEffect(() => {
    loadInitialData();
    loadStats();
  }, []);

  useEffect(() => {
    filterLists();
  }, [searchQuery, lists]);

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
      setIsLoading(true);
      setError(null);
      const initialLimit = 10;
      const response = await quicklistService.getAllQuickLists({
        limit: initialLimit,
        offset: 0,
      });

      if (response.success && response.data) {
        setLists(response.data);
        if (response.pagination) {
          setPagination({
            page: 1,
            limit: response.pagination.limit || initialLimit,
            total: response.pagination.total,
            hasMore: response.pagination.hasMore,
          });
        }
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load QuickLists";
      setError(errorMsg);
      console.error("Error loading QuickLists:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuickLists = async (page: number = pagination.page) => {
    try {
      setIsLoading(true);
      const offset = (page - 1) * pagination.limit;
      let response;
      if (searchQuery) {
        response = await quicklistService.searchQuickLists({
          q: searchQuery,
          limit: pagination.limit,
          offset,
        });
      } else {
        response = await quicklistService.getAllQuickLists({
          limit: pagination.limit,
          offset,
        });
      }

      if (response.success && response.data) {
        setLists(response.data);
        if (response.pagination) {
          setPagination({
            page,
            limit: response.pagination.limit || pagination.limit,
            total: response.pagination.total,
            hasMore: response.pagination.hasMore,
          });
        }
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load QuickLists";
      setError(errorMsg);
      console.error("Error loading QuickLists:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterLists = () => {
    if (!searchQuery.trim()) {
      setFilteredLists(lists);
      return;
    }

    const filtered = lists.filter(
      (list) =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (list.description?.toLowerCase() || "").includes(
          searchQuery.toLowerCase(),
        ),
    );
    setFilteredLists(filtered);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingList(null);
    setModalInitialData(undefined);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingList(null);
    setModalInitialData(undefined);
  };

  const handleModalSubmit = async (formData: CreateQuickListRequest) => {
    try {
      setError(null);

      if (modalMode === "edit" && editingList) {
        // Update existing list
        await quicklistService.updateQuickList(editingList.id, {
          name: formData.name,
          description: formData.description,
        });
        closeModal();
        await loadQuickLists();
        return;
      }

      // Create new list
      await quicklistService.createQuickList(formData);
      closeModal();
      await loadQuickLists();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save QuickList";
      setError(errorMsg);
      console.error("Error saving QuickList:", err);
    }
  };

  const handleViewList = (list: QuickListWithDetails) => {
    // TODO: Implement view functionality
  };

  const handleEditList = (list: QuickListWithDetails) => {
    setModalMode("edit");
    setEditingList(list);
    setModalInitialData({
      list_id: list.id,
      name: list.name,
      description: list.description || "",
      subscriber_id_col_name: "",
      subscriber_id_field_mapping: "",
      file_delimiter: ",",
      list_headers: "",
      file_text: "",
      file_name: list.original_filename,
      file_size: list.file_size_bytes,
    });
    setIsModalOpen(true);
  };

  const handleDeleteList = async (listId: number) => {
    try {
      await quicklistService.deleteQuickList(listId);
      setLists((prev) => prev.filter((list) => list.id !== listId));
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete QuickList";
      setError(errorMsg);
      console.error("Error deleting QuickList:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateWithTimezone(dateString, getSettingsTimezoneOffset(), "YYYY-MM-DD");
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
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
      name: t.quickList?.rowsImported || "Rows Imported",
      value: statsLoading
        ? "..."
        : (stats?.overall.total_rows_imported || 0).toLocaleString(),
      icon: CheckCircle,
      color: color.tertiary.tag4,
    },
    {
      name: t.quickList?.rowsFailed || "Rows Failed",
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
      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>QuickLists</h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Manage your broadcast recipient lists
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateButton onClick={openCreateModal} />
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
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
          />
        </div>
      </div>

      {/* QuickLists Table */}
      <div
        className={` ${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
      >
        {isLoading ? (
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
        ) : filteredLists.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className={`${tw.textMuted} mb-6`}>
              {searchQuery
                ? "No QuickLists match your search."
                : "No QuickLists yet. Create your first QuickList to get started."}
            </p>
            {!searchQuery && (
              <CreateButton onClick={openCreateModal} className="mx-auto" />
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
                    Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Rows
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Created At
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLists.map((list) => (
                  <tr
                    key={list.id}
                    className="bg-white hover:shadow-sm transition-shadow"
                    style={{ backgroundColor: color.surface.tablebodybg }}
                  >
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div>
                        <span className={`font-medium ${tw.textPrimary}`}>
                          {list.name}
                        </span>
                        {list.description && (
                          <div
                            className={`text-xs sm:text-sm ${tw.textMuted} truncate mt-1`}
                            title={list.description}
                          >
                            {list.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {list.rows_imported != null
                        ? list.rows_imported.toLocaleString()
                        : "N/A"}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {(list.processing_status || "N/A").replace(/_/g, " ")}
                    </td>
                    <td
                      className={`px-6 py-4 hidden md:table-cell text-sm ${tw.textMuted}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {formatDate(list.created_at)}
                    </td>
                    <td
                      className="px-6 py-4 text-sm font-medium"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          disabled
                          className={`p-2 text-gray-400 cursor-not-allowed ${tw.rounded}`}
                          title="Edit (Coming soon)"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          disabled
                          className={`p-2 text-gray-400 cursor-not-allowed ${tw.rounded}`}
                          title="View Details (Coming soon)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          disabled
                          className={`p-2 text-gray-400 cursor-not-allowed ${tw.rounded}`}
                          title="Delete (Coming soon)"
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

      {/* Pagination */}
      {!isLoading && pagination.total > 0 && (
        <div
          className={`bg-white ${tw.rounded} shadow-sm border ${tw.borderDefault} px-4 sm:px-6 py-4 overflow-x-auto`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div
              className={`text-base ${tw.textSecondary} text-center sm:text-left`}
            >
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total.toLocaleString()} QuickLists
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-end">
              <button
                onClick={() => loadQuickLists(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1 || isLoading}
                className={`px-3 py-2 text-base border ${tw.borderDefault} ${tw.rounded} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const diff = Math.abs(page - pagination.page);
                  return (
                    diff === 0 ||
                    diff === 1 ||
                    page === 1 ||
                    page === totalPages
                  );
                })
                .map((page, idx, arr) => (
                  <div key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-2">...</span>
                    )}
                    <button
                      onClick={() => loadQuickLists(page)}
                      className={`px-3 py-2 text-base border ${tw.borderDefault} ${tw.rounded} hover:bg-gray-50 disabled:opacity-50 ${
                        page === pagination.page
                          ? `bg-gray-200 cursor-default`
                          : ""
                      }`}
                      disabled={page === pagination.page}
                    >
                      {page}
                    </button>
                  </div>
                ))}
              <button
                onClick={() =>
                  loadQuickLists(Math.min(totalPages, pagination.page + 1))
                }
                disabled={pagination.page === totalPages || isLoading}
                className={`px-3 py-2 text-base border ${tw.borderDefault} ${tw.rounded} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateQuickListModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialData={modalInitialData}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        submitLabel={
          modalMode === "create"
            ? "Create"
            : "Update"
        }
      />
    </div>
  );
}
