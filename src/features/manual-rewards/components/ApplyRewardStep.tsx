import { useState } from "react";
import SchedulingComponent from "../../../shared/components/SchedulingComponent";
import type { SchedulingData } from "../../../shared/types/scheduling";
import { AlertCircle } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { ManualRewardData } from "../pages/CreateManualRewardPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import { getSettingsTimezone } from "../../../shared/utils/settingsHelper";

interface ApplyRewardStepProps {
  data: ManualRewardData;
  onUpdate: (data: Partial<ManualRewardData>) => void;
  onPrevious: () => void;
}

export default function ApplyRewardStep({
  data,
  onUpdate,
  onPrevious: _onPrevious,
}: ApplyRewardStepProps) {
  const { t } = useLanguage();
  const [error, setError] = useState("");

  // Convert manual reward data to generic scheduling format
  const schedulingData: SchedulingData = {
    type: data.applyType === "now" ? "immediate" : "scheduled",
    start_date: data.applyDate
      ? `${data.applyDate}T${data.applyTime || "00:00"}`
      : undefined,
    time_zone: getSettingsTimezone(),
  };

  const handleSchedulingChange = (scheduling: SchedulingData) => {
    // Convert back from generic format to manual reward format
    if (scheduling.start_date) {
      const [date, time] = scheduling.start_date.split("T");
      onUpdate({
        applyType: scheduling.type === "immediate" ? "now" : "later",
        applyDate: date,
        applyTime: time || "00:00",
      });
    } else {
      onUpdate({
        applyType: "now",
        applyDate: undefined,
        applyTime: undefined,
      });
    }
  };

  const getRewardTypeLabel = () => {
    switch (data.rewardType) {
      case "bundle":
        return t.manualRewards.rewardTypeBundle;
      case "points":
        return t.manualRewards.rewardTypePoints;
      case "discount":
        return t.manualRewards.rewardTypeDiscount;
      case "cashback":
        return t.manualRewards.rewardTypeCashback;
      default:
        return "";
    }
  };

  const getRewardValueDisplay = () => {
    if (!data.rewardValue) return "";
    if (data.rewardType === "discount") {
      return `${data.rewardValue}%`;
    }
    return data.rewardValue;
  };

  return (
    <div>
      {/* Scheduling Component */}
      <SchedulingComponent
        scheduling={schedulingData}
        onSchedulingChange={handleSchedulingChange}
        title="Apply Reward Schedule"
        subtitle="Set when this reward will be applied to your audience"
        showPreviewButton={false}
      />

      {/* Summary Section */}
      <div
        className={`bg-white ${tw.rounded} shadow-sm border p-4 sm:p-6 mt-6`}
        style={{ borderColor: color.border.default }}
      >
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: color.primary.accent }}
        >
          {t.manualRewards.rewardSummary}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span className={tw.textSecondary}>
              {t.manualRewards.summaryAudience}
            </span>
            <span className={`font-medium ${tw.textPrimary} break-words`}>
              {data.audienceName || t.manualRewards.summaryNotSet}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span className={tw.textSecondary}>
              {t.manualRewards.summaryRecipients}
            </span>
            <span className={`font-medium ${tw.textPrimary}`}>
              {data.rowCount || 0}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span className={tw.textSecondary}>
              {t.manualRewards.summaryReward}
            </span>
            <span className={`font-medium ${tw.textPrimary}`}>
              {getRewardTypeLabel()}: {getRewardValueDisplay()}
            </span>
          </div>
          {data.channel && (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className={tw.textSecondary}>
                Communication Channel
              </span>
              <span className={`font-medium ${tw.textPrimary}`}>
                {data.channel}
              </span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
            <span className={tw.textSecondary}>
              {t.manualRewards.summarySchedule}
            </span>
            <span className={`font-medium ${tw.textPrimary} break-words`}>
              {data.applyType === "now"
                ? t.manualRewards.summaryApplyNow
                : data.applyDate && data.applyTime
                  ? t.manualRewards.summaryScheduled.replace(
                      "{dateTime}",
                      `${new Date(
                        `${data.applyDate}T${data.applyTime}`,
                      ).toLocaleString()}`,
                    )
                  : t.manualRewards.summaryNotSet}
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className={`bg-white ${tw.rounded} shadow-sm border p-3 sm:p-4 mt-4 flex items-start space-x-2`}
          style={{
            borderColor: color.status.danger,
            backgroundColor: `${color.status.danger}10`,
          }}
        >
          <AlertCircle
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            style={{ color: color.status.danger }}
          />
          <p className="text-sm" style={{ color: color.status.danger }}>
            {error}
          </p>
        </div>
      )}

      {/* Warning Message */}
      <div
        className={`bg-white ${tw.rounded} shadow-sm border p-3 sm:p-4 mt-4 flex items-start space-x-2`}
        style={{
          borderColor: color.status.warning,
          backgroundColor: `${color.status.warning}10`,
        }}
      >
        <AlertCircle
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          style={{ color: color.status.warning }}
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium"
            style={{ color: color.status.warning }}
          >
            {t.manualRewards.warningTitle}
          </p>
          <p className={`text-sm ${tw.textMuted} mt-1 break-words`}>
            {data.applyType === "now"
              ? t.manualRewards.warningBodyNow
              : t.manualRewards.warningBodyScheduled}
          </p>
        </div>
      </div>
    </div>
  );
}
