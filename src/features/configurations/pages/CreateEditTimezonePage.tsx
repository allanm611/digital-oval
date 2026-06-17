import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { tw, color } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import HeadlessMultiSelect from "../../../shared/components/ui/HeadlessMultiSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Textarea from "../../../shared/components/ui/Textarea";
import { timezoneService } from "../services/timezoneService";
import { TimeZone, CreateTimeZoneRequest, UpdateTimeZoneRequest } from "../types/timezone";
import { getCountriesList } from "../../../shared/services/countryDataService";

const regions = [
  { value: "Africa", label: "Africa" },
  { value: "Americas", label: "Americas" },
  { value: "Asia", label: "Asia" },
  { value: "Europe", label: "Europe" },
  { value: "Oceania", label: "Oceania" },
];

const countries = getCountriesList().map((country) => ({
  value: country.name,
  label: country.name,
}));

export default function CreateEditTimezonePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    value: "",
    label: "",
    utc_offset: "",
    abbreviation: "",
    region: "",
    representative_city: "",
    countries: [],
    uses_dst: false,
    dst_offset: "",
    dst_start_date: "",
    dst_end_date: "",
    windows_tz_id: "",
    sort_order: "",
    description: "",
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadTimezone(Number(id));
    }
  }, [id, isEditMode]);

  const loadTimezone = async (timezoneId: number) => {
    try {
      setLoading(true);
      const tz = await timezoneService.getTimezoneById(timezoneId);
      if (tz) {
        setFormData({
          value: tz.value || "",
          label: tz.label || "",
          utc_offset: tz.utc_offset || "",
          abbreviation: tz.abbreviation || "",
          region: tz.region || "",
          representative_city: tz.representative_city || "",
          countries: Array.isArray(tz.countries) ? tz.countries : [],
          uses_dst: tz.uses_dst || false,
          dst_offset: tz.dst_offset || "",
          dst_start_date: tz.dst_start_date || "",
          dst_end_date: tz.dst_end_date || "",
          windows_tz_id: tz.windows_tz_id || "",
          sort_order: tz.sort_order || "",
          description: tz.description || "",
        });
      }
    } catch (err) {
      console.error("Failed to load timezone:", err);
      showError("Failed to load timezone", extractBackendError(error, "Failed to load timezone. Please try again."));
      navigate("/dashboard/timezones");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.value.trim()) {
      showError("Validation Error", "IANA Timezone ID is required");
      return;
    }

    if (!formData.label.trim()) {
      showError("Validation Error", "Timezone Label is required");
      return;
    }

    if (!formData.utc_offset.trim()) {
      showError("Validation Error", "UTC Offset is required");
      return;
    }

    setSaving(true);
    try {
      const payload: CreateTimeZoneRequest | UpdateTimeZoneRequest = {
        value: formData.value.trim(),
        label: formData.label.trim(),
        utc_offset: formData.utc_offset.trim(),
        description: formData.description?.trim() || undefined,
        abbreviation: formData.abbreviation?.trim() || undefined,
        region: formData.region || undefined,
        representative_city: formData.representative_city?.trim() || undefined,
        countries: formData.countries && formData.countries.length > 0
          ? formData.countries
          : undefined,
        uses_dst: formData.uses_dst || false,
        dst_offset: formData.dst_offset?.trim() || undefined,
        dst_start_date: formData.dst_start_date?.trim() || undefined,
        dst_end_date: formData.dst_end_date?.trim() || undefined,
        windows_tz_id: formData.windows_tz_id?.trim() || undefined,
        sort_order: formData.sort_order ? Number(formData.sort_order) : undefined,
      };

      if (isEditMode && id) {
        await timezoneService.updateTimezone(Number(id), payload as UpdateTimeZoneRequest);
        success("Success", "Timezone updated successfully");
      } else {
        await timezoneService.createTimezone(payload as CreateTimeZoneRequest);
        success("Success", "Timezone created successfully");
      }

      navigate("/dashboard/timezones");
    } catch (err) {
      console.error("Failed to save timezone:", err);
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading timezone...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <BackButton showBreadcrumb={true} currentLabel={isEditMode ? "Edit Timezone" : "Create Timezone"} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Basic Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="IANA Timezone ID"
                  type="text"
                  value={formData.value}
                  onChange={(value) => handleInputChange("value", value)}
                  placeholder="e.g., Africa/Nairobi"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <Input
                  label="Timezone Label"
                  type="text"
                  value={formData.label}
                  onChange={(value) => handleInputChange("label", value)}
                  placeholder="e.g., East Africa Time"
                  required
                  disabled={saving}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="UTC Offset"
                  type="text"
                  value={formData.utc_offset}
                  onChange={(value) => handleInputChange("utc_offset", value)}
                  placeholder="e.g., +03:00 or -05:00"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <Input
                  label="Abbreviation"
                  type="text"
                  value={formData.abbreviation}
                  onChange={(value) => handleInputChange("abbreviation", value)}
                  placeholder="e.g., EAT, EST, PST"
                  disabled={saving}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Sort Order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(value) => handleInputChange("sort_order", value)}
                  placeholder="Numeric order for dropdown"
                  disabled={saving}
                />
              </div>
              <div>
                <Input
                  label="Windows Timezone ID"
                  type="text"
                  value={formData.windows_tz_id}
                  onChange={(value) => handleInputChange("windows_tz_id", value)}
                  placeholder="e.g., Eastern Standard Time"
                  disabled={saving}
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              placeholder="Optional description"
              rows={2}
              disabled={saving}
            />
          </div>
        </div>

        {/* Regional Information Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Regional Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <HeadlessSelect
                  label="Region"
                  options={regions}
                  value={formData.region}
                  onChange={(value) => handleInputChange("region", value)}
                  placeholder="Select region"
                  disabled={saving}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  label="Representative City"
                  type="text"
                  value={formData.representative_city}
                  onChange={(value) => handleInputChange("representative_city", value)}
                  placeholder="e.g., Nairobi, New York"
                  disabled={saving}
                />
              </div>
            </div>
            <div>
              <HeadlessMultiSelect
                label="Countries"
                options={countries}
                value={formData.countries}
                onChange={(value) => handleInputChange("countries", value)}
                placeholder="Search and select countries..."
                disabled={saving}
                searchable={true}
                maxDisplayed={3}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* DST Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Daylight Saving Time (DST)</h2>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                id="uses_dst"
                checked={formData.uses_dst}
                onChange={(e) => handleInputChange("uses_dst", e.target.checked)}
                disabled={saving}
              />
              <div className="flex-1">
                <span className="block text-sm font-medium text-gray-700">
                  This timezone uses Daylight Saving Time
                </span>
              </div>
            </label>

            {formData.uses_dst && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Input
                    label="DST Offset"
                    type="text"
                    value={formData.dst_offset}
                    onChange={(value) => handleInputChange("dst_offset", value)}
                    placeholder="e.g., -04:00"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Input
                    label="DST Start Date"
                    type="text"
                    value={formData.dst_start_date}
                    onChange={(value) => handleInputChange("dst_start_date", value)}
                    placeholder="e.g., Second Sunday in March"
                    disabled={saving}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="DST End Date"
                    type="text"
                    value={formData.dst_end_date}
                    onChange={(value) => handleInputChange("dst_end_date", value)}
                    placeholder="e.g., First Sunday in November"
                    disabled={saving}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/dashboard/timezones")}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-60"
            style={{
              background: "transparent",
              color: color.primary.action,
              border: `1px solid ${color.primary.action}`,
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60"
            style={{ backgroundColor: color.primary.action }}
          >
            {saving ? (isEditMode ? "Updating..." : "Creating...") : isEditMode ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
