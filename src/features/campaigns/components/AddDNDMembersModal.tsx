import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { customerService } from "../../customers360/services/customerServices";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { tw, color } from "../../../shared/utils/utils";
import { validateMSISDN } from "../../../shared/utils/validation";
import { getButtonStyles } from "../../../shared/utils/utils";
import { buttons } from "../../../shared/utils/tokens";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { DNDType } from "../services/dndService";

interface Customer {
  id: string | number;
  customerId?: string | number;
  first_name?: string;
  last_name?: string;
  msisdn?: string;
  email_address?: string;
  email?: string;
}

interface SelectedMember {
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

interface AddDNDMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  dndTypes: DNDType[];
  channel: string;
  onAdd?: (members: SelectedMember[], dndTypeId: number) => void;
  isLoading?: boolean;
}

interface FormData {
  mode: "existing_customer" | "external_recipient";
  customer_id: string;
  msisdn: string;
  external_name: string;
  external_email: string;
  external_msisdn: string;
  dnd_type_id: string;
  duration: string;
  custom_duration_date: string;
}

interface FormErrors {
  customer_id?: string;
  msisdn?: string;
  external_name?: string;
  external_msisdn?: string;
  dnd_type_id?: string;
}

export default function AddDNDMembersModal({
  isOpen,
  onClose,
  dndTypes,
  channel,
  onAdd,
  isLoading = false,
}: AddDNDMembersModalProps) {
  const [formData, setFormData] = useState<FormData>({
    mode: "existing_customer",
    customer_id: "",
    msisdn: "",
    external_name: "",
    external_email: "",
    external_msisdn: "",
    dnd_type_id: dndTypes.length > 0 ? String(dndTypes[0].id) : "",
    duration: "0",
    custom_duration_date: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      if (dndTypes.length > 0) {
        setFormData((prev) => ({
          ...prev,
          dnd_type_id: String(dndTypes[0].id),
        }));
      }
    }
  }, [isOpen, dndTypes]);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await customerService.getAllCustomers({
        limit: 100,
        offset: 0,
        skipCache: true,
      });
      const data = response?.data || [];
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCloseModal = () => {
    setFormData({
      mode: "existing_customer",
      customer_id: "",
      msisdn: "",
      external_name: "",
      external_email: "",
      external_msisdn: "",
      dnd_type_id: dndTypes.length > 0 ? String(dndTypes[0].id) : "",
      duration: "0",
      custom_duration_date: "",
    });
    setErrors({});
    onClose();
  };

  const handleAddMember = async () => {
    const newErrors: FormErrors = {};

    if (!formData.dnd_type_id) {
      newErrors.dnd_type_id = "DND Type is required";
    }

    if (formData.mode === "existing_customer") {
      if (!formData.customer_id) {
        newErrors.customer_id = "Customer is required";
      }
      if (!formData.msisdn) {
        newErrors.msisdn = "MSISDN is required";
      } else {
        const validation = validateMSISDN(formData.msisdn);
        if (!validation.valid) {
          newErrors.msisdn = validation.error;
        }
      }
    } else {
      if (!formData.external_name) {
        newErrors.external_name = "Name is required";
      }
      if (formData.external_msisdn) {
        const validation = validateMSISDN(formData.external_msisdn);
        if (!validation.valid) {
          newErrors.external_msisdn = validation.error;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsAddingMember(true);

      let memberData: SelectedMember;

      if (formData.mode === "existing_customer") {
        const selectedCustomer = customers.find(
          (c) => String(c.customerId || c.id) === formData.customer_id
        );
        if (!selectedCustomer) {
          setErrors({ customer_id: "Invalid customer selected" });
          return;
        }

        const firstName = selectedCustomer.first_name || "";
        const lastName = selectedCustomer.last_name || "";

        memberData = {
          customer_id: Number(selectedCustomer.customerId || selectedCustomer.id),
          customer_name: `${firstName} ${lastName}`.trim(),
          customer_email: selectedCustomer.email_address || selectedCustomer.email,
          customer_phone: formData.msisdn,
        };
      } else {
        memberData = {
          customer_id: 0,
          customer_name: formData.external_name,
          ...(formData.external_email ? { customer_email: formData.external_email } : {}),
          ...(formData.external_msisdn ? { customer_phone: formData.external_msisdn } : {}),
        };
      }

      if (onAdd) {
        await onAdd([memberData], Number(formData.dnd_type_id));
      }

      handleCloseModal();
    } catch (error) {
      console.error("Failed to add member:", error);
    } finally {
      setIsAddingMember(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${tw.rounded} bg-white shadow-xl max-w-md w-full mx-4`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
            Add to {channel} DND
          </h2>
          <button
            onClick={handleCloseModal}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pt-4 pb-6">
          {/* Mode Toggle */}
          <div className="flex gap-1 mb-6">
            <button
              onClick={() => {
                setFormData({ ...formData, mode: "existing_customer" });
                setErrors({});
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                formData.mode === "existing_customer"
                  ? "text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Existing Customer
              {formData.mode === "existing_customer" && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: color.primary.accent }}
                />
              )}
            </button>
            <button
              onClick={() => {
                setFormData({ ...formData, mode: "external_recipient" });
                setErrors({});
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                formData.mode === "external_recipient"
                  ? "text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              External Recipient
              {formData.mode === "external_recipient" && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: color.primary.accent }}
                />
              )}
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Existing Customer Mode */}
            {formData.mode === "existing_customer" && (
              <>
                {/* Customer Selection */}
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                    Select Customer *
                  </label>
                  <div className={errors.customer_id ? "border border-red-500 rounded" : ""}>
                    <HeadlessSelect
                      value={formData.customer_id}
                      onChange={(value) => {
                        setFormData({ ...formData, customer_id: value.toString() });
                        if (errors.customer_id) {
                          setErrors({ ...errors, customer_id: undefined });
                        }
                      }}
                      options={[
                        { value: "", label: "Select a customer" },
                        ...customers.map((customer) => ({
                          value: String(customer.customerId || customer.id),
                          label: `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "Unknown",
                        })),
                      ]}
                      placeholder="Select customer..."
                      disabled={loadingCustomers}
                    />
                  </div>
                  {errors.customer_id && (
                    <p className="text-xs text-red-500 mt-1">{errors.customer_id}</p>
                  )}
                </div>

                {/* MSISDN */}
                <div>
                  <Input
                    label="MSISDN *"
                    type="tel"
                    value={formData.msisdn}
                    onChange={(value) => {
                      setFormData({ ...formData, msisdn: value });
                      if (value) {
                        const validation = validateMSISDN(value);
                        setErrors({ ...errors, msisdn: validation.error });
                      } else {
                        setErrors({ ...errors, msisdn: undefined });
                      }
                    }}
                    placeholder="Country code + number (e.g., 254712345678)"
                    hasError={!!errors.msisdn}
                  />
                  {errors.msisdn && (
                    <p className="text-xs text-red-500 mt-1">{errors.msisdn}</p>
                  )}
                </div>
              </>
            )}

            {/* External Recipient Mode */}
            {formData.mode === "external_recipient" && (
              <>
                {/* Name */}
                <div>
                  <Input
                    label="Name *"
                    value={formData.external_name}
                    onChange={(value) => {
                      setFormData({ ...formData, external_name: value });
                      if (errors.external_name) {
                        setErrors({ ...errors, external_name: undefined });
                      }
                    }}
                    placeholder="Full name"
                    hasError={!!errors.external_name}
                  />
                  {errors.external_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.external_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Input
                    label="Email"
                    type="email"
                    value={formData.external_email}
                    onChange={(value) => {
                      setFormData({ ...formData, external_email: value });
                      if (errors.external_email) {
                        setErrors({ ...errors, external_email: undefined });
                      }
                    }}
                    placeholder="Email address"
                    hasError={!!errors.external_email}
                  />
                </div>

                {/* MSISDN */}
                <div>
                  <Input
                    label="MSISDN"
                    type="tel"
                    value={formData.external_msisdn}
                    onChange={(value) => {
                      setFormData({ ...formData, external_msisdn: value });
                      if (value) {
                        const validation = validateMSISDN(value);
                        setErrors({ ...errors, external_msisdn: validation.error });
                      } else {
                        setErrors({ ...errors, external_msisdn: undefined });
                      }
                    }}
                    placeholder="Country code + number (e.g., 254712345678)"
                    hasError={!!errors.external_msisdn}
                  />
                  {errors.external_msisdn && (
                    <p className="text-xs text-red-500 mt-1">{errors.external_msisdn}</p>
                  )}
                </div>
              </>
            )}

            {/* DND Type */}
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                DND Type *
              </label>
              <div className={errors.dnd_type_id ? "border border-red-500 rounded" : ""}>
                <HeadlessSelect
                  value={formData.dnd_type_id}
                  onChange={(value) => {
                    setFormData({ ...formData, dnd_type_id: value.toString() });
                    if (errors.dnd_type_id) {
                      setErrors({ ...errors, dnd_type_id: undefined });
                    }
                  }}
                  options={dndTypes.map((type) => ({
                    value: String(type.id),
                    label: type.name,
                  }))}
                  placeholder="Select DND type..."
                  disabled={loadingCustomers}
                />
              </div>
              {errors.dnd_type_id && (
                <p className="text-xs text-red-500 mt-1">{errors.dnd_type_id}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                Duration
              </label>
              <HeadlessSelect
                value={formData.duration}
                onChange={(value) => {
                  setFormData({ ...formData, duration: value.toString() });
                }}
                options={[
                  { value: "0", label: "Never expires" },
                  { value: "7", label: "7 days" },
                  { value: "30", label: "30 days" },
                  { value: "90", label: "90 days" },
                  { value: "180", label: "180 days" },
                  { value: "365", label: "1 year" },
                  { value: "custom", label: "Custom date" },
                ]}
                placeholder="Select duration..."
              />
            </div>

            {/* Custom Duration Date */}
            {formData.duration === "custom" && (
              <Input
                label="Expiry Date"
                type="date"
                value={formData.custom_duration_date}
                onChange={(value) => {
                  setFormData({ ...formData, custom_duration_date: value });
                }}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={handleCloseModal}
              className={`border border-gray-300 text-gray-700 font-medium ${tw.rounded} transition-colors hover:bg-gray-50`}
              style={getButtonStyles(buttons.bordered)}
            >
              Cancel
            </button>
            <button
              onClick={handleAddMember}
              disabled={
                isAddingMember ||
                !formData.dnd_type_id ||
                (formData.mode === "existing_customer"
                  ? !formData.customer_id || !formData.msisdn
                  : !formData.external_name)
              }
              className={`text-white font-medium ${tw.rounded} transition-colors flex items-center justify-center gap-2 ${
                isAddingMember ||
                !formData.dnd_type_id ||
                (formData.mode === "existing_customer"
                  ? !formData.customer_id || !formData.msisdn
                  : !formData.external_name)
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
              style={getButtonStyles(buttons.action)}
            >
              {isAddingMember && <LoadingSpinner size={16} />}
              {isAddingMember ? "Adding..." : "Add Member"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
