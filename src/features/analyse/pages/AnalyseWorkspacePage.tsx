import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { usePageTask } from "../../../shared/navigation/PageTaskProvider";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import BackButton from "../../../shared/components/ui/BackButton";
import type { SegmentConditionGroup } from "../../segments/types/segment";
import { sampleNewConditions } from "../data/analyseSamples";
import { analysisService } from "../services/analysisService";
import type { AudienceSource } from "../types/analysis";
import { defaultAnalysisName } from "../utils/analysisDefinition";
import AnalysisOptionsFields from "../components/AnalysisOptionsFields";
import AudienceSegmentPicker from "../components/AudienceSegmentPicker";

const panelClass = `${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`;

const TABS: Array<{ id: AudienceSource; label: string }> = [
  { id: "new", label: "New" },
  { id: "existing", label: "Existing" },
  { id: "saved_segments", label: "Saved Segments" },
];

export default function AnalyseWorkspacePage() {
  const { id } = useParams();
  const isCreate = !id || id === "new";
  const analysisId = !isCreate && id && /^\d+$/.test(id) ? Number(id) : null;
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState<"save" | "proceed" | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState(defaultAnalysisName);
  const [description, setDescription] = useState("");
  const [isFavourite, setIsFavourite] = useState(false);
  const [countIndividual, setCountIndividual] = useState(false);
  const [uniqueIdentifier, setUniqueIdentifier] = useState<string | null>(null);
  const [audienceSource, setAudienceSource] = useState<AudienceSource>("new");
  const [sourceSegmentId, setSourceSegmentId] = useState<number | null>(null);
  const [conditions, setConditions] = useState<SegmentConditionGroup[]>(() =>
    isCreate ? sampleNewConditions() : [],
  );

  usePageTask({
    task: isCreate ? "Create analysis" : "Analysis",
    subject: name,
    step: "Customer base",
  });

  useEffect(() => {
    if (isCreate) return;
    if (analysisId == null) {
      setLoading(false);
      setLoadError("This analysis address is not valid.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    analysisService
      .get(analysisId)
      .then((record) => {
        if (cancelled) return;
        setName(record.name);
        setDescription(record.description);
        setIsFavourite(record.isFavourite);
        setCountIndividual(record.countIndividualAsRecipient);
        setUniqueIdentifier(record.uniqueIdentifier);
        setAudienceSource(record.audienceSource);
        setSourceSegmentId(record.sourceSegmentId);
        setConditions(record.conditions);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(extractBackendError(error, "The analysis could not be opened."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [analysisId, isCreate]);

  const persist = async (proceed: boolean) => {
    setSaving(proceed ? "proceed" : "save");
    try {
      const saved = await analysisService.save(
        {
          name,
          description,
          isFavourite,
          audienceSource,
          sourceSegmentId,
          conditions,
          countIndividualAsRecipient: countIndividual,
          uniqueIdentifier,
          createdByUserId: user?.user_id,
        },
        analysisId ?? undefined,
      );
      const created = analysisId == null;
      success(
        created
          ? `${saved.name} was created.`
          : `${saved.name} was saved.`,
      );
      navigate(
        created || proceed
          ? "/dashboard/analytics/analyse"
          : `/dashboard/analytics/analyse/${saved.id}`,
        { replace: true },
      );
    } catch (error) {
      showError(extractBackendError(error, "The analysis could not be saved."));
    } finally {
      setSaving(null);
    }
  };

  const audienceReady =
    audienceSource === "new"
      ? conditions.length > 0
      : sourceSegmentId != null;
  const identityReady = !countIndividual || Boolean(uniqueIdentifier);
  const canSave = name.trim().length > 0 && audienceReady && identityReady && saving == null;
  const pageLabel = isCreate ? "Create Analysis" : "Edit Analysis";

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <BackButton
          parentTo="/dashboard/analytics/analyse"
          parentLabel="All Analyses"
          currentLabel={pageLabel}
          showBreadcrumb
        />
        <p className={`text-sm ${tw.textDanger}`}>{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton
        parentTo="/dashboard/analytics/analyse"
        parentLabel="All Analyses"
        currentLabel={pageLabel}
        showBreadcrumb
      />
      <p className={`text-sm ${tw.textSecondary}`}>
        Name the customer base, then choose a new rule, an existing segment, or a saved segment.
      </p>

      <div className={`${panelClass} space-y-4`}>
        <Input
          label="Analysis name"
          value={name}
          onChange={(value) => setName(String(value))}
          placeholder="Analysis name"
          labelBgColor="#ffffff"
        />
        <Textarea
          label="Description"
          value={description}
          onChange={setDescription}
          rows={3}
          placeholder="Describe what this analysis is for"
          labelBgColor="#ffffff"
        />
      </div>

      <div className={`${panelClass} space-y-5`}>
        <AnalysisOptionsFields
          showFavourite
          isFavourite={isFavourite}
          onFavouriteChange={setIsFavourite}
          countIndividualAsRecipient={countIndividual}
          uniqueIdentifier={uniqueIdentifier}
          onCountIndividualChange={setCountIndividual}
          onUniqueIdentifierChange={setUniqueIdentifier}
        />

        <div className="flex gap-2 border-b" style={{ borderColor: "var(--c-border-default)" }}>
          {TABS.map((tab) => {
            const active = audienceSource === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAudienceSource(tab.id)}
                className={`px-4 py-2 text-sm ${
                  active
                    ? `${tw.textPrimary} border-b-2 border-[var(--c-primary-action)] font-semibold`
                    : tw.textSecondary
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {audienceSource === "new" && conditions.length > 0 && (
          <div className="space-y-2">
            <p className={`text-sm font-medium ${tw.textPrimary}`}>Audience rules</p>
            {conditions.map((ruleGroup) => (
              <div key={ruleGroup.id} className={`${tw.rounded} border border-gray-200 bg-gray-50 px-4 py-3`}>
                <p className={`text-xs font-medium ${tw.textSecondary}`}>{ruleGroup.operator}</p>
                <ul className="mt-2 space-y-1">
                  {ruleGroup.conditions.map((rule) => (
                    <li key={rule.id} className={`text-sm ${tw.textPrimary}`}>
                      {rule.field_name || rule.field || "Field"} {rule.operator}{" "}
                      {String(rule.value)}
                      {rule.time_window ? ` · ${rule.time_window.replace(/_/g, " ")}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {audienceSource !== "new" && (
          <AudienceSegmentPicker
            source={audienceSource}
            selectedId={sourceSegmentId}
            onSelect={(segment) => setSourceSegmentId(segment.id)}
          />
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard/analytics/analyse")}
          disabled={saving != null}
          className={`px-6 py-2.5 ${tw.rounded} text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          style={{
            backgroundColor: "transparent",
            color: "var(--c-text-primary)",
            border: "1px solid var(--c-text-primary)",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => persist(true)}
          disabled={!canSave}
          className={`px-6 py-2.5 ${tw.rounded} text-sm font-medium transition-colors flex items-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          style={{ backgroundColor: color.primary.action }}
        >
          {saving === "proceed" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {isCreate ? "Creating..." : "Updating..."}
            </>
          ) : isCreate ? (
            "Create Analyse"
          ) : (
            "Update Analyse"
          )}
        </button>
      </div>
    </div>
  );
}
