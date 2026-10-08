import { type ReactNode } from "react";
import CustomerProfileEntityLink from "../navigation/CustomerProfileEntityLink";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import type { CustomerOfferItem } from "../types/customerOffer";
import {
  humanizeCatalogStatus,
  humanizeOfferStatus,
  humanizeOfferType,
  humanizeValidity,
  usageSummary,
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

function OfferValue({ offer }: { offer: CustomerOfferItem }) {
  if (offer.valueAmount != null) {
    return <CurrencyFormatter amount={offer.valueAmount} />;
  }
  if (offer.valuePercent != null) {
    return <span>{offer.valuePercent}%</span>;
  }
  return <span>—</span>;
}

function statusExplanation(offer: CustomerOfferItem): string {
  if (offer.status === "active" && offer.validity === "expired") {
    return "Status is Active because this customer is attached to the reward. The offer validity has ended, so another redemption is blocked until the window is extended.";
  }
  if (offer.status === "active" && offer.validity === "scheduled") {
    return "Status is Active because this customer is attached to the reward. The validity window has not started, so it cannot be redeemed yet.";
  }
  if (offer.status === "active" && offer.canRedeemAgain) {
    return "Status is Active because this customer is attached to the reward. Another redemption is still allowed.";
  }
  if (offer.status === "active" && offer.redemptionCount > 0 && !offer.isReusable) {
    return "Status is Active because this customer is attached to the reward. This offer is single-use and has already been redeemed.";
  }
  if (
    offer.status === "active" &&
    offer.maxUsagePerCustomer != null &&
    offer.redemptionCount >= offer.maxUsagePerCustomer
  ) {
    return "Status is Active because this customer is attached to the reward. The per-customer usage limit has been reached.";
  }
  if (offer.status === "active") {
    return "Status is Active because this customer is attached to the reward.";
  }
  return "Status is Inactive because this customer is not attached to the reward. Earlier receipts and redemptions stay on this offer.";
}

export default function CustomerOfferDetailsExpandedRow({
  offer,
}: CustomerOfferDetailsExpandedRowProps) {
  const unlistedRedemptions = Math.max(
    0,
    offer.redemptionCount - offer.redemptions.length,
  );
  const receipts = [...offer.receipts].reverse();
  const redemptions = [...offer.redemptions].reverse();

  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      <div className="space-y-6">
        <div>
          <SectionHeading>Offer</SectionHeading>
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
            <DetailField label="Value">
              <OfferValue offer={offer} />
            </DetailField>
            <DetailField label="Catalog status">
              {humanizeCatalogStatus(offer.catalogStatus)}
            </DetailField>
            <DetailField label="Validity">
              {humanizeValidity(offer.validity)}
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
            <DetailField label="Description">
              {displayValue(offer.description)}
            </DetailField>
          </div>
        </div>

        <div>
          <SectionHeading>Attachment</SectionHeading>
          <p className="text-sm text-gray-600 mb-4">{statusExplanation(offer)}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Status">
              {humanizeOfferStatus(offer.status)}
            </DetailField>
            <DetailField label="Attached">
              {offer.isAttached ? "Yes" : "No"}
            </DetailField>
            <DetailField label="Attached at">
              {offer.attachedAt ? (
                <DateFormatter
                  date={offer.attachedAt}
                  includeTime
                  useUserTimezone
                />
              ) : offer.acceptedAt ? (
                <DateFormatter
                  date={offer.acceptedAt}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="How attached">
              {offer.isAttached
                ? offer.attachmentSources.join(", ")
                : "Not attached"}
            </DetailField>
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
          </div>
        </div>

        <div>
          <SectionHeading>Received</SectionHeading>
          {offer.receipts.length === 0 ? (
            <p className="text-sm text-gray-500">
              {offer.hasReceived
                ? "This customer received the offer, but no delivery record was returned."
                : "This customer has not received this offer. Attachment alone does not count as a delivery."}
            </p>
          ) : (
            <div className="space-y-2">
              {receipts.map((receipt, index) => (
                <p key={receipt.id} className="text-sm text-gray-700">
                  <span className="font-medium">Delivery {index + 1}</span>
                  <span className="text-gray-500">
                    {receipt.channel ? ` · ${receipt.channel}` : ""}
                    {receipt.campaignName ? ` · ${receipt.campaignName}` : ""}
                    {receipt.source ? ` · ${receipt.source}` : ""}
                    {" · "}
                  </span>
                  {receipt.receivedAt ? (
                    <DateFormatter
                      date={receipt.receivedAt}
                      includeTime
                      useUserTimezone
                      className="text-sm text-gray-500"
                    />
                  ) : (
                    <span className="text-gray-500">date not on file</span>
                  )}
                </p>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionHeading>Redemptions</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <DetailField label="Uses">{usageSummary(offer)}</DetailField>
            <DetailField label="Reusable">
              {offer.isReusable ? "Yes" : "No"}
              {offer.maxUsagePerCustomer
                ? ` · max ${offer.maxUsagePerCustomer}/customer`
                : ""}
            </DetailField>
            <DetailField label="Can redeem again">
              {offer.canRedeemAgain ? "Yes" : "No"}
            </DetailField>
          </div>
          {redemptions.length === 0 ? (
            <p className="text-sm text-gray-500">
              {offer.redemptionCount > 0
                ? `${offer.redemptionCount.toLocaleString()} redemption${offer.redemptionCount === 1 ? "" : "s"} counted without timestamps.`
                : "No redemptions yet. Repeat redemptions will list here without changing Active status."}
            </p>
          ) : (
            <div className="space-y-2">
              {redemptions.map((redemption, index) => (
                <p key={redemption.id} className="text-sm text-gray-700">
                  <span className="font-medium">Redemption {index + 1}</span>
                  <span className="text-gray-500">
                    {redemption.channel ? ` · ${redemption.channel}` : ""}
                    {redemption.campaignName ? ` · ${redemption.campaignName}` : ""}
                    {redemption.status ? ` · ${redemption.status}` : ""}
                    {" · "}
                  </span>
                  {redemption.redeemedAt ? (
                    <DateFormatter
                      date={redemption.redeemedAt}
                      includeTime
                      useUserTimezone
                      className="text-sm text-gray-500"
                    />
                  ) : (
                    <span className="text-gray-500">date not on file</span>
                  )}
                </p>
              ))}
              {unlistedRedemptions > 0 ? (
                <p className="text-xs text-gray-500">
                  {unlistedRedemptions.toLocaleString()} earlier redemption
                  {unlistedRedemptions === 1 ? "" : "s"} counted without a
                  timestamp.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
