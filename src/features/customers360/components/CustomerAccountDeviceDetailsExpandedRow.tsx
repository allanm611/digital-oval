import { type ReactNode } from "react";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import type { CustomerInventoryItem } from "../types/customerAccountDevice";
import {
  humanizeDeviceType,
  humanizeInventoryKind,
  humanizeInventoryStatus,
} from "../utils/customerAccountDeviceHelpers";

type CustomerAccountDeviceDetailsExpandedRowProps = {
  item: CustomerInventoryItem;
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
  value: CustomerInventoryItem["evidence"][number],
): string {
  if (value === "subscriber_api") return "Subscriber accounts/devices API";
  if (value === "event") return "Customer event";
  return "Customer profile";
}

export default function CustomerAccountDeviceDetailsExpandedRow({
  item,
}: CustomerAccountDeviceDetailsExpandedRowProps) {
  return (
    <div
      style={{ backgroundColor: color.surface.tablebodybg }}
      className="px-6 py-6"
    >
      <div className="space-y-6">
        <div>
          <SectionHeading>
            {item.kind === "account" ? "Account" : "Device"}
          </SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label={item.kind === "account" ? "MSISDN" : "Name"}>
              {displayValue(item.kind === "account" ? item.msisdn || item.name : item.name)}
            </DetailField>
            <DetailField label="Type">
              {item.kind === "account"
                ? humanizeInventoryKind(item.kind)
                : humanizeDeviceType(item.deviceType)}
              {item.isPrimary ? " · Primary" : ""}
            </DetailField>
            <DetailField label="Status">
              {humanizeInventoryStatus(item.status)}
              {item.verification === "hint" ? " · Unverified" : ""}
            </DetailField>
            <DetailField label="Last activity">
              {item.lastSeenAt ? (
                <DateFormatter
                  date={item.lastSeenAt}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="First seen / activated">
              {item.firstSeenAt ? (
                <DateFormatter
                  date={item.firstSeenAt}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Related event">
              {displayValue(item.eventId)}
            </DetailField>
          </div>
        </div>

        {item.kind === "account" ? (
          <div>
            <SectionHeading>SIM</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailField label="ICCID">{displayValue(item.iccid)}</DetailField>
              <DetailField label="IMSI">{displayValue(item.imsi)}</DetailField>
              <DetailField label="SIM type">
                {displayValue(item.simType)}
              </DetailField>
              <DetailField label="Tariff">{displayValue(item.tariff)}</DetailField>
            </div>
          </div>
        ) : (
          <div>
            <SectionHeading>Hardware</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailField label="Model">{displayValue(item.model)}</DetailField>
              <DetailField label="OS">
                {[item.os, item.osVersion].filter(Boolean).join(" ") || "—"}
              </DetailField>
              <DetailField label="App version">
                {displayValue(item.appVersion)}
              </DetailField>
              <DetailField label="IMEI">{displayValue(item.imei)}</DetailField>
            </div>
          </div>
        )}

        <div>
          <SectionHeading>Evidence</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Source">
              {item.evidence.length > 0
                ? item.evidence.map(evidenceLabel).join(", ")
                : "—"}
            </DetailField>
            <DetailField label="Verification">
              {item.verification === "verified"
                ? "Verified against the subscriber record, accounts API, or events"
                : "Profile hint only"}
            </DetailField>
          </div>
        </div>
      </div>
    </div>
  );
}
