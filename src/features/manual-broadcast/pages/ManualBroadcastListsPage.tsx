import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  Trash2,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Plus,
} from "lucide-react";
import { color, tw, components } from "../../../shared/utils/utils";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import Pagination from "../../../shared/components/ui/Pagination";
import BackButton from "../../../shared/components/ui/BackButton";
import { communicationService } from "../../communications/services/communicationService";
import { ManualBroadcast } from "../../communications/types/communication";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import DateFormatter from "../../../shared/components/DateFormatter";
import { PermissionGate } from "../../auth/components/PermissionGate";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import ManualBroadcastDetailsExpandedRow from "../components/ManualBroadcastDetailsExpandedRow";

export default function ManualBroadcastListsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { success: showToast, error: showError } = useToast();

  // Check if we came from a returnTo state
  const returnTo = (
    location.state as {
      returnTo?: {
        pathname: string;
      };
    }
  )?.returnTo;

  const [broadcasts, setBroadcasts] = useState<ManualBroadcast[]>([]);
  const [allBroadcasts, setAllBroadcasts] = useState<ManualBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [broadcastToDelete, setBroadcastToDelete] =
    useState<ManualBroadcast | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(null);
  const [clearFiltersKey, setClearFiltersKey] = useState(0);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteBroadcast } = useDeleteConfirm({
    onDelete: async (id) => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      setAllBroadcasts((prev) => prev.filter((b) => b.id !== numId));
      setBroadcasts((prev) => prev.filter((b) => b.id !== numId));
      await communicationService.deleteExecution(numId);
    },
    itemLabel: "Broadcast",
  });

  const loadInitialData = useCallback(async () => {
    try {
      // Load executions (broadcasts) from the communications API
      const response = await communicationService.getExecutions({
        page: 1,
        limit: 15,
      });

      if (response.success && response.data) {
        // Map executions to ManualBroadcast format
        const executions = response.data.data || response.data.executions || (Array.isArray(response.data) ? response.data : []);
        const broadcasts: ManualBroadcast[] = (executions || []).filter(Boolean).map(
          (exec: any) => ({
            id: exec?.id,
            execution_id: exec?.last_execution_id,
            source_type: exec?.source_type,
            source_id: exec?.source_id ?? null,
            source_name: exec?.name ?? exec?.source_name ?? `Broadcast ${exec?.id ?? 'Unknown'}`,
            description: exec?.description ?? null,
            schedule_type: exec?.schedule_type ?? null,
            channels: Array.isArray(exec?.channels) ? exec.channels : [],
            total_recipients: typeof exec?.total_recipients === 'number' ? exec.total_recipients : 0,
            messages_sent: typeof exec?.messages_sent === 'number' ? exec.messages_sent : 0,
            messages_failed: typeof exec?.messages_failed === 'number' ? exec.messages_failed : 0,
            status: "completed" as const,
            created_at: exec?.created_at ?? new Date().toISOString(),
            created_by: exec?.created_by ?? null,
            message_template: exec?.message_template ?? { body: "" },
            messages_attempted: typeof exec?.total_recipients === 'number' ? exec.total_recipients : 0,
            channel_summaries: Array.isArray(exec?.channel_summaries) ? exec.channel_summaries : [],
            execution_time_ms: typeof exec?.execution_time_ms === 'number' ? exec.execution_time_ms : 0,
          }),
        );

        setAllBroadcasts(broadcasts);
        setBroadcasts(broadcasts);
        // Handle pagination - can be nested under .pagination or at root level
        const paginationData = response.data.pagination || response.data;
        if (paginationData && paginationData.page !== undefined) {
          setPagination({
            page: paginationData.page,
            limit: paginationData.limit,
            total: paginationData.total,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load manual broadcasts:", err);
      showError(extractBackendError(error, "Failed to load manual broadcasts. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Filter broadcasts when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const filtered = allBroadcasts.filter(
        (broadcast) =>
          (broadcast.source_name &&
            broadcast.source_name
              .toLowerCase()
              .includes(searchLower)) ||
          (broadcast.execution_id &&
            String(broadcast.execution_id)
              .toLowerCase()
              .includes(searchLower)),
      );
      setBroadcasts(filtered);
    } else {
      setBroadcasts(allBroadcasts);
    }
  }, [searchTerm, allBroadcasts]);

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
        const executions = response.data.data || response.data.executions || (Array.isArray(response.data) ? response.data : []);
        const broadcasts: ManualBroadcast[] = executions.map(
          (exec: any) => ({
            id: exec.id,
            execution_id: exec.last_execution_id,
            source_type: exec.source_type,
            source_id: exec.source_id || null,
            source_name: exec.name || `Broadcast ${exec.id}`,
            description: exec.description || null,
            schedule_type: exec.schedule_type || null,
            channels: exec.channels || [],
            total_recipients: exec.total_recipients || 0,
            messages_sent: exec.messages_sent || 0,
            messages_failed: exec.messages_failed || 0,
            status: "completed" as const,
            created_at: exec.created_at,
            created_by: exec.created_by || null,
            message_template: exec.message_template || { body: "" },
            messages_attempted: exec.total_recipients,
            channel_summaries: [],
            execution_time_ms: 0,
          }),
        );

        setAllBroadcasts(broadcasts);
        setBroadcasts(broadcasts);
        // Handle pagination - can be nested under .pagination or at root level
        const paginationData = response.data.pagination || response.data;
        if (paginationData && paginationData.page !== undefined) {
          setPagination({
            page: paginationData.page,
            limit: paginationData.limit,
            total: paginationData.total,
          });
        }
      } else {
        showError("Failed to load broadcasts", "Please try again");
      }
    } catch (err) {
      console.error("Failed to load broadcasts:", err);
      if (!loading) {
        showError("Failed to load broadcasts", extractBackendError(err, "Failed to load broadcasts. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (broadcast: ManualBroadcast) => {
    // Navigate to edit/creation flow with execution ID to preload data
    navigate(`/dashboard/manual-communications/${broadcast.execution_id}/edit`, {
      state: {
        returnTo: {
          pathname: "/dashboard/manual-communications",
        },
      },
    });
  };

  const handleDelete = (broadcast: ManualBroadcast) => {
    setBroadcastToDelete(broadcast);
    openDeleteConfirm(broadcast?.id || 0, broadcast?.source_name || "");
  };

  const handleConfirmDelete = async () => {
    if (!broadcastToDelete) return;

    try {
      await communicationService.deleteCommunication(broadcastToDelete.id);
      showToast(
        `Broadcast "${broadcastToDelete.source_name}" deleted successfully!`,
      );
      closeDeleteConfirm();
      setBroadcastToDelete(null);
      await loadBroadcasts(pagination.page);
    } catch (err) {
      console.error("Failed to delete broadcast:", err);
      showError("Failed to delete broadcast", extractBackendError(err, "Failed to delete broadcast. Please try again."));
    }
  };

  const handleFilteredCountChange = (count: number) => {
    // Updates when filters applied in the Table component
  };

  const uniqueChannels = new Set(broadcasts.flatMap(b => b.channels)).size;
  const executedBroadcasts = broadcasts.filter(b => b.execution_id).length;

  const broadcastStatsCards = [
    {
      name: "Total Broadcasts",
      value: pagination.total.toLocaleString(),
      icon: CheckCircle,
      color: color.tertiary.tag1,
    },
    {
      name: "Executed Broadcasts",
      value: executedBroadcasts.toLocaleString(),
      icon: CheckCircle,
      color: color.tertiary.tag4,
    },
    {
      name: "Unique Channels",
      value: uniqueChannels.toLocaleString(),
      icon: CheckCircle,
      color: color.tertiary.tag3,
    },
    {
      name: "Pending Broadcasts",
      value: (broadcasts.length - executedBroadcasts).toLocaleString(),
      icon: XCircle,
      color: color.tertiary.tag2,
    },
  ];

  // Define table columns
  const broadcastColumns: TableColumn<ManualBroadcast>[] = [
    {
      id: "source_name",
      label: "Name",
      visible: true,
      filterConfig: { type: 'text' },
      render: (value, broadcast) => (
        <button
          onClick={() => handleViewDetails(broadcast)}
          className={`${tw.tableFirstColumn} ${tw.textPrimary} truncate`}
          title={broadcast.source_name}
        >
          {broadcast.source_name}
        </button>
      ),
    },
    {
      id: "description",
      label: "Description",
      visible: true,
      filterConfig: { type: 'text' },
    },
    {
      id: "channels",
      label: "Channels",
      visible: true,
      filterConfig: { type: 'multiselect', options: ['SMS', 'EMAIL', 'PUSH', 'USSD'] },
    },
    {
      id: "source_type",
      label: "Source Type",
      visible: true,
      filterConfig: { type: 'text' },
    },
    {
      id: "schedule_type",
      label: "Schedule Type",
      visible: true,
      filterConfig: { type: 'text' },
    },
    {
      id: "created_at",
      label: "Created",
      visible: true,
      filterConfig: { type: 'date' },
      render: (value) => (
        <span className={`text-sm ${tw.textMuted}`}>
          <DateFormatter date={value as string} useUserTimezone />
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (value, broadcast) => (
        <div className="flex items-center justify-center space-x-2">
          {broadcast.execution_id && (
            <button
              onClick={() => navigate(`/dashboard/manual-communications/${broadcast.execution_id}`)}
              className={`p-1 ${tw.rounded} transition-colors cursor-pointer`}
              style={{ color: 'var(--c-icon-table-view)' }}
              title="View"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {broadcast.execution_id && (
            <button
              onClick={() => handleViewDetails(broadcast)}
              className={`p-1 ${tw.rounded} transition-colors cursor-pointer`}
              style={{ color: 'var(--c-icon-table-edit)' }}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(broadcast)}
            className={`p-1 ${tw.rounded} text-red-600 hover:text-red-800 transition-colors cursor-pointer`}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const {
    columns,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useTable({
    tableId: "manual-broadcasts-table",
    defaultColumns: broadcastColumns,
    persistToLocalStorage: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton
         
          showBreadcrumb={true}
          currentLabel="Manual Communications"
        />
        {/* <PermissionGate permission="manual-communications.create"> */}
        <div className="flex items-center gap-3">
          <FeatureActionButton
            featureId="manual-communications"
            action="create"
            navigationState={{
              returnTo: {
                pathname: "/dashboard/manual-communications",
              },
            }}
          />
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
                <p className="text-sm font-medium text-black">{stat.name}</p>
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
        <div className="flex-1">
          <SearchInput
            placeholder="Search broadcasts by name or execution ID..."
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
          />
        </div>
      </div>

      {/* Broadcasts Table */}
      <div
        className={`${tw.rounded} overflow-hidden`}
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
                    navigate("/dashboard/manual-communications/create", {
                      state: {
                        returnTo: {
                          pathname: "/dashboard/manual-communications",
                        },
                      },
                    })
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
            <Table<ManualBroadcast>
              columns={columns}
              data={broadcasts}
              totalItems={broadcasts.length}
              currentPage={pagination.page}
              pageSize={pagination.limit}
              isLoading={loading}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              expandedRowId={expandedRowId}
              onExpandChange={setExpandedRowId}
              onFilteredCountChange={handleFilteredCountChange}
              clearFiltersKey={clearFiltersKey}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              expandedContent={(broadcast) => (
                <ManualBroadcastDetailsExpandedRow broadcast={broadcast} colSpan={columns.filter((c) => c.visible).length} />
              )}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {/* Pagination */}
            {broadcasts.length > 0 && pagination.total > 0 && (
              <Pagination
                currentPage={pagination.page}
                pageSize={pagination.limit}
                totalItems={pagination.total}
                onPageChange={(page) => loadBroadcasts(page)}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => {
          closeDeleteConfirm();
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

      {/* Column Picker Modal */}
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
