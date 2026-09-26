import { useEffect, useMemo, useState } from "react";
import { CreditCard, RotateCcw, ShieldCheck, Smartphone } from "lucide-react";
import DateFormatter from "../../../shared/components/DateFormatter";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, {
  DEFAULT_PAGE_SIZE,
} from "../../../shared/components/ui/Pagination";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { Table, type TableColumn } from "../../../shared/components/Table";
import { color, tw } from "../../../shared/utils/utils";
import { useCustomerAccountDevices } from "../hooks/useCustomerAccountDevices";
import type {
  CustomerAccountDeviceStatus,
  CustomerInventoryItem,
  CustomerVerificationFlag,
} from "../types/customerAccountDevice";
import {
  filterInventory,
  humanizeDeviceType,
  humanizeInventoryKind,
  humanizeInventoryStatus,
  humanizeVerificationFlag,
  uniqueInventoryKinds,
  uniqueInventoryStatuses,
} from "../utils/customerAccountDeviceHelpers";
import CustomerAccountDeviceDetailsExpandedRow from "./CustomerAccountDeviceDetailsExpandedRow";

type CustomerAccountDevicesTabProps = {
  subscriberId?: string | number | null;
  customerRecord?: Record<string, unknown> | null;
};

const ALL = "all";

function statusClassName(status: CustomerAccountDeviceStatus): string {
  if (status === "active") return "bg-green-50 text-green-800";
  if (status === "suspended") return "bg-amber-50 text-amber-800";
  if (status === "inactive") return "bg-slate-100 text-slate-800";
  if (status === "closed") return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-500";
}

function verificationClassName(flag: CustomerVerificationFlag): string {
  if (flag === "verified") return "bg-green-100 text-green-800";
  if (flag === "unverified") return "bg-gray-100 text-gray-800";
  return "bg-gray-100 text-gray-500";
}

function progressLabel(phase: "lookup" | "events"): string {
  if (phase === "lookup") return "Checking subscriber accounts and devices...";
  return "Checking live login and device events...";
}

