import { useState, useRef, useMemo, useEffect } from "react";
import { Upload, Edit3, FileText, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { quicklistService } from "../../quicklists/services/quicklistService";
import { UploadType } from "../../quicklists/types/quicklist";
import { ManualBroadcastData } from "../pages/CreateManualBroadcastPage";
import { useLanguage } from "../../../contexts/LanguageContext";

interface TargetAudienceStepProps {
  data: ManualBroadcastData;
  onUpdate: (data: Partial<ManualBroadcastData>) => void;
  onNext: () => void;
}

type InputMode = "file" | "manual";

export default function TargetAudienceStep({
  data,
  onUpdate,
  onNext,
}: TargetAudienceStepProps) {
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [file, setFile] = useState<File | null>(data.audienceFile || null);
  const [uploadType, setUploadType] = useState<string>(data.uploadType || "");
  const [name, setName] = useState(data.audienceName || "");
  const [listType, setListType] = useState("Standard");
  const [manualInput, setManualInput] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadTypes, setUploadTypes] = useState<UploadType[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (types.length > 0 && !uploadType) {
          setUploadType(types[0].upload_type);
        }
      }
    } catch (err) {
      console.error("Failed to load upload types:", err);
      showError(t.manualBroadcast.errorLoadUploadTypes);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!validTypes.includes(selectedFile.type)) {
        setError(t.manualBroadcast.errorSelectFile);
        setFile(null);
        return;
      }

      // Validate file size
      const selectedUploadType = uploadTypes.find(
        (t) => t.upload_type === uploadType
      );
      if (!selectedUploadType) {
        setError(t.manualBroadcast.selectUploadTypeFirst);
        setFile(null);
        return;
      }

      const maxSizeMB = selectedUploadType.max_file_size_mb || 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      if (selectedFile.size > maxSizeBytes) {
        setError(
          t.manualBroadcast.maxFileSize.replace("{size}", String(maxSizeMB))
        );
        setFile(null);
        return;
      }

      setFile(selectedFile);
      if (!name) {
        const filename = selectedFile.name.replace(/\.[^/.]+$/, "");
        setName(filename);
      }
      setError("");
    }
  };

  const manualInputValidation = useMemo(() => {
    if (!manualInput.trim()) {
      return { valid: [], invalid: [], validCount: 0, invalidCount: 0 };
    }

    const lines = manualInput
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
  }, [manualInput]);

  const createFileFromManualInput = (): File => {
    const selectedType = uploadTypes.find((t) => t.upload_type === uploadType);
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
    if (inputMode === "file") {
      if (!file) {
        setError(t.manualBroadcast.errorSelectFile);
        return;
      }
    } else {
      if (!manualInput.trim()) {
        setError(t.manualBroadcast.errorEnterManual);
        return;
      }
      if (manualInputValidation.validCount === 0) {
        setError(t.manualBroadcast.errorNoValidContacts);
        return;
      }
    }

    if (!uploadType) {
      setError(t.manualBroadcast.errorSelectUploadType);
      return;
    }

    if (!name.trim()) {
      setError(t.manualBroadcast.errorEnterName);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Create file from manual input if in manual mode
      const fileToUpload =
        inputMode === "manual" ? createFileFromManualInput() : file!;

      // Upload quicklist
      const response = await quicklistService.createQuickList({
        file: fileToUpload,
        upload_type: uploadType,
        name: name.trim(),
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
        audienceName: name.trim(),
        audienceDescription: undefined,
        uploadType: uploadType,
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

  const downloadTemplate = () => {
    if (!uploadType) return;

    const selectedType = uploadTypes.find((t) => t.upload_type === uploadType);
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

      <div className="p-6 space-y-6">
        {/* List Name */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            {t.manualBroadcast.listNameLabel}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2"
            style={{
              borderColor: color.border.default,
              color: color.text.primary,
            }}
            placeholder={t.manualBroadcast.listNamePlaceholder}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* List Type */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            {t.manualBroadcast.listTypeLabel}
          </label>
          <HeadlessSelect
            options={[
              { value: "Standard", label: t.manualBroadcast.listTypeStandard },
              { value: "Premium", label: t.manualBroadcast.listTypePremium },
              { value: "VIP", label: t.manualBroadcast.listTypeVIP },
            ]}
            value={listType}
            onChange={(value) => setListType(value as string)}
            placeholder={t.manualBroadcast.listTypePlaceholder}
            disabled={isSubmitting}
          />
        </div>

        {/* Input Mode Toggle */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-3`}>
            {t.manualBroadcast.inputMethodLabel}
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setInputMode("file")}
              disabled={isSubmitting}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md border-2 transition-all whitespace-nowrap"
              style={{
                borderColor:
                  inputMode === "file"
                    ? color.primary.action
                    : color.border.default,
                backgroundColor:
                  inputMode === "file" ? color.primary.action : "white",
                color: inputMode === "file" ? "white" : color.text.primary,
                opacity: isSubmitting ? 0.5 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              <Upload className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">
                {t.manualBroadcast.inputMethodUpload}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode("manual")}
              disabled={isSubmitting}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md border-2 transition-all whitespace-nowrap"
              style={{
                borderColor:
                  inputMode === "manual"
                    ? color.primary.action
                    : color.border.default,
                backgroundColor:
                  inputMode === "manual" ? color.primary.action : "white",
                color: inputMode === "manual" ? "white" : color.text.primary,
                opacity: isSubmitting ? 0.5 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              <Edit3 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">
                {t.manualBroadcast.inputMethodManual}
              </span>
            </button>
          </div>
        </div>

        {/* File Upload */}
        {inputMode === "file" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-sm font-medium ${tw.textPrimary}`}>
                {t.manualBroadcast.uploadFileLabel}
              </label>
              {uploadType && (
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="text-xs font-medium hover:underline"
                  style={{ color: color.primary.accent }}
                >
                  {t.manualBroadcast.downloadTemplate}
                </button>
              )}
            </div>
            <p className={`text-xs ${tw.textSecondary} mb-3`}>
              {t.manualBroadcast.uploadFileHelper}
            </p>
            {uploadType ? (
              <label
                htmlFor="audience-file-upload"
                className="block border-2 border-dashed rounded-md p-6 text-center transition-colors cursor-pointer"
                style={{
                  borderColor: color.border.default,
                  opacity: isSubmitting ? 0.5 : 1,
                }}
              >
                <input
                  id="audience-file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
                {file ? (
                  <div className="space-y-3">
                    <FileText
                      className="w-12 h-12 mx-auto"
                      style={{ color: color.status.success }}
                    />
                    <div>
                      <p className={`text-sm font-medium ${tw.textPrimary}`}>
                        {file.name}
                      </p>
                      <p className={`text-xs ${tw.textSecondary} mt-1`}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                      className="text-sm font-medium cursor-pointer"
                      style={{ color: color.primary.accent }}
                    >
                      {t.manualBroadcast.changeFile}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload
                      className="w-12 h-12 mx-auto"
                      style={{ color: color.text.muted }}
                    />
                    <div>
                      <p className={`text-sm font-medium ${tw.textPrimary}`}>
                        {t.manualBroadcast.clickToUpload}
                      </p>
                      <p className={`text-xs ${tw.textSecondary} mt-1`}>
                        {t.manualBroadcast.dragAndDrop}
                      </p>
                    </div>
                    <p className={`text-xs ${tw.textSecondary}`}>
                      {t.manualBroadcast.maxFileSize.replace(
                        "{size}",
                        String(
                          uploadTypes.find((t) => t.upload_type === uploadType)
                            ?.max_file_size_mb || 10
                        )
                      )}
                    </p>
                  </div>
                )}
              </label>
            ) : (
              <div
                className="border-2 border-dashed rounded-md p-6 text-center opacity-50 cursor-not-allowed"
                style={{ borderColor: color.border.default }}
              >
                <Upload
                  className="w-12 h-12 mx-auto"
                  style={{ color: color.text.muted }}
                />
                <div className="space-y-3 mt-3">
                  <p className={`text-sm font-medium ${tw.textPrimary}`}>
                    {t.manualBroadcast.clickToUpload}
                  </p>
                  <p className={`text-xs ${tw.textSecondary}`}>
                    {t.manualBroadcast.selectUploadTypeFirst}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Entry */}
        {inputMode === "manual" && (
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
            >
              {t.manualBroadcast.manualEntryLabel}
            </label>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 font-mono"
              style={{
                borderColor: color.border.default,
                color: color.text.primary,
              }}
              placeholder={t.manualBroadcast.manualEntryPlaceholder}
              rows={10}
              disabled={isSubmitting}
            />

            {/* Validation Summary */}
            {manualInput.trim() && (
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color.status.success }}
                  ></div>
                  <span
                    className="font-medium"
                    style={{ color: color.status.success }}
                  >
                    {t.manualBroadcast.validationValid.replace(
                      "{count}",
                      String(manualInputValidation.validCount)
                    )}
                  </span>
                </div>
                {manualInputValidation.invalidCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color.status.danger }}
                    ></div>
                    <span
                      className="font-medium"
                      style={{ color: color.status.danger }}
                    >
                      {t.manualBroadcast.validationInvalid.replace(
                        "{count}",
                        String(manualInputValidation.invalidCount)
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            <p className={`mt-2 text-xs ${tw.textSecondary}`}>
              {t.manualBroadcast.manualEntryHelp}
            </p>
          </div>
        )}

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
      </div>

      {/* Footer */}
      <div
        className="p-6 border-t flex items-center justify-end"
        style={{ borderColor: color.border.default }}
      >
        <button
          onClick={handleNext}
          disabled={
            isSubmitting ||
            !uploadType ||
            !name.trim() ||
            (inputMode === "file" && !file) ||
            (inputMode === "manual" && manualInputValidation.validCount === 0)
          }
          className="px-6 py-2.5 text-white rounded-md transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
