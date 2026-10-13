import { useEffect, useMemo, useState, type ReactNode } from "react";
import DateFormatter from "../../../shared/components/DateFormatter";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination, {
  DEFAULT_PAGE_SIZE,
} from "../../../shared/components/ui/Pagination";
import { Table, type TableColumn } from "../../../shared/components/Table";
import { color, tw } from "../../../shared/utils/utils";
import type {
  CustomerDeviceMovement,
  CustomerDeviceMovementKind,
  CustomerDeviceTrailSource,
  CustomerDumpFeed,
} from "../types/customerAccountDevice";
import {
  humanizeMovementKind,
  humanizeMovementSource,
  humanizeRadioTechnology,
} from "../utils/customerAccountDeviceHelpers";

type CustomerDeviceTrailSectionProps = {
  movements: CustomerDeviceMovement[];
  adt: CustomerDumpFeed;
  trailSource: CustomerDeviceTrailSource;
  isLoading: boolean;
};

const ALL = "all";

function movementClassName(kind: CustomerDeviceMovementKind): string {
  if (kind === "device_change") return "bg-blue-50 text-blue-800";
  if (kind === "sim_move") return "bg-amber-50 text-amber-800";
  if (kind === "sim_swap") return "bg-violet-50 text-violet-800";
  return "bg-gray-100 text-gray-700";
}

function displayValue(value: string | null | undefined): string {
  if (!value || !String(value).trim()) return "—";
  return String(value);
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`text-xs font-medium ${tw.textMuted}`}>{label}</label>
      <div className={`text-sm ${tw.textPrimary} break-words`}>{children}</div>
    </div>
  );
}

function trailNote(
  trailSource: CustomerDeviceTrailSource,
  adt: CustomerDumpFeed,
): string {
  if (trailSource === "adt") {
    return adt.truncated
      ? "This slice comes from the ADT dump. The extract reported more records than this page loaded, so the rest of that window stays on the dump pipeline."
      : "This trail comes from the ADT dump. Each row is one inspection: the previous handset, the new handset, the SIM, and the location recorded with the change.";
  }
  if (trailSource === "event") {
    return "These rows come from device-change events. The SIM and the location are shown only when that event included them.";
  }
  if (trailSource === "derived") {
    return "An ADT dump has not been received. This trail was reconstructed by comparing verified device events in time order, and a row is kept only when the IMEI or the SIM identity actually changed. Treat it as an inspection aid until the dump feed is connected.";
  }
  if (adt.available) {
    return "The latest ADT dump was received and contains no device changes for this customer.";
  }
  return "No device changes are on file.";
}

