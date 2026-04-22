import { AlertCircle, Users, Gift, Calendar, FlaskConical, Mail, MessageSquare, Phone, Bell } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { ManualRewardData } from "../pages/CreateManualRewardPage";
import { useLanguage } from "../../../contexts/LanguageContext";

interface PreviewRewardStepProps {
  data: ManualRewardData;
  onPrevious: () => void;
}

export default function PreviewRewardStep({
  data,
  onPrevious: _onPrevious,
}: PreviewRewardStepProps) {
  const { t } = useLanguage();

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

  const getRecipientCount = (): number => {
    // If quicklist is selected, use rowCount from quicklist
    if (data.inputMethod === "file" && data.quicklistId && data.rowCount) {
      return data.rowCount;
    }

    // If manual input is selected, count the lines in audienceFileText
    if (data.inputMethod === "manual" && data.audienceFileText) {
      const recipientLines = data.audienceFileText
        .split("\n")
        .filter((line) => line.trim());
      return recipientLines.length;
    }

    // Fallback to rowCount if available
    return data.rowCount || 0;
  };

  const getScheduleSummary = () => {
    if (data.applyType === "now") {
      return t.manualRewards.summaryApplyNow;
    }

    if (data.applyDate && data.applyTime) {
      return t.manualRewards.summaryScheduled.replace(
        "{dateTime}",
        new Date(`${data.applyDate}T${data.applyTime}`).toLocaleString(),
      );
    }

    return t.manualRewards.summaryNotSet;
  };

  const getChannelIcon = () => {
    const iconMap: Record<string, any> = {
      SMS: MessageSquare,
      EMAIL: Mail,
      WHATSAPP: Phone,
      PUSH: Bell,
    };
    return iconMap[data.channel || "SMS"] || MessageSquare;
  };

  return (
    <div
      className={`bg-white ${tw.rounded} shadow-sm border`}
      style={{ borderColor: color.border.default }}
    >
      <div
        className="p-4 sm:p-6 border-b"
        style={{ borderColor: color.border.default }}
      >
        <h2 className={`text-lg sm:text-xl font-semibold ${tw.textPrimary}`}>
          {t.manualRewards.previewTitle}
        </h2>
        <p className={`text-sm ${tw.textSecondary} mt-1`}>
          {t.manualRewards.previewSubtitle}
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Summary Card */}
        <div
          className={`p-4 ${tw.rounded} border`}
          style={{
            backgroundColor: `${color.primary.accent}05`,
            borderColor: color.border.default,
          }}
        >
          <h3
            className="text-sm font-semibold mb-4"
            style={{ color: color.primary.accent }}
          >
            {t.manualRewards.rewardSummary}
          </h3>
          <div className="space-y-3">
            {/* Audience */}
            <div className="flex items-start gap-3">
              <Users
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: color.text.muted }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${tw.textSecondary}`}>
                  {t.manualRewards.summaryAudience}
                </p>
                <p className={`text-sm font-medium ${tw.textPrimary} mt-0.5`}>
                  {data.audienceName || t.manualRewards.summaryNotSet}
                </p>
                <p className={`text-xs ${tw.textMuted} mt-1`}>
                  {getRecipientCount().toLocaleString()}{" "}
                  {t.manualRewards.recipients}
                </p>
              </div>
            </div>

            {/* Reward */}
            <div className="flex items-start gap-3">
              <Gift
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: color.text.muted }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${tw.textSecondary}`}>
                  {t.manualRewards.summaryReward}
                </p>
                <p className={`text-sm font-medium ${tw.textPrimary} mt-0.5`}>
                  {getRewardTypeLabel()}: {getRewardValueDisplay()}
                </p>
                {data.bundleTrack && (
                  <p className={`text-xs ${tw.textMuted} mt-1`}>
                    {t.manualRewards.bundleTrack}: {data.bundleTrack}
                  </p>
                )}
                {data.description && (
                  <p className={`text-xs ${tw.textMuted} mt-1`}>
                    {data.description}
                  </p>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="flex items-start gap-3">
              <Calendar
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: color.text.muted }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${tw.textSecondary}`}>
                  {t.manualRewards.summarySchedule}
                </p>
                <p className={`text-sm font-medium ${tw.textPrimary} mt-0.5`}>
                  {getScheduleSummary()}
                </p>
              </div>
            </div>

            {/* Communication Channel */}
            {data.channel && (
              <div className="flex items-start gap-3">
                {(() => {
                  const ChannelIcon = getChannelIcon();
                  return <ChannelIcon
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: color.text.muted }}
                  />;
                })()}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${tw.textSecondary}`}>
                    Communication Channel
                  </p>
                  <p className={`text-sm font-medium ${tw.textPrimary} mt-0.5`}>
                    {data.channel}
                  </p>
                  {data.smsRoute && (
                    <p className={`text-xs ${tw.textMuted} mt-1`}>
                      SMS Route: {data.smsRoute}
                    </p>
                  )}
                  {data.rewardTitle && (
                    <p className={`text-xs ${tw.textMuted} mt-1`}>
                      Subject: {data.rewardTitle}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Communication Policy / Seed List */}
            <div className="flex items-start gap-3">
              <FlaskConical
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: color.text.muted }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${tw.textSecondary}`}>
                  {t.manualRewards.communicationPolicy || "Communication Policy"}
                </p>
                <p className={`text-sm font-medium ${tw.textPrimary} mt-0.5`}>
                  {data.selectedCommunicationPolicyId
                    ? `Policy ${data.selectedCommunicationPolicyId}`
                    : "Not selected"}
                </p>
                {data.rewardValidation?.completed && (
                  <p className={`text-xs ${tw.textMuted} mt-1`}>
                    Test: {data.rewardValidation.passed} passed,{" "}
                    {data.rewardValidation.failed} failed
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div
          className={`p-3 ${tw.rounded} flex items-start space-x-2`}
          style={{
            backgroundColor: `${color.status.warning}10`,
            border: `1px solid ${color.status.warning}30`,
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
            <p className={`text-sm ${tw.textMuted} mt-1`}>
              {t.manualRewards.warningBody}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
