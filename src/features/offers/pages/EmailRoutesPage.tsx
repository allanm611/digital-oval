import { useState, useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { Edit, Trash2, Plus } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import BackButton from "../../../shared/components/ui/BackButton";
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
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingItemId, setTogglingItemId] = useState<number | string | null>(null);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteRoute } = useDeleteConfirm({
    onDelete: async (id) => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      setRoutes((prev) => prev.filter((r) => r.id !== numId));
    },
    itemLabel: "Email Route",
  });

  const filteredRoutes = routes.filter(
    (route) =>
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (route.description && route.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Table columns definition
  const defaultColumns: TableColumn<EmailRoute>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
      render: (value) => (
        <div className={`${tw.tableFirstColumn} ${tw.textPrimary} truncate`} title={value as string}>
          {value}
        </div>
      ),
    },
    {
      id: "gateway_provider",
      label: "Provider",
      visible: true,
      filterConfig: { type: 'text' },
      render: (value) => (
        <div className={`text-sm ${tw.textSecondary} truncate`} title={value as string}>
          {value}
        </div>
      ),
    },
    {
      id: "from_address",
      label: "From Address",
      visible: true,
      filterConfig: { type: 'text' },
      render: (value) => (
        <div className={`text-sm ${tw.textSecondary} truncate`} title={value as string}>
          {value}
        </div>
      ),
    },
    {
      id: "isActive",
      label: "Status",
      visible: true,
      filterConfig: { type: 'select', options: ['active', 'inactive'] },
      render: (value) => (
        <span className={`text-sm ${tw.textSecondary}`}>
          {value ? "Active" : "Inactive"}
        </span>
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
    tableId: "email-routes-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const paginatedRoutes = filteredRoutes.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize
  );

  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, tableHandlePageChange]);

  const handleCreateRoute = () => {
    navigate("create");
  };

  const handleEditRoute = (route: EmailRoute) => {
    navigate(`${route.id}/edit`);
  };

  const handleDeleteClick = (route: EmailRoute) => {
    openDeleteConfirm(route.id, route.name);
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
          <>
            {/* Table */}
            <Table<EmailRoute>
              columns={columns}
              data={paginatedRoutes}
              totalItems={filteredRoutes.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={false}
              onPageChange={tableHandlePageChange}
              onPageSizeChange={tableHandlePageSizeChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
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
            {paginatedRoutes.length > 0 && filteredRoutes.length > 0 && (
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

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={closeDeleteConfirm}
        onConfirm={async () => {
          try {
            await confirmDeleteRoute(deleteConfirm.id);
            showToast("Delete Email Route", `Route deleted successfully`);
          } catch (err) {
            showError(t.genericConfig.error, "Failed to delete email route");
          }
        }}
        title="Delete Email Route"
        description="This may affect email delivery."
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
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
