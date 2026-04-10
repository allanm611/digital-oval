import { useState, useEffect } from "react";
import { Edit, Power, PowerOff, Search } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { notificationService } from "../../notifications/services/notificationService";
import { NotificationSubscription } from "../../notifications/types/notification";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";

interface EditingSubscription {
  id: number;
  rule_name: string;
  rule_template: string;
}

export default function NotificationTypesPage() {
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSubscription, setEditingSubscription] = useState<EditingSubscription | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Load subscriptions on mount
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setIsLoading(true);
        const response = await notificationService.getNotificationSubscriptions();
        if (response.success && response.data) {
          setSubscriptions(response.data);
        }
      } catch (error) {
        console.error("Failed to load notification types:", error);
        showError("Failed to load notification types");
      } finally {
        setIsLoading(false);
      }
    };
    loadSubscriptions();
  }, [showError]);

  // Filter subscriptions by search term
  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.rule_template.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle edit button click
  const handleEditClick = (subscription: NotificationSubscription) => {
    setEditingSubscription({
      id: subscription.id,
      rule_name: subscription.rule_name,
      rule_template: subscription.rule_template,
    });
  };

  // Save edited subscription
  const handleSaveEdit = async () => {
    if (!editingSubscription) return;
    try {
      setIsSaving(true);
      const updatedSubscriptions = subscriptions.map((sub) => ({
        notification_rule_id: sub.notification_rule_id,
        is_enabled: sub.is_enabled,
      }));
      await notificationService.updateNotificationSubscriptions(updatedSubscriptions);
      // Update local state
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === editingSubscription.id
            ? { ...sub, rule_name: editingSubscription.rule_name, rule_template: editingSubscription.rule_template }
            : sub
        )
      );
      showToast("Notification type updated successfully");
      setEditingSubscription(null);
    } catch (error) {
      console.error("Failed to update notification type:", error);
      showError("Failed to update notification type");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (subscription: NotificationSubscription) => {
    try {
      setTogglingId(subscription.id);
      const updatedSubscriptions = subscriptions.map((sub) => ({
        notification_rule_id: sub.notification_rule_id,
        is_enabled: sub.id === subscription.id ? !sub.is_enabled : sub.is_enabled,
      }));
      await notificationService.updateNotificationSubscriptions(updatedSubscriptions);
      // Update local state
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === subscription.id ? { ...sub, is_enabled: !sub.is_enabled } : sub
        )
      );
      showToast(
        subscription.is_enabled ? "Notification type deactivated" : "Notification type activated"
      );
    } catch (error) {
      console.error("Failed to toggle notification type status:", error);
      showError("Failed to update notification type status");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BackButton
        fallbackTo="/dashboard/configuration"
        showBreadcrumb={true}
        currentLabel="Notification Types"
      />

      {/* Description */}
      <div className="flex items-start justify-between gap-4">
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage notification types. Update descriptions or deactivate as needed.
        </p>
      </div>

      {/* Search */}
      <div className="my-5">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name or template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
      </div>

      {/* Table */}
      <div className={`${tw.rounded} border border-gray-200 overflow-hidden`}>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <LoadingSpinner size="lg" variant="default" />
            </div>
            <p className={`${tw.textSecondary}`}>Loading notification types...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="text-center py-12">
            <p className={`${tw.textSecondary} mb-6`}>
              {searchTerm ? "No notification types found. Try adjusting your search terms." : "No notification types available."}
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
                    Notification Type
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Template
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
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
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
                {filteredSubscriptions.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={{ backgroundColor: "white" }}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {subscription.rule_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {subscription.rule_template}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          subscription.is_enabled
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {subscription.is_enabled ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2 flex items-center justify-end">
                      <button
                        onClick={() => handleEditClick(subscription)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(subscription)}
                        disabled={togglingId === subscription.id}
                        className={`p-2 rounded transition-colors ${
                          subscription.is_enabled
                            ? "text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                            : "text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50"
                        }`}
                        title={subscription.is_enabled ? "Deactivate" : "Activate"}
                      >
                        {subscription.is_enabled ? (
                          <Power className="w-4 h-4" />
                        ) : (
                          <PowerOff className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Notification Type</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={editingSubscription.rule_name}
                  onChange={(e) =>
                    setEditingSubscription({
                      ...editingSubscription,
                      rule_name: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Template
                </label>
                <textarea
                  value={editingSubscription.rule_template}
                  onChange={(e) =>
                    setEditingSubscription({
                      ...editingSubscription,
                      rule_template: e.target.value,
                    })
                  }
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingSubscription(null)}
                className={`flex-1 px-4 py-2 border border-gray-300 ${tw.rounded} text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                style={{ backgroundColor: color.primary.accent }}
                className="flex-1 px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {isSaving ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
