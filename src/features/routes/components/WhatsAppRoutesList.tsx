import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { WhatsAppRoute } from "../types/whatsappRoute";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw } from "../../../shared/utils/utils";

const DUMMY_WHATSAPP_ROUTES: WhatsAppRoute[] = [
  {
    id: 1,
    name: "Meta Business API",
    description: "Meta Business API WhatsApp integration for main channel",
    gateway_provider: "META_BUSINESS_API",
    is_active: true,
    created_at: "2026-01-20T10:30:00Z",
    updated_at: "2026-04-22T14:45:00Z",
  },
  {
    id: 2,
    name: "Twilio WhatsApp",
    description: "Twilio WhatsApp API for backup and testing",
    gateway_provider: "TWILIO_WHATSAPP",
    is_active: true,
    created_at: "2026-02-14T09:15:00Z",
    updated_at: "2026-04-19T16:20:00Z",
  },
  {
    id: 3,
    name: "Custom WhatsApp Gateway",
    description: "Custom WhatsApp gateway for special campaigns",
    gateway_provider: "CUSTOM",
    is_active: false,
    created_at: "2026-03-10T11:00:00Z",
    updated_at: "2026-04-16T13:30:00Z",
  },
];

export default function WhatsAppRoutesList() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [routes, setRoutes] = useState<WhatsAppRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = () => {
    setLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      setRoutes(DUMMY_WHATSAPP_ROUTES);
      setLoading(false);
    }, 500);
  };

  const handleDeleteClick = (route: WhatsAppRoute) => {
    setDeleteConfirmId(route.id);
    setDeleteConfirmName(route.name);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmId) return;

    setDeleting(deleteConfirmId);
    // Mock API call
    setTimeout(() => {
      success(
        "Success",
        `"${deleteConfirmName}" has been deleted successfully`,
      );
      setRoutes((prev) => prev.filter((route) => route.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
      setDeleting(null);
    }, 600);
  };

  const handleToggleStatus = (route: WhatsAppRoute) => {
    const nextStatus = !route.is_active;
    setTogglingStatus(route.id);

    // Mock API call
    setTimeout(() => {
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === route.id ? { ...r, is_active: nextStatus } : r,
        ),
      );
      success(
        "Success",
        `"${route.name}" has been ${nextStatus ? "activated" : "deactivated"} successfully`,
      );
      setTogglingStatus(null);
    }, 600);
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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton
           
            showBreadcrumb={true}
           
            currentLabel="WhatsApp Routes"
          />
        </div>
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage WhatsApp gateway routes for message delivery. Routes determine which
          gateway provider is used to send WhatsApp messages.
        </p>
      </div>

      {/* Search Bar */}
      <SearchInput
        placeholder="Search routes..."
        value={searchTerm}
        onChange={(value) => setSearchTerm(value)}
      />

      {/* Table Container */}
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
        <div className="text-center py-12">
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            No routes found
          </h3>
          <p className={`${tw.textMuted}`}>
            No routes match your search
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
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
                  className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider rounded-tr-md"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((route) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 max-w-md w-full mx-4">
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
              Delete WhatsApp Route
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
    </div>
  );
}
