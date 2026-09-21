import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ClipboardCopy,
  Download,
  FileImage,
  FileCode,
  MoreHorizontal,
  Printer,
  Table2,
} from "lucide-react";
import RegularModal from "../../../shared/components/ui/RegularModal";
import Pagination, {
  DEFAULT_PAGE_SIZE,
  getInitialPageSize,
} from "../../../shared/components/ui/Pagination";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import { useCsvDownload } from "../../../shared/hooks/useCsvDownload";
import { tw, zIndex } from "../../../shared/utils/utils";
import {
  AUDIT_COLUMNS,
  auditFilename,
  copyChartPng,
  downloadChartPng,
  downloadChartSvg,
  printChart,
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
  headerExtra?: ReactNode;
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
  headerExtra,
}: ReportChartCardProps) {
  const [tableOpen, setTableOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getInitialPageSize() || DEFAULT_PAGE_SIZE);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
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

  useEffect(() => {
    if (!actionMessage) return undefined;
    const timer = window.setTimeout(() => setActionMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const pageCountStart = (page - 1) * pageSize;
  const pagedRows = auditedRows.slice(pageCountStart, pageCountStart + pageSize);

  const handleDownloadCsv = () => {
    downloadCsv(headers, csvRows, `${exportName}.csv`);
    setActionMessage("CSV downloaded");
  };

  const handleDownloadPng = async () => {
    if (!chartRef.current) return;
    const ok = await downloadChartPng(chartRef.current, `${exportName}.png`);
    setActionMessage(ok ? "PNG downloaded" : "Could not export PNG");
  };

  const handleDownloadSvg = () => {
    if (!chartRef.current) return;
    const ok = downloadChartSvg(chartRef.current, `${exportName}.svg`);
    setActionMessage(ok ? "SVG downloaded" : "Could not export SVG");
  };

  const handlePrint = () => {
    if (!chartRef.current) return;
    const ok = printChart(chartRef.current, title);
    setActionMessage(ok ? "Print dialog opened" : "Nothing to print");
  };

  const handleCopyImage = async () => {
    if (!chartRef.current) return;
    try {
      const ok = await copyChartPng(chartRef.current);
      setActionMessage(ok ? "Chart copied" : "Copy is not available here");
    } catch {
      setActionMessage("Copy is not available here");
    }
  };

  return (
    <div
      className={`${tw.rounded} overflow-visible border border-gray-200 bg-white p-6 shadow-sm ${
        spanFullRow ? "lg:col-span-2" : ""
      } ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          ) : null}
          {actionMessage ? (
            <p className="mt-1 text-xs text-emerald-700">{actionMessage}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap sm:shrink-0">
          {headerExtra}
          <Menu as="div" className="relative">
            <MenuButton
              className={`${tw.rounded} inline-flex items-center gap-1.5 border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300`}
              aria-label={`Chart actions for ${title}`}
            >
              <MoreHorizontal className="h-4 w-4" />
              Actions
            </MenuButton>
            <MenuItems
              anchor="bottom end"
              className={`${tw.rounded} mt-1 w-52 origin-top-right border border-gray-200 bg-white py-1 shadow-lg focus:outline-none`}
              style={{ zIndex: zIndex.dropdownOpen }}
            >
              <MenuItem disabled={!hasData}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900 data-[disabled]:cursor-not-allowed data-[disabled]:text-gray-400"
                  onClick={() => setTableOpen(true)}
                >
                  <Table2 className="h-4 w-4" />
                  View table
                </button>
              </MenuItem>
              <MenuItem disabled={!hasData}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900 data-[disabled]:cursor-not-allowed data-[disabled]:text-gray-400"
                  onClick={handleDownloadCsv}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </MenuItem>
              <MenuItem>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900"
                  onClick={handleDownloadPng}
                >
                  <FileImage className="h-4 w-4" />
                  Export PNG
                </button>
              </MenuItem>
              <MenuItem>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900"
                  onClick={handleDownloadSvg}
                >
                  <FileCode className="h-4 w-4" />
                  Export SVG
                </button>
              </MenuItem>
              <MenuItem>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900"
                  onClick={handleCopyImage}
                >
                  <ClipboardCopy className="h-4 w-4" />
                  Copy image
                </button>
              </MenuItem>
              <MenuItem>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Print chart
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>
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
