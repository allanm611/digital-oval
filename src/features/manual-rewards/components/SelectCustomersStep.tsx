import { useState, useMemo } from "react";
import { AlertCircle, Loader2, Plus, List } from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import QuickListPickerModal from "../../segments/components/QuickListPickerModal";
import CreateQuickListModal from "../../quicklists/components/CreateQuickListModal";
import { quicklistService } from "../../quicklists/services/quicklistService";
import { ManualRewardData } from "../pages/CreateManualRewardPage";
import { useLanguage } from "../../../contexts/LanguageContext";

interface SelectCustomersStepProps {
  data: ManualRewardData;
  onUpdate: (data: Partial<ManualRewardData>) => void;
  onNext: () => void;
}

const listTypeOptions = [
  { value: "Standard", label: "Standard" },
  { value: "Premium", label: "Premium" },
  { value: "VIP", label: "VIP" },
];

interface QuickListItem {
  id: number;
  name: string;
  description?: string;
  upload_type: string;
  row_count: number;
  created_at: string;
}

export default function SelectCustomersStep({
  data,
  onUpdate,
  onNext,
}: SelectCustomersStepProps) {
  const { t } = useLanguage();
  const [listName, setListName] = useState(data.audienceName || "");
  const [listType, setListType] = useState(data.uploadType || "");
  const [inputMethod, setInputMethod] = useState<"" | "file" | "manual">(
    (data.inputMethod as "file" | "manual") || "",
  );
  const [selectedQuickList, setSelectedQuickList] =
    useState<QuickListItem | null>(null);
  const [isQuickListCreated, setIsQuickListCreated] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleCreateQuickList = async (request: any) => {
    try {
      const response = await quicklistService.createQuickList(request);
      if (response.success && response.data) {
        const newQuickList: QuickListItem = {
          id: response.data.quicklist_id,
          name: request.name,
          description: request.description || undefined,
          upload_type: "multi",
          row_count: response.data.rows_imported || 0,
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
        setError("Please enter a reward name");
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

      // Update reward data based on input method
      const updateData: Partial<ManualRewardData> = {
        audienceName: listName,
        uploadType: listType,
        inputMethod: inputMethod as "file" | "manual",
      };

      // Handle file upload method
      if (inputMethod === "file" && selectedQuickList) {
        updateData.quicklistId = selectedQuickList.id;
        updateData.rowCount = selectedQuickList.row_count;
      }

      // Handle manual input method
      if (inputMethod === "manual") {
        updateData.audienceFileText = manualInput;
        // Count the number of recipient lines
        const recipientLines = manualInput
          .split("\n")
          .filter((line) => line.trim());
        updateData.rowCount = recipientLines.length;
      }

      onUpdate(updateData);
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
      className={`bg-white ${tw.rounded} shadow-sm border`}
      style={{ borderColor: color.border.default }}
    >
      <div className="p-6">
        <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
          {t.manualRewards.selectCustomersTitle}
        </h2>
        <p className={`text-sm ${tw.textSecondary} mt-1`}>
          {t.manualRewards.selectCustomersSubtitle}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Reward Name */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            {t.manualRewards.listNameLabel}
          </label>
          <input
            type="text"
            value={listName}
            onChange={(e) => {
              setListName(e.target.value);
              setError("");
            }}
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

        {/* List Type */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
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
            zIndex={zIndex.popover}
          />
        </div>

        {/* Input Method */}
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
            value={inputMethod}
            onChange={(value) => {
              setInputMethod(value as "" | "file" | "manual");
              setError("");
            }}
            placeholder={t.manualRewards.inputMethodLabel}
            disabled={isSubmitting}
            zIndex={zIndex.popover}
          />
        </div>

        {/* QuickList Selection - Show only when Upload File is selected */}
        {inputMethod === "file" && (
          <div className="space-y-3 rounded-md">
            <label className="text-sm font-medium text-gray-900 block">
              Select or Create QuickList *
            </label>

            {selectedQuickList ? (
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
                {isQuickListCreated && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuickList(null);
                      setIsQuickListCreated(false);
                    }}
                    className="text-xs hover:underline mt-2"
                    style={{ color: color.primary.accent }}
                  >
                    Create Different QuickList
                  </button>
                )}
              </div>
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
                  style={{ backgroundColor: color.primary.action }}
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
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
            >
              {t.manualRewards.manualEntryLabel}
            </label>
            <textarea
              value={manualInput}
              onChange={(e) => {
                setManualInput(e.target.value);
                setError("");
              }}
              className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none focus:ring-2 font-mono`}
              style={{
                borderColor: color.border.default,
                color: color.text.primary,
              }}
              placeholder={t.manualRewards.manualEntryPlaceholder}
              rows={10}
              disabled={isSubmitting}
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
      <div className="p-6 flex items-center justify-end">
        <button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting || !isFormValid}
          className={`px-6 py-2.5 text-white ${tw.rounded} transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
          style={{ backgroundColor: color.primary.action }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            t.manualRewards.nextDefineReward
          )}
        </button>
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
