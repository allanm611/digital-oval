import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Edit, Plus, Eye } from "lucide-react";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DateFormatter from "../../../shared/components/DateFormatter";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { smsRouteService } from "../services/smsRouteService";
import { emailRouteService } from "../services/emailRouteService";
import { pushNotificationRouteService } from "../services/pushNotificationRouteService";
import { whatsappRouteService } from "../services/whatsappRouteService";
import { ussdRouteService } from "../services/ussdRouteService";
import { SMSRoute } from "../types/smsRoute";
import { EmailRoute } from "../types/emailRoute";
import { PushNotificationRoute } from "../types/pushNotificationRoute";
import { WhatsAppRoute } from "../types/whatsappRoute";

type CommunicationChannel = "SMS" | "EMAIL" | "WHATSAPP" | "PUSH" | "USSD";

interface UnifiedRoute {
  id: number;
  name: string;
  description?: string;
  channel: CommunicationChannel;
  gateway_provider?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  originalRoute: SMSRoute | EmailRoute | PushNotificationRoute | WhatsAppRoute;
}

export default function RoutesManagementPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();
  const [routes, setRoutes] = useState<UnifiedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<{
    id: number;
    channel: CommunicationChannel;
  } | null>(null);
  const [deleteRouteData, setDeleteRouteData] = useState<{ id: number; channel: CommunicationChannel } | null>(null);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete } = useDeleteConfirm({
    onDelete: async (id) => {
      if (!deleteRouteData) return;
      const numId = typeof id === "string" ? parseInt(id) : id;

      setRoutes(routes.filter((r) => !(r.id === numId && r.channel === deleteRouteData.channel)));

      if (deleteRouteData.channel === "SMS") {
        await smsRouteService.deleteRoute(numId);
      } else if (deleteRouteData.channel === "EMAIL") {
        await emailRouteService.deleteRoute(numId);
      } else if (deleteRouteData.channel === "PUSH") {
        await pushNotificationRouteService.deleteRoute(numId);
      } else if (deleteRouteData.channel === "WHATSAPP") {
        await whatsappRouteService.deleteRoute(numId);
      } else if (deleteRouteData.channel === "USSD") {
        await ussdRouteService.deleteRoute(numId);
      }
    },
    itemLabel: "Route",
  });

  useEffect(() => {
    loadAllRoutes();
  }, [filterChannel]);

  const loadAllRoutes = async () => {
    try {
      setLoading(true);
      const [smsRoutes, emailRoutes, pushRoutes, whatsappRoutes, ussdRoutes] =
        await Promise.all([
          smsRouteService.getAllRoutes(),
          emailRouteService.getAllRoutes(),
          pushNotificationRouteService.getAllRoutes(),
          whatsappRouteService.getAllRoutes(),
          ussdRouteService.getAllRoutes(),
        ]);

      const unifiedRoutes: UnifiedRoute[] = [];

      if (
        filterChannel === "all" ||
        filterChannel === "SMS"
      ) {
        smsRoutes.forEach((route) => {
          unifiedRoutes.push({
            id: route.id,
            name: route.name,
            description: route.description,
            channel: "SMS",
            gateway_provider: route.gateway_provider,
            is_active: route.is_active,
            created_at: route.created_at,
            updated_at: route.updated_at,
            originalRoute: route,
          });
        });
      }

      if (
        filterChannel === "all" ||
        filterChannel === "EMAIL"
      ) {
        emailRoutes.forEach((route) => {
          unifiedRoutes.push({
            id: route.id,
            name: route.name,
            description: route.description,
            channel: "EMAIL",
            gateway_provider: route.gateway_provider,
            is_active: route.is_active,
            created_at: route.created_at,
            updated_at: route.updated_at,
            originalRoute: route,
          });
        });
      }

      if (
        filterChannel === "all" ||
        filterChannel === "PUSH"
      ) {
        pushRoutes.forEach((route) => {
          unifiedRoutes.push({
            id: route.id,
            name: route.name,
            description: route.description,
            channel: "PUSH",
            gateway_provider: route.gateway_provider,
            is_active: route.is_active,
            created_at: route.created_at,
            updated_at: route.updated_at,
            originalRoute: route,
          });
        });
      }

      if (
        filterChannel === "all" ||
        filterChannel === "WHATSAPP"
      ) {
        whatsappRoutes.forEach((route) => {
          unifiedRoutes.push({
            id: route.id,
            name: route.name,
            description: route.description,
            channel: "WHATSAPP",
            gateway_provider: route.gateway_provider,
            is_active: route.is_active,
            created_at: route.created_at,
            updated_at: route.updated_at,
            originalRoute: route,
          });
        });
      }

      if (
        filterChannel === "all" ||
        filterChannel === "USSD"
      ) {
        ussdRoutes.forEach((route) => {
          unifiedRoutes.push({
            id: route.id,
            name: route.name,
            description: route.description,
            channel: "USSD",
            gateway_provider: route.gateway_provider,
            is_active: route.is_active,
            created_at: route.created_at,
            updated_at: route.updated_at,
            originalRoute: route,
          });
        });
      }

      setRoutes(unifiedRoutes);
    } catch (err) {
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch = route.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Table columns definition
  const defaultColumns: TableColumn<UnifiedRoute>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
      render: (value) => (
        <div className={`${tw.tableFirstColumn} ${tw.textPrimary} truncate`} title={value as string}>
          {value}
        </div>
      ),
    },
    {
      id: "description",
      label: "Description",
      visible: true,
      render: (value) => (
        <div className={`text-sm ${tw.textSecondary} max-w-md truncate`} title={value ? String(value) : "—"}>
          {value || "—"}
        </div>
      ),
    },
    {
      id: "channel",
      label: "Channel",
      visible: true,
      render: (value) => (
        <div className={`text-sm ${tw.textSecondary} truncate`} title={value as string}>
          {value}
        </div>
      ),
    },
    {
      id: "gateway_provider",
      label: "Gateway Provider",
      visible: true,
      render: (value) => (
        <div className={`text-sm ${tw.textSecondary} truncate`} title={value ? String(value) : "—"}>
          {value || "—"}
        </div>
      ),
    },
    {
      id: "is_active",
      label: "Status",
      visible: true,
      render: (value) => (
        <span className={`text-sm ${tw.textSecondary}`}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (value, route) => (
        <div className="flex items-center justify-center gap-2">
          <ActivateDeactivateButton
            isActive={route.is_active}
            onToggle={() => handleToggleStatus(route)}
            disabled={
              togglingStatus?.id === route.id && togglingStatus?.channel === route.channel
            }
            isLoading={
              togglingStatus?.id === route.id && togglingStatus?.channel === route.channel
            }
            title={route.is_active ? "Deactivate" : "Activate"}
          />
          <button
            onClick={() => navigate(`/dashboard/routes/${route.id}`)}
            className={`p-2 icon-delete ${tw.rounded} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateToEdit(route)}
            className={`p-2 icon-delete ${tw.rounded} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteRoute(route)}
            className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
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
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
    toggleColumn,
  } = useTable({
    tableId: "routes-management-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  // Handle pagination slicing
  const paginatedRoutes = filteredRoutes.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize
  );

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, filterChannel, tableHandlePageChange]);

  const handleDeleteRoute = (route: UnifiedRoute) => {
    setDeleteRouteData({ id: route.id, channel: route.channel });
    openDeleteConfirm(route.id, route.name);
  };

  const handleToggleStatus = async (route: UnifiedRoute) => {
    const oldRoutes = routes;
    try {
      setTogglingStatus({ id: route.id, channel: route.channel });
      const newStatus = !route.is_active;

      setRoutes(
        routes.map((r) =>
          r.id === route.id && r.channel === route.channel
            ? { ...r, is_active: newStatus }
            : r
        )
      );

      if (route.channel === "SMS") {
        await smsRouteService.updateRoute(route.id, { is_active: newStatus });
      } else if (route.channel === "EMAIL") {
        await emailRouteService.updateRoute(route.id, { is_active: newStatus });
      } else if (route.channel === "PUSH") {
        await pushNotificationRouteService.updateRoute(route.id, { is_active: newStatus });
      } else if (route.channel === "WHATSAPP") {
        await whatsappRouteService.updateRoute(route.id, { is_active: newStatus });
      } else if (route.channel === "USSD") {
        await ussdRouteService.updateRoute(route.id, { is_active: newStatus });
      }

      showSuccess("Success", `Route ${newStatus ? "activated" : "deactivated"} successfully`);
    } catch (err) {
      setRoutes(oldRoutes);
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setTogglingStatus(null);
    }
  };

  const navigateToEdit = (route: UnifiedRoute) => {
    if (route.channel === "SMS") {
      navigate(`/dashboard/sms-routes/edit/${route.id}`);
    } else if (route.channel === "EMAIL") {
      navigate(`/dashboard/email-routes/edit/${route.id}`);
    } else if (route.channel === "PUSH") {
      navigate(`/dashboard/push-notification-routes/edit/${route.id}`);
    } else if (route.channel === "WHATSAPP") {
      navigate(`/dashboard/whatsapp-routes/edit/${route.id}`);
    } else if (route.channel === "USSD") {
      navigate(`/dashboard/ussd-routes/edit/${route.id}`);
    }
  };

  const channelOptions = [
    { value: "all", label: "All Channels" },
    { value: "SMS", label: "SMS" },
    { value: "EMAIL", label: "Email" },
    { value: "WHATSAPP", label: "WhatsApp" },
    { value: "PUSH", label: "Push Notification" },
    { value: "USSD", label: "USSD" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-4 flex-1">
          <BackButton
           
            showBreadcrumb={true}
           
            currentLabel="Routes Management"
          />
          <p className={`text-sm ${tw.textSecondary}`}>
            Manage all communication routes across channels
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/routes/create")}
          className="inline-flex items-center gap-2 px-4 py-2 text-white font-semibold text-sm rounded transition-colors hover:opacity-90"
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="w-4 h-4" />
          Create Route
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by route name..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <div className="w-full md:w-48">
          <HeadlessSelect
            value={filterChannel}
            onChange={setFilterChannel}
            options={channelOptions}
            placeholder="Filter by channel"
          />
        </div>
      </div>

      {/* Table */}
      <div className={`${tw.rounded} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="text-center py-12">
            <p className={`${tw.textSecondary} text-sm`}>
              {searchTerm || filterChannel !== "all"
                ? "No routes found matching your filters"
                : "No routes created yet"}
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <Table<UnifiedRoute>
              columns={columns}
              data={paginatedRoutes}
              totalItems={filteredRoutes.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={loading}
              onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              getRowId={(row) => `${row.id}-${row.channel}`}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {/* Pagination */}
            {!loading && paginatedRoutes.length > 0 && filteredRoutes.length > 0 && (
              <Pagination
                currentPage={tableCurrentPage}
                pageSize={tablePageSize}
                totalItems={filteredRoutes.length}
                onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              />
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Route"
        description="Are you sure you want to delete this route? This action cannot be undone."
        itemName={deleteConfirm.itemName}
        isLoading={isDeleting}
        confirmText="Delete"
      />
    </div>
  );
}
