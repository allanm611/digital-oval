import { useState } from "react";
import { Calendar, Clock, Send, AlertCircle, Gift } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { ManualRewardData } from "../pages/CreateManualRewardPage";
import { useLanguage } from "../../../contexts/LanguageContext";

interface ApplyRewardStepProps {
  data: ManualRewardData;
  onUpdate: (data: Partial<ManualRewardData>) => void;
  onSubmit: () => void;
  onPrevious: () => void;
}

export default function ApplyRewardStep({
  data,
  onUpdate,
  onSubmit,
  onPrevious,
}: ApplyRewardStepProps) {
  const { t } = useLanguage();
  const [applyType, setApplyType] = useState<"now" | "later">(
    data.applyType || "now"
  );
  const [applyDate, setApplyDate] = useState(data.applyDate || "");
  const [applyTime, setApplyTime] = useState(data.applyTime || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    // Validation
    if (applyType === "later") {
      if (!applyDate) {
        setError(t.manualRewards.errorSelectDate);
        return;
      }
      if (!applyTime) {
        setError(t.manualRewards.errorSelectTime);
        return;
      }

      // Check if scheduled time is in the future
      const scheduledDateTime = new Date(`${applyDate}T${applyTime}`);
      const now = new Date();
      if (scheduledDateTime <= now) {
        setError(t.manualRewards.errorFutureDateTime);
        return;
      }
    }

    setError("");
    setIsSubmitting(true);

    try {
      // Update data
      onUpdate({
        applyType: applyType,
        applyDate: applyDate,
        applyTime: applyTime,
      });

      // Submit
      await onSubmit();
    } catch (err) {
      console.error("Failed to submit:", err);
      setError(t.manualRewards.errorCreateReward);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get minimum time (current time if today is selected)
  const getMinTime = () => {
    if (applyDate === getMinDate()) {
      const now = new Date();
      return now.toTimeString().slice(0, 5);
    }
    return "";
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
    <div
      className={`bg-white ${tw.rounded} shadow-sm border`}
      style={{ borderColor: color.border.default }}
    >
      <div
        className="p-4 sm:p-6 border-b"
        style={{ borderColor: color.border.default }}
      >
        <h2 className={`text-lg sm:text-xl font-semibold ${tw.textPrimary}`}>
          {t.manualRewards.applyTitle}
        </h2>
        <p className={`text-sm ${tw.textSecondary} mt-1`}>
          {t.manualRewards.applySubtitle}
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Apply Type Selection */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-3`}>
            {t.manualRewards.applyQuestion}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Apply Now */}
            <button
              type="button"
              onClick={() => setApplyType("now")}
              disabled={isSubmitting}
              className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 ${tw.rounded} border-2 transition-all text-left`}
              style={{
                borderColor:
                  applyType === "now"
                    ? color.primary.accent
                    : color.border.default,
                backgroundColor:
                  applyType === "now" ? `${color.primary.accent}10` : "white",
                opacity: isSubmitting ? 0.5 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor:
                    applyType === "now"
                      ? color.primary.accent
                      : color.surface.cards,
                }}
              >
                <Send
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{
                    color: applyType === "now" ? "white" : color.text.secondary,
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm sm:text-base font-semibold whitespace-nowrap ${
                    applyType === "now" ? tw.textPrimary : tw.textSecondary
                  }`}
                >
                  {t.manualRewards.applyNowTitle}
                </p>
                <p className={`text-sm ${tw.textMuted} mt-1 break-words`}>
                  {t.manualRewards.applyNowDesc}
                </p>
              </div>
              {applyType === "now" && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color.primary.accent }}
                />
              )}
            </button>

            {/* Schedule for Later */}
            <button
              type="button"
              onClick={() => setApplyType("later")}
              disabled={isSubmitting}
              className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 ${tw.rounded} border-2 transition-all text-left`}
              style={{
                borderColor:
                  applyType === "later"
                    ? color.primary.accent
                    : color.border.default,
                backgroundColor:
                  applyType === "later" ? `${color.primary.accent}10` : "white",
                opacity: isSubmitting ? 0.5 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor:
                    applyType === "later"
                      ? color.primary.accent
                      : color.surface.cards,
                }}
              >
                <Calendar
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{
                    color:
                      applyType === "later" ? "white" : color.text.secondary,
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm sm:text-base font-semibold whitespace-nowrap ${
                    applyType === "later" ? tw.textPrimary : tw.textSecondary
                  }`}
                >
                  {t.manualRewards.scheduleLaterTitle}
                </p>
                <p className={`text-sm ${tw.textMuted} mt-1 break-words`}>
                  {t.manualRewards.scheduleLaterDesc}
                </p>
              </div>
              {applyType === "later" && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color.primary.accent }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Schedule Date & Time (only show if "later" is selected) */}
        {applyType === "later" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                {t.manualRewards.dateLabel}
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                  style={{ color: color.text.muted }}
                />
                <input
                  type="date"
                  value={applyDate}
                  onChange={(e) => setApplyDate(e.target.value)}
                  min={getMinDate()}
                  className={`w-full pl-10 pr-3 py-2 text-sm border ${tw.rounded} focus:outline-none focus:ring-2`}
                  style={{
                    borderColor: color.border.default,
                    color: color.text.primary,
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                {t.manualRewards.timeLabel}
              </label>
              <div className="relative">
                <Clock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                  style={{ color: color.text.muted }}
                />
                <input
                  type="time"
                  value={applyTime}
                  onChange={(e) => setApplyTime(e.target.value)}
                  min={applyDate === getMinDate() ? getMinTime() : ""}
                  className={`w-full pl-10 pr-3 py-2 text-sm border ${tw.rounded} focus:outline-none focus:ring-2`}
                  style={{
                    borderColor: color.border.default,
                    color: color.text.primary,
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div
          className={`p-3 sm:p-4 ${tw.rounded}`}
          style={{ backgroundColor: `${color.primary.accent}10` }}
        >
          <h3
            className="text-sm font-semibold mb-2 sm:mb-3"
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
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className={tw.textSecondary}>
                {t.manualRewards.summarySchedule}
              </span>
              <span className={`font-medium ${tw.textPrimary} break-words`}>
                {applyType === "now"
                  ? t.manualRewards.summaryApplyNow
                  : applyDate && applyTime
                  ? t.manualRewards.summaryScheduled.replace(
                      "{dateTime}",
                      `${new Date(
                        `${applyDate}T${applyTime}`
                      ).toLocaleString()}`
                    )
                  : t.manualRewards.summaryNotSet}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={`p-3 ${tw.rounded} flex items-start space-x-2`}
            style={{
              backgroundColor: `${color.status.danger}10`,
              border: `1px solid ${color.status.danger}30`,
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
            <p className={`text-sm ${tw.textMuted} mt-1 break-words`}>
              {applyType === "now"
                ? t.manualRewards.warningBodyNow
                : t.manualRewards.warningBodyScheduled}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="p-4 sm:p-6 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        style={{ borderColor: color.border.default }}
      >
        <button
          onClick={onPrevious}
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-6 py-2.5 ${tw.rounded} transition-all text-sm font-semibold disabled:opacity-50 whitespace-nowrap`}
          style={{
            backgroundColor: color.surface.cards,
            border: `1px solid ${color.border.default}`,
            color: color.text.primary,
          }}
        >
          {t.manualRewards.previous}
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            (applyType === "later" && (!applyDate || !applyTime))
          }
          className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 text-white ${tw.rounded} transition-all text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
          style={{ backgroundColor: color.primary.action }}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span>{t.manualRewards.applying}</span>
            </>
          ) : (
            <>
              <Gift className="w-4 h-4 flex-shrink-0" />
              <span>{t.manualRewards.applyReward}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
