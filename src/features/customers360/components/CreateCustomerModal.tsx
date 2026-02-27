import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Upload,
  Users,
  Download,

} from "lucide-react";
import countries from "world-countries";
import * as XLSX from "xlsx";
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
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "sw", label: "Swahili" },
  { value: "fr", label: "French" },
];

// Generate countries list from world-countries package
const countriesList = countries.map((country) => ({
  value: country.cca3,
  label: country.name.common,
}));

const COUNTRY_OPTIONS = [
  { value: "", label: "Select Country" },
  ...countriesList,
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
  const [phoneError, setPhoneError] = useState("");
  const [alternatePhoneError, setAlternatePhoneError] = useState("");
  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    msisdn?: string;
    email?: string;
  }>({});
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [importPreview, setImportPreview] = useState<{
    valid: number;
    invalid: number;
    rows: any[];
    headers: string[];
  } | null>(null);
  const [columnMapping, setColumnMapping] = useState<{
    firstName: number;
    lastName: number;
    msisdn: number;
    alternatePhone?: number;
    email?: number;
    alternateEmail?: number;
    gender?: number;
  } | null>(null);
  const [mappingConfirmed, setMappingConfirmed] = useState(false);

  // Helper function to detect column indices from headers
  const detectColumnIndices = (headerRow: string[]) => {
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "");

    const findIndex = (headerRow: string[], keywords: string[]) => {
      return headerRow.findIndex((header) =>
        keywords.some((keyword) => normalize(header).includes(keyword))
      );
    };

    return {
      firstName: findIndex(headerRow, ["firstname", "first_name", "first"]),
      lastName: findIndex(headerRow, ["lastname", "last_name", "last"]),
      msisdn: findIndex(headerRow, ["phone", "msisdn", "mobile", "number"]),
      alternatePhone: findIndex(headerRow, ["alternate", "alt_phone", "altphone"]),
      email: findIndex(headerRow, ["email"]),
      alternateEmail: findIndex(headerRow, ["alternate_email", "alt_email", "altemail"]),
      gender: findIndex(headerRow, ["gender"]),
    };
  };

  // Real-time bulk data parsing and validation
  const bulkValidation = useMemo(() => {
    if (!bulkText.trim()) {
      return { valid: 0, invalid: 0, rows: [], headers: [] };
    }

    const lines = bulkText.split("\n").filter((line) => line.trim());
    const headerRow = lines[0].split(",").map((h) => h.trim());
    const colIndices = detectColumnIndices(headerRow);

    // Check if required columns are found
    if (colIndices.firstName === -1 || colIndices.lastName === -1 || colIndices.msisdn === -1) {
      return {
        valid: 0,
        invalid: lines.length - 1,
        rows: [],
        headers: headerRow,
      };
    }

    const rows = lines.slice(1).map((line, index) => {
      const parts = line.split(",").map((p) => p.trim());

      // Check if all required fields are present
      if (!parts[colIndices.firstName] || !parts[colIndices.lastName] || !parts[colIndices.msisdn]) {
        return {
          rowNum: index + 1,
          valid: false,
          error: "Missing required fields (FirstName, LastName, Phone)",
          data: parts,
        };
      }

      // Validate phone number has country code
      if (!isValidCountryCodePhone(parts[colIndices.msisdn])) {
        return {
          rowNum: index + 1,
          valid: false,
          error: "Phone number must begin with country code",
          data: parts,
        };
      }

      // Validate alternate phone number if provided (must start with country code)
      if (colIndices.alternatePhone !== -1 && parts[colIndices.alternatePhone] && !isValidCountryCodePhone(parts[colIndices.alternatePhone])) {
        return {
          rowNum: index + 1,
          valid: false,
          error: "Alternate phone number must begin with country code",
          data: parts,
        };
      }

      // Validate gender if provided (only Male or Female)
      if (colIndices.gender !== -1 && parts[colIndices.gender] && !["Male", "Female"].includes(parts[colIndices.gender])) {
        return {
          rowNum: index + 1,
          valid: false,
          error: "Gender must be Male or Female",
          data: parts,
        };
      }

      // Successfully mapped customer
      return {
        rowNum: index + 1,
        valid: true,
        data: [
          parts[colIndices.firstName],
          parts[colIndices.lastName],
          parts[colIndices.msisdn],
          (colIndices.alternatePhone !== -1 ? parts[colIndices.alternatePhone] : undefined) || "—",
          (colIndices.email !== -1 ? parts[colIndices.email] : undefined) || "—",
          (colIndices.alternateEmail !== -1 ? parts[colIndices.alternateEmail] : undefined) || "—",
          (colIndices.gender !== -1 ? parts[colIndices.gender] : undefined) || "—",
        ],
        customer: {
          firstName: parts[colIndices.firstName],
          lastName: parts[colIndices.lastName],
          msisdn: parts[colIndices.msisdn],
          alternatemsisdns: (colIndices.alternatePhone !== -1 ? parts[colIndices.alternatePhone] : undefined) || undefined,
          email: (colIndices.email !== -1 ? parts[colIndices.email] : undefined) || undefined,
          alternateEmail: (colIndices.alternateEmail !== -1 ? parts[colIndices.alternateEmail] : undefined) || undefined,
          gender: (colIndices.gender !== -1 ? parts[colIndices.gender] : undefined) || undefined,
          dateOfBirth: undefined,
          languagePreference: parts[8] || "en",
          city: parts[9] || undefined,
          physicalAddress: parts[10] || undefined,
          region: parts[11] || undefined,
          postalCode: parts[12] || undefined,
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

      // Validate phone number in real-time
      if (sanitizedValue && !isValidCountryCodePhone(sanitizedValue)) {
        setPhoneError("Phone number must begin with country code");
      } else {
        setPhoneError("");
      }
    }

    if (name === "alternatemsisdns") {
      sanitizedValue = value.replace(/^\+/, "").replace(/\D/g, "");

      // Validate alternate phone number in real-time (only if not empty)
      if (sanitizedValue && !isValidCountryCodePhone(sanitizedValue)) {
        setAlternatePhoneError("Phone number must begin with country code");
      } else {
        setAlternatePhoneError("");
      }
    }

    // Clear field error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const validateSingleCustomer = (): boolean => {
    const errors: typeof formErrors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.msisdn.trim()) {
      errors.msisdn = "Phone number is required";
    } else if (!isValidCountryCodePhone(formData.msisdn)) {
      errors.msisdn = "Phone number must begin with country code";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to the form container to show errors
      setTimeout(() => {
        formContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleAddSingle = async () => {
    if (!validateSingleCustomer()) return;

    setIsLoading(true);
    try {
      // Format phone number - removes + and keeps only digits
      const msisdnForApi = formatPhoneNumber(formData.msisdn);

      // Call API to create customer with all fields
      const apiResponse = await customerService.createCustomer({
        msisdn: msisdnForApi,
        attributes: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || undefined,
          alternate_email: formData.alternateEmail || undefined,
          alternate_msisdns: formData.alternatemsisdns
            ? [formData.alternatemsisdns]
            : undefined,
          gender: formData.gender || undefined,
          date_of_birth: formData.dateOfBirth || undefined,
          language_preference: formData.languagePreference || "en",
          city: formData.city || undefined,
          region: formData.region || undefined,
          postal_code: formData.postalCode || undefined,
          country_code: formData.countryCode || undefined,
          physical_address: formData.physicalAddress || undefined,
          customer_tier: formData.customerTier || undefined,
          preferred_channel: formData.preferredChannel || "NORMAL_SMS",
          timezone: formData.timezone || "Africa/Kampala",
          device_type: "unknown",
          premium_user: false,
        },
      });

      // Create local customer record for display (includes form-specific fields)
      // API returns id as string, convert to number for consistency
      const apiCustomerId =
        typeof apiResponse.data.id === "string"
          ? parseInt(apiResponse.data.id, 10)
          : apiResponse.data.id;


      const newCustomer: CustomerSubscriptionRecord = {
        customerId: apiCustomerId,
        subscriptionId: apiCustomerId,
        // Use API response attributes where available with null checks
        firstName:
          apiResponse?.data?.first_name || formData.firstName || "Unknown",
        lastName: apiResponse?.data?.last_name || formData.lastName || "Customer",
        msisdn: msisdnForApi || "",
        email:
          apiResponse?.data?.email || formData.email || undefined,
        city: apiResponse?.data?.city || undefined,
        customerType: apiResponse?.data?.subscriber_type || "prepaid",
        tariff: apiResponse?.data?.preferred_channel || "NORMAL_SMS",
        status: apiResponse?.data?.subscriber_status || "active",
        simType: apiResponse?.data?.kyc_verified ? "KYC Verified" : "Not Verified",
        activationDate: apiResponse?.data?.created_at || new Date().toISOString(),
      };

      // Add to parent component state
      onCustomersAdded([newCustomer]);
      success("Success", "Customer added successfully");

      // Reset form
      setFormData(initialFormData);
      setPhoneError("");
      setAlternatePhoneError("");
      setFormErrors({});
      onClose();
    } catch (err) {
      // Extract backend error message
      let errorMessage = "Failed to create customer";

      if (err instanceof Error) {
        const message = err.message;
        // Try to parse backend error from API response
        try {
          const match = message.match(/"error":"([^"]+)"/);
          if (match && match[1]) {
            errorMessage = match[1];
          } else {
            errorMessage = message;
          }
        } catch {
          errorMessage = message;
        }
      }

      error("Error", errorMessage, true);
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
        if (parts.length < 3) continue; // Skip incomplete lines (need FirstName, LastName, Phone)

        // Format MSISDN for API - removes + and keeps only digits
        const msisdnForApi = formatPhoneNumber(parts[2]);

        // Add to API profiles array
        profiles.push({
          msisdn: msisdnForApi,
          attributes: {
            first_name: parts[0] || "Unknown",
            last_name: parts[1] || "Customer",
            email: parts[4] || undefined,
            device_type: "unknown",
            premium_user: false,
          },
        });

        // Generate a client-side ID for display (will be replaced by API response)
        const clientId = Math.floor(Math.random() * 1000000);

        // Prepare local customer record with null checks
        const customer: CustomerSubscriptionRecord = {
          customerId: clientId,
          subscriptionId: clientId,
          firstName: parts?.[0]?.trim() || "Unknown",
          lastName: parts?.[1]?.trim() || "Customer",
          msisdn: msisdnForApi || "",
          email: parts?.[4]?.trim() || undefined,
          city: parts?.[9]?.trim() || undefined,
          customerType: parts?.[15]?.trim() || "prepaid",
          tariff: parts?.[16]?.trim() || "NORMAL_SMS",
          status: "active",
          simType: "Not Verified",
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
      setPhoneError("");
      setAlternatePhoneError("");
      setFormErrors({});
      onClose();
    } catch (err) {
      // Extract backend error message
      let errorMessage = "Failed to import customers";

      if (err instanceof Error) {
        const message = err.message;
        // Try to parse backend error from API response
        try {
          const match = message.match(/"error":"([^"]+)"/);
          if (match && match[1]) {
            errorMessage = match[1];
          } else {
            errorMessage = message;
          }
        } catch {
          errorMessage = message;
        }
      }

      error("Error", errorMessage, true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFile = async () => {
    if (!importFile) {
      error("Validation Error", "Please select a file", true);
      return;
    }

    if (!mappingConfirmed || !columnMapping) {
      error("Validation Error", "Please confirm column mapping first", true);
      return;
    }

    setIsLoading(true);
    try {
      const isExcel = importFile.name.endsWith(".xlsx") || importFile.name.endsWith(".xls");
      const fileContent = isExcel
        ? await importFile.arrayBuffer()
        : await importFile.text();

      let allRows: string[][] = [];

      if (isExcel) {
        const workbook = XLSX.read(fileContent, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        allRows = (sheetRows as string[][]).map((row) =>
          row.map((cell) => String(cell || "").trim())
        );
      } else {
        const lines = (fileContent as string)
          .split("\n")
          .filter((line) => line.trim());
        allRows = lines.map((line) => line.split(importFileDelimiter).map((p) => p.trim()));
      }

      // Skip header row
      const dataRows = allRows.slice(1);

      // Prepare data for API using mapped columns
      const profiles: { msisdn: string; attributes?: Record<string, any> }[] = [];
      const customers: CustomerSubscriptionRecord[] = [];

      for (const parts of dataRows) {
        // Extract values using column mapping
        const firstName = parts[columnMapping.firstName]?.trim() || "Unknown";
        const lastName = parts[columnMapping.lastName]?.trim() || "Customer";
        const msisdn = parts[columnMapping.msisdn]?.trim() || "";

        // Skip if msisdn is empty
        if (!msisdn) continue;

        // Format MSISDN for API - removes + and keeps only digits
        const msisdnForApi = formatPhoneNumber(msisdn);

        // Add to API profiles array
        profiles.push({
          msisdn: msisdnForApi,
          attributes: {
            first_name: firstName,
            last_name: lastName,
            email: parts[3]?.trim() || undefined,
            device_type: "unknown",
            premium_user: false,
          },
        });

        // Generate a client-side ID for display (will be replaced by API response)
        const clientId = Math.floor(Math.random() * 1000000);

        // Prepare local customer record
        const customer: CustomerSubscriptionRecord = {
          customerId: clientId,
          subscriptionId: clientId,
          firstName,
          lastName,
          msisdn: msisdnForApi,
          email: parts[3]?.trim() || undefined,
          city: parts[4]?.trim() || undefined,
          customerType: "prepaid",
          tariff: "NORMAL_SMS",
          status: "active",
          simType: "Not Verified",
          activationDate: new Date().toISOString(),
        };
        customers.push(customer);
      }

      if (profiles.length === 0) {
        error("Validation Error", "No valid customer data found in file", true);
        return;
      }

      // Call API to bulk create customers
      await customerService.bulkCreateCustomers({ profiles });

      // Add to local list
      onCustomersAdded(customers);
      success(
        "Success",
        `${profiles.length} customer(s) imported successfully`,
      );

      // Reset
      setImportFile(null);
      setColumnMapping(null);
      setMappingConfirmed(false);
      setImportPreview(null);
      setPhoneError("");
      setAlternatePhoneError("");
      setFormErrors({});
      onClose();
    } catch (err) {
      // Extract backend error message
      let errorMessage = "Failed to import file";

      if (err instanceof Error) {
        const message = err.message;

        // Try to extract and parse backend error response
        try {
          // First, try to parse the entire error as JSON
          const jsonMatch = message.match(/\{[\s\S]*"error"[\s\S]*\}/);
          if (jsonMatch) {
            const errorObj = JSON.parse(jsonMatch[0]);
            if (errorObj.error) {
              errorMessage = errorObj.error;
            }
          } else {
            // Fallback: try regex pattern for quoted error
            const regexMatch = message.match(/"error"\s*:\s*"([^"\\]|\\.)*"/);
            if (regexMatch) {
              const jsonStr = `{${regexMatch[0]}}`;
              const parsed = JSON.parse(jsonStr);
              errorMessage = parsed.error;
            } else {
              // Last resort: use the message as is
              errorMessage = message;
            }
          }
        } catch {
          // If all parsing fails, use message as is
          errorMessage = message || "Failed to import file";
        }
      }

      error("Import Failed", errorMessage, true);
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
            onClick={() => {
              setPhoneError("");
              setAlternatePhoneError("");
              setFormErrors({});
              onClose();
            }}
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
                  onClick={() => {
                    setActiveTab(id as TabType);
                    setPhoneError("");
                    setAlternatePhoneError("");
                    setFormErrors({});
                  }}
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
        <form className="p-6 space-y-4" ref={formContainerRef}>
          {/* Single Customer Tab */}
          {activeTab === "single" && (
            <>
              <div className="space-y-4">
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
                    className={`w-full px-4 py-3 border ${tw.rounded} focus:outline-none text-sm ${
                      formErrors.msisdn
                        ? "border-red-500"
                        : tw.borderDefault
                    }`}
                  />
                  {formErrors.msisdn && (
                    <p className="text-red-600 text-sm mt-1">
                      {formErrors.msisdn}
                    </p>
                  )}
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
                      className={`w-full px-4 py-3 border ${tw.rounded} focus:outline-none text-sm ${
                        formErrors.firstName
                          ? "border-red-500"
                          : tw.borderDefault
                      }`}
                    />
                    {formErrors.firstName && (
                      <p className="text-red-600 text-sm mt-1">
                        {formErrors.firstName}
                      </p>
                    )}
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
                      className={`w-full px-4 py-3 border ${tw.rounded} focus:outline-none text-sm ${
                        formErrors.lastName
                          ? "border-red-500"
                          : tw.borderDefault
                      }`}
                    />
                    {formErrors.lastName && (
                      <p className="text-red-600 text-sm mt-1">
                        {formErrors.lastName}
                      </p>
                    )}
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
                      className={`w-full px-4 py-3 border ${tw.rounded} focus:outline-none text-sm ${
                        alternatePhoneError
                          ? "border-red-500"
                          : tw.borderDefault
                      }`}
                    />
                    {alternatePhoneError && (
                      <p className="text-red-600 text-sm mt-1">
                        {alternatePhoneError}
                      </p>
                    )}
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
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border ${tw.rounded} focus:outline-none text-sm ${
                        formErrors.email
                          ? "border-red-500"
                          : tw.borderDefault
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-red-600 text-sm mt-1">
                        {formErrors.email}
                      </p>
                    )}
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
                  {["FirstName", "LastName", "Phone"].map((field) => (
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
                placeholder="FirstName,LastName,Phone,AlternatePhone,Email,AlternateEmail,Gender,DateOfBirth,LanguagePreference,City,PhysicalAddress,Region,PostalCode,CountryCode,CustomerTier,PreferredChannel,Timezone&#10;David,Kipchoge,254750902921,254712345679,david.kipchoge@email.com,david.alt@email.com,Male,1990-05-15,en,Nairobi,123 Kenyatta Ave,Nairobi,00100,KEN,Gold,SMS,Africa/Nairobi"
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
                    const sampleData = `FirstName,LastName,Phone,AlternatePhone,Email,AlternateEmail,Gender,DateOfBirth,LanguagePreference,City,PhysicalAddress,Region,PostalCode,CountryCode,CustomerTier,PreferredChannel,Timezone
David,Kipchoge,254750902921,254712345679,david.kipchoge@email.com,david.alt@email.com,Male,1990-05-15,en,Nairobi,123 Kenyatta Ave,Nairobi,00100,KEN,Gold,SMS,Africa/Nairobi
Grace,Wanjiru,254712345678,254712345680,grace.wanjiru@email.com,grace.alt@email.com,Female,1992-03-20,en,Mombasa,456 Nkrumah Rd,Mombasa,80100,KEN,VIP,EMAIL,Africa/Nairobi
Peter,Ochieng,254734567890,254734567891,peter.ochieng@email.com,,Male,1988-12-10,en,Kisumu,789 Oginga Odinga,Kisumu,40100,KEN,Regular,USSD,Africa/Nairobi
Fatima,Hassan,254720123456,,fatima.hassan@email.com,fatima.alt@email.com,Female,1995-07-25,en,Mombasa,321 Abdel Nasser,Mombasa,80200,KEN,Gold,SMS,Africa/Nairobi`;
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
                className={`border-2 border-dashed ${tw.rounded} p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between`}
                style={{ borderColor: color.border.default }}
                onClick={() => !importFile && document.getElementById("fileInput")?.click()}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Upload className={`w-8 h-8 ${tw.textMuted} flex-shrink-0`} />
                  <p className={`text-sm ${tw.textPrimary} font-medium`}>
                    {importFile
                      ? importFile.name
                      : "Click to select or drag a file"}
                  </p>
                </div>
                {importFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImportFile(null);
                      setColumnMapping(null);
                      setMappingConfirmed(false);
                      setImportPreview(null);
                    }}
                    className="text-red-600 text-sm font-medium whitespace-nowrap ml-2"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                id="fileInput"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;

                  // Validate file type
                  if (file) {
                    const isCSV = file.name.endsWith(".csv");
                    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

                    if (!isCSV && !isExcel) {
                      error("Invalid File", "Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
                      e.target.value = ""; // Clear the input
                      return;
                    }
                  }

                  setImportFile(file);

                  // Parse file to show mapping UI
                  if (file) {
                    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

                    if (isExcel) {
                      // Handle Excel file
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const data = event.target?.result as ArrayBuffer;
                          const workbook = XLSX.read(data, { type: "array" });
                          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                          if (rows.length === 0) return;

                          const headerRow = (rows[0] as string[]).map((h) => String(h || "").trim());

                          // Show mapping UI - don't validate yet, let user map columns first
                          setColumnMapping(null); // Reset mapping
                          setMappingConfirmed(false); // Reset confirmation
                          setImportPreview({
                            valid: 0,
                            invalid: 0,
                            rows: [],
                            headers: headerRow,
                          });
                        } catch (err) {
                          error("Error", "Failed to read Excel file");
                        }
                      };
                      reader.readAsArrayBuffer(file);
                    } else {
                      // Handle CSV file
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        const lines = content
                          .split("\n")
                          .filter((line) => line.trim());
                        const headerRow = lines[0].split(importFileDelimiter).map((h) => h.trim());

                        // Show mapping UI - don't validate yet, let user map columns first
                        setColumnMapping(null); // Reset mapping
                        setMappingConfirmed(false); // Reset confirmation
                        setImportPreview({
                          valid: 0,
                          invalid: 0,
                          rows: [],
                          headers: headerRow,
                        });
                      };
                      reader.readAsText(file);
                    }
                  } else {
                    setImportPreview(null);
                  }
                }}
                className="hidden"
              />

              {/* Column Mapping UI */}
              {importPreview && !mappingConfirmed && (
                <div className="mt-4 p-4 border rounded space-y-4 bg-white" style={{ borderColor: color.border.default }}>
                  <div>
                    <h3 className={`font-medium mb-2 ${tw.textPrimary}`}>Map Your Columns</h3>
                    <p className={`text-sm ${tw.textSecondary} mb-3`}>Select which column contains each required field:</p>
                    <div className="flex flex-col gap-3">
                      {[
                        { field: "firstName", label: "First Name *" },
                        { field: "lastName", label: "Last Name *" },
                        { field: "msisdn", label: "Phone *" },
                      ].map(({ field, label }) => {
                        // Get all selected column indices
                        const selectedIndices = new Set<number>();
                        Object.entries(columnMapping || {}).forEach(([key, val]) => {
                          if (val !== undefined && val !== -1) selectedIndices.add(val as number);
                        });

                        return (
                          <div key={field} className="flex items-end gap-3">
                            <div className="flex-1">
                              <label className={`text-sm font-medium ${tw.textPrimary} block mb-2`}>
                                {label}
                              </label>
                              <HeadlessSelect
                                options={[
                                  { value: "-1", label: "Select column..." },
                                  ...importPreview.headers
                                    .map((header, idx) => ({ header, idx }))
                                    .filter(({ header }) => !header.toLowerCase().includes("subid"))
                                    .map(({ header, idx }) => {
                                      const isSelected = selectedIndices.has(idx);
                                      const isCurrentField = (columnMapping?.[field as keyof typeof columnMapping] ?? -1) === idx;
                                      const isDisabled = isSelected && !isCurrentField;
                                      return {
                                        value: idx.toString(),
                                        label: isDisabled ? `${header} (already used)` : header,
                                        disabled: isDisabled,
                                      };
                                    }),
                                ]}
                                value={((columnMapping?.[field as keyof typeof columnMapping] ?? -1) as number).toString()}
                                onChange={(value) => {
                                  const numValue = parseInt(value);
                                  setColumnMapping((prev) => ({
                                    ...(prev || { firstName: -1, lastName: -1, msisdn: -1 }),
                                    [field]: numValue === -1 ? undefined : numValue,
                                  }));
                                }}
                                placeholder="Select column..."
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      // Validate required mappings
                      if ((columnMapping?.firstName ?? -1) === -1 || (columnMapping?.lastName ?? -1) === -1 || (columnMapping?.msisdn ?? -1) === -1) {
                        error("Validation", "Please map FirstName, LastName, and Phone columns");
                        return;
                      }

                      // Get the file content and validate using mapped columns
                      if (!importFile) return;

                      const isExcel = importFile.name.endsWith(".xlsx") || importFile.name.endsWith(".xls");
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          let allRows: string[][] = [];

                          if (isExcel) {
                            const data = event.target?.result as ArrayBuffer;
                            const workbook = XLSX.read(data, { type: "array" });
                            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                            const sheetRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                            allRows = (sheetRows as string[][]).map((row) =>
                              row.map((cell) => String(cell || "").trim())
                            );
                          } else {
                            const content = event.target?.result as string;
                            const lines = content.split("\n").filter((line) => line.trim());
                            allRows = lines.map((line) => line.split(importFileDelimiter).map((p) => p.trim()));
                          }

                          const rows = allRows.slice(1).map((parts, index) => {

                          // Get values using mapped column indices
                          const firstName = parts[columnMapping.firstName];
                          const lastName = parts[columnMapping.lastName];
                          const msisdn = parts[columnMapping.msisdn];

                          // Check if all required fields are present
                          if (!firstName || !lastName || !msisdn) {
                            return {
                              rowNum: index + 1,
                              valid: false,
                              error: "Missing required fields",
                              data: parts,
                            };
                          }

                          // Validate phone number has country code
                          if (!isValidCountryCodePhone(msisdn)) {
                            return {
                              rowNum: index + 1,
                              valid: false,
                              error: "Phone number must begin with country code",
                              data: parts,
                            };
                          }

                          // Successfully validated
                          return {
                            rowNum: index + 1,
                            valid: true,
                            data: parts, // Show all columns from CSV
                          };
                        });

                          const validRows = rows.filter((r) => r.valid).length;
                          const invalidRows = rows.filter((r) => !r.valid).length;

                          setImportPreview({
                            valid: validRows,
                            invalid: invalidRows,
                            rows,
                            headers: allRows[0], // Show all original headers
                          });

                          // Show preview
                          setMappingConfirmed(true);
                        } catch (err) {
                          error("Error", "Failed to read file");
                        }
                      };

                      if (isExcel) {
                        reader.readAsArrayBuffer(importFile);
                      } else {
                        reader.readAsText(importFile);
                      }
                    }}
                    className={`${tw.button} text-white`}
                    style={{ backgroundColor: color.primary.action }}
                  >
                    Confirm Mapping
                  </button>
                </div>
              )}

              {/* Import Preview */}
              {importPreview && mappingConfirmed && (
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
