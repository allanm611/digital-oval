import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { usePageTask } from "../../../shared/navigation/PageTaskProvider";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import LoyaltyProgramForm from "../components/LoyaltyProgramForm";
import { loyaltyProgramService } from "../services/loyaltyProgramService";
import { loadAttributeFieldOptions } from "../utils/attributeSources";
import { SAMPLE_ATTRIBUTE_FIELDS } from "../data/loyaltyProgramSamples";
import {
  createEmptyLoyaltyProgramForm,
  hasFormErrors,
  loyaltyProgramToForm,
  toLoyaltyProgramPayload,
  validateLoyaltyProgramForm,
  type LoyaltyProgramFormErrors,
  type LoyaltyProgramFormValues,
} from "../utils/loyaltyProgramForm";
import type {
  AttributeFieldOption,
  LoyaltyProgramStatus,
} from "../types/loyaltyProgram";

export default function LoyaltyProgramFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const programId = Number(id);
  const isEdit = Number.isInteger(programId) && programId > 0;
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState<LoyaltyProgramFormValues>(
    createEmptyLoyaltyProgramForm,
  );
  const [errors, setErrors] = useState<LoyaltyProgramFormErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<LoyaltyProgramStatus | null>(null);
  const [sources, setSources] = useState<AttributeFieldOption[]>(
    SAMPLE_ATTRIBUTE_FIELDS,
  );
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [sourcesNote, setSourcesNote] = useState<string | null>(null);

  const cancelled = status === "cancelled";

  usePageTask({
    task: isEdit ? "Edit Loyalty Program" : "Create Loyalty Program",
    subject: form.name.trim() || undefined,
    status: status ?? undefined,
  });

  useEffect(() => {
    let ignore = false;
    loadAttributeFieldOptions()
      .then((options) => {
        if (ignore) return;
        if (options.length > 0) {
          setSources(options);
          setSourcesNote(null);
          return;
        }
        setSources(SAMPLE_ATTRIBUTE_FIELDS);
        setSourcesNote(
          "These K fields are sample profile fields so the formula can be tried. Live numeric profile, usage metric, and static fields replace them when the profile dictionary is available.",
        );
      })
      .catch(() => {
        if (ignore) return;
        setSources(SAMPLE_ATTRIBUTE_FIELDS);
        setSourcesNote(
          "These K fields are sample profile fields so the formula can be tried. Live numeric profile, usage metric, and static fields replace them when the profile dictionary is available.",
        );
      })
      .finally(() => {
        if (!ignore) setSourcesLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let ignore = false;
    setLoading(true);
    loyaltyProgramService
      .getById(programId)
      .then((program) => {
        if (ignore) return;
        setForm(loyaltyProgramToForm(program));
        setStatus(program.status);
        setLoadError(null);
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(
            extractBackendError(error, "Could not load this loyalty program."),
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [isEdit, programId]);

  const handleSubmit = async () => {
    const nextErrors = validateLoyaltyProgramForm(form);
    setErrors(nextErrors);
    if (hasFormErrors(nextErrors)) {
      showError("Fix the highlighted configuration before saving.");
      return;
    }

    setSaving(true);
    try {
      const payload = toLoyaltyProgramPayload(
        form,
        user?.user_id,
        isEdit ? "update" : "create",
      );
      const saved = isEdit
        ? await loyaltyProgramService.update(programId, payload)
        : await loyaltyProgramService.create(payload);
      success(isEdit ? "Loyalty program updated." : "Loyalty program created.");
      navigate(`/dashboard/loyalty-programs/${saved.id}`);
    } catch (error) {
      showError(extractBackendError(error, "Could not save the loyalty program."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <BackButton
        parentTo="/dashboard/loyalty-programs"
        parentLabel="Loyalty Programs"
        currentLabel={
          isEdit
            ? form.name.trim()
              ? `Edit ${form.name.trim()}`
              : "Edit Loyalty Program"
            : "Create Loyalty Program"
        }
        showBreadcrumb
      />

      <p className={`${tw.textSecondary} max-w-3xl text-sm`}>
        Customers can register for more than one program. Bonus points add up
        inside each program and are redeemed there.
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : loadError ? (
        <div className={`${tw.rounded} border border-red-200 bg-white px-5 py-6`}>
          <p className="text-sm text-gray-700">{loadError}</p>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          {cancelled && (
            <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              This program is cancelled. Its configuration is kept for history
              and can no longer be changed.
            </div>
          )}
          <LoyaltyProgramForm
            value={form}
            errors={errors}
            sources={sources}
            sourcesLoading={sourcesLoading}
            sourcesError={sourcesError}
            sourcesNote={sourcesNote}
            disabled={saving || cancelled}
            onChange={setForm}
          />
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-md border border-neutral-900 bg-white px-5 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
              onClick={() =>
                navigate(
                  isEdit
                    ? `/dashboard/loyalty-programs/${programId}`
                    : "/dashboard/loyalty-programs",
                )
              }
            >
              {cancelled ? "Back" : "Cancel"}
            </button>
            {!cancelled && (
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-neutral-950 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
              >
                {saving
                  ? isEdit
                    ? "Updating…"
                    : "Creating…"
                  : isEdit
                    ? "Update"
                    : "Create"}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
