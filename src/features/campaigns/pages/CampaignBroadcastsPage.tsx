import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Eye,
  Archive,
  Radio,
  Send,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import SearchInput from "../../../shared/components/ui/SearchInput";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";
import { getStatusBadgeConfig } from "../../../shared/utils/statusColors";
import { broadcastService } from "../services/broadcastService";
import { campaignService } from "../services/campaignService";
import DateFormatter from "../../../shared/components/DateFormatter";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import Pagination from "../../../shared/components/ui/Pagination";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import {
  Broadcast,
  BroadcastStatus,
  BROADCAST_STATUS_LABELS,
} from "../types/broadcast";
import { formatBroadcastStatusLabel } from "../utils/normalizeCampaignBroadcast";

interface BroadcastTableRow {
  id: string;
  campaignName: string;
  broadcastName: string;
  status: string;
  statusRaw: BroadcastStatus;
  sentDate: string;
  channels: string;
  sent: number;
  failed: number;
  deliveryRate: string;
}

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "scheduled", label: BROADCAST_STATUS_LABELS.scheduled },
  { value: "pending", label: BROADCAST_STATUS_LABELS.pending },
  { value: "running", label: BROADCAST_STATUS_LABELS.running },
  { value: "paused", label: BROADCAST_STATUS_LABELS.paused },
  { value: "completed", label: BROADCAST_STATUS_LABELS.completed },
  { value: "failed", label: BROADCAST_STATUS_LABELS.failed },
  { value: "aborted", label: BROADCAST_STATUS_LABELS.aborted },
  { value: "cancelled", label: BROADCAST_STATUS_LABELS.cancelled },
  { value: "draft", label: BROADCAST_STATUS_LABELS.draft },
];

