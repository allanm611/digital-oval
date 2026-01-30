import { useState, useMemo } from "react";
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, ListChecks, Activity, DollarSign, Smartphone } from "lucide-react";
import { dummyKPIs } from "../types/dummyData";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

export default function KPIsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Get unique categories
  const categories = Array.from(new Set(dummyKPIs.map((kpi) => kpi.category)));

  // Filter KPIs based on search and category
  const filteredKPIs = useMemo(() => {
    return dummyKPIs.filter((kpi) => {
      const matchesSearch =
        kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kpi.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === "all" || kpi.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

  // Calculate statistics
  const stats = {
    totalKPIs: dummyKPIs.length,
    systemEvents: dummyKPIs.filter((k) => k.category === "System Event").length,
    usageMetrics: dummyKPIs.filter((k) => k.category === "Usage Metric").length,
    revenueMetrics: dummyKPIs.filter((k) => k.category === "Revenue Metric").length,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>KPIs</h1>
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage and view all available KPIs for segment building
        </p>
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="text"
            placeholder="Search KPIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${tw.rounded} border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-gray-300 focus:outline-none focus:ring-0`}
          />
        </div>

        <HeadlessSelect
          options={[
            { value: "all", label: "All Categories" },
            ...categories.map((cat) => ({ value: cat, label: cat })),
          ]}
          value={categoryFilter}
          onChange={(value) => setCategoryFilter(value || "all")}
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
                  {filteredKPIs.map((kpi) => (
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
                          <button
                            className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.accent}]/10 transition-all duration-300`}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.accent}]/10 transition-all duration-300`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
              {filteredKPIs.map((kpi) => (
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
                      <button
                        className={`p-2 ${tw.rounded} ${tw.textMuted} hover:bg-gray-100 transition-colors`}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className={`p-2 ${tw.rounded} ${tw.textMuted} hover:bg-gray-100 transition-colors`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
