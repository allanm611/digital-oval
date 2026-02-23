import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { isValidCountryCodePhone } from "../../../shared/utils/validation";
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

const GENDER_OPTIONS = [
  { value: "", label: "Select Gender" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "sw", label: "Swahili" },
  { value: "fr", label: "French" },
];

const COUNTRY_OPTIONS = [
  { value: "UGA", label: "Uganda" },
  { value: "KEN", label: "Kenya" },
  { value: "TZA", label: "Tanzania" },
  { value: "RWA", label: "Rwanda" },
];

const CUSTOMER_TIER_OPTIONS = [
  { value: "", label: "Select Tier" },
  { value: "Regular", label: "Regular" },
  { value: "VIP", label: "VIP" },
  { value: "Gold", label: "Gold" },
  { value: "Platinum", label: "Platinum" },
];

const PREFERRED_CHANNEL_OPTIONS = [
  { value: "NORMAL_SMS", label: "Normal SMS" },
  { value: "FLASH_SMS", label: "Flash SMS" },
  { value: "EMAIL", label: "Email" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "PUSH", label: "Push" },
  { value: "USSD", label: "USSD" },
  { value: "INTERACTIVE_USSD", label: "Interactive USSD" },
  { value: "INAPP", label: "In-App" },
  { value: "IVR", label: "IVR" },
  { value: "OBD", label: "OBD" },
  { value: "SHORT_CODE", label: "Short Code" },
];

