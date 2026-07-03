import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trash2,
  Edit,
  Download,
} from "lucide-react";
import { vipListService } from "../../../shared/services/vipListService";
import { userService } from "../../users/services/userService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { useLanguage } from "../../../contexts/LanguageContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import BackButton from "../../../shared/components/ui/BackButton";
import DateFormatter from "../../../shared/components/DateFormatter";
import { getStatusBadgeConfig } from "../../../shared/utils/statusColors";
import CreateVIPListModal from "../components/CreateVIPListModal";

interface VIPListDetail {
  id: number;
  name: string;
  description?: string;
  original_filename?: string;
  file_hash?: string;
  rows_imported?: number;
  rows_failed?: number;
  processing_status?: "pending" | "processing" | "completed" | "failed";
  processing_error?: string;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface AuditTrailEntry {
  id: number;
  vip_list_id: number;
  customer_id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  department_id?: number;
  line_of_business_id?: number;
  status: string;
  added_at: string;
  added_by?: number;
  removed_at?: string;
  removed_by?: number;
  created_at: string;
  department_name?: string;
  line_of_business_name?: string;
}

export default function VIPListDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const [vipList, setVIPList] = useState<VIPListDetail | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [userNames, setUserNames] = useState<Record<number, string>>({});

  const getUserDisplayName = (userId: number) => {
    return userNames[userId] || userId;
  };

  const auditColumns = useMemo(() => [
    { id: "customer_name", label: "Customer Name", visible: true },
    { id: "customer_email", label: "Email", visible: true },
    { id: "added_at", label: "Added At", visible: true, render: (_, row) => <DateFormatter date={row.added_at} includeTime /> },
    { id: "added_by", label: "Added By", visible: true, render: (_, row) => row._full?.added_by ? (
      <button
        onClick={() => navigate(`/dashboard/user-management/${row._full.added_by}`)}
        className="text-sm hover:underline transition-colors"
        style={{ color: color.primary.accent, background: "none", border: "none", padding: "0", cursor: "pointer" }}
      >
        {getUserDisplayName(row._full.added_by)}
      </button>
    ) : <span className="text-sm">-</span> },
    { id: "removed_at", label: "Removed At", visible: true, render: (_, row) => row.removed_at ? <DateFormatter date={row.removed_at} includeTime /> : "-" },
    { id: "removed_by", label: "Removed By", visible: true, render: (_, row) => row._full?.removed_by ? (
      <button
        onClick={() => navigate(`/dashboard/user-management/${row._full.removed_by}`)}
        className="text-sm hover:underline transition-colors"
        style={{ color: color.primary.accent, background: "none", border: "none", padding: "0", cursor: "pointer" }}
      >
        {getUserDisplayName(row._full.removed_by)}
      </button>
    ) : <span className="text-sm">-</span> },
    { id: "status", label: "Status", visible: true, render: (_, row) => <span className="text-sm text-black">{row.status}</span> },
  ] as TableColumn<any>[], []);

