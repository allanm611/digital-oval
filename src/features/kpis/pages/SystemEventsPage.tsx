import { useState, useMemo } from "react";
import { Search, Filter, Eye, ListChecks, Zap } from "lucide-react";
import { SYSTEM_EVENTS, SYSTEM_EVENT_CATEGORIES } from "../types/systemEvent";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination from "../../../shared/components/ui/Pagination";
import BackButton from "../../../shared/components/ui/BackButton";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 10;

export default function SystemEventsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEvents = useMemo(() => {
    return SYSTEM_EVENTS.filter((event) => {
      const matchesSearch =
        event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.event_description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        event.event_code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || event.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE,
  );

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value || "all");
    setCurrentPage(1);
  };

  // Calculate statistics
  const stats = {
    totalEvents: SYSTEM_EVENTS.length,
    email: SYSTEM_EVENTS.filter((e) => e.category === "email").length,
    sms: SYSTEM_EVENTS.filter((e) => e.category === "sms").length,
    campaign: SYSTEM_EVENTS.filter((e) => e.category === "campaign").length,
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
    { value: "all", label: "All Categories" },
    ...SYSTEM_EVENT_CATEGORIES.map((cat) => ({
      value: cat.value,
      label: cat.label,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackButton fallbackTo="/dashboard/kpis" showBreadcrumb={true} currentLabel="System Events" />

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
        <div className="relative flex-1 min-w-[250px]">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="text"
            placeholder="Search events by name or code..."
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
        {filteredEvents.length === 0 ? (
          <div className="p-8 md:p-16 text-center">
            <div
              className={`bg-gradient-to-br from-[${color.primary.accent}]/5 to-[${color.primary.accent}]/10 ${tw.rounded} p-6 md:p-12`}
            >
              <h3 className={`${tw.cardHeading} ${tw.textPrimary} mb-1`}>
                No events found
              </h3>
              <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                {searchTerm || categoryFilter !== "all"
                  ? "No events match your search criteria."
                  : "No events available."}
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
                      Event Name
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Event Code
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
                  {paginatedEvents.map((event) => (
                    <tr key={event.id} className="transition-colors">
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div
                          className="font-semibold text-sm text-gray-900 truncate"
                          title={event.event_name}
                        >
                          {event.event_name}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="font-mono text-gray-900">
                          {event.event_code}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-gray-900">
                          {SYSTEM_EVENT_CATEGORIES.find(
                            (cat) => cat.value === event.category,
                          )?.label || event.category}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm max-w-xs"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <p
                          className="text-sm text-gray-900 truncate"
                          title={event.event_description}
                        >
                          {event.event_description}
                        </p>
                      </td>
                      <td
                        className="px-6 py-4 text-sm hidden lg:table-cell"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <p className="text-sm text-gray-900">
                          {event.source_table}
                        </p>
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-medium"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboard/kpis/system-events/${event.id}`,
                              )
                            }
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
              {paginatedEvents.map((event) => (
                <div
                  key={event.id}
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
                          {event.event_name}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 font-mono">
                          {event.event_code}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {event.event_description}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 text-gray-900">
                        {SYSTEM_EVENT_CATEGORIES.find(
                          (cat) => cat.value === event.category,
                        )?.label || event.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">Source:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {event.source_table}
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

            {filteredEvents.length > 0 && paginatedEvents.length > 0 && (
              <Pagination
                currentPage={currentPage}
                pageSize={ITEMS_PER_PAGE}
                totalItems={filteredEvents.length}
                onPageChange={setCurrentPage}
                maxPages={totalPages}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
