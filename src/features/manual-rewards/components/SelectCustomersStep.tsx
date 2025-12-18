import { useState, useRef, useMemo, useEffect } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { quicklistService } from "../../quicklists/services/quicklistService";
import { UploadType } from "../../quicklists/types/quicklist";
import { ManualRewardData } from "../pages/CreateManualRewardPage";
import { useLanguage } from "../../../contexts/LanguageContext";

interface SelectCustomersStepProps {
  data: ManualRewardData;
  onUpdate: (data: Partial<ManualRewardData>) => void;
  onNext: () => void;
}

type InputMode = "file" | "manual";

export default function SelectCustomersStep({
  data,
  onUpdate,
  onNext,
}: SelectCustomersStepProps) {
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [file, setFile] = useState<File | null>(data.audienceFile || null);
  const [uploadType, setUploadType] = useState<string>(data.uploadType || "");
  const [name, setName] = useState(data.audienceName || "");
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
        if (types.length > 0 && !uploadType) {
          setUploadType(types[0].upload_type);
        }
      }
    } catch (err) {
      console.error("Failed to load upload types:", err);
      showError(t.manualRewards.errorLoadUploadTypes);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!validTypes.includes(selectedFile.type)) {
        setError(t.manualRewards.errorSelectFile);
        setFile(null);
        return;
      }

      const selectedUploadType = uploadTypes.find(
        (t) => t.upload_type === uploadType
      );
      if (!selectedUploadType) {
        setError(t.manualRewards.selectUploadTypeFirst);
        setFile(null);
        return;
      }

      const maxSizeMB = selectedUploadType.max_file_size_mb || 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      if (selectedFile.size > maxSizeBytes) {
        setError(
          t.manualRewards.maxFileSize.replace("{size}", String(maxSizeMB))
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
    if (inputMode === "file") {
      if (!file) {
        setError(t.manualRewards.errorSelectFile);
        return;
      }
    } else {
      if (!manualInput.trim()) {
        setError(t.manualRewards.errorEnterManual);
        return;
      }
      if (manualInputValidation.validCount === 0) {
        setError(t.manualRewards.errorNoValidContacts);
        return;
      }
    }

    if (!uploadType) {
      setError(t.manualRewards.errorSelectUploadType);
      return;
    }

    if (!name.trim()) {
      setError(t.manualRewards.errorEnterName);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const fileToUpload =
        inputMode === "manual" ? createFileFromManualInput() : file!;

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

      onUpdate({
        audienceFile: fileToUpload,
        audienceName: name.trim(),
        audienceDescription: undefined,
        uploadType: uploadType,
        quicklistId: response.data.quicklist_id,
        rowCount: response.data.rows_imported,
      });

      onNext();
    } catch (err) {
      console.error("Failed to create audience:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : t.manualRewards.errorCreateAudience;
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
        className={`bg-white ${tw.rounded} shadow-sm border p-8`}
        style={{ borderColor: color.border.default }}
      >
        <div className="text-center py-12">
          <p className={tw.textMuted}>{t.manualRewards.loading}</p>
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
        className="p-6 border-b"
        style={{ borderColor: color.border.default }}
      >
        <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
          {t.manualRewards.selectCustomersTitle}
        </h2>
        <p className={`text-sm ${tw.textSecondary} mt-1`}>
          {t.manualRewards.selectCustomersSubtitle}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* List Name */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            {t.manualRewards.listNameLabel}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none focus:ring-2`}
            style={{
              borderColor: color.border.default,
              color: color.text.primary,
            }}
            placeholder={t.manualRewards.listNamePlaceholder}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Input Mode Toggle */}
        <div>
          <label
            className={`block text-sm font-medium ${tw.textPrimary} mb-2.5`}
          >
            {t.manualRewards.inputMethodLabel}
          </label>
          <HeadlessSelect
            options={[
              { value: "file", label: t.manualRewards.inputMethodUpload },
              { value: "manual", label: t.manualRewards.inputMethodManual },
            ]}
            value={inputMode}
            onChange={(value) => setInputMode(value as InputMode)}
            placeholder={t.manualRewards.inputMethodLabel}
            disabled={isSubmitting}
            zIndex={zIndex.popover}
          />
        </div>

        {/* File Upload */}
        {inputMode === "file" && (
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary}`}>
              {t.manualRewards.uploadFileLabel}
            </label>
            {uploadType ? (
              <label
                htmlFor="audience-file-upload"
                className={`block border-2 border-dashed ${tw.rounded} p-6 text-center transition-colors cursor-pointer`}
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
                      {t.manualRewards.changeFile}
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
                        {t.manualRewards.clickToUpload}
                      </p>
                      <p className={`text-xs ${tw.textSecondary} mt-1`}>
                        {t.manualRewards.dragAndDrop}
                      </p>
                    </div>
                  </div>
                )}
              </label>
            ) : (
              <div
                className={`border-2 border-dashed ${tw.rounded} p-6 text-center opacity-50 cursor-not-allowed`}
                style={{ borderColor: color.border.default }}
              >
                <Upload
                  className="w-12 h-12 mx-auto"
                  style={{ color: color.text.muted }}
                />
                <div className="space-y-3 mt-3">
                  <p className={`text-sm font-medium ${tw.textPrimary}`}>
                    {t.manualRewards.clickToUpload}
                  </p>
                  <p className={`text-xs ${tw.textSecondary}`}>
                    {t.manualRewards.selectUploadTypeFirst}
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
              {t.manualRewards.manualEntryLabel}
            </label>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none focus:ring-2 font-mono`}
              style={{
                borderColor: color.border.default,
                color: color.text.primary,
              }}
              placeholder={t.manualRewards.manualEntryPlaceholder}
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
                    {t.manualRewards.validationValid.replace(
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
                      {t.manualRewards.validationInvalid.replace(
                        "{count}",
                        String(manualInputValidation.invalidCount)
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            <p className={`mt-2 text-xs ${tw.textSecondary}`}>
              {t.manualRewards.manualEntryHelp}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className={`p-3 ${tw.rounded} flex items-start space-x-2`}
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
          className={`px-6 py-2.5 text-white ${tw.rounded} transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
          style={{ backgroundColor: color.primary.action }}
        >
          {isSubmitting
            ? t.manualRewards.creatingAudience
            : t.manualRewards.nextDefineReward}
        </button>
      </div>
    </div>
  );
}
