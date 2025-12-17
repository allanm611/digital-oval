import { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { quicklistService } from "../../quicklists/services/quicklistService";
import { UploadType } from "../../quicklists/types/quicklist";
import { ManualBroadcastData } from "../pages/CreateManualBroadcastPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import QuickListForm, {
  QuickListFormData,
  createExcelFileFromManualInput,
} from "../../../shared/components/QuickListForm";

interface TargetAudienceStepProps {
  data: ManualBroadcastData;
  onUpdate: (data: Partial<ManualBroadcastData>) => void;
  onNext: () => void;
}

export default function TargetAudienceStep({
  data,
  onUpdate,
  onNext,
}: TargetAudienceStepProps) {
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const [formData, setFormData] = useState<QuickListFormData | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadTypes, setUploadTypes] = useState<UploadType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUploadTypes();
  }, []);

  const loadUploadTypes = async () => {
    try {
      setLoading(true);
      const response = await quicklistService.getUploadTypes({
        activeOnly: true,
      });
      if (response.success) {
        const types = response.data || [];
        setUploadTypes(types);
      }
    } catch (err) {
      console.error("Failed to load upload types:", err);
      showError(t.manualBroadcast.errorLoadUploadTypes);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = useCallback((formDataUpdate: QuickListFormData) => {
    setFormData(formDataUpdate);
    setError(""); // Clear error when form changes
  }, []);

  const handleNext = async () => {
    if (!formData) {
      setError(t.manualBroadcast.errorSelectFile);
      return;
    }

    // Validation based on input mode
    if (formData.inputMode === "file") {
      if (!formData.file) {
        setError(t.manualBroadcast.errorSelectFile);
        return;
      }
    } else {
      if (formData.validCount === 0) {
        setError(t.manualBroadcast.errorNoValidContacts);
        return;
      }
    }

    if (!formData.uploadType) {
      setError(t.manualBroadcast.errorSelectUploadType);
      return;
    }

    if (!formData.name.trim()) {
      setError(t.manualBroadcast.errorEnterName);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Create file from manual input if in manual mode
      const fileToUpload =
        formData.inputMode === "manual"
          ? createExcelFileFromManualInput(
              formData.manualInput,
              uploadTypes,
              formData.uploadType
            )
          : formData.file!;

      // Upload quicklist
      const response = await quicklistService.createQuickList({
        file: fileToUpload,
        upload_type: formData.uploadType,
        name: formData.name.trim(),
        description: formData.description || null,
        created_by: null,
      });

      if (!response.success) {
        throw new Error(
          "error" in response ? response.error : "Failed to create audience"
        );
      }

      // Update broadcast data
      onUpdate({
        audienceFile: fileToUpload,
        audienceName: formData.name.trim(),
        audienceDescription: formData.description || undefined,
        uploadType: formData.uploadType,
        quicklistId: response.data.quicklist_id,
        rowCount: response.data.rows_imported,
      });

      // Move to next step
      onNext();
    } catch (err) {
      console.error("Failed to create audience:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : t.manualBroadcast.errorCreateAudience;
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`bg-white ${tw.rounded} shadow-sm border p-8`}
        style={{ borderColor: color.border.default }}
      >
        <div className="text-center py-12">
          <p className={tw.textMuted}>{t.manualBroadcast.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white ${tw.rounded} shadow-sm border`}
      style={{ borderColor: color.border.default }}
    >
      <div
        className="p-4 sm:p-6 border-b"
        style={{ borderColor: color.border.default }}
      >
        <h2 className={`text-lg sm:text-xl font-semibold ${tw.textPrimary}`}>
          {t.manualBroadcast.targetAudienceTitle}
        </h2>
        <p className={`text-xs sm:text-sm ${tw.textSecondary} mt-1`}>
          {t.manualBroadcast.targetAudienceSubtitle}
        </p>
      </div>

      <div className="p-4 sm:p-6">
        {/* Shared QuickList Form */}
        <QuickListForm
          uploadTypes={uploadTypes}
          initialData={{
            file: data.audienceFile || null,
            uploadType: data.uploadType || "",
            name: data.audienceName || "",
            description: data.audienceDescription || "",
            inputMode: "file",
            manualInput: "",
          }}
          onChange={handleFormChange}
          disabled={isSubmitting}
          showDescription={false}
        />

        {/* Error Message */}
        {error && (
          <div
            className={`mt-6 p-3 ${tw.rounded} flex items-start space-x-2`}
            style={{
              backgroundColor: `${color.status.danger}10`,
              border: `1px solid ${color.status.danger}30`,
            }}
          >
            <AlertCircle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: color.status.danger }}
            />
            <p className="text-sm" style={{ color: color.status.danger }}>
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="p-4 sm:p-6 border-t flex items-center justify-end"
        style={{ borderColor: color.border.default }}
      >
        <button
          onClick={handleNext}
          disabled={
            isSubmitting ||
            !formData?.uploadType ||
            !formData?.name.trim() ||
            (formData?.inputMode === "file" && !formData?.file) ||
            (formData?.inputMode === "manual" && formData?.validCount === 0)
          }
          className={`w-full sm:w-auto px-6 py-2.5 text-white ${tw.rounded} transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
          style={{ backgroundColor: color.primary.action }}
        >
          {isSubmitting
            ? t.manualBroadcast.creatingAudience
            : t.manualBroadcast.nextDefineCommunication}
        </button>
      </div>
    </div>
  );
}
