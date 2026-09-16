import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Download, FileImage, Table2 } from "lucide-react";
import RegularModal from "../../../shared/components/ui/RegularModal";
import Pagination, {
  DEFAULT_PAGE_SIZE,
  getInitialPageSize,
} from "../../../shared/components/ui/Pagination";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import { useCsvDownload } from "../../../shared/hooks/useCsvDownload";
import { tw } from "../../../shared/utils/utils";
import {
  AUDIT_COLUMNS,
  auditFilename,
  downloadChartPng,
  resolveReportChartAudit,
  withAuditFields,
  type ReportChartAudit,
} from "../utils/reportChartExport";
import { shouldChartUseFullRow } from "../utils/reportTimeWindow";

export type ReportChartTableColumn = {
  key: string;
  label: string;
};

export type ReportChartRow = Record<string, string | number | null | undefined>;

type ReportChartCardProps = {
  title: string;
  subtitle?: string;
  filename: string;
  columns: ReportChartTableColumn[];
  rows: ReportChartRow[];
  children: ReactNode;
  className?: string;
  chartClassName?: string;
  audit?: ReportChartAudit;
  /** Force a full-width row. Omit to auto-span when the series would crowd a half-width card. */
  fullRow?: boolean;
};

function cellValue(row: ReportChartRow, key: string): string | number {
  const value = row[key];
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? value : Number(value.toFixed(2));
  }
  return String(value);
}

const AXIS_LABEL_KEYS = [
  "period",
  "month",
  "stage",
  "channel",
  "segment",
  "segmentName",
  "type",
  "range",
];

function inferAxisLabels(rows: ReportChartRow[]): string[] {
  if (!rows.length) return [];
  const key =
    AXIS_LABEL_KEYS.find((candidate) => rows[0][candidate] != null) ||
    Object.keys(rows[0])[0];
  return rows.map((row) => String(row[key] ?? ""));
}

export default function ReportChartCard({
  title,
  subtitle,
  filename,
  columns,
  rows,
  children,
  className = "",
  chartClassName = "h-80",
  audit,
  fullRow,
}: ReportChartCardProps) {
  const [tableOpen, setTableOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getInitialPageSize() || DEFAULT_PAGE_SIZE);
  const chartRef = useRef<HTMLDivElement>(null);
  const resolvedAudit = resolveReportChartAudit(audit);
  const spanFullRow =
    fullRow ?? shouldChartUseFullRow(rows.length, inferAxisLabels(rows));
  const resolvedChartClass =
    spanFullRow && chartClassName === "h-80" ? "h-96" : chartClassName;
  const { downloadCsv } = useCsvDownload({ defaultFilename: filename });
  const hasData = rows.length > 0;
  const exportName = auditFilename(filename, resolvedAudit);

  const tableColumns = useMemo(
    () => [
      ...AUDIT_COLUMNS.map((column) => ({ key: column.key, label: column.label })),
      ...columns.filter(
        (column) => !AUDIT_COLUMNS.some((auditColumn) => auditColumn.key === column.key),
      ),
    ],
    [columns],
  );

  const auditedRows = useMemo(
    () => rows.map((row) => withAuditFields(row, resolvedAudit)),
    [resolvedAudit, rows],
  );

  const headers = useMemo(
    () => tableColumns.map((column) => column.label),
    [tableColumns],
  );
  const csvRows = useMemo(
    () =>
      auditedRows.map((row) =>
        tableColumns.map((column) => cellValue(row, column.key)),
      ),
    [auditedRows, tableColumns],
  );

  useEffect(() => {
    setPage(1);
  }, [rows, pageSize, tableOpen]);

  const pageCountStart = (page - 1) * pageSize;
  const pagedRows = auditedRows.slice(pageCountStart, pageCountStart + pageSize);

  const linkClass =
    "inline-flex items-center gap-1.5 text-sm font-medium text-[var(--c-interactive-link)] hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline";

  const handleDownloadCsv = () => {
    downloadCsv(headers, csvRows, `${exportName}.csv`);
  };

  const handleDownloadPng = async () => {
    if (!chartRef.current) return;
    await downloadChartPng(chartRef.current, `${exportName}.png`);
  };

  return (
    <div
      className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm ${
        spanFullRow ? "lg:col-span-2" : ""
      } ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap sm:shrink-0">
          <button
            type="button"
            className={linkClass}
            disabled={!hasData}
            aria-label={`View table for ${title}`}
            onClick={() => setTableOpen(true)}
          >
            <Table2 className="h-4 w-4" />
            View table
          </button>
          <button
            type="button"
            className={linkClass}
            disabled={!hasData}
            aria-label={`Download CSV for ${title}`}
            onClick={handleDownloadCsv}
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            type="button"
            className={linkClass}
            aria-label={`Download PNG for ${title}`}
            onClick={handleDownloadPng}
          >
            <FileImage className="h-4 w-4" />
            PNG
          </button>
        </div>
      </div>
      <div ref={chartRef} className={`mt-6 ${resolvedChartClass}`}>
        {children}
      </div>

      <RegularModal
        isOpen={tableOpen}
        onClose={() => setTableOpen(false)}
        title={`${title} data`}
        size="2xl"
      >
        <p className="mb-4 text-sm text-gray-600">
          Source rows used to plot this chart
          {resolvedAudit.windowLabel ? ` · ${resolvedAudit.windowLabel}` : " for the selected window"}
          {resolvedAudit.timezone ? ` · ${resolvedAudit.timezone}` : ""}
          {resolvedAudit.currency ? ` · ${resolvedAudit.currency}` : ""}.
        </p>
        <div className="max-h-[50vh] overflow-auto rounded-md border border-gray-200">
          {hasData ? (
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  {tableColumns.map((column) => (
                    <th
                      key={column.key}
                      className="px-3 py-2 text-left font-medium text-gray-600"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, index) => (
                  <tr
                    key={`${title}-${pageCountStart + index}`}
                    className="border-t border-gray-100"
                  >
                    {tableColumns.map((column) => (
                      <td key={column.key} className="px-3 py-2 text-gray-900">
                        {String(cellValue(row, column.key))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-3 py-8 text-center text-sm text-gray-500">
              No source rows for this chart in the selected window.
            </p>
          )}
        </div>
        {hasData && auditedRows.length > pageSize ? (
          <div className="mt-4">
            <Pagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={auditedRows.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        ) : null}
        <div className="mt-4 flex justify-end">
          <CsvDownloadButton
            headers={headers}
            rows={csvRows}
            filename={`${exportName}.csv`}
            label="Download CSV"
          />
        </div>
      </RegularModal>
    </div>
  );
}
