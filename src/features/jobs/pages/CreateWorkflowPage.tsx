import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { workflowService } from "../services/workflowService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import type { CreateWorkflowPayload, UpdateWorkflowPayload } from "../types/workflow";

export default function CreateWorkflowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success: showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workflowTypes, setWorkflowTypes] = useState<string[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [formData, setFormData] = useState<CreateWorkflowPayload>({
    name: "",
    description: null,
    workflow_type: null,
    is_active: true,
    created_by: user?.user_id ?? null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadWorkflowTypes = async () => {
      try {
        const types = await workflowService.getWorkflowTypes(true);
        setWorkflowTypes(types);
      } catch (err) {
        console.error("Failed to load workflow types:", err);
        setWorkflowTypes([]);
      } finally {
        setIsLoadingTypes(false);
      }
    };
    loadWorkflowTypes();
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      const loadWorkflow = async () => {
        setIsLoading(true);
        try {
          const workflow = await workflowService.getWorkflowById(Number(id), true);
          setFormData({
            name: workflow.name,
            description: workflow.description,
            workflow_type: workflow.workflow_type,
            is_active: workflow.is_active,
            created_by: workflow.created_by,
          });
        } catch (err) {
          showError(
            t.common.error,
            err instanceof Error ? err.message : t.workflows.failedToLoadWorkflow
          );
        } finally {
          setIsLoading(false);
        }
      };
      loadWorkflow();
    }
  }, [id, isEditMode, showError]);

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
      if (isEditMode && id) {
        const updatePayload: UpdateWorkflowPayload = {
          name: formData.name,
          description: formData.description,
          workflow_type: formData.workflow_type,
        };
        await workflowService.updateWorkflow(Number(id), updatePayload);
        showToast(t.workflows.workflowUpdated, t.workflows.workflowUpdateSuccess);
      } else {
        const createPayload: CreateWorkflowPayload = {
          name: formData.name,
          description: formData.description,
          workflow_type: formData.workflow_type,
          created_by: formData.created_by,
        };
        await workflowService.createWorkflow(createPayload);
        showToast(t.workflows.workflowCreated, t.workflows.workflowCreateSuccess);
      }
      navigate("/dashboard/workflows");
    } catch (err) {
      showError(
        t.common.error,
        err instanceof Error ? err.message : t.workflows.failedToSaveWorkflow
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard/workflows")}
          className={`${tw.rounded} p-2 text-gray-600 hover:text-gray-800 transition-colors`}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
          {isEditMode ? t.workflows.editWorkflow : t.workflows.createWorkflow}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="">
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {t.workflows.workflowInformation}
          </h2>
          <div className="space-y-4">
            <div>
              <Input
                label={`${t.common.name}*`}
                placeholder={t.workflows.enterWorkflowName}
                value={formData.name}
                onChange={(val) =>
                  setFormData({ ...formData, name: val })
                }
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
              rows={4}
              placeholder={t.workflows.enterWorkflowDescription}
            />

            <div>
              <HeadlessSelect
                label={t.common.type}
                options={[
                  { value: "", label: "Select a type..." },
                  ...workflowTypes.map((type) => ({
                    value: type,
                    label: type,
                  })),
                ]}
                value={formData.workflow_type || ""}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    workflow_type: val ? String(val) : null,
                  })
                }
                placeholder={t.workflows.enterWorkflowType}
                disabled={isLoadingTypes}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard/workflows")}
            className="transition-colors disabled:opacity-60"
            style={getButtonStyles(button.bordered)}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`${tw.rounded} px-4 py-2 text-sm font-semibold text-white disabled:opacity-50`}
            style={{ backgroundColor: color.primary.action }}
          >
            {isSaving ? (
              <>
                <LoadingSpinner />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditMode ? "Update" : "Create"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

