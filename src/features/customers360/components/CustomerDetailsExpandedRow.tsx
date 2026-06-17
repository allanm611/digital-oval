import { color, tw } from "../../../shared/utils/utils";
import type { CustomerSubscriptionRecord } from "../utils/customerSubscriptionHelpers";
import DateFormatter from "../../../shared/components/DateFormatter";

interface CustomerDetailsExpandedRowProps {
  customer: CustomerSubscriptionRecord | any;
  colSpan: number;
}

export default function CustomerDetailsExpandedRow({
  customer,
  colSpan,
}: CustomerDetailsExpandedRowProps) {
  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return String(value);
  };

  const displayCustomer = customer;

  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayCustomer.msisdn && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Phone (MSISDN)
            </label>
            <div className={`text-sm ${tw.textPrimary} font-mono`}>
              {formatValue(displayCustomer.msisdn)}
            </div>
          </div>
        )}

        {displayCustomer.email && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Email
            </label>
            <div className={`text-sm ${tw.textPrimary} break-words`}>
              {formatValue(displayCustomer.email)}
            </div>
          </div>
        )}

        {(displayCustomer.alternateEmail || displayCustomer.alternatemsisdns) && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Alternate Email
            </label>
            <div className={`text-sm ${tw.textPrimary} break-words`}>
              {formatValue(displayCustomer.alternateEmail || displayCustomer.alternatemsisdns)}
            </div>
          </div>
        )}

        {displayCustomer.physicalAddress && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Address
            </label>
            <div className={`text-sm ${tw.textPrimary} break-words`}>
              {formatValue(displayCustomer.physicalAddress)}
            </div>
          </div>
        )}

        {displayCustomer.city && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              City
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(displayCustomer.city)}
            </div>
          </div>
        )}

        {displayCustomer.region && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Region
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(displayCustomer.region)}
            </div>
          </div>
        )}

        {displayCustomer.postalCode && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Postal Code
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(displayCustomer.postalCode)}
            </div>
          </div>
        )}

        {displayCustomer.countryCode && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Country
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(displayCustomer.countryCode)}
            </div>
          </div>
        )}

        {displayCustomer.gender && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Gender
            </label>
            <div className={`text-sm ${tw.textPrimary} capitalize`}>
              {formatValue(displayCustomer.gender)}
            </div>
          </div>
        )}

        {displayCustomer.birthDate && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Date of Birth
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(displayCustomer.birthDate)}
            </div>
          </div>
        )}

        {(displayCustomer.languagePreference || displayCustomer.preferredLanguage) && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Language Preference
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(displayCustomer.languagePreference || displayCustomer.preferredLanguage)}
            </div>
          </div>
        )}

        {displayCustomer.timezone && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Timezone
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(displayCustomer.timezone)}
            </div>
          </div>
        )}

        {displayCustomer.preferredChannel && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Preferred Channel
            </label>
            <div className={`text-sm ${tw.textPrimary} uppercase`}>
              {formatValue(displayCustomer.preferredChannel)}
            </div>
          </div>
        )}

        {displayCustomer.customerTier && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Customer Tier
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(displayCustomer.customerTier)}
            </div>
          </div>
        )}

        {displayCustomer.tariff && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Tariff
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(displayCustomer.tariff)}
            </div>
          </div>
        )}

        {displayCustomer.customerType && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Customer Type
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(displayCustomer.customerType)}
            </div>
          </div>
        )}

        {displayCustomer.activationDate && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Activation Date
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(displayCustomer.activationDate)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
