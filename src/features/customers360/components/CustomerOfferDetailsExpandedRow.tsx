import { type ReactNode } from "react";
import CustomerProfileEntityLink from "../navigation/CustomerProfileEntityLink";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import type { CustomerOfferItem } from "../types/customerOffer";
import {
  humanizeCatalogStatus,
  humanizeOfferState,
  humanizeOfferType,
} from "../utils/customerOfferHelpers";

type CustomerOfferDetailsExpandedRowProps = {
  offer: CustomerOfferItem;
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

function evidenceLabel(value: CustomerOfferItem["evidence"][number]): string {
  if (value === "subscriber_api") return "Subscriber offers API";
  if (value === "campaign_mapping") return "Campaign mapping";
  if (value === "event") return "Customer event";
  return "Profile hint";
}

function OfferValue({ offer }: { offer: CustomerOfferItem }) {
  if (offer.valueAmount != null) {
    return <CurrencyFormatter amount={offer.valueAmount} />;
  }
  if (offer.valuePercent != null) {
    return <span>{offer.valuePercent}%</span>;
  }
  return <span>—</span>;
}

export default function CustomerOfferDetailsExpandedRow({
  offer,
}: CustomerOfferDetailsExpandedRowProps) {
  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      <div className="space-y-6">
        <div>
          <SectionHeading>Offer details</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Offer">
              {offer.offerId ? (
                <CustomerProfileEntityLink
                  to={`/dashboard/offers/${offer.offerId}`}
                  className="font-medium hover:underline"
                  style={{ color: color.primary.action }}
                >
                  {offer.name}
                </CustomerProfileEntityLink>
              ) : (
                displayValue(offer.name)
              )}
            </DetailField>
            <DetailField label="Offer code">{displayValue(offer.code)}</DetailField>
            <DetailField label="Offer type">
              {humanizeOfferType(offer.type)}
            </DetailField>
            <DetailField label="Customer status">
              {humanizeOfferState(offer.state)}
              {offer.verification === "hint" ? " · Unverified" : ""}
            </DetailField>
            <DetailField label="Catalog status">
              {humanizeCatalogStatus(offer.catalogStatus)}
            </DetailField>
            <DetailField label="Value">
              <OfferValue offer={offer} />
            </DetailField>
            <DetailField label="Valid from">
              {offer.validFrom ? (
                <DateFormatter
                  date={offer.validFrom}
                  useLocale
                  year="numeric"
                  month="short"
                  day="numeric"
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Valid to">
              {offer.validTo ? (
                <DateFormatter
                  date={offer.validTo}
                  useLocale
                  year="numeric"
                  month="short"
                  day="numeric"
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Reusable">
              {offer.isReusable ? "Yes" : "No"}
              {offer.maxUsagePerCustomer
                ? ` · max ${offer.maxUsagePerCustomer}/customer`
                : ""}
            </DetailField>
            <DetailField label="Description">
              {displayValue(offer.description)}
            </DetailField>
            <DetailField label="Evidence">
              {offer.evidence.length > 0
                ? offer.evidence.map(evidenceLabel).join(", ")
                : "—"}
            </DetailField>
          </div>
        </div>

        <div>
          <SectionHeading>Available via</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Campaigns">
              {offer.viaCampaigns.length === 0 ? (
                "—"
              ) : (
                <div className="flex flex-wrap gap-1">
                  {offer.viaCampaigns.map((campaign) => (
                    <CustomerProfileEntityLink
                      key={campaign.campaignId}
                      to={`/dashboard/campaigns/${campaign.campaignId}`}
                      className="inline-flex max-w-[180px] truncate rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800 hover:underline"
                      title={campaign.campaignName}
                    >
                      {campaign.campaignName}
                    </CustomerProfileEntityLink>
                  ))}
                </div>
              )}
            </DetailField>
            <DetailField label="Segments">
              {offer.viaSegments.length === 0 ? (
                "—"
              ) : (
                <div className="flex flex-wrap gap-1">
                  {offer.viaSegments.map((segment) => (
                    <CustomerProfileEntityLink
                      key={segment.segmentId}
                      to={`/dashboard/segments/${segment.segmentId}`}
                      className="inline-flex max-w-[180px] truncate rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 hover:underline"
                      title={segment.segmentName}
                    >
                      {segment.segmentName}
                    </CustomerProfileEntityLink>
                  ))}
                </div>
              )}
            </DetailField>
            <DetailField label="Last channel">
              {displayValue(offer.lastChannel)}
            </DetailField>
          </div>
        </div>

        <div>
          <SectionHeading>Redemption & activity</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Redeemed">
              {offer.redeemedAt ? (
                <DateFormatter
                  date={offer.redeemedAt}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Accepted">
              {offer.acceptedAt ? (
                <DateFormatter
                  date={offer.acceptedAt}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Redemptions">
              {offer.redemptionCount.toLocaleString()}
            </DetailField>
          </div>
          {offer.relatedEvents.length > 0 ? (
            <div className="mt-4 space-y-2">
              {offer.relatedEvents.slice(0, 5).map((event) => (
                <p key={event.eventId} className="text-sm text-gray-700">
                  <span className="font-medium">{event.eventTypeLabel}</span>
                  <span className="text-gray-500">
                    {" "}
                    · {event.channel} · {event.status} ·{" "}
                  </span>
                  <DateFormatter
                    date={event.occurredAt}
                    includeTime
                    useUserTimezone
                    className="text-sm text-gray-500"
                  />
                </p>
              ))}
              {offer.relatedEvents.length > 5 ? (
                <p className="text-xs text-gray-500">
                  +{offer.relatedEvents.length - 5} more related events
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              No offer events are linked to this customer yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
