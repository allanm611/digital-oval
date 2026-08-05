import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, X } from "lucide-react";
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
}

export default function ConfigureErrorGroupModal({
  isOpen,
  onClose,
  onSaved,
}: ConfigureErrorGroupModalProps) {
  const { error: showError, success } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [defaultFailureMessage, setDefaultFailureMessage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [availableCodes, setAvailableCodes] = useState<ErrorCodeOption[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName("");
    setCode("");
    setDescription("");
    setDefaultFailureMessage("");
    setIsActive(true);
    setSelectedCodes([]);
    setErrors({});
  };

  const loadErrorCodes = async () => {
    setLoadingCodes(true);
    try {
      const codes = await errorGroupService.fetchErrorCodes();
      setAvailableCodes(codes);
    } catch (err) {
      showError("Error", extractBackendError(err, "Could not fetch error codes."));
      setAvailableCodes([]);
    } finally {
      setLoadingCodes(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
    void loadErrorCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggleCode = (errorCode: string) => {
    setSelectedCodes((prev) =>
      prev.includes(errorCode)
        ? prev.filter((c) => c !== errorCode)
        : [...prev, errorCode],
    );
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required";
    if (!code.trim()) next.code = "Code is required";
    else if (!/^[A-Za-z0-9_-]{1,16}$/.test(code.trim())) {
      next.code = "Use 1–16 letters, numbers, _ or -";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const created = await errorGroupService.createErrorGroup({
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
        default_failure_message: defaultFailureMessage.trim() || undefined,
        error_codes: selectedCodes,
        is_active: isActive,
      });
      success("Success", `Error group "${created.name}" saved`);
      onSaved(created);
      onClose();
    } catch (err) {
      showError("Error", extractBackendError(err, "Could not save error group."));
    } finally {
      setIsSaving(false);
    }
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
              Define a reusable failure group and attach provider error codes.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <Input
                label="Group Code *"
                value={code}
                onChange={(value) => {
                  setCode(value);
                  if (errors.code) setErrors((prev) => ({ ...prev, code: "" }));
                }}
                placeholder="e.g., 01"
                hasError={!!errors.code}
              />
              {errors.code ? (
                <p className="mt-1 text-xs text-red-600">{errors.code}</p>
              ) : null}
            </div>
          </div>

          <Textarea
            label="Description"
            value={description}
            onChange={setDescription}
            rows={2}
            placeholder="Optional context for operators"
          />

          <Input
            label="Default failure message"
            value={defaultFailureMessage}
            onChange={setDefaultFailureMessage}
            placeholder="Applied when this group is selected on a reward rule"
          />

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <p className={`text-sm font-medium ${tw.textPrimary}`}>
                  Error codes
                </p>
                <p className={`text-xs ${tw.textMuted}`}>
                  Select codes that should map to this group during fulfilment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadErrorCodes()}
                disabled={loadingCodes}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 ${tw.rounded} text-gray-700 hover:bg-gray-50 disabled:opacity-50`}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingCodes ? "animate-spin" : ""}`}
                />
                {loadingCodes ? "Fetching..." : "Fetch error codes"}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-3 space-y-2 bg-gray-50">
              {loadingCodes && availableCodes.length === 0 ? (
                <p className={`text-sm ${tw.textMuted}`}>Loading error codes…</p>
              ) : availableCodes.length === 0 ? (
                <p className={`text-sm ${tw.textMuted}`}>
                  No error codes available. Try fetching again.
                </p>
              ) : (
                availableCodes.map((item) => {
                  const checked = selectedCodes.includes(item.code);
                  return (
                    <label
                      key={item.code}
                      className="flex items-start gap-2 cursor-pointer"
                    >
                      <Checkbox
                        id={`error-code-${item.code}`}
                        checked={checked}
                        onChange={() => toggleCode(item.code)}
                      />
                      <span className="min-w-0">
                        <span className={`block text-sm ${tw.textPrimary}`}>
                          {item.label}{" "}
                          <span className="font-mono text-xs text-gray-500">
                            ({item.code})
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
            {selectedCodes.length > 0 ? (
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

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} disabled:opacity-50`}
            >
              Cancel
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
