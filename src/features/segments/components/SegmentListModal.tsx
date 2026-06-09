import { useEffect, useRef, useState } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import { button as buttonTokens, color, tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

export type SegmentListFormValues = {
  list_id?: number;
  list_label: string;
  list_description: string;
  list_type: "seed" | "and" | "standard";
  subscriber_id_col_name: string;
  file_delimiter: string;
  file_text?: string;
  list_headers?: string;
  file_name?: string;
  file_size?: number;
};

interface SegmentListModalProps {
  isOpen: boolean;
  mode?: "create" | "edit";
  initialData?: Partial<SegmentListFormValues>;
  onClose: () => void;
  onSubmit: (values: SegmentListFormValues) => void;
  submitLabel?: string;
}

const defaultForm: SegmentListFormValues = {
  list_label: "",
  list_description: "",
  list_type: "standard",
  subscriber_id_col_name: "",
  file_delimiter: ",",
  list_headers: "",
  file_text: "",
};

const listTypeOptions: Array<{
  value: SegmentListFormValues["list_type"];
  label: string;
  description: string;
}> = [
  {
    value: "standard",
    label: "Standard",
    description: "General purpose lists for most campaigns",
  },
  {
    value: "seed",
    label: "Seed",
    description: "Internal QA or preview audiences",
  },
  {
    value: "and",
    label: "AND",
    description: "Intersect with existing segment logic",
  },
];

export default function SegmentListModal({
  isOpen,
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitLabel,
}: SegmentListModalProps) {
  const [form, setForm] = useState<SegmentListFormValues>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCreateMode = mode === "create";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm({
      ...defaultForm,
      ...initialData,
      list_label: initialData?.list_label || "",
      list_description: initialData?.list_description || "",
      list_type: initialData?.list_type || "standard",
      subscriber_id_col_name: initialData?.subscriber_id_col_name || "",
      file_delimiter: initialData?.file_delimiter || ",",
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

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleInputChange = (
    field: keyof SegmentListFormValues,
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

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || "";
      const [headersLine] = content.split(/\r?\n/);

      // Extract filename without extension for list label
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

      setForm((prev) => ({
        ...prev,
        file_text: content,
        list_headers: headersLine || "",
        file_name: file.name,
        file_size: file.size,
        list_label: prev.list_label || fileNameWithoutExt,
      }));

      setErrors((prev) => ({ ...prev, file_text: "" }));
    };

    reader.readAsText(file);
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

  const validateForm = () => {
    const validationErrors: Record<string, string> = {};

    if (!form.list_label.trim()) {
      validationErrors.list_label = "List name is required.";
    }
    if (!form.subscriber_id_col_name.trim()) {
      validationErrors.subscriber_id_col_name =
        "Subscriber identifier column is required.";
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      ...form,
      list_label: form.list_label.trim(),
      list_description: form.list_description.trim(),
      subscriber_id_col_name: form.subscriber_id_col_name.trim(),
      list_headers: cleanHeaders(form.list_headers || "", form.file_delimiter),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/30 backdrop-blur-[1px] px-4 py-6"
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
              {isCreateMode ? "Build Your Segment List" : "Update Segment List"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isCreateMode
                ? "Upload a file or paste customer data to create a reusable list for campaigns."
                : "Make adjustments to your list details or upload an updated file."}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
        >
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-black mb-1 block">
                List Name
              </label>
              <Input
                placeholder="e.g., High Value Customers"
                value={form.list_label}
                onChange={(value) =>
                  handleInputChange("list_label", value)
                }
                hasError={!!errors.list_label}
                className={tw.rounded}
              />
              {errors.list_label && (
                <p className="mt-1 text-xs text-red-500">{errors.list_label}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-black mb-1 block">
                List Type
              </label>
              <HeadlessSelect
                options={listTypeOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={form.list_type}
                onChange={(value) =>
                  handleInputChange(
                    "list_type",
                    value as SegmentListFormValues["list_type"],
                  )
                }
                placeholder="Select list type..."
                error={!!errors.list_type}
              />
              {errors.list_type && (
                <p className="mt-1 text-xs text-red-500">{errors.list_type}</p>
              )}
            </div>

            <div>
              <Textarea
                label="Description"
                value={form.list_description}
                onChange={(value) =>
                  handleInputChange("list_description", value)
                }
                rows={4}
                placeholder="Describe who belongs in this list and how you'll use it."
                hasError={!!errors.list_description}
              />
              {errors.list_description && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.list_description}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-black mb-1 block">
                Subscriber ID Column
              </label>
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
                const placeholder =
                  headerOptions.length > 0
                    ? "Select a column from your file..."
                    : "Upload a file to see column options...";

                // Always use dropdown - populate with headers when available
                return (
                  <>
                    <HeadlessSelect
                      options={headerOptions.map((header) => ({
                        value: header,
                        label: header,
                      }))}
                      value={form.subscriber_id_col_name}
                      onChange={(value) =>
                        handleInputChange("subscriber_id_col_name", value || "")
                      }
                      placeholder={placeholder}
                      error={!!errors.subscriber_id_col_name}
                    />
                    {errors.subscriber_id_col_name && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.subscriber_id_col_name}
                      </p>
                    )}
                    {headerOptions.length === 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        Upload a file above to automatically populate column
                        options.
                      </p>
                    )}
                  </>
                );
              })()}
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
              />
              {errors.file_delimiter && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.file_delimiter}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-black mb-1 block">
                {isCreateMode ? "Upload Your File" : "Upload Replacement File"}
              </label>
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
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center ${tw.rounded} border-2 border-dashed py-10 text-center cursor-pointer transition ${
                    isDragging
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
                      className="text-sm font-medium text-red-500 hover:text-red-600"
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

                      return (
                        <div className="mt-4">
                          <label className="text-sm font-medium text-black mb-2 block">
                            File Preview
                          </label>
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
                                            <span className="text-gray-400">
                                              —
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

              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className={`${tw.rounded} px-4 py-2 text-sm font-medium transition-colors`}
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
                className="text-sm font-semibold shadow-sm"
                style={{
                  backgroundColor: buttonTokens.action.background,
                  color: buttonTokens.action.color,
                  borderRadius: buttonTokens.action.borderRadius,
                  padding: `${buttonTokens.action.paddingY} ${buttonTokens.action.paddingX}`,
                }}
              >
                {submitLabel ||
                  (isCreateMode ? "Create" : "Update")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
