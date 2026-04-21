import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import { Program } from "../types/program";
import { useToast } from "../../../contexts/ToastContext";

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  program?: Program;
  onSave: (program: {
    name: string;
    code: string;
    description?: string;
    budget_total?: number;
    start_date?: string | null;
    end_date?: string | null;
  }) => Promise<void>;
  isSaving?: boolean;
}

export default function ProgramModal({
  isOpen,
  onClose,
  program,
  onSave,
  isSaving = false,
}: ProgramModalProps) {
  const { error: showErrorToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    budget_total: "",
    start_date: "",
    end_date: "",
  });
  const [error, setError] = useState("");
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name,
        code: program.code,
        description: program.description || "",
        budget_total: program.budget_total || "",
        start_date: program.start_date
          ? new Date(program.start_date).toISOString().split("T")[0]
          : "",
        end_date: program.end_date
          ? new Date(program.end_date).toISOString().split("T")[0]
          : "",
      });
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
        budget_total: "",
        start_date: "",
        end_date: "",
      });
    }
    setError("");
    setDateError("");
  }, [program, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Program name is required");
      return;
    }

    if (!formData.code.trim()) {
      setError("Program code is required");
      return;
    }

    if (formData.name.length > 128) {
      setError("Program name must be 128 characters or less");
      return;
    }

    // Validate dates - end date must be after start date
    if (formData.start_date && formData.end_date) {
      if (formData.end_date < formData.start_date) {
        showErrorToast("Date Validation Error", "End date cannot be before start date");
        return;
      }
    }

    const programData = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      description: formData.description.trim() || undefined,
      budget_total: formData.budget_total
        ? parseFloat(formData.budget_total)
        : undefined,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
    };

    await onSave(programData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
    >
      <div className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-md`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {program ? "Edit Program" : "Create New Program"}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 ${tw.rounded} transition-colors`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Name *
              </label>
              <Input
                placeholder="Enter program name"
                value={formData.name}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, name: value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Code *
              </label>
              <Input
                placeholder="Enter program code (e.g., PROG-Q4-2024)"
                value={formData.code}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, code: value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Total
              </label>
              <Input
                type="number"
                value={formData.budget_total}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    budget_total: String(value),
                  }))
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="Enter budget amount"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="Enter program description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      start_date: String(value),
                    }));
                    // Validate dates in real-time
                    if (String(value) && formData.end_date) {
                      if (formData.end_date < String(value)) {
                        setDateError("End date must be after start date");
                      } else {
                        setDateError("");
                      }
                    } else {
                      setDateError("");
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      end_date: String(value),
                    }));
                    // Validate dates in real-time
                    if (String(value) && formData.start_date) {
                      if (String(value) < formData.start_date) {
                        setDateError("End date must be after start date");
                      } else {
                        setDateError("");
                      }
                    } else {
                      setDateError("");
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm border ${
                    dateError ? "border-red-300" : "border-gray-300"
                  } ${tw.rounded} focus:outline-none focus:ring-2 ${
                    dateError ? "focus:ring-red-500 focus:border-red-500" : "focus:ring-purple-500 focus:border-transparent"
                  }`}
                />
                {dateError && (
                  <p className="mt-1 text-sm text-red-600">{dateError}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-gray-700 bg-gray-100 ${tw.rounded} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 text-white ${tw.rounded} disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = color.primary.action;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = color.primary.action;
              }}
            >
              {isSaving
                ? "Saving..."
                : program
                ? "Update Program"
                : "Create Program"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
