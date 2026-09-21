import { useState, type ReactNode } from "react";
import ReportChartCard, {
  type ReportChartTableColumn,
  type ReportChartRow,
} from "./ReportChartCard";
import ReportChartTypeToggle, {
  type ReportChartView,
} from "./ReportChartTypeToggle";
import ReportFlexibleChart, {
  type ReportFlexibleSeries,
} from "./ReportFlexibleChart";
import type { ReportChartAudit } from "../utils/reportChartExport";

type SwitchableReportChartProps = {
  title: string;
  subtitle?: string;
  filename: string;
  columns: ReportChartTableColumn[];
  rows: ReportChartRow[];
  xKey: string;
  series: ReportFlexibleSeries[];
  defaultView?: ReportChartView;
  views?: ReportChartView[];
  yLabel?: string;
  yTickFormatter?: (value: number) => string;
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
  comparisonData?: Array<Record<string, string | number | null | undefined>>;
  comparisonLabel?: string;
  className?: string;
  audit?: ReportChartAudit;
  fullRow?: boolean;
  headerNote?: ReactNode;
};

export default function SwitchableReportChart({
  title,
  subtitle,
  filename,
  columns,
  rows,
  xKey,
  series,
  defaultView = "bar",
  views,
  yLabel,
  yTickFormatter,
  valueFormatter,
  emptyMessage,
  comparisonData,
  comparisonLabel,
  className,
  audit,
  fullRow,
  headerNote,
}: SwitchableReportChartProps) {
  const [chartType, setChartType] = useState<ReportChartView>(defaultView);

  return (
    <ReportChartCard
      title={title}
      subtitle={subtitle}
      filename={filename}
      columns={columns}
      rows={rows}
      className={className}
      audit={audit}
      fullRow={fullRow}
      headerExtra={
        <div className="flex flex-wrap items-center gap-3">
          {headerNote}
          <ReportChartTypeToggle
            value={chartType}
            onChange={setChartType}
            views={views}
          />
        </div>
      }
    >
      <ReportFlexibleChart
        data={rows}
        xKey={xKey}
        series={series}
        chartType={chartType}
        yLabel={yLabel}
        yTickFormatter={yTickFormatter}
        valueFormatter={valueFormatter}
        emptyMessage={emptyMessage}
        comparisonData={comparisonData}
        comparisonLabel={comparisonLabel}
      />
    </ReportChartCard>
  );
}
