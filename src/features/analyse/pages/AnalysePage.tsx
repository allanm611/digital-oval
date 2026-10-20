import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Download, Edit, Eye, Layers, Plus, Search, Star, Trash2, Users } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import ConfirmModal from "../../../shared/components/ui/ConfirmModal";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination from "../../../shared/components/ui/Pagination";
import DateFormatter from "../../../shared/components/DateFormatter";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import {
  Table,
  useTable,
  type TableColumn,
} from "../../../shared/components/Table";
import { button, color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { usePageTask } from "../../../shared/navigation/PageTaskProvider";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { analysisService } from "../services/analysisService";
import type { AnalysisRecord, AnalysisStats } from "../types/analysis";
import { audienceSourceLabel } from "../utils/analysisDefinition";
import CloneAnalysisModal from "../components/CloneAnalysisModal";

interface AnalysisRow {
  id: number;
  name: string;
  description: string;
  audience: string;
  size: string;
  favourite: string;
  updatedAt: string;
}

const FAVOURITE_OPTIONS = [
  { value: "all", label: "All analyses" },
  { value: "favourites", label: "Favourites" },
];

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All customer bases" },
  { value: "new", label: "New" },
  { value: "existing", label: "Existing" },
  { value: "saved_segments", label: "Saved segments" },
];

type AudienceFilter = "all" | "new" | "existing" | "saved_segments";

