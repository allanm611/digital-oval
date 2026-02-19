import { useState } from "react";
import { Eye, AlertCircle, CheckCircle, Users, Gift } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { ManualRewardData } from "../pages/CreateManualRewardPage";
import { useLanguage } from "../../../contexts/LanguageContext";

interface PreviewRewardStepProps {
  data: ManualRewardData;
  onNext: () => void;
  onPrevious: () => void;
}

export default function PreviewRewardStep({
  data,
  onNext,
  onPrevious,
}: PreviewRewardStepProps) {
  const { t } = useLanguage();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResult(null);

    // Simulate validation
    setTimeout(() => {
      const isValid = true; // TODO: Implement actual validation
      setValidationResult({
        valid: isValid,
        message: isValid
          ? t.manualRewards.validationSuccess
          : t.manualRewards.validationFailed,
      });
      setIsValidating(false);
    }, 1500);
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
                  {getRecipientCount().toLocaleString()} {t.manualRewards.recipients}
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
          </div>
        </div>

        {/* Validation Section */}
        <div>
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className={`w-full px-4 py-3 ${tw.rounded} border-2 transition-all flex items-center justify-center gap-2`}
            style={{
              borderColor: color.border.default,
              backgroundColor: isValidating ? color.surface.cards : "white",
              opacity: isValidating ? 0.6 : 1,
            }}
          >
            {isValidating ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className={`text-sm font-medium ${tw.textPrimary}`}>
                  {t.manualRewards.validating}
                </span>
              </>
            ) : (
              <>
                <Eye
                  className="w-4 h-4"
                  style={{ color: color.primary.accent }}
                />
                <span className={`text-sm font-medium ${tw.textPrimary}`}>
                  {t.manualRewards.validateReward}
                </span>
              </>
            )}
          </button>

          {/* Validation Result */}
          {validationResult && (
            <div
              className={`mt-3 p-3 ${tw.rounded} flex items-start gap-2`}
              style={{
                backgroundColor: validationResult.valid
                  ? `${color.status.success}10`
                  : `${color.status.danger}10`,
                border: `1px solid ${
                  validationResult.valid
                    ? `${color.status.success}30`
                    : `${color.status.danger}30`
                }`,
              }}
            >
              {validationResult.valid ? (
                <CheckCircle
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: color.status.success }}
                />
              ) : (
                <AlertCircle
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: color.status.danger }}
                />
              )}
              <p
                className="text-sm"
                style={{
                  color: validationResult.valid
                    ? color.status.success
                    : color.status.danger,
                }}
              >
                {validationResult.message}
              </p>
            </div>
          )}
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

      {/* Footer */}
      <div
        className="p-4 sm:p-6 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        style={{ borderColor: color.border.default }}
      >
        <button
          onClick={onPrevious}
          className={`w-full sm:w-auto px-6 py-2.5 ${tw.rounded} transition-all text-sm font-semibold whitespace-nowrap`}
          style={{
            backgroundColor: color.surface.cards,
            border: `1px solid ${color.border.default}`,
            color: color.text.primary,
          }}
        >
          {t.manualRewards.previous}
        </button>
        <button
          onClick={onNext}
          className={`w-full sm:w-auto px-6 py-2.5 text-white ${tw.rounded} transition-all text-sm font-semibold whitespace-nowrap`}
          style={{ backgroundColor: color.primary.action }}
        >
          {t.manualRewards.nextApply}
        </button>
      </div>
    </div>
  );
}
