import { useState, useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { Edit, Trash2, Plus } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import Pagination from "../../../shared/components/ui/Pagination";
import BackButton from "../../../shared/components/ui/BackButton";
import CreateButton from "../../../shared/components/ui/CreateButton";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { color, tw } from "../../../shared/utils/utils";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";

import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { hardcodedEmailRoutes } from "../../configurations/configs/configurationPageConfigs";
import EmailRoutesFormPage from "./EmailRoutesFormPage";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

interface EmailRoute {
  id: number | string;
  name: string;
  description?: string;
  gateway_provider: string;
  from_address: string;
  isActive: boolean;
}

function EmailRoutesListView() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const [routes, setRoutes] = useState<EmailRoute[]>(hardcodedEmailRoutes as EmailRoute[]);
  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete } = useDeleteConfirm({ onDelete: async (id) => {}, itemLabel: "Item", });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [togglingItemId, setTogglingItemId] = useState<number | string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<EmailRoute | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredRoutes = routes.filter(
    (route) =>
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (route.description && route.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRoutes = filteredRoutes.slice(startIndex, startIndex + pageSize);

  const handleCreateRoute = () => {
    navigate("create");
  };

  const handleEditRoute = (route: EmailRoute) => {
    navigate(`${route.id}/edit`);
  };

  const handleDeleteClick = (route: EmailRoute) => {
    setRouteToDelete(route);
    openDeleteConfirm(item?.id || 0, item?.name || "");
  };

  const confirmDeleteRoute = async () => {
    if (!routeToDelete) return;

    setDeleting(true);
    try {
      setRoutes((prev) => prev.filter((r) => r.id !== routeToDelete.id));
      showToast("Delete Email Route", `"${routeToDelete.name}" has been deleted successfully.`);
      closeDeleteConfirm();
      setRouteToDelete(null);
    } catch (err) {
      showError(t.genericConfig.error, "Failed to delete email route");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = (route: EmailRoute) => {
    const newActive = !route.isActive;
    setTogglingItemId(route.id);
    setRoutes((prev) =>
      prev.map((r) => (r.id === route.id ? { ...r, isActive: newActive } : r))
    );
    setTimeout(() => setTogglingItemId(null), 300);
    showToast(
      newActive ? "Activated" : "Deactivated",
      newActive
        ? `${route.name} has been activated`
        : `${route.name} has been deactivated`
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton
           
            showBreadcrumb={true}
           
            currentLabel="Email Routes"
          />
        </div>
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage email SMTP routes for message delivery. Routes determine which SMTP
          provider and configuration is used to send email messages.
        </p>
      </div>

      {/* Search */}
      <div className="my-5">
        <SearchInput
          placeholder="Search routes..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Table */}
      <div
        className={`${tw.rounded} border overflow-hidden`}
        style={{ borderColor: color.border.default }}
      >
        {filteredRoutes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-4">📧</div>
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? "No routes found" : "No email routes yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm
                ? "Try adjusting your search"
                : "Use the unified routes management page to create email routes"}
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
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopLeftRadius: "0.375rem",
                    }}
                  >
                    Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Provider
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    From Address
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedRoutes.map((route) => (
                  <tr key={route.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className={`${tw.tableFirstColumn} ${tw.textPrimary}`}>
                        {route.name}
                      </div>
                    </td>

                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {route.gateway_provider}
                      </div>
                    </td>

                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {route.from_address}
                      </div>
                    </td>

                    <td
                      className="px-6 py-4 text-center"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm font-medium ${tw.textSecondary}`}>
                        {route.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredRoutes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredRoutes.length}
          onPageChange={setCurrentPage}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => {
          closeDeleteConfirm();
          setRouteToDelete(null);
        }}
        onConfirm={confirmDeleteRoute}
        title="Delete Email Route"
        description="This may affect email delivery."
        itemName={routeToDelete?.name || ""}
        isLoading={deleting}
      />
    </div>
  );
}

export default function EmailRoutesPage() {
  return (
    <Routes>
      <Route index element={<EmailRoutesListView />} />
      <Route path="create" element={<EmailRoutesFormPage />} />
      <Route path=":id/edit" element={<EmailRoutesFormPage />} />
    </Routes>
  );
}
