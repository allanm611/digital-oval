import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Award, Ban } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ConfirmModal from "../../../shared/components/ui/ConfirmModal";
import DateFormatter from "../../../shared/components/DateFormatter";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { usePageTask } from "../../../shared/navigation/PageTaskProvider";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { loyaltyProgramService } from "../services/loyaltyProgramService";
import type { LoyaltyProgram } from "../types/loyaltyProgram";
import {
  formatCondition,
  formatSourceType,
  formatTierRange,
  formatValidity,
} from "../utils/loyaltyProgramMapper";

export default function LoyaltyProgramDetailsPage() {
  const { id } = useParams();
  const programId = Number(id);
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  usePageTask({
    task: "Loyalty Program",
    subject: program?.name,
    status: program?.status,
  });

  useEffect(() => {
    if (!Number.isInteger(programId) || programId <= 0) {
      setLoading(false);
      setLoadError("This loyalty program was not found.");
      return;
    }
    let ignore = false;
    setLoading(true);
    loyaltyProgramService
      .getById(programId)
      .then((next) => {
        if (!ignore) {
          setProgram(next);
          setLoadError(null);
        }
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
  }, [programId]);

  const confirmCancel = async () => {
    if (!program) return;
    setCancelling(true);
    try {
      const updated = await loyaltyProgramService.cancel(program.id, user?.user_id);
      setProgram(updated);
      setConfirmingCancel(false);
      success(`${program.name} was cancelled.`);
    } catch (error) {
      showError(extractBackendError(error, "Could not cancel the program."));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (loadError || !program) {
    return (
      <div className="space-y-4">
        <BackButton
          parentTo="/dashboard/loyalty-programs"
          parentLabel="Loyalty Programs"
          currentLabel="Program Details"
        />
        <p className="text-sm text-gray-700">
          {loadError || "This loyalty program was not found."}
        </p>
      </div>
    );
  }

  const automated = program.tierEvaluationMode === "automated";
  const cancelled = program.status === "cancelled";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <BackButton
          parentTo="/dashboard/loyalty-programs"
          parentLabel="Loyalty Programs"
          currentLabel="Program Details"
        />
        {!cancelled && (
          <div className="flex flex-wrap items-center gap-2">
            <FeatureActionButton
              featureId="loyalty-programs"
              action="edit"
              itemId={program.id}
              variant="primary"
              label="Edit program"
            />
            <button
              type="button"
              className={`${tw.rounded} inline-flex items-center gap-2 border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50`}
              onClick={() => setConfirmingCancel(true)}
            >
              <Ban className="h-4 w-4" />
              Cancel program
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className={cardClass} style={cardStyle}>
            <div className="mb-3 flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center ${tw.rounded}`}
                style={{ backgroundColor: color.primary.accent }}
              >
                <Award className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={`${tw.tableFirstColumn} ${tw.textPrimary} mb-2 text-base`}>
                  {program.name}
                </h1>
                <p className={`${tw.textSecondary} text-sm leading-relaxed`}>
                  {program.description || "No description"}
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-2">
              <Detail label="Status" value={statusLabel(program.status)} />
              <Detail label="Program ID" value={String(program.id)} />
              <Detail label="Members" value={program.memberCount.toLocaleString()} />
              <Detail
                label="Tier evaluation"
                value={automated ? "Automated" : "Manual"}
              />
              <Detail
                label="Start date"
                value={program.startDate ? <DateFormatter date={program.startDate} /> : "—"}
              />
              <Detail
                label="End date"
                value={program.endDate ? <DateFormatter date={program.endDate} /> : "—"}
              />
              <Detail
                label="Bonus points"
                value={formatValidity(
                  program.bonusPointsValidity,
                  program.bonusPointsValidityDays,
                )}
              />
              <Detail
                label="Segmentation points"
                value={formatValidity(
                  program.segmentationPointsValidity,
                  program.segmentationPointsValidityDays,
                )}
              />
            </dl>
          </section>

          <section className={cardClass} style={cardStyle}>
            <h2 className={`mb-2 text-lg font-semibold ${tw.textPrimary}`}>
              Segmentation tiers
            </h2>
            <p className={`text-sm ${tw.textSecondary}`}>
              {automated
                ? "System places each member in the tier whose range contains that member's segmentation points."
                : "Map a customer to one of the tier names below through the subscriber tier API. Sentra does not calculate the tier in manual mode."}
            </p>
            {program.tiers.length === 0 ? (
              <p className={`mt-4 text-sm ${tw.textSecondary}`}>No tiers configured.</p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100">
                {program.tiers.map((tier) => (
                  <li
                    key={tier.name}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className={`font-medium ${tw.textPrimary}`}>{tier.name}</span>
                    <span className={tw.textSecondary}>
                      {formatTierRange(tier, automated)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={cardClass} style={cardStyle}>
            <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
              Custom attributes
            </h2>
            <p className={`mt-1 text-sm ${tw.textSecondary}`}>
              These formulas belong to this program and are not reusable KPIs.
            </p>
            {program.customAttributes.length === 0 ? (
              <p className={`mt-4 text-sm ${tw.textSecondary}`}>
                No custom attributes configured.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {program.customAttributes.map((attribute) => (
                  <article
                    key={attribute.name}
                    className="rounded-md border border-gray-200 p-4"
                  >
                    <h3 className={`text-sm font-semibold ${tw.textPrimary}`}>
                      {attribute.name}
                    </h3>
                    <p className={`mt-2 font-mono text-sm ${tw.textPrimary}`}>
                      {attribute.formula}
                    </p>
                    <ul className={`mt-3 space-y-1 text-sm ${tw.textSecondary}`}>
                      {attribute.operands.map((operand) => (
                        <li key={operand.key}>
                          {operand.key}: {formatSourceType(operand.sourceType)}
                          {operand.fieldName ? ` · ${operand.fieldName}` : ""}
                        </li>
                      ))}
                    </ul>
                    <p className={`mt-3 text-sm ${tw.textPrimary}`}>
                      Condition: {formatCondition(attribute.condition)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className={cardClass} style={cardStyle}>
            <h2 className={`mb-6 text-lg font-semibold ${tw.textPrimary}`}>
              Timeline
            </h2>
            {program.createdAt || program.updatedAt ? (
              <div className="space-y-5">
                {program.createdAt && (
                  <TimelineEntry
                    label="Created"
                    date={program.createdAt}
                    markerColor="var(--c-text-muted)"
                  />
                )}
                {program.updatedAt && (
                  <TimelineEntry
                    label="Last updated"
                    date={program.updatedAt}
                    markerColor={color.primary.accent}
                  />
                )}
              </div>
            ) : (
              <p className={`text-sm ${tw.textSecondary}`}>
                Created and updated times are not recorded for this program yet.
              </p>
            )}
          </section>

          <section className={cardClass} style={cardStyle}>
            <h2 className={`mb-6 text-lg font-semibold ${tw.textPrimary}`}>
              Audit trail
            </h2>
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Detail label="Created by" value={program.createdBy} />
              <Detail label="Updated by" value={program.updatedBy} />
            </dl>
          </section>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmingCancel}
        onClose={() => {
          if (!cancelling) setConfirmingCancel(false);
        }}
        onConfirm={confirmCancel}
        title="Cancel loyalty program"
        message={`Cancel ${program.name}? The program stops accepting registrations and new bonus points. Existing balances keep the expiry already configured.`}
        type="warning"
        confirmText="Cancel program"
        cancelText="Keep program"
        isLoading={cancelling}
      />
    </div>
  );
}

const cardClass = `${tw.rounded} p-6`;
const cardStyle = { backgroundColor: "var(--c-surface-cards)" };

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className={`text-xs font-medium uppercase tracking-wide ${tw.textMuted}`}>
        {label}
      </dt>
      <dd className={`text-sm ${tw.textPrimary}`}>{value}</dd>
    </div>
  );
}

function TimelineEntry({
  label,
  date,
  markerColor,
}: {
  label: string;
  date: string;
  markerColor: string;
}) {
  return (
    <div
      className="relative pl-6"
      style={{ borderLeft: "2px solid var(--c-border-default)" }}
    >
      <div
        className="absolute -left-2 top-0 h-4 w-4 rounded-full"
        style={{ backgroundColor: markerColor }}
      />
      <div className="space-y-1">
        <p className={`text-xs font-medium uppercase tracking-wide ${tw.textMuted}`}>
          {label}
        </p>
        <p className={`text-sm font-semibold ${tw.textPrimary}`}>
          <DateFormatter
            date={date}
            useLocale
            year="numeric"
            month="short"
            day="numeric"
          />
        </p>
        <p className={`text-xs ${tw.textMuted}`}>
          <DateFormatter date={date} includeTime />
        </p>
      </div>
    </div>
  );
}
