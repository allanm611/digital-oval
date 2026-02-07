import { useState, useMemo } from "react";
import { Search, Eye,ListChecks, Activity, DollarSign,  ChevronLeft, ChevronRight } from "lucide-react";
import { generateAllKPIs } from "../utils/kpiGenerator";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import BackButton from "../../../shared/components/ui/BackButton";
import { useNavigate } from "react-router-dom";

const allKPIs = generateAllKPIs();

const ITEMS_PER_PAGE = 10;

export default function AllKPIsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const categories = Array.from(new Set(allKPIs.map((kpi) => kpi.category)));

  const filteredKPIs = useMemo(() => {
    return allKPIs.filter((kpi) => {
      const matchesSearch =
        kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kpi.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === "all" || kpi.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <BackButton fallbackTo="/dashboard/kpis" />
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>All KPIs</h1>
          <p className={`text-sm ${tw.textSecondary} mt-1`}>
            View all available KPIs across all categories
          </p>
        </div>
      </div>

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
              <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="text"
            placeholder="Search KPIs..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full ${tw.rounded} border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-gray-300 focus:outline-none focus:ring-0`}
          />
        </div>

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
        {filteredKPIs.length === 0 ? (
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
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Description
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Source
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
                          {kpi.subcategory ? kpi.subcategory.replace(/_/g, " ") : "-"}
                        </p>
                      </td>
                      <td
                        className="px-6 py-4 text-sm max-w-xs"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <p className="text-sm text-gray-900 truncate" title={kpi.description}>
                          {kpi.description}
                        </p>
                      </td>
                      <td
                        className="px-6 py-4 text-sm hidden lg:table-cell"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <p className="text-sm text-gray-900">{kpi.source}</p>
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-medium"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.accent}]/10 transition-all duration-300`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
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
                        <p className="text-xs text-gray-600 mt-1">{kpi.description}</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 text-gray-900">
                        {kpi.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {kpi.subcategory ? kpi.subcategory.replace(/_/g, " ") : "-"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Source:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {kpi.source}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        className={`p-2 ${tw.rounded} ${tw.textMuted} hover:bg-gray-100 transition-colors`}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
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
    </div>
  );
}
