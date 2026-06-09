import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useLanguage } from "../../../contexts/LanguageContext";
import { workflowService } from "../services/workflowService";
import type { Workflow, CreateWorkflowPayload } from "../types/workflow";

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workflow?: Workflow | null;
}

export default function WorkflowModal({
  isOpen,
  onClose,
  onSuccess,
  workflow,
}: WorkflowModalProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workflowTypes, setWorkflowTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateWorkflowPayload>({
    name: "",
    description: null,
    workflow_type: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load workflow types on mount
  useEffect(() => {
    if (isOpen) {
      loadWorkflowTypes();
      if (workflow) {
        setFormData({
          name: workflow.name,
          description: workflow.description,
          workflow_type: workflow.workflow_type,
        });
      } else {
        setFormData({
          name: "",
          description: null,
          workflow_type: null,
        });
      }
    }
  }, [isOpen, workflow]);

  const loadWorkflowTypes = async () => {
    try {
      const response = await workflowService.getWorkflowTypes(true);
      const types = Array.isArray(response.data)
        ? response.data
        : response.data?.types || [];
      setWorkflowTypes(types);
    } catch (err) {
      console.error("Failed to load workflow types:", err);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = t.workflows.nameRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      if (workflow?.id) {
        await workflowService.updateWorkflow(workflow.id, formData);
      } else {
        await workflowService.createWorkflow(formData);
      }
      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t.workflows.failedToSaveWorkflow;
      setErrors({ submit: message });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white ${tw.rounded} w-full max-w-md shadow-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {workflow
              ? t.workflows.editWorkflow
              : t.workflows.createWorkflow}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {errors.submit}
            </div>
          )}

          <div>
            <Input
              label={<>{t.common.name} <span className="text-red-500">*</span></>}
              type="text"
              placeholder={t.workflows.enterWorkflowName}
              value={formData.name}
              onChange={(val) => setFormData({ ...formData, name: String(val) })}
              hasError={!!errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <Textarea
            label={t.common.description}
            value={formData.description || ""}
            onChange={(value) =>
              setFormData({
                ...formData,
                description: value || null,
              })
            }
            rows={3}
            placeholder={t.workflows.enterWorkflowDescription}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.common.type}
            </label>
            {workflowTypes.length > 0 ? (
              <HeadlessSelect
                options={[
                  { value: "", label: t.common.select },
                  ...workflowTypes.map((type) => ({
                    value: type,
                    label: type,
                  })),
                ]}
                value={formData.workflow_type || ""}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    workflow_type: value ? String(value) : null,
                  })
                }
                placeholder={t.common.select}
                className="w-full"
              />
            ) : (
              <Input
                type="text"
                placeholder={t.workflows.enterWorkflowType}
                value={formData.workflow_type || ""}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    workflow_type: val ? String(val) : null,
                  })
                }
               
              />
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
            style={getButtonStyles(button.bordered)}
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`px-4 py-2 text-sm font-semibold text-white ${tw.rounded} disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2`}
            style={{ backgroundColor: color.primary.action }}
          >
            {isSaving
              ? workflow ? t.common.updating : t.common.creating
              : workflow ? t.common.update : t.common.create}
          </button>
        </div>
      </div>
    </div>
  );
}
