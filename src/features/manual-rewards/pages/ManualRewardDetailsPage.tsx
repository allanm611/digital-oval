import type { ReactNode } from "react";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { LucideIcon } from "lucide-react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useLanguage } from "../../../contexts/LanguageContext";

import {

  AlertCircle,

  CheckCircle,

  Edit,

  ExternalLink,

  Gift,

  Play,

  Trash2,

  Users,

  XCircle,

  Loader2,

} from "lucide-react";

import BackButton from "../../../shared/components/ui/BackButton";

import DateFormatter from "../../../shared/components/DateFormatter";

import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";

import { color, tw, button } from "../../../shared/utils/utils";

import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";

import { useToast } from "../../../contexts/ToastContext";

import { rewardConfigurationService } from "../../configurations/services/rewardConfigurationService";

import { manualRewardService } from "../services/manualRewardService";

import { mapManualRewardFromApi } from "../utils/mapManualRewardFromApi";

import { canApplyManualReward } from "../utils/canApplyManualReward";
import { canEditManualReward } from "../utils/canEditManualReward";

import { formatManualRewardDisplayValue } from "../utils/formatManualRewardDisplayValue";

import {

  formatManualRewardApplyMode,

  formatManualRewardAudienceType,

} from "../utils/formatManualRewardLabels";

import { resolveUserDisplayName } from "../utils/resolveUserDisplayName";

import type { ManualReward } from "../types/manualReward";

import type { ManualRewardResource } from "../types/manualRewardApi";

import { extractBackendError } from "../../../shared/utils/errorHandler";