export default function CampaignBroadcastsPage() {
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const campaignIdFilter = searchParams.get("campaignId");
  const selectedCampaign = campaignIdFilter ?? "all";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [statistics, setStatistics] = useState<Record<string, unknown> | null>(null);
  const [campaignOptions, setCampaignOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "All Campaigns" }]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const defaultColumns: TableColumn<BroadcastTableRow>[] = useMemo(
    () => [
      {
        id: "campaignName",
        label: "Campaign",
        width: "180px",
        visible: true,
        sortable: true,
        filterConfig: { type: "text" },
        render: (_, row) => <div className="truncate">{row.campaignName}</div>,
      },
      {
        id: "broadcastName",
        label: "Broadcast",
        width: "200px",
        visible: true,
        sortable: true,
        filterConfig: { type: "text" },
        render: (_, row) => <div className="truncate">{row.broadcastName}</div>,
      },
      {
        id: "status",
        label: "Status",
        width: "140px",
        visible: true,
        filterConfig: {
          type: "multiselect",
          options: statusOptions.filter((o) => o.value !== "all").map((o) => o.value),
        },
        render: (_, row) => {
          const { className, style } = getStatusBadgeConfig(row.statusRaw, "broadcast");
          return (
            <span
              className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${className}`}
              style={style}
            >
              {row.status}
            </span>
          );
        },
      },
      {
        id: "sentDate",
        label: "Start Time",
        width: "180px",
        visible: true,
        filterConfig: { type: "date" },
        render: (_, row) =>
          row.sentDate ? (
            <DateFormatter date={row.sentDate} useUserTimezone />
          ) : (
            <span>—</span>
          ),
      },
      {
        id: "channels",
        label: "Channel",
        width: "120px",
        visible: true,
        filterConfig: { type: "text" },
        render: (_, row) => (
          <span className="text-sm uppercase">{row.channels || "—"}</span>
        ),
      },
      {
        id: "sent",
        label: "Sent",
        width: "100px",
        visible: true,
        filterConfig: { type: "number" },
      },
      {
        id: "failed",
        label: "Failed",
        width: "100px",
        visible: true,
        filterConfig: { type: "number" },
      },
      {
        id: "deliveryRate",
        label: "Delivery %",
        width: "110px",
        visible: true,
        filterConfig: { type: "text" },
      },
      {
        id: "actions",
        label: "Actions",
        width: "150px",
        visible: true,
        sortable: false,
        isActionColumn: true,
        render: (_, row) => (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/campaign-broadcasts/${row.id}`)}
              className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={`p-0 icon-delete ${tw.rounded} transition-all duration-200`}
              title="Archive"
              onClick={(e) => {
                e.stopPropagation();
                // Archive API not available yet — keep UI parity with prior design
              }}
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const {
    columns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useTable({
    tableId: "campaign-broadcasts-table",
    defaultColumns,
    defaultPageSize: pageSize,
    persistToLocalStorage: true,
  });

  const loadCampaigns = useCallback(async () => {
    try {
      const response = await campaignService.getCampaigns({
        limit: 200,
        offset: 0,
        skipCache: true,
      });
      const campaigns = response?.data ?? [];
      const options = [
        { value: "all", label: "All Campaigns" },
        ...campaigns
          .filter((campaign) => campaign?.id != null)
          .map((campaign) => ({
            value: String(campaign.id),
            label: campaign.name || `Campaign #${campaign.id}`,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ];
      setCampaignOptions(options);
    } catch (err) {
      console.warn("Failed to load campaigns for filter:", err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const campaignId = campaignIdFilter ? Number(campaignIdFilter) : NaN;
      const hasValidCampaignFilter =
        Boolean(campaignIdFilter) && Number.isFinite(campaignId) && campaignId > 0;

      const [listResult, statsResult] = await Promise.allSettled([
        hasValidCampaignFilter
          ? broadcastService.getCampaignOperationalBroadcasts(campaignId)
          : broadcastService.listBroadcasts(),
        broadcastService.getBroadcastStatistics(),
      ]);

      if (listResult.status === "fulfilled") {
        const rows = listResult.value.data ?? [];
        setBroadcasts(rows);

        // Keep filter options complete even if a campaign isn't in the first page of campaigns API
        setCampaignOptions((prev) => {
          const byId = new Map(prev.map((opt) => [opt.value, opt]));
          for (const broadcast of rows) {
            if (broadcast.campaign_id == null) continue;
            const value = String(broadcast.campaign_id);
            if (!byId.has(value)) {
              byId.set(value, {
                value,
                label:
                  broadcast.campaign_name ||
                  `Campaign #${broadcast.campaign_id}`,
              });
            }
          }
          const merged = Array.from(byId.values());
          const allOption = merged.find((opt) => opt.value === "all") ?? {
            value: "all",
            label: "All Campaigns",
          };
          const rest = merged
            .filter((opt) => opt.value !== "all")
            .sort((a, b) => a.label.localeCompare(b.label));
          return [allOption, ...rest];
        });
      } else {
        console.error("Failed to load broadcasts:", listResult.reason);
        setBroadcasts([]);
        setError(
          listResult.reason instanceof Error
            ? listResult.reason.message
            : "Failed to load broadcasts",
        );
        showError("Error", "Failed to load broadcasts");
      }

      if (statsResult.status === "fulfilled") {
        const stats = statsResult.value?.data ?? statsResult.value;
        setStatistics(stats ?? null);
      }
    } catch (err) {
      console.error("Failed to load broadcast data:", err);
      setError(err instanceof Error ? err.message : "Failed to load broadcasts");
      showError("Error", "Failed to load broadcasts");
    } finally {
      setIsLoading(false);
    }
  }, [campaignIdFilter, showError]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCampaignFilterChange = useCallback(
    (value: string | number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === "all" || value === "" || value == null) {
          next.delete("campaignId");
        } else {
          next.set("campaignId", String(value));
        }
        return next;
      });
      setCurrentPage(1);
    },
    [setSearchParams],
  );

  const filteredBroadcasts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return broadcasts.filter((broadcast) => {
      const matchesStatus =
        selectedStatus === "all" || broadcast.status === selectedStatus;
      const matchesSearch =
        !q ||
        broadcast.campaign_name?.toLowerCase().includes(q) ||
        broadcast.broadcast_name?.toLowerCase().includes(q) ||
        broadcast.broadcast_id.toLowerCase().includes(q) ||
        broadcast.channel_code?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [broadcasts, selectedStatus, searchQuery]);

  const selectedCampaignLabel = useMemo(() => {
    if (selectedCampaign === "all") return null;
    return (
      campaignOptions.find((opt) => opt.value === selectedCampaign)?.label ??
      `Campaign #${selectedCampaign}`
    );
  }, [campaignOptions, selectedCampaign]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchQuery, campaignIdFilter]);

  const paginatedBroadcasts = filteredBroadcasts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const tableRows: BroadcastTableRow[] = paginatedBroadcasts.map((broadcast) => ({
    id: broadcast.broadcast_id,
    campaignName: broadcast.campaign_name || `Campaign #${broadcast.campaign_id ?? "—"}`,
    broadcastName: broadcast.broadcast_name || "—",
    status: formatBroadcastStatusLabel(broadcast.status),
    statusRaw: broadcast.status,
    sentDate: broadcast.actual_start_time || broadcast.planned_start_time || "",
    channels: broadcast.channel_code || "",
    sent: broadcast.messages_sent ?? 0,
    failed: broadcast.messages_failed ?? 0,
    deliveryRate: `${Number(broadcast.delivery_rate ?? 0).toFixed(1)}%`,
  }));

  const broadcastStats = [
    {
      name: "Total Broadcasts",
      value: statistics?.total_broadcasts ?? broadcasts.length ?? 0,
      icon: Radio,
    },
    {
      name: "Running",
      value: statistics?.running_broadcasts ??
        broadcasts.filter((b) => b.status === "running").length,
      icon: Send,
    },
    {
      name: "Completed",
      value: statistics?.completed_broadcasts ??
        broadcasts.filter((b) => b.status === "completed").length,
      icon: CheckCircle,
    },
    {
      name: "Scheduled",
      value: statistics?.scheduled_broadcasts ??
        broadcasts.filter((b) => b.status === "scheduled").length,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            Campaign Broadcasts
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            View and manage campaign broadcast execution history
            {selectedCampaignLabel ? ` · ${selectedCampaignLabel}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {broadcastStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" style={{ color: color.primary.accent }} />
                <p className={`p-0 icon-edit ${tw.rounded} text-sm font-medium`}>{stat.name}</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{String(stat.value)}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <SearchInput
          placeholder="Search by campaign, broadcast, channel..."
          value={searchQuery}
          onChange={setSearchQuery}
        />

        <HeadlessSelect
          options={campaignOptions}
          value={selectedCampaign}
          onChange={handleCampaignFilterChange}
          placeholder="All Campaigns"
          searchable
          className="min-w-[220px]"
        />

        <HeadlessSelect
          options={statusOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          value={selectedStatus}
          onChange={(value) => setSelectedStatus(value as string)}
          placeholder="All Status"
          className="min-w-[180px]"
        />
      </div>

      <div className={`${tw.rounded} overflow-hidden`}>
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
              type="button"
              onClick={loadData}
              className="mt-4 px-4 py-2 text-sm font-medium text-white rounded transition-all"
              style={{ backgroundColor: color.primary.action }}
            >
              Retry
            </button>
          </div>
        ) : filteredBroadcasts.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table<BroadcastTableRow>
                columns={columns}
                data={tableRows}
                onHideColumn={toggleColumn}
                onManageColumnsClick={() => setShowColumnPicker(true)}
                rowSpacing="0 8px"
              />
            </div>
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredBroadcasts.length}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className={`${tw.textMuted} font-medium text-sm`}>
              No broadcast records available
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Broadcasts appear when campaigns are scheduled or executed
            </p>
          </div>
        )}
      </div>

      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns.map((col) => ({
          id: col.id,
          label: col.label,
          visible: col.visible,
        }))}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={(reorderedCols) => {
          const updatedColumns = reorderedCols.map((reordered) => {
            const original = columns.find((c) => c.id === reordered.id);
            return original
              ? { ...original, visible: reordered.visible }
              : (reordered as any);
          });
          reorderColumns(updatedColumns);
        }}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  );
}
