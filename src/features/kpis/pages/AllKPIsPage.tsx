import { useState, useMemo, useEffect } from "react";
import { Eye, Edit, Trash2, ListChecks, Activity, DollarSign, ChevronLeft, ChevronRight, Users } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import CreateButton from "../../../shared/components/ui/CreateButton";
import { usageMetricService } from "../services/usageMetricService";
import { revenueMetricService } from "../services/revenueMetricService";
import { systemEventService } from "../services/systemEventService";
import { segmentService } from "../../segments/services/segmentService";
import { type KPI } from "../types/kpi";

const ITEMS_PER_PAGE = 10;

export default function AllKPIsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [allKPIs, setAllKPIs] = useState<KPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadAllKPIs();
  }, []);

  const loadAllKPIs = async () => {
    setIsLoading(true);
    try {
      const [usageMetrics, revenueMetrics, systemEvents, segmentationResponse] = await Promise.all([
        usageMetricService.getAllMetrics(),
        revenueMetricService.getAllMetrics(),
        systemEventService.getAllEvents(),
        segmentService.getSegmentationFields(true),
      ]);

      const kpis: KPI[] = [];

      // Add subscriber profiles from Customer 360 sub-categories
      if (segmentationResponse && segmentationResponse.success && segmentationResponse.data && segmentationResponse.data.length > 0) {
        const config = segmentationResponse.data[0]?.field_selector_config || [];
        const customer360Category = config.find(
          (cat: any) => cat.value === "customer_360" || cat.value === "customer_identity"
        );

        if (customer360Category && customer360Category.sub_categories) {
          customer360Category.sub_categories.forEach((subCat: any) => {
            if (subCat.fields && Array.isArray(subCat.fields)) {
              subCat.fields.forEach((field: any, idx: number) => {
                kpis.push({
                  id: `sp-${field.id || idx + 1}`,
                  name: field.field_name || field.name || "",
                  category: "Subscriber Profile",
                  subcategory: subCat.display_name || subCat.name || "",
                  description: field.field_description || field.description || "",
                  source: "Subscriber Profiles",
                  field_type: field.field_type || "",
                });
              });
            }
          });
        }
      }

      systemEvents.forEach((event, idx) => {
        kpis.push({
          id: `se-${event.id || idx + 1}`,
          name: event.name || event.event_name || "",
          category: "System Event",
          subcategory: event.category || "",
          description: event.description || event.event_description || "",
          source: "System Events",
          field_type: "",
        });
      });

      revenueMetrics.forEach((metric, idx) => {
        kpis.push({
          id: `rm-${metric.id || idx + 1}`,
          name: metric.name || "",
          category: "Revenue Metric",
          subcategory: metric.category || "",
          description: metric.description || "",
          source: "Revenue Metrics",
          field_type: metric.field_type || "",
        });
      });

      usageMetrics.forEach((metric, idx) => {
        kpis.push({
          id: `um-${metric.id || idx + 1}`,
          name: metric.name || "",
          category: "Usage Metric",
          subcategory: metric.category || "",
          description: metric.description || "",
          source: "Usage Metrics",
          field_type: metric.field_type || "",
        });
      });

      setAllKPIs(kpis);
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

  const totalPages = Math.ceil(filteredKPIs.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedKPIs = filteredKPIs.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value || "all");
    setCurrentPage(1);
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

  const extractNumericId = (kpiId: string): string => {
    return kpiId.split("-")[1] || kpiId;
  };

  const handleViewDetails = (kpi: typeof allKPIs[0]) => {
    const numericId = extractNumericId(kpi.id);

    if (kpi.category === "System Event") {
      navigate(`/dashboard/kpis/system-events/${numericId}`, { state: { parentLabel: "All KPIs" } });
    } else if (kpi.category === "Usage Metric") {
      navigate(`/dashboard/kpis/usage-metrics/${numericId}`, { state: { parentLabel: "All KPIs" } });
    } else if (kpi.category === "Revenue Metric") {
      navigate(`/dashboard/kpis/revenue-metrics/${numericId}`, { state: { parentLabel: "All KPIs" } });
    }
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
      // TODO: Call the appropriate delete service based on category
      // For now, just show a message
      showToast("info", `Delete functionality for "${kpiToDelete.name}" will be implemented soon`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <BackButton fallbackTo="/dashboard/kpis" />
        <CreateButton route="/dashboard/kpis/create" />
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
            setCurrentPage(1);
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
      <div
        className={`${tw.rounded} border overflow-hidden`}
        style={{ borderColor: color.border.default }}
      >
        {isLoading ? (
          <div className="p-8 md:p-16 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <LoadingSpinner
                size="xl"
                color="primary"
              />
              <p className={`${tw.textMuted} font-medium text-sm`}>
                Loading KPIs...
              </p>
            </div>
          </div>
        ) : filteredKPIs.length === 0 ? (
          <div className="p-8 md:p-16 text-center">
            <div className={`bg-gradient-to-br from-[${color.primary.accent}]/5 to-[${color.primary.accent}]/10 ${tw.rounded} p-6 md:p-12`}>
              <h3 className={`${tw.cardHeading} ${tw.textPrimary} mb-1`}>No KPIs found</h3>
              <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                {searchTerm || categoryFilter !== "all"
                  ? "No KPIs match your search criteria."
                  : "No KPIs available."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table
                className="w-full"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
                <thead style={{ background: color.surface.tableHeader }}>
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      KPI Name
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Category
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Type
                    </th>
                    <th
                      className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedKPIs.map((kpi) => (
                    <tr key={kpi.id} className="transition-colors">
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div>
                          <div
                            className="font-semibold text-sm text-gray-900 truncate"
                            title={kpi.name}
                          >
                            {kpi.name}
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-gray-900">
                          {kpi.category}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <p className="text-sm text-gray-700">
                          {kpi.field_type ? kpi.field_type.charAt(0).toUpperCase() + kpi.field_type.slice(1) : "-"}
                        </p>
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-medium"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(kpi)}
                            className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.accent}]/10 transition-all duration-300`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(kpi)}
                            className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.accent}]/10 transition-all duration-300`}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(kpi)}
                            className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-red-100 transition-all duration-300`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden space-y-3 p-4">
              {paginatedKPIs.map((kpi) => (
                <div
                  key={kpi.id}
                  className={`${tw.rounded} border p-4`}
                  style={{
                    backgroundColor: color.surface.tablebodybg,
                    borderColor: color.border.default,
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {kpi.name}
                        </h4>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 text-gray-900">
                        {kpi.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {kpi.field_type ? kpi.field_type.charAt(0).toUpperCase() + kpi.field_type.slice(1) : "-"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleViewDetails(kpi)}
                        className={`p-2 ${tw.rounded} ${tw.textMuted} hover:bg-gray-100 transition-colors`}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(kpi)}
                        className={`p-2 ${tw.rounded} ${tw.textMuted} hover:bg-gray-100 transition-colors`}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(kpi)}
                        className={`p-2 ${tw.rounded} hover:bg-red-100 transition-colors`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: color.border.default, backgroundColor: color.surface.tablebodybg }}>
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{startIdx + 1}</span> to <span className="font-medium">{Math.min(startIdx + ITEMS_PER_PAGE, filteredKPIs.length)}</span> of <span className="font-medium">{filteredKPIs.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 ${tw.rounded} transition-colors ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  title="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-sm text-gray-600">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 ${tw.rounded} transition-colors ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  title="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

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
