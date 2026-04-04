import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { dummyManualRewards } from "../data/dummyManualRewards";

export default function ManualRewardDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const reward = useMemo(() => {
    if (!id) return undefined;
    const parsedId = Number(id);
    if (!Number.isFinite(parsedId)) return undefined;
    return dummyManualRewards.find((entry) => entry.id === parsedId);
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

  if (!reward) {
    return (
      <div className="space-y-6">
        <BackButton
          fallbackTo="/dashboard/manual-broadcasts"
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
              We could not find a manual reward matching this ID in the dummy
              dataset.
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
        <BackButton
          fallbackTo="/dashboard/manual-broadcasts"
          showBreadcrumb={true}
          currentLabel="Manual Reward Details"
        />
        <button
          onClick={handleEdit}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors`}
          style={{ backgroundColor: color.primary.action }}
          title="Edit reward"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            {reward.name}
          </h1>
          <p className={`text-sm ${tw.textMuted} mt-1`}>
            Reward ID: {reward.id}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span
            className={`inline-flex w-fit items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(reward.status)}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center gap-2">
            <Users
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Recipients</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {reward.recipientCount.toLocaleString()}
          </p>
        </div>

        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center gap-2">
            <CheckCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Applied</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {reward.appliedCount.toLocaleString()}
          </p>
        </div>

        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center gap-2">
            <XCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Failed</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {reward.failedCount.toLocaleString()}
          </p>
        </div>

        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">Reward Value</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {reward.rewardValue}
          </p>
        </div>
      </div>

      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
          Reward Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className={`text-xs uppercase tracking-wide ${tw.textMuted}`}>
              Reward Type
            </p>
            <p className={`mt-1 text-sm font-medium ${tw.textPrimary}`}>
              {reward.rewardType}
            </p>
          </div>

          <div>
            <p className={`text-xs uppercase tracking-wide ${tw.textMuted}`}>
              Created By
            </p>
            <div className="mt-1 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <p className={`text-sm font-medium ${tw.textPrimary}`}>
                {reward.createdBy}
              </p>
            </div>
          </div>

          <div>
            <p className={`text-xs uppercase tracking-wide ${tw.textMuted}`}>
              Created At
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <p className={`text-sm font-medium ${tw.textPrimary}`}>
                <DateFormatter date={reward.createdAt} />
              </p>
            </div>
          </div>

          <div>
            <p className={`text-xs uppercase tracking-wide ${tw.textMuted}`}>
              Scheduled At
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <p className={`text-sm font-medium ${tw.textPrimary}`}>
                {reward.scheduledAt ? (
                  <DateFormatter date={reward.scheduledAt} />
                ) : (
                  "Not scheduled"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
