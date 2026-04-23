import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, UserX, AlertCircle } from "lucide-react";
import { DNDSubscription, dndService } from "../services/dndService";
import { communicationChannelService, CommunicationChannel } from "../../../shared/services/communicationChannelService";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";

export default function DNDSubscriptionDetailPage() {
  const { id, channel: channelParam } = useParams<{ id: string; channel: string }>();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { t } = useLanguage();

  const [subscription, setSubscription] = useState<DNDSubscription | null>(null);
  const [channel, setChannel] = useState<CommunicationChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [subscriptionResponse, channelsResponse] = await Promise.all([
        dndService.getDNDSubscriptionById(Number(id)),
        communicationChannelService.getAll(),
      ]);

      if (!subscriptionResponse) {
        throw new Error("Subscription not found");
      }

      setSubscription(subscriptionResponse);

      const foundChannel = channelsResponse.find(
        (ch) => ch.code.toUpperCase() === subscriptionResponse.channel
      );
      setChannel(foundChannel || null);
    } catch (err) {
      console.error("Failed to load subscription:", err);
      showError("Failed to load subscription", "Please try again later.");
      setError("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadSubscription();
    }
  }, [id, loadSubscription]);

  const navigateBack = () => {
    navigateBackOrFallback(
      navigate,
      `/dashboard/dnd-management/${channelParam}`
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner
          variant="modern"
          size="xl"
          color="primary"
          className="mb-4"
        />
        <p className={`${tw.textMuted} font-medium text-sm`}>
          Loading subscription details...
        </p>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <User
            className={`w-16 h-16 text-[${color.primary.accent}] mx-auto mb-4`}
          />
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            {error ? "Error Loading Subscription" : "Subscription Not Found"}
          </h3>
          <p className={`${tw.textMuted} mb-6`}>
            {error
              ? "Please try again later."
              : "The subscription you are looking for does not exist."}
          </p>
          <button
            onClick={navigateBack}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 mx-auto text-sm`}
            style={{ backgroundColor: color.primary.action }}
          >
            Back to Subscriptions
          </button>
        </div>
      </div>
    );
  }

  const isRemoved = subscription.status === "removed";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackButton
          fallbackTo={`/dashboard/dnd-management/${channelParam}`}
          onClick={navigateBack}
          showBreadcrumb={true}
          currentLabel="Subscription Details"
        />
      </div>

      {/* Subscription Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Subscription Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Overview */}
          <div
            className={`bg-white ${tw.rounded} border border-gray-200 p-6`}
          >
            <div className="flex items-start space-x-4 mb-6">
              <div
                className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                style={{ backgroundColor: color.primary.accent }}
              >
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className={`${tw.tableFirstColumn} ${tw.textPrimary} mb-2`}>
                  {subscription.customer_name || "Unknown Customer"}
                </h2>
                <p className={`${tw.textSecondary} text-sm`}>
                  {subscription.customer_email || subscription.customer_phone || "No contact info"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  isRemoved
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {isRemoved ? "Removed" : "Active"}
              </span>
              {channel && (
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white`}
                  style={{
                    backgroundColor: color.primary.accent,
                  }}
                >
                  {channel.name}
                </span>
              )}
            </div>
          </div>

          {/* Subscription Details */}
          <div
            className={`bg-white ${tw.rounded} border border-gray-200 p-6`}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Subscription Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Channel
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {subscription.channel}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  DND Type
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {subscription.dnd_type_name || "Unknown"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Status
                </label>
                <p className={`text-sm ${tw.textPrimary} capitalize`}>
                  {subscription.status}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Added By
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {subscription.added_by_name || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Removed By
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {subscription.removed_by_name || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div
            className={`bg-white ${tw.rounded} border border-gray-200 p-6`}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Phone Number
                </label>
                <p className={`text-sm ${tw.textPrimary} font-mono`}>
                  {subscription.customer_phone || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Email Address
                </label>
                <p className={`text-sm ${tw.textPrimary} font-mono`}>
                  {subscription.customer_email || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Customer ID
                </label>
                <p className={`text-sm ${tw.textPrimary} font-mono`}>
                  {subscription.customer_id || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div
            className={`bg-white ${tw.rounded} border border-gray-200 p-6`}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Timeline
            </h3>
            <div className="space-y-5">
              {/* Added */}
              <div className="relative pl-6 border-l-2 border-gray-200">
                <div
                  className="absolute -left-2 top-0 w-4 h-4 rounded-full"
                  style={{ backgroundColor: color.primary.accent }}
                ></div>
                <div className="space-y-1">
                  <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Added
                  </p>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {subscription.added_at ? (
                      <DateFormatter
                        date={subscription.added_at}
                        useLocale
                        year="numeric"
                        month="short"
                        day="numeric"
                        hour="2-digit"
                        minute="2-digit"
                      />
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              </div>

              {/* Removed (if applicable) */}
              {subscription.removed_at && (
                <div className="relative pl-6 border-l-2 border-gray-200">
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-red-400"></div>
                  <div className="space-y-1">
                    <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                      Removed
                    </p>
                    <p className={`text-sm ${tw.textPrimary}`}>
                      <DateFormatter
                        date={subscription.removed_at}
                        useLocale
                        year="numeric"
                        month="short"
                        day="numeric"
                        hour="2-digit"
                        minute="2-digit"
                      />
                    </p>
                  </div>
                </div>
              )}

              {/* Created */}
              {subscription.created_at && (
                <div className="relative pl-6 border-l-2 border-gray-200">
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gray-300"></div>
                  <div className="space-y-1">
                    <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                      Created
                    </p>
                    <p className={`text-sm ${tw.textSecondary}`}>
                      <DateFormatter
                        date={subscription.created_at}
                        useLocale
                        year="numeric"
                        month="short"
                        day="numeric"
                      />
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audit Trail (if removed) */}
          {isRemoved && (
            <div
              className={`bg-white ${tw.rounded} border border-gray-200 p-6`}
            >
              <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
                Removal Audit Trail
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Removed By
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {subscription.removed_by_name || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Removal Date & Time
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {subscription.removed_at ? (
                      <DateFormatter
                        date={subscription.removed_at}
                        useLocale
                        year="numeric"
                        month="short"
                        day="numeric"
                        hour="2-digit"
                        minute="2-digit"
                      />
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
