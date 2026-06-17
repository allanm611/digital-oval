import { useState, useMemo, useEffect } from "react";
import { Eye, Edit, Trash2, ListChecks, Activity, DollarSign, Users } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { kpiService } from "../services/kpiService";
import { systemEventService } from "../services/systemEventService";
import { type KPI } from "../types/kpi";
import { type SystemEvent } from "../types/systemEvent";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import KPIDetailsExpandedRow from "../components/KPIDetailsExpandedRow";

export default function AllKPIsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [allKPIs, setAllKPIs] = useState<KPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingKpiId, setTogglingKpiId] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    loadAllKPIs();
  }, []);

  const loadAllKPIs = async () => {
    setIsLoading(true);
    try {
      const [kpiData, systemEventsData] = await Promise.all([
        kpiService.getAllKPIs(),
        systemEventService.getAllEvents(),
      ]);

      const kpis: KPI[] = kpiData.map((kpi, idx) => {
        // Map tag to category
        const categoryMap: Record<string, string> = {
          revenue_metric: "Revenue Metric",
          usage_metric: "Usage Metric",
          kpi: "Subscriber Profile",
        };

        return {
          id: kpi.id?.toString() || `kpi-${idx + 1}`,
          name: kpi.field_name || "",
          category: categoryMap[kpi.tag || "kpi"] || "KPI",
          subcategory: kpi.tag || "",
          description: kpi.description || "",
          source: `${kpi.field_source_table || "Unknown"}`,
          field_type: kpi.field_type || "",
          is_active: kpi.is_active ?? true,
          field_value: kpi.field_value || "",
        };
      });

      // Add system events
      const systemEventKPIs: KPI[] = systemEventsData.map((event: SystemEvent) => ({
        id: `event-${event.id}`,
        name: event.event_name,
        category: "System Event",
        subcategory: event.category,
        description: event.event_description || "",
        source: event.category,
        field_type: "event",
        is_active: true,
      }));

      setAllKPIs([...kpis, ...systemEventKPIs]);
    } catch (err) {
      console.error("Failed to load KPIs:", err);
      showToast("error", "Failed to load KPIs");
      setAllKPIs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = Array.from(new Set(allKPIs.map((kpi) => kpi.category)));

  const filteredKPIs = useMemo(() => {
    return allKPIs.filter((kpi) => {
      const matchesSearch =
        kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (kpi.description && kpi.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = categoryFilter === "all" || kpi.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter, allKPIs]);

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value || "all");
  };

  // Calculate statistics
  const stats = {
    totalKPIs: allKPIs.length,
    subscriberProfiles: allKPIs.filter((k) => k.category === "Subscriber Profile").length,
    systemEvents: allKPIs.filter((k) => k.category === "System Event").length,
    usageMetrics: allKPIs.filter((k) => k.category === "Usage Metric").length,
    revenueMetrics: allKPIs.filter((k) => k.category === "Revenue Metric").length,
  };

  const statCards = [
    {
      name: "Total KPIs",
      value: stats.totalKPIs,
      icon: ListChecks,
    },
    {
      name: "Subscriber Profiles",
      value: stats.subscriberProfiles,
      icon: Users,
    },
    {
      name: "System Events",
      value: stats.systemEvents,
      icon: ListChecks,
    },
    {
      name: "Usage Metrics",
      value: stats.usageMetrics,
      icon: Activity,
    },
    {
      name: "Revenue Metrics",
      value: stats.revenueMetrics,
      icon: DollarSign,
    },
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...categories.map((cat) => ({ value: cat, label: cat })),
  ];

  const tableColumns: TableColumn<typeof allKPIs[0]>[] = [
    {
      id: "name",
      label: "KPI Name",
      visible: true,
      filterConfig: { type: 'text' },
      render: (_, row) => (
        <div className={`text-sm ${tw.tableFirstColumn} ${tw.textPrimary} truncate`} title={row.name}>
          {row.name}
        </div>
      ),
    },
    {
      id: "category",
      label: "Category",
      visible: true,
      filterConfig: { type: 'select', options: ["Revenue Metric", "Usage Metric", "Subscriber Profile", "System Event"] },
      render: (_, row) => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-gray-900">
          {row.category}
        </span>
      ),
    },
    {
      id: "field_type",
      label: "Type",
      visible: true,
      filterConfig: { type: 'text' },
      render: (_, row) => (
        <p className="text-sm text-gray-700">
          {row.field_type ? row.field_type.charAt(0).toUpperCase() + row.field_type.slice(1) : "-"}
        </p>
      ),
    },
    {
      id: "is_active",
      label: "Status",
      visible: true,
      filterConfig: { type: 'select', options: ["Active", "Inactive"] },
      render: (_, row) => (
        <span className="text-sm font-medium text-gray-900 text-center block">
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handleViewDetails(row)}
            className={`p-1 ${tw.rounded} ${tw.textMuted} hover:text-gray-900 transition-colors`}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/dashboard/kpis/${extractNumericId(row.id)}/edit`, { state: { parentLabel: "All KPIs" } })}
            className={`p-1 ${tw.rounded} ${tw.textMuted} hover:text-gray-900 transition-colors`}
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <ActivateDeactivateButton
            isActive={row.is_active ?? true}
            onToggle={() => handleToggleStatus(row)}
            disabled={togglingKpiId === row.id}
            isLoading={togglingKpiId === row.id}
          />
          <button
            onClick={() => handleDeleteClick(row)}
            className={`p-1 ${tw.rounded} hover:text-red-700 transition-colors`}
            style={{ color: "#DC2626" }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
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
  } = useTable({
    tableId: "all-kpis-table",
    defaultColumns: tableColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, categoryFilter, tableHandlePageChange]);

  const extractNumericId = (kpiId: string): string => {
    return kpiId.split("-")[1] || kpiId;
  };

  const handleViewDetails = (kpi: typeof allKPIs[0]) => {
    navigate(`/dashboard/kpis/${kpi.id}`, { state: { parentLabel: "All KPIs" } });
  };

  const handleEdit = (kpi: typeof allKPIs[0]) => {
    const numericId = extractNumericId(kpi.id);

    if (kpi.category === "System Event") {
      navigate(`/dashboard/kpis/system-events/${numericId}`, { state: { parentLabel: "All KPIs" } });
    } else if (kpi.category === "Usage Metric") {
      navigate(`/dashboard/kpis/usage-metrics/${numericId}/edit`, { state: { parentLabel: "All KPIs" } });
    } else if (kpi.category === "Revenue Metric") {
      navigate(`/dashboard/kpis/revenue-metrics/${numericId}/edit`, { state: { parentLabel: "All KPIs" } });
    }
  };

  const handleDeleteClick = (kpi: typeof allKPIs[0]) => {
    setKpiToDelete({ id: kpi.id, name: kpi.name });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!kpiToDelete) return;

    setIsDeleting(true);
    try {
      await kpiService.deleteKPI(Number(kpiToDelete.id));
      showToast("success", `"${kpiToDelete.name}" has been deleted successfully`);
      setAllKPIs((prev) => prev.filter((k) => k.id !== kpiToDelete.id));
      setShowDeleteModal(false);
      setKpiToDelete(null);
    } catch (error) {
      console.error("Failed to delete KPI:", error);
      showToast("error", "Failed to delete KPI");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setKpiToDelete(null);
  };

  const handleToggleStatus = async (kpi: typeof allKPIs[0]) => {
    try {
      setTogglingKpiId(kpi.id);
      const newStatus = !(kpi.is_active ?? true);

      // Optimistic update
      setAllKPIs((prev) =>
        prev.map((k) =>
          k.id === kpi.id ? { ...k, is_active: newStatus } : k
        )
      );

      // Call API
      const numericId = Number(kpi.id.split('-')[1] || kpi.id);
      await kpiService.toggleKPIStatus(numericId, newStatus);

      showToast(
        "success",
        `KPI "${kpi.name}" has been ${newStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Failed to toggle KPI status:", error);
      showToast("error", "Failed to update KPI status. Please try again.");

      // Revert optimistic update on error
      setAllKPIs((prev) =>
        prev.map((k) =>
          k.id === kpi.id ? { ...k, is_active: !(kpi.is_active ?? true) } : k
        )
      );
    } finally {
      setTogglingKpiId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <FeatureActionButton featureId="kpi" action="create" />
      </div>
<p className={`text-sm ${tw.textSecondary}`}>
            View all available KPIs across all categories
          </p>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
              <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-wrap">
        <Input
          placeholder="Search KPIs..."
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
          placeholder="Filter by category"
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
            <span className={`${tw.textSecondary}`}>Loading KPIs...</span>
          </div>
        ) : filteredKPIs.length === 0 ? (
          <div className="text-center py-12">
            <ListChecks className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm || categoryFilter !== "all" ? "No KPIs found" : "No KPIs yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm || categoryFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first KPI"}
            </p>
          </div>
        ) : (
          <>
            <Table<typeof allKPIs[0]>
              columns={columns}
              data={filteredKPIs}
              totalItems={filteredKPIs.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={isLoading}
              onPageChange={tableHandlePageChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              expandedRowId={expandedRowId}
              onExpandChange={setExpandedRowId}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {expandedRowId && filteredKPIs.map((kpi) => {
              if (kpi.id === expandedRowId) {
                return (
                  <div key={`expanded-${kpi.id}`} className="overflow-hidden">
                    <KPIDetailsExpandedRow kpi={kpi} colSpan={columns.filter((c) => c.visible).length} />
                  </div>
                );
              }
              return null;
            })}
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredKPIs.length > 0 && (
        <Pagination
          currentPage={tableCurrentPage}
          pageSize={tablePageSize}
          totalItems={filteredKPIs.length}
          onPageChange={tableHandlePageChange}
          onPageSizeChange={tableHandlePageSizeChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete KPI"
        description="Are you sure you want to delete this KPI? This action cannot be undone."
        itemName={kpiToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete KPI"
        cancelText="Cancel"
      />
    </div>
  );
}
