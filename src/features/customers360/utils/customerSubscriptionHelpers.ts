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
  preferredChannel: "Email" | "SMS" | "Push";
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
    : null;
  const lastInteractionDate = activationDate
    ? activationDate.toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return {
    id: record.customerId.toString(),
    name,
    segment: record.customerType ?? "General",
    lifetimeValue: 0,
    clv: 0,
    orders: 0,
    aov: 0,
    lastPurchase: activationDate
      ? activationDate.toLocaleDateString("en-KE")
      : "—",
    lastInteractionDate,
    engagementScore: 70,
    churnRisk: deriveChurnRisk(record.status),
    preferredChannel: "SMS",
    location: record.city ?? "Nairobi, KE",
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
      customer.name.toLowerCase().includes(lowerSearchTerm) ||
      customer.msisdn?.includes(lowerSearchTerm) ||
      customer.email?.toLowerCase().includes(lowerSearchTerm) ||
      customer.segment.toLowerCase().includes(lowerSearchTerm)
    );
  });
};
