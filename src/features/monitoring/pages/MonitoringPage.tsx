import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, RotateCcw, Download, Activity, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";
import { executionService, Execution } from "../services/executionService";

const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "campaign", label: "Campaign" },
  { value: "broadcast", label: "Broadcast" },
  { value: "manual_reward", label: "Manual Reward" },
  { value: "scheduled_job", label: "Scheduled Job" },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "running", label: "Running" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
];

export default function MonitoringPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const defaultColumns: TableColumn<Execution>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
    },
    {
      id: "type",
      label: "Type",
      visible: true,
      },
    {
      id: "recipientsCount",
      label: "Recipients",
      visible: true,
      },
    {
      id: "status",
      label: "Status",
      visible: true,
    },
    {
      id: "successCount",
      label: "Success",
      visible: true,
      },
    {
      id: "failureCount",
      label: "Failed",
      visible: true,
      },
    {
      id: "duration",
      label: "Duration",
      visible: true,
      },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (_, execution) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => handleRetry(execution)} className={`p-2 ${tw.rounded} transition-colors`} style={{ color: 'var(--c-text-primary)' }} title="Retry">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const {
    columns,
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
    toggleColumn,
  } = useTable({
    tableId: "execution-monitoring-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  useEffect(() => {
    loadExecutions();
    loadStatistics();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchQuery, selectedType, selectedStatus, tableHandlePageChange]);

  const loadExecutions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await executionService.getExecutions();
      setExecutions(response.data || []);
    } catch (err) {
      setError("Failed to load executions");
      showError("Error", "Failed to load executions");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await executionService.getExecutionStatistics();
      setStatistics(response);
    } catch (err) {
      // Error handled silently
    }
  };

  const getStatusColor = (status: Execution["status"]) => {
    const colors: Record<string, string> = {
      running: "#3B82F6",
      success: "#10B981",
      failed: "#EF4444",
      pending: "#F59E0B",
    };
    return colors[status] || "#6B7280";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      campaign: "Campaign",
      broadcast: "Broadcast",
      manual_reward: "Manual Reward",
      scheduled_job: "Scheduled Job",
    };
    return labels[type] || type;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const filteredExecutions = executions.filter((execution) => {
    const matchesType = selectedType === "all" || execution.type === selectedType;
    const matchesStatus = selectedStatus === "all" || execution.status === selectedStatus;
    const matchesSearch = execution.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
      (execution.triggeredBy &&
        execution.triggeredBy.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesStatus && matchesSearch;
  });

  const startIndex = (tableCurrentPage - 1) * tablePageSize;
  const paginatedExecutions = filteredExecutions.slice(startIndex, startIndex + tablePageSize);

  const handleRetry = (execution: Execution) => {
    // Mock retry - in real app this would call an API
    showSuccess(`Retrying execution: ${execution.name}`);
  };

  const handleDownload = () => {
    // Convert executions to CSV
    const headers = ["Name", "Type", "Recipients", "Status", "Success", "Failed", "Duration"];
    const rows = filteredExecutions.map((e) => [
      e.name,
      getTypeLabel(e.type),
      e.recipientsCount || "-",
      e.status,
      e.successCount || "-",
      e.failureCount || "-",
      formatDuration(e.duration),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `executions_${new Date().getTime()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getSuccessRate = () => {
    const total = statistics?.total_executions || 0;
    const success = statistics?.success_count || 0;
    if (total === 0) return "0%";
    return `${((success / total) * 100).toFixed(1)}%`;
  };

  const executionStats = [
    {
      name: "Total Executions",
      value: statistics?.total_executions || "0",
      icon: Activity,
    },
    {
      name: "Running",
      value: statistics?.running_count || "0",
      icon: Clock,
    },
    {
      name: "Success",
      value: statistics?.success_count || "0",
      icon: CheckCircle,
      subtitle: `${getSuccessRate()} success rate`,
    },
    {
      name: "Failed",
      value: statistics?.failed_count || "0",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <BackButton

          showBreadcrumb={true}

          currentLabel="Execution Monitoring"
        />
        <p className={`${tw.textSecondary} text-sm`}>
          Monitor campaigns, broadcasts, rewards, and scheduled jobs execution status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {executionStats.map((stat: any) => {
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
                <p className="text-sm font-medium" style={{ color: 'var(--c-text-secondary)' }}>{stat.name}</p>
              </div>
              <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--c-text-primary)' }}>
                {stat.value}
              </p>
              {stat.subtitle && (
                <p className="mt-1 text-xs" style={{ color: 'var(--c-text-secondary)' }}>{stat.subtitle}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SearchInput
            placeholder="Search by name or triggered by..."
            value={searchQuery}
            onChange={setSearchQuery}
          />

          <HeadlessSelect
            options={typeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            value={selectedType}
            onChange={(value) => setSelectedType(value as string)}
            placeholder="All Types"
          />

          <HeadlessSelect
            options={statusOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value as string)}
            placeholder="All Status"
          />
        </div>

        <button
          onClick={handleDownload}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded transition-colors hover:opacity-90"
          style={{ backgroundColor: color.primary.action }}
          title="Download as CSV"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </button>
      </div>

      {/* Table Container */}
      <div className={`${tw.rounded} overflow-hidden`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner />
            <p className={`${tw.textMuted} font-medium text-sm mt-4`}>
              Loading executions...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="w-12 h-12 mb-4" style={{ color: 'var(--c-text-danger)' }} />
            <p className="font-medium" style={{ color: 'var(--c-text-danger)' }}>{error}</p>
            <button
              onClick={loadExecutions}
              className="mt-4 px-4 py-2 text-sm font-medium text-white rounded transition-all"
              style={{ backgroundColor: color.primary.action }}
            >
              Retry
            </button>
          </div>
        ) : executions.length > 0 && paginatedExecutions.length > 0 ? (
          <>
            <Table<Execution>
              columns={columns}
              data={paginatedExecutions}
              totalItems={filteredExecutions.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={isLoading}
              onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {!isLoading && paginatedExecutions.length > 0 && filteredExecutions.length > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={tableCurrentPage}
                  pageSize={tablePageSize}
                  totalItems={filteredExecutions.length}
                  onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className={`${tw.textMuted} font-medium text-sm`}>
              No execution records available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
