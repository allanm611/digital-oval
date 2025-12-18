import { useState, useMemo, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { quicklistService } from "../../quicklists/services/quicklistService";
import { UploadType } from "../../quicklists/types/quicklist";
import { ManualBroadcastData } from "../pages/CreateManualBroadcastPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import AudienceCreator, {
  AudienceCreatorData,
} from "../../../shared/components/AudienceCreator";

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
  const [audienceData, setAudienceData] = useState<
    Partial<AudienceCreatorData>
  >({
    inputMethod: data.inputMethod || "file",
    file: data.audienceFile || undefined,
    uploadType: data.uploadType || "",
    listType: "Standard", // Default for broadcasts
    name: data.audienceName || "",
    fileColumns: data.fileColumns || [],
    subscriptionIdColumn: data.subscriptionIdColumn || null,
    manualInput: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadTypes, setUploadTypes] = useState<UploadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormValid, setIsFormValid] = useState(false);

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
        // Set first upload type as default if not already set
        if (types.length > 0 && !audienceData.uploadType) {
          setAudienceData((prev) => ({
            ...prev,
            uploadType: types[0].upload_type,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load upload types:", err);
      showError(t.manualBroadcast.errorLoadUploadTypes);
    } finally {
      setLoading(false);
    }
  };

  const manualInputValidation = useMemo(() => {
    if (!audienceData.manualInput?.trim()) {
      return { valid: [], invalid: [], validCount: 0, invalidCount: 0 };
    }

    const lines = audienceData.manualInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[0-9\s()-]{8,}$/;

    const valid: string[] = [];
    const invalid: string[] = [];

    lines.forEach((line) => {
      if (emailRegex.test(line) || phoneRegex.test(line)) {
        valid.push(line);
      } else {
        invalid.push(line);
      }
    });

    return {
      valid,
      invalid,
      validCount: valid.length,
      invalidCount: invalid.length,
    };
  }, [audienceData.manualInput]);

  const createFileFromManualInput = (): File => {
    const selectedType = uploadTypes.find(
      (t) => t.upload_type === audienceData.uploadType
    );
    if (!selectedType) {
      throw new Error("Upload type not selected");
    }

    let columns: string[] = [];
    if (Array.isArray(selectedType.expected_columns)) {
      columns = selectedType.expected_columns;
    } else if (
      typeof selectedType.expected_columns === "object" &&
      selectedType.expected_columns !== null
    ) {
      columns = Object.keys(selectedType.expected_columns);
    }

    if (columns.length === 0) {
      throw new Error("No expected columns defined for this upload type");
    }

    const worksheetData: string[][] = [columns];

    const emailColumnIndex = columns.findIndex((col) =>
      col.toLowerCase().includes("email")
    );
    const phoneColumnIndex = columns.findIndex(
      (col) =>
        col.toLowerCase().includes("phone") ||
        col.toLowerCase().includes("mobile")
    );

    manualInputValidation.valid.forEach((contact) => {
      const row = new Array(columns.length).fill("");
      const isEmail = contact.includes("@");

      if (isEmail && emailColumnIndex !== -1) {
        row[emailColumnIndex] = contact;
      } else if (!isEmail && phoneColumnIndex !== -1) {
        row[phoneColumnIndex] = contact.replace(/\s/g, "");
      } else {
        row[0] = isEmail ? contact : contact.replace(/\s/g, "");
      }

      worksheetData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return new File([blob], `manual_input_${Date.now()}.xlsx`, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  const handleNext = async () => {
    // Validation
    if (!isFormValid) {
      setError("Please fill in all required fields");
      return;
    }

    if (audienceData.inputMethod === "file") {
      if (!audienceData.file) {
        setError(t.manualBroadcast.errorSelectFile);
        return;
      }
      // Validate Subscription ID selection for file mode
      if (
        audienceData.fileColumns &&
        audienceData.fileColumns.length > 0 &&
        !audienceData.subscriptionIdColumn
      ) {
        setError(t.manualBroadcast.errorSelectSubscriptionId);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Create file from manual input if in manual mode
      const fileToUpload =
        audienceData.inputMethod === "manual"
          ? createFileFromManualInput()
          : audienceData.file!;

      // Upload quicklist
      const response = await quicklistService.createQuickList({
        file: fileToUpload,
        upload_type: audienceData.uploadType || "",
        name: audienceData.name || "",
        description: null,
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
        audienceName: audienceData.name || "",
        audienceDescription: undefined,
        uploadType: audienceData.uploadType || "",
        quicklistId: response.data.quicklist_id,
        rowCount: response.data.rows_imported,
        subscriptionIdColumn:
          audienceData.inputMethod === "file"
            ? audienceData.subscriptionIdColumn || undefined
            : undefined,
        fileColumns:
          audienceData.inputMethod === "file"
            ? audienceData.fileColumns
            : undefined,
        inputMethod: audienceData.inputMethod,
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

  const downloadTemplate = () => {
    if (!audienceData.uploadType) return;

    const selectedType = uploadTypes.find(
      (t) => t.upload_type === audienceData.uploadType
    );
    if (!selectedType) return;

    let columns: string[] = [];
    if (Array.isArray(selectedType.expected_columns)) {
      columns = selectedType.expected_columns;
    } else if (
      typeof selectedType.expected_columns === "object" &&
      selectedType.expected_columns !== null
    ) {
      columns = Object.keys(selectedType.expected_columns);
    }

    if (columns.length === 0) return;

    const escapeCsvValue = (value: string): string => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const BOM = "\uFEFF";
    const headerRow = columns.map(escapeCsvValue).join(",");
    const exampleRow = columns.map(() => "").join(",");
    const fullContent = BOM + headerRow + "\n" + exampleRow + "\n";

    const blob = new Blob([fullContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${uploadType}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <div
        className="bg-white rounded-md shadow-sm border p-8"
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
      className="bg-white rounded-md shadow-sm border"
      style={{ borderColor: color.border.default }}
    >
      <div
        className="p-6 border-b"
        style={{ borderColor: color.border.default }}
      >
        <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
          {t.manualBroadcast.targetAudienceTitle}
        </h2>
        <p className={`text-sm ${tw.textSecondary} mt-1`}>
          {t.manualBroadcast.targetAudienceSubtitle}
        </p>
      </div>

      <div className="p-6">
        <AudienceCreator
          mode="broadcast"
          data={audienceData}
          onUpdate={setAudienceData}
          uploadTypes={uploadTypes}
          disabled={isSubmitting}
          showSubscriptionIdSelector={true}
          onValidationChange={setIsFormValid}
        />
      </div>

      <div className="px-6 pb-6">
        {/* Error Message */}
        {error && (
          <div
            className="p-3 rounded-md flex items-start space-x-2"
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

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || !isFormValid}
            className="px-4 py-2 rounded-md transition-colors text-sm font-medium text-white"
            style={{
              backgroundColor:
                isSubmitting || !isFormValid
                  ? color.text.muted
                  : color.primary.action,
              cursor: isSubmitting || !isFormValid ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating Audience...
              </>
            ) : (
              "Next: Define Communication"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
