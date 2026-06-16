import { useState, useMemo, useEffect } from "react";
import { AlertCircle, Loader2, Plus, List } from "lucide-react";
import { color, tw, button as buttonTokens } from "../../../shared/utils/utils";
import { isValidCountryCodePhone, validateContacts } from "../../../shared/utils/validation";
import { ManualBroadcastData } from "../pages/CreateManualBroadcastPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import QuickListPickerModal from "../../segments/components/QuickListPickerModal";
import CreateQuickListModal from "../../quicklists/components/CreateQuickListModal";
import { quicklistService } from "../../quicklists/services/quicklistService";
import type { CreateQuickListRequest } from "../../quicklists/types/quicklist";

interface TargetAudienceStepProps {
  data: ManualBroadcastData;
  onUpdate: (data: Partial<ManualBroadcastData>) => void;
  onNext: () => void;
}

interface QuickListItem {
  id: number;
  name: string;
  description?: string;
  upload_type: string;
  row_count: number;
  created_at: string;
}

export default function TargetAudienceStep({
  data,
  onUpdate,
  onNext,
}: TargetAudienceStepProps) {
  const { t } = useLanguage();
  const [listName, setListName] = useState(data.audienceName || "");
  const [listType, setListType] = useState(data.uploadType || "");
  const [inputMethod, setInputMethod] = useState<"" | "file" | "manual">(
    (data.inputMethod as "file" | "manual") || "",
  );
  const [selectedQuickList, setSelectedQuickList] =
    useState<QuickListItem | null>(null);
  const [isQuickListCreated, setIsQuickListCreated] = useState(false);
  const [manualInput, setManualInput] = useState(data.audienceFileText || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [manualInputError, setManualInputError] = useState("");

  // Sync local state with data prop whenever component mounts or data changes
  useEffect(() => {
    setListName(data.audienceName || "");
    setListType(data.uploadType || "");
    setInputMethod((data.inputMethod as "file" | "manual") || "");
    setManualInput(data.audienceFileText || "");

    // Restore selected quicklist if they had selected one
    if (data.inputMethod === "file" && data.quicklistId) {
      // Only update if selectedQuickList doesn't already match the quicklistId
      // This prevents clearing the selected quicklist when parent re-renders
      if (!selectedQuickList || selectedQuickList.id !== data.quicklistId) {
        // Use pre-fetched quicklist data if available (from edit mode)
        if (data.quicklist) {
          setSelectedQuickList({
            id: data.quicklist.id,
            name: data.quicklist.name,
            upload_type: data.quicklist.processing_status || "multi",
            row_count: data.quicklist.rows_imported || 0,
            created_at: data.quicklist.created_at,
          });
        } else {
          // Otherwise use the quicklist data we have from parent
          setSelectedQuickList({
            id: data.quicklistId,
            name: data.quicklist?.name || "QuickList",
            upload_type: data.uploadType || "multi",
            row_count: data.rowCount || 0,
            created_at: new Date().toISOString(),
          });
        }
      }
    } else if (data.inputMethod !== "file") {
      setSelectedQuickList(null);
    }
  }, [data.inputMethod, data.quicklistId, data.uploadType, data.rowCount]);

  const inputMethodOptions = [
    { value: "", label: "Select option" },
    { value: "file", label: "Upload File" },
    { value: "manual", label: "Manual Input" },
  ];

  const listTypeOptions = [
    // { value: "", label: "Select option" },
    { value: "Standard", label: "Standard" },
    { value: "Premium", label: "Premium" },
    { value: "VIP", label: "VIP" },
  ];

  // Validate manual input format (emails or phone numbers)
  const validateManualInput = () => {
    if (!manualInput.trim()) return false;
    const lines = manualInput.split("\n").filter((line) => line.trim());
    const validation = validateContacts(lines);
    return validation.valid;
  };

  // Check for invalid contacts in real-time (emails or phone numbers)
  const checkManualInputErrors = () => {
    if (!manualInput.trim()) {
      setManualInputError("");
      return;
    }

    const lines = manualInput.split("\n").filter((line) => line.trim());
    const validation = validateContacts(lines);

    if (!validation.valid) {
      setManualInputError("Please enter valid emails or phone numbers (phone numbers must begin with country code)");
    } else {
      setManualInputError("");
    }
  };

  const isFormValid =
    listName.trim() &&
    inputMethod !== "" &&
    (inputMethod === "manual"
      ? validateManualInput()
      : inputMethod === "file" && selectedQuickList);

  const handleSelectQuickList = (quicklist: QuickListItem) => {
    console.log("[TargetAudienceStep] Quicklist selected:", quicklist.name, quicklist.id);
    setSelectedQuickList(quicklist);
    setError("");
    setShowPickerModal(false);
    // Immediately update parent state so selection is preserved when navigating
    // IMPORTANT: Clear the cached quicklist object so it doesn't restore the old one
    console.log("[TargetAudienceStep] Calling onUpdate with quicklistId:", quicklist.id);
    onUpdate({
      audienceName: listName, // Preserve broadcast name!
      uploadType: listType, // Preserve list type!
      inputMethod: "file",
      quicklistId: quicklist.id,
      rowCount: quicklist.row_count,
      quicklist: null, // Clear cached data to force fresh load
    });
  };

  const handleCreateQuickList = async (request: CreateQuickListRequest) => {
    try {
      const response = await quicklistService.createQuickList(request);
      if (response.success && response.data) {
        // Get rows_imported from the response
        const data = response.data as { rows_imported?: number; quicklist_id?: number; id?: number };
        const rowsImported = data.rows_imported || 0;
        const quicklistId = data.quicklist_id || data.id;

        const newQuickList: QuickListItem = {
          id: quicklistId,
          name: request.name,
          description: request.description || undefined,
          upload_type: listType || "multi", // Use the list type user selected
          row_count: rowsImported,
          created_at: new Date().toISOString(),
        };
        setSelectedQuickList(newQuickList);
        setIsQuickListCreated(true);
        setShowCreateModal(false);
        setError("");
        // Immediately update parent state so selection is preserved when navigating
        // IMPORTANT: Clear the cached quicklist object so it doesn't restore an old one
        onUpdate({
          audienceName: listName, // Preserve broadcast name!
          uploadType: listType, // Preserve list type!
          inputMethod: "file",
          quicklistId: quicklistId,
          rowCount: rowsImported,
          quicklist: null, // Clear cached data
        });
      }
    } catch (err) {
      console.error("Failed to create quicklist:", err);
      setError("Failed to create quicklist. Please try again.");
    }
  };

  const handleNext = async () => {
    console.log("[TargetAudienceStep] handleNext called with:", {
      isFormValid,
      inputMethod,
      listName,
      manualInputLength: manualInput.length,
      selectedQuickListId: selectedQuickList?.id,
    });

    if (!isFormValid) {
      if (inputMethod === "file" && !selectedQuickList) {
        setError("Please select or create a quicklist");
      } else if (inputMethod === "manual" && !validateManualInput()) {
        setError("Please enter valid emails or phone numbers (one per line)");
      } else if (!listName.trim()) {
        setError("Please enter a broadcast name");
      } else if (inputMethod === "") {
        setError("Please select an input method");
      } else {
        setError("Please fill in all required fields");
      }
      console.log("[TargetAudienceStep] Form validation failed");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      // Update broadcast data based on input method
      const updateData: Partial<ManualBroadcastData> = {
        audienceName: listName,
        uploadType: listType,
        inputMethod: inputMethod as "file" | "manual",
      };

      // Handle file upload method
      if (inputMethod === "file" && selectedQuickList) {
        updateData.quicklistId = selectedQuickList.id;
        updateData.rowCount = selectedQuickList.row_count;
        // Preserve the pre-fetched quicklist data if available
        if (data.quicklist) {
          updateData.quicklist = data.quicklist;
        }
        // uploadType already set above from user's list type selection - don't overwrite
      }

      // Handle manual input method
      if (inputMethod === "manual") {
        // Validate that all entries are valid emails or phone numbers with country code
        const lines = manualInput.split("\n").filter((line) => line.trim());
        const validation = validateContacts(lines);

        if (!validation.valid) {
          setError(
            `Please enter valid emails or phone numbers. Invalid: ${validation.invalidLines.slice(0, 3).join(", ")}${validation.invalidLines.length > 3 ? ", ..." : ""}`
          );
          return;
        }

        updateData.audienceFileText = manualInput;
        // Calculate the number of recipients from manual input
        const recipientLines = manualInput
          .split("\n")
          .filter((line) => line.trim());
        updateData.rowCount = recipientLines.length;
      }

      console.log("[TargetAudienceStep] Calling onUpdate with data:", {
        ...updateData,
        audienceFileText: updateData.audienceFileText ? `[${updateData.audienceFileText.length} chars]` : undefined,
      });
      onUpdate(updateData);

      // Move to next step
      onNext();
    } catch (err) {
      console.error("Failed to update audience:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to update audience information";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {/* Broadcast Name */}
        <div>
          <Input
            label="Broadcast Name"
            placeholder="e.g., Q4 Campaign Audience"
            value={listName}
            onChange={(value) => {
              setListName(value);
              setError("");
            }}
            disabled={isSubmitting}
            required
          />
        </div>

        {/* List Type */}
        <div>
          <HeadlessSelect
            label="List Type"
            options={listTypeOptions}
            value={listType}
            onChange={(value) => {
              setListType(value as string);
              setError("");
            }}
            placeholder="Select list type"
            disabled={isSubmitting}
            zIndex={1050}
          />
        </div>

        {/* Input Method */}
        <div>
          <HeadlessSelect
            label="Input Method *"
            options={inputMethodOptions}
            value={inputMethod}
            onChange={(value) => {
              setInputMethod(value as "" | "file" | "manual");
              setError("");
            }}
            placeholder="Select input method"
            disabled={isSubmitting}
            zIndex={1050}
          />
        </div>

        {/* QuickList Selection - Show only when Upload File is selected */}
        {inputMethod === "file" && (
          <div className="space-y-3  rounded-md">
            <label className="text-sm font-medium text-gray-900 block mb-0">
              Select or Create QuickList *
            </label>

            {selectedQuickList ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  {/* <p className="text-xs text-gray-600">
                    Select an existing quicklist or create a new one
                  </p> */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuickList(null);
                      setIsQuickListCreated(false);
                    }}
                    className="text-sm hover:underline"
                    style={{ color: color.primary.accent }}
                  >
                    Change
                  </button>
                </div>
                <div
                  className="p-3 rounded-md bg-white border-2 border-gray-300"
                  style={{ borderColor: color.primary.accent }}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {selectedQuickList.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedQuickList.row_count.toLocaleString()} rows
                  </p>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-600 mb-3">
                {/* Select an existing quicklist or create a new one */}
              </p>
            )}

            {!isQuickListCreated && !selectedQuickList && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPickerModal(true)}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-md  disabled:opacity-50 transition-colors"
                >
                  <List className="w-4 h-4" />
                  Select from Existing
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 transition-colors `}
                  style={{
                    backgroundColor: buttonTokens.action.background,
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Create Quicklist
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual Input - Show only when Manual Input is selected */}
        {inputMethod === "manual" && (
          <div>
            {/* Error Message above textarea */}
            {manualInputError && (
              <p className="mb-2 text-sm text-red-600">{manualInputError}</p>
            )}

            <Textarea
              label="Enter Contacts Manually"
              value={manualInput}
              onChange={(value) => {
                console.log("[TargetAudienceStep] Manual input changed:", {
                  length: value.length,
                  value: value.substring(0, 50) + (value.length > 50 ? "..." : ""),
                });
                setManualInput(value);
                setError("");
                // Check for validation errors in real-time
                const lines = value.split("\n").filter((line) => line.trim());
                if (lines.length > 0) {
                  const validation = validateContacts(lines);
                  console.log("[TargetAudienceStep] Validation result:", {
                    lineCount: lines.length,
                    isValid: validation.valid,
                  });
                  if (!validation.valid) {
                    setManualInputError("Please enter valid emails or phone numbers (phone numbers must begin with country code)");
                  } else {
                    setManualInputError("");
                  }
                } else {
                  setManualInputError("");
                }
              }}
              placeholder="Enter emails or phone numbers (one per line)&#10;Phone numbers must begin with country code&#10;&#10;Example:&#10;john@example.com&#10;jane@example.com&#10;254 764 555 247&#10;(254) 764-5524"
              rows={10}
              disabled={isSubmitting}
              hasError={!!manualInputError}
              className="font-mono"
              required
            />

            {(manualInput?.trim() || data?.rowCount) && !manualInputError && (
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
                    {
                      data?.rowCount ?? manualInput?.split("\n").filter((line) => line?.trim?.())?.length ?? 0
                    }{" "}
                    recipient
                    {(data?.rowCount ?? manualInput?.split("\n").filter((line) => line?.trim?.())?.length ?? 0) !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              </div>
            )}
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


      {/* QuickList Picker Modal */}
      <QuickListPickerModal
        isOpen={showPickerModal}
        onClose={() => setShowPickerModal(false)}
        onSelect={handleSelectQuickList}
      />

      {/* Create QuickList Modal */}
      <CreateQuickListModal
        isOpen={showCreateModal}
        mode="create"
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateQuickList}
      />
    </div>
  );
}