export default function CustomerDeviceTrailSection({
  movements,
  adt,
  trailSource,
  isLoading,
}: CustomerDeviceTrailSectionProps) {
  const [kind, setKind] = useState(ALL);
  const [page, setPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const pageSize = DEFAULT_PAGE_SIZE;

  useEffect(() => {
    setPage(1);
    setExpandedRowId(null);
  }, [movements, kind]);

  const filtered = useMemo(
    () =>
      kind === ALL ? movements : movements.filter((item) => item.kind === kind),
    [movements, kind],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const columns: TableColumn<CustomerDeviceMovement>[] = useMemo(
    () => [
      {
        id: "when",
        label: "When",
        visible: true,
        render: (_, row) =>
          row.occurredAt ? (
            <DateFormatter
              date={row.occurredAt}
              includeTime
              useUserTimezone
              className="text-sm text-gray-700"
            />
          ) : (
            <span className="text-sm text-gray-400">—</span>
          ),
      },
      {
        id: "kind",
        label: "Change",
        visible: true,
        render: (_, row) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${movementClassName(
              row.kind,
            )}`}
          >
            {humanizeMovementKind(row.kind)}
          </span>
        ),
      },
      {
        id: "from",
        label: "From",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[140px]">
            <p className="text-sm text-gray-900">
              {displayValue(row.previousLabel)}
            </p>
            {row.previousImei && row.previousImei !== row.previousLabel ? (
              <p className="font-mono text-xs text-gray-500 mt-0.5">
                {row.previousImei}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "to",
        label: "To",
        visible: true,
        render: (_, row) => (
          <div className="min-w-[140px]">
            <p className="text-sm text-gray-900">{displayValue(row.nextLabel)}</p>
            {row.nextImei && row.nextImei !== row.nextLabel ? (
              <p className="font-mono text-xs text-gray-500 mt-0.5">
                {row.nextImei}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "sim",
        label: "SIM",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-700">
            {displayValue(row.msisdn || row.iccid || row.imsi)}
          </span>
        ),
      },
      {
        id: "where",
        label: "Where",
        visible: true,
        render: (_, row) => (
          <span className="text-sm text-gray-700">
            {displayValue(row.location)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="mt-8">
      <h4 className="text-base font-semibold text-gray-900 mb-1">
        Device change trail
      </h4>
      <p className="text-sm text-gray-500 mb-3">
        ADT keeps the inspection record when a customer moves from one
        handset to another. A device change is an IMEI change on the same
        SIM, including a SIM placed in a different phone. A SIM swap is a
        new SIM identity. The location is the place captured with that
        change.
      </p>
      {isLoading ? (
        <p className="text-sm text-gray-500 mb-4">
          Checking the ADT dump and device events...
        </p>
      ) : (
        <p className="text-sm text-gray-600 mb-4">{trailNote(trailSource, adt)}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div
          className={`${tw.rounded} border border-gray-100 px-4 py-3`}
          style={{ backgroundColor: "var(--c-readonly-field-bg)" }}
        >
          <p className="text-xs uppercase text-gray-500 mb-1">ADT received</p>
          <div className="text-sm font-semibold text-gray-900">
            {isLoading ? (
              "—"
            ) : adt.receivedAt ? (
              <DateFormatter date={adt.receivedAt} includeTime useUserTimezone />
            ) : adt.available ? (
              "Received"
            ) : (
              "Not received"
            )}
          </div>
        </div>
        <div
          className={`${tw.rounded} border border-gray-100 px-4 py-3`}
          style={{ backgroundColor: "var(--c-readonly-field-bg)" }}
        >
          <p className="text-xs uppercase text-gray-500 mb-1">Changes</p>
          <div className="text-sm font-semibold text-gray-900">
            {isLoading ? "—" : movements.length.toLocaleString()}
          </div>
        </div>
        <div
          className={`${tw.rounded} border border-gray-100 px-4 py-3`}
          style={{ backgroundColor: "var(--c-readonly-field-bg)" }}
        >
          <p className="text-xs uppercase text-gray-500 mb-1">Dump id</p>
          <div className="text-sm font-semibold text-gray-900 break-all">
            {isLoading ? "—" : adt.dumpId || "—"}
          </div>
        </div>
      </div>

      <div className="mb-4 max-w-xs">
        <HeadlessSelect
          value={kind}
          onChange={(value) => setKind(String(value))}
          options={[
            { value: ALL, label: "All changes" },
            { value: "device_change", label: "Device changes" },
            { value: "sim_move", label: "SIM moves" },
            { value: "sim_swap", label: "SIM swaps" },
          ]}
          placeholder="Change"
          className="w-full"
        />
      </div>

      {isLoading ? null : filtered.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-gray-200 rounded-md">
          <p className="text-gray-700 text-sm font-medium">
            {kind === ALL
              ? "No device changes for this customer"
              : `No ${humanizeMovementKind(kind).toLowerCase()} records in this trail`}
          </p>
        </div>
      ) : (
        <>
          <div className={`${tw.rounded} overflow-hidden`}>
            <Table<CustomerDeviceMovement>
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
                <div
                  style={{ backgroundColor: color.surface.tablebodybg }}
                  className="px-6 py-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DetailField label="Previous IMEI">
                      <span className="font-mono">
                        {displayValue(row.previousImei)}
                      </span>
                    </DetailField>
                    <DetailField label="New IMEI">
                      <span className="font-mono">{displayValue(row.nextImei)}</span>
                    </DetailField>
                    <DetailField label="Technology">
                      {humanizeRadioTechnology(row.technology)}
                    </DetailField>
                    <DetailField label="MSISDN">
                      {displayValue(row.msisdn)}
                    </DetailField>
                    <DetailField label="Previous ICCID">
                      {displayValue(row.previousIccid)}
                    </DetailField>
                    <DetailField label="ICCID">{displayValue(row.iccid)}</DetailField>
                    <DetailField label="IMSI">{displayValue(row.imsi)}</DetailField>
                    <DetailField label="Location">
                      {displayValue(row.location)}
                    </DetailField>
                    <DetailField label="Source">
                      {humanizeMovementSource(row.source)}
                    </DetailField>
                    <DetailField label="Related event">
                      {displayValue(row.eventId)}
                    </DetailField>
                  </div>
                </div>
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
