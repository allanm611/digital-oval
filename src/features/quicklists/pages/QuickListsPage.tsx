import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
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
  Send,
  MoreHorizontal,
} from "lucide-react";
import { color, tw, components, zIndex } from "../../../shared/utils/utils";
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
import { PermissionGate } from "../../auth/components/PermissionGate";
import Pagination from "../../../shared/components/ui/Pagination";
import CreateCommunicationModal from "../../../shared/components/CreateCommunicationModal";

export default function QuickListsPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quicklistToDelete, setQuicklistToDelete] = useState<QuickList | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [allQuicklists, setAllQuicklists] = useState<QuickList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
  const actionMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dropdownMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

    // Reset to page 1 when search changes (frontend filtering)
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      showError("Failed to load QuickLists");
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
      await loadInitialData();
      setCurrentPage(1);
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
            <CreateButton onClick={() => setIsCreateModalOpen(true)} />
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
        ) : filteredAndPaginatedQuicklists.paginated.length === 0 ? (
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
                    {t.quickList.rowsImported}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    {t.quickList.rowsFailed}
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
                {filteredAndPaginatedQuicklists.paginated.map((quicklist) => (
                  <tr key={quicklist.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
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
                      className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {quicklist.rows_failed != null
                        ? quicklist.rows_failed.toLocaleString()
                        : "N/A"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {(quicklist.processing_status || "N/A").replace(
                        /_/g,
                        " ",
                      )}
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
                        <PermissionGate permission="quicklists.update">
                          <button
                            onClick={() => handleEdit(quicklist)}
                            className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200 cursor-pointer`}
                            title={t.quickList.edit}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                        <button
                          onClick={() => handleViewDetails(quicklist)}
                          className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200 cursor-pointer`}
                          title={t.quickList.viewDetails}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <div
                          ref={(el) => {
                            actionMenuRefs.current[quicklist.id] = el;
                          }}
                        >
                          <button
                            onClick={(e) =>
                              handleActionMenuToggle(quicklist.id, e)
                            }
                            className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.accent}]/10 transition-all duration-300`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Render dropdown menus via portal outside the table */}
      {filteredAndPaginatedQuicklists.paginated.map((quicklist) => {
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

      {/* Pagination */}
      {!loading && filteredAndPaginatedQuicklists.total > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          totalItems={filteredAndPaginatedQuicklists.total}
          onPageChange={setCurrentPage}
        />
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
            setIsCommunicateModalOpen(false);
            setQuicklistToCommunicate(null);
          }}
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
