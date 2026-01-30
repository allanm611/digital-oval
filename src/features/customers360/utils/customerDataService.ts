import customerSubscriptionsData from "../data/customerSubscriptions.json";
import type { CustomerSubscriptionRecord } from "../types/customerSubscription";

// Export the customer data source
export const customerSubscriptions: CustomerSubscriptionRecord[] = (
  customerSubscriptionsData as CustomerSubscriptionRecord[]
).map((record) => ({
  ...record,
  msisdn: record.msisdn ? String(record.msisdn) : undefined,
}));

// Shared search function that can be used across components
export const searchCustomers = (
  term: string,
  customers: CustomerSubscriptionRecord[] = customerSubscriptions
): CustomerSubscriptionRecord[] => {
  if (!term.trim()) return customers;

  const normalizedTerm = term.toLowerCase();
  const numericTerm = term.replace(/\D/g, "");

  return customers.filter((customer) => {
    const customerName = `${customer.firstName ?? ""} ${
      customer.lastName ?? ""
    }`
      .trim()
      .toLowerCase();
    const matchesName =
      customerName.length > 0 && customerName.includes(normalizedTerm);
    const matchesEmail = customer.email
      ? customer.email.toLowerCase().includes(normalizedTerm)
      : false;
    const matchesCustomerType = customer.customerType
      ? customer.customerType.toLowerCase().includes(normalizedTerm)
      : false;
    const matchesTariff = customer.tariff
      ? customer.tariff.toLowerCase().includes(normalizedTerm)
      : false;
    const matchesCity = customer.city
      ? customer.city.toLowerCase().includes(normalizedTerm)
      : false;
    const matchesCustomerId =
      numericTerm.length > 0 &&
      customer.customerId.toString().includes(numericTerm);
    const matchesSubscriptionId =
      numericTerm.length > 0 &&
      customer.subscriptionId.toString().includes(numericTerm);

    const msisdnDigits = customer.msisdn
      ? customer.msisdn.toString().replace(/\D/g, "")
      : "";
    const matchesMsisdn =
      numericTerm.length > 0 && msisdnDigits.includes(numericTerm);

    return (
      matchesName ||
      matchesEmail ||
      matchesCustomerType ||
      matchesTariff ||
      matchesCity ||
      matchesCustomerId ||
      matchesSubscriptionId ||
      matchesMsisdn
    );
  });
};
