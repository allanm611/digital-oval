import { useState, useCallback, useEffect } from "react";
import { Eye, Filter, BarChart3, Send, Radio, TrendingUp, CheckCircle, RotateCcw, Archive, AlertCircle, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import SearchInput from "../../../shared/components/ui/SearchInput";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useToast } from "../../../contexts/ToastContext";
import { color, tw, button } from "../../../shared/utils/utils";
import { broadcastService } from "../services/broadcastService";
import DateFormatter from "../../../shared/components/DateFormatter";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";

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

interface BroadcastTableRow {
  id: number;
  campaignName: string;
  status: string;
  sentDate: string;
  channels: string;
  recipients: string;
  opened: number;
  conversions: number;
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
  const { showToast, error: showError } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState<CampaignBroadcast[]>([
    {
      id: 1,
      campaign_id: 101,
      campaign_name: "Summer Promo Campaign",
      status: "running",
      sent_at: "2026-04-10T10:30:00Z",
      channels: ["email", "sms"],
      total_recipients: 5000,
      delivered: 4850,
      opened: 2425,
      clicked: 725,
      conversions: 145,
      failed: 150,
      unsubscribed: 10,
      created_by: "System Administrator",
    },
    {
      id: 2,
      campaign_id: 102,
      campaign_name: "Flash Sale Alert",
      status: "running",
      sent_at: "2026-04-10T14:00:00Z",
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
      status: "scheduled",
      sent_at: "2026-04-15T09:15:00Z",
      channels: ["email"],
      total_recipients: 8000,
      delivered: 0,
      opened: 0,
      clicked: 0,
      conversions: 0,
      failed: 0,
      unsubscribed: 0,
      created_by: "Mike Johnson",
    },
    {
      id: 4,
      campaign_id: 104,
      campaign_name: "New Product Launch",
      status: "completed",
      sent_at: "2026-04-08T08:00:00Z",
      channels: ["email", "sms", "push"],
      total_recipients: 12000,
      delivered: 11500,
      opened: 5750,
      clicked: 1725,
      conversions: 345,
      failed: 500,
      unsubscribed: 20,
      created_by: "Sarah Williams",
    },
    {
      id: 5,
      campaign_id: 105,
      campaign_name: "Customer Loyalty Rewards",
      status: "completed",
      sent_at: "2026-04-07T16:45:00Z",
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
    {
      id: 6,
      campaign_id: 106,
      campaign_name: "Easter Campaign",
      status: "paused",
      sent_at: "2026-04-09T12:00:00Z",
      channels: ["email"],
      total_recipients: 4000,
      delivered: 3800,
      opened: 1900,
      clicked: 570,
      conversions: 114,
      failed: 200,
      unsubscribed: 5,
      created_by: "Alex Brown",
    },
  ]);
  const [statistics, setStatistics] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Table columns definition
  const defaultColumns: TableColumn<BroadcastTableRow>[] = [
    { id: "campaignName", label: "Campaign", width: "200px", visible: true, sortable: true, filterConfig: { type: "text" }, render: (_, row) => (
      <div className="truncate">{row.campaignName}</div>
    ) },
    { id: "status", label: "Status", width: "140px", visible: true, filterConfig: { type: "multiselect", options: ["sent", "in_progress", "scheduled", "failed", "paused", "completed"] } },
    { id: "sentDate", label: "Sent Date", width: "180px", visible: true, filterConfig: { type: "date" }, render: (_, row) => (
      <DateFormatter date={row.sentDate} useUserTimezone />
    ) },
    { id: "channels", label: "Channels", width: "150px", visible: true, filterConfig: { type: "text" }, render: (_, row) => (
      <div className="flex gap-2 flex-wrap">
        {row.channels.split(",").map((channel) => (
          <span key={channel} className="text-sm">{channel}</span>
        ))}
      </div>
    ) },
    { id: "recipients", label: "Recipients", width: "140px", visible: true, filterConfig: { type: "number" } },
    { id: "opened", label: "Opened", width: "100px", visible: true, filterConfig: { type: "number" } },
    { id: "conversions", label: "Conversions", width: "130px", visible: true, filterConfig: { type: "number" } },
    {
      id: "actions",
      label: "Actions",
      width: "150px",
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (_, row) => {
        const broadcast = filteredBroadcasts.find((b) => b.id === row.id);
        return (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/dashboard/campaign-broadcasts/${broadcast?.id}`)}
              className="text-black hover:text-gray-700 transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            {broadcast?.status === "failed" && (
              <button className="hover:opacity-80 transition-colors" title="Retry" style={{ color: "#EF4444" }}>
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const {
    columns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useTable({
    tableId: "campaign-broadcasts-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  useEffect(() => {
    loadBroadcastStatistics();
  }, []);

  const loadBroadcastStatistics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await broadcastService.getBroadcastStatistics();
      setStatistics(response.data || response);
    } catch (err) {
      console.error("Failed to load broadcast statistics:", err);
      setError("Failed to load broadcast statistics");
      showError("Error", "Failed to load broadcast statistics");
    } finally {
      setIsLoading(false);
    }
  };

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchQuery]);

  const paginatedBroadcasts = filteredBroadcasts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Stats Cards Data from API
  const broadcastStats = [
    {
      name: "Total Broadcasts",
      value: statistics?.total_broadcasts || "0",
      icon: Radio,
    },
    {
      name: "Running",
      value: statistics?.running_broadcasts || "0",
      icon: Send,
    },
    {
      name: "Completed",
      value: statistics?.completed_broadcasts || "0",
      icon: CheckCircle,
    },
    {
      name: "Scheduled",
      value: statistics?.scheduled_broadcasts || "0",
      icon: TrendingUp,
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
                <p className={`p-0 icon-edit ${tw.rounded} text-sm font-medium `}>{stat.name}</p>
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
        <SearchInput
          placeholder="Search broadcasts..."
          value={searchQuery}
          onChange={setSearchQuery}
        />

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
        className={` ${tw.rounded} overflow-hidden`}
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
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={loadBroadcastStatistics}
              className="mt-4 px-4 py-2 text-sm font-medium text-white rounded transition-all"
              style={{ backgroundColor: color.primary.action }}
            >
              Retry
            </button>
          </div>
        ) : broadcasts.length > 0 && filteredBroadcasts.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table<BroadcastTableRow>
                columns={columns}
                data={paginatedBroadcasts.map((broadcast) => ({
                  id: broadcast.id,
                  campaignName: broadcast.campaign_name,
                  status: broadcast.status.replace(/_/g, " "),
                  sentDate: broadcast.sent_at,
                  channels: broadcast.channels.join(","),
                  recipients: `${broadcast.delivered}/${broadcast.total_recipients}`,
                  opened: broadcast.opened,
                  conversions: broadcast.conversions,
                }))}
                onHideColumn={toggleColumn}
                onManageColumnsClick={() => setShowColumnPicker(true)}
                rowSpacing="0 8px"
              />
            </div>
            {filteredBroadcasts.length > 0 && (
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredBroadcasts.length}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className={`${tw.textMuted} font-medium text-sm`}>
              No individual broadcast records available
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Check the statistics above for system-wide broadcast overview
            </p>
          </div>
        )}
      </div>

      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns.map((col) => ({ id: col.id, label: col.label, visible: col.visible }))}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={(reorderedCols) => {
          const updatedColumns = reorderedCols.map((reordered) => {
            const original = columns.find((c) => c.id === reordered.id);
            return original ? { ...original, visible: reordered.visible } : reordered as any;
          });
          reorderColumns(updatedColumns);
        }}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  );
}
