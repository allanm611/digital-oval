import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { tw } from "../../../shared/utils/utils";
import {
  engineTrackingSourceService,
  type CreateEngineTrackingSourcePayload,
  type EngineTrackingSource,
  type UpdateEngineTrackingSourcePayload,
} from "../services/engineTrackingSourceService";
import EngineTrackingSourceForm from "../components/engine-tracking/EngineTrackingSourceForm";

interface EngineTrackingSourceFormPageProps {
  mode: "create" | "edit";
}

export default function EngineTrackingSourceFormPage({
  mode,
}: EngineTrackingSourceFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [editingSource, setEditingSource] =
    useState<EngineTrackingSource | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const source = await engineTrackingSourceService.getById(Number(id));
        if (!cancelled) setEditingSource(source);
      } catch (err) {
        if (!cancelled) {
          showError(
            extractBackendError(err, "Failed to load tracking source"),
          );
          navigate("/dashboard/tracking-sources");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, id, navigate, showError]);

  const handleSave = async (
    payload:
      | CreateEngineTrackingSourcePayload
      | UpdateEngineTrackingSourcePayload,
  ) => {
    try {
      setIsSaving(true);
      if (mode === "edit" && id) {
        await engineTrackingSourceService.update(
          Number(id),
          payload as UpdateEngineTrackingSourcePayload,
        );
        success("Tracking source updated successfully");
      } else {
        await engineTrackingSourceService.create(
          payload as CreateEngineTrackingSourcePayload,
        );
        success("Tracking source created successfully");
      }
      navigate("/dashboard/tracking-sources");
    } catch (err) {
      showError(extractBackendError(err, "Failed to save tracking source"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>
          Loading tracking source...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb={true}
        currentLabel={
          mode === "create" ? "Create Tracking Source" : "Edit Tracking Source"
        }
      />

      <EngineTrackingSourceForm
        mode={mode}
        isLoading={isSaving}
        initialData={editingSource}
        onCancel={() => navigate("/dashboard/tracking-sources")}
        onSave={handleSave}
      />
    </div>
  );
}
