import { color, tw } from "../../../shared/utils/utils";
import type { ManualReward } from "../types/manualReward";
import DateFormatter from "../../../shared/components/DateFormatter";

interface ManualRewardDetailsExpandedRowProps {
  reward: ManualReward;
  colSpan: number;
}

export default function ManualRewardDetailsExpandedRow({
  reward,
  colSpan,
}: ManualRewardDetailsExpandedRowProps) {
  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return value;
  };

  const getRewardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bundle: "Bundle",
      points: "Points",
      discount: "Discount",
      cashback: "Cashback",
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      applied: "Applied",
      scheduled: "Scheduled",
      pending: "Pending",
      failed: "Failed",
    };
    return labels[status] || status;
  };

  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reward.description && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Description
            </label>
            <div className={`text-sm ${tw.textPrimary} break-words`}>
              {formatValue(reward.description)}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${tw.textMuted}`}>
            Reward Type
          </label>
          <div className={`text-sm ${tw.textPrimary}`}>
            {getRewardTypeLabel(reward.rewardType)}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${tw.textMuted}`}>
            Reward Value
          </label>
          <div className={`text-sm ${tw.textPrimary}`}>
            {formatValue(reward.rewardValue)}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${tw.textMuted}`}>
            Recipients
          </label>
          <div className={`text-sm ${tw.textPrimary}`}>
            {reward.recipientCount.toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${tw.textMuted}`}>
            Applied Count
          </label>
          <div className={`text-sm ${tw.textPrimary}`}>
            {reward.appliedCount?.toLocaleString() || "—"}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${tw.textMuted}`}>
            Status
          </label>
          <div className={`text-sm ${tw.textPrimary}`}>
            {getStatusLabel(reward.status)}
          </div>
        </div>

        {reward.createdAt && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Created
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={reward.createdAt} useUserTimezone />
            </div>
          </div>
        )}

        {reward.updatedAt && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Updated
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={reward.updatedAt} useUserTimezone />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
