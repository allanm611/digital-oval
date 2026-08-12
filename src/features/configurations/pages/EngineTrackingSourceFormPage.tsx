import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
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

/** Location state when opening create/edit from Offer Tracking (or elsewhere). */
export type EngineTrackingSourceFormLocationState = {
  returnTo?: {
    pathname: string;
    search?: string;
    state?: unknown;
  };
  /** Overrides breadcrumb parent; defaults to "Tracking Sources". */
  parentLabel?: string;
};

export default function EngineTrackingSourceFormPage({
  mode,
}: EngineTrackingSourceFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError } = useToast();

  const navState = (location.state ||
    null) as EngineTrackingSourceFormLocationState | null;

  const parentLabel = navState?.parentLabel?.trim() || "Tracking Sources";
  const currentLabel =
    mode === "create" ? "Create Tracking Source" : "Edit Tracking Source";

  const returnPath = useMemo(() => {
    const target = navState?.returnTo;
    if (!target?.pathname) return null;
    return `${target.pathname}${target.search || ""}`;
  }, [navState?.returnTo]);

  const leaveForm = () => {
    if (returnPath) {
      navigate(returnPath, { state: navState?.returnTo?.state });
      return;
    }
    navigateBackOrFallback(navigate, "/dashboard/tracking-sources");
  };

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
          leaveForm();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally omit leaveForm — only re-fetch when mode/id change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, id, navigate, showError]);

  const goToDetails = (sourceId: number) => {
    navigate(`/dashboard/tracking-sources/${sourceId}/details`, {
      replace: true,
    });
  };

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
        // Prefer details after edit so field management stays one click away.
        if (returnPath) {
          leaveForm();
        } else {
          goToDetails(Number(id));
        }
      } else {
        const created = await engineTrackingSourceService.create(
          payload as CreateEngineTrackingSourcePayload,
        );
        success("Tracking source created successfully");
        if (returnPath) {
          leaveForm();
        } else if (created?.id) {
          goToDetails(created.id);
        } else {
          leaveForm();
        }
      }
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
        parentLabel={parentLabel}
        currentLabel={currentLabel}
        onClick={leaveForm}
      />

      <EngineTrackingSourceForm
        mode={mode}
        isLoading={isSaving}
        initialData={editingSource}
        onCancel={leaveForm}
        onSave={handleSave}
      />
    </div>
  );
}
