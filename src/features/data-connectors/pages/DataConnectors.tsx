import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import {
  Search,
  Filter,
  Plug,
  CheckCircle,
  Database,
  Layers,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
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
import CreateButton from "../../../shared/components/ui/CreateButton";
import DataConnectorForm from "../components/DataConnectorForm";
import {
  CreateDataConnectorRequest,
  UpdateDataConnectorRequest,
  DataConnectorFormData,
  DataConnectorFilterParams,
} from "../types/dataConnector";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { PermissionGate } from "../../auth/components/PermissionGate";
import Pagination from "../../../shared/components/ui/Pagination";

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
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const activeFilterCount =
    (filterType !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);

  const loadConnectors = async () => {
    try {
      setLoading(true);

      const params: DataConnectorFilterParams = {
        search: searchTerm.trim() || undefined,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
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
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus]);

  // Load connectors when currentPage, search, filters, or pageSize changes
  useEffect(() => {
    loadConnectors();
  }, [searchTerm, filterType, filterStatus, currentPage, pageSize]);

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
      showError("Delete failed", err.message || "Could not delete connector");
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
          configuration: formData.configuration,
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
          configuration: formData.configuration ?? {},
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
      showError("Save failed", err.message || "Could not save connector");
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
    <div className="">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            Data Connectors
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Manage connector configurations and monitor integration health.
          </p>
        </div>
        <PermissionGate permission="servers.create">
          <CreateButton
            onClick={() => {
              setEditingConnector(null);
              setShowCreateModal(true);
            }}
          />
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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

      {/* Search & Filters */}
      {showFilterPanel && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl z-30 p-5"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-semibold text-gray-900">
              Filter Connectors
            </h3>
            <button
              onClick={() => setShowFilterPanel(false)}
              className="text-gray-500 hover:text-gray-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as typeof filterStatus)
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Type – single select */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connector Type
            </label>
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as DataConnectorType | "all")
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {(connectorTypes.length
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
              ).map((t) => (
                <option key={t} value={t}>
                  {getConnectorDisplayName(t)}
                </option>
              ))}
            </select>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setFilterType("all");
                setFilterStatus("all");
                setShowFilterPanel(false);
              }}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Reset Filters
            </button>

            <button
              onClick={() => setShowFilterPanel(false)}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
            style={{ color: color.text.muted }}
          />
          <input
            type="text"
            placeholder="Search connectors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearchTerm(searchTerm)}
            className={`w-full pl-10 pr-4 py-3 text-sm border ${tw.borderDefault} ${tw.rounded} focus:outline-none transition-all duration-200 bg-white focus:ring-2 focus:ring-[${color.primary.accent}]/20`}
          />
        </div>

        <button
          onClick={() => setShowFilterPanel((prev) => !prev)}
          className={`relative flex items-center gap-2 px-4 py-2.5 border ${tw.borderDefault} ${tw.rounded} hover:bg-gray-50 transition font-medium text-sm`}
          style={{
            backgroundColor: button.secondaryAction.background,
            color: button.secondaryAction.color,
          }}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>

          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {activeFilterCount}
            </span>
          )}
        </button>
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
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Connector
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Type
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Connections
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Last Used
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs sm:text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {connectors.length === 0 ? (
                  <tr>
                    <td
                      className={`px-6 py-6 text-sm ${tw.textSecondary}`}
                      colSpan={6}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      No data connectors found. Get started by creating your
                      first connector.
                    </td>
                  </tr>
                ) : (
                  connectors.map((connector) => (
                    <tr key={connector.id} className="transition-colors">
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
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
                              {connector.name}
                            </span>
                            {/* <span className={`text-xs ${tw.textSecondary}`}>
                              {connector.description}
                            </span> */}
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="inline-flex items-center font-medium text-gray-900">
                          {connector.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className={tw.textPrimary}>
                          {getConnectorDisplayName(connector.type)}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className={`font-medium ${tw.textPrimary}`}>
                          {connector.connection_count ?? "--"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className={tw.textPrimary}>
                          {connector.last_used
                            ? new Date(connector.last_used).toLocaleDateString()
                            : "--"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalCount}
              onPageChange={handlePageChange}
            />
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
