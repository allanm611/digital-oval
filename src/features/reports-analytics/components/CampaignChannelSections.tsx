import { useMemo, useState } from "react";
import {
  Bell,
  Globe,
  Hash,
  Mail,
  MessageCircle,
  MessageSquare,
} from "lucide-react";
import { tw } from "../../../shared/utils/utils";
import type { CampaignReportsResponse } from "../types/ReportsAPI";
import {
  ensureChannelReachCatalog,
} from "../utils/normalizeCampaignReport";
import {
  channelOutcomeMetrics,
  formatCount,
  formatRate,
  isCoreDeliveryChannel,
} from "../utils/campaignCvmMetrics";

type CampaignChannelSectionsProps = {
  channelReach: CampaignReportsResponse["channelReach"];
  ensureCatalog?: boolean;
};

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  "sms normal": MessageSquare,
  "sms flash": MessageSquare,
  sms: MessageSquare,
  "whatsapp messenger": MessageCircle,
  whatsapp: MessageCircle,
  "push notification": Bell,
  push: Bell,
  ussd: Hash,
  "digital channels": Globe,
};

function iconFor(channel: string) {
  return CHANNEL_ICONS[channel.toLowerCase()] || Globe;
}

export default function CampaignChannelSections({
  channelReach,
  ensureCatalog = false,
}: CampaignChannelSectionsProps) {
  const channels = useMemo(
    () => (ensureCatalog ? ensureChannelReachCatalog(channelReach) : channelReach),
    [channelReach, ensureCatalog],
  );
  const [activeChannel, setActiveChannel] = useState(channels[0]?.channel || "");

  const selected =
    channels.find((row) => row.channel === activeChannel) || channels[0];
  const metrics = channelOutcomeMetrics(selected);
  const deliveryPrimary = selected
    ? isCoreDeliveryChannel(selected.channel)
    : false;

  if (!channels.length) return null;

  return (
    <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Channel Performance
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Separate sent, delivered, unique audience, and conversion metrics for
            each communication channel
          </p>
        </div>
        <p className="text-xs text-gray-500 sm:max-w-xs sm:text-right">
          Delivery rate is a core KPI on every channel. It is most operationally
          meaningful for SMS and Email.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {channels.map((row) => {
          const active = row.channel === (selected?.channel || activeChannel);
          const Icon = iconFor(row.channel);
          return (
            <button
              key={row.channel}
              type="button"
              onClick={() => setActiveChannel(row.channel)}
              className={`${tw.rounded} inline-flex items-center gap-2 border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {row.channel}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChannelMetric
          label="Sent"
          value={formatCount(metrics.sent)}
          hint="Messages dispatched on this channel"
        />
        <ChannelMetric
          label="Delivered"
          value={formatCount(metrics.delivered)}
          hint="Customers who received the message"
        />
        <ChannelMetric
          label="Unique Audience"
          value={formatCount(metrics.uniqueAudience)}
          hint="Unique customers reached on this channel"
        />
        <ChannelMetric
          label="Delivery Rate"
          value={formatRate(metrics.deliveryRate)}
          hint={
            deliveryPrimary
              ? `${formatCount(metrics.delivered)} delivered of ${formatCount(metrics.sent)} sent`
              : `Core KPI across channels · ${formatCount(metrics.delivered)} delivered`
          }
          emphasize
        />
        <ChannelMetric
          label="Converted"
          value={formatCount(metrics.converted)}
          hint="Channel-attributed outcomes"
        />
        <ChannelMetric
          label="Conversion Rate"
          value={formatRate(metrics.conversionRate)}
          hint={`${formatCount(metrics.converted)} converted of ${formatCount(metrics.delivered)} delivered`}
        />
      </div>
    </section>
  );
}

function ChannelMetric({
  label,
  value,
  hint,
  emphasize = false,
}: {
  label: string;
  value: string;
  hint: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`${tw.rounded} border p-4 ${
        emphasize ? "border-[var(--c-primary-accent)] bg-slate-50" : "border-gray-100 bg-gray-50"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}
