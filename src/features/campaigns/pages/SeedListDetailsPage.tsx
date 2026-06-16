import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trash2,
  Edit,
  Download,
} from "lucide-react";
import { seedListService } from "../../../shared/services/seedListService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { useLanguage } from "../../../contexts/LanguageContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import BackButton from "../../../shared/components/ui/BackButton";
import DateFormatter from "../../../shared/components/DateFormatter";
import { getStatusBadgeConfig } from "../../../shared/utils/statusColors";
import CreateTestListModal from "../components/CreateTestListModal";

interface SeedListDetail {
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
  seed_list_id: number;
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

export default function SeedListDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const [seedList, setSeedList] = useState<SeedListDetail | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadSeedListDetails();
    }
  }, [id]);

  useEffect(() => {
    if (seedList && !loadingAudit) {
      loadAuditTrail();
    }
  }, [seedList?.id]);

  const loadSeedListDetails = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const seedListId = parseInt(id);
      const response = await seedListService.getById(seedListId);
      setSeedList(response as SeedListDetail);
    } catch (err) {
      showError("Error loading seed list", extractBackendError(err, "Error loading seed list. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditTrail = async () => {
    if (!seedList) return;

    try {
      setLoadingAudit(true);
      const auditData = await seedListService.getAuditTrail(seedList.id);
      setAuditTrail(auditData || []);
    } catch (err) {
      showError("Error loading audit trail", extractBackendError(err, "Error loading audit trail. Please try again."));
    } finally {
      setLoadingAudit(false);
    }
  };

  async function handleDelete() {
    if (!seedList) return;

    try {
      setIsDeleting(true);
      await seedListService.delete(seedList.id);
      showToast("Seed list deleted successfully");
      navigate("/dashboard/seed-list-management");
    } catch (err) {
      showError("Error deleting seed list", extractBackendError(err, "Failed to delete seed list. Please try again."));
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

  if (!seedList) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Seed list not found</p>
      </div>
    );
  }

  const statusConfig = getStatusBadgeConfig(seedList.processing_status || "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton showBreadcrumb={true} currentLabel="Seed List Details" />
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
            className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit text-red-600 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: "#FEE2E2", border: "1px solid #FECACA" }}
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

      {/* Seed List Information */}
      <div className={`${tw.rounded} border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm`}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Seed List Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {seedList.description && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {seedList.description}
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
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {seedList.created_by || "-"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rows Imported
            </label>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {seedList.rows_imported ?? "-"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rows Failed
            </label>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {seedList.rows_failed ?? "-"}
            </p>
          </div>

          {seedList.processing_time_ms && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Processing Time
              </label>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {(seedList.processing_time_ms / 1000).toFixed(2)}s
              </p>
            </div>
          )}

          {seedList.original_filename && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Original File
              </label>
              <p className="mt-2 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Download className="w-4 h-4" />
                {seedList.original_filename}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Created At
            </label>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              <DateFormatter date={seedList.created_at} includeTime />
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Updated At
            </label>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              <DateFormatter date={seedList.updated_at} includeTime />
            </p>
          </div>
        </div>

        {seedList.processing_error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Processing Error
            </p>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              {seedList.processing_error}
            </p>
          </div>
        )}
      </div>

      {/* Member Activity */}
      <div className={`${tw.rounded} border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm`}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Member Activity ({auditTrail.length})
        </h2>

        {loadingAudit ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : auditTrail.length > 0 ? (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[1200px]"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Customer Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Email
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Action
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Added At
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Removed At
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.map((entry) => (
                  <tr key={entry.id} className="transition-colors">
                    <td
                      className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {entry.customer_name}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {entry.customer_email || "-"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm font-medium"
                      style={{ backgroundColor: color.surface.tablebodybg, color: color.primary.accent }}
                    >
                      {entry.removed_at ? "Removed" : "Added"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <DateFormatter date={entry.added_at} includeTime />
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {entry.removed_at ? <DateFormatter date={entry.removed_at} includeTime /> : "-"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm capitalize"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        entry.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        title="Delete Seed List"
        message={`Are you sure you want to delete "${seedList?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={isDeleting}
      />
      {isEditModalOpen && (
        <CreateTestListModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={async () => {
            setIsEditModalOpen(false);
            await loadSeedListDetails();
          }}
          initialData={seedList ? { name: seedList.name, description: seedList.description } : undefined}
        />
      )}
    </div>
  );
}
