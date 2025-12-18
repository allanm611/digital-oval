import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Download,
  Trash2,
  Eye,
  Plus,
  Database,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import { color, tw, components } from "../../../shared/utils/utils";
import { QuickList, UploadType, QuickListStats } from "../types/quicklist";
import { quicklistService } from "../services/quicklistService";
import CreateQuickListModal from "../components/CreateQuickListModal";
import EditQuickListModal from "../components/EditQuickListModal";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useToast } from "../../../contexts/ToastContext";

export default function ManualBroadcastListsPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();

  const [quicklists, setQuicklists] = useState<QuickList[]>([]);
  const [uploadTypes, setUploadTypes] = useState<UploadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QuickListStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUploadType, setSelectedUploadType] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQuickList, setEditQuickList] = useState<QuickList | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quicklistToDelete, setQuicklistToDelete] = useState<QuickList | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const isInitialMount = useRef(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadQuickLists(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedUploadType]);

  useEffect(() => {
    // Load quicklists when page changes (skip initial mount)
    if (!isInitialMount.current && pagination.page > 0) {
      loadQuickLists(pagination.page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  const loadInitialData = async () => {
    try {
      setStatsLoading(true);

      // Load upload types and quicklists
      const [uploadTypesRes, quicklistsRes, statsRes] = await Promise.all([
        quicklistService.getUploadTypes(),
        quicklistService.getAllQuickLists({
          limit: 10,
          offset: 0,
        }),
        quicklistService.getStats(),
      ]);

      if (uploadTypesRes.success) {
        setUploadTypes(uploadTypesRes.data || []);
      }

      if (quicklistsRes.success) {
        setQuicklists(quicklistsRes.data || []);
        if (quicklistsRes.pagination) {
          setPagination({
            page: 1,
            limit: quicklistsRes.pagination.limit || 10,
            total: quicklistsRes.pagination.total,
            hasMore: quicklistsRes.pagination.hasMore,
          });
        }
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
      showError("Failed to load QuickLists");
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const loadQuickLists = async (page: number = pagination.page) => {
    try {
      setLoading(true);

      let response;
      if (searchTerm) {
        response = await quicklistService.searchQuickLists({
          q: searchTerm,
          upload_type: selectedUploadType || undefined,
          limit: pagination.limit,
          offset: (page - 1) * pagination.limit,
        });
      } else {
        response = await quicklistService.getAllQuickLists({
          upload_type: selectedUploadType || undefined,
          limit: pagination.limit,
          offset: (page - 1) * pagination.limit,
        });
      }

      if (response.success) {
        setQuicklists(response.data || []);
        if (response.pagination) {
          setPagination((prev) => ({
            ...prev,
            page,
            total: response.pagination!.total,
            hasMore: response.pagination!.hasMore,
          }));
        }
      } else {
        showError("Failed to load QuickLists");
      }
    } catch (err) {
      console.error("Failed to load quicklists:", err);
      showError("Failed to load QuickLists");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await quicklistService.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreateQuickList = async (request: {
    file: File;
    upload_type: string;
    name: string;
    description?: string | null;
    created_by?: string | null;
  }) => {
    try {
      const response = await quicklistService.createQuickList(request);

      if (!response.success) {
        throw new Error(
          "error" in response ? response.error : "Failed to create QuickList"
        );
      }

      // Check for validation errors even if upload was successful
      if (response.data.has_errors || response.data.rows_failed > 0) {
        const errorCount =
          response.data.errors?.length || response.data.rows_failed;
        const errorDetails =
          response.data.errors?.length > 0
            ? `\n\nFirst few errors:\n${response.data.errors
                .slice(0, 3)
                .map((e: any) => `- Row ${e.row_number}: ${e.error}`)
                .join("\n")}`
            : "";
        showToast(
          `QuickList created but ${errorCount} row(s) failed validation. ${
            errorDetails ? `\n\nFirst few errors:\n${errorDetails}` : ""
          }`
        );
      } else {
        showToast("QuickList created successfully!");
      }

      // Reload stats and quicklists
      await loadStats();
      // Reload the quicklists list to show the new one
      // Small delay to allow backend to process the file
      setTimeout(async () => {
        await loadQuickLists(pagination.page);
      }, 1500);
    } catch (err) {
      console.error("Failed to create QuickList:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create QuickList";
      // Filter out HTTP errors
      const userMessage =
        errorMessage.includes("HTTP error") || errorMessage.includes("status:")
          ? "Failed to create QuickList"
          : errorMessage;
      showError("Failed to create QuickList", userMessage);
      throw err; // Re-throw so the modal can handle it
    }
  };

  const handleViewDetails = (quicklist: QuickList) => {
    navigate(`/dashboard/manual-broadcast/${quicklist.id}`);
  };

  const handleDelete = (quicklist: QuickList) => {
    setQuicklistToDelete(quicklist);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!quicklistToDelete) return;

    try {
      setIsDeleting(true);
      const response = await quicklistService.deleteQuickList(
        quicklistToDelete.id
      );

      if (response.success) {
        showToast(`Broadcast list "${quicklistToDelete.name}" deleted successfully!`);
        setShowDeleteModal(false);
        setQuicklistToDelete(null);
        await loadQuickLists();
        await loadStats();
      } else {
        showError("Failed to delete QuickList", "Please try again later.");
      }
    } catch (err) {
      console.error("Failed to delete quicklist:", err);
      showError("Failed to delete QuickList", "Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async (quicklist: QuickList, format: "csv" | "json") => {
    try {
      const blob = await quicklistService.exportQuickList(
        quicklist.id,
        format
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      link.href = url;
      link.download = `${quicklist.name}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast(`QuickList exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error("Failed to export QuickList:", err);
      showError("Failed to export QuickList");
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
        request
      );

      if (response.success) {
        showToast("QuickList updated successfully");
        setIsEditModalOpen(false);
        setEditQuickList(null);
        await loadQuickLists(pagination.page);
        await loadStats();
      }
    } catch (err) {
      console.error("Failed to update QuickList:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update QuickList";
      // Filter out HTTP errors
      const userMessage =
        errorMessage.includes("HTTP error") || errorMessage.includes("status:")
          ? "Please try again later."
          : errorMessage;
      showError("Error updating QuickList", userMessage);
      throw err;
    }
  };

  const quicklistStatsCards = [
    {
      name: "Total Broadcast Lists",
      value: statsLoading
        ? "..."
        : (stats?.overall.total_quicklists || 0).toLocaleString(),
      icon: Database,
      color: color.tertiary.tag1,
    },
    {
      name: "Rows Imported",
      value: statsLoading
        ? "..."
        : (stats?.overall.total_rows_imported || 0).toLocaleString(),
      icon: CheckCircle,
      color: color.tertiary.tag4,
    },
    {
      name: "Rows Failed",
      value: statsLoading
        ? "..."
        : (stats?.overall.total_rows_failed || 0).toLocaleString(),
      icon: XCircle,
      color: color.tertiary.tag2,
    },
    {
      name: "Unique Upload Types",
      value: statsLoading
        ? "..."
        : (stats?.overall.unique_upload_types || 0).toLocaleString(),
      icon: FileText,
      color: color.tertiary.tag3,
    },
  ];

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>Manual Broadcast Lists</h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Manage recipient lists created for manual broadcasts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/communications/analytics")}
            className={`${tw.button} flex items-center gap-2`}
          >
            <Database className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className={`${tw.button} flex items-center gap-2`}
          >
            <Plus className="w-4 h-4" />
            Create Broadcast List
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${tw.textMuted}`}
          />
          <input
            type="text"
            placeholder="Search broadcast lists by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 text-sm ${components.input.default}`}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <HeadlessSelect
            options={[
              { value: "", label: "All Upload Types" },
              ...uploadTypes.map((type) => ({
                value: type.upload_type,
                label: type.upload_type,
              })),
            ]}
            value={selectedUploadType}
            onChange={(value) => setSelectedUploadType(value as string)}
            placeholder="Select upload type"
            className="w-full sm:min-w-[220px]"
          />
        </div>
      </div>

      {/* Broadcast Lists Table */}
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
              Loading broadcast lists...
            </p>
          </div>
        ) : quicklists.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm
                ? "No broadcast lists match your search."
                : "No broadcast lists yet. Create your first broadcast list to get started."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 mx-auto text-sm text-white`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="w-4 h-4" />
                Create Broadcast List
              </button>
            )}
          </div>
        ) : (
          <>
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
                      Upload Type
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
                      className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Actions
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
                        className="px-6 py-4 text-sm text-gray-600"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {quicklist.upload_type}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-600"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {quicklist.rows_imported.toLocaleString()}
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span
                          className="inline-flex px-2 py-1 text-sm text-black"
                        >
                          {quicklist.processing_status}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {new Date(quicklist.created_at).toLocaleDateString()}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-medium"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(quicklist)}
                            className={`p-1 ${tw.rounded} text-gray-600 hover:text-gray-800 transition-colors`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(quicklist)}
                            className={`p-1 ${tw.rounded} text-gray-600 hover:text-gray-800 transition-colors`}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleExport(quicklist, "csv")}
                            className={`p-1 ${tw.rounded} text-gray-600 hover:text-gray-800 transition-colors`}
                            title="Export CSV"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(quicklist)}
                            className={`p-1 ${tw.rounded} text-red-600 hover:text-red-800 transition-colors`}
                            title="Delete"
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

            {/* Pagination */}
            {quicklists.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total.toLocaleString()} broadcast lists
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className={`${tw.button} px-3 py-1 text-sm ${
                      pagination.page === 1
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(totalPages, prev.page + 1),
                      }))
                    }
                    disabled={pagination.page === totalPages}
                    className={`${tw.button} px-3 py-1 text-sm ${
                      pagination.page === totalPages
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateQuickListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateQuickList}
        uploadTypes={uploadTypes}
      />

      {editQuickList && (
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

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setQuicklistToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Broadcast List"
        description="Are you sure you want to delete this broadcast list? This action cannot be undone."
        itemName={quicklistToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete Broadcast List"
        cancelText="Cancel"
      />
    </div>
  );
}
