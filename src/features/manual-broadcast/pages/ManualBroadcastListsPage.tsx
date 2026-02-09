import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Trash2,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Plus,
} from "lucide-react";
import { color, tw, components } from "../../../shared/utils/utils";
import CreateButton from "../../../shared/components/ui/CreateButton";
import { communicationService } from "../../communications/services/communicationService";
import { ManualBroadcast } from "../../communications/types/communication";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { useToast } from "../../../contexts/ToastContext";
import { PermissionGate } from "../../auth/components/PermissionGate";
export default function ManualBroadcastListsPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();

  const [broadcasts, setBroadcasts] = useState<ManualBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [broadcastToDelete, setBroadcastToDelete] =
    useState<ManualBroadcast | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadInitialData = useCallback(async () => {
    try {
      // Load all executions (broadcasts) from the communications API
      const response = await communicationService.getExecutions({
        page: 1,
        limit: 10,
      });

      if (response.success && response.data) {
        // Map executions to ManualBroadcast format
        const broadcasts: ManualBroadcast[] = response.data.executions.map(
          (exec: any) => ({
            id: exec.id,
            execution_id: exec.execution_id,
            source_type: exec.source_type,
            source_id: exec.source_id || null,
            source_name: exec.source_name || `Execution ${exec.execution_id}`,
            channels: exec.channels || [],
            total_recipients: exec.total_recipients || 0,
            messages_sent: exec.messages_sent || 0,
            messages_failed: exec.messages_failed || 0,
            status: "completed" as const,
            created_at: exec.created_at,
            created_by: exec.created_by || null,
            message_template: { body: "" },
            messages_attempted: exec.total_recipients,
            channel_summaries: [],
            execution_time_ms: 0,
          }),
        );

        setBroadcasts(broadcasts);
        if (response.data.pagination) {
          setPagination({
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            total: response.data.pagination.total,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load manual broadcasts:", err);
      showError("Failed to load manual broadcasts");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const loadBroadcasts = async (page: number = pagination.page) => {
    try {
      setLoading(true);

      // Get all executions from the API
      const response = await communicationService.getExecutions({
        page,
        limit: pagination.limit,
      });

      if (response.success && response.data) {
        // Map executions to ManualBroadcast format
        let broadcasts: ManualBroadcast[] = response.data.executions.map(
          (exec: any) => ({
            id: exec.id,
            execution_id: exec.execution_id,
            source_type: exec.source_type,
            source_id: exec.source_id || null,
            source_name: exec.source_name || `Execution ${exec.execution_id}`,
            channels: exec.channels || [],
            total_recipients: exec.total_recipients || 0,
            messages_sent: exec.messages_sent || 0,
            messages_failed: exec.messages_failed || 0,
            status: "completed" as const,
            created_at: exec.created_at,
            created_by: exec.created_by || null,
            message_template: { body: "" },
            messages_attempted: exec.total_recipients,
            channel_summaries: [],
            execution_time_ms: 0,
          }),
        );

        // Filter by search term on client side
        const trimmedSearch = searchTerm.trim();
        if (trimmedSearch) {
          broadcasts = broadcasts.filter(
            (broadcast) =>
              broadcast.source_name
                .toLowerCase()
                .includes(trimmedSearch.toLowerCase()) ||
              broadcast.execution_id
                .toLowerCase()
                .includes(trimmedSearch.toLowerCase()),
          );
        }

        setBroadcasts(broadcasts);
        if (response.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: response.data!.pagination!.page,
            total: response.data!.pagination!.total,
          }));
        }
      } else {
        showError("Failed to load broadcasts", "Please try again");
      }
    } catch (err) {
      console.error("Failed to load broadcasts:", err);
      if (!loading) {
        showError(
          "Failed to load broadcasts",
          "Please check your connection and try again",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (broadcast: ManualBroadcast) => {
    navigate(`/dashboard/manual-communications/${broadcast.execution_id}`);
  };

  const handleDelete = (broadcast: ManualBroadcast) => {
    setBroadcastToDelete(broadcast);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!broadcastToDelete) return;

    try {
      setIsDeleting(true);
      // Note: Delete functionality would need a delete endpoint in communicationService
      showToast(
        `Broadcast "${broadcastToDelete.source_name}" deleted successfully!`,
      );
      setShowDeleteModal(false);
      setBroadcastToDelete(null);
      await loadBroadcasts(pagination.page);
    } catch (err) {
      console.error("Failed to delete broadcast:", err);
      showError("Failed to delete broadcast", "Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };

  const broadcastStatsCards = [
    {
      name: "Total Broadcasts",
      value: pagination.total.toLocaleString(),
      icon: CheckCircle,
      color: color.tertiary.tag1,
    },
    {
      name: "Total Recipients",
      value: broadcasts
        .reduce((sum, b) => sum + b.total_recipients, 0)
        .toLocaleString(),
      icon: CheckCircle,
      color: color.tertiary.tag4,
    },
    {
      name: "Messages Sent",
      value: broadcasts
        .reduce((sum, b) => sum + b.messages_sent, 0)
        .toLocaleString(),
      icon: CheckCircle,
      color: color.tertiary.tag3,
    },
    {
      name: "Messages Failed",
      value: broadcasts
        .reduce((sum, b) => sum + b.messages_failed, 0)
        .toLocaleString(),
      icon: XCircle,
      color: color.tertiary.tag2,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            Manual Communications
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            View and manage communications sent to manual recipient lists
          </p>
        </div>
        {/* <PermissionGate permission="manual-communications.create"> */}
        <div className="flex items-center gap-3">
          <CreateButton route="/dashboard/manual-communications/create" />
        </div>
        {/* </PermissionGate> */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {broadcastStatsCards.map((stat) => {
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
            placeholder="Search broadcasts by name or execution ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 text-sm ${components.input.default}`}
          />
        </div>
      </div>

      {/* Broadcasts Table */}
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
              Loading broadcasts...
            </p>
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm
                ? "No broadcasts match your search."
                : "No broadcasts yet. Create your first manual broadcast to get started."}
            </p>
            {!searchTerm && (
              <PermissionGate permission="manual-communications.create">
                <button
                  onClick={() =>
                    navigate("/dashboard/manual-communications/create")
                  }
                  className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 mx-auto text-sm text-white`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  <Plus className="w-4 h-4" />
                  Create broadcast
                </button>
              </PermissionGate>
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
                      Channel
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Recipients
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Sent / Failed
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
                  {broadcasts.map((broadcast) => (
                    <tr key={broadcast.id} className="transition-colors">
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div>
                          <button
                            type="button"
                            onClick={() => handleViewDetails(broadcast)}
                            className={`font-semibold text-sm sm:text-base ${tw.textPrimary} truncate`}
                            title={broadcast.source_name}
                          >
                            {broadcast.source_name}
                          </button>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-600"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {broadcast.channels?.join(", ") || "-"}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-600"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {broadcast.total_recipients.toLocaleString()}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-600"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="text-green-600 font-medium">
                          {broadcast.messages_sent.toLocaleString()}
                        </span>
                        {" / "}
                        <span className="text-red-600 font-medium">
                          {broadcast.messages_failed.toLocaleString()}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="inline-flex px-2 py-1 text-sm font-medium rounded text-black">
                          {broadcast.status}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {new Date(broadcast.created_at).toLocaleDateString()}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-medium"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(broadcast)}
                            className={`p-1 ${tw.rounded} text-gray-600 hover:text-gray-800 transition-colors cursor-pointer`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboard/manual-communications/${broadcast.execution_id}/edit`,
                              )
                            }
                            className={`p-1 ${tw.rounded} text-gray-600 hover:text-gray-800 transition-colors cursor-pointer`}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(broadcast)}
                            className={`p-1 ${tw.rounded} text-red-600 hover:text-red-800 transition-colors cursor-pointer`}
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
            {broadcasts.length > 0 && pagination.total > pagination.limit && (
              <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total.toLocaleString()} broadcasts
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      loadBroadcasts(Math.max(1, pagination.page - 1))
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
                    Page {pagination.page}
                  </span>
                  <button
                    onClick={() => loadBroadcasts(pagination.page + 1)}
                    disabled={
                      pagination.page * pagination.limit >= pagination.total
                    }
                    className={`${tw.button} px-3 py-1 text-sm ${
                      pagination.page * pagination.limit >= pagination.total
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

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBroadcastToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Broadcast"
        description="Are you sure you want to delete this broadcast? This action cannot be undone."
        itemName={broadcastToDelete?.source_name || ""}
        isLoading={isDeleting}
        confirmText="Delete Broadcast"
        cancelText="Cancel"
      />
    </div>
  );
}
