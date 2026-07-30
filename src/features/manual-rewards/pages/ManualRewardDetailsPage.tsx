import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Gift,
  User,
  Users,
  XCircle,
} from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { manualRewardService } from "../services/manualRewardService";
import { mapManualRewardFromApi } from "../utils/mapManualRewardFromApi";
import type { ManualReward } from "../types/manualReward";
import { extractBackendError } from "../../../shared/utils/errorHandler";

export default function ManualRewardDetailsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [reward, setReward] = useState<ManualReward | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const parsedId = Number(id);
    if (!Number.isFinite(parsedId)) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError("");
        const row = await manualRewardService.getById(parsedId);
        if (!cancelled) {
          setReward(mapManualRewardFromApi(row));
        }
      } catch (err) {
        if (!cancelled) {
          setReward(null);
          setLoadError(
            extractBackendError(err, "Failed to load manual reward details."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      applied: "bg-green-100 text-green-800 border-green-200",
      scheduled: "bg-blue-100 text-blue-800 border-blue-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      failed: "bg-red-100 text-red-800 border-red-200",
    };

    return statusStyles[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const statusLabel = reward
    ? reward.status.charAt(0).toUpperCase() + reward.status.slice(1)
    : "";

  const handleEdit = () => {
    if (reward && id) {
      navigate(`/dashboard/manual-rewards/${id}/edit`, {
        state: {
          returnTo: {
            pathname: `/dashboard/manual-rewards/${id}`,
          },
        },
      });
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

  if (!reward) {
    return (
      <div className="space-y-6">
        <BackButton
          showBreadcrumb={true}
          currentLabel="Manual Reward Details"
        />

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <BackButton showBreadcrumb={true} currentLabel={reward.name} />
        <button
          onClick={handleEdit}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium ${tw.rounded} border`}
          style={{ borderColor: color.border.default }}
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Gift className="w-6 h-6" style={{ color: color.primary.accent }} />
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            {reward.name}
          </h1>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(reward.status)}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailItem
            icon={Gift}
            label="Reward type"
            value={reward.rewardType}
          />
          <DetailItem icon={Gift} label="Value" value={reward.rewardValue} />
          <DetailItem
            icon={Users}
            label={t.manualRewards.recipients}
            value={String(reward.recipientCount)}
          />
          <DetailItem
            icon={CheckCircle}
            label="Applied"
            value={String(reward.appliedCount)}
          />
          <DetailItem
            icon={XCircle}
            label="Failed"
            value={String(reward.failedCount)}
          />
          <DetailItem
            icon={Calendar}
            label="Created"
            value={<DateFormatter date={reward.createdAt} />}
          />
          {reward.scheduledAt && (
            <DetailItem
              icon={Clock}
              label="Scheduled"
              value={<DateFormatter date={reward.scheduledAt} />}
            />
          )}
          <DetailItem icon={User} label="Created by" value={reward.createdBy} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gift;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 mt-0.5" style={{ color: color.text.muted }} />
      <div>
        <p className={`text-xs font-medium uppercase ${tw.textMuted}`}>
          {label}
        </p>
        <p className={`text-sm font-semibold ${tw.textPrimary}`}>{value}</p>
      </div>
    </div>
  );
}
