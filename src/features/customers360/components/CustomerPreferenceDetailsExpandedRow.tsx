import { type ReactNode } from "react";
import CustomerProfileEntityLink from "../navigation/CustomerProfileEntityLink";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import type { CustomerPreferenceItem } from "../types/customerPreference";
import {
  humanizeConsentStatus,
  humanizePreferenceKind,
} from "../utils/customerPreferenceHelpers";
import { humanizeIdentifierType } from "../utils/customerSubscribedListHelpers";

type CustomerPreferenceDetailsExpandedRowProps = {
  item: CustomerPreferenceItem;
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
  value: CustomerPreferenceItem["evidence"][number],
): string {
  if (value === "subscriber_api") return "Subscriber preferences API";
  if (value === "dnd") return "DND subscription";
  if (value === "event") return "Customer event";
  return "Profile hint";
}

function dndHref(item: CustomerPreferenceItem): string | null {
  if (!item.dndSubscriptionId) return null;
  if (item.communicationChannelId) {
    return `/dashboard/dnd-management/${item.communicationChannelId}/${item.dndSubscriptionId}`;
  }
  return "/dashboard/dnd-management";
}

export default function CustomerPreferenceDetailsExpandedRow({
  item,
}: CustomerPreferenceDetailsExpandedRowProps) {
  const href = dndHref(item);

  return (
    <div
      style={{ backgroundColor: color.surface.tablebodybg }}
      className="px-6 py-6"
    >
      <div className="space-y-6">
        <div>
          <SectionHeading>Preference</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Name">{displayValue(item.name)}</DetailField>
            <DetailField label="Kind">
              {humanizePreferenceKind(item.kind)}
            </DetailField>
            <DetailField label="Status">
              {humanizeConsentStatus(item.status)}
              {item.verification === "hint" ? " · Unverified" : ""}
            </DetailField>
            <DetailField label="Channel">
              {displayValue(item.channelLabel)}
            </DetailField>
            <DetailField label="Category">
              {displayValue(item.category)}
            </DetailField>
            <DetailField label="Updated">
              {item.updatedAt ? (
                <DateFormatter
                  date={item.updatedAt}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Expires">
              {item.expiresAt ? (
                <DateFormatter
                  date={item.expiresAt}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Evidence">
              {item.evidence.length > 0
                ? item.evidence.map(evidenceLabel).join(", ")
                : "—"}
            </DetailField>
            <DetailField label="Verification">
              {item.verification === "verified"
                ? "Verified against preferences, DND, or events"
                : "Profile hint only"}
            </DetailField>
          </div>
        </div>

        <div>
          <SectionHeading>Linked systems</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="DND record">
              {href ? (
                <CustomerProfileEntityLink
                  to={href}
                  className="font-medium hover:underline"
                  style={{ color: color.primary.action }}
                >
                  {item.dndSubscriptionId
                    ? `DND #${item.dndSubscriptionId}`
                    : "DND management"}
                </CustomerProfileEntityLink>
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Matched identifier">
              {item.matchedIdentifier
                ? `${item.matchedIdentifier} · ${humanizeIdentifierType(item.matchedIdentifierType)}`
                : "—"}
            </DetailField>
            <DetailField label="Related event">
              {displayValue(item.eventId)}
            </DetailField>
          </div>
        </div>
      </div>
    </div>
  );
}
