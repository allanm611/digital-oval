import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import type { CustomerCommunicationItem } from "../types/customerCommunication";
import {
  humanizeCommunicationChannel,
  humanizeCommunicationOrigin,
  humanizeCommunicationStatus,
} from "../utils/customerCommunicationHelpers";
import { humanizeIdentifierType } from "../utils/customerSubscribedListHelpers";

type CustomerCommunicationDetailsExpandedRowProps = {
  item: CustomerCommunicationItem;
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
  value: CustomerCommunicationItem["evidence"][number],
): string {
  if (value === "subscriber_api") return "Subscriber communications API";
  if (value === "delivery_log") return "Delivery log";
  if (value === "event") return "Customer event";
  return "Profile hint";
}

export default function CustomerCommunicationDetailsExpandedRow({
  item,
}: CustomerCommunicationDetailsExpandedRowProps) {
  return (
    <div
      style={{ backgroundColor: color.surface.tablebodybg }}
      className="px-6 py-6"
    >
      <div className="space-y-6">
        <div>
          <SectionHeading>Message</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Subject">{displayValue(item.subject)}</DetailField>
            <DetailField label="Channel">
              {humanizeCommunicationChannel(item.channel)}
            </DetailField>
            <DetailField label="Status">
              {humanizeCommunicationStatus(item.status)}
              {item.verification === "hint" ? " · Unverified" : ""}
            </DetailField>
            <DetailField label="Sent">
              {item.sentAt ? (
                <DateFormatter date={item.sentAt} includeTime useUserTimezone />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Delivered">
              {item.deliveredAt ? (
                <DateFormatter
                  date={item.deliveredAt}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Origin">
              {humanizeCommunicationOrigin(item.origin)}
            </DetailField>
            <DetailField label="Recipient">
              <div>
                <p>{displayValue(item.recipient)}</p>
                <p className="text-xs text-gray-500">
                  {humanizeIdentifierType(item.matchedIdentifierType)}
                </p>
              </div>
            </DetailField>
            <DetailField label="Evidence">
              {item.evidence.length > 0
                ? item.evidence.map(evidenceLabel).join(", ")
                : "—"}
            </DetailField>
          </div>
          {item.body ? (
            <div className="mt-4">
              <DetailField label="Body">
                <p className="whitespace-pre-wrap">{item.body}</p>
              </DetailField>
            </div>
          ) : null}
        </div>

        <div>
          <SectionHeading>Related campaign & offer</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Campaign">
              {item.campaignId ? (
                <Link
                  to={`/dashboard/campaigns/${item.campaignId}`}
                  className="font-medium hover:underline"
                  style={{ color: color.primary.action }}
                >
                  {item.campaignName || `Campaign #${item.campaignId}`}
                </Link>
              ) : (
                displayValue(item.campaignName)
              )}
            </DetailField>
            <DetailField label="Offer">
              {item.offerId ? (
                <Link
                  to={`/dashboard/offers/${item.offerId}`}
                  className="font-medium hover:underline"
                  style={{ color: color.primary.action }}
                >
                  {item.offerName || `Offer #${item.offerId}`}
                </Link>
              ) : (
                displayValue(item.offerName)
              )}
            </DetailField>
            <DetailField label="Broadcast">
              {item.broadcastId ? (
                <Link
                  to={`/dashboard/campaign-broadcasts/${item.broadcastId}`}
                  className="font-medium hover:underline"
                  style={{ color: color.primary.action }}
                >
                  {item.broadcastName || `Broadcast ${item.broadcastId}`}
                </Link>
              ) : (
                displayValue(item.broadcastName)
              )}
            </DetailField>
            <DetailField label="Creative">
              {displayValue(item.creativeName)}
            </DetailField>
            <DetailField label="Execution ID">
              {displayValue(item.executionId)}
            </DetailField>
          </div>
        </div>
      </div>
    </div>
  );
}