  const {
    columns,
    currentPage,
    pageSize,
    handlePageChange,
    sortConfigs,
    handleSort,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useTable({
    tableId: "vip-list-audit-trail",
    defaultColumns: auditColumns,
    persistToLocalStorage: false,
  });

  useEffect(() => {
    if (id) {
      loadVIPListDetails();
    }
  }, [id]);

  useEffect(() => {
    if (vipList && !loadingAudit) {
      loadAuditTrail();
    }
  }, [vipList?.id]);

  useEffect(() => {
    if (auditTrail.length === 0) return;

    const fetchUserDetails = async (userId: number) => {
      if (userNames[userId]) return;

      try {
        const response = await userService.getUserById(userId, true);
        if (response.data) {
          const userName = response.data.display_name || response.data.username || response.data.first_name || null;
          setUserNames((prev) => ({
            ...prev,
            [userId]: userName || String(userId),
          }));
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    const userIds = new Set<number>();
    auditTrail.forEach((entry) => {
      if (entry.added_by) userIds.add(entry.added_by);
      if (entry.removed_by) userIds.add(entry.removed_by);
    });

    userIds.forEach(fetchUserDetails);
  }, [auditTrail]);


  const loadVIPListDetails = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const vipListId = parseInt(id);
      const response = await vipListService.getById(vipListId);
      setVIPList(response as VIPListDetail);
    } catch (err) {
      showError("Error loading VIP list", extractBackendError(err, "Error loading VIP list. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditTrail = async () => {
    if (!vipList) return;

    try {
      setLoadingAudit(true);
      const auditData = await vipListService.getAuditTrail(vipList.id);
      setAuditTrail(auditData || []);
    } catch (err) {
      showError("Error loading audit trail", extractBackendError(err, "Error loading audit trail. Please try again."));
    } finally {
      setLoadingAudit(false);
    }
  };

  async function handleDelete() {
    if (!vipList) return;

    try {
      setIsDeleting(true);
      await vipListService.delete(vipList.id);
      showToast("VIP list deleted successfully");
      navigate("/dashboard/vip-list-management");
    } catch (err) {
      showError("Error deleting VIP list", extractBackendError(err, "Failed to delete VIP list. Please try again."));
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (!vipList) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">VIP list not found</p>
      </div>
    );
  }

  const statusConfig = getStatusBadgeConfig(vipList.processing_status || "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton showBreadcrumb={true} currentLabel="VIP List Details" />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: color.primary.action }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "1";
            }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: "#DC2626", border: "1px solid #DC2626" }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "1";
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* VIP List Information */}
      <div className={`${tw.rounded} border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm`}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          VIP List Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vipList.description && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {vipList.description}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <div className="mt-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Created By
            </label>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {vipList.created_by || "-"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rows Imported
            </label>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {vipList.rows_imported ?? "-"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rows Failed
            </label>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {vipList.rows_failed ?? "-"}
            </p>
          </div>

          {vipList.processing_time_ms && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Processing Time
              </label>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {(vipList.processing_time_ms / 1000).toFixed(2)}s
              </p>
            </div>
          )}

          {vipList.original_filename && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Original File
              </label>
              <p className="mt-2 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Download className="w-4 h-4" />
                {vipList.original_filename}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Created At
            </label>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <DateFormatter date={vipList.created_at} includeTime />
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Updated At
            </label>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <DateFormatter date={vipList.updated_at} includeTime />
            </p>
          </div>
        </div>

        {vipList.processing_error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Processing Error
            </p>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              {vipList.processing_error}
            </p>
          </div>
        )}
      </div>

      {/* Member Activity */}
      <div className={`${tw.rounded} border border-gray-200 dark:border-gray-700 p-6`}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Member Activity ({auditTrail.length})
        </h2>

        {loadingAudit ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : auditTrail.length > 0 ? (
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={auditTrail.map((entry) => ({
                id: entry.id,
                customer_name: entry.customer_name || "-",
                customer_email: entry.customer_email || "-",
                added_at: entry.added_at,
                added_by: entry.added_by,
                removed_at: entry.removed_at,
                removed_by: entry.removed_by,
                status: entry.status,
                _full: entry,
              }))}
              totalItems={auditTrail.length}
              currentPage={currentPage}
              pageSize={pageSize}
              isLoading={false}
              onPageChange={handlePageChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              getRowId={(row) => `${row.id}`}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              No member activity found
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Delete VIP List"
        description={`Are you sure you want to delete "${vipList?.name}"? This action cannot be undone.`}
        itemName={vipList?.name || ""}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
        isLoading={isDeleting}
      />
      {isEditModalOpen && (
        <CreateVIPListModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={async () => {
            setIsEditModalOpen(false);
            await loadVIPListDetails();
          }}
          initialData={vipList ? { name: vipList.name, description: vipList.description } : undefined}
        />
      )}
      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetToDefaults={resetToDefaults}
        onClose={() => setShowColumnPicker(false)}
      />
    </div>
  );
}
