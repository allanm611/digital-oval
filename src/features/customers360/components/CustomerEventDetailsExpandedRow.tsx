import { useEffect, useState, type ReactNode } from "react";
import CustomerProfileEntityLink from "../navigation/CustomerProfileEntityLink";
import DateFormatter from "../../../shared/components/DateFormatter";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { customerEventService } from "../services/customerEventService";
import type { CustomerEvent } from "../types/customerEvent";
import {
  creativeBodyPreview,
  eventMessageReceivedAt,
  hasEventRelatedContext,
  humanizeChannel,
  humanizeOrigin,
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

  const showLoyalty = Boolean(
    details.loyalty?.points != null ||
      details.loyalty?.points_balance != null ||
      details.loyalty?.reward_name ||
      details.loyalty?.program_name ||
      details.loyalty?.tier ||
      details.loyalty?.kind,
  );
  const showPurchase = Boolean(
    details.purchase?.transaction_id ||
      details.purchase?.product_name ||
      details.purchase?.amount != null,
  );
  const showInteraction = Boolean(
    details.interaction?.ticket_id ||
      details.interaction?.subject ||
      details.interaction?.notes,
  );
  const showDevice = Boolean(
    details.device?.device_id ||
      details.device?.device_name ||
      details.device?.device_type,
  );

  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      {isLoading ? (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <LoadingSpinner variant="modern" size="sm" color="primary" />
          Loading related offer, campaign, and creative details...
        </div>
      ) : null}

      <div className="space-y-6">
        <div>
          <SectionHeading>Event details</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DetailField label="Event type">
              {displayValue(details.event_type_label)}
            </DetailField>
            <DetailField label="Event code">
              <span className="font-mono">{displayValue(details.event_type)}</span>
            </DetailField>
            <DetailField label="Occurred at">
              {details.occurred_at ? (
                <DateFormatter
                  date={details.occurred_at}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Channel">
              {humanizeChannel(details.channel)}
            </DetailField>
            <DetailField label="Origin">
              {humanizeOrigin(details.origin)}
            </DetailField>
            <DetailField label="Status">{displayValue(details.status)}</DetailField>
            <DetailField label="Tracking source">
              {displayValue(details.tracking_source_name)}
            </DetailField>
            <DetailField label="Description">
              {displayValue(details.description)}
            </DetailField>
          </div>
        </div>

        {showLoyalty ? (
          <div>
            <SectionHeading>Loyalty</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DetailField label="Points">
                {details.loyalty?.points == null
                  ? "—"
                  : details.loyalty.points.toLocaleString()}
              </DetailField>
              <DetailField label="Balance after">
                {details.loyalty?.points_balance == null
                  ? "—"
                  : details.loyalty.points_balance.toLocaleString()}
              </DetailField>
              <DetailField label="Kind">
                {displayValue(details.loyalty?.kind)}
              </DetailField>
              <DetailField label="Reward">
                {displayValue(details.loyalty?.reward_name)}
              </DetailField>
              <DetailField label="Program">
                {displayValue(details.loyalty?.program_name)}
              </DetailField>
              <DetailField label="Tier">
                {displayValue(details.loyalty?.tier)}
              </DetailField>
            </div>
          </div>
        ) : null}

        {showPurchase ? (
          <div>
            <SectionHeading>Purchase</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DetailField label="Transaction">
                {displayValue(details.purchase?.transaction_id)}
              </DetailField>
              <DetailField label="Product">
                {displayValue(details.purchase?.product_name)}
              </DetailField>
              <DetailField label="Amount">
                {details.purchase?.amount == null
                  ? "—"
                  : `${details.purchase.amount.toLocaleString()} ${details.purchase.currency || ""}`.trim()}
              </DetailField>
            </div>
          </div>
        ) : null}

        {showInteraction ? (
          <div>
            <SectionHeading>Interaction</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DetailField label="Ticket">
                {displayValue(details.interaction?.ticket_id)}
              </DetailField>
              <DetailField label="Subject">
                {displayValue(details.interaction?.subject)}
              </DetailField>
              <DetailField label="Agent">
                {displayValue(details.interaction?.agent)}
              </DetailField>
              <DetailField label="Notes">
                {displayValue(details.interaction?.notes)}
              </DetailField>
            </div>
          </div>
        ) : null}

        {showDevice ? (
          <div>
            <SectionHeading>Device</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DetailField label="Device">
                {displayValue(details.device?.device_name)}
              </DetailField>
              <DetailField label="Type">
                {displayValue(details.device?.device_type)}
              </DetailField>
              <DetailField label="OS">
                {displayValue(
                  [details.device?.os, details.device?.os_version]
                    .filter(Boolean)
                    .join(" "),
                )}
              </DetailField>
            </div>
          </div>
        ) : null}

        {!hasContext && !showLinkedSections && !showLoyalty && !showPurchase && !showInteraction && !showDevice ? (
          <p className="text-sm text-gray-500">
            No offer, campaign, loyalty, or care details are linked to this event.
          </p>
        ) : null}

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
                  <CustomerProfileEntityLink
                    to={`/dashboard/offers/${details.offer.id}`}
                    className="font-medium hover:underline"
                  >
                    {details.offer.name || `Offer #${details.offer.id}`}
                  </CustomerProfileEntityLink>
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
                  <CustomerProfileEntityLink
                    to={`/dashboard/campaigns/${details.campaign.id}`}
                    className="font-medium hover:underline"
                  >
                    {details.campaign.name ||
                      `Campaign #${details.campaign.id}`}
                  </CustomerProfileEntityLink>
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
    </div>
  );
}
