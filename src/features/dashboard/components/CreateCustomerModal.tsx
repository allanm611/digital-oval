import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Upload, Users } from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import type { CustomerSubscriptionRecord } from "../types/customerSubscription";

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomersAdded: (customers: CustomerSubscriptionRecord[]) => void;
}

type TabType = "single" | "bulk" | "import";

interface FormData {
  firstName: string;
  lastName: string;
  msisdn: string;
  email: string;
  city: string;
  tariff: string;
  status: string;
  simType: string;
}

// Options from actual dummy data
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

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  msisdn: "",
  email: "",
  city: "",
  tariff: "Non-member",
  status: "Active",
  simType: "2FF",
};

export default function CreateCustomerModal({
  isOpen,
  onClose,
  onCustomersAdded,
}: CreateCustomerModalProps) {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("single");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [bulkText, setBulkText] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateSingleCustomer = (): boolean => {
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
    return true;
  };

  const handleAddSingle = async () => {
    if (!validateSingleCustomer()) return;

    setIsLoading(true);
    try {
      // Create new customer record
      const newCustomer: CustomerSubscriptionRecord = {
        customerId: Math.floor(Math.random() * 100000),
        subscriptionId: Math.floor(Math.random() * 100000),
        firstName: formData.firstName,
        lastName: formData.lastName,
        msisdn: formData.msisdn,
        email: formData.email || undefined,
        city: formData.city || undefined,
        tariff: formData.tariff,
        status: formData.status,
        simType: formData.simType,
        activationDate: new Date().toISOString(),
      };

      onCustomersAdded([newCustomer]);
      success(
        "Success",
        `Customer ${formData.firstName} ${formData.lastName} added successfully`,
      );

      // Reset form
      setFormData(initialFormData);
      onClose();
    } catch (err) {
      error(
        "Error",
        err instanceof Error ? err.message : "Failed to add customer",
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

      const customers: CustomerSubscriptionRecord[] = [];

      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 3) continue; // Skip incomplete lines

        const customer: CustomerSubscriptionRecord = {
          customerId: Math.floor(Math.random() * 100000),
          subscriptionId: Math.floor(Math.random() * 100000),
          firstName: parts[0] || "Unknown",
          lastName: parts[1] || "Customer",
          msisdn: parts[2],
          email: parts[3] || undefined,
          city: parts[4] || undefined,
          tariff: parts[5] || "Non-member",
          status: parts[6] || "Active",
          simType: parts[7] || "2FF",
          activationDate: new Date().toISOString(),
        };
        customers.push(customer);
      }

      if (customers.length === 0) {
        error("Validation Error", "No valid customer data found");
        return;
      }

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
      setBulkText(text);
      setActiveTab("bulk");
      // Trigger bulk add
      const lines = text
        .split("\n")
        .filter((line) => line.trim())
        .slice(1);

      const customers: CustomerSubscriptionRecord[] = [];

      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 3) continue;

        const customer: CustomerSubscriptionRecord = {
          customerId: Math.floor(Math.random() * 100000),
          subscriptionId: Math.floor(Math.random() * 100000),
          firstName: parts[0] || "Unknown",
          lastName: parts[1] || "Customer",
          msisdn: parts[2],
          email: parts[3] || undefined,
          city: parts[4] || undefined,
          tariff: parts[5] || "Non-member",
          status: parts[6] || "Active",
          simType: parts[7] || "2FF",
          activationDate: new Date().toISOString(),
        };
        customers.push(customer);
      }

      if (customers.length === 0) {
        error("Validation Error", "No valid customer data found in file");
        return;
      }

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
        <div
          className="flex border-b"
          style={{ borderColor: color.border.default }}
        >
          {[
            { id: "single", label: "Single Customer", icon: Plus },
            { id: "bulk", label: "Bulk Addition", icon: Users },
            { id: "import", label: "Import File", icon: Upload },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === id
                  ? `border-blue-500 ${tw.textPrimary}`
                  : `border-transparent ${tw.textSecondary} hover:${tw.textPrimary}`
              }`}
              style={{
                borderBottomColor:
                  activeTab === id ? color.primary.action : "transparent",
                color:
                  activeTab === id ? color.text.primary : color.text.secondary,
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
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
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
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
                    className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                  />
                </div>
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
                  placeholder="+254712345678"
                  className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                />
              </div>

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
                  placeholder="email@example.com"
                  className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                />
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
                  placeholder="Nairobi"
                  className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                  >
                    Tariff
                  </label>
                  <HeadlessSelect
                    options={TARIFF_OPTIONS}
                    value={formData.tariff}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        tariff: String(value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                  >
                    SIM Type
                  </label>
                  <HeadlessSelect
                    options={SIM_TYPE_OPTIONS}
                    value={formData.simType}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        simType: String(value),
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Status
                </label>
                <HeadlessSelect
                  options={STATUS_OPTIONS}
                  value={formData.status}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: String(value),
                    }))
                  }
                />
              </div>
            </>
          )}

          {/* Bulk Addition Tab */}
          {activeTab === "bulk" && (
            <div>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className={`text-xs font-semibold ${tw.textPrimary} mb-2`}>
                  📋 CSV Format Required:
                </p>
                <p className={`text-xs ${tw.textSecondary} font-mono mb-2`}>
                  FirstName, LastName, Phone, Email, City, Tariff, Status,
                  SimType
                </p>
                <p className={`text-xs ${tw.textSecondary} mb-3`}>
                  One customer per line. Required fields: FirstName, LastName,
                  Phone
                </p>
                <p className={`text-xs font-semibold ${tw.textPrimary} mb-2`}>
                  Valid Values:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-gray-700">Tariff:</span>
                    <div className={tw.textSecondary}>
                      Non-member, Member, Gumzo, etc.
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Status:</span>
                    <div className={tw.textSecondary}>
                      Active, Pending, Deactivation
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      SIM Type:
                    </span>
                    <div className={tw.textSecondary}>2FF, 4FF, 2/3FF, 4G</div>
                  </div>
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
                placeholder="John, Doe, +254712345678, john@example.com, Nairobi, Non-member, Active, 2FF
Jane, Smith, +254723456789, jane@example.com, Mombasa, Member, Active, 4FF
Mike, Johnson, +254734567890, , Kisumu, Gumzo, Pending, 2/3FF"
                className={`w-full px-3 py-2 border ${tw.borderDefault} ${tw.rounded} focus:outline-none text-sm font-mono`}
                rows={10}
              />
            </div>
          )}

          {/* Import File Tab */}
          {activeTab === "import" && (
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Upload CSV File
              </label>
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
                  CSV file with columns: FirstName, LastName, Phone, Email,
                  City, Tariff, Status, SimType
                </p>
              </div>
              <input
                id="fileInput"
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className={`flex gap-3 p-6 border-t ${tw.borderDefault}`}>
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
                Add Customer{activeTab === "bulk" ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
