import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import Pagination from "../../../shared/components/ui/Pagination";
import { SMSRoute } from "../types/smsRoute";
import { smsRouteService } from "../services/smsRouteService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw } from "../../../shared/utils/utils";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

export default function SMSRoutesList() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [routes, setRoutes] = useState<SMSRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteRoute } = useDeleteConfirm({
    onDelete: async (id) => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      setRoutes((prev) => prev.filter((r) => r.id !== numId));
      await smsRouteService.deleteRoute(numId);
    },
    itemLabel: "SMS Route",
  });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const data = await smsRouteService.getAllRoutes();
      setRoutes(data);
    } catch (err) {
      showError("Error", "Failed to load SMS routes");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (route: SMSRoute) => {
    openDeleteConfirm(route.id, route.name);
  };

  const handleToggleStatus = async (route: SMSRoute) => {
    const nextStatus = !route.is_active;

    try {
      setTogglingStatus(route.id);
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === route.id ? { ...r, is_active: nextStatus } : r,
        ),
      );

      await smsRouteService.updateRoute(route.id, {
        is_active: nextStatus,
      });

      success(
        "Success",
        `"${route.name}" has been ${nextStatus ? "activated" : "deactivated"} successfully`,
      );
    } catch (err) {
      // Revert optimistic update if API call fails
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === route.id ? { ...r, is_active: route.is_active } : r,
        ),
      );
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setTogglingStatus(null);
    }
  };

  const filteredRoutes = routes.filter(
    (route) =>
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (route.description &&
        route.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Table columns definition
  const defaultColumns: TableColumn<SMSRoute>[] = [
    {
      id: "name",
      label: "Route Name",
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
      isActionColumn: true,
      render: (value, route) => (
        <div className="flex items-center justify-center gap-2">
          <ActivateDeactivateButton
            isActive={route.is_active}
            onToggle={() => handleToggleStatus(route)}
            disabled={togglingStatus === route.id}
            isLoading={togglingStatus === route.id}
            title={route.is_active ? "Deactivate" : "Activate"}
          />
          <button
            onClick={() => navigate(`/dashboard/sms-routes/edit/${route.id}`)}
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(route)}
            disabled={isDeleting && deleteConfirm.id === route.id}
            className={`p-0 icon-delete ${tw.rounded} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
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
    sortConfigs,
    handleSort,
  } = useTable({
    tableId: "sms-routes-table",
    defaultColumns,
    persistToLocalStorage: true,
  });

  // Handle pagination slicing
  const paginatedRoutes = filteredRoutes.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, tableHandlePageChange]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton
           
            showBreadcrumb={true}
           
            currentLabel="SMS Routes"
          />
        </div>
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage SMS gateway routes for message delivery. Routes determine which
          gateway provider is used to send SMS messages.
        </p>
      </div>

      {/* Search Bar */}
      <SearchInput
        placeholder="Search routes..."
        value={searchTerm}
        onChange={(value) => setSearchTerm(value)}
      />

      {/* Table Container */}
      <div className={`${tw.rounded} overflow-hidden`}>
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <LoadingSpinner variant="modern" size="md" color="primary" />
              <p className={`${tw.textMuted} font-medium mt-4`}>
                Loading routes...
              </p>
            </div>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className={`${tw.textSecondary} text-sm`}>
              No routes match your search
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <Table<SMSRoute>
              columns={columns}
              data={paginatedRoutes}
              totalItems={filteredRoutes.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={loading}
              onPageChange={tableHandlePageChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
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
              />
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={closeDeleteConfirm}
        onConfirm={async () => {
          try {
            await confirmDeleteRoute(deleteConfirm.id);
          } catch (err) {
            showError("Error", extractBackendError(err, "Error. Please try again."));
          }
        }}
        title="Delete SMS Route"
        description="Are you sure you want to delete this route? This action cannot be undone."
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
      />

    </div>
  );
}
