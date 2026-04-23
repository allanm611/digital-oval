import { useState, useEffect, useMemo } from "react";
import { Power, PowerOff } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination from "../../../shared/components/ui/Pagination";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { timezoneService } from "../services/timezoneService";
import { TimeZone } from "../types/timezone";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";

export default function TimezonesPage() {
  const { success: showSuccess, error: showError } = useToast();

  const [timezones, setTimezones] = useState<TimeZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    loadTimezones();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const loadTimezones = async () => {
    try {
      setLoading(true);
      const data = await timezoneService.getTimezones();
      setTimezones(data);
    } catch (err) {
      showError("Error", "Failed to load timezones");
    } finally {
      setLoading(false);
    }
  };

  const filteredTimezones = useMemo(() => {
    if (!Array.isArray(timezones)) {
      return [];
    }

    return timezones.filter((tz) => {
      if (!tz) return false;

      const value = tz.value ? tz.value.toLowerCase() : "";
      const label = tz.label ? tz.label.toLowerCase() : "";
      const searchLower = searchTerm ? searchTerm.toLowerCase() : "";

      const matchesSearch =
        value.includes(searchLower) || label.includes(searchLower);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && tz.is_active === true) ||
        (filterStatus === "inactive" && tz.is_active !== true);

      return matchesSearch && matchesStatus;
    });
  }, [timezones, searchTerm, filterStatus]);

  const paginatedTimezones = useMemo(() => {
    if (!Array.isArray(filteredTimezones)) {
      return [];
    }
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTimezones.slice(startIndex, endIndex);
  }, [filteredTimezones, currentPage, pageSize]);

  const handleToggleStatus = async (tz: TimeZone) => {
    if (!tz || !tz.id) return;

    const oldTimezones = timezones;

    try {
      setTogglingId(tz.id);
      const newStatus = !tz.is_active;

      setTimezones(
        timezones.map((t) =>
          t && t.id === tz.id ? { ...t, is_active: newStatus } : t
        )
      );

      await timezoneService.updateTimezone(tz.id, {
        is_active: newStatus,
      });

      if (tz.label) {
        showSuccess(
          `${tz.label} ${newStatus ? "activated" : "deactivated"} successfully`
        );
      }
    } catch (err) {
      setTimezones(oldTimezones);
      showError("Error", `Failed to update timezone status`);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <BackButton
          fallbackTo="/dashboard/configuration"
          showBreadcrumb={true}
          currentLabel="Timezones"
        />
      </div>

      {/* Description */}
      <div>
        <h1 className={`text-2xl font-bold ${tw.textPrimary} mb-2`}>
          Timezones
        </h1>
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage available timezones for your organization. Activate or deactivate timezones as needed.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search - 80% width */}
        <div className="flex-[0.8]">
          <SearchInput
            placeholder="Search by timezone or label..."
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
          />
        </div>

        {/* Status Filter - 20% width */}
        <div className="flex-[0.2] min-w-[180px]">
          <HeadlessSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            placeholder="Filter by Status"
          />
        </div>
      </div>

      {/* Table */}
      <div className={`${tw.rounded} border border-gray-200 overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredTimezones.length === 0 ? (
          <div className="text-center py-12">
            <h3 className={`text-sm ${tw.textPrimary} mb-2`}>
              No timezones found
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[1200px]"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopLeftRadius: "0.375rem",
                    }}
                  >
                    Timezone
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Value
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    UTC Offset
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Daylight Savings
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTimezones.map((tz) => {
                  if (!tz || !tz.id) return null;

                  return (
                    <tr key={tz.id} className="transition-colors">
                      <td
                        className="px-6 py-4"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                          borderTopLeftRadius: "0.375rem",
                          borderBottomLeftRadius: "0.375rem",
                        }}
                      >
                        <div className={`text-sm font-medium ${tw.textPrimary}`}>
                          {tz.label || "—"}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="text-sm text-black font-mono">
                          {tz.value || "—"}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="text-sm text-black">
                          {tz.utc_offset || "—"}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="text-sm text-black">
                          {tz.is_daylight_savings === true ? "Yes" : "No"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-center"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                          borderTopRightRadius: "0.375rem",
                          borderBottomRightRadius: "0.375rem",
                        }}
                      >
                        <button
                          onClick={() => handleToggleStatus(tz)}
                          disabled={togglingId === tz.id}
                          className={`p-2 ${
                            tz.is_active === true
                              ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          } ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={tz.is_active === true ? "Deactivate" : "Activate"}
                        >
                          {tz.is_active === true ? (
                            <Power className="w-4 h-4" />
                          ) : (
                            <PowerOff className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredTimezones.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredTimezones.length}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
