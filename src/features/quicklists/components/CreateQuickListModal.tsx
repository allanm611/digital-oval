import { useEffect, useRef, useState } from "react";
import { X, Upload, FileText, AlertCircle, Download } from "lucide-react";
import { button as buttonTokens, color, tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import SubscriptionIdSelector from "../../manual-broadcast/components/SubscriptionIdSelector";
import { CreateQuickListRequest } from "../types/quicklist";
import { customerIdentityService } from "../../customerIdentity/services/customerIdentityService";
import { CustomerIdentityField } from "../../customerIdentity/types/customerIdentity";
import { quicklistService } from "../services/quicklistService";

export type QuickListFormValues = {
  list_id?: number;
  name: string;
  description: string;
  subscriber_id_col_name: string;
  subscriber_id_field_mapping: string;
  file_delimiter: string;
  upload_type: string;
  file_text?: string;
  list_headers?: string;
  file_name?: string;
  file_size?: number;
};

interface CreateQuickListModalProps {
  isOpen: boolean;
  mode?: "create" | "edit";
  initialData?: Partial<QuickListFormValues>;
  onClose: () => void;
  onSubmit: (values: CreateQuickListRequest) => Promise<void>;
  submitLabel?: string;
}

const defaultForm: QuickListFormValues = {
  name: "",
  description: "",
  subscriber_id_col_name: "",
  subscriber_id_field_mapping: "",
  file_delimiter: ",",
  upload_type: "generic",
  list_headers: "",
  file_text: "",
};

export default function CreateQuickListModal({
  isOpen,
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitLabel,
}: CreateQuickListModalProps) {
  const [form, setForm] = useState<QuickListFormValues>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [customerIdentityFields, setCustomerIdentityFields] = useState<
    CustomerIdentityField[]
  >([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [uploadTypes, setUploadTypes] = useState<
    Array<{ id: number; upload_type: string; description?: string; expected_columns?: string[] }>
  >([]);
  const [isLoadingUploadTypes, setIsLoadingUploadTypes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCreateMode = mode === "create";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm({
      ...defaultForm,
      ...initialData,
      name: initialData?.name || "",
      description: initialData?.description || "",
      subscriber_id_col_name: initialData?.subscriber_id_col_name || "",
      subscriber_id_field_mapping: "",
      file_delimiter: initialData?.file_delimiter || ",",
      upload_type: (initialData as any)?.upload_type || "generic",
      list_headers: initialData?.list_headers || "",
      file_text: initialData?.file_text || "",
      file_name: initialData?.file_name,
      file_size: initialData?.file_size,
    });
    setErrors({});
    setUploadedFile(null);

    // Reset the file input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [initialData, isOpen]);

  // Load upload types when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadUploadTypes = async () => {
      try {
        setIsLoadingUploadTypes(true);
        const response = await quicklistService.getUploadTypes({
          skipCache: true,
        });
        if (response.success && response.data) {
          setUploadTypes(response.data);
        }
      } catch (err) {
        console.error("Failed to load upload types:", err);
        // Default to generic if loading fails
        setUploadTypes([{ id: 1, upload_type: "generic", description: "Generic upload type" }]);
      } finally {
        setIsLoadingUploadTypes(false);
      }
    };

    loadUploadTypes();
  }, [isOpen]);

  // Load customer identity fields when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadCustomerIdentityFields = async () => {
      try {
        setIsLoadingFields(true);
        const fields = await customerIdentityService.getCustomerIdentityFields(
          true
        );
        setCustomerIdentityFields(fields);
      } catch (err) {
        console.error("Failed to load customer identity fields:", err);
        setCustomerIdentityFields([]);
      } finally {
        setIsLoadingFields(false);
      }
    };

    loadCustomerIdentityFields();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleInputChange = (
    field: keyof QuickListFormValues,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setForm((prev) => ({
      ...prev,
      file_text: "",
      list_headers: "",
      file_name: "",
      file_size: undefined,
    }));
  };

  const processFile = (file: File) => {
    if (!file) return;

    // Validate file type
    const validExtensions = [".csv", ".txt", ".tsv", ".xlsx"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      setErrors((prev) => ({
        ...prev,
        file_text: "Please upload a CSV, TXT, TSV, or XLSX file.",
      }));
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        file_text: "File size must be less than 10MB.",
      }));
      return;
    }

    setUploadedFile(file);
    setErrors((prev) => ({ ...prev, file_text: "" }));
    setIsFileProcessing(true);

    // Extract filename without extension for list name
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

    // Handle XLSX files
    if (fileExtension === ".xlsx") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const XLSX = await import("xlsx");
          const data = e.target?.result;
          // Read with raw: true to get numeric values
          const workbook = XLSX.read(data, {
            type: "array"
          });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

          // Manually build CSV to preserve all values as strings (prevents scientific notation)
          let csvContent = "";
          if (firstSheet) {
            const range = XLSX.utils.decode_range(firstSheet["!ref"] || "A1");
            const rows: string[][] = [];

            for (let R = range.s.r; R <= range.e.r; ++R) {
              const row: string[] = [];
              for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_col(C) + XLSX.utils.encode_row(R);
                const cell = firstSheet[cellAddress];

                // Get the value and convert to string, avoiding scientific notation
                let cellValue = "";
                if (cell) {
                  if (typeof cell.v === "number") {
                    // Convert number to string without scientific notation
                    cellValue = cell.v.toString();
                    // If number has "E" in it (scientific notation), use toFixed instead
                    if (cellValue.includes("E") || cellValue.includes("e")) {
                      cellValue = Number(cell.v).toFixed(0);
                    }
                  } else if (cell.v !== undefined && cell.v !== null) {
                    cellValue = String(cell.v);
                  }
                }
                row.push(cellValue);
              }
              rows.push(row);
            }

            // Convert rows back to CSV format
            csvContent = rows.map(row =>
              row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma, newline, or quote
                const needsQuotes = cell.includes(",") || cell.includes("\n") || cell.includes('"');
                return needsQuotes ? `"${cell.replace(/"/g, '""')}"` : cell;
              }).join(",")
            ).join("\n");
          }

          const [headersLine] = csvContent.split(/\r?\n/);

          setForm((prev) => ({
            ...prev,
            file_text: csvContent,
            list_headers: headersLine || "",
            file_name: file.name,
            file_size: file.size,
            name: prev.name || fileNameWithoutExt,
          }));

          setErrors((prev) => ({ ...prev, file_text: "" }));
          setIsFileProcessing(false);
        } catch (err) {
          setErrors((prev) => ({
            ...prev,
            file_text:
              "Failed to read XLSX file. Please ensure it's a valid Excel file.",
          }));
          setIsFileProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Handle CSV, TXT, TSV files
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = (e.target?.result as string) || "";
          const [headersLine] = content.split(/\r?\n/);

          setForm((prev) => ({
            ...prev,
            file_text: content,
            list_headers: headersLine || "",
            file_name: file.name,
            file_size: file.size,
            name: prev.name || fileNameWithoutExt,
          }));

          setErrors((prev) => ({ ...prev, file_text: "" }));
          setIsFileProcessing(false);
        } catch (err) {
          setErrors((prev) => ({
            ...prev,
            file_text: "Failed to read file. Please try again.",
          }));
          setIsFileProcessing(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const downloadSampleFile = () => {
    // Download static sample file from public folder
    const link = document.createElement("a");
    link.href = "/static/samples/quicklist_sample.csv";
    link.download = "quicklist_sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cleanHeaders = (headersLine: string, delimiter: string): string => {
    if (!headersLine || !delimiter) return headersLine;
    let delim = delimiter;
    if (delim === "\\t" || delim === "\t") {
      delim = "\t";
    }
    return headersLine
      .split(delim)
      .map((h) =>
        h
          .trim() // Remove leading/trailing spaces
          .replace(/^["']|["']$/g, "") // Remove quotes
          .replace(/\s+/g, "_") // Replace internal spaces with underscores
      )
      .join(delim);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Validate data rows for missing fields
  const validateDataRows = (fileText: string, delimiter: string, headers: string[]): { validRows: number; invalidRows: Array<{ rowNumber: number; missingFields: string[] }> } => {
    if (!fileText || !delimiter || headers.length === 0) {
      return { validRows: 0, invalidRows: [] };
    }

    let delim = delimiter;
    if (delim === "\\t" || delim === "\t") {
      delim = "\t";
    }

    const lines = fileText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const dataLines = lines.slice(1); // Skip header row

    let validRows = 0;
    const invalidRows: Array<{ rowNumber: number; missingFields: string[] }> = [];

    dataLines.forEach((line, index) => {
      const values = line
        .split(delim)
        .map((v) => v.trim().replace(/^["']|["']$/g, ""));

      const missingFields: string[] = [];

      // Check each column has a value
      headers.forEach((header, colIndex) => {
        if (!values[colIndex] || values[colIndex].length === 0) {
          missingFields.push(header);
        }
      });

      if (missingFields.length === 0) {
        validRows++;
      } else {
        invalidRows.push({ rowNumber: index + 2, missingFields }); // +2 because index is 0-based and row 1 is header
      }
    });

    return { validRows, invalidRows };
  };

  const validateForm = () => {
    const validationErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      validationErrors.name = "List name is required.";
    }
    if (!form.subscriber_id_col_name.trim()) {
      validationErrors.subscriber_id_col_name =
        "Subscriber identifier column is required.";
    }
    if (!form.subscriber_id_field_mapping.trim()) {
      validationErrors.subscriber_id_field_mapping =
        "Customer identity field mapping is required.";
    }
    if (!form.file_delimiter) {
      validationErrors.file_delimiter = "Select a delimiter.";
    }
    if (isCreateMode && !form.file_text) {
      validationErrors.file_text = "Upload a CSV, TXT, or XLSX file.";
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        created_by: null,
        file_text: form.file_text,
        file_name: form.file_name,
        file_size: form.file_size,
        file_delimiter: form.file_delimiter,
        subscriber_id_col_name: form.subscriber_id_col_name.trim(),
        subscriber_id_field_mapping: form.subscriber_id_field_mapping.trim() || undefined,
        list_headers: cleanHeaders(form.list_headers, form.file_delimiter),
        upload_type: form.upload_type,
      });
      handleClose();
    } catch (err) {
      console.error("Failed to create QuickList:", err);
      setErrors((prev) => ({
        ...prev,
        submit:
          err instanceof Error ? err.message : "Failed to create QuickList",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 backdrop-blur-[1px] px-4 py-6"
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          handleClose();
        }
      }}
    >
      <div
        className={`w-full max-w-2xl ${tw.rounded} bg-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden`}
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {isCreateMode ? "Create New List" : "Edit List"}
            </p>
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreateMode ? "Build Your QuickList" : "Update QuickList"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isCreateMode
                ? "Upload a file or paste customer data to create a reusable list for campaigns."
                : "Make adjustments to your list details or upload an updated file."}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
        >
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-black mb-1 block">
                List Name
              </label>
              <Input
                placeholder="e.g., High Value Customers"
                value={form.name}
                onChange={(value) => handleInputChange("name", value)}
                disabled={isSubmitting}
                hasError={!!errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-black mb-1 block">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={4}
                placeholder="Describe who belongs in this list and how you'll use it."
                disabled={isSubmitting}
                className={`w-full ${tw.rounded} border px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50 ${
                  errors.description
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:ring-[var(--primary-color,#5EC6B1)]"
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-black mb-1 block">
                File Delimiter
              </label>
              <HeadlessSelect
                value={form.file_delimiter}
                onChange={(value) =>
                  handleInputChange("file_delimiter", value as string)
                }
                options={[
                  { label: "Comma (,)", value: "," },
                  { label: "Semicolon (;)", value: ";" },
                  { label: "Tab", value: "\t" },
                  { label: "Pipe (|)", value: "|" },
                ]}
                placeholder="Select delimiter"
                error={!!errors.file_delimiter}
                className="w-full"
                disabled={isSubmitting}
                zIndex={10100}
              />
              {errors.file_delimiter && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.file_delimiter}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-black mb-1 block">
                Upload Type
              </label>
              <HeadlessSelect
                value={form.upload_type}
                onChange={(value) =>
                  handleInputChange("upload_type", String(value))
                }
                options={uploadTypes.map((type) => ({
                  label: type.upload_type,
                  value: type.upload_type,
                }))}
                placeholder="Select upload type"
                error={!!errors.upload_type}
                className="w-full"
                disabled={isSubmitting || isLoadingUploadTypes}
                zIndex={10100}
              />
              {errors.upload_type && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.upload_type}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-black block">
                  {isCreateMode
                    ? "Upload Your File"
                    : "Upload Replacement File"}
                </label>
                <button
                  type="button"
                  onClick={downloadSampleFile}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 text-xs font-medium hover:underline disabled:opacity-50"
                  style={{ color: color.primary.action }}
                >
                  <Download className="w-3 h-3" />
                  Download Sample
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Supported formats: CSV, TSV, TXT, or XLSX up to 10MB.
              </p>
              {!form.file_text && errors.file_text && (
                <div className="flex items-center text-sm text-red-500 mb-3">
                  <AlertCircle className="mr-1 h-4 w-4" />
                  {errors.file_text}
                </div>
              )}

              {!form.file_text ? (
                <div
                  onClick={() => !isSubmitting && fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center ${tw.rounded} border-2 border-dashed py-10 text-center cursor-pointer transition ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : isDragging
                        ? "border-[var(--primary-color,#5EC6B1)] bg-[var(--primary-color,#5EC6B1)]/5"
                        : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <div
                    className={`rounded-full p-3 shadow-sm mb-3 ${
                      isDragging
                        ? "bg-[var(--primary-color,#5EC6B1)]/10"
                        : "bg-white"
                    }`}
                  >
                    <Upload
                      className={`h-6 w-6 ${
                        isDragging
                          ? "text-[var(--primary-color,#5EC6B1)]"
                          : "text-[var(--primary-color,#5EC6B1)]"
                      }`}
                    />
                  </div>
                  <p className="font-semibold text-gray-900">
                    {isDragging
                      ? "Drop file here"
                      : "Drag & drop or choose a file"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: CSV, TSV, TXT, or XLSX up to 10MB
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className={`${tw.rounded} border border-gray-200 bg-white p-4 flex items-center justify-between`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`${tw.rounded} bg-[var(--primary-color,#5EC6B1)]/10 p-2`}
                      >
                        <FileText className="h-6 w-6 text-[var(--primary-color,#5EC6B1)]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {form.file_name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-500">
                            {uploadedFile
                              ? `${(uploadedFile.size / 1024).toFixed(1)} KB`
                              : form.file_size
                                ? `${(form.file_size / 1024).toFixed(1)} KB`
                                : null}
                          </p>
                          {form.file_text &&
                            (() => {
                              const rowCount =
                                form.file_text
                                  .split(/\r?\n/)
                                  .filter((line) => line.trim().length > 0)
                                  .length - 1; // Subtract 1 for header row
                              return (
                                <p className="text-xs text-gray-500">
                                  {rowCount.toLocaleString()}{" "}
                                  {rowCount === 1 ? "row" : "rows"}
                                </p>
                              );
                            })()}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      disabled={isSubmitting}
                      className="text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>

                  {form.list_headers &&
                    form.file_text &&
                    (() => {
                      // Parse the file content to show preview
                      const parseFilePreview = () => {
                        if (
                          !form.file_text ||
                          !form.file_delimiter ||
                          !form.list_headers
                        ) {
                          return { headers: [], rows: [] };
                        }

                        let delimiter = form.file_delimiter;
                        if (delimiter === "\\t" || delimiter === "\t") {
                          delimiter = "\t";
                        }

                        const lines = form.file_text
                          .split(/\r?\n/)
                          .filter((line) => line.trim().length > 0);
                        const headers = form.list_headers
                          .split(delimiter)
                          .map((h) => h.trim().replace(/^["']|["']$/g, "")) // Remove quotes from start/end
                          .filter((h) => h.length > 0);

                        // Parse data rows (skip header row, limit to first 5 rows for preview)
                        const dataRows = lines.slice(1, 6).map((line) => {
                          const values = line
                            .split(delimiter)
                            .map((v) => v.trim().replace(/^["']|["']$/g, "")); // Remove quotes from start/end
                          return headers.map((_, index) => values[index] || "");
                        });

                        return { headers, rows: dataRows };
                      };

                      const preview = parseFilePreview();
                      const totalRows =
                        form.file_text
                          .split(/\r?\n/)
                          .filter((line) => line.trim().length > 0).length - 1;

                      // Validate for missing fields
                      const validation = validateDataRows(
                        form.file_text,
                        form.file_delimiter,
                        preview.headers,
                      );

                      return (
                        <div className="mt-4 space-y-3">
                          <label className="text-sm font-medium text-black mb-2 block">
                            File Preview & Validation
                          </label>

                          {/* Validation Summary */}
                          <div className="flex gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span>
                                <strong>{validation.validRows}</strong> valid{" "}
                                {validation.validRows === 1 ? "row" : "rows"}
                              </span>
                            </div>
                            {validation.invalidRows.length > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span>
                                  <strong>{validation.invalidRows.length}</strong>{" "}
                                  {validation.invalidRows.length === 1
                                    ? "row"
                                    : "rows"}{" "}
                                  with missing fields
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Missing Fields Error */}
                          {validation.invalidRows.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-red-600 mb-2">
                                Rows with missing fields:
                              </p>
                              <ul className="text-xs text-red-600 space-y-1">
                                {validation.invalidRows
                                  .slice(0, 5)
                                  .map((item, idx) => (
                                    <li key={idx}>
                                      Row {item.rowNumber}:{" "}
                                      {item.missingFields.join(", ")}
                                    </li>
                                  ))}
                                {validation.invalidRows.length > 5 && (
                                  <li>
                                    ... and {validation.invalidRows.length - 5}{" "}
                                    more rows
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          <div
                            className={`overflow-x-auto border border-gray-200 ${tw.rounded}`}
                          >
                            <table className="w-full">
                              <thead
                                style={{
                                  background: color.surface.tableHeader,
                                }}
                              >
                                <tr>
                                  {preview.headers.map((header, index) => (
                                    <th
                                      key={index}
                                      className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap border-b border-gray-200"
                                      style={{
                                        color: color.surface.tableHeaderText,
                                      }}
                                    >
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {preview.rows.length > 0 ? (
                                  preview.rows.map((row, rowIndex) => (
                                    <tr
                                      key={rowIndex}
                                      className="transition-colors border-b border-gray-100 hover:bg-gray-50"
                                      style={{
                                        backgroundColor:
                                          color.surface.tablebodybg,
                                      }}
                                    >
                                      {row.map((cell, cellIndex) => (
                                        <td
                                          key={cellIndex}
                                          className="px-4 py-2 text-xs whitespace-nowrap"
                                        >
                                          {cell || (
                                            <span className="text-red-500 font-medium">
                                              MISSING
                                            </span>
                                          )}
                                        </td>
                                      ))}
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={preview.headers.length}
                                      className="px-4 py-4 text-xs text-gray-500 text-center"
                                      style={{
                                        backgroundColor:
                                          color.surface.tablebodybg,
                                      }}
                                    >
                                      No data rows found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          {totalRows > 5 && (
                            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
                              Showing first 5 of {totalRows} rows
                            </div>
                          )}
                        </div>
                      );
                    })()}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv,.xlsx"
                onChange={handleFileUpload}
                disabled={isSubmitting}
                className="hidden"
              />
            </div>

            {(() => {
              // Parse headers from the uploaded file
              const parseHeaders = (): string[] => {
                if (!form.list_headers || !form.file_delimiter) {
                  return [];
                }
                // Convert delimiter string to actual character for splitting
                let delimiter = form.file_delimiter;
                if (delimiter === "\\t" || delimiter === "\t") {
                  delimiter = "\t";
                }

                return form.list_headers
                  .split(delimiter)
                  .map((h) => h.trim().replace(/^["']|["']$/g, "")) // Remove quotes from start/end
                  .filter((h) => h.length > 0);
              };

              const headerOptions = parseHeaders();

              return (
                <>
                  <SubscriptionIdSelector
                    fileColumns={headerOptions}
                    selectedColumn={form.subscriber_id_col_name || null}
                    onColumnSelect={(column) =>
                      handleInputChange("subscriber_id_col_name", column)
                    }
                    disabled={isSubmitting}
                    error={!!errors.subscriber_id_col_name}
                    errorMessage={errors.subscriber_id_col_name}
                  />

                  {/* Customer Identity Field Mapping Dropdown */}
                  <div className="mt-4">
                    <label className={`block text-sm font-medium ${tw.textPrimary} mb-0`}>
                      Map to Customer Identity Field *
                    </label>
                    <p className={`text-xs ${tw.textSecondary} mb-2`}>
                      Select which customer field this column represents
                    </p>
                    <HeadlessSelect
                      options={customerIdentityFields.map((field) => ({
                        value: field.field_value,
                        label: field.field_name,
                      }))}
                      value={form.subscriber_id_field_mapping || ""}
                      onChange={(value) =>
                        handleInputChange(
                          "subscriber_id_field_mapping",
                          String(value)
                        )
                      }
                      placeholder={
                        !form.subscriber_id_col_name.trim()
                          ? "Select subscriber ID column first..."
                          : "Select identity field..."
                      }
                      placeholderClassName="text-sm"
                      disabled={isSubmitting || isLoadingFields || customerIdentityFields.length === 0 || !form.subscriber_id_col_name.trim()}
                      error={!!errors.subscriber_id_field_mapping}
                      zIndex={10100}
                    />
                    {errors.subscriber_id_field_mapping && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.subscriber_id_field_mapping}
                      </p>
                    )}
                  </div>
                </>
              );
            })()}

            {errors.submit && (
              <p className="text-sm text-red-600">{errors.submit}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className={`${tw.rounded} border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:order-1`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isFileProcessing || !form.name.trim() || (isCreateMode && !form.file_text) || !form.subscriber_id_col_name.trim() || !form.subscriber_id_field_mapping.trim() || !form.file_delimiter}
                  className="text-sm font-semibold shadow-sm disabled:opacity-50 sm:order-2"
                  style={{
                    backgroundColor: buttonTokens.action.background,
                    color: buttonTokens.action.color,
                    borderRadius: buttonTokens.action.borderRadius,
                    padding: `${buttonTokens.action.paddingY} ${buttonTokens.action.paddingX}`,
                  }}
                  title={
                    isFileProcessing ? "Processing file, please wait..." :
                    !form.name.trim() ? "Please enter a list name" :
                    (isCreateMode && !form.file_text) ? "Please upload a file" :
                    !form.subscriber_id_col_name.trim() ? "Please select subscriber ID column" :
                    !form.subscriber_id_field_mapping.trim() ? "Please select customer identity field mapping" :
                    !form.file_delimiter ? "Please select a delimiter" :
                    ""
                  }
                >
                  {isFileProcessing
                    ? "Processing file..."
                    : isSubmitting
                      ? isCreateMode ? "Creating..." : "Updating..."
                      : submitLabel ||
                        (isCreateMode ? "Create" : "Update")}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