export default function AnalysePage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [favouriteFilter, setFavouriteFilter] = useState<"all" | "favourites">("all");
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("all");
  const [rows, setRows] = useState<AnalysisRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<AnalysisStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [cloneTarget, setCloneTarget] = useState<AnalysisRecord | null>(null);
  const [cloning, setCloning] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnalysisRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const rowsRef = useRef<AnalysisRecord[]>([]);
  rowsRef.current = rows;

  usePageTask({ task: "Analyse" });

  const toggleFavourite = useCallback(
    async (record: AnalysisRecord) => {
      try {
        await analysisService.setFavourite(record.id, !record.isFavourite);
        setRevision((value) => value + 1);
      } catch (error) {
        showError(extractBackendError(error, "The favourite could not be updated."));
      }
    },
    [showError],
  );
  const toggleFavouriteRef = useRef(toggleFavourite);
  toggleFavouriteRef.current = toggleFavourite;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const defaultColumns = useMemo<TableColumn<AnalysisRow>[]>(
    () => [
      { id: "name", label: "Name", visible: true, sortable: true },
      { id: "audience", label: "Customer base", visible: true, sortable: true },
      { id: "size", label: "Size", visible: true, sortable: true },
      { id: "favourite", label: "Favourite", visible: true, sortable: true },
      {
        id: "updatedAt",
        label: "Updated",
        visible: true,
        sortable: true,
        render: (value) => <DateFormatter date={value} useUserTimezone />,
      },
      {
        id: "actions",
        label: "Actions",
        visible: true,
        sortable: false,
        isActionColumn: true,
        render: (_value, row) => {
          const record = rowsRef.current.find((item) => item.id === row.id);
          if (!record) return null;
          return (
            <div className="flex items-center justify-center space-x-2">
              <button
                type="button"
                title="View results"
                className="p-0 rounded icon-edit"
                onClick={() =>
                  navigate(`/dashboard/analytics/analyse/${record.id}/results`)
                }
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Edit analysis"
                className={`group p-0 ${tw.rounded} ${tw.textMuted} hover:bg-gray-100 transition-all duration-300`}
                onClick={() => navigate(`/dashboard/analytics/analyse/${record.id}`)}
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                type="button"
                title={record.isFavourite ? "Remove favourite" : "Make favourite"}
                className={`p-0 rounded ${record.isFavourite ? "text-amber-500" : tw.textMuted} hover:bg-gray-100`}
                onClick={() => toggleFavouriteRef.current(record)}
              >
                <Star className={`h-4 w-4 ${record.isFavourite ? "fill-current" : ""}`} />
              </button>
              <button
                type="button"
                title="Clone analysis"
                className={`p-0 rounded ${tw.textMuted} hover:bg-gray-100`}
                onClick={() => setCloneTarget(record)}
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Delete analysis"
                className="p-0 rounded text-gray-500 hover:text-red-600"
                onClick={() => setDeleteTarget(record)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [navigate],
  );

  const {
    columns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
  } = useTable<AnalysisRow>({
    tableId: "analyses",
    defaultColumns,
    persistToLocalStorage: true,
  });

  useEffect(() => {
    resetPage();
  }, [debouncedSearch, favouriteFilter, audienceFilter, resetPage]);

  const load = useCallback(async () => {
    setLoading(true);
    setStatsLoading(true);
    setLoadError(null);
    try {
      const [result, nextStats] = await Promise.all([
        analysisService.list({
          search: debouncedSearch,
          favouritesOnly: favouriteFilter === "favourites",
          audienceSource: audienceFilter,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
        }),
        analysisService.stats(),
      ]);
      setRows(result.items);
      setTotal(result.total);
      setStats(nextStats);
    } catch (error) {
      setRows([]);
      setTotal(0);
      setLoadError(extractBackendError(error, "Analyses could not be loaded."));
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [audienceFilter, currentPage, debouncedSearch, favouriteFilter, pageSize]);

  useEffect(() => {
    load();
  }, [load, revision]);

  const confirmClone = async (input: {
    name: string;
    description: string;
    isFavourite: boolean;
    countIndividualAsRecipient: boolean;
    uniqueIdentifier: string | null;
  }) => {
    if (!cloneTarget) return;
    setCloning(true);
    try {
      const created = await analysisService.clone(cloneTarget.id, {
        ...input,
        createdByUserId: user?.user_id,
      });
      success(`${created.name} was created.`);
      setCloneTarget(null);
      setRevision((value) => value + 1);
    } catch (error) {
      showError(extractBackendError(error, "The analysis could not be cloned."));
    } finally {
      setCloning(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await analysisService.remove(deleteTarget.id);
      success(`${deleteTarget.name} was deleted.`);
      setDeleteTarget(null);
      setRevision((value) => value + 1);
    } catch (error) {
      showError(extractBackendError(error, "The analysis could not be deleted."));
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const result = await analysisService.list({
        search: debouncedSearch,
        favouritesOnly: favouriteFilter === "favourites",
        audienceSource: audienceFilter,
        limit: 10000,
        offset: 0,
      });
      if (result.items.length === 0) {
        showError("There are no analyses to export.");
        return;
      }
      const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const lines = [
        ["Name", "Customer base", "Size", "Favourite", "Updated"].join(","),
        ...result.items.map((item) =>
          [
            escape(item.name),
            escape(audienceSourceLabel(item.audienceSource)),
            item.sizeEstimate == null ? "" : String(item.sizeEstimate),
            item.isFavourite ? "Yes" : "No",
            escape(item.updatedAt || ""),
          ].join(","),
        ),
      ];
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "analyses.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showError(extractBackendError(error, "The analyses could not be exported."));
    }
  };

  const statsCards = [
    { name: "Total analyses", value: stats?.total ?? 0, icon: Search },
    { name: "Favourites", value: stats?.favourites ?? 0, icon: Star },
    { name: "New rules", value: stats?.newAudiences ?? 0, icon: Users },
    { name: "Saved bases", value: stats?.savedBases ?? 0, icon: Layers },
  ];

  const tableRows = useMemo<AnalysisRow[]>(
    () =>
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        audience: audienceSourceLabel(row.audienceSource),
        size: row.sizeEstimate == null ? "—" : row.sizeEstimate.toLocaleString(),
        favourite: row.isFavourite ? "Yes" : "No",
        updatedAt: row.updatedAt || "",
      })),
    [rows],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>Analyse</h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Build a customer base from a new rule, an existing segment, or a
            saved segment, then open the results for that audience.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/dashboard/analytics/analyse/new")}
          className={`inline-flex items-center px-4 py-2.5 font-semibold ${tw.rounded} shadow-sm text-sm whitespace-nowrap text-white transition-all duration-200 hover:shadow-md active:shadow-sm`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="h-5 w-5 mr-2" />
          Create
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" style={{ color: color.primary.accent }} />
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {statsLoading ? "..." : stat.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          placeholder="Search analyses..."
          value={search}
          onChange={setSearch}
        />
        <HeadlessSelect
          options={AUDIENCE_OPTIONS}
          value={audienceFilter}
          onChange={(value) =>
            setAudienceFilter(
              value === "new" || value === "existing" || value === "saved_segments"
                ? value
                : "all",
            )
          }
          placeholder="All customer bases"
        />
        <HeadlessSelect
          options={FAVOURITE_OPTIONS}
          value={favouriteFilter}
          onChange={(value) =>
            setFavouriteFilter(value === "favourites" ? "favourites" : "all")
          }
          placeholder="All analyses"
        />
        <button
          type="button"
          onClick={handleExportCSV}
          className={`flex items-center gap-2 ${tw.rounded} transition-colors font-medium`}
          style={{
            backgroundColor: button.action.background,
            color: button.action.color,
            border: button.action.border,
            padding: `${button.action.paddingY} ${button.action.paddingX}`,
            borderRadius: button.action.borderRadius,
            fontSize: button.action.fontSize,
          }}
          title="Download as CSV"
        >
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </button>
      </div>

      {loadError && <p className={`text-sm ${tw.textDanger}`}>{loadError}</p>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner variant="modern" size="xl" color="primary" className="mb-4" />
          <p className={`${tw.textMuted} font-medium text-sm`}>Loading analyses...</p>
        </div>
      ) : tableRows.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className={tw.textSecondary}>
              {debouncedSearch || favouriteFilter === "favourites" || audienceFilter !== "all"
                ? "No analyses found"
                : "No analyses yet"}
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard/analytics/analyse/new")}
                className={`inline-flex items-center px-4 py-2.5 font-semibold ${tw.rounded} shadow-sm text-sm whitespace-nowrap text-white`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create
              </button>
            </div>
          </div>
        </div>
      ) : (
        <Table<AnalysisRow>
          columns={columns}
          data={tableRows}
          totalItems={total}
          currentPage={currentPage}
          pageSize={pageSize}
          isLoading={loading}
          onPageChange={handlePageChange}
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

      {!loading && tableRows.length > 0 && total > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetToDefaults={resetToDefaults}
      />

      <CloneAnalysisModal
        analysis={cloneTarget}
        isSaving={cloning}
        onClose={() => {
          if (!cloning) setCloneTarget(null);
        }}
        onConfirm={confirmClone}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Delete analysis"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.name}? The customer segments it points at stay in Segment Management.`
            : ""
        }
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleting}
      />
    </div>
  );
}
