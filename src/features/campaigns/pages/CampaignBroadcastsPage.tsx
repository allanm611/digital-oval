import { useState, useCallback } from "react";
import { Eye, Search, Filter, BarChart3, Send, Radio, TrendingUp, CheckCircle, RotateCcw, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw, button } from "../../../shared/utils/utils";

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

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "sent", label: "Sent" },
  { value: "in_progress", label: "In Progress" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "paused", label: "Paused" },
];

export default function CampaignBroadcastsPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading] = useState(false);
  const [broadcasts] = useState<CampaignBroadcast[]>([
    {
      id: 1,
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
    },
    {
      id: 2,
      campaign_id: 102,
      campaign_name: "Flash Sale Alert",
      status: "in_progress",
      sent_at: "2026-03-18T14:00:00Z",
      channels: ["push", "email"],
      total_recipients: 3500,
      delivered: 2800,
      opened: 1120,
      clicked: 280,
      conversions: 42,
      failed: 700,
      unsubscribed: 5,
      created_by: "Jane Smith",
    },
    {
      id: 3,
      campaign_id: 103,
      campaign_name: "Winter Holiday Special",
      status: "failed",
      sent_at: "2026-03-17T09:15:00Z",
      channels: ["email"],
      total_recipients: 8000,
      delivered: 2100,
      opened: 525,
      clicked: 157,
      conversions: 31,
      failed: 5900,
      unsubscribed: 3,
      created_by: "Mike Johnson",
    },
    {
      id: 4,
      campaign_id: 104,
      campaign_name: "New Product Launch",
      status: "scheduled",
      sent_at: "2026-03-20T08:00:00Z",
      channels: ["email", "sms", "push"],
      total_recipients: 12000,
      delivered: 0,
      opened: 0,
      clicked: 0,
      conversions: 0,
      failed: 0,
      unsubscribed: 0,
      created_by: "Sarah Williams",
    },
    {
      id: 5,
      campaign_id: 105,
      campaign_name: "Customer Loyalty Rewards",
      status: "completed",
      sent_at: "2026-03-16T16:45:00Z",
      channels: ["sms", "push"],
      total_recipients: 6500,
      delivered: 6200,
      opened: 3100,
      clicked: 930,
      conversions: 186,
      failed: 300,
      unsubscribed: 8,
      created_by: "Emily Davis",
    },
  ]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredBroadcasts = broadcasts.filter((broadcast) => {
    const matchesStatus = selectedStatus === "all" || broadcast.status === selectedStatus;
    const matchesSearch =
      broadcast.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broadcast.created_by.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Stats Cards Data
  const broadcastStats = [
    {
      name: "Total Broadcasts",
      value: broadcasts.length.toString(),
      icon: Radio,
    },
    {
      name: "Total Sent",
      value: broadcasts.reduce((sum, b) => sum + (b.status === "sent" || b.status === "completed" ? 1 : 0), 0).toString(),
      icon: Send,
    },
    {
      name: "Total Recipients",
      value: broadcasts.reduce((sum, b) => sum + b.total_recipients, 0).toLocaleString(),
      icon: TrendingUp,
    },
    {
      name: "Total Conversions",
      value: broadcasts.reduce((sum, b) => sum + b.conversions, 0).toLocaleString(),
      icon: CheckCircle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            Campaign Broadcasts
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            View and manage campaign broadcast execution history
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {broadcastStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="h-5 w-5"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
            style={{ color: color.text.muted }}
          />
          <input
            type="text"
            placeholder="Search broadcasts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 text-sm border ${tw.borderDefault} ${tw.rounded} focus:outline-none transition-all duration-200 bg-white focus:ring-2 focus:ring-blue-400`}
          />
        </div>

        <HeadlessSelect
          options={statusOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          value={selectedStatus}
          onChange={(value) => setSelectedStatus(value as string)}
          placeholder="All Status"
          className=""
        />
      </div>

      {/* Table Container */}
      <div
        className={` ${tw.rounded} border overflow-hidden`}
        style={{ borderColor: color.border.default }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner
              variant="modern"
              size="xl"
              color="primary"
              className="mb-4"
            />
            <p className={`${tw.textMuted} font-medium text-sm`}>
              Loading broadcasts...
            </p>
          </div>
        ) : filteredBroadcasts.length > 0 ? (
          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Campaign
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Sent Date
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Channels
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Recipients
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Opened
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Conversions
                  </th>
                  <th
                    className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBroadcasts.map((broadcast) => (
                  <tr key={broadcast.id} className="transition-colors">
                    <td
                      className="px-6 py-4 text-sm text-black font-bold"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="truncate">
                        {broadcast.campaign_name}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {broadcast.status.replace(/_/g, " ")}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {new Date(broadcast.sent_at).toLocaleDateString()}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex gap-2 flex-wrap">
                        {broadcast.channels.map((channel) => (
                          <span key={channel} className="text-sm">
                            {channel}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {broadcast.delivered}/{broadcast.total_recipients}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {broadcast.opened}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {broadcast.conversions}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-center"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => navigate(`/dashboard/campaign-broadcasts/${broadcast.id}`)}
                          className="text-black hover:text-gray-700 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {broadcast.status === "failed" && (
                          <button className="hover:opacity-80 transition-colors" title="Retry" style={{ color: "#EF4444" }}>
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button className="text-black hover:text-gray-700 transition-colors" title="Archive">
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className={`${tw.textMuted} font-medium text-sm`}>
              No broadcasts found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
