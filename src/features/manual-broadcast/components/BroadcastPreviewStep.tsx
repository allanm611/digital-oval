import {
  AlertCircle,
  Calendar,
  MessageSquare,
  TestTube2,
  Users,
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw } from "../../../shared/utils/utils";
import { ManualBroadcastData } from "../pages/CreateManualBroadcastPage";
import { formatDateWithTimezone } from "../../../shared/services/dateService";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";

interface BroadcastPreviewStepProps {
  data: ManualBroadcastData;
  isEditMode?: boolean;
}

export default function BroadcastPreviewStep({
  data,
  isEditMode = false,
}: BroadcastPreviewStepProps) {
  const { t } = useLanguage();

  const getRecipientCount = (): number => {
    if (data.quicklistId && data.rowCount) {
      return data.rowCount;
    }

    if (data.audienceFileText && data.inputMethod === "manual") {
      return data.audienceFileText
        .split(/\n|,/)
        .map((line) => line.trim())
        .filter(Boolean).length;
    }

    return data.rowCount || 0;
  };

  const getScheduleSummary = (): string => {
    if (data.scheduleType === "now") {
      return t.manualBroadcast.summarySendNow;
    }

    if (data.scheduleDate && data.scheduleTime) {
      return t.manualBroadcast.summaryScheduled.replace(
        "{dateTime}",
        formatDateWithTimezone(new Date(`${data.scheduleDate}T${data.scheduleTime}`), getSettingsTimezoneOffset(), "default", true),
      );
    }

    return t.manualBroadcast.summaryNotSet;
  };

  const testSuccessCount =
    (data.testResults?.successCount as number | undefined) || 0;
  const testFailedCount =
    (data.testResults?.failedCount as number | undefined) || 0;
  const testTotal = testSuccessCount + testFailedCount;

  return (
    <div
      className={`bg-white ${tw.rounded} shadow-sm border`}
      style={{ borderColor: color.border.default }}
    >
      <div
        className="p-5 border-b"
        style={{ borderColor: color.border.default }}
      >
        <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>Preview</h2>
        <p className={`text-sm ${tw.textSecondary} mt-1`}>
          Final review before {isEditMode ? "updating" : "sending"} this
          broadcast.
        </p>
      </div>

      <div className="p-5 space-y-5">
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
            {t.manualBroadcast.broadcastSummary}
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Users
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: color.text.muted }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${tw.textSecondary}`}>
                  {t.manualBroadcast.summaryAudience}
                </p>
                <p className={`text-sm font-medium ${tw.textPrimary} mt-0.5`}>
                  {data.audienceName || t.manualBroadcast.summaryNotSet}
                </p>
                <p className={`text-xs ${tw.textMuted} mt-1`}>
                  {getRecipientCount().toLocaleString()} recipients
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquare
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: color.text.muted }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${tw.textSecondary}`}>
                  {t.manualBroadcast.summaryChannel}
                </p>
                <p className={`text-sm font-medium ${tw.textPrimary} mt-0.5`}>
                  {data.channel || t.manualBroadcast.summaryNotSet}
                </p>
                {data.messageTitle && (
                  <p className={`text-xs ${tw.textMuted} mt-1`}>
                    Subject: {data.messageTitle}
                  </p>
                )}
                <p className={`text-xs ${tw.textMuted} mt-1 line-clamp-3`}>
                  {data.messageBody || "No message body"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: color.text.muted }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${tw.textSecondary}`}>
                  {t.manualBroadcast.summarySchedule}
                </p>
                <p className={`text-sm font-medium ${tw.textPrimary} mt-0.5`}>
                  {getScheduleSummary()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <TestTube2
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: color.text.muted }}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${tw.textSecondary}`}>
                  {t.manualBroadcast.communicationPolicy ||
                    "Communication Policy"}
                </p>
                <p className={`text-sm font-medium ${tw.textPrimary} mt-0.5`}>
                  {data.selectedCommunicationPolicyId
                    ? `Policy ${data.selectedCommunicationPolicyId}`
                    : "Not selected"}
                </p>
                {testTotal > 0 && (
                  <p className={`text-xs ${tw.textMuted} mt-1`}>
                    Test: {testSuccessCount} passed, {testFailedCount} failed
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

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
              {t.manualBroadcast.warningTitle}
            </p>
            <p className={`text-sm ${tw.textMuted} mt-1`}>
              {data.scheduleType === "now"
                ? t.manualBroadcast.warningBodyNow
                : t.manualBroadcast.warningBodyScheduled}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
