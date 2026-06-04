import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";

// Dummy data - same as list page
const DUMMY_PROFILE_FIELDS = [
  {
    id: 1,
    name: "Account Type",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "",
  },
  {
    id: 2,
    name: "Activation Date",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.ACTIVATION_DATE",
  },
  {
    id: 3,
    name: "CELL_ID",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.CELL_ID",
  },
];

const DATA_SOURCE_OPTIONS = [
  { label: "DB", value: "DB" },
  { label: "Live", value: "Live" },
  { label: "DB & Live", value: "DB & Live" },
];

const FREQUENCY_OPTIONS = [
  { label: "Per Min", value: "Per Min" },
  { label: "D-1", value: "D-1" },
];

const STATUS_OPTIONS = [
  { label: "Available", value: "Available" },
  { label: "Not Available", value: "Not Available" },
];

const EXTRACTION_LOGIC_TYPE_OPTIONS = [
  { label: "Segment", value: "segment" },
  { label: "SQL Script", value: "sql_script" },
  { label: "Data Source", value: "data_source" },
  { label: "Not Applicable", value: "not_applicable" },
];

export default function CreateSubscriberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const mode = id ? "edit" : "create";
  const existingProfile = id ? DUMMY_PROFILE_FIELDS.find((p) => p.id === Number(id)) : null;

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: existingProfile?.name || "",
    description: existingProfile?.description || "",
    dataSource: (existingProfile?.dataSource as "DB" | "Live" | "DB & Live") || "DB",
    frequency: (existingProfile?.frequency as "Per Min" | "D-1") || "D-1",
    status: (existingProfile?.status as "Available" | "Not Available") || "Available",
    extractionLogicType: existingProfile?.extractionLogic ? "data_source" : "not_applicable" as "segment" | "sql_script" | "data_source" | "not_applicable",
    extractionLogic: existingProfile?.extractionLogic || "",
    default_value: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Profile field name is required";
    }
    if (!formData.default_value.toString().trim()) {
      newErrors.default_value = "Default value is required";
    }
    if (formData.extractionLogicType !== "not_applicable" && !formData.extractionLogic.trim()) {
      newErrors.extractionLogic = "Extraction logic is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      const message = mode === "edit" ? "Profile field updated successfully" : "Profile field created successfully";
      success("Success", message);
      navigate("/dashboard/kpis/subscriber-profiles");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${mode} profile field`;
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string | undefined) => {
    if (!value) return;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-6">
      <BackButton showBreadcrumb={true} currentLabel={mode === "edit" ? "Edit Profile Field" : "Create Profile Field"} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Basic Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Field Name *
                </label>
                <Input
                  placeholder="e.g., Account Type"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  hasError={!!errors.name}
                  variant="medium"
                  disabled={saving}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Value *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Default value"
                  name="default_value"
                  value={formData.default_value}
                  onChange={handleChange}
                  hasError={!!errors.default_value}
                  variant="medium"
                  disabled={saving}
                />
                {errors.default_value && <p className="text-red-500 text-xs mt-1">{errors.default_value}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this profile field..."
                rows={3}
                className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Data Source Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Data Source Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Source *
                </label>
                <HeadlessSelect
                  options={DATA_SOURCE_OPTIONS}
                  value={formData.dataSource}
                  onChange={(value) => handleSelectChange("dataSource", value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency *
                </label>
                <HeadlessSelect
                  options={FREQUENCY_OPTIONS}
                  value={formData.frequency}
                  onChange={(value) => handleSelectChange("frequency", value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Platform Status *
                </label>
                <HeadlessSelect
                  options={STATUS_OPTIONS}
                  value={formData.status}
                  onChange={(value) => handleSelectChange("status", value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Extraction Logic Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Extraction Logic</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logic Type *
              </label>
              <HeadlessSelect
                options={EXTRACTION_LOGIC_TYPE_OPTIONS}
                value={formData.extractionLogicType}
                onChange={(value) => handleSelectChange("extractionLogicType", value)}
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-2">
                {formData.extractionLogicType === "segment" && "Import logic from an existing segment definition"}
                {formData.extractionLogicType === "sql_script" && "Define extraction logic using SQL script"}
                {formData.extractionLogicType === "data_source" && "Reference a table or column from a data source"}
                {formData.extractionLogicType === "not_applicable" && "Use a default value (no extraction needed)"}
              </p>
            </div>

            {formData.extractionLogicType !== "not_applicable" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.extractionLogicType === "segment" && "Segment Name *"}
                  {formData.extractionLogicType === "sql_script" && "SQL Script *"}
                  {formData.extractionLogicType === "data_source" && "Data Source Reference *"}
                </label>
                <textarea
                  name="extractionLogic"
                  value={formData.extractionLogic}
                  onChange={handleChange}
                  placeholder={
                    formData.extractionLogicType === "segment"
                      ? "e.g., customer_segment_1"
                      : formData.extractionLogicType === "sql_script"
                      ? "e.g., SELECT * FROM table WHERE condition"
                      : "e.g., BIB_ADM.FLYTXT_DX_DAILY_KPI.ACCOUNT_TYPE or table.column"
                  }
                  rows={4}
                  className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none font-mono ${
                    errors.extractionLogic ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={saving}
                />
                {errors.extractionLogic && <p className="text-red-500 text-xs mt-1">{errors.extractionLogic}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(mode === "edit" ? `/dashboard/kpis/subscriber-profiles/${id}` : "/dashboard/kpis/subscriber-profiles")}
            disabled={saving}
            className="transition-colors disabled:opacity-60"
            style={getButtonStyles(button.bordered)}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white rounded-md disabled:opacity-60"
            style={{ backgroundColor: color.primary.action }}
          >
            {saving ? (mode === "edit" ? "Updating..." : "Creating...") : (mode === "edit" ? "Update" : "Create")}
          </button>
        </div>
      </form>
    </div>
  );
}
