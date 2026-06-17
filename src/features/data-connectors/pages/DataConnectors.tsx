import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import {
  Plug,
  CheckCircle,
  Database,
  Layers,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import {
  DataConnectorType,
  ProcessedDataConnector,
  DataConnectorStatistics,
} from "../types/dataConnector";
import { dataConnectorService } from "../services/dataConnectorService";
import {
  getConnectorDisplayName,
  getConnectorIcon,
} from "../utils/connectorIcons";
import { tw, color, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import DataConnectorForm from "../components/DataConnectorForm";
import {
  CreateDataConnectorRequest,
  UpdateDataConnectorRequest,
  DataConnectorFormData,
  DataConnectorFilterParams,
} from "../types/dataConnector";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { PermissionGate } from "../../auth/components/PermissionGate";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import DateFormatter from "../../../shared/components/DateFormatter";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

export default function DataConnectors() {
  const navigate = useNavigate();
  const { error: showError, success } = useToast();
  const [connectors, setConnectors] = useState<ProcessedDataConnector[]>([]);
  const [statistics, setStatistics] = useState<DataConnectorStatistics | null>(
    null,
  );
  const [connectorTypes, setConnectorTypes] = useState<DataConnectorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConnector, setEditingConnector] =
    useState<ProcessedDataConnector | null>(null);
  const [connectorToDelete, setConnectorToDelete] =
    useState<ProcessedDataConnector | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterType, setFilterType] = useState<DataConnectorType | "all">(
    "all",
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(getInitialPageSize());
  const [totalCount, setTotalCount] = useState(0);

  const defaultColumns: TableColumn<ProcessedDataConnector>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
      render: (value) => <div className={`${tw.tableFirstColumn} text-sm`}>{value}</div>,
    },
    {
      id: "type",
      label: "Type",
      visible: true,
      render: (value) => <span className={`p-2 icon-edit ${tw.rounded} text-sm `}>{getConnectorDisplayName(value)}</span>,
    },
    {
      id: "description",
      label: "Description",
      visible: true,
      render: (value) => <span className="text-sm text-gray-600">{value || "—"}</span>,
    },
    {
      id: "is_active",
      label: "Status",
      visible: true,
      render: (value) => <span className="text-sm text-gray-600">{value ? "Active" : "Inactive"}</span>,
    },
    {
      id: "created_at",
      label: "Created",
      visible: true,
      render: (value) => <span className="text-sm text-gray-600"><DateFormatter date={value as string} useUserTimezone /></span>,
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (_, connector) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => handleConnectorClick(connector)} className={`p-2 icon-delete ${tw.rounded} text-gray-600 hover:text-gray-900 hover:bg-gray-100`} title="View">
            <Eye className="w-4 h-4" />
          </button>
          <PermissionGate permission="data-connectors.update">
            <button onClick={() => handleEdit(connector)} className={`p-2 icon-delete ${tw.rounded} text-gray-600 hover:text-gray-900 hover:bg-gray-100`} title="Edit">
              <Edit className="w-4 h-4" />
            </button>
          </PermissionGate>
          <PermissionGate permission="data-connectors.delete">
            <button onClick={() => handleDelete(connector)} className={`p-2 icon-delete ${tw.rounded} text-red-600 hover:text-red-700 hover:bg-red-50`} title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </PermissionGate>
        </div>
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
    tableId: "data-connectors-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const loadConnectors = async () => {
    try {
      setLoading(true);

      const params: DataConnectorFilterParams = {
        search: searchTerm.trim() || undefined,
        limit: tablePageSize,
        offset: (tableCurrentPage - 1) * tablePageSize,
      };

      // Type filter – single value
      if (filterType !== "all") {
        params.type = filterType;
      }

      // Status filter
      if (filterStatus === "active") {
        params.is_active = true;
      } else if (filterStatus === "inactive") {
        params.is_active = false;
      }

      const response = await dataConnectorService.fetchDataConnectors(params);
      setConnectors(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error("Failed to load data connectors:", error);
      showError("Error", "Failed to load connectors");
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [stats, types] = await Promise.all([
        dataConnectorService.getDataConnectorStatistics(),
        dataConnectorService.getAvailableConnectorTypes(),
      ]);
      setStatistics(stats);
      setConnectorTypes(types);
    } catch (error) {
      console.error("Failed to load data connector reference data:", error);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, filterType, filterStatus, tableHandlePageChange]);

  // Load connectors when tableCurrentPage, search, filters, or tablePageSize changes
  useEffect(() => {
    loadConnectors();
  }, [searchTerm, filterType, filterStatus, tableCurrentPage, tablePageSize]);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const handleConnectorClick = (connector: ProcessedDataConnector) => {
    navigate(`/dashboard/data-connectors/${connector.id}`);
  };

  const handleEdit = (connector: ProcessedDataConnector) => {
    setEditingConnector(connector);
    setShowCreateModal(true);
  };

  const handleDelete = (connector: ProcessedDataConnector) => {
    setConnectorToDelete(connector);
  };

  const handleConfirmDelete = async () => {
    if (!connectorToDelete) return;

    try {
      setIsDeleting(true);
      const connectorId = connectorToDelete.id;
      await dataConnectorService.deleteDataConnector(connectorId);
      // Optimistic update: remove from list
      setConnectors((prev) => prev.filter((c) => c.id !== connectorId));
      // Update statistics
      if (statistics) {
        setStatistics({
          ...statistics,
          total_connectors: Math.max(0, statistics.total_connectors - 1),
          active_connectors: connectorToDelete.is_active
            ? Math.max(0, statistics.active_connectors - 1)
            : statistics.active_connectors,
          total_connection_count: Math.max(
            0,
            statistics.total_connection_count -
              (connectorToDelete.connection_count || 0),
          ),
        });
      }
      success("Deleted", `${connectorToDelete.name} was deleted successfully.`);
      setConnectorToDelete(null);
    } catch (err: any) {
      showError("Delete failed", extractBackendError(error, "Delete failed. Please try again."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveConnector = async (formData: DataConnectorFormData) => {
    try {
      let savedConnector: ProcessedDataConnector;

      if (editingConnector) {
        // ─── Edit ─────────────────────────────────────
        const updatePayload: UpdateDataConnectorRequest = {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          is_active: editingConnector.is_active, // keep unless you add toggle
        };

        const updated = await dataConnectorService.updateDataConnector(
          editingConnector.id,
          updatePayload,
        );

        if (!updated) throw new Error("Connector not found");

        savedConnector = updated;
        // Optimistic update: update in list
        setConnectors((prev) =>
          prev.map((c) => (c.id === editingConnector.id ? savedConnector : c)),
        );
        success("Updated", `${formData.name} was updated successfully.`);
      } else {
        // ─── Create ───────────────────────────────────
        const createPayload: CreateDataConnectorRequest = {
          name: formData.name.trim(),
          type: formData.type,
          description: formData.description?.trim(),
        };

        savedConnector =
          await dataConnectorService.createDataConnector(createPayload);
        // Optimistic update: add to list
        setConnectors((prev) => [savedConnector, ...prev]);
        // Update statistics
        if (statistics) {
          setStatistics({
            ...statistics,
            total_connectors: statistics.total_connectors + 1,
            active_connectors: savedConnector.is_active
              ? statistics.active_connectors + 1
              : statistics.active_connectors,
            total_connection_count:
              statistics.total_connection_count +
              (savedConnector.connection_count || 0),
          });
        }
        success("Created", `${formData.name} was created successfully.`);
      }

      setShowCreateModal(false);
      setEditingConnector(null);
    } catch (err: any) {
      console.error(err);
      showError("Save failed", extractBackendError(error, "Save failed. Please try again."));
    }
  };

  const handleCloseForm = () => {
    setShowCreateModal(false);
    setEditingConnector(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton
          showBreadcrumb={true}
          currentLabel="Data Connectors"
        />
        <PermissionGate permission="servers.create">
          <FeatureActionButton
            featureId="data-connectors"
            action="create"
            onClick={() => {
              setEditingConnector(null);
              setShowCreateModal(true);
            }}
          />
        </PermissionGate>
      </div>
      <p className={`${tw.textSecondary} text-sm mt-1`}>
        Manage connector configurations and monitor integration health.
      </p>

      {/* Stats Cards */}
      <div className="mt-6">
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Plug
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">
                Total Connectors
              </p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {statistics?.total_connectors ?? connectors.length}
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
              <p className="text-sm font-medium text-gray-600">Active</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {statistics?.active_connectors ??
                connectors.filter((c) => c.is_active).length}
            </p>
          </div>
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Database
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">
                Total Connections
              </p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {statistics?.total_connection_count ??
                connectors.reduce(
                  (sum, c) => sum + (c.connection_count || 0),
                  0,
                )}
            </p>
          </div>
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Layers
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">
                Connector Types
              </p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {statistics?.connectors_by_type?.length ??
                new Set(connectors.map((c) => c.type)).size}
            </p>
          </div>
        </div>
      )}
      </div>

      {/* Controls */}
      <div className="space-y-4 mt-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <SearchInput
            placeholder="Search connectors..."
            value={searchTerm}
            onChange={setSearchTerm}
            onKeyDown={(e) => e.key === "Enter" && setSearchTerm(searchTerm)}
          />
        </div>

        <div className="w-48">
          <HeadlessSelect
            options={[
              { value: "all", label: "All Types" },
              ...(connectorTypes.length
                ? connectorTypes
                : ([
                    "tcp",
                    "websocket",
                    "kafka",
                    "jdbc",
                    "sms_inbox",
                    "api",
                    "files",
                    "digital_tags",
                  ] as DataConnectorType[])
              ).map((t) => ({
                value: t,
                label: getConnectorDisplayName(t),
              })),
            ]}
            value={filterType}
            onChange={(value) => setFilterType(value as DataConnectorType | "all")}
            placeholder="Filter by type"
          />
        </div>

        <div className="w-40">
          <HeadlessSelect
            options={[
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={filterStatus}
            onChange={(value) => setFilterStatus(value as typeof filterStatus)}
            placeholder="Filter by status"
          />
        </div>
      </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-600">
          <div
            className="animate-spin rounded-full h-5 w-5 border-b-2"
            style={{ borderColor: color.primary.action }}
          ></div>
          <span>Loading connectors...</span>
        </div>
      ) : (
        <div className={`${tw.rounded} overflow-hidden`}>
          <Table<DataConnectorType>
            columns={[
              {
                id: "name",
                label: "Name",
                visible: true,
                render: (value, connector) => (
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {(() => {
                        const { icon: IconComp, color: iconColor } =
                          getConnectorIcon(connector.type);
                        return (
                          <IconComp
                            className="h-5 w-5 flex-shrink-0"
                            style={{ color: iconColor }}
                          />
                        );
                      })()}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`text-sm font-semibold ${tw.textPrimary}`}
                      >
                        {value}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                id: "type",
                label: "Type",
                visible: true,
                render: (_, connector) => (
                  <span className={tw.textPrimary}>
                    {getConnectorDisplayName(connector.type)}
                  </span>
                ),
              },
              {
                id: "connection_count",
                label: "Connections",
                visible: true,
                render: (value) => (
                  <span className={`font-medium ${tw.textPrimary}`}>
                    {value ?? "--"}
                  </span>
                ),
              },
              {
                id: "is_active",
                label: "Status",
                visible: true,
                render: (value) => (
                  <span className="inline-flex items-center font-medium text-gray-900">
                    {value ? "Active" : "Inactive"}
                  </span>
                ),
              },
              {
                id: "last_used",
                label: "Last Used",
                visible: true,
                render: (value) => (
                  <span className={tw.textPrimary}>
                    {value
                      ? <DateFormatter date={new Date(value)} useUserTimezone />
                      : "--"}
                  </span>
                ),
              },
              {
                id: "actions",
                label: "Actions",
                visible: true,
                sortable: false,
                render: (_, connector) => (
                  <div className="relative flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleConnectorClick(connector)}
                      className={`group p-3 ${tw.rounded} ${tw.textSecondary} hover:bg-[${color.primary.accent}]/10 transition-all duration-200`}
                      title="View details"
                      disabled={isDeleting && connectorToDelete?.id === connector.id}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <PermissionGate permission="servers.update">
                      <button
                        onClick={() => handleEdit(connector)}
                        className={`group p-3 ${tw.rounded} ${tw.textSecondary} hover:bg-[${color.primary.accent}]/10 transition-all duration-200`}
                        title="Edit connector"
                        disabled={isDeleting && connectorToDelete?.id === connector.id}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </PermissionGate>
                    <PermissionGate permission="servers.delete">
                      <button
                        onClick={() => handleDelete(connector)}
                        className={`group p-3 ${tw.rounded} text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Delete connector"
                        disabled={
                          isDeleting && connectorToDelete?.id === connector.id
                        }
                      >
                        {isDeleting &&
                        connectorToDelete?.id === connector.id ? (
                          <div
                            className="animate-spin rounded-full h-4 w-4 border-2 border-red-300 border-t-red-600"
                          />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </PermissionGate>
                  </div>
                ),
              },
            ]}
            data={connectors}
            totalItems={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            style={{
              headerBackground: color.surface.tableHeader,
              headerTextColor: color.surface.tableHeaderText,
              rowBackground: color.surface.tablebodybg,
              rowSpacing: "0 8px",
            }}
          />

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={totalCount}
                onPageChange={handlePageChange}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      )}

      {/* Create Data Connector Modal */}
      <DataConnectorForm
        connector={editingConnector ?? undefined}
        isOpen={showCreateModal}
        onClose={handleCloseForm}
        onSave={handleSaveConnector}
        availableTypes={connectorTypes}
      />

      <DeleteConfirmModal
        isOpen={!!connectorToDelete}
        onClose={() => setConnectorToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Data Connector"
        description="Are you sure you want to delete this data connector? This action cannot be undone."
        itemName={connectorToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete Connector"
        cancelText="Cancel"
      />
    </div>
  );
}