const TIMEZONE_OPTIONS = [
  { value: "Africa/Kampala", label: "Africa/Kampala" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi" },
  { value: "Africa/Dar_es_Salaam", label: "Africa/Dar es Salaam" },
  { value: "Africa/Kigali", label: "Africa/Kigali" },
];

const initialFormData: FormData = {
  subscriptionId: "",
  firstName: "",
  lastName: "",
  msisdn: "",
  alternatemsisdns: "",
  email: "",
  alternateEmail: "",
  gender: "",
  dateOfBirth: "",
  languagePreference: "en",
  city: "",
  physicalAddress: "",
  region: "",
  postalCode: "",
  countryCode: "",
  customerTier: "",
  preferredChannel: "NORMAL_SMS",
  timezone: "Africa/Kampala",
};

export default function EditCustomerModal({
  isOpen,
  onClose,
  customer,
  onCustomerUpdated,
}: EditCustomerModalProps) {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Initialize form data when customer changes - fetch full details from API
  useEffect(() => {
    if (customer && customer.customerId) {
      const fetchCustomerDetails = async () => {
        setIsLoading(true);
        try {
          const response = await customerService.getCustomerById(customer.customerId);
          if (response.success && response.data) {
            const customerData = response.data;
            setFormData({
              subscriptionId: String(customer.subscriptionId || ""),
              firstName: customerData.first_name || customer.firstName || "",
              lastName: customerData.last_name || customer.lastName || "",
              msisdn: customerData.msisdn || customer.msisdn || "",
              alternatemsisdns: Array.isArray(customerData.alternate_msisdns)
                ? customerData.alternate_msisdns.join(", ")
                : "",
              email: customerData.email || customer.email || "",
              alternateEmail: customerData.alternate_email || "",
              gender: customerData.gender || "",
              dateOfBirth: customerData.date_of_birth
                ? new Date(customerData.date_of_birth).toISOString().split("T")[0]
                : "",
              languagePreference: customerData.language_preference || "en",
              city: customerData.city || customer.city || "",
              physicalAddress: customerData.physical_address || "",
              region: customerData.region || "",
              postalCode: customerData.postal_code || "",
              countryCode: customerData.country_code || "",
              customerTier: customerData.customer_tier || "",
              preferredChannel: customerData.preferred_channel || "NORMAL_SMS",
              timezone: customerData.timezone || "Africa/Kampala",
            });
          }
        } catch (err) {
          console.error("Failed to fetch customer details:", err);
          error("Error", "Failed to load customer details");
          // Fallback to local data
          setFormData({
            subscriptionId: String(customer.subscriptionId || ""),
            firstName: customer.firstName || "",
            lastName: customer.lastName || "",
            msisdn: customer.msisdn || "",
            alternatemsisdns: "",
            email: customer.email || "",
            alternateEmail: "",
            gender: "",
            dateOfBirth: "",
            languagePreference: "en",
            city: customer.city || "",
            physicalAddress: "",
            region: "",
            postalCode: "",
            countryCode: "",
            customerTier: "",
            preferredChannel: "NORMAL_SMS",
            timezone: "Africa/Kampala",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchCustomerDetails();
    }
  }, [customer, error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName.trim()) {
      error("Error", "First name is required");
      return;
    }

    if (!formData.lastName.trim()) {
      error("Error", "Last name is required");
      return;
    }

    if (!formData.msisdn) {
      error("Error", "Phone number is required");
      return;
    }

    if (!isValidCountryCodePhone(formData.msisdn)) {
      error("Error", "Phone number must begin with country code");
      return;
    }

    if (!formData.email.trim()) {
      error("Error", "Email is required");
      return;
    }

    setIsLoading(true);
    try {
      if (customer) {
        await customerService.updateCustomer(customer.customerId, {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          alternate_email: formData.alternateEmail || undefined,
          gender: formData.gender || undefined,
          date_of_birth: formData.dateOfBirth || undefined,
          language_preference: formData.languagePreference || "en",
          city: formData.city || undefined,
          physical_address: formData.physicalAddress || undefined,
          region: formData.region || undefined,
          postal_code: formData.postalCode || undefined,
          country_code: formData.countryCode || undefined,
          customer_tier: formData.customerTier || undefined,
          preferred_channel: formData.preferredChannel || "NORMAL_SMS",
          timezone: formData.timezone || "Africa/Kampala",
        });

        const updatedCustomer: CustomerSubscriptionRecord = {
          ...customer,
          firstName: formData.firstName,
          lastName: formData.lastName,
          msisdn: formData.msisdn,
          email: formData.email,
          city: formData.city,
        };

        onCustomerUpdated(updatedCustomer);
        success("Success", "Customer updated successfully");
        onClose();
      }
    } catch (err) {
      error("Error", err instanceof Error ? err.message : "Failed to update customer");
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
        className={`bg-white ${tw.rounded} max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
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

        {/* Loading State */}
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subscription ID & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Subscription ID
              </label>
              <input
                type="text"
                value={formData.subscriptionId}
                disabled
                className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} text-sm bg-gray-100 text-gray-600 cursor-not-allowed`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Phone Number (MSISDN) *
              </label>
              <input
                type="text"
                name="msisdn"
                value={formData.msisdn}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
              />
            </div>
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
              />
            </div>
          </div>

          {/* Alternate Phone & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Alternate Phone Numbers (MSISDN)
              </label>
              <input
                type="text"
                name="alternatemsisdns"
                value={formData.alternatemsisdns}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Gender
              </label>
              <HeadlessSelect
                options={GENDER_OPTIONS}
                value={formData.gender}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    gender: String(value),
                  }))
                }
                zIndex={zIndex.popover}
              />
            </div>
          </div>

          {/* Email & Alternate Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Alternate Email
              </label>
              <input
                type="email"
                name="alternateEmail"
                value={formData.alternateEmail}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
            />
          </div>

          {/* Personal Information Section */}
          <div className="mt-6">
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                  Language Preference
                </label>
                <HeadlessSelect
                  options={LANGUAGE_OPTIONS}
                  value={formData.languagePreference}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      languagePreference: String(value),
                    }))
                  }
                  zIndex={zIndex.popover}
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="mt-6">
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
              Address Information
            </h3>
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Physical Address
              </label>
              <textarea
                name="physicalAddress"
                value={formData.physicalAddress}
                onChange={handleInputChange}
                disabled={isLoading}
                rows={2}
                className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                  Region
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Country
              </label>
              <HeadlessSelect
                options={COUNTRY_OPTIONS}
                value={formData.countryCode}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    countryCode: String(value),
                  }))
                }
                zIndex={zIndex.popover}
              />
            </div>
          </div>

          {/* Account Details Section */}
          <div className="mt-6">
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
              Account Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                  Customer Tier
                </label>
                <HeadlessSelect
                  options={CUSTOMER_TIER_OPTIONS}
                  value={formData.customerTier}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      customerTier: String(value),
                    }))
                  }
                  zIndex={zIndex.popover}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                  Preferred Channel
                </label>
                <HeadlessSelect
                  options={PREFERRED_CHANNEL_OPTIONS}
                  value={formData.preferredChannel}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      preferredChannel: String(value),
                    }))
                  }
                  zIndex={zIndex.popover}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Timezone
              </label>
              <HeadlessSelect
                options={TIMEZONE_OPTIONS}
                value={formData.timezone}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    timezone: String(value),
                  }))
                }
                zIndex={zIndex.popover}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium border ${tw.borderDefault} ${tw.textSecondary} ${tw.rounded} hover:bg-gray-50 transition-colors disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white ${tw.rounded} transition-all disabled:opacity-50 flex items-center gap-2`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isLoading && <LoadingSpinner variant="modern" size="sm" />}
              {isLoading ? "Updating..." : "Update Customer"}
            </button>
          </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
