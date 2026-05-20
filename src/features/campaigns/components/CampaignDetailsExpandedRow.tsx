import { useState, useEffect } from "react";
import { color, tw } from "../../../shared/utils/utils";
import { getSettingsCurrency } from "../../../shared/utils/settingsHelper";
import { campaignObjectiveService } from "../../configurations/services/campaignObjectiveService";
import { CampaignDisplay } from "../types/campaign";
import DateFormatter from "../../../shared/components/DateFormatter";

interface CampaignDetailsExpandedRowProps {
  campaign: CampaignDisplay;
  colSpan: number;
}

export default function CampaignDetailsExpandedRow({
  campaign,
  colSpan,
}: CampaignDetailsExpandedRowProps) {
  const [objectiveName, setObjectiveName] = useState<string>("");
  const [objectiveLoading, setObjectiveLoading] = useState(false);

  useEffect(() => {
    if (campaign.objective) {
      setObjectiveLoading(true);
      campaignObjectiveService
        .getCampaignObjectiveById(Number(campaign.objective))
        .then((obj) => {
          setObjectiveName(obj.name || obj.label || "—");
        })
        .catch((err) => {
          console.error("Failed to fetch objective:", err);
          setObjectiveName(String(campaign.objective));
        })
        .finally(() => {
          setObjectiveLoading(false);
        });
    }
  }, [campaign.objective]);

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return value;
  };

  const formatCurrency = (value: unknown) => {
    if (value === null || value === undefined) return "—";
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    const currency = getSettingsCurrency();
    return isNaN(num) ? "—" : `${currency} ${num.toLocaleString()}`;
  };

  const formatPercentage = (value: unknown) => {
    if (value === null || value === undefined) return "—";
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    return isNaN(num) ? "—" : `${num}%`;
  };

  return (
    <tr style={{ backgroundColor: color.surface.tablebodybg }}>
      <td colSpan={colSpan} className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(campaign.approval_status === "rejected" || campaign.status === "rejected") && campaign.rejection_reason && (
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium ${tw.textMuted}`}>
                Rejection Reason
              </label>
              <div className="text-sm text-red-600 break-words">
                {campaign.rejection_reason}
              </div>
            </div>
          )}
          {campaign.description && (
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium ${tw.textMuted}`}>
                Description
              </label>
              <div className={`text-sm ${tw.textPrimary} break-words`}>
                {formatValue(campaign.description)}
              </div>
            </div>
          )}

          {campaign.objective && (
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium ${tw.textMuted}`}>
                Objective
              </label>
              <div className={`text-sm ${tw.textPrimary}`}>
                {objectiveLoading ? "Loading..." : objectiveName}
              </div>
            </div>
          )}

          {campaign.communication_policy && (
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium ${tw.textMuted}`}>
                Policy
              </label>
              <div className={`text-sm ${tw.textPrimary} break-words`}>
                {formatValue(campaign.communication_policy)}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Control Group
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              Enabled: {campaign.is_active ? "Yes" : "No"}
            </div>
          </div>

          {campaign.budget_allocated !== null &&
            campaign.budget_allocated !== undefined && (
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-medium ${tw.textMuted}`}>
                  Budget Allocated
                </label>
                <div className={`text-sm ${tw.textPrimary}`}>
                  {formatCurrency(campaign.budget_allocated)}
                </div>
              </div>
            )}

          {campaign.budget_spent !== null &&
            campaign.budget_spent !== undefined && (
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-medium ${tw.textMuted}`}>
                  Budget Spent
                </label>
                <div className={`text-sm ${tw.textPrimary}`}>
                  {formatCurrency(campaign.budget_spent)}
                </div>
              </div>
            )}

          {campaign.start_date && (
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium ${tw.textMuted}`}>
                Start Date
              </label>
              <div className={`text-sm ${tw.textPrimary}`}>
                <DateFormatter date={new Date(campaign.start_date)} useUserTimezone />
              </div>
            </div>
          )}

          {campaign.end_date && (
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-medium ${tw.textMuted}`}>
                End Date
              </label>
              <div className={`text-sm ${tw.textPrimary}`}>
                <DateFormatter date={new Date(campaign.end_date)} useUserTimezone />
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
