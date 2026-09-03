import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import type { CustomerLoyaltyItem } from "../types/customerLoyalty";
import { humanizeChannel } from "../utils/customerEventHelpers";
import {
  formatPoints,
  humanizeLoyaltyKind,
  humanizeLoyaltyStatus,
} from "../utils/customerLoyaltyHelpers";

type CustomerLoyaltyDetailsExpandedRowProps = {
  activity: CustomerLoyaltyItem;
};

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`text-xs font-medium ${tw.textMuted}`}>{label}</label>
      <div className={`text-sm ${tw.textPrimary} break-words`}>{children}</div>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">
      {children}
    </p>
  );
}

function displayValue(value: string | null | undefined): string {
  if (!value || !String(value).trim()) return "—";
  return String(value);
}

function evidenceLabel(
  value: CustomerLoyaltyItem["evidence"][number],
): string {
  if (value === "subscriber_api") return "Subscriber loyalty API";
  if (value === "event") return "Customer event";
  return "Profile hint";
}

export default function CustomerLoyaltyDetailsExpandedRow({
  activity,
}: CustomerLoyaltyDetailsExpandedRowProps) {
  return (
    <div
      style={{ backgroundColor: color.surface.tablebodybg }}
      className="px-6 py-6"
    >
      <div className="space-y-6">
        <div>
          <SectionHeading>Reward</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Reward">{displayValue(activity.name)}</DetailField>
            <DetailField label="Type">
              {humanizeLoyaltyKind(activity.kind)}
            </DetailField>
            <DetailField label="Status">
              {humanizeLoyaltyStatus(activity.status)}
              {activity.verification === "hint" ? " · Unverified" : ""}
            </DetailField>
            <DetailField label="Points">
              {formatPoints(activity.points)}
            </DetailField>
            <DetailField label="Balance after">
              {formatPoints(activity.pointsBalanceAfter)}
            </DetailField>
            <DetailField label="Date">
              {activity.occurredAt ? (
                <DateFormatter
                  date={activity.occurredAt}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Reward type">
              {displayValue(activity.rewardType)}
            </DetailField>
            <DetailField label="Channel">
              {activity.channel ? humanizeChannel(activity.channel) : "—"}
            </DetailField>
            <DetailField label="Evidence">
              {activity.evidence.length > 0
                ? activity.evidence.map(evidenceLabel).join(", ")
                : "—"}
            </DetailField>
            <DetailField label="Verification">
              {activity.verification === "verified"
                ? "Verified against the loyalty ledger or events"
                : "Profile hint only"}
            </DetailField>
          </div>
        </div>

        <div>
          <SectionHeading>Linked systems</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Offer">
              {activity.offerId ? (
                <Link
                  to={`/dashboard/offers/${activity.offerId}`}
                  className="font-medium hover:underline"
                  style={{ color: color.primary.action }}
                >
                  {activity.offerName || `Offer #${activity.offerId}`}
                </Link>
              ) : (
                displayValue(activity.offerName)
              )}
            </DetailField>
            <DetailField label="Campaign">
              {activity.campaignId ? (
                <Link
                  to={`/dashboard/campaigns/${activity.campaignId}`}
                  className="font-medium hover:underline"
                  style={{ color: color.primary.action }}
                >
                  {activity.campaignName || `Campaign #${activity.campaignId}`}
                </Link>
              ) : (
                displayValue(activity.campaignName)
              )}
            </DetailField>
            <DetailField label="Manual reward">
              {activity.manualRewardId ? (
                <Link
                  to={`/dashboard/manual-rewards/${activity.manualRewardId}`}
                  className="font-medium hover:underline"
                  style={{ color: color.primary.action }}
                >
                  Manual reward #{activity.manualRewardId}
                </Link>
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Related event">
              {displayValue(activity.eventId)}
            </DetailField>
          </div>
        </div>
      </div>
    </div>
  );
}
