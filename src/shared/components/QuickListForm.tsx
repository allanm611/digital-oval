import { useState, useRef, useMemo, useEffect } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  Download,
  Edit3,
} from "lucide-react";
import * as XLSX from "xlsx";
import { color, tw } from "../utils/utils";
import { UploadType } from "../../features/quicklists/types/quicklist";
import HeadlessSelect from "./ui/HeadlessSelect";

type InputMode = "file" | "manual";

export interface QuickListFormData {
  file: File | null;
  uploadType: string;
  name: string;
  description: string;
  inputMode: InputMode;
  manualInput: string;
  // Parsed preview data
  previewHeaders: string[];
  previewRows: string[][];
  totalRows: number;
  validCount: number;
  invalidCount: number;
}

interface QuickListFormProps {
  uploadTypes: UploadType[];
  initialData?: Partial<QuickListFormData>;
  onChange?: (data: QuickListFormData) => void;
  disabled?: boolean;
  showDescription?: boolean;
  className?: string;
}

export default function QuickListForm({
  uploadTypes,
  initialData,
  onChange,
  disabled = false,
  showDescription = true,
  className = "",
}: QuickListFormProps) {
  const [inputMode, setInputMode] = useState<InputMode>(
    initialData?.inputMode || "file"
  );
  const [file, setFile] = useState<File | null>(initialData?.file || null);
  const [uploadType, setUploadType] = useState<string>(
    initialData?.uploadType || ""
  );
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [manualInput, setManualInput] = useState(
    initialData?.manualInput || ""
  );
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview data state
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [totalRows, setTotalRows] = useState(0);

  // Parse Excel file for preview
  const parseExcelFile = async (fileToRead: File) => {
    try {
      const buffer = await fileToRead.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
        header: 1,
      });

      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1, 6) as string[][]; // First 5 data rows
        const total = jsonData.length - 1; // Exclude header row

        setPreviewHeaders(headers);
        setPreviewRows(rows);
        setTotalRows(total);
      }
    } catch (err) {
      console.error("Failed to parse Excel file:", err);
      setPreviewHeaders([]);
      setPreviewRows([]);
      setTotalRows(0);
    }
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
        setError("Please select a valid Excel file (.xlsx or .xls)");
        setFile(null);
        setPreviewHeaders([]);
        setPreviewRows([]);
        setTotalRows(0);
        return;
      }

      // Validate file size (get max from selected upload type)
      const selectedUploadType = uploadTypes.find(
        (t) => t.upload_type === uploadType
      );
      if (!selectedUploadType) {
        setError("Please select an upload type first");
        setFile(null);
        return;
      }

      const maxSizeMB = selectedUploadType.max_file_size_mb || 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      if (selectedFile.size > maxSizeBytes) {
        setError(`File size must be less than ${maxSizeMB}MB`);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      if (!name) {
        // Auto-fill name from filename
        const filename = selectedFile.name.replace(/\.[^/.]+$/, "");
        setName(filename);
      }
      setError("");

      // Parse file for preview
      await parseExcelFile(selectedFile);
    }
  };

  // Validate manual input and count valid/invalid contacts
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

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange({
        file,
        uploadType,
        name,
        description,
        inputMode,
        manualInput,
        previewHeaders,
        previewRows,
        totalRows,
        validCount: manualInputValidation.validCount,
        invalidCount: manualInputValidation.invalidCount,
      });
    }
  }, [
    file,
    uploadType,
    name,
    description,
    inputMode,
    manualInput,
    previewHeaders,
    previewRows,
    totalRows,
    manualInputValidation,
    onChange,
  ]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const downloadTemplate = () => {
    if (!uploadType) return;

    const selectedType = uploadTypes.find((t) => t.upload_type === uploadType);
    if (!selectedType) return;

    // Get expected columns
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
      return;
    }

    // Helper function to escape CSV values
    const escapeCsvValue = (value: string): string => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Create CSV content with BOM for Excel compatibility
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Type */}
      <div>
        <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
          Upload Type *
        </label>
        <HeadlessSelect
          options={[
            { value: "", label: "Select upload type" },
            ...uploadTypes.map((type) => ({
              value: type.upload_type,
              label: type.description
                ? `${type.upload_type} - ${type.description}`
                : type.upload_type,
            })),
          ]}
          value={uploadType}
          onChange={(value) => setUploadType(value as string)}
          placeholder="Select upload type"
          disabled={disabled}
        />
        {uploadType &&
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
                className={`mt-2 p-3 ${tw.rounded}`}
                style={{ backgroundColor: `${color.primary.accent}10` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p
                      className="text-xs mb-2"
                      style={{ color: color.primary.accent }}
                    >
                      <strong>Expected columns:</strong> {columnsDisplay}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${tw.rounded} transition-colors whitespace-nowrap`}
                    style={{
                      backgroundColor: `${color.primary.accent}20`,
                      color: color.primary.accent,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = `${color.primary.accent}30`)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = `${color.primary.accent}20`)
                    }
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Template
                  </button>
                </div>
              </div>
            );
          })()}
      </div>

      {/* Input Mode Toggle */}
      <div>
        <label className={`block text-sm font-medium ${tw.textPrimary} mb-3`}>
          Input Method *
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setInputMode("file")}
            disabled={disabled}
            className={`flex-1 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 ${tw.rounded} border-2 transition-all`}
            style={{
              borderColor:
                inputMode === "file"
                  ? color.primary.action
                  : color.border.default,
              backgroundColor:
                inputMode === "file" ? color.primary.action : "white",
              color: inputMode === "file" ? "white" : color.text.primary,
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <Upload className="w-5 h-5" />
            <span className="text-sm font-medium">Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode("manual")}
            disabled={disabled}
            className={`flex-1 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 ${tw.rounded} border-2 transition-all`}
            style={{
              borderColor:
                inputMode === "manual"
                  ? color.primary.action
                  : color.border.default,
              backgroundColor:
                inputMode === "manual" ? color.primary.action : "white",
              color: inputMode === "manual" ? "white" : color.text.primary,
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <Edit3 className="w-5 h-5" />
            <span className="text-sm font-medium">Manual Entry</span>
          </button>
        </div>
      </div>

      {/* File Upload - Only show when file mode is selected */}
      {inputMode === "file" && (
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            Excel File *
          </label>
          {uploadType ? (
            <label
              htmlFor="quicklist-form-file-upload"
              className={`block border-2 border-dashed ${tw.rounded} p-6 text-center transition-colors`}
              style={{
                borderColor: color.border.default,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!disabled) {
                  e.currentTarget.style.borderColor = color.primary.accent;
                }
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.style.borderColor = color.border.default;
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.style.borderColor = color.border.default;
                if (!disabled) {
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile && fileInputRef.current) {
                    const dt = new DataTransfer();
                    dt.items.add(droppedFile);
                    fileInputRef.current.files = dt.files;
                    const event = new Event("change", { bubbles: true });
                    fileInputRef.current.dispatchEvent(event);
                  }
                }
              }}
            >
              <input
                id="quicklist-form-file-upload"
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
                    Change file
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
                      Click to upload
                    </p>
                    <p className={`text-xs ${tw.textSecondary} mt-1`}>
                      or drag and drop
                    </p>
                  </div>
                  <p className={`text-xs ${tw.textSecondary}`}>
                    Excel files (.xlsx, .xls) up to{" "}
                    {uploadTypes.find((t) => t.upload_type === uploadType)
                      ?.max_file_size_mb || 10}
                    MB
                  </p>
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
                  Click to upload
                </p>
                <p className={`text-xs ${tw.textSecondary}`}>
                  Please select an upload type first
                </p>
              </div>
            </div>
          )}

          {/* File Preview Table */}
          {file && previewHeaders.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-sm font-medium ${tw.textPrimary}`}>
                  Data Preview
                </h4>
                <span className={`text-xs ${tw.textSecondary}`}>
                  Showing {Math.min(previewRows.length, 5)} of {totalRows} rows
                </span>
              </div>
              <div
                className={`border ${tw.rounded} overflow-hidden`}
                style={{ borderColor: color.border.default }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: color.surface.cards }}>
                        {previewHeaders.map((header, index) => (
                          <th
                            key={index}
                            className={`px-3 py-2 text-left font-medium ${tw.textPrimary} whitespace-nowrap border-b`}
                            style={{ borderColor: color.border.default }}
                          >
                            {header || `Column ${index + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {previewHeaders.map((_, colIndex) => (
                            <td
                              key={colIndex}
                              className={`px-3 py-2 ${tw.textSecondary} whitespace-nowrap border-b`}
                              style={{ borderColor: color.border.default }}
                            >
                              {row[colIndex] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry - Only show when manual mode is selected */}
      {inputMode === "manual" && (
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            Enter Contacts Manually *
          </label>
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none focus:ring-2 font-mono`}
            style={{
              borderColor: color.border.default,
              color: color.text.primary,
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = color.primary.accent)
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = color.border.default)
            }
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
                  style={{ backgroundColor: color.status.success }}
                ></div>
                <span
                  className="font-medium"
                  style={{ color: color.status.success }}
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

          {/* Manual Entry Preview Table */}
          {manualInputValidation.validCount > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-sm font-medium ${tw.textPrimary}`}>
                  Contacts Preview
                </h4>
                <span className={`text-xs ${tw.textSecondary}`}>
                  Showing {Math.min(manualInputValidation.validCount, 5)} of{" "}
                  {manualInputValidation.validCount} valid contacts
                </span>
              </div>
              <div
                className={`border ${tw.rounded} overflow-hidden`}
                style={{ borderColor: color.border.default }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: color.surface.cards }}>
                        <th
                          className={`px-3 py-2 text-left font-medium ${tw.textPrimary} whitespace-nowrap border-b`}
                          style={{ borderColor: color.border.default }}
                        >
                          #
                        </th>
                        <th
                          className={`px-3 py-2 text-left font-medium ${tw.textPrimary} whitespace-nowrap border-b`}
                          style={{ borderColor: color.border.default }}
                        >
                          Contact
                        </th>
                        <th
                          className={`px-3 py-2 text-left font-medium ${tw.textPrimary} whitespace-nowrap border-b`}
                          style={{ borderColor: color.border.default }}
                        >
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualInputValidation.valid
                        .slice(0, 5)
                        .map((contact, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td
                              className={`px-3 py-2 ${tw.textMuted} whitespace-nowrap border-b`}
                              style={{ borderColor: color.border.default }}
                            >
                              {index + 1}
                            </td>
                            <td
                              className={`px-3 py-2 ${tw.textSecondary} whitespace-nowrap border-b font-mono`}
                              style={{ borderColor: color.border.default }}
                            >
                              {contact}
                            </td>
                            <td
                              className={`px-3 py-2 whitespace-nowrap border-b`}
                              style={{ borderColor: color.border.default }}
                            >
                              <span
                                className={`px-2 py-0.5 text-xs ${tw.rounded}`}
                                style={{
                                  backgroundColor: contact.includes("@")
                                    ? `${color.primary.accent}15`
                                    : `${color.status.success}15`,
                                  color: contact.includes("@")
                                    ? color.primary.accent
                                    : color.status.success,
                                }}
                              >
                                {contact.includes("@") ? "Email" : "Phone"}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Helper Text */}
          <p className={`mt-2 text-xs ${tw.textSecondary}`}>
            Enter one email address or phone number per line. Valid formats:
            email@domain.com or +1234567890
          </p>
        </div>
      )}

      {/* Name */}
      <div>
        <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
          List Name *
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
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = color.primary.accent)
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = color.border.default)
          }
          placeholder="Enter a descriptive name"
          disabled={disabled}
        />
      </div>

      {/* Description */}
      {showDescription && (
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none focus:ring-2`}
            style={{
              borderColor: color.border.default,
              color: color.text.primary,
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = color.primary.accent)
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = color.border.default)
            }
            placeholder="Add a description for this list"
            rows={3}
            disabled={disabled}
          />
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
  );
}

// Helper function to create Excel file from manual input (exported for use by consumers)
export function createExcelFileFromManualInput(
  manualInput: string,
  uploadTypes: UploadType[],
  uploadType: string
): File {
  const selectedType = uploadTypes.find((t) => t.upload_type === uploadType);
  if (!selectedType) {
    throw new Error("Upload type not selected");
  }

  // Get expected columns
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

  // Parse manual input
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[+]?[0-9\s()-]{8,}$/;

  const validContacts = manualInput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => emailRegex.test(line) || phoneRegex.test(line));

  // Create worksheet data
  const worksheetData: string[][] = [columns];

  const emailColumnIndex = columns.findIndex((col) =>
    col.toLowerCase().includes("email")
  );
  const phoneColumnIndex = columns.findIndex(
    (col) =>
      col.toLowerCase().includes("phone") ||
      col.toLowerCase().includes("mobile")
  );

  validContacts.forEach((contact) => {
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

  // Create workbook
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
}

