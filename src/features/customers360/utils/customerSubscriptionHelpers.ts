import type { CustomerSubscriptionRecord } from "../types/customerSubscription";

// Local type definition to avoid circular imports with ReportsAPI
export interface CustomerRow {
  id: string;
  name: string;
  segment: string;
  segments?: string[];
  email?: string;
  phone?: string;
  msisdn?: string;
  lifetimeValue: number;
  clv: number;
  orders: number;
  aov: number;
  lastPurchase: string;
  lastInteractionDate: string;
  engagementScore: number;
  churnRisk: number;
  preferredChannel?: "Email" | "SMS" | "Push";
  location: string;
}

export const getSubscriptionDisplayName = (
  record: CustomerSubscriptionRecord,
  fallback = "Customer",
) => {
  const parts = [record.firstName, record.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : fallback;
};

export const formatMsisdn = (value?: string | number | null) => {
  if (!value) return "—";
  const digits = value.toString().replace(/\D/g, "");
  return digits ? digits : "—";
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const deriveChurnRisk = (status?: string | null) => {
  const normalized = status?.toLowerCase();
  if (normalized === "active") return 20;
  if (normalized === "pending") return 45;
  if (
    normalized &&
    ["deactivation", "deactivating", "suspending"].includes(normalized)
  ) {
    return 75;
  }
  return 60;
};

export const convertSubscriptionToCustomerRow = (
  record: CustomerSubscriptionRecord,
): CustomerRow => {
  const name = getSubscriptionDisplayName(
    record,
    `Customer ${record.customerId}`,
  );

  const activationDate = record.activationDate
    ? new Date(record.activationDate)
    : record.created_at
    ? new Date(record.created_at)
    : null;
  const lastInteractionDate = activationDate
    ? activationDate.toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  // Calculate real metrics from API response
  const totalRevenue = (
    parseFloat(record.total_data_revenue_new || "0") +
    parseFloat(record.total_voice_revenue_new || "0")
  );
  const currentBalance = parseFloat(record.current_balance || "0");
  const smsUsage = record.total_sms_usage_new || 0;
  const dataUsage = parseFloat(record.total_dou || "0");

  // Derive engagement score from usage patterns
  const engagementScore = Math.min(
    100,
    Math.round(
      (smsUsage > 0 ? 20 : 0) +
      (dataUsage > 0 ? 30 : 0) +
      (totalRevenue > 0 ? 50 : 0)
    )
  );

  return {
    id: record.id || record.customerId.toString(),
    name,
    email: record.email || record.email_address,
    segment: record.customerType || undefined,
    lifetimeValue: currentBalance,
    clv: totalRevenue,
    orders: smsUsage,
    aov: smsUsage > 0 ? totalRevenue / smsUsage : 0,
    lastPurchase: activationDate
      ? activationDate.toLocaleDateString("en-KE")
      : "—",
    lastInteractionDate,
    engagementScore,
    churnRisk: deriveChurnRisk(record.subscriber_status || record.status),
    preferredChannel: (record.preferred_channel as "Email" | "SMS" | "Push") || (record.preferred_language as "Email" | "SMS" | "Push"),
    location: record.city || undefined,
    msisdn: record.msisdn ? record.msisdn.toString() : undefined,
  };
};

export const searchCustomers = (
  searchTerm: string,
  customers: CustomerRow[],
): CustomerRow[] => {
  const lowerSearchTerm = searchTerm.toLowerCase();
  return customers.filter((customer) => {
    return (
      (customer.name && customer.name.toLowerCase().includes(lowerSearchTerm)) ||
      (customer.msisdn && customer.msisdn.toLowerCase().includes(lowerSearchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(lowerSearchTerm)) ||
      (customer.segment && customer.segment.toLowerCase().includes(lowerSearchTerm))
    );
  });
};
