import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { color, tw } from "../../../shared/utils/utils";
import {
  engineTrackingSourceService,
  type CreateEngineTrackingSourcePayload,
  type EngineTrackingSource,
  type UpdateEngineTrackingSourcePayload,
} from "../services/engineTrackingSourceService";
import EngineTrackingSourceForm from "../components/engine-tracking/EngineTrackingSourceForm";
import {
  planFieldSync,
  type EngineTrackingDraftField,
} from "../components/engine-tracking/engineTrackingFieldUtils";
import type { TrackingSelectorOperator } from "../types/engineTrackingSource";
import { ENGINE_OPERATOR_CATALOG } from "../types/engineTrackingSource";

const LIST_PATH = "/dashboard/tracking-sources";

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
  /** Where Cancel / Back should return when returnTo is not set. */
  from?: "list" | "details";
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

  const detailsPath = (sourceId: number) =>
    `${LIST_PATH}/${sourceId}/details`;

  const leaveForm = () => {
    if (returnPath) {
      navigate(returnPath, { state: navState?.returnTo?.state });
      return;
    }
    if (mode === "edit" && id && navState?.from === "details") {
      navigate(detailsPath(Number(id)));
      return;
    }
    navigate(LIST_PATH);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [editingSource, setEditingSource] =
    useState<EngineTrackingSource | null>(null);
  const [operatorCatalog, setOperatorCatalog] = useState<
    TrackingSelectorOperator[]
  >(ENGINE_OPERATOR_CATALOG);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const catalog = await engineTrackingSourceService.getOperatorCatalog();
        if (!cancelled && catalog.length) setOperatorCatalog(catalog);
      } catch {
        // Seed catalog is enough to pick operators on a fresh environment.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const source =
          await engineTrackingSourceService.getByIdWithSelectorConfig(
            Number(id),
          );
        if (!cancelled) setEditingSource(source);
      } catch (err) {
        if (!cancelled) {
          showError(
            extractBackendError(err, "Failed to load tracking source"),
          );
          navigate(LIST_PATH);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, id, navigate, showError]);

  const goToDetails = (sourceId: number) => {
    navigate(detailsPath(sourceId), { replace: true });
  };

  const syncOperatorsForDrafts = async (
    drafts: EngineTrackingDraftField[],
    persistedFields: { id: number; fieldKey: string; operators?: { id: number }[] }[],
  ) => {
    const byId = new Map(persistedFields.map((f) => [f.id, f]));
    const byKey = new Map(
      persistedFields.map((f) => [f.fieldKey.toLowerCase(), f]),
    );

    for (const draft of drafts) {
      const fieldName = draft.fieldName.trim();
      const fieldKey = (draft.fieldKey.trim() || fieldName).toLowerCase();
      if (!fieldName && !draft.fieldKey.trim()) continue;

      const persisted =
        (draft.existingId != null ? byId.get(draft.existingId) : undefined) ||
        byKey.get(fieldKey);
      if (!persisted) continue;

      const desiredIds = (draft.operators || []).map((op) => op.id);
      const existingIds = (persisted.operators || []).map((op) => op.id);
      await engineTrackingSourceService.syncFieldOperators(
        persisted.id,
        desiredIds,
        existingIds,
      );
    }
  };

  const handleSave = async (
    payload:
      | CreateEngineTrackingSourcePayload
      | UpdateEngineTrackingSourcePayload,
    fieldDrafts?: EngineTrackingDraftField[],
  ) => {
    try {
      setIsSaving(true);
      const drafts = fieldDrafts || [];
      if (mode === "edit" && id) {
        const sourceId = Number(id);
        await engineTrackingSourceService.update(
          sourceId,
          payload as UpdateEngineTrackingSourcePayload,
        );

        const activeExisting = (editingSource?.fields || []).filter(
          (f) => f.isActive !== false,
        );
        const { plan } = planFieldSync(activeExisting, drafts);
        const hasFieldChanges =
          plan.toAdd.length > 0 ||
          plan.toUpdate.length > 0 ||
          plan.toDeleteIds.length > 0;

        let createdFields: { id: number; fieldKey: string }[] = [];
        try {
          if (hasFieldChanges) {
            const result =
              await engineTrackingSourceService.syncFields(sourceId, plan);
            createdFields = result.created || [];
          }
          await syncOperatorsForDrafts(drafts, [
            ...activeExisting,
            ...createdFields,
          ]);
          success("Tracking source updated successfully");
        } catch (fieldErr) {
          showError(
            extractBackendError(
              fieldErr,
              "Source saved, but some field or operator changes failed. Review fields on the details page.",
            ),
          );
        }

        if (returnPath) {
          leaveForm();
        } else {
          goToDetails(sourceId);
        }
      } else {
        const created = await engineTrackingSourceService.create(
          payload as CreateEngineTrackingSourcePayload,
        );
        try {
          const persisted =
            created?.fields?.length
              ? created
              : created?.id
                ? await engineTrackingSourceService.getById(created.id)
                : null;
          if (persisted?.fields?.length) {
            await syncOperatorsForDrafts(drafts, persisted.fields);
          }
          success("Tracking source created successfully");
        } catch (opErr) {
          showError(
            extractBackendError(
              opErr,
              "Source created, but some operators failed to attach. Review fields on the details page.",
            ),
          );
        }
        if (returnPath) {
          leaveForm();
        } else if (created?.id) {
          goToDetails(created.id);
        } else {
          navigate(LIST_PATH);
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
      <div className="flex items-center justify-between gap-4">
        <BackButton
          showBreadcrumb={true}
          parentLabel={parentLabel}
          currentLabel={currentLabel}
          onClick={leaveForm}
        />
        {mode === "edit" && id ? (
          <button
            type="button"
            onClick={() => navigate(detailsPath(Number(id)))}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50"
            style={{ color: color.primary.action }}
          >
            <Eye className="w-4 h-4" />
            View details
          </button>
        ) : null}
      </div>

      <EngineTrackingSourceForm
        mode={mode}
        isLoading={isSaving}
        initialData={editingSource}
        operatorCatalog={operatorCatalog}
        onCancel={leaveForm}
        onSave={handleSave}
      />
    </div>
  );
}
