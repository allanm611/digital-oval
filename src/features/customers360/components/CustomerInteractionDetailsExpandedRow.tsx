import { type ReactNode } from "react";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import type { CustomerInteractionItem } from "../types/customerInteraction";
import { humanizeChannel } from "../utils/customerEventHelpers";
import {
  humanizeInteractionKind,
  humanizeInteractionStatus,
} from "../utils/customerInteractionHelpers";

type CustomerInteractionDetailsExpandedRowProps = {
  interaction: CustomerInteractionItem;
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
  value: CustomerInteractionItem["evidence"][number],
): string {
  if (value === "subscriber_api") return "Subscriber interactions API";
  if (value === "event") return "Customer event";
  return "Profile hint";
}

export default function CustomerInteractionDetailsExpandedRow({
  interaction,
}: CustomerInteractionDetailsExpandedRowProps) {
  return (
    <div
      style={{ backgroundColor: color.surface.tablebodybg }}
      className="px-6 py-6"
    >
      <div className="space-y-6">
        <div>
          <SectionHeading>Interaction</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Ticket ID">
              {displayValue(interaction.ticketId)}
            </DetailField>
            <DetailField label="Type">
              {humanizeInteractionKind(interaction.kind)}
            </DetailField>
            <DetailField label="Status">
              {humanizeInteractionStatus(interaction.status)}
              {interaction.verification === "hint" ? " · Unverified" : ""}
            </DetailField>
            <DetailField label="Subject">
              {displayValue(interaction.subject)}
            </DetailField>
            <DetailField label="Opened">
              {interaction.occurredAt ? (
                <DateFormatter
                  date={interaction.occurredAt}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Resolved">
              {interaction.resolvedAt ? (
                <DateFormatter
                  date={interaction.resolvedAt}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Channel">
              {interaction.channel ? humanizeChannel(interaction.channel) : "—"}
            </DetailField>
            <DetailField label="Agent">
              {displayValue(interaction.agent)}
            </DetailField>
            <DetailField label="Related event">
              {displayValue(interaction.eventId)}
            </DetailField>
            <DetailField label="Evidence">
              {interaction.evidence.length > 0
                ? interaction.evidence.map(evidenceLabel).join(", ")
                : "—"}
            </DetailField>
            <DetailField label="Verification">
              {interaction.verification === "verified"
                ? "Verified against tickets or events"
                : "Profile hint only"}
            </DetailField>
          </div>
        </div>

        <div>
          <SectionHeading>Notes</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailField label="Description">
              {displayValue(interaction.description)}
            </DetailField>
            <DetailField label="Notes">
              {displayValue(interaction.notes)}
            </DetailField>
          </div>
        </div>
      </div>
    </div>
  );
}
