import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { errorGroupService } from "../../configurations/services/errorGroupService";
import type {
  ErrorCodeOption,
  ErrorGroup,
} from "../../configurations/types/errorGroup";

interface ConfigureErrorGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (group: ErrorGroup) => void;
  /**
   * When set, the new group is attached to this reward provider so
   * RewardDeliveryService can resolve mappings at fulfilment time.
   */
  providerId?: number | null;
}

export default function ConfigureErrorGroupModal({
  isOpen,
  onClose,
  onSaved,
  providerId = null,
}: ConfigureErrorGroupModalProps) {
  const { error: showError, success } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultFailureMessage, setDefaultFailureMessage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [customCode, setCustomCode] = useState("");
  const [availableCodes, setAvailableCodes] = useState<ErrorCodeOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName("");
    setDescription("");
    setDefaultFailureMessage("");
    setIsActive(true);
    setSelectedCodes([]);
    setCustomCode("");
    setErrors({});
  };

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
    setAvailableCodes(errorGroupService.getSuggestedErrorCodes());
  }, [isOpen]);

  const codeOptions = useMemo(() => {
    const known = new Map(
      availableCodes.map((c) => [c.code.toUpperCase(), c] as const),
    );
    selectedCodes.forEach((code) => {
      const upper = code.toUpperCase();
      if (!known.has(upper)) {
        known.set(upper, { code: upper, label: upper });
      }
    });
    return Array.from(known.values());
  }, [availableCodes, selectedCodes]);

  const toggleCode = (errorCode: string) => {
    const upper = errorCode.toUpperCase();
    setSelectedCodes((prev) =>
      prev.includes(upper)
        ? prev.filter((c) => c !== upper)
        : [...prev, upper],
    );
  };

  const addCustomCode = () => {
    const next = customCode.trim().toUpperCase();
    if (!next) return;
    if (!/^[A-Z0-9_]{1,64}$/.test(next)) {
      setErrors((prev) => ({
        ...prev,
        customCode: "Use 1–64 letters, numbers, or underscores",
      }));
      return;
    }
    setSelectedCodes((prev) =>
      prev.includes(next) ? prev : [...prev, next],
    );
    setCustomCode("");
    setErrors((prev) => {
      if (!prev.customCode) return prev;
      const copy = { ...prev };
      delete copy.customCode;
      return copy;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required";
    else if (name.trim().length > 100) {
      next.name = "Name must be 100 characters or less";
    }
    if (!defaultFailureMessage.trim()) {
      next.defaultFailureMessage =
        "Default failure message is required for mapped codes";
    } else if (defaultFailureMessage.trim().length > 1000) {
      next.defaultFailureMessage = "Message must be 1000 characters or less";
    }
    if (selectedCodes.length === 0) {
      next.codes = "Select or add at least one error code";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveErrorGroup = async (addAnother: boolean) => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const message = defaultFailureMessage.trim();
      const created = await errorGroupService.createErrorGroup({
        name: name.trim(),
        description: description.trim() || null,
        is_active: isActive,
        mappings: selectedCodes.map((error_code) => ({
          error_code,
          user_message: message,
        })),
        provider_id:
          providerId != null && Number.isFinite(Number(providerId))
            ? Number(providerId)
            : undefined,
      });

      // Enrich for offer-rule auto-fill of failure_text
      const withHint: ErrorGroup = {
        ...created,
        mappings:
          created.mappings && created.mappings.length > 0
            ? created.mappings
            : selectedCodes.map((error_code, index) => ({
                id: -(index + 1),
                error_group_id: created.id,
                error_code,
                user_message: message,
              })),
      };

      success(
        "Success",
        providerId
          ? `Error group "${created.name}" saved and attached to provider`
          : `Error group "${created.name}" saved`,
      );
      onSaved(withHint);

      if (addAnother) {
        // Keep modal open so operators can add multiple groups in one session.
        resetForm();
        setAvailableCodes(errorGroupService.getSuggestedErrorCodes());
      } else {
        onClose();
      }
    } catch (err) {
      showError("Error", extractBackendError(err, "Could not save error group."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveErrorGroup(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: zIndex.popover }}
      onClick={onClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-lg max-w-xl w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
              Configure Error Group
            </h2>
            <p className={`text-xs ${tw.textMuted} mt-0.5`}>
              Define a reusable failure group and map provider error codes to a
              user message.
              {providerId
                ? " The group will be attached to the selected reward provider."
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <Input
              label="Group Name *"
              value={name}
              onChange={(value) => {
                setName(value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="e.g., Low balance Failure"
              hasError={!!errors.name}
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            ) : null}
          </div>

          <Textarea
            label="Description"
            value={description}
            onChange={setDescription}
            rows={2}
            placeholder="Optional context for operators"
          />

          <div>
            <Input
              label="Default failure message *"
              value={defaultFailureMessage}
              onChange={(value) => {
                setDefaultFailureMessage(value);
                if (errors.defaultFailureMessage) {
                  setErrors((prev) => ({ ...prev, defaultFailureMessage: "" }));
                }
              }}
              placeholder="Applied to each selected error code mapping"
              hasError={!!errors.defaultFailureMessage}
            />
            {errors.defaultFailureMessage ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.defaultFailureMessage}
              </p>
            ) : (
              <p className={`mt-1 text-xs ${tw.textMuted}`}>
                Saved as each mapping&apos;s user message. Also seeds the reward
                rule failure text.
              </p>
            )}
          </div>

          <div>
            <div className="mb-2">
              <p className={`text-sm font-medium ${tw.textPrimary}`}>
                Error codes *
              </p>
              <p className={`text-xs ${tw.textMuted}`}>
                Codes returned by the reward provider that should use this
                group&apos;s message during fulfilment.
              </p>
            </div>

            <div className="flex gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <Input
                  value={customCode}
                  onChange={(value) => {
                    setCustomCode(value.toUpperCase());
                    if (errors.customCode) {
                      setErrors((prev) => ({ ...prev, customCode: "" }));
                    }
                  }}
                  placeholder="Add custom code e.g. E001"
                  hasError={!!errors.customCode}
                />
              </div>
              <button
                type="button"
                onClick={addCustomCode}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 ${tw.rounded} text-gray-700 hover:bg-gray-50 shrink-0`}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {errors.customCode ? (
              <p className="mb-2 text-xs text-red-600">{errors.customCode}</p>
            ) : null}

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-3 space-y-2 bg-gray-50">
              {codeOptions.length === 0 ? (
                <p className={`text-sm ${tw.textMuted}`}>
                  No suggested codes. Add a custom code above.
                </p>
              ) : (
                codeOptions.map((item) => {
                  const code = item.code.toUpperCase();
                  const checked = selectedCodes.includes(code);
                  return (
                    <label
                      key={code}
                      className="flex items-start gap-2 cursor-pointer"
                    >
                      <Checkbox
                        id={`error-code-${code}`}
                        checked={checked}
                        onChange={() => toggleCode(code)}
                      />
                      <span className="min-w-0">
                        <span className={`block text-sm ${tw.textPrimary}`}>
                          {item.label}{" "}
                          <span className="font-mono text-xs text-gray-500">
                            ({code})
                          </span>
                        </span>
                        {item.description ? (
                          <span className={`block text-xs ${tw.textMuted}`}>
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            {errors.codes ? (
              <p className="mt-1.5 text-xs text-red-600">{errors.codes}</p>
            ) : selectedCodes.length > 0 ? (
              <p className={`mt-1.5 text-xs ${tw.textMuted}`}>
                {selectedCodes.length} code
                {selectedCodes.length === 1 ? "" : "s"} selected
              </p>
            ) : null}
          </div>

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsActive((v) => !v)}
          >
            <Checkbox
              id="error-group-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className={`text-sm ${tw.textPrimary}`}>
              Mark error group as active
            </span>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveErrorGroup(true)}
              disabled={isSaving}
              className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} disabled:opacity-50`}
            >
              {isSaving ? "Saving..." : "Save & add another"}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 text-white ${tw.rounded} disabled:opacity-50`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isSaving ? "Saving..." : "Save Error Group"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
