import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, AlertTriangle, Copy, Edit, Star, Trash2, TrendingUp, Users } from "lucide-react";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ConfirmModal from "../../../shared/components/ui/ConfirmModal";
import { button, color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { usePageTask } from "../../../shared/navigation/PageTaskProvider";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import BackButton from "../../../shared/components/ui/BackButton";
import { analysisService } from "../services/analysisService";
import type { AnalysisInsight, AnalysisRecord } from "../types/analysis";
import { audienceSourceLabel } from "../utils/analysisDefinition";
import CloneAnalysisModal from "../components/CloneAnalysisModal";

const panelClass = `${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`;

function formatMetric(value: number | null, digits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

export default function AnalyseResultsPage() {
  const { id } = useParams();
  const analysisId = id && /^\d+$/.test(id) ? Number(id) : null;
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [insight, setInsight] = useState<AnalysisInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [favouriteBusy, setFavouriteBusy] = useState(false);

  usePageTask({
    task: "Analysis details",
    subject: analysis?.name,
  });

  useEffect(() => {
    if (analysisId == null) {
      setLoading(false);
      setError("This analysis address is not valid.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    analysisService
      .get(analysisId)
      .then(async (record) => {
        if (cancelled) return;
        setAnalysis(record);
        const next = await analysisService.loadInsight(record);
        if (!cancelled) setInsight(next);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(extractBackendError(loadError, "The analysis could not be run."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="space-y-4">
        <BackButton
          parentTo="/dashboard/analytics/analyse"
          parentLabel="All Analyses"
          currentLabel="Analysis Details"
          showBreadcrumb
        />
        <p className={`text-sm ${tw.textDanger}`}>
          {error || "The analysis could not be run."}
        </p>
      </div>
    );
  }

  const toggleFavourite = async () => {
    if (!analysis) return;
    setFavouriteBusy(true);
    try {
      await analysisService.setFavourite(analysis.id, !analysis.isFavourite);
      setAnalysis({ ...analysis, isFavourite: !analysis.isFavourite });
    } catch (loadError) {
      showError(extractBackendError(loadError, "The favourite could not be updated."));
    } finally {
      setFavouriteBusy(false);
    }
  };

  const confirmClone = async (input: {
    name: string;
    description: string;
    isFavourite: boolean;
    countIndividualAsRecipient: boolean;
    uniqueIdentifier: string | null;
  }) => {
    if (!analysis) return;
    setCloning(true);
    try {
      const created = await analysisService.clone(analysis.id, {
        ...input,
        createdByUserId: user?.user_id,
      });
      success(`${created.name} was created.`);
      setCloneOpen(false);
      navigate("/dashboard/analytics/analyse");
    } catch (loadError) {
      showError(extractBackendError(loadError, "The analysis could not be cloned."));
    } finally {
      setCloning(false);
    }
  };

  const confirmDelete = async () => {
    if (!analysis) return;
    setDeleting(true);
    try {
      await analysisService.remove(analysis.id);
      success(`${analysis.name} was deleted.`);
      navigate("/dashboard/analytics/analyse");
    } catch (loadError) {
      showError(extractBackendError(loadError, "The analysis could not be deleted."));
    } finally {
      setDeleting(false);
    }
  };

  const sampleColumns = Object.keys(insight?.sample[0] || {}).slice(0, 6);
  const cards = [
    { label: "Members", value: formatMetric(insight?.memberCount ?? null), icon: Users },
    { label: "Growth rate", value: formatMetric(insight?.growthRate ?? null, 2), icon: TrendingUp },
    {
      label: "Engagement",
      value: formatMetric(insight?.engagementScore ?? null, 2),
      icon: Activity,
    },
    { label: "Churn rate", value: formatMetric(insight?.churnRate ?? null, 2), icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <BackButton
          parentTo="/dashboard/analytics/analyse"
          parentLabel="All Analyses"
          currentLabel="Analysis Details"
          showBreadcrumb
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/analytics/analyse/${analysis.id}`)}
            className={`flex items-center gap-2 ${tw.button} text-sm`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            disabled={favouriteBusy}
            onClick={toggleFavourite}
            className={`flex items-center gap-2 ${tw.rounded} text-sm font-medium disabled:opacity-50`}
            style={{
              backgroundColor: "transparent",
              color: "var(--c-text-primary)",
              border: "1px solid var(--c-text-primary)",
              padding: `${button.secondaryAction.paddingY} ${button.secondaryAction.paddingX}`,
            }}
          >
            <Star className={`h-4 w-4 ${analysis.isFavourite ? "fill-current text-amber-500" : ""}`} />
            Favourite
          </button>
          <button
            type="button"
            onClick={() => setCloneOpen(true)}
            className={`flex items-center gap-2 ${tw.rounded} text-sm font-medium`}
            style={{
              backgroundColor: color.primary.action,
              color: "#ffffff",
              border: "1px solid #000000",
              padding: `${button.action.paddingY} ${button.action.paddingX}`,
            }}
          >
            <Copy className="h-4 w-4" />
            Clone
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className={`flex items-center gap-2 ${tw.rounded} text-sm font-semibold`}
            style={{
              backgroundColor: button.delete.background,
              color: button.delete.color,
              border: button.delete.border,
              padding: `${button.delete.paddingY} ${button.delete.paddingX}`,
              borderRadius: button.delete.borderRadius,
              fontSize: button.delete.fontSize,
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <section className={panelClass}>
        <h2 className={`text-base font-medium ${tw.textPrimary}`}>Analysis information</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-gray-600">Name</dt>
            <dd className={`mt-1 text-sm ${tw.textPrimary}`}>{analysis.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">Customer base</dt>
            <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
              {audienceSourceLabel(analysis.audienceSource)}
              {analysis.countIndividualAsRecipient ? " · one person, one count" : ""}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">Description</dt>
            <dd className={`mt-1 text-sm ${tw.textPrimary}`}>
              {analysis.description || "No description"}
            </dd>
          </div>
        </dl>
      </section>

      {insight?.warnings.length ? (
        <div className={`${panelClass} space-y-1`}>
          {insight.warnings.map((warning) => (
            <p key={warning} className={`text-sm ${tw.textSecondary}`}>
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" style={{ color: color.primary.accent }} />
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={panelClass}>
          <h2 className={`text-base font-medium ${tw.textPrimary}`}>Growth</h2>
          {insight && insight.growth.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={tw.textSecondary}>
                    <th className="py-2 font-medium">Date</th>
                    <th className="py-2 font-medium">Members</th>
                    <th className="py-2 font-medium">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {insight.growth.map((point) => (
                    <tr key={point.date} className="border-t" style={{ borderColor: "var(--c-border-default)" }}>
                      <td className={`py-2 ${tw.textPrimary}`}>{point.date}</td>
                      <td className={`py-2 ${tw.textPrimary}`}>
                        {point.memberCount.toLocaleString()}
                      </td>
                      <td className={`py-2 ${tw.textPrimary}`}>
                        {point.growthRate.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={`mt-3 text-sm ${tw.textSecondary}`}>
              No growth series was returned for this customer base.
            </p>
          )}
        </section>

        <section className={panelClass}>
          <h2 className={`text-base font-medium ${tw.textPrimary}`}>
            Used in campaigns
          </h2>
          {insight && insight.campaigns.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {insight.campaigns.map((campaign) => (
                <li key={campaign.id} className="flex items-center justify-between gap-3">
                  <span className={`text-sm ${tw.textPrimary}`}>{campaign.name}</span>
                  <span className={`text-xs ${tw.textSecondary}`}>
                    {campaign.usageCount.toLocaleString()} uses
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`mt-3 text-sm ${tw.textSecondary}`}>
              This customer base is not attached to a campaign yet.
            </p>
          )}
        </section>
      </div>

      <section className={panelClass}>
        <h2 className={`text-base font-medium ${tw.textPrimary}`}>Sample</h2>
        {insight && sampleColumns.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={tw.textSecondary}>
                  {sampleColumns.map((column) => (
                    <th key={column} className="py-2 pr-4 font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {insight.sample.slice(0, 25).map((row, index) => (
                  <tr
                    key={index}
                    className="border-t"
                    style={{ borderColor: "var(--c-border-default)" }}
                  >
                    {sampleColumns.map((column) => (
                      <td key={column} className={`py-2 pr-4 ${tw.textPrimary}`}>
                        {formatCell(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`mt-3 text-sm ${tw.textSecondary}`}>
            The preview did not return sample rows. Member totals above still
            come from the segment services that responded.
          </p>
        )}
      </section>

      <CloneAnalysisModal
        analysis={cloneOpen ? analysis : null}
        isSaving={cloning}
        onClose={() => {
          if (!cloning) setCloneOpen(false);
        }}
        onConfirm={confirmClone}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}
        onConfirm={confirmDelete}
        title="Delete analysis"
        message={`Delete ${analysis.name}? The customer segments it points at stay in Segment Management.`}
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleting}
      />
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
