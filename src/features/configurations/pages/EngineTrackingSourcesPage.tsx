import { useState, useEffect, useMemo } from "react";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import Pagination, {
  DEFAULT_PAGE_SIZE,
} from "../../../shared/components/ui/Pagination";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw } from "../../../shared/utils/utils";
import {
  engineTrackingSourceService,
  type EngineTrackingSource,
} from "../services/engineTrackingSourceService";
import {
  ENGINE_TRACKING_SOURCE_TYPE_OPTIONS,
  activeCatalogFields,
  catalogFieldOperatorCount,
  engineSourceTypeLabel,
} from "../types/engineTrackingSource";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import {
  Table,
  useTable,
  type TableColumn,
} from "../../../shared/components/Table";

type StatusFilter = "" | "active" | "inactive";

export default function EngineTrackingSourcesPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const [sources, setSources] = useState<EngineTrackingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [sourceToDelete, setSourceToDelete] =
    useState<EngineTrackingSource | null>(null);

  const {
    deleteConfirm,
    isDeleting,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleDelete: confirmDeleteSource,
  } = useDeleteConfirm({
    onDelete: async (id) => {
      if (!sourceToDelete) return;
      await engineTrackingSourceService.delete(Number(id), { hard: true });
      setSources((prev) => prev.filter((s) => s.id !== Number(id)));
      showSuccess(`"${sourceToDelete.name}" has been deleted successfully.`);
    },
    itemLabel: "Tracking Source",
  });

  useEffect(() => {
    loadSources();
  }, [typeFilter]);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await engineTrackingSourceService.getAllWithSelectorConfig({
        source_type: typeFilter || undefined,
        limit: 500,
      });
      setSources(data);
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load tracking sources. Please try again.",
        ),
      );
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (source: EngineTrackingSource) => {
    setSourceToDelete(source);
    openDeleteConfirm(source.id, source.name);
  };

  const handleToggleActive = async (source: EngineTrackingSource) => {
    const newActive = !(source.isActive !== false);
    setTogglingId(source.id);
    setSources((prev) =>
      prev.map((s) =>
        s.id === source.id ? { ...s, isActive: newActive } : s,
      ),
    );

    try {
      await engineTrackingSourceService.update(source.id, {
        isActive: newActive,
      });
      showSuccess(
        newActive ? "Activated" : "Deactivated",
        newActive
          ? `${source.name} has been activated`
          : `${source.name} has been deactivated`,
      );
    } catch (err) {
      setSources((prev) =>
        prev.map((s) =>
          s.id === source.id ? { ...s, isActive: !newActive } : s,
        ),
      );
      showError(
        extractBackendError(
          err,
          "Failed to update tracking source status. Please try again.",
        ),
      );
    } finally {
      setTogglingId(null);
    }
  };

  const filteredSources = sources.filter((source) => {
    if (statusFilter === "active" && source.isActive === false) return false;
    if (statusFilter === "inactive" && source.isActive !== false) return false;
    const term = searchTerm.toLowerCase();
    return (
      !term ||
      source.name.toLowerCase().includes(term) ||
      source.code.toLowerCase().includes(term) ||
      source.sourceType.toLowerCase().includes(term) ||
      (source.description || "").toLowerCase().includes(term)
    );
  });

  const duplicateCodes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const source of sources) {
      const code = (source.code || "").trim().toLowerCase();
      if (!code) continue;
      counts.set(code, (counts.get(code) || 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([code]) => code);
  }, [sources]);

  const defaultColumns: TableColumn<EngineTrackingSource>[] = [
    { id: "name", label: "Name", visible: true },
    {
      id: "code",
      label: "Code",
      visible: true,
      render: (value) => (
        <span className="font-mono text-sm">{String(value)}</span>
      ),
    },
    {
      id: "sourceType",
      label: "Type",
      visible: true,
      render: (value) => engineSourceTypeLabel(String(value)),
    },
    {
      id: "attributionWindowHours",
      label: "Attribution (h)",
      visible: true,
    },
    {
      id: "cooldownHours",
      label: "Cooldown (h)",
      visible: true,
    },
    {
      id: "fields",
      label: "Fields",
      visible: true,
      sortable: false,
      render: (_value, source) => {
        const fields = activeCatalogFields(source);
        const ops = catalogFieldOperatorCount(fields);
        return (
          <span className="text-sm">
            {fields.length}
            {ops > 0 ? (
              <span className={`${tw.textMuted}`}> · {ops} ops</span>
            ) : fields.length > 0 ? (
              <span className={`${tw.textMuted}`}> · no ops</span>
            ) : null}
          </span>
        );
      },
    },
    {
      id: "isActive",
      label: "Status",
      visible: true,
      render: (value) => (
        <span
          className={`text-sm ${value !== false ? tw.success : tw.textMuted}`}
        >
          {value !== false ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (_value, source) => (
        <div className="flex items-center justify-center gap-2">
          <ActivateDeactivateButton
            isActive={source.isActive !== false}
            isLoading={togglingId === source.id}
            onToggle={() => handleToggleActive(source)}
          />
          <button
            onClick={() =>
              navigate(`/dashboard/tracking-sources/${source.id}/details`)
            }
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              navigate(`/dashboard/tracking-sources/${source.id}/edit`, {
                state: { from: "list" },
              })
            }
            className={`p-0 icon-edit ${tw.rounded} transition-all duration-200`}
            title="Edit source"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(source)}
            className={`p-0 icon-delete ${tw.rounded} transition-all duration-200`}
            title="Delete source"
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
    toggleColumn,
  } = useTable({
    tableId: "engine-tracking-sources-table-v2",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const paginatedSources = filteredSources.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize,
  );

  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, typeFilter, statusFilter, tableHandlePageChange]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <BackButton
            showBreadcrumb={true}
            parentLabel="Configuration"
            currentLabel="Tracking Sources"
            onClick={() => navigate("/dashboard/configuration")}
          />
          <FeatureActionButton
            featureId="tracking-sources"
            action="create"
            onClick={() => navigate("/dashboard/tracking-sources/create")}
          />
        </div>
        <p className={`text-sm ${tw.textSecondary}`}>
          Engine attribution catalog used by offer reward mappings.
        </p>
        {duplicateCodes.length > 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Duplicate source codes:{" "}
            {duplicateCodes.map((c) => (
              <code key={c} className="font-mono mr-2">
                {c}
              </code>
            ))}
            Offer matching keys off <span className="font-mono">code</span> can
            attach the wrong source. Keep codes unique.
          </p>
        ) : null}
      </div>

      <div className="my-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <SearchInput
            placeholder="Search by name, code, type..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <HeadlessSelect
          label=""
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "", label: "All source types" },
            ...ENGINE_TRACKING_SOURCE_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
          placeholder="Filter by type"
        />
        <HeadlessSelect
          label=""
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          options={[
            { value: "", label: "All statuses" },
            { value: "active", label: "Active only" },
            { value: "inactive", label: "Inactive only" },
          ]}
          placeholder="Filter by status"
        />
      </div>

      <div className={`${tw.rounded} overflow-hidden`}>
        {filteredSources.length === 0 && !loading ? (
          <div className="text-center py-12">
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm || typeFilter || statusFilter
                ? "No tracking sources found"
                : "No tracking sources yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm || typeFilter || statusFilter
                ? "Try adjusting your search or filter"
                : "Create engine tracking sources before binding offer rewards"}
            </p>
            {!searchTerm && !typeFilter && !statusFilter && (
              <FeatureActionButton
                featureId="tracking-sources"
                action="create"
                onClick={() => navigate("/dashboard/tracking-sources/create")}
                className="mx-auto"
              />
            )}
          </div>
        ) : (
          <>
            <Table<EngineTrackingSource>
              columns={columns}
              data={paginatedSources}
              totalItems={filteredSources.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={loading}
              onPageChange={tableHandlePageChange}
              onPageSizeChange={tableHandlePageSizeChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              getRowId={(row) => String(row.id)}
              onHideColumn={toggleColumn}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {paginatedSources.length > 0 && filteredSources.length > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={tableCurrentPage}
                  pageSize={tablePageSize}
                  totalItems={filteredSources.length}
                  onPageChange={tableHandlePageChange}
                  onPageSizeChange={tableHandlePageSizeChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDeleteSource}
        title="Delete Tracking Source"
        description="This permanently deletes the tracking source. This action cannot be undone. Sources referenced by conversion rules or reward mappings cannot be deleted — deactivate them instead."
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
      />
    </div>
  );
}
