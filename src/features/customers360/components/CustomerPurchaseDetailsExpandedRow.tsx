import { type ReactNode } from "react";
import CustomerProfileEntityLink from "../navigation/CustomerProfileEntityLink";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import type { CustomerPurchaseItem } from "../types/customerPurchase";
import {
  humanizePaymentMethod,
  humanizePurchaseKind,
  humanizePurchaseStatus,
} from "../utils/customerPurchaseHelpers";
import { humanizeChannel } from "../utils/customerEventHelpers";

type CustomerPurchaseDetailsExpandedRowProps = {
  purchase: CustomerPurchaseItem;
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
  value: CustomerPurchaseItem["evidence"][number],
): string {
  if (value === "subscriber_api") return "Subscriber purchases API";
  if (value === "event") return "Customer event";
  return "Profile hint";
}

export default function CustomerPurchaseDetailsExpandedRow({
  purchase,
}: CustomerPurchaseDetailsExpandedRowProps) {
  return (
    <div
      style={{ backgroundColor: color.surface.tablebodybg }}
      className="px-6 py-6"
    >
      <div className="space-y-6">
        <div>
          <SectionHeading>Transaction</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Transaction ID">
              {displayValue(purchase.transactionId)}
            </DetailField>
            <DetailField label="Status">
              {humanizePurchaseStatus(purchase.status)}
              {purchase.verification === "hint" ? " · Unverified" : ""}
            </DetailField>
            <DetailField label="Purchased">
              {purchase.purchasedAt ? (
                <DateFormatter
                  date={purchase.purchasedAt}
                  includeTime
                  useUserTimezone
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Amount">
              {purchase.amount != null ? (
                <CurrencyFormatter
                  amount={purchase.amount}
                  currencyCode={purchase.currency || undefined}
                />
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Payment method">
              {humanizePaymentMethod(purchase.paymentMethod)}
            </DetailField>
            <DetailField label="Quantity">
              {purchase.quantity != null
                ? purchase.quantity.toLocaleString()
                : "—"}
            </DetailField>
            <DetailField label="Channel">
              {purchase.channel ? humanizeChannel(purchase.channel) : "—"}
            </DetailField>
            <DetailField label="Type">
              {humanizePurchaseKind(purchase.kind)}
            </DetailField>
            <DetailField label="Evidence">
              {purchase.evidence.length > 0
                ? purchase.evidence.map(evidenceLabel).join(", ")
                : "—"}
            </DetailField>
            <DetailField label="Verification">
              {purchase.verification === "verified"
                ? "Verified against transactions or events"
                : "Profile hint only"}
            </DetailField>
          </div>
        </div>

        <div>
          <SectionHeading>Product & campaign</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailField label="Product">
              {purchase.productId ? (
                <CustomerProfileEntityLink
                  to={`/dashboard/products/${purchase.productId}`}
                  className="font-medium hover:underline"
                  style={{ color: color.primary.action }}
                >
                  {purchase.productName}
                </CustomerProfileEntityLink>
              ) : (
                displayValue(purchase.productName)
              )}
            </DetailField>
            <DetailField label="Product code">
              {displayValue(purchase.productCode)}
            </DetailField>
            <DetailField label="Product type">
              {displayValue(purchase.productType)}
            </DetailField>
            <DetailField label="Offer">
              {purchase.offerId ? (
                <CustomerProfileEntityLink
                  to={`/dashboard/offers/${purchase.offerId}`}
                  className="font-medium hover:underline"
                  style={{ color: color.primary.action }}
                >
                  {purchase.offerName || `Offer #${purchase.offerId}`}
                </CustomerProfileEntityLink>
              ) : (
                displayValue(purchase.offerName)
              )}
            </DetailField>
            <DetailField label="Campaign">
              {purchase.campaignId ? (
                <CustomerProfileEntityLink
                  to={`/dashboard/campaigns/${purchase.campaignId}`}
                  className="font-medium hover:underline"
                  style={{ color: color.primary.action }}
                >
                  {purchase.campaignName || `Campaign #${purchase.campaignId}`}
                </CustomerProfileEntityLink>
              ) : (
                displayValue(purchase.campaignName)
              )}
            </DetailField>
            <DetailField label="Related event">
              {displayValue(purchase.eventId)}
            </DetailField>
          </div>
        </div>
      </div>
    </div>
  );
}
