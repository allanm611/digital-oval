import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { customerService } from "../services/customerServices";
import type { CustomerSubscriptionRecord } from "../types/customerSubscription";
import type { CustomerFormData } from "../types/customer";

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerSubscriptionRecord | null;
  onCustomerUpdated: (customer: CustomerSubscriptionRecord) => void;
}

type FormData = CustomerFormData;

const CUSTOMER_TYPE_OPTIONS = [
  { value: "Non-member", label: "Non-member" },
  { value: "Equity Member", label: "Equity Member" },
  { value: "Equity Corporate/Business", label: "Equity Corporate/Business" },
];

const TARIFF_OPTIONS = [
  { value: "Businesses & Corporate", label: "Businesses & Corporate" },
  { value: "Data SIMs", label: "Data SIMs" },
  {
    value: "Equity Group Employees & Partners",
    label: "Equity Group Employees & Partners",
  },
  { value: "Gumzo", label: "Gumzo" },
  { value: "Gumzo DATA", label: "Gumzo DATA" },
  { value: "High Value Customers", label: "High Value Customers" },
  { value: "Infrastructure SIM", label: "Infrastructure SIM" },
  { value: "Member", label: "Member" },
  { value: "Non-member", label: "Non-member" },
];

const SIM_TYPE_OPTIONS = [
  { value: "2/3/4FF Normal", label: "2/3/4FF Normal" },
  { value: "2/3FF", label: "2/3FF" },
  { value: "2FF", label: "2FF" },
  { value: "4FF", label: "4FF" },
  { value: "4G", label: "4G" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Pending", label: "Pending" },
  { value: "Suspending", label: "Suspending" },
  { value: "Deactivating", label: "Deactivating" },
  { value: "Deactivation", label: "Deactivation" },
];

export default function EditCustomerModal({
  isOpen,
  onClose,
  customer,
  onCustomerUpdated,
}: EditCustomerModalProps) {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    subscriptionId: "",
    firstName: "",
    lastName: "",
    msisdn: "",
    email: "",
    city: "",
    customerType: "Non-member",
    tariff: "Non-member",
    status: "Active",
    simType: "2FF",
  });

  // Initialize form data when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        subscriptionId: String(customer.subscriptionId || ""),
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        msisdn: customer.msisdn || "",
        email: customer.email || "",
        city: customer.city || "",
        customerType: customer.customerType || "Non-member",
        tariff: customer.tariff || "Non-member",
        status: customer.status || "Active",
        simType: customer.simType || "2FF",
      });
    }
  }, [customer, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // MSISDN sanitization - remove '+' and limit to 10-15 digits
    if (name === "msisdn") {
      const cleaned = value.replace(/[^\d]/g, ""); // Remove all non-digits
      if (cleaned.length <= 15) {
        setFormData((prev) => ({ ...prev, [name]: cleaned }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      error("Error", "First and Last names are required");
      return;
    }

    if (
      !formData.msisdn ||
      formData.msisdn.length < 10 ||
      formData.msisdn.length > 15
    ) {
      error("Error", "Phone number must be 10-15 digits (no + prefix)");
      return;
    }

    if (!formData.email.trim()) {
      error("Error", "Email is required");
      return;
    }

    setIsLoading(true);
    try {
      // Call update API
      if (customer) {
        await customerService.updateCustomer(customer.customerId, {
          first_name: formData.firstName,
          last_name: formData.lastName,
          msisdn: formData.msisdn,
          email: formData.email,
          city: formData.city,
          subscriber_type: formData.customerType,
          preferred_channel: formData.tariff,
          subscriber_status: formData.status,
        });

        // Update local state
        const updatedCustomer: CustomerSubscriptionRecord = {
          ...customer,
          firstName: formData.firstName,
          lastName: formData.lastName,
          msisdn: formData.msisdn,
          email: formData.email,
          city: formData.city,
          customerType: formData.customerType,
          tariff: formData.tariff,
          status: formData.status,
          simType: formData.simType,
        };

        onCustomerUpdated(updatedCustomer);
        success("Success", "Customer updated successfully");
        onClose();
      }
    } catch (err) {
      error("Error", "Failed to update customer");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
      onClick={onClose}
    >
      <div
        className={`bg-white ${tw.rounded} max-w-xl w-full max-h-[90vh] overflow-y-auto`}
        style={{ zIndex: zIndex.modal + 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${tw.borderDefault}`}
        >
          <div>
            <h2 className={`text-xl font-bold ${tw.textPrimary}`}>
              Edit Customer
            </h2>
            <p className={`${tw.textSecondary} text-sm mt-1`}>
              Update customer information
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`p-2 hover:bg-gray-50 ${tw.rounded} transition-colors disabled:opacity-50`}
          >
            <X className={`w-5 h-5 ${tw.textMuted}`} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subscription ID and Phone Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-1`}
              >
                Subscriber ID
              </label>
              <input
                type="text"
                name="subscriptionId"
                value={formData.subscriptionId}
                disabled
                className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} text-sm bg-gray-100 text-gray-600 cursor-not-allowed`}
              />
              {/* <p className={`${tw.textSecondary} text-xs mt-1`}>
                System-generated ID (read-only)
              </p> */}
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-1`}
              >
                Phone (MSISDN) *
              </label>
              <input
                type="text"
                name="msisdn"
                value={formData.msisdn}
                className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} text-sm bg-gray-100 text-gray-600 cursor-not-allowed`}
                readOnly
                disabled
              />
              {/* <p className={`${tw.textSecondary} text-xs mt-1`}>
                10-15 digits, no + prefix
              </p> */}
            </div>
          </div>

          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-1`}
              >
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter first name"
                className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-1`}
              >
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter last name"
                className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-1`}
            >
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              placeholder="customer@example.com"
              className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} text-sm bg-gray-100 text-gray-600 cursor-not-allowed`}
              readOnly
              disabled
            />
          </div>

          {/* City */}
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-1`}
            >
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Enter city"
              className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              disabled={isLoading}
            />
          </div>

          {/* Dropdowns Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-1`}
              >
                Customer Type
              </label>
              <HeadlessSelect
                value={formData.customerType}
                onChange={(value) => handleSelectChange("customerType", value)}
                options={CUSTOMER_TYPE_OPTIONS}
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-1`}
              >
                Status
              </label>
              <HeadlessSelect
                value={formData.status}
                onChange={(value) => handleSelectChange("status", value)}
                options={STATUS_OPTIONS}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Tariff and SIM Type Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-1`}
              >
                Tariff
              </label>
              <HeadlessSelect
                value={formData.tariff}
                onChange={(value) => handleSelectChange("tariff", value)}
                options={TARIFF_OPTIONS}
                disabled={isLoading}
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-1`}
              >
                SIM Type
              </label>
              <HeadlessSelect
                value={formData.simType}
                onChange={(value) => handleSelectChange("simType", value)}
                options={SIM_TYPE_OPTIONS}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 ${tw.rounded} transition-colors disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 text-sm text-white ${tw.rounded} transition-all disabled:opacity-50 flex items-center gap-2`}
              style={{
                backgroundColor: isLoading ? "#ccc" : color.primary.action,
              }}
            >
              {isLoading && <LoadingSpinner variant="modern" size="sm" />}
              {isLoading ? "Updating..." : "Update Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
