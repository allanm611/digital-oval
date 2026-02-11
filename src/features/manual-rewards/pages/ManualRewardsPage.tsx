import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gift,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Users,
  ArrowLeft,
} from "lucide-react";
import { color, tw, components } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useLanguage } from "../../../contexts/LanguageContext";
import DateFormatter from "../../../shared/components/DateFormatter";
import RegularModal from "../../../shared/components/ui/RegularModal";
import CreateButton from "../../../shared/components/ui/CreateButton";
import Pagination from "../../../shared/components/ui/Pagination";
import { PermissionGate } from "../../auth/components/PermissionGate";

// Dummy data for manual rewards
interface ManualReward {
  id: number;
  name: string;
  rewardType: "bundle" | "points" | "discount" | "cashback";
  rewardValue: string;
  recipientCount: number;
  status: "pending" | "applied" | "scheduled" | "failed";
  appliedCount: number;
  failedCount: number;
  scheduledAt?: string;
  createdAt: string;
  createdBy: string;
}

const dummyManualRewards: ManualReward[] = [
  {
    id: 1,
    name: "VIP Customer Bonus Q4",
    rewardType: "bundle",
    rewardValue: "500 MB",
    recipientCount: 125,
    status: "applied",
    appliedCount: 123,
    failedCount: 2,
    createdAt: "2025-12-01T10:30:00Z",
    createdBy: "Admin User",
  },
  {
    id: 2,
    name: "New Year Points Reward",
    rewardType: "points",
    rewardValue: "1000 Points",
    recipientCount: 250,
    status: "scheduled",
    appliedCount: 0,
    failedCount: 0,
    scheduledAt: "2025-01-01T00:00:00Z",
    createdAt: "2025-12-08T14:15:00Z",
    createdBy: "Marketing Team",
  },
  {
    id: 3,
    name: "Holiday Discount Special",
    rewardType: "discount",
    rewardValue: "25%",
    recipientCount: 350,
    status: "applied",
    appliedCount: 345,
    failedCount: 5,
    createdAt: "2025-11-25T09:00:00Z",
    createdBy: "Sales Manager",
  },
  {
    id: 4,
    name: "Loyalty Cashback Reward",
    rewardType: "cashback",
    rewardValue: "KES 100",
    recipientCount: 80,
    status: "pending",
    appliedCount: 0,
    failedCount: 0,
    createdAt: "2025-12-09T08:45:00Z",
    createdBy: "Admin User",
  },
  {
    id: 5,
    name: "Weekend Data Bonus",
    rewardType: "bundle",
    rewardValue: "1 GB",
    recipientCount: 200,
    status: "failed",
    appliedCount: 150,
    failedCount: 50,
    createdAt: "2025-12-05T16:20:00Z",
    createdBy: "Support Team",
  },
];

