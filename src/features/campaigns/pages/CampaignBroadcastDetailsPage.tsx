import { useState } from "react";
import { ArrowLeft, Send, Radio, TrendingUp, CheckCircle, BarChart3 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw } from "../../../shared/utils/utils";

interface CampaignBroadcast {
  id: number;
  campaign_id: number;
  campaign_name: string;
  status: "sent" | "in_progress" | "scheduled" | "failed" | "paused" | "completed";
  sent_at: string;
  channels: string[];
  total_recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  conversions: number;
  failed: number;
  unsubscribed: number;
  created_by: string;
}

export default function CampaignBroadcastDetailsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { broadcastId } = useParams();

  // Mock data - in real app this would come from API
  const [broadcast] = useState<CampaignBroadcast>({
    id: parseInt(broadcastId || "1"),
    campaign_id: 101,
    campaign_name: "Summer Promo Campaign",
    status: "completed",
    sent_at: "2026-03-18T10:30:00Z",
    channels: ["email", "sms"],
    total_recipients: 5000,
    delivered: 4850,
    opened: 2425,
    clicked: 725,
    conversions: 145,
    failed: 150,
    unsubscribed: 10,
    created_by: "John Doe",
  });

  const getStatusColor = (status: CampaignBroadcast["status"]) => {
    const colors: Record<string, string> = {
      sent: "#10B981",
      in_progress: "#3B82F6",
      scheduled: "#F59E0B",
      completed: "#10B981",
      failed: "#EF4444",
      paused: "#6B7280",
    };
    return colors[status] || "#6B7280";
  };

  const getEngagementRate = (opened: number, delivered: number) => {
    if (delivered === 0) return "0%";
    return `${((opened / delivered) * 100).toFixed(1)}%`;
  };

  const deliveryRate = ((broadcast.delivered / broadcast.total_recipients) * 100).toFixed(1);
  const conversionRate = ((broadcast.conversions / broadcast.delivered) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <BackButton fallbackTo="/dashboard/campaign-broadcasts" currentLabel="Broadcast Details" />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Total Recipients</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">
            {broadcast.total_recipients.toLocaleString()}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Send
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Delivered</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">
            {broadcast.delivered.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-600">{deliveryRate}% delivery rate</p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Radio
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Opened</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">
            {broadcast.opened.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            {getEngagementRate(broadcast.opened, broadcast.delivered)} engagement
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Conversions</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">
            {broadcast.conversions.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-600">{conversionRate}% conversion rate</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Breakdown */}
        <div
          className={`${tw.rounded} border bg-white p-6 shadow-sm`}
          style={{ borderColor: color.border.default }}
        >
          <h3 className="text-base font-semibold text-black mb-4">Delivery Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Delivered</span>
              <span className="text-sm font-medium text-black">{broadcast.delivered}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Failed</span>
              <span className="text-sm font-medium text-black">{broadcast.failed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Unsubscribed</span>
              <span className="text-sm font-medium text-black">{broadcast.unsubscribed}</span>
            </div>
          </div>
        </div>

        {/* Engagement Breakdown */}
        <div
          className={`${tw.rounded} border bg-white p-6 shadow-sm`}
          style={{ borderColor: color.border.default }}
        >
          <h3 className="text-base font-semibold text-black mb-4">Engagement Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Opened</span>
              <span className="text-sm font-medium text-black">{broadcast.opened}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Clicked</span>
              <span className="text-sm font-medium text-black">{broadcast.clicked}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conversions</span>
              <span className="text-sm font-medium text-black">{broadcast.conversions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Information */}
      <div
        className={`${tw.rounded} border bg-white p-6 shadow-sm`}
        style={{ borderColor: color.border.default }}
      >
        <h3 className="text-base font-semibold text-black mb-4">Broadcast Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="mt-2 text-sm font-medium text-black">{broadcast.campaign_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Broadcast ID</p>
            <p className="mt-2 text-sm font-medium text-black">{broadcast.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: getStatusColor(broadcast.status) }}
              >
                {broadcast.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Campaign ID</p>
            <p className="mt-2 text-sm font-medium" style={{ color: color.primary.accent }}>
              {broadcast.campaign_id}
            </p>
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      <div
        className={`${tw.rounded} border bg-white p-6 shadow-sm`}
        style={{ borderColor: color.border.default }}
      >
        <h3 className="text-base font-semibold text-black mb-4">Audit Trail</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Created By</span>
            <span className="text-sm font-medium text-black">System Administrator</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Created At</span>
            <span className="text-sm font-medium text-black">
              {new Date(broadcast.sent_at).toLocaleDateString()} at{" "}
              {new Date(broadcast.sent_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Channels Used */}
      <div
        className={`${tw.rounded} border bg-white p-6 shadow-sm`}
        style={{ borderColor: color.border.default }}
      >
        <h3 className="text-base font-semibold text-black mb-4">Channels Used</h3>
        <div className="flex gap-2 flex-wrap">
          {broadcast.channels.map((channel) => (
            <span
              key={channel}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: color.primary.accent, color: "white" }}
            >
              {channel}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
