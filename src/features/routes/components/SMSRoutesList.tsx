import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { SMSRoute } from "../types/smsRoute";
import { smsRouteService } from "../services/smsRouteService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";
import SMSRouteCreateModal from "./SMSRouteCreateModal";

export default function SMSRoutesList() {
  const { success, error: showError } = useToast();

  const [routes, setRoutes] = useState<SMSRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<SMSRoute | null>(null);

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
    setDeleteConfirmId(route.id);
    setDeleteConfirmName(route.name);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setDeleting(deleteConfirmId);
      await smsRouteService.deleteRoute(deleteConfirmId);
      success(
        "Success",
        `"${deleteConfirmName}" has been deleted successfully`,
      );
      setRoutes((prev) => prev.filter((route) => route.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
    } catch (err) {
      showError("Error", "Failed to delete SMS route");
    } finally {
      setDeleting(null);
    }
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
      showError("Error", "Failed to update route status");
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BackButton
        fallbackTo="/dashboard/configuration"
        showBreadcrumb={true}
        currentLabel="SMS Routes"
      />

      {/* Description and Create Button */}
      <div className="flex items-start justify-between gap-4">
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage SMS gateway routes for message delivery. Routes determine which
          gateway provider is used to send SMS messages.
        </p>
        <button
          onClick={() => {
            setEditingRoute(null);
            setShowCreateModal(true);
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md whitespace-nowrap disabled:opacity-60"
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="w-4 h-4" />
          Create
        </button>
      </div>

      {/* Search Bar */}
      <SearchInput
        placeholder="Search routes..."
        value={searchTerm}
        onChange={(value) => setSearchTerm(value)}
      />

      {/* Table Container */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <LoadingSpinner variant="modern" size="md" color="primary" />
              <p className={`${tw.textMuted} font-medium mt-4`}>
                Loading routes...
              </p>
            </div>
          </div>
        ) : (
          <table
            className="w-full min-w-[720px]"
            style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
          >
            <thead>
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider rounded-tl-md"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                  }}
                >
                  Route Name
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                  }}
                >
                  Description
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                  }}
                >
                  Status
                </th>
                <th
                  className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider rounded-tr-md"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className={`${tw.textSecondary} text-sm`}>
                      No routes match your search
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((route) => (
                  <tr
                    key={route.id}
                    style={{ backgroundColor: color.surface.tablebodybg }}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-black">
                      {route.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {route.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {route.is_active ? "Active" : "Inactive"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        <ActivateDeactivateButton
                          isActive={route.is_active}
                          onToggle={() => handleToggleStatus(route)}
                          disabled={
                            deleting === route.id ||
                            togglingStatus === route.id ||
                            loading
                          }
                          isLoading={togglingStatus === route.id}
                          title={
                            route.is_active
                              ? "Deactivate route"
                              : "Activate route"
                          }
                        />
                        <button
                          onClick={() => {
                            setEditingRoute(route);
                            setShowCreateModal(true);
                          }}
                          disabled={deleting === route.id || loading}
                          className={`p-2 ${tw.rounded} text-black disabled:opacity-60`}
                          title="Edit route"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(route)}
                          disabled={deleting === route.id || loading}
                          className={`p-2 text-red-600 hover:bg-red-50 ${tw.rounded} disabled:opacity-60`}
                          title="Delete route"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
              Delete SMS Route
            </h3>
            <p className={`${tw.textSecondary} text-sm mb-6`}>
              Are you sure you want to delete "{deleteConfirmName}"? This action
              cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting !== null}
                className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting !== null}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-60"
              >
                {deleting === deleteConfirmId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <SMSRouteCreateModal
        isOpen={showCreateModal}
        editingRoute={editingRoute}
        onClose={() => {
          setShowCreateModal(false);
          setEditingRoute(null);
        }}
        onSuccess={(savedRoute) => {
          setRoutes((prev) => {
            const exists = prev.some((route) => route.id === savedRoute.id);
            if (exists) {
              return prev.map((route) =>
                route.id === savedRoute.id ? savedRoute : route,
              );
            }
            return [savedRoute, ...prev];
          });
          setShowCreateModal(false);
          setEditingRoute(null);
        }}
      />
    </div>
  );
}
