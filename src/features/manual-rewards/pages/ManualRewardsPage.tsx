import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gift,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { color, tw, components } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useLanguage } from "../../../contexts/LanguageContext";
import DateFormatter from "../../../shared/components/DateFormatter";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import BackButton from "../../../shared/components/ui/BackButton";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { dummyManualRewards } from "../data/dummyManualRewards";
import type { ManualReward } from "../types/manualReward";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

export default function ManualRewardsPage() {
  const navigate = useNavigate();
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(getInitialPageSize());

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
      showError("Failed to delete reward", extractBackendError(error, "Failed to delete reward. Please try again."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setRewardToDelete(null);
  };


  const handleViewDetails = (rewardId: number) => {
    navigate(`/dashboard/manual-rewards/${rewardId}`);
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
        <BackButton
         
          showBreadcrumb={true}
          currentLabel="Manual Rewards"
        />
        <div className="flex items-center gap-3">
          <FeatureActionButton
            featureId="manual-rewards"
            action="create"
            navigationState={{
              returnTo: {
                pathname: "/dashboard/manual-rewards",
              },
            }}
          />
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
        <div className="flex-1">
          <SearchInput
            placeholder="Search rewards by name..."
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
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
              <FeatureActionButton featureId="manual-rewards" action="create" />
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
                          onClick={() => handleViewDetails(reward.id)}
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
                        <button
                          onClick={() => handleViewDetails(reward.id)}
                          className={`p-1 ${tw.rounded} text-gray-600 hover:text-gray-800 transition-colors cursor-pointer`}
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <FeatureActionButton
                          featureId="manual-rewards"
                          action="edit"
                          itemId={reward.id}
                          navigationState={{
                            returnTo: {
                              pathname: "/dashboard/manual-rewards",
                            },
                          }}
                        />
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
          onPageSizeChange={setPageSize}
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

    </div>
  );
}
