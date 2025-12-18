import { useState, useRef, useMemo, useEffect } from "react";
import {
  Upload,
  FileText,
  // AlertCircle,
  // Download,
  Edit3,
} from "lucide-react";
import * as XLSX from "xlsx";
import { color, tw, zIndex } from "../utils/utils";
import { UploadType } from "../../features/quicklists/types/quicklist";
import HeadlessSelect from "./ui/HeadlessSelect";
import SubscriptionIdSelector from "../../features/manual-broadcast/components/SubscriptionIdSelector";

type InputMode = "file" | "manual";

export interface AudienceCreatorData {
  inputMethod: "file" | "manual";
  file?: File;
  uploadType: string;
  listType?: string; // For broadcasts: Standard, Premium, VIP
  name: string;
  description?: string;
  fileColumns: string[];
  subscriptionIdColumn?: string | null;
  manualInput: string;
}

interface AudienceCreatorProps {
  mode: "quicklist" | "broadcast"; // Different UX contexts
  data: Partial<AudienceCreatorData>;
  onUpdate: (data: Partial<AudienceCreatorData>) => void;
  uploadTypes: UploadType[];
  disabled?: boolean;
  showSubscriptionIdSelector?: boolean; // Only for broadcasts
  onValidationChange?: (isValid: boolean) => void;
}

