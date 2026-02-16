import { useState, useMemo, useEffect } from "react";
import { AlertCircle, Loader2, Plus, List } from "lucide-react";
import { color, tw, button as buttonTokens } from "../../../shared/utils/utils";
import { ManualBroadcastData } from "../pages/CreateManualBroadcastPage";
import { useLanguage } from "../../../contexts/LanguageContext";
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

  // Sync local state with data prop whenever component mounts or data changes
  useEffect(() => {
    setListName(data.audienceName || "");
    setListType(data.uploadType || "");
    setInputMethod((data.inputMethod as "file" | "manual") || "");
    setManualInput(data.audienceFileText || "");

    // Restore selected quicklist if they had selected one
    if (data.inputMethod === "file" && data.quicklistId) {
      // Try to fetch the actual quicklist details
      quicklistService
        .getQuickListById(data.quicklistId)
        .then((response) => {
          if (response.data) {
            setSelectedQuickList({
              id: response.data.id,
              name: response.data.name,
              upload_type: response.data.processing_status || "multi",
              row_count: response.data.rows_imported || 0,
              created_at: response.data.created_at,
            });
          }
        })
        .catch((err) => {
          console.error("Failed to load quicklist details:", err);
          // Fallback to minimal info we have
          setSelectedQuickList({
            id: data.quicklistId,
            name: "QuickList",
            upload_type: data.uploadType || "multi",
            row_count: data.rowCount || 0,
            created_at: new Date().toISOString(),
          });
        });
    } else {
      setSelectedQuickList(null);
    }
  }, [data]);

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d+\-() \s]{5,}$/;

    return lines.some((line) => emailRegex.test(line) || phoneRegex.test(line));
  };

  const isFormValid =
    listName.trim() &&
    listType !== "" &&
    inputMethod !== "" &&
    (inputMethod === "manual"
      ? validateManualInput()
      : inputMethod === "file" && selectedQuickList);

  const handleSelectQuickList = (quicklist: QuickListItem) => {
    setSelectedQuickList(quicklist);
    setError("");
    setShowPickerModal(false);
  };

  const handleCreateQuickList = async (request: CreateQuickListRequest) => {
    try {
      const response = await quicklistService.createQuickList(request);
      if (response.success && response.data) {
        // Get rows_imported from the response
        const rowsImported = (response.data as any).rows_imported || 0;
        const quicklistId = (response.data as any).quicklist_id || (response.data as any).id;

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
      }
    } catch (err) {
      console.error("Failed to create quicklist:", err);
      setError("Failed to create quicklist. Please try again.");
    }
  };

  const handleNext = async () => {
    if (!isFormValid) {
      if (inputMethod === "file" && !selectedQuickList) {
        setError("Please select or create a quicklist");
      } else if (inputMethod === "manual" && !validateManualInput()) {
        setError("Please enter valid emails or phone numbers (one per line)");
      } else if (!listName.trim()) {
        setError("Please enter a broadcast name");
      } else if (listType === "") {
        setError("Please select a list type");
      } else if (inputMethod === "") {
        setError("Please select an input method");
      } else {
        setError("Please fill in all required fields");
      }
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
        // uploadType already set above from user's list type selection - don't overwrite
      }

      // Handle manual input method
      if (inputMethod === "manual") {
        updateData.audienceFileText = manualInput;
        // Calculate the number of recipients from manual input
        const recipientLines = manualInput
          .split("\n")
          .filter((line) => line.trim());
        updateData.rowCount = recipientLines.length;
      }

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
          <label className="text-sm font-medium text-gray-900 block mb-1">
            Broadcast Name *
          </label>
          <input
            type="text"
            value={listName}
            onChange={(e) => {
              setListName(e.target.value);
              setError("");
            }}
            placeholder="e.g., Q4 Campaign Audience"
            disabled={isSubmitting}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-color,#5EC6B1)] disabled:opacity-50"
          />
        </div>

        {/* List Type */}
        <div>
          <label className="text-sm font-medium text-gray-900 block mb-1">
            List Type *
          </label>
          <HeadlessSelect
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
          <label className="text-sm font-medium text-gray-900 block mb-1">
            Input Method *
          </label>
          <HeadlessSelect
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
            <label className="text-sm font-medium text-gray-900 block">
              Select or Create QuickList *
            </label>

            {selectedQuickList ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs text-gray-600">
                    Select an existing quicklist or create a new one
                  </p>
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
                Select an existing quicklist or create a new one
              </p>
            )}

            {!isQuickListCreated && !selectedQuickList && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPickerModal(true)}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                  <List className="w-4 h-4" />
                  Select from Existing
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 transition-colors text-white"
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
            <label className="text-sm font-medium text-gray-900 block mb-2">
              Enter Contacts Manually *
            </label>
            <textarea
              value={manualInput}
              onChange={(e) => {
                setManualInput(e.target.value);
                setError("");
              }}
              placeholder="Enter emails or phone numbers (one per line)&#10;&#10;Example:&#10;john@example.com&#10;jane@example.com&#10;+33612345678&#10;+1234567890"
              rows={10}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-color,#5EC6B1)] disabled:opacity-50 font-mono"
            />
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
                    {
                      manualInput.split("\n").filter((line) => line.trim())
                        .length
                    }{" "}
                    line
                    {manualInput.split("\n").filter((line) => line.trim())
                      .length !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
        {/* Error Message */}
        {error && (
          <div
            className="p-3 rounded-md flex items-start space-x-2 mb-4"
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
            className="px-4 py-2 rounded-md transition-colors text-sm font-medium text-white flex items-center justify-center"
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
                Processing...
              </>
            ) : (
              "Next: Define Communication"
            )}
          </button>
        </div>
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
