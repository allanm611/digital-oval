import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Upload,
  Users,
  Download,

} from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { isValidCountryCodePhone } from "../../../shared/utils/validation";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { customerService } from "../services/customerServices";
import type { CustomerSubscriptionRecord } from "../types/customerSubscription";
import type { CustomerFormData } from "../types/customer";

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomersAdded: (customers: CustomerSubscriptionRecord[]) => void;
  existingCustomers?: CustomerSubscriptionRecord[];
}

type FormData = CustomerFormData;


function formatPhoneNumber(msisdn: string): string {
  if (!msisdn) return msisdn;

  // Remove non-digits and any + prefix
  const cleaned = msisdn.replace(/\D/g, "");

  // Return cleaned digits (validation happens in form validation)
  return cleaned;
}

type TabType = "single" | "bulk" | "import";

// Options from actual dummy data
const GENDER_OPTIONS = [
  { value: "", label: "Select Gender" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
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
  { value: "SMS", label: "SMS" },
  { value: "USSD", label: "USSD" },
  { value: "APP", label: "APP" },
  { value: "EMAIL", label: "EMAIL" },
  { value: "WHATSAPP", label: "WhatsApp" },
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
  preferredChannel: "SMS",
  timezone: "Africa/Kampala",
};

/**
 * Get the next sequential subscription ID based on existing customers
 */
function getNextSubscriptionId(
  existingCustomers: CustomerSubscriptionRecord[] = [],
): number {
  if (existingCustomers.length === 0) return 1;
  const maxId = Math.max(...existingCustomers.map((c) => c.subscriptionId));
  return maxId + 1;
}

export default function CreateCustomerModal({
  isOpen,
  onClose,
  onCustomersAdded,
  existingCustomers = [],
}: CreateCustomerModalProps) {
  const { success, error } = useToast();
  const nextSubscriptionId = useMemo(
    () => getNextSubscriptionId(existingCustomers),
    [existingCustomers],
  );
  const [activeTab, setActiveTab] = useState<TabType>("single");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [bulkText, setBulkText] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileDelimiter, setImportFileDelimiter] = useState(",");
  const [importPreview, setImportPreview] = useState<{
    valid: number;
    invalid: number;
    rows: any[];
    headers: string[];
  } | null>(null);

  // Real-time bulk data parsing and validation
  const bulkValidation = useMemo(() => {
    if (!bulkText.trim()) {
      return { valid: 0, invalid: 0, rows: [], headers: [] };
    }

    const lines = bulkText.split("\n").filter((line) => line.trim());

    const rows = lines.slice(1).map((line, index) => {
      const parts = line.split(",").map((p) => p.trim());
      const hasMinimumFields =
        parts.length >= 4 && parts[0] && parts[1] && parts[2] && parts[3];

      if (!hasMinimumFields) {
        return {
          rowNum: index + 1,
          valid: false,
          error: "Missing required fields (SubID, FirstName, LastName, Phone)",
          data: parts,
        };
      }

      // Validate subscription ID is numeric
      if (!/^\d+$/.test(parts[0])) {
        return {
          rowNum: index + 1,
          valid: false,
          error: "Subscription ID must be numeric",
          data: parts,
        };
      }

      // Validate phone number has country code
      if (!isValidCountryCodePhone(parts[3])) {
        return {
          rowNum: index + 1,
          valid: false,
          error: "Phone number must begin with country code",
          data: parts,
        };
      }

      // Successfully mapped customer
      return {
        rowNum: index + 1,
        valid: true,
        data: [
          parts[0],
          parts[1],
          parts[2],
          parts[3],
          parts[4] || "—",
          parts[5] || "—",
          parts[6] || "—",
          parts[7] || "—",
          parts[8] || "—",
          parts[9] || "—",
          parts[10] || "—",
          parts[11] || "—",
          parts[12] || "—",
          parts[13] || "—",
        ],
        customer: {
          subscriptionId: parts[0],
          firstName: parts[1],
          lastName: parts[2],
          msisdn: parts[3],
          alternatemsisdns: parts[4] || undefined,
          email: parts[5] || undefined,
          alternateEmail: parts[6] || undefined,
          gender: parts[7] || undefined,
          dateOfBirth: parts[8] || undefined,
          languagePreference: parts[9] || "en",
          city: parts[10] || undefined,
          physicalAddress: parts[11] || undefined,
          region: parts[12] || undefined,
          postalCode: parts[13] || undefined,
        },
      };
    });

    const validRows = rows.filter((r) => r.valid).length;
    const invalidRows = rows.filter((r) => !r.valid).length;

    return {
      valid: validRows,
      invalid: invalidRows,
      rows,
      headers: [
        "SubID",
        "FirstName",
        "LastName",
        "Phone",
        "AlternatePhone",
        "Email",
        "AlternateEmail",
        "Gender",
        "DateOfBirth",
        "LanguagePreference",
        "City",
        "PhysicalAddress",
        "Region",
        "PostalCode",
      ],
    };
  }, [bulkText]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Sanitize MSISDN: remove '+' prefix and keep only numbers
    let sanitizedValue = value;
    if (name === "msisdn") {
      sanitizedValue = value.replace(/^\+/, "").replace(/\D/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const validateSingleCustomer = (): boolean => {
    if (!formData.subscriptionId.trim()) {
      error("Validation Error", "Subscription ID is required");
      return false;
    }
    if (!/^\d+$/.test(formData.subscriptionId)) {
      error("Validation Error", "Subscription ID must be numeric");
      return false;
    }
    if (!formData.firstName.trim()) {
      error("Validation Error", "First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      error("Validation Error", "Last name is required");
      return false;
    }
    if (!formData.msisdn.trim()) {
      error("Validation Error", "Phone number is required");
      return false;
    }
    if (!isValidCountryCodePhone(formData.msisdn)) {
      error(
        "Validation Error",
        "Phone number must begin with country code",
      );
      return false;
    }
    return true;
  };

  const handleAddSingle = async () => {
    if (!validateSingleCustomer()) return;

    setIsLoading(true);
    try {
      // Format phone number - removes + and keeps only digits
      const msisdnForApi = formatPhoneNumber(formData.msisdn);

      // Use user-provided subscription ID (converted to number)
      const subscriberId = parseInt(formData.subscriptionId, 10);

      // Call API to create customer with all fields
      const apiResponse = await customerService.createCustomer({
        subscriber_id: subscriberId,
        msisdn: msisdnForApi,
        attributes: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || undefined,
          alternate_email: formData.alternateEmail || undefined,
          alternate_msisdns: formData.alternatemsisdns || undefined,
          gender: formData.gender || undefined,
          date_of_birth: formData.dateOfBirth || undefined,
          language_preference: formData.languagePreference || "en",
          city: formData.city || undefined,
          region: formData.region || undefined,
          postal_code: formData.postalCode || undefined,
          country_code: formData.countryCode || undefined,
          physical_address: formData.physicalAddress || undefined,
          customer_tier: formData.customerTier || undefined,
          preferred_channel: formData.preferredChannel || "SMS",
          timezone: formData.timezone || "Africa/Kampala",
          device_type: "unknown",
          premium_user: false,
        },
      });

      // Create local customer record for display (includes form-specific fields)
      // API returns subscriber_id as string, convert to number for consistency
      const apiSubscriberId =
        typeof apiResponse.data.subscriber_id === "string"
          ? parseInt(apiResponse.data.subscriber_id, 10)
          : apiResponse.data.subscriber_id;

      const newCustomer: CustomerSubscriptionRecord = {
        customerId: apiSubscriberId,
        subscriptionId: subscriberId,
        // Use API response attributes where available
        firstName:
          apiResponse.data.attributes?.first_name || formData.firstName,
        lastName: apiResponse.data.attributes?.last_name || formData.lastName,
        msisdn: msisdnForApi,
        email:
          apiResponse.data.attributes?.email || formData.email || undefined,
        activationDate: apiResponse.data.created_at || new Date().toISOString(),
      };

      // Add to local storage and state
      onCustomersAdded([newCustomer]);
      success("Success", "Customer added successfully");

      // Reset form
      setFormData(initialFormData);
      onClose();
    } catch (err) {
      error(
        "Error",
        err instanceof Error ? err.message : "Failed to create customer",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBulk = async () => {
    if (!bulkText.trim()) {
      error("Validation Error", "Please enter customer data");
      return;
    }

    setIsLoading(true);
    try {
      const lines = bulkText
        .split("\n")
        .filter((line) => line.trim())
        .slice(1); // Skip header if present

      // Prepare data for API
      const profiles: { msisdn: string; attributes?: Record<string, any> }[] =
        [];
      const customers: CustomerSubscriptionRecord[] = [];

      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 4) continue; // Skip incomplete lines (need SubID, FirstName, LastName, Phone)

        // Validate subscription ID is numeric
        if (!/^\d+$/.test(parts[0])) continue;

        // Parse subscription ID from first column
        const subscriptionId = parseInt(parts[0], 10);

        // Format MSISDN for API - removes + and keeps only digits
        const msisdnForApi = formatPhoneNumber(parts[3]);

        // Add to API profiles array
        profiles.push({
          msisdn: msisdnForApi,
          attributes: {
            first_name: parts[1] || "Unknown",
            last_name: parts[2] || "Customer",
            email: parts[5] || undefined,
            device_type: "unknown",
            premium_user: false,
          },
        });

        // Prepare local customer record
        const customer: CustomerSubscriptionRecord = {
          customerId: subscriptionId,
          subscriptionId: subscriptionId,
          firstName: parts[1] || "Unknown",
          lastName: parts[2] || "Customer",
          msisdn: msisdnForApi,
          email: parts[5] || undefined,
          activationDate: new Date().toISOString(),
        };
        customers.push(customer);
      }

      if (customers.length === 0) {
        error("Validation Error", "No valid customer data found");
        return;
      }

      // Call API to bulk create customers
      await customerService.bulkCreateCustomers({ profiles });

      // Add to local list
      onCustomersAdded(customers);
      success("Success", `${customers.length} customer(s) added successfully`);

      // Reset
      setBulkText("");
      onClose();
    } catch (err) {
      error(
        "Error",
        err instanceof Error ? err.message : "Failed to import customers",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFile = async () => {
    if (!importFile) {
      error("Validation Error", "Please select a file");
      return;
    }

    setIsLoading(true);
    try {
      const text = await importFile.text();
      // Process file
      const lines = text
        .split("\n")
        .filter((line) => line.trim())
        .slice(1);

      // Prepare data for API
      const profiles: { msisdn: string; attributes?: Record<string, any> }[] =
        [];
      const customers: CustomerSubscriptionRecord[] = [];

      for (const line of lines) {
        const parts = line.split(importFileDelimiter).map((p) => p.trim());
        if (parts.length < 4) continue;

        // Validate subscription ID is numeric
        if (!/^\d+$/.test(parts[0])) continue;

        // Parse subscription ID from first column
        const subscriptionId = parseInt(parts[0], 10);

        // Format MSISDN for API - removes + and keeps only digits
        const msisdnForApi = formatPhoneNumber(parts[3]);

        // Add to API profiles array
        profiles.push({
          msisdn: msisdnForApi,
          attributes: {
            first_name: parts[1] || "Unknown",
            last_name: parts[2] || "Customer",
            email: parts[5] || undefined,
            device_type: "unknown",
            premium_user: false,
          },
        });

        // Prepare local customer record
        const customer: CustomerSubscriptionRecord = {
          customerId: subscriptionId,
          subscriptionId: subscriptionId,
          firstName: parts[1] || "Unknown",
          lastName: parts[2] || "Customer",
          msisdn: msisdnForApi,
          email: parts[5] || undefined,
          activationDate: new Date().toISOString(),
        };
        customers.push(customer);
      }

      if (customers.length === 0) {
        error("Validation Error", "No valid customer data found in file");
        return;
      }

      // Call API to bulk create customers
      await customerService.bulkCreateCustomers({ profiles });

      // Add to local list
      onCustomersAdded(customers);
      success(
        "Success",
        `${customers.length} customer(s) imported successfully`,
      );

      // Reset
      setImportFile(null);
      onClose();
    } catch (err) {
      error(
        "Error",
        err instanceof Error ? err.message : "Failed to import file",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: zIndex.modal,
      }}
    >
      <div
        className={`bg-white ${tw.rounded}  max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
        style={{ zIndex: zIndex.modal + 1 }}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${tw.borderDefault}`}
        >
          <div>
            <h2 className={`text-xl font-bold ${tw.textPrimary}`}>
              Add Customer
            </h2>
            <p className={`${tw.textSecondary} text-sm mt-1`}>
              Add new customers individually, in bulk, or import from file
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

        {/* Tabs */}
        <div className="border-b" style={{ borderColor: color.border.default }}>
          <div className="flex gap-0">
            {[
              { id: "single", label: "Single Customer", icon: Plus },
              { id: "bulk", label: "Bulk Addition", icon: Users },
              { id: "import", label: "Import File", icon: Upload },
            ].map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as TabType)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative flex-shrink-0 ${
                    isActive
                      ? "text-black"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: color.primary.accent }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <form className="p-6 space-y-4">
          {/* Single Customer Tab */}
          {activeTab === "single" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                  >
                    Subscription ID *
                  </label>
                  <input
                    type="text"
                    name="subscriptionId"
                    value={formData.subscriptionId}
                    onChange={handleInputChange}
                    placeholder="Enter Subscription ID"
                    className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                  >
                    Phone Number (MSISDN) *
                  </label>
                  <input
                    type="text"
                    name="msisdn"
                    value={formData.msisdn}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                  />
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="mt-6">
                <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
                  Personal Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First Name"
                      className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last Name"
                      className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Alternate Phone Numbers (MSISDN)
                    </label>
                    <input
                      type="text"
                      name="alternatemsisdns"
                      value={formData.alternatemsisdns}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
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

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Alternate Email
                    </label>
                    <input
                      type="email"
                      name="alternateEmail"
                      value={formData.alternateEmail}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
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

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                />
              </div>

              {/* Address Section */}
              <div className="mt-6">
                <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
                  Address Information
                </h3>

                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                  >
                    Physical Address
                  </label>
                  <textarea
                    name="physicalAddress"
                    value={formData.physicalAddress}
                    onChange={handleInputChange}
                    placeholder="Street address"
                    rows={2}
                    className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Region
                    </label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      placeholder="Region/State"
                      className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="Postal code"
                      className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                  >
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
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
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
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
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

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
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
              </div>
            </>
          )}

          {/* Bulk Addition Tab */}
          {activeTab === "bulk" && (
            <div>
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
                  Required Fields
                </p>
                <div className="flex flex-wrap gap-2">
                  {["SubID", "FirstName", "LastName", "Phone"].map((field) => (
                    <span
                      key={field}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Paste Customer Data
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="SubID,FirstName,LastName,Phone,AlternatePhone,Email,AlternateEmail,Gender,DateOfBirth,LanguagePreference,City,PhysicalAddress,Region,PostalCode,CountryCode,CustomerTier,PreferredChannel,Timezone&#10;1001,David,Kipchoge,254750902921,254712345679,david.kipchoge@email.com,david.alt@email.com,Male,1990-05-15,en,Nairobi,123 Kenyatta Ave,Nairobi,00100,KEN,Gold,SMS,Africa/Nairobi"
                className={`w-full px-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm font-mono`}
                rows={8}
              />

              {/* Real-time Validation Feedback */}
              {bulkText.trim() && (
                <div className="mt-4 space-y-3">
                  {/* Status Text */}
                  <p className="text-sm font-medium text-gray-700">
                    <span className="text-green-600">
                      {bulkValidation.valid} valid
                    </span>
                    {bulkValidation.invalid > 0 && (
                      <span className="text-red-600 ml-3">
                        {bulkValidation.invalid} invalid
                      </span>
                    )}
                  </p>

                  {/* Issues */}
                  {bulkValidation.invalid > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs max-h-24 overflow-y-auto">
                      {bulkValidation.rows
                        .filter((r) => !r.valid)
                        .map((row, idx) => (
                          <p key={idx} className="text-red-600 mb-1">
                            Row {row.rowNum}: {row.error}
                          </p>
                        ))}
                    </div>
                  )}

                  {/* Preview Table */}
                  {bulkValidation.valid > 0 && (
                    <div className="mt-3">
                      <label className="text-sm font-medium text-black mb-2 block">
                        Data Preview
                      </label>
                      <div
                        className={`overflow-x-auto border border-gray-200 ${tw.rounded}`}
                      >
                        <table className="w-full text-sm">
                          <thead
                            style={{ background: color.surface.tableHeader }}
                          >
                            <tr>
                              {bulkValidation.headers.map((header, idx) => (
                                <th
                                  key={idx}
                                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b border-gray-200"
                                  style={{
                                    color: color.surface.tableHeaderText,
                                  }}
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {bulkValidation.rows
                              .filter((r) => r.valid)
                              .map((row, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                  style={{
                                    backgroundColor: color.surface.tablebodybg,
                                  }}
                                >
                                  {row.data?.map((cell, cellIdx) => (
                                    <td
                                      key={cellIdx}
                                      className="px-3 py-2 text-xs whitespace-nowrap"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      {bulkValidation.valid > 10 && (
                        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
                          Showing all {bulkValidation.valid} customer(s)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Import File Tab */}
          {activeTab === "import" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <label
                  className={`block text-sm font-medium ${tw.textPrimary}`}
                >
                  Upload CSV File
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const sampleData = `SubID,FirstName,LastName,Phone,AlternatePhone,Email,AlternateEmail,Gender,DateOfBirth,LanguagePreference,City,PhysicalAddress,Region,PostalCode,CountryCode,CustomerTier,PreferredChannel,Timezone
1001,David,Kipchoge,254750902921,254712345679,david.kipchoge@email.com,david.alt@email.com,Male,1990-05-15,en,Nairobi,123 Kenyatta Ave,Nairobi,00100,KEN,Gold,SMS,Africa/Nairobi
1002,Grace,Wanjiru,254712345678,254712345680,grace.wanjiru@email.com,grace.alt@email.com,Female,1992-03-20,en,Mombasa,456 Nkrumah Rd,Mombasa,80100,KEN,VIP,EMAIL,Africa/Nairobi
1003,Peter,Ochieng,254734567890,254734567891,peter.ochieng@email.com,,Male,1988-12-10,en,Kisumu,789 Oginga Odinga,Kisumu,40100,KEN,Regular,USSD,Africa/Nairobi
1004,Fatima,Hassan,254720123456,,fatima.hassan@email.com,fatima.alt@email.com,Female,1995-07-25,en,Mombasa,321 Abdel Nasser,Mombasa,80200,KEN,Gold,SMS,Africa/Nairobi`;
                    const blob = new Blob([sampleData], { type: "text/csv" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "sample_customers.csv";
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium ${tw.rounded} transition-colors`}
                  style={{
                    backgroundColor: color.primary.accent,
                    color: "white",
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download Sample
                </button>
              </div>
              <div
                className={`border-2 border-dashed ${tw.rounded} p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
                style={{ borderColor: color.border.default }}
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <Upload className={`w-8 h-8 ${tw.textMuted} mx-auto mb-2`} />
                <p className={`text-sm ${tw.textPrimary} font-medium`}>
                  {importFile
                    ? importFile.name
                    : "Click to select or drag a CSV file"}
                </p>
                <p className={`text-xs ${tw.textSecondary} mt-1`}>
                  CSV file with columns: SubID*, FirstName*, LastName*, Phone* (country code 254, etc), AlternatePhone, Email, AlternateEmail, Gender, DateOfBirth, LanguagePreference, City, PhysicalAddress, Region, PostalCode, CountryCode, CustomerTier, PreferredChannel, Timezone (* = required)
                </p>
              </div>
              <input
                id="fileInput"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImportFile(file);

                  // Parse file preview
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      const lines = content
                        .split("\n")
                        .filter((line) => line.trim());
                      const headers = [
                        "SubID",
                        "FirstName",
                        "LastName",
                        "Phone",
                        "AlternatePhone",
                        "Email",
                        "AlternateEmail",
                        "Gender",
                        "DateOfBirth",
                        "LanguagePreference",
                        "City",
                        "PhysicalAddress",
                        "Region",
                        "PostalCode",
                      ];

                      const rows = lines.slice(1).map((line, index) => {
                        const parts = line
                          .split(importFileDelimiter)
                          .map((p) => p.trim());
                        const hasMinimumFields =
                          parts.length >= 4 &&
                          parts[0] &&
                          parts[1] &&
                          parts[2] &&
                          parts[3];

                        if (!hasMinimumFields) {
                          return {
                            rowNum: index + 1,
                            valid: false,
                            error: "Missing required fields",
                            data: parts,
                          };
                        }

                        // Validate subscription ID is numeric
                        if (!/^\d+$/.test(parts[0])) {
                          return {
                            rowNum: index + 1,
                            valid: false,
                            error: "Subscription ID must be numeric",
                            data: parts,
                          };
                        }

                        // Validate phone number has country code
                        if (!isValidCountryCodePhone(parts[3])) {
                          return {
                            rowNum: index + 1,
                            valid: false,
                            error: "Phone number must begin with country code",
                            data: parts,
                          };
                        }

                        return {
                          rowNum: index + 1,
                          valid: true,
                          data: [
                            parts[0],
                            parts[1],
                            parts[2],
                            parts[3],
                            parts[4] || "—",
                            parts[5] || "—",
                            parts[6] || "—",
                            parts[7] || "—",
                            parts[8] || "—",
                            parts[9] || "en",
                            parts[10] || "—",
                            parts[11] || "—",
                            parts[12] || "—",
                            parts[13] || "—",
                          ],
                        };
                      });

                      const validRows = rows.filter((r) => r.valid).length;
                      const invalidRows = rows.filter((r) => !r.valid).length;

                      setImportPreview({
                        valid: validRows,
                        invalid: invalidRows,
                        rows,
                        headers,
                      });
                    };
                    reader.readAsText(file);
                  } else {
                    setImportPreview(null);
                  }
                }}
                className="hidden"
              />

              {/* Import Preview */}
              {importPreview && (
                <div className="mt-4 space-y-3">
                  {/* Status Text */}
                  <p className="text-sm font-medium text-gray-700">
                    <span className="text-green-600">
                      {importPreview.valid} valid
                    </span>
                    {importPreview.invalid > 0 && (
                      <span className="text-red-600 ml-3">
                        {importPreview.invalid} invalid
                      </span>
                    )}
                  </p>

                  {/* Issues */}
                  {importPreview.invalid > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs max-h-24 overflow-y-auto">
                      {importPreview.rows
                        .filter((r) => !r.valid)
                        .map((row, idx) => (
                          <p key={idx} className="text-red-600 mb-1">
                            Row {row.rowNum}: {row.error}
                          </p>
                        ))}
                    </div>
                  )}

                  {/* Preview Table */}
                  {importPreview.valid > 0 && (
                    <div>
                      <label className="text-sm font-medium text-black mb-2 block">
                        Data Preview
                      </label>
                      <div
                        className={`overflow-x-auto border border-gray-200 ${tw.rounded}`}
                      >
                        <table className="w-full text-sm">
                          <thead
                            style={{ background: color.surface.tableHeader }}
                          >
                            <tr>
                              {importPreview.headers.map((header, idx) => (
                                <th
                                  key={idx}
                                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b border-gray-200"
                                  style={{
                                    color: color.surface.tableHeaderText,
                                  }}
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.rows
                              .filter((r) => r.valid)
                              .map((row, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                  style={{
                                    backgroundColor: color.surface.tablebodybg,
                                  }}
                                >
                                  {row.data?.map((cell, cellIdx) => (
                                    <td
                                      key={cellIdx}
                                      className="px-3 py-2 text-xs whitespace-nowrap"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className={`flex gap-3 p-6`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 border ${tw.borderDefault} ${tw.textSecondary} ${tw.rounded} hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeTab === "single") handleAddSingle();
              else if (activeTab === "bulk") handleAddBulk();
              else if (activeTab === "import") handleImportFile();
            }}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 ${tw.rounded} text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
            style={{ backgroundColor: color.primary.action }}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {activeTab === "single"
                  ? "Add Single Customer"
                  : activeTab === "bulk"
                    ? "Add Bulk"
                    : "Add Bulk"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
