import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Ban,
  CheckCircle,
  Clock,
  Eye,
  XCircle,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import ConfirmModal from "../../../shared/components/ui/ConfirmModal";
import DateFormatter from "../../../shared/components/DateFormatter";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import {
  Table,
  useTable,
  type TableColumn,
} from "../../../shared/components/Table";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { usePageTask } from "../../../shared/navigation/PageTaskProvider";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { loyaltyProgramService } from "../services/loyaltyProgramService";
import type {
  LoyaltyProgram,
  LoyaltyProgramStats,
  LoyaltyProgramStatus,
} from "../types/loyaltyProgram";
import { summarizeLoyaltyPrograms } from "../utils/loyaltyProgramMapper";

interface LoyaltyProgramRow {
  id: number;
  name: string;
  description: string;
  status: string;
  memberCount: number;
  startDate: string;
  endDate: string;
  lastModifiedBy: string;
  createdBy: string;
  cancelled: boolean;
}

const STATUS_OPTIONS: Array<{ value: LoyaltyProgramStatus | "all"; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
  { value: "draft", label: "Draft" },
];

export default function LoyaltyProgramsPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState<LoyaltyProgramStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LoyaltyProgramStatus | "all">("all");
  const [revision, setRevision] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<LoyaltyProgram | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const programsRef = useRef(programs);
  programsRef.current = programs;

  usePageTask({ task: "Loyalty Programs" });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const defaultColumns = useMemo<TableColumn<LoyaltyProgramRow>[]>(
    () => [
      {
        id: "name",
        label: "Name",
        visible: true,
        sortable: true,
        filterConfig: { type: "text" },
      },
      {
        id: "description",
        label: "Description",
        visible: true,
        sortable: true,
        filterConfig: { type: "text" },
        render: (value: string) => (
          <span className="block max-w-xs truncate" title={value}>
            {value || "—"}
          </span>
        ),
      },
      {
        id: "status",
        label: "Status",
        visible: true,
        sortable: true,
        filterConfig: {
          type: "select",
          options: ["active", "scheduled", "expired", "cancelled", "draft"],
        },
      },
      {
        id: "memberCount",
        label: "Member Count",
        visible: true,
        sortable: true,
        filterConfig: { type: "number" },
        render: (value: number) => value.toLocaleString(),
      },
      {
        id: "startDate",
        label: "Start Date",
        visible: true,
        sortable: true,
        filterConfig: { type: "date" },
        render: (value: string) =>
          value ? <DateFormatter date={value} /> : "—",
      },
      {
        id: "endDate",
        label: "End Date",
        visible: true,
        sortable: true,
        filterConfig: { type: "date" },
        render: (value: string) =>
          value ? <DateFormatter date={value} /> : "—",
      },
      {
        id: "lastModifiedBy",
        label: "Last Modified By",
        visible: true,
        sortable: true,
        filterConfig: { type: "text" },
      },
      {
        id: "createdBy",
        label: "Created By",
        visible: true,
        sortable: true,
        filterConfig: { type: "text" },
      },
      {
        id: "actions",
        label: "Actions",
        visible: true,
        sortable: false,
        isActionColumn: true,
        render: (_value, row) => (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="rounded p-0 text-gray-500 hover:text-gray-800"
              title="View program"
              onClick={() => navigate(`/dashboard/loyalty-programs/${row.id}`)}
            >
              <Eye className="h-4 w-4" />
            </button>
            {!row.cancelled && (
              <FeatureActionButton
                featureId="loyalty-programs"
                action="edit"
                itemId={row.id}
              />
            )}
            {!row.cancelled && (
              <button
                type="button"
                className="rounded p-0 text-gray-500 hover:text-gray-800"
                title="Cancel program"
                onClick={() => {
                  const program = programsRef.current.find(
                    (item) => item.id === row.id,
                  );
                  if (program) setCancelTarget(program);
                }}
              >
                <Ban className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
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
    resetPage,
    sortConfigs,
    handleSort,
  } = useTable<LoyaltyProgramRow>({
    tableId: "loyalty-programs",
    defaultColumns,
    persistToLocalStorage: true,
  });

  useEffect(() => {
    resetPage();
  }, [debouncedSearch, statusFilter, resetPage]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [listResult, statsResult] = await Promise.all([
          loyaltyProgramService.list({
            search: debouncedSearch,
            status: statusFilter,
            page: currentPage,
            limit: pageSize,
          }),
          loyaltyProgramService.getStats().catch(() => null),
        ]);
        if (cancelled) return;
        setPrograms(listResult.items);
        setTotal(listResult.total);
        if (statsResult) {
          setStats(statsResult);
        } else if (
          !listResult.serverPaginated &&
          !debouncedSearch &&
          statusFilter === "all"
        ) {
          setStats(summarizeLoyaltyPrograms(listResult.items));
        }
      } catch (error) {
        if (cancelled) return;
        setPrograms([]);
        setTotal(0);
        setLoadError(
          extractBackendError(error, "Could not load loyalty programs."),
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setStatsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [currentPage, debouncedSearch, pageSize, revision, statusFilter]);

  const rows = useMemo<LoyaltyProgramRow[]>(
    () =>
      programs.map((program) => ({
        id: program.id,
        name: program.name,
        description: program.description,
        status: program.status,
        memberCount: program.memberCount,
        startDate: program.startDate,
        endDate: program.endDate,
        lastModifiedBy: program.updatedBy,
        createdBy: program.createdBy,
        cancelled: program.status === "cancelled",
      })),
    [programs],
  );

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await loyaltyProgramService.cancel(cancelTarget.id, user?.user_id);
      success(`${cancelTarget.name} was cancelled.`);
      setCancelTarget(null);
      setRevision((value) => value + 1);
    } catch (error) {
      showError(extractBackendError(error, "Could not cancel the program."));
    } finally {
      setCancelling(false);
    }
  };

  const cards = [
    { name: "Total Programs", value: stats?.total, icon: Award },
    { name: "Active", value: stats?.active, icon: CheckCircle },
    { name: "Expired", value: stats?.expired, icon: Clock },
    { name: "Cancelled", value: stats?.cancelled, icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            Loyalty Programs
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Create programs, let customers register, and keep each program's
            bonus points separate for redemption.
          </p>
        </div>
        <FeatureActionButton
          featureId="loyalty-programs"
          action="create"
          label="Create Program"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" style={{ color: color.primary.accent }} />
                <p className="text-sm font-medium text-gray-600">{card.name}</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {statsLoading ? "…" : card.value == null ? "—" : card.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <SearchInput
          placeholder="Search programs..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <HeadlessSelect
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(value) =>
            setStatusFilter(String(value) as LoyaltyProgramStatus | "all")
          }
          placeholder="All Status"
          className="sm:w-56"
        />
      </div>

      {loadError ? (
        <div className={`${tw.rounded} border border-red-200 bg-white px-5 py-6 shadow-sm`}>
          <h2 className="text-base font-semibold text-gray-900">
            Loyalty programs could not be loaded
          </h2>
          <p className="mt-2 text-sm text-gray-600">{loadError}</p>
          <button
            type="button"
            className="mt-4 text-sm font-semibold text-gray-900"
            onClick={() => setRevision((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        <Table<LoyaltyProgramRow>
          columns={columns}
          data={rows}
          totalItems={total}
          currentPage={currentPage}
          pageSize={pageSize}
          isLoading={loading}
          onPageChange={handlePageChange}
          onSort={handleSort}
          sortConfigs={sortConfigs}
          onHideColumn={toggleColumn}
          onManageColumnsClick={() => setShowColumnPicker(true)}
        />
      )}

      {!loading && !loadError && rows.length === 0 && (
        <p className={`text-sm ${tw.textSecondary}`}>
          {debouncedSearch || statusFilter !== "all"
            ? "No loyalty programs match this filter."
            : "No loyalty programs yet. Create one to start registering customers."}
        </p>
      )}

      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetToDefaults={resetToDefaults}
      />

      <ConfirmModal
        isOpen={cancelTarget !== null}
        onClose={() => {
          if (!cancelling) setCancelTarget(null);
        }}
        onConfirm={confirmCancel}
        title="Cancel loyalty program"
        message={
          cancelTarget
            ? `Cancel ${cancelTarget.name}? The program stops accepting registrations and new bonus points. Existing balances keep the expiry already configured. This cannot be undone here.`
            : ""
        }
        type="warning"
        confirmText="Cancel program"
        cancelText="Keep program"
        isLoading={cancelling}
      />
    </div>
  );
}