export default function AudienceCreator({
  mode,
  data,
  onUpdate,
  uploadTypes,
  disabled = false,
  showSubscriptionIdSelector = false,
  onValidationChange,
}: AudienceCreatorProps) {
  const [inputMode, setInputMode] = useState<InputMode>(
    data.inputMethod || "file"
  );
  const [file, setFile] = useState<File | null>(data.file || null);
  const [uploadType, setUploadType] = useState<string>(data.uploadType || "");
  const [listType, setListType] = useState(data.listType || "Standard");
  const [name, setName] = useState(data.name || "");
  const [description, setDescription] = useState(data.description || "");
  const [manualInput, setManualInput] = useState(data.manualInput || "");
  const [fileColumns, setFileColumns] = useState<string[]>(
    data.fileColumns || []
  );
  const [subscriptionIdColumn, setSubscriptionIdColumn] = useState<
    string | null
  >(data.subscriptionIdColumn || null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [filePreview, setFilePreview] = useState<{
    headers: string[];
    rows: string[][];
    totalRows: number;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify parent of validation status
  useEffect(() => {
    if (onValidationChange) {
      const isValid = validateForm();
      onValidationChange(isValid);
    }
  }, [
    inputMode,
    file,
    uploadType,
    listType,
    name,
    manualInput,
    fileColumns,
    subscriptionIdColumn,
  ]);

  // Update parent data whenever local state changes
  useEffect(() => {
    onUpdate({
      inputMethod: inputMode,
      file: file || undefined,
      uploadType: mode === "quicklist" ? uploadType : "",
      listType: mode === "broadcast" ? listType : undefined,
      name,
      description,
      fileColumns,
      subscriptionIdColumn,
      manualInput,
    });
  }, [
    inputMode,
    file,
    uploadType,
    listType,
    name,
    description,
    fileColumns,
    subscriptionIdColumn,
    manualInput,
  ]);

  const validateForm = (): boolean => {
    if (!name.trim()) return false;

    if (mode === "quicklist" && !uploadType) return false;
    if (mode === "broadcast" && !listType) return false;

    if (inputMode === "file") {
      if (!file) return false;
      if (
        showSubscriptionIdSelector &&
        fileColumns.length > 0 &&
        !subscriptionIdColumn
      )
        return false;
    } else {
      if (!manualInput.trim()) return false;
      if (manualInputValidation.validCount === 0) return false;
    }

    return true;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const manualInputValidation = useMemo(() => {
    if (!manualInput.trim())
      return { validCount: 0, invalidCount: 0, valid: [], invalid: [] };

    const lines = manualInput.split("\n").filter((line) => line.trim());
    const valid: string[] = [];
    const invalid: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // Basic phone validation (allows international formats, spaces, dashes, parentheses)
      const normalized = trimmed.replace(/[\s()-]/g, "");
      const phoneRegex = /^[\+]?\d{8,16}$/;

      if (emailRegex.test(trimmed) || phoneRegex.test(normalized)) {
        valid.push(trimmed);
      } else {
        invalid.push(trimmed);
      }
    });

    return {
      validCount: valid.length,
      invalidCount: invalid.length,
      valid,
      invalid,
    };
  }, [manualInput]);

  const parseFileColumns = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as any[][];

          if (jsonData.length === 0) {
            resolve([]);
            return;
          }

          const headers = jsonData[0] as string[];
          resolve(headers.filter((header) => header && header.trim()));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!validTypes.includes(selectedFile.type)) {
        setFileError("Please select a valid Excel file (.xlsx or .xls)");
        setFile(null);
        setFileColumns([]);
        setSubscriptionIdColumn(null);
        return;
      }

      // Get max size from upload type (for quicklists)
      let maxSizeMB = 10; // Default
      if (mode === "quicklist") {
        const selectedUploadType = uploadTypes.find(
          (t) => t.upload_type === uploadType
        );
        maxSizeMB = selectedUploadType?.max_file_size_mb || 10;
      }

      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (selectedFile.size > maxSizeBytes) {
        setFileError(`File size must be less than ${maxSizeMB}MB`);
        setFile(null);
        setFileColumns([]);
        setSubscriptionIdColumn(null);
        return;
      }

      setFile(selectedFile);
      setFileError(null);

      // Parse file columns and generate preview
      try {
        setIsParsingFile(true);
        const columns = await parseFileColumns(selectedFile);
        setFileColumns(columns);

        // Reset subscription ID if it's not in the new columns
        if (!columns.includes(subscriptionIdColumn || "")) {
          setSubscriptionIdColumn(null);
        }

        // Generate file preview
        const preview = await generateFilePreview(selectedFile, columns);
        setFilePreview(preview);
      } catch (error) {
        console.error("Failed to parse file:", error);
        setFileColumns([]);
        setSubscriptionIdColumn(null);
        setFilePreview(null);
        setFileError(
          "Failed to read file. Please ensure the file is a valid Excel document."
        );
      } finally {
        setIsParsingFile(false);
      }
    }
  };

  const generateFilePreview = async (file: File, columns: string[]) => {
    return new Promise<{
      headers: string[];
      rows: string[][];
      totalRows: number;
    }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as any[][];

          if (jsonData.length === 0) {
            resolve({ headers: columns, rows: [], totalRows: 0 });
            return;
          }

          // First row is headers, get data rows
          const dataRows = jsonData.slice(1);

          // Limit preview to first 5 rows
          const previewRows = dataRows
            .slice(0, 5)
            .map((row) => columns.map((_, index) => String(row[index] || "")));

          resolve({
            headers: columns,
            rows: previewRows,
            totalRows: dataRows.length,
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const downloadTemplate = () => {
    let selectedType: UploadType | undefined;

    if (mode === "quicklist") {
      if (!uploadType) return;
      selectedType = uploadTypes.find((t) => t.upload_type === uploadType);
    } else {
      // For broadcast mode, use the first available upload type
      selectedType = uploadTypes.length > 0 ? uploadTypes[0] : undefined;
    }

    if (!selectedType) return;

    const expectedColumns = selectedType.expected_columns;
    const headers = Array.isArray(expectedColumns)
      ? expectedColumns
      : typeof expectedColumns === "object" && expectedColumns !== null
      ? Object.keys(expectedColumns)
      : ["email", "phone"];

    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${uploadType}_template.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getTypeOptions = () => {
    if (mode === "quicklist") {
      return [
        { value: "", label: "Select upload type" },
        ...uploadTypes.map((type) => ({
          value: type.upload_type,
          label: type.description
            ? `${type.upload_type} - ${type.description}`
            : type.upload_type,
        })),
      ];
    } else {
      // Broadcast mode - business-oriented list types
      return [
        { value: "", label: "Select list type" },
        { value: "Standard", label: "Standard" },
        { value: "Premium", label: "Premium" },
        { value: "VIP", label: "VIP" },
      ];
    }
  };

  const getTypeLabel = () => {
    return mode === "quicklist" ? "Upload Type *" : "List Type";
  };

  const getTypeValue = () => {
    return mode === "quicklist" ? uploadType : listType;
  };

  const handleTypeChange = (value: string) => {
    if (mode === "quicklist") {
      setUploadType(value);
      // Reset file when upload type changes
      setFile(null);
      setFileColumns([]);
      setSubscriptionIdColumn(null);
      setFileError(null);
      setFilePreview(null);
    } else {
      setListType(value);
    }
  };

  const handleInputModeChange = (newMode: InputMode) => {
    setInputMode(newMode);
    if (newMode === "manual") {
      // Clear file-related state when switching to manual
      setFile(null);
      setFileColumns([]);
      setSubscriptionIdColumn(null);
      setFileError(null);
      setFilePreview(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Name */}
      <div>
        <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
          {mode === "quicklist" ? "Name *" : "List Name *"}
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
          placeholder={
            mode === "quicklist"
              ? "Enter a descriptive name"
              : "Enter audience name"
          }
          required
          disabled={disabled}
        />
      </div>

      {/* Type Selection */}
      <div>
        <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
          {getTypeLabel()}
        </label>
        <HeadlessSelect
          options={getTypeOptions()}
          value={getTypeValue()}
          onChange={(value) => handleTypeChange(value as string)}
          placeholder={
            mode === "quicklist" ? "Select upload type" : "Select list type"
          }
          disabled={disabled}
          zIndex={zIndex.popover}
        />
        {mode === "quicklist" &&
          uploadType &&
          (() => {
            const selectedType = uploadTypes.find(
              (t) => t.upload_type === uploadType
            );
            const expectedColumns = selectedType?.expected_columns;
            const columnsDisplay = Array.isArray(expectedColumns)
              ? expectedColumns.join(", ")
              : typeof expectedColumns === "object" && expectedColumns !== null
              ? Object.keys(expectedColumns).join(", ")
              : "N/A";

            return (
              <div
                className={`mt-2 p-3 rounded-md`}
                style={{ backgroundColor: `${color.primary.accent}10` }}
              >
                <p className="text-xs" style={{ color: color.primary.accent }}>
                  <strong>Expected columns:</strong> {columnsDisplay}
                </p>
              </div>
            );
          })()}
      </div>

      {/* Description - Only for QuickLists */}
      {mode === "quicklist" && (
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2`}
            style={{
              borderColor: color.border.default,
              color: color.text.primary,
            }}
            placeholder="Add a description for this QuickList"
            rows={3}
            disabled={disabled}
          />
        </div>
      )}

      {/* Input Mode Selection */}
      <div>
        <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
          Input Method
        </label>
        <HeadlessSelect
          options={[
            { value: "file", label: "Upload File" },
            { value: "manual", label: "Manual Entry" },
          ]}
          value={inputMode}
          onChange={(value) => handleInputModeChange(value as InputMode)}
          placeholder="Select input method"
          disabled={disabled}
          zIndex={zIndex.popover}
        />
      </div>

      {/* File Upload */}
      {inputMode === "file" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`block text-sm font-medium ${tw.textPrimary}`}>
              Upload File
            </label>
            {/* Commented out download template functionality
            {((mode === "quicklist" && uploadType) || mode === "broadcast") && (
              <button
                type="button"
                onClick={downloadTemplate}
                className="text-xs font-medium hover:underline"
                style={{ color: color.primary.accent }}
                disabled={disabled}
              >
                Download Template
              </button>
            )} */}
          </div>
          <p className={`text-xs mb-3`} style={{ color: color.text.secondary }}>
            {mode === "quicklist"
              ? "Upload an Excel file with your contact data"
              : "Upload an Excel file with recipient information"}
          </p>
          {(mode === "quicklist" ? uploadType : true) ? (
            <>
              <label
                htmlFor="file-upload"
                className="block border-2 border-dashed rounded-md p-6 text-center transition-colors cursor-pointer"
                style={{
                  borderColor: color.border.default,
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={disabled}
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
                      <p
                        className={`text-xs mt-1`}
                        style={{ color: color.text.secondary }}
                      >
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload
                      className="w-12 h-12 mx-auto"
                      style={{ color: color.text.secondary }}
                    />
                    <div>
                      <p className={`text-sm font-medium ${tw.textPrimary}`}>
                        Click to upload
                      </p>
                      <p
                        className={`text-xs mt-1`}
                        style={{ color: color.text.secondary }}
                      >
                        or drag and drop
                      </p>
                    </div>
                    <p
                      className={`text-xs`}
                      style={{ color: color.text.secondary }}
                    >
                      Excel files (.xlsx, .xls) up to{" "}
                      {mode === "quicklist"
                        ? uploadTypes.find((t) => t.upload_type === uploadType)
                            ?.max_file_size_mb || 10
                        : 10}
                      MB
                    </p>
                  </div>
                )}
              </label>
              {fileError && (
                <div
                  className="mt-2 p-2 rounded-md text-xs"
                  style={{
                    backgroundColor: `${color.status.danger}10`,
                    border: `1px solid ${color.status.danger}30`,
                    color: color.status.danger,
                  }}
                >
                  {fileError}
                </div>
              )}

              {/* File Preview */}
              {filePreview && filePreview.headers.length > 0 && (
                <div className="mt-4">
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                  >
                    File Preview ({filePreview.totalRows} total rows)
                  </label>
                  <div
                    className={`overflow-x-auto border border-gray-200 ${tw.rounded}`}
                  >
                    <table className="w-full">
                      <thead
                        style={{
                          background: color.surface.tableHeader,
                          color: color.surface.tableHeaderText,
                        }}
                      >
                        <tr>
                          {filePreview.headers.map((header, index) => (
                            <th
                              key={index}
                              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                        }}
                      >
                        {filePreview.rows.length > 0 ? (
                          filePreview.rows.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              {row.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-4 py-3 text-sm"
                                  style={{ color: color.text.primary }}
                                >
                                  {cell || "-"}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={filePreview.headers.length}
                              className="px-4 py-8 text-center text-sm text-gray-500"
                            >
                              No data rows found in file
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filePreview.totalRows > 5 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Showing first 5 rows. Total: {filePreview.totalRows} rows
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div
              className={`border-2 border-dashed rounded-md p-6 text-center opacity-50 cursor-not-allowed`}
              style={{ borderColor: color.border.default }}
            >
              <Upload
                className="w-12 h-12 mx-auto"
                style={{ color: color.text.muted }}
              />
              <div className="space-y-3 mt-3">
                <p className={`text-sm font-medium ${tw.textPrimary}`}>
                  Upload file
                </p>
                <p
                  className={`text-xs`}
                  style={{ color: color.text.secondary }}
                >
                  Please select a{" "}
                  {mode === "quicklist" ? "upload type" : "list type"} first
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry */}
      {inputMode === "manual" && (
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            Enter Contacts Manually *
          </label>
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 font-mono`}
            style={{
              borderColor: color.border.default,
              color: color.text.primary,
            }}
            placeholder="Enter emails or phone numbers (one per line)&#10;&#10;Example:&#10;john@example.com&#10;jane@example.com&#10;+33612345678&#10;+1234567890"
            rows={10}
            disabled={disabled}
          />

          {/* Validation Summary */}
          {manualInput.trim() && (
            <div className="mt-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color.primary.accent }}
                ></div>
                <span
                  className="font-medium"
                  style={{ color: color.primary.accent }}
                >
                  {manualInputValidation.validCount} valid contact
                  {manualInputValidation.validCount !== 1 ? "s" : ""}
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
                    {manualInputValidation.invalidCount} invalid
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Subscription ID Selector - Only for broadcasts */}
      {showSubscriptionIdSelector &&
        inputMode === "file" &&
        fileColumns.length > 0 && (
          <SubscriptionIdSelector
            fileColumns={fileColumns}
            selectedColumn={subscriptionIdColumn}
            onColumnSelect={setSubscriptionIdColumn}
            disabled={disabled}
          />
        )}
    </div>
  );
}
