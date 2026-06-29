import { useState, useMemo, useEffect } from "react";
import { Filter, Eye, ListChecks, Zap } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import { SystemEvent, SYSTEM_EVENT_CATEGORIES } from "../types/systemEvent";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { systemEventService } from "../services/systemEventService";

export default function SystemEventsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [activeEvents, setActiveEvents] = useState<Set<number>>(new Set());

  const tableColumns: TableColumn<SystemEvent>[] = [
    {
      id: "event_name",
      label: t.kpis.eventName,
      visible: true,
      filterConfig: { type: "text" },
      render: (_, row) => (
        <div className={`text-sm ${tw.tableFirstColumn} ${tw.textPrimary} truncate`} title={row.event_name}>
          {row.event_name}
        </div>
      ),
    },
    {
      id: "event_code",
      label: t.kpis.eventCode,
      visible: true,
      filterConfig: { type: "text" },
      render: (_, row) => (
        <span className="font-mono text-sm text-gray-900">
          {row.event_code}
        </span>
      ),
    },
    {
      id: "category",
      label: t.common.category,
      visible: true,
      filterConfig: { type: "select", options: SYSTEM_EVENT_CATEGORIES.map(cat => cat.value) },
      render: (_, row) => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-gray-900">
          {SYSTEM_EVENT_CATEGORIES.find(
            (cat) => cat.value === row.category,
          )?.label || row.category}
        </span>
      ),
    },
    {
      id: "event_description",
      label: t.common.description,
      visible: true,
      filterConfig: { type: "text" },
      render: (_, row) => (
        <p className="text-sm text-gray-900 truncate max-w-xs" title={row.event_description}>
          {row.event_description}
        </p>
      ),
    },
    {
      id: "source_table",
      label: t.kpis.source,
      visible: false,
      filterConfig: { type: "text" },
      render: (_, row) => (
        <p className="text-sm text-gray-900">
          {row.source_table}
        </p>
      ),
    },
    {
      id: "actions",
      label: t.common.actions,
      visible: true,
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-center space-x-2">
          <ActivateDeactivateButton
            isActive={activeEvents.has(row.id)}
            onToggle={() => handleToggleActive(row)}
            disabled={toggling === row.id}
            isLoading={toggling === row.id}
          />
          <button
            onClick={() =>
              navigate(
                `/dashboard/kpis/system-events/${row.id}`,
              )
            }
            className={`group p-3 ${tw.rounded} icon-edit transition-all duration-300`}
            title={t.common.view}
          >
            <Eye className="w-4 h-4" />
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
    reorderColumns,
    resetToDefaults,
  } = useTable({
    tableId: "system-events-table",
    defaultColumns: tableColumns,
    persistToLocalStorage: true,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, categoryFilter, tableHandlePageChange]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await systemEventService.getAllEvents();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load system events:", err);
      showError("Error", "Failed to load system events");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.event_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.event_code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || event.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter, events]);

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value || "all");
  };

  const handleToggleActive = async (event: SystemEvent) => {
    setToggling(event.id);
    try {
      const isCurrentlyActive = activeEvents.has(event.id);
      const newActiveSet = new Set(activeEvents);
      if (isCurrentlyActive) {
        newActiveSet.delete(event.id);
        success("Success", `"${event.event_name}" has been deactivated`);
      } else {
        newActiveSet.add(event.id);
        success("Success", `"${event.event_name}" has been activated`);
      }
      setActiveEvents(newActiveSet);
    } finally {
      setToggling(null);
    }
  };

  // Calculate statistics
  const stats = {
    totalEvents: events.length,
    email: events.filter((e) => e.category === "email").length,
    sms: events.filter((e) => e.category === "sms").length,
    campaign: events.filter((e) => e.category === "campaign").length,
  };

  const statCards = [
    {
      name: "Total Events",
      value: stats.totalEvents,
      icon: ListChecks,
    },
    {
      name: "Email Events",
      value: stats.email,
      icon: Zap,
    },
    {
      name: "SMS Events",
      value: stats.sms,
      icon: Zap,
    },
    {
      name: "Campaign Events",
      value: stats.campaign,
      icon: Zap,
    },
  ];

  const categoryOptions = [
    { value: "all", label: t.kpis.filters.allCategories },
    ...SYSTEM_EVENT_CATEGORIES.map((cat) => ({
      value: cat.value,
      label: cat.label,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackButton showBreadcrumb={true} currentLabel="System Events" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
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

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-wrap">
        <Input
          placeholder="Search events by name or code..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            tableHandlePageChange(1);
          }}
          className="flex-1 min-w-[250px]"
        />

        <HeadlessSelect
          options={categoryOptions}
          value={categoryFilter}
          onChange={(value) => handleCategoryChange(value || "all")}
          placeholder={t.kpis.filters.filterByCategory}
          className="min-w-[180px]"
        />
      </div>

      {/* Table */}
      <div className={`${tw.rounded} overflow-hidden`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner
              variant="modern"
              size="lg"
              color="primary"
              className="mr-3"
            />
            <span className={`${tw.textSecondary}`}>Loading events...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm || categoryFilter !== "all" ? t.kpis.messages.noEventsFound : "No events yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm || categoryFilter !== "all"
                ? t.kpis.messages.adjustSearch
                : "No events available"}
            </p>
          </div>
        ) : (
          <Table<SystemEvent>
            columns={columns}
            data={filteredEvents}
            totalItems={filteredEvents.length}
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
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredEvents.length > 0 && (
        <Pagination
          currentPage={tableCurrentPage}
          pageSize={tablePageSize}
          totalItems={filteredEvents.length}
          onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
        />
      )}

      {/* Column Picker Modal */}
      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  );
}