export default function ManualRewardDetailsPage() {

  const { t } = useLanguage();

  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();

  const { success: showToast, error: showError } = useToast();

  const [reward, setReward] = useState<ManualReward | null>(null);

  const [resource, setResource] = useState<ManualRewardResource | null>(null);

  const [createdByLabel, setCreatedByLabel] = useState("Not recorded");

  const [updatedByLabel, setUpdatedByLabel] = useState("Not recorded");

  const [configurationLabel, setConfigurationLabel] = useState<string | null>(

    null,

  );

  const [configurationProviderId, setConfigurationProviderId] = useState<

    number | null

  >(null);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [isApplying, setIsApplying] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);



  const loadReward = useCallback(async () => {

    if (!id) return;

    const parsedId = Number(id);

    if (!Number.isFinite(parsedId)) return;



    try {

      setLoading(true);

      setLoadError("");

      const row = await manualRewardService.getById(parsedId);

      setResource(row);

      setReward(mapManualRewardFromApi(row));



      const [createdLabel, updatedLabel] = await Promise.all([

        resolveUserDisplayName(row.created_by),

        resolveUserDisplayName(row.updated_by),

      ]);

      setCreatedByLabel(createdLabel);

      setUpdatedByLabel(updatedLabel);



      const configId =

        (row.preview_data?.reward_configuration_id as number | undefined) ??

        undefined;

      const numericConfigId =

        typeof configId === "number"

          ? configId

          : Number(configId);



      if (Number.isFinite(numericConfigId)) {

        try {

          const cfg = await rewardConfigurationService.getById(numericConfigId);

          setConfigurationLabel(`#${cfg.id} · ${cfg.name}`);

          setConfigurationProviderId(cfg.provider_id ?? null);

        } catch {

          const fallbackName = row.bundle_track?.trim();

          setConfigurationLabel(

            fallbackName

              ? `#${numericConfigId} · ${fallbackName}`

              : `#${numericConfigId}`,

          );

          setConfigurationProviderId(null);

        }

      } else if (row.bundle_track) {

        setConfigurationLabel(row.bundle_track);

        setConfigurationProviderId(null);

      } else {

        setConfigurationLabel(null);

        setConfigurationProviderId(null);

      }

    } catch (err) {

      setReward(null);

      setResource(null);

      setLoadError(

        extractBackendError(err, "Failed to load manual reward details."),

      );

    } finally {

      setLoading(false);

    }

  }, [id]);



  useEffect(() => {

    loadReward();

  }, [loadReward]);



  const statusLabel = reward

    ? reward.status.charAt(0).toUpperCase() + reward.status.slice(1)

    : "";



  const rewardValueLabel = useMemo(

    () =>

      formatManualRewardDisplayValue(reward?.rewardType, reward?.rewardValue),

    [reward?.rewardType, reward?.rewardValue],

  );



  const applyModeLabel = useMemo(

    () => formatManualRewardApplyMode(resource?.apply_type ?? reward?.applyType),

    [resource?.apply_type, reward?.applyType],

  );



  const audienceLabel = useMemo(

    () => formatManualRewardAudienceType(resource?.audience_type ?? reward?.audienceType),

    [resource?.audience_type, reward?.audienceType],

  );



  const scheduledLabel = useMemo(() => {

    if (reward?.scheduledAt) {

      return <DateFormatter date={reward.scheduledAt} useUserTimezone />;

    }

    if (reward?.applyType === "later") {

      return "Scheduled (date not set)";

    }

    return "Not scheduled";

  }, [reward?.scheduledAt, reward?.applyType]);



  const getStatusBadgeClass = (status: string) => {

    const styles: Record<string, string> = {

      applied: "bg-green-100 text-green-800 border-green-200",

      scheduled: "bg-blue-100 text-blue-800 border-blue-200",

      pending: "bg-amber-100 text-amber-900 border-amber-200",

      failed: "bg-red-100 text-red-800 border-red-200",

    };

    return styles[status] || "bg-gray-100 text-gray-800 border-gray-200";

  };



  const handleEdit = () => {

    if (reward && id && canEditManualReward(reward.status)) {

      navigate(`/dashboard/manual-rewards/${id}/edit`, {

        state: {

          returnTo: { pathname: `/dashboard/manual-rewards/${id}` },

        },

      });

    }

  };



  const handleApply = async () => {

    if (!reward || !canApplyManualReward(reward.status)) return;

    setIsApplying(true);

    try {

      const result = await manualRewardService.apply(reward.id);

      showToast(

        result.message ||

          `Applied ${result.data?.applied ?? 0}, failed ${result.data?.failed ?? 0}.`,

      );

      await loadReward();

    } catch (err) {

      showError(

        "Apply failed",

        extractBackendError(err, "Could not apply this manual reward."),

      );

    } finally {

      setIsApplying(false);

    }

  };



  const handleDelete = async () => {

    if (!reward) return;

    setIsDeleting(true);

    try {

      await manualRewardService.delete(reward.id);

      showToast("Manual reward deleted");

      navigate("/dashboard/manual-rewards");

    } catch (err) {

      showError(

        "Delete failed",

        extractBackendError(err, "Could not delete this manual reward."),

      );

    } finally {

      setIsDeleting(false);

      setShowDeleteModal(false);

    }

  };



  if (loading) {

    return (

      <div className="flex flex-col items-center justify-center py-16">

        <LoadingSpinner variant="modern" size="xl" color="primary" />

        <p className={`${tw.textMuted} font-medium text-sm mt-4`}>

          Loading reward details...

        </p>

      </div>

    );

  }



  if (!reward || !resource) {

    return (

      <div className="space-y-6">

        <BackButton showBreadcrumb={true} currentLabel="Manual Reward Details" />

        <div className={`bg-white ${tw.rounded} border border-gray-200 p-8`}>

          <div className="text-center py-8">

            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />

            <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>

              Manual reward not found

            </h2>

            <p className={`text-sm ${tw.textMuted} mb-6`}>

              {loadError ||

                "We could not find a manual reward matching this ID."}

            </p>

            <button

              type="button"

              onClick={() => navigate("/dashboard/manual-rewards")}

              className={`px-4 py-2 ${tw.rounded} text-sm font-semibold text-white`}

              style={{ backgroundColor: color.primary.action }}

            >

              Back to Manual Rewards

            </button>

          </div>

        </div>

      </div>

    );

  }



  const configId = reward.rewardConfigurationId;

  const statCards = [

    {

      label: t.manualRewards.recipients,

      value: reward.recipientCount.toLocaleString(),

      icon: Users,

      accent: color.tertiary.tag4,

    },

    {

      label: "Applied",

      value: reward.appliedCount.toLocaleString(),

      icon: CheckCircle,

      accent: color.tertiary.tag4,

    },

    {

      label: "Failed",

      value: reward.failedCount.toLocaleString(),

      icon: XCircle,

      accent: color.tertiary.tag3,

    },

    {

      label: "Reward Value",

      value: rewardValueLabel,

      icon: Gift,

      accent: color.tertiary.tag1,

    },

  ];



  return (

    <div className="space-y-6">

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

        <div className="space-y-3 min-w-0 flex-1">

          <BackButton showBreadcrumb={true} currentLabel={reward.name} />

          <div>

            <h1 className={`text-2xl sm:text-3xl font-bold ${tw.textPrimary}`}>

              {reward.name}

            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-2">

              <p className={`text-sm ${tw.textMuted}`}>

                Reward ID:{" "}

                <span className={`font-medium ${tw.textPrimary}`}>

                  {reward.id}

                </span>

              </p>

              <span

                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClass(reward.status)}`}

              >

                {statusLabel}

              </span>

            </div>

            {reward.description && (

              <p className={`text-sm ${tw.textSecondary} mt-3 max-w-3xl`}>

                {reward.description}

              </p>

            )}

          </div>

        </div>



        <div className="flex flex-wrap items-center gap-2 shrink-0">

          {canApplyManualReward(reward.status) && (

            <button

              type="button"

              onClick={handleApply}

              disabled={isApplying}

              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md"

              style={{ backgroundColor: color.primary.action }}

            >

              {isApplying ? (

                <Loader2 className="w-4 h-4 animate-spin" />

              ) : (

                <Play className="w-4 h-4" />

              )}

              Apply now

            </button>

          )}

          {canEditManualReward(reward.status) && (

            <button

              type="button"

              onClick={handleEdit}

              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md"

              style={{ backgroundColor: color.primary.action }}

            >

              <Edit className="w-4 h-4" />

              Edit

            </button>

          )}

          <button

            type="button"

            onClick={() => setShowDeleteModal(true)}

            className={`${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-xs w-fit`}

            style={{

              backgroundColor: button.delete.background,

              color: button.delete.color,

              border: button.delete.border,

              padding: `${button.delete.paddingY} ${button.delete.paddingX}`,

              borderRadius: button.delete.borderRadius,

              fontSize: button.delete.fontSize,

            }}

          >

            <Trash2 className="w-4 h-4" />

            Delete

          </button>

        </div>

      </div>



      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {statCards.map((card) => (

          <SummaryMetricCard

            key={card.label}

            label={card.label}

            value={card.value}

            icon={card.icon}

            accent={card.accent}

          />

        ))}

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>

            <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>

              Reward Information

            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">

              <InfoRow label="Reward Type" value={reward.rewardType} />

              <InfoRow label="Created By" value={createdByLabel} />

              <InfoRow

                label="Created At"

                value={

                  <DateFormatter date={reward.createdAt} useUserTimezone />

                }

              />

              <InfoRow label="Scheduled At" value={scheduledLabel} />

            </div>

          </div>



          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>

            <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>

              Delivery details

            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">

              <InfoRow

                label="Reward configuration"

                value={

                  configurationLabel && configId ? (

                    <Link

                      to={`/dashboard/reward-configurations/${configId}/details`}

                      className="inline-flex items-center gap-1.5 text-[var(--c-primary-accent)] hover:underline font-semibold"

                    >

                      {configurationLabel}

                      <ExternalLink className="w-3.5 h-3.5" />

                    </Link>

                  ) : (

                    configurationLabel || "—"

                  )

                }

              />

              {configurationProviderId != null && (

                <InfoRow

                  label="Reward provider"

                  value={

                    <Link

                      to={`/dashboard/reward-providers/${configurationProviderId}/details`}

                      className="inline-flex items-center gap-1.5 text-[var(--c-primary-accent)] hover:underline font-semibold"

                    >

                      Provider #{configurationProviderId}

                      <ExternalLink className="w-3.5 h-3.5" />

                    </Link>

                  }

                />

              )}

              <InfoRow label="Audience source" value={audienceLabel} />

              {reward.quicklistId != null && (

                <InfoRow

                  label="Quicklist"

                  value={

                    <Link

                      to={`/dashboard/quick-lists/${reward.quicklistId}`}

                      className="inline-flex items-center gap-1.5 text-[var(--c-primary-accent)] hover:underline font-semibold"

                    >

                      Quicklist #{reward.quicklistId}

                      <ExternalLink className="w-3.5 h-3.5" />

                    </Link>

                  }

                />

              )}

              <InfoRow label="Apply mode" value={applyModeLabel} />

              <InfoRow

                label="Last updated"

                value={

                  <DateFormatter

                    date={reward.updatedAt || reward.createdAt}

                    useUserTimezone

                    includeTime

                  />

                }

              />

            </div>

          </div>

        </div>



        <div className="space-y-6">

          <div

            className={`${tw.rounded} p-6 border border-gray-200`}

            style={{ backgroundColor: "var(--c-surface-cards)" }}

          >

            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>

              Timeline

            </h3>

            <div className="space-y-5">

              <TimelineEntry label="Created" date={reward.createdAt} />

              <TimelineEntry

                label="Last updated"

                date={reward.updatedAt || reward.createdAt}

                accent

              />

              {reward.scheduledAt && (

                <TimelineEntry label="Scheduled run" date={reward.scheduledAt} />

              )}

            </div>

          </div>



          <div

            className={`${tw.rounded} p-6 border border-gray-200`}

            style={{ backgroundColor: "var(--c-surface-cards)" }}

          >

            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>

              Audit trail

            </h3>

            <div className="grid grid-cols-1 gap-6">

              <InfoRow label="Created by" value={createdByLabel} />

              <InfoRow label="Updated by" value={updatedByLabel} />

            </div>

            {createdByLabel === "Not recorded" && (

              <p className={`text-xs ${tw.textMuted} mt-4`}>

                The backend should set{" "}

                <code className="font-mono">created_by</code> on create/apply

                so grants are attributable to an admin user.

              </p>

            )}

          </div>

        </div>

      </div>



      <DeleteConfirmModal

        isOpen={showDeleteModal}

        onClose={() => setShowDeleteModal(false)}

        onConfirm={handleDelete}

        title="Delete manual reward"

        description="This soft-deletes the reward record. Grants already sent to subscribers are not reversed."

        itemName={reward.name}

        isLoading={isDeleting}

      />

    </div>

  );

}



function SummaryMetricCard({

  label,

  value,

  icon: Icon,

  accent,

}: {

  label: string;

  value: string;

  icon: LucideIcon;

  accent: string;

}) {

  return (

    <div

      className={`${tw.rounded} border border-gray-200 bg-white p-5 shadow-sm`}

    >

      <div className="flex items-center gap-2 mb-3">

        <Icon className="h-5 w-5" style={{ color: color.primary.accent }} />

        <p className={`text-sm font-medium ${tw.textSecondary}`}>{label}</p>

      </div>

      <p

        className="text-2xl sm:text-3xl font-bold tracking-tight"

        style={{ color: accent }}

      >

        {value}

      </p>

    </div>

  );

}



function InfoRow({ label, value }: { label: string; value: ReactNode }) {

  return (

    <div className="space-y-1">

      <p className={`text-sm font-medium ${tw.textMuted}`}>{label}</p>

      <div className={`text-base font-semibold ${tw.textPrimary}`}>{value}</div>

    </div>

  );

}



function TimelineEntry({

  label,

  date,

  accent,

}: {

  label: string;

  date: string;

  accent?: boolean;

}) {

  return (

    <div

      className="relative pl-6"

      style={{ borderLeft: "2px solid var(--c-border-default)" }}

    >

      <div

        className="absolute -left-2 top-0 w-4 h-4 rounded-full"

        style={{

          backgroundColor: accent

            ? color.primary.accent

            : "var(--c-text-muted)",

        }}

      />

      <div className="space-y-1">

        <p

          className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}

        >

          {label}

        </p>

        <p className={`text-sm ${tw.textPrimary} font-semibold`}>

          <DateFormatter date={date} useLocale year="numeric" month="short" day="numeric" />

        </p>

        <p className={`text-xs ${tw.textMuted}`}>

          <DateFormatter date={date} useUserTimezone includeTime />

        </p>

      </div>

    </div>

  );

}


