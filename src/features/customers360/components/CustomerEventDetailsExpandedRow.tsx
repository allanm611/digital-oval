import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import DateFormatter from "../../../shared/components/DateFormatter";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { customerEventService } from "../services/customerEventService";
import type { CustomerEvent } from "../types/customerEvent";
import {
  creativeBodyPreview,
  eventMessageReceivedAt,
  hasEventRelatedContext,
  isCommunicationLinkedEvent,
} from "../utils/customerEventHelpers";

type CustomerEventDetailsExpandedRowProps = {
  event: CustomerEvent;
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

function displayValue(value: string | null | undefined): string {
  if (!value || !String(value).trim()) return "—";
  return String(value);
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">
      {children}
    </p>
  );
}

export default function CustomerEventDetailsExpandedRow({
  event,
}: CustomerEventDetailsExpandedRowProps) {
  const [details, setDetails] = useState<CustomerEvent>(event);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const shouldFetch = Boolean(
      event.offer?.id || event.campaign?.id || event.creative?.id,
    );

    if (!shouldFetch) {
      setDetails(event);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    void customerEventService
      .loadEventRelatedDetails(event)
      .then((next) => {
        if (!cancelled) setDetails(next);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [event]);

  const receivedAt = eventMessageReceivedAt(details);
  const showLinkedSections = isCommunicationLinkedEvent(details);
  const hasContext = hasEventRelatedContext(details);
  const creativeBody = creativeBodyPreview(details.creative);
  const showMessage = Boolean(
    showLinkedSections ||
      details.message?.content ||
      details.message?.subject ||
      receivedAt,
  );
  const showOffer = Boolean(
    showLinkedSections || details.offer?.id || details.offer?.name || details.offer?.code,
  );
  const showCampaign = Boolean(
    showLinkedSections ||
      details.campaign?.id ||
      details.campaign?.name ||
      details.campaign?.code,
  );
  const showCreative = Boolean(
    showLinkedSections ||
      details.creative?.id ||
      details.creative?.name ||
      creativeBody,
  );

  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      {isLoading ? (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <LoadingSpinner variant="modern" size="sm" color="primary" />
          Loading related offer, campaign, and creative details...
        </div>
      ) : null}

      {!hasContext && !showLinkedSections ? (
        <p className="text-sm text-gray-500">
          This event is not linked to an offer, campaign, or creative.
        </p>
      ) : (
        <div className="space-y-6">
          {showMessage ? (
            <div>
              <SectionHeading>Message content</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailField label="Received at">
                  {receivedAt ? (
                    <DateFormatter
                      date={receivedAt}
                      includeTime
                      useUserTimezone
                    />
                  ) : (
                    "—"
                  )}
                </DetailField>
                <DetailField label="Sent at">
                  {details.message?.sent_at ? (
                    <DateFormatter
                      date={details.message.sent_at}
                      includeTime
                      useUserTimezone
                    />
                  ) : (
                    "—"
                  )}
                </DetailField>
                <DetailField label="Delivered at">
                  {details.message?.delivered_at ? (
                    <DateFormatter
                      date={details.message.delivered_at}
                      includeTime
                      useUserTimezone
                    />
                  ) : (
                    "—"
                  )}
                </DetailField>
                <DetailField label="Direction">
                  {details.message?.direction === "inbound"
                    ? "Inbound"
                    : details.message?.direction === "outbound"
                      ? "Outbound"
                      : "—"}
                </DetailField>
                <DetailField label="Subject">
                  {displayValue(details.message?.subject)}
                </DetailField>
                <DetailField label="Message">
                  <span className="whitespace-pre-wrap">
                    {displayValue(details.message?.content || creativeBody)}
                  </span>
                </DetailField>
              </div>
            </div>
          ) : null}

          {showOffer ? (
            <div>
              <SectionHeading>Offer details</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailField label="Offer">
                  {details.offer?.id ? (
                    <Link
                      to={`/dashboard/offers/${details.offer.id}`}
                      className="font-medium hover:underline"
                    >
                      {details.offer.name || `Offer #${details.offer.id}`}
                    </Link>
                  ) : (
                    displayValue(details.offer?.name)
                  )}
                </DetailField>
                <DetailField label="Offer code">
                  <span className="font-mono">
                    {displayValue(details.offer?.code)}
                  </span>
                </DetailField>
                <DetailField label="Offer type">
                  <span className="capitalize">
                    {displayValue(details.offer?.type)}
                  </span>
                </DetailField>
                <DetailField label="Status">
                  {displayValue(details.offer?.status)}
                </DetailField>
                <DetailField label="Description">
                  {displayValue(details.offer?.description)}
                </DetailField>
              </div>
            </div>
          ) : null}

          {showCampaign ? (
            <div>
              <SectionHeading>Campaign details</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailField label="Campaign">
                  {details.campaign?.id ? (
                    <Link
                      to={`/dashboard/campaigns/${details.campaign.id}`}
                      className="font-medium hover:underline"
                    >
                      {details.campaign.name ||
                        `Campaign #${details.campaign.id}`}
                    </Link>
                  ) : (
                    displayValue(details.campaign?.name)
                  )}
                </DetailField>
                <DetailField label="Campaign code">
                  <span className="font-mono">
                    {displayValue(details.campaign?.code)}
                  </span>
                </DetailField>
                <DetailField label="Status">
                  {displayValue(details.campaign?.status)}
                </DetailField>
                <DetailField label="Type">
                  <span className="capitalize">
                    {displayValue(details.campaign?.type)}
                  </span>
                </DetailField>
              </div>
            </div>
          ) : null}

          {showCreative ? (
            <div>
              <SectionHeading>Creatives details</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailField label="Creative">
                  {displayValue(details.creative?.name)}
                </DetailField>
                <DetailField label="Channel">
                  {displayValue(details.creative?.channel)}
                </DetailField>
                <DetailField label="Title">
                  {displayValue(details.creative?.title)}
                </DetailField>
                <DetailField label="Locale">
                  {displayValue(details.creative?.locale)}
                </DetailField>
                <DetailField label="Creative content">
                  <span className="whitespace-pre-wrap">
                    {displayValue(creativeBody)}
                  </span>
                </DetailField>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