export default function ManualRewardsPage() {
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState<ManualReward | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [rewardToEdit, setRewardToEdit] = useState<ManualReward | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    rewardType: "bundle" as ManualReward["rewardType"],
    rewardValue: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Dummy stats (matching actual dummy data: 5 rewards, 1 scheduled)
  // Recipients: 125 + 250 + 350 + 80 + 200 = 1005
  // Applied: 123 + 345 + 150 = 618
  const stats = {
    totalRewards: 5,
    totalRecipients: 1005,
    appliedCount: 618,
    scheduledCount: 1,
  };

  const handleDelete = (reward: ManualReward) => {
    setRewardToDelete(reward);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!rewardToDelete) return;

    setIsDeleting(true);
    try {
      // TODO: Implement actual delete API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast(`Reward "${rewardToDelete.name}" deleted successfully!`);
      setShowDeleteModal(false);
      setRewardToDelete(null);
    } catch (err) {
      console.error("Failed to delete reward:", err);
      showError("Failed to delete reward", "Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setRewardToDelete(null);
  };

  const handleEdit = (reward: ManualReward) => {
    setRewardToEdit(reward);
    setEditFormData({
      name: reward.name,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue.replace(/[^0-9.]/g, ""), // Extract numeric value
      description: "",
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setRewardToEdit(null);
  };

  const handleSaveEdit = async () => {
    if (!rewardToEdit) return;

    setIsSaving(true);
    try {
      // TODO: Implement actual update API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast(`Reward "${editFormData.name}" updated successfully!`);
      setShowEditModal(false);
      setRewardToEdit(null);
    } catch (err) {
      console.error("Failed to update reward:", err);
      showError("Failed to update reward", "Please try again later.");
    } finally {
      setIsSaving(false);
    }
  };

  const getRewardTypeLabel = (type: ManualReward["rewardType"]) => {
    switch (type) {
      case "bundle":
        return t.manualRewards.rewardTypeBundle;
      case "points":
        return t.manualRewards.rewardTypePoints;
      case "discount":
        return t.manualRewards.rewardTypeDiscount;
      case "cashback":
        return t.manualRewards.rewardTypeCashback;
      default:
        return type;
    }
  };

  const getStatusLabel = (status: ManualReward["status"]) => {
    const labels = {
      applied: "Applied",
      scheduled: "Scheduled",
      pending: "Pending",
      failed: "Failed",
    };
    return labels[status];
  };

  // Filter rewards based on search and filters
  const filteredRewards = dummyManualRewards.filter((reward) => {
    const matchesSearch =
      !searchTerm ||
      reward.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || reward.status === selectedStatus;
    const matchesType = !selectedType || reward.rewardType === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Reset pagination when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedType]);

  // Paginate filtered rewards
  const paginatedRewards = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredRewards.slice(startIndex, endIndex);
  }, [filteredRewards, currentPage, pageSize]);

  const rewardStatsCards = [
    {
      name: t.manualRewards.title.replace("Create ", "Total "),
      value: stats.totalRewards.toLocaleString(),
      icon: Gift,
      color: color.tertiary.tag1,
    },
    {
      name: t.manualRewards.summaryRecipients,
      value: stats.totalRecipients.toLocaleString(),
      icon: Users,
      color: color.tertiary.tag4,
    },
    {
      name: "Applied Successfully",
      value: stats.appliedCount.toLocaleString(),
      icon: CheckCircle,
      color: color.tertiary.tag4,
    },
    {
      name: "Scheduled",
      value: stats.scheduledCount.toLocaleString(),
      icon: Clock,
      color: color.tertiary.tag3,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
              Manual Rewards
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              Apply rewards directly to customers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PermissionGate permission="manual-rewards.create">
            <CreateButton route="/dashboard/manual-rewards/create" />
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {rewardStatsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="h-5 w-5"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${tw.textMuted}`}
          />
          <input
            type="text"
            placeholder="Search rewards by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 text-sm ${components.input.default}`}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <HeadlessSelect
            options={[
              { value: "", label: "All Status" },
              { value: "applied", label: "Applied" },
              { value: "scheduled", label: "Scheduled" },
              { value: "pending", label: "Pending" },
              { value: "failed", label: "Failed" },
            ]}
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value as string)}
            placeholder="Select status"
            className="w-full sm:min-w-[180px]"
          />
          <HeadlessSelect
            options={[
              { value: "", label: "All Types" },
              { value: "bundle", label: t.manualRewards.rewardTypeBundle },
              { value: "points", label: t.manualRewards.rewardTypePoints },
              { value: "discount", label: t.manualRewards.rewardTypeDiscount },
              { value: "cashback", label: t.manualRewards.rewardTypeCashback },
            ]}
            value={selectedType}
            onChange={(value) => setSelectedType(value as string)}
            placeholder="Select type"
            className="w-full sm:min-w-[180px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className={` ${tw.rounded} border overflow-hidden`}>
        {filteredRewards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Gift
              className="w-12 h-12 mb-4"
              style={{ color: color.text.muted }}
            />
            <p className={`${tw.textSecondary} text-center`}>
              No manual rewards found
            </p>
            <div className="mt-4">
              <PermissionGate permission="manual-rewards.create">
                <CreateButton route="/dashboard/manual-rewards/create" />
              </PermissionGate>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ backgroundColor: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Reward
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Type
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Value
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Recipients
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Created
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRewards.map((reward) => (
                  <tr key={reward.id} className="transition-colors">
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => handleEdit(reward)}
                          className={`font-semibold text-sm sm:text-base ${tw.textPrimary} truncate`}
                          title={reward.name}
                        >
                          {reward.name}
                        </button>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {getRewardTypeLabel(reward.rewardType)}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {reward.rewardValue}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {reward.recipientCount.toLocaleString()}
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="inline-flex px-2 py-1 text-sm font-medium rounded text-black">
                        {getStatusLabel(reward.status)}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <DateFormatter date={reward.createdAt} />
                    </td>
                    <td
                      className="px-6 py-4 text-sm font-medium"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <PermissionGate permission="manual-rewards.update">
                          <button
                            onClick={() => handleEdit(reward)}
                            className={`p-1 ${tw.rounded} text-gray-600 hover:text-gray-800 transition-colors cursor-pointer`}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                        <PermissionGate permission="manual-rewards.delete">
                          <button
                            onClick={() => handleDelete(reward)}
                            className={`p-1 ${tw.rounded} text-red-600 hover:text-red-800 transition-colors cursor-pointer`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginatedRewards.length > 0 && filteredRewards.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredRewards.length}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Reward"
        description="Are you sure you want to delete this manual reward? This action cannot be undone."
        itemName={rewardToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Edit Reward Modal */}
      <RegularModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Edit Manual Reward"
        size="lg"
      >
        <div className="space-y-6">
          {/* Reward Name */}
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
            >
              {t.manualRewards.listNameLabel}
            </label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) =>
                setEditFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none focus:ring-2`}
              style={{
                borderColor: color.border.default,
                color: color.text.primary,
              }}
              placeholder={t.manualRewards.listNamePlaceholder}
            />
          </div>

          {/* Reward Type */}
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
            >
              {t.manualRewards.rewardTypeLabel}
            </label>
            <HeadlessSelect
              options={[
                { value: "bundle", label: t.manualRewards.rewardTypeBundle },
                { value: "points", label: t.manualRewards.rewardTypePoints },
                {
                  value: "discount",
                  label: t.manualRewards.rewardTypeDiscount,
                },
                {
                  value: "cashback",
                  label: t.manualRewards.rewardTypeCashback,
                },
              ]}
              value={editFormData.rewardType}
              onChange={(value) =>
                setEditFormData((prev) => ({
                  ...prev,
                  rewardType: value as ManualReward["rewardType"],
                }))
              }
              placeholder="Select reward type"
            />
          </div>

          {/* Reward Value */}
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
            >
              {t.manualRewards.rewardValueLabel}
            </label>
            <input
              type="text"
              value={editFormData.rewardValue}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  rewardValue: e.target.value,
                }))
              }
              className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none focus:ring-2`}
              style={{
                borderColor: color.border.default,
                color: color.text.primary,
              }}
              placeholder={
                editFormData.rewardType === "bundle"
                  ? t.manualRewards.rewardValuePlaceholderBundle
                  : editFormData.rewardType === "points"
                    ? t.manualRewards.rewardValuePlaceholderPoints
                    : editFormData.rewardType === "discount"
                      ? t.manualRewards.rewardValuePlaceholderDiscount
                      : t.manualRewards.rewardValuePlaceholderCashback
              }
            />
          </div>

          {/* Description */}
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
            >
              {t.manualRewards.descriptionLabel}{" "}
              <span className={tw.textMuted}>({t.manualRewards.optional})</span>
            </label>
            <textarea
              value={editFormData.description}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none focus:ring-2`}
              style={{
                borderColor: color.border.default,
                color: color.text.primary,
              }}
              placeholder={t.manualRewards.descriptionPlaceholder}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div
            className="flex justify-end gap-3 pt-4 border-t"
            style={{ borderColor: color.border.default }}
          >
            <button
              onClick={handleCloseEditModal}
              disabled={isSaving}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} border transition-colors`}
              style={{
                borderColor: color.border.default,
                color: color.text.primary,
              }}
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={
                isSaving ||
                !editFormData.name.trim() ||
                !editFormData.rewardValue.trim()
              }
              className={`px-4 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors disabled:opacity-50`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isSaving ? t.common.loading : t.common.save}
            </button>
          </div>
        </div>
      </RegularModal>
    </div>
  );
}
