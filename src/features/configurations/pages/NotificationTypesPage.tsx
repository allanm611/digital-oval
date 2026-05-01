import { useState, useEffect, useCallback } from "react";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination from "../../../shared/components/ui/Pagination";
import { useToast } from "../../../contexts/ToastContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import { notificationTypeService, NotificationRule } from "../../../shared/services/notificationTypeService";
import { useLanguage } from "../../../contexts/LanguageContext";
import NotificationTypeModal from "../components/NotificationTypeModal";

export default function NotificationTypesPage() {
  const { success: showSuccess, error: showError } = useToast();
  const { confirm } = useConfirm();
  const { t } = useLanguage();

  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);

  const loadNotificationRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationTypeService.getAll();
      setNotificationRules(data || []);
    } catch (error) {
      showError("Failed to load notification types");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadNotificationRules();
  }, [loadNotificationRules]);

  const handleDelete = async (rule: NotificationRule) => {
    const confirmed = await confirm({
      title: "Delete Notification Type",
      message: `Are you sure you want to delete "${rule.name}"? This may affect active notifications.`,
      type: "danger",
      confirmText: t.genericConfig.delete,
      cancelText: t.genericConfig.cancel,
    });

    if (!confirmed) return;

    setDeleting(rule.id);
    try {
      await notificationTypeService.delete(rule.id);
      setNotificationRules((prev) => prev.filter((r) => r.id !== rule.id));
      showSuccess("Notification type deleted successfully");
    } catch (error) {
      showError("Failed to delete notification type", error instanceof Error ? error.message : "");
    } finally {
      setDeleting(null);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (rule: NotificationRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const handleModalSubmit = async () => {
    await loadNotificationRules();
    handleModalClose();
  };

  const filteredRules = notificationRules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rule.description && rule.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      rule.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.action_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRules = filteredRules.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      <BackButton
        fallbackTo="/dashboard/configuration"
        showBreadcrumb={true}
        currentLabel="Notification Types"
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            Notification Types
          </h1>
          <p className={`text-sm ${tw.textSecondary} mt-1`}>
            Manage notification rules and message templates for system events
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create
        </button>
      </div>

      <div className="my-5">
        <SearchInput
          placeholder="Search notification types by name, table, action, or description..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div
        className={`${tw.rounded} border overflow-hidden`}
        style={{ borderColor: color.border.default }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner variant="modern" size="lg" color="primary" className="mr-3" />
            <span className={`${tw.textSecondary}`}>Loading notification types...</span>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-12">
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? "No notification types found" : "No notification types yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm ? "Try adjusting your search terms" : "Create your first notification type"}
            </p>
            {!searchTerm && (
              <button
                onClick={handleOpenCreateModal}
                className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 mx-auto`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Notification Type
              </button>
            )}
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
                    Table
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Action Type
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
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRules.map((rule) => (
                  <tr key={rule.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className={`text-sm ${tw.textPrimary}`}>
                        {rule.name}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary} font-mono`}>
                        {rule.table_name}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {rule.action_type}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary} max-w-md`}>
                        {rule.description || "-"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-center"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(rule)}
                          className={`p-2 ${tw.rounded} transition-colors`}
                          style={{
                            color: color.primary.action,
                            backgroundColor: "transparent",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${color.primary.action}10`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule)}
                          disabled={deleting === rule.id}
                          className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          title="Delete"
                        >
                          {deleting === rule.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && filteredRules.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredRules.length}
          onPageChange={setCurrentPage}
        />
      )}

      <NotificationTypeModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        editingRule={editingRule}
      />
    </div>
  );
}