function SnapshotField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${tw.rounded} border border-gray-100 px-4 py-3`}
      style={{ backgroundColor: "var(--c-readonly-field-bg)" }}
    >
      <p className="text-xs uppercase text-gray-500 mb-1">{label}</p>
      <div className="text-sm font-semibold text-gray-900">{children}</div>
    </div>
  );
}

export default function CustomerAccountDevicesTab({
  subscriberId,
  customerRecord,
}: CustomerAccountDevicesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kind, setKind] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const pageSize = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const { result, progress, isLoading, error, refetch } =
    useCustomerAccountDevices(subscriberId ?? undefined, customerRecord);

  const snapshot = result.snapshot;

  const filtered = useMemo(
    () =>
      filterInventory(result.items, {
        search: debouncedSearch,
        kind,
        status,
      }),
    [result.items, debouncedSearch, kind, status],
  );

  useEffect(() => {
    setPage(1);
    setExpandedRowId(null);
  }, [debouncedSearch, kind, status, subscriberId]);

  const filtersActive =
    Boolean(debouncedSearch.trim()) || kind !== ALL || status !== ALL;

  const kindOptions = useMemo(
    () => [
      { value: ALL, label: "All types" },
      ...uniqueInventoryKinds(result.items).map((item) => ({
        value: item,
        label: humanizeInventoryKind(item),
      })),
    ],
    [result.items],
  );

  const statusOptions = useMemo(
    () => [
      { value: ALL, label: "All statuses" },
      ...uniqueInventoryStatuses(result.items).map((item) => ({
        value: item,
        label: humanizeInventoryStatus(item),
      })),
    ],
    [result.items],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const columns: TableColumn<CustomerInventoryItem>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Identifier",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[140px]">
            <p className={`text-sm font-medium ${tw.tableFirstColumn}`}>
              {row.name}
            </p>
            {row.isPrimary ? (
              <p className="text-xs text-gray-500 mt-0.5">Primary</p>
            ) : row.kind === "account" && row.subtype === "alternate" ? (
              <p className="text-xs text-gray-500 mt-0.5">Alternate</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "kind",
        label: "Type",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-700">
            {row.kind === "device"
              ? humanizeDeviceType(row.deviceType)
              : humanizeInventoryKind(row.kind)}
          </span>
        ),
      },
      {
        id: "status",
        label: "Status",
        visible: true,
        render: (_, row) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClassName(
              row.status,
            )}`}
          >
            {humanizeInventoryStatus(row.status)}
            {row.verification === "hint" ? " · Unverified" : ""}
          </span>
        ),
      },
      {
        id: "lastSeen",
        label: "Last activity",
        visible: true,
        render: (_, row) =>
          row.lastSeenAt ? (
            <DateFormatter
              date={row.lastSeenAt}
              includeTime
              useUserTimezone
              className="text-sm text-gray-700"
            />
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
    ],
    [],
  );

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setKind(ALL);
    setStatus(ALL);
  };

  if (!subscriberId) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-sm">No customer selected</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Account & Device
          </h3>
          <p className="text-sm text-gray-500">
            SIM accounts and registered devices for this customer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 ${tw.rounded} hover:bg-gray-50`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Accounts
            </p>
            <CreditCard className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.counts.accounts.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "SIM and subscription lines"
              : snapshot.msisdn
                ? `Primary ${snapshot.msisdn}`
                : "SIM and subscription lines"}
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Devices
            </p>
            <Smartphone className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : result.counts.devices.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "Registered and last-used devices"
              : snapshot.lastActivityDeviceName
                ? `Last used ${snapshot.lastActivityDeviceName}`
                : "No device registration on file"}
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Last login
            </p>
            <ShieldCheck className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {isLoading ? (
              "—"
            ) : snapshot.lastLoginAt ? (
              <DateFormatter
                date={snapshot.lastLoginAt}
                includeTime
                useUserTimezone
                className="text-lg font-semibold text-gray-900"
              />
            ) : (
              "—"
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isLoading
              ? "From live login events"
              : snapshot.lastLoginAt
                ? "From login events or the subscriber record"
                : "No login event on file"}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          Account status
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SnapshotField label="Status">
            {isLoading ? "—" : humanizeInventoryStatus(snapshot.status)}
          </SnapshotField>
          <SnapshotField label="Account created">
            {isLoading ? (
              "—"
            ) : snapshot.createdAt ? (
              <DateFormatter
                date={snapshot.createdAt}
                includeTime
                useUserTimezone
              />
            ) : (
              "—"
            )}
          </SnapshotField>
          <SnapshotField label="Account ID">
            {isLoading ? "—" : snapshot.accountId || "—"}
          </SnapshotField>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          Device information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SnapshotField label="Primary device">
            {isLoading ? "—" : snapshot.primaryDeviceName || "—"}
          </SnapshotField>
          <SnapshotField label="OS version">
            {isLoading ? "—" : snapshot.primaryOs || "—"}
          </SnapshotField>
          <SnapshotField label="App version">
            {isLoading ? "—" : snapshot.primaryAppVersion || "—"}
          </SnapshotField>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          Verification status
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(
            [
              ["Email verified", snapshot.emailVerified],
              ["Phone verified", snapshot.phoneVerified],
              ["KYC verified", snapshot.kycVerified],
            ] as Array<[string, CustomerVerificationFlag]>
          ).map(([label, flag]) => (
            <div
              key={label}
              className={`${tw.rounded} border border-gray-100 px-4 py-3`}
              style={{ backgroundColor: "var(--c-readonly-field-bg)" }}
            >
              <p className="text-xs uppercase text-gray-500 mb-2">{label}</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${verificationClassName(
                  flag,
                )}`}
              >
                {isLoading ? "—" : humanizeVerificationFlag(flag)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          Accounts and devices
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchInput
            placeholder="Search MSISDN, ICCID, IMEI, or device..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <HeadlessSelect
            value={kind}
            onChange={(value) => setKind(String(value))}
            options={kindOptions}
            placeholder="Type"
            className="w-full"
          />
          <HeadlessSelect
            value={status}
            onChange={(value) => setStatus(String(value))}
            options={statusOptions}
            placeholder="Status"
            className="w-full"
          />
        </div>
      </div>

      {filtersActive && (
        <div className="mb-4">
          <button
            type="button"
            onClick={clearFilters}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 ${tw.rounded} hover:bg-gray-50`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset filters
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {result.warnings.length > 0 && !isLoading && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {result.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner variant="modern" size="lg" color="primary" />
          <p className="mt-3 text-sm text-gray-500">
            {progressLabel(progress.phase)}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-gray-200 rounded-md">
          <p className="text-gray-700 text-sm font-medium">
            {filtersActive
              ? "No accounts or devices match the selected filters"
              : "No accounts or devices for this customer"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {filtersActive
              ? "Try a different type, status, or search term."
              : result.eventsLive
                ? "SIM lines and registered devices will appear here after they are recorded."
                : "A subscriber accounts/devices API or live login events are needed before inventory can be shown."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Showing {filtered.length.toLocaleString()} record
            {filtered.length === 1 ? "" : "s"} for this customer
          </p>
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<CustomerInventoryItem>
              columns={columns}
              data={paginated}
              totalItems={filtered.length}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={(nextPage) => {
                setPage(nextPage);
                setExpandedRowId(null);
              }}
              getRowId={(row) => row.id}
              expandedRowId={expandedRowId}
              onExpandChange={(rowId) =>
                setExpandedRowId(rowId == null ? null : String(rowId))
              }
              expandedContent={(row) => (
                <CustomerAccountDeviceDetailsExpandedRow item={row} />
              )}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />
          </div>
          {filtered.length > pageSize && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  setExpandedRowId(null);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
