import { shortenAxisLabel } from "../utils/reportTimeWindow";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ReportBarSeries = {
  dataKey: string;
  name: string;
  color: string;
};

type ReportGroupedBarChartProps = {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: ReportBarSeries[];
  yLabel?: string;
  yTickFormatter?: (value: number) => string;
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
  comparisonData?: Array<Record<string, string | number | null | undefined>>;
  comparisonLabel?: string;
};

function formatChartNumber(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}

type TooltipEntry = {
  color?: string;
  name?: string;
  value?: number | string;
};

function ChartTooltip({
  active,
  label,
  payload,
  valueFormatter = formatChartNumber,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4 text-sm text-gray-600"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-semibold text-gray-900">
            {typeof entry.value === "number"
              ? valueFormatter(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Grouped bar chart matching the Customer Profile lifecycle style:
 * dashed grid, circle legend, rounded bars.
 */
export default function ReportGroupedBarChart({
  data,
  xKey,
  series,
  yLabel,
  yTickFormatter,
  valueFormatter = formatChartNumber,
  emptyMessage = "No trend points in this window.",
  comparisonData,
  comparisonLabel = "Previous period",
}: ReportGroupedBarChartProps) {
  if (!data.length || !series.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const showComparison = Boolean(comparisonData?.length);
  const chartData = showComparison
    ? data.map((row, index) => {
        const previous = comparisonData?.[index];
        const extra: Record<string, string | number> = {};
        for (const item of series) {
          extra[`${item.dataKey}__prev`] = Number(previous?.[item.dataKey] ?? 0);
        }
        return { ...row, ...extra };
      })
    : data;

  const pointCount = chartData.length;
  const longestLabel = chartData.reduce(
    (max, row) => Math.max(max, String(row[xKey] ?? "").length),
    0,
  );
  const rotateTicks = pointCount > 4 || longestLabel > 8;
  const tickInterval =
    pointCount <= 8 ? 0 : Math.max(0, Math.ceil(pointCount / 8) - 1);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 16,
          left: yLabel ? 12 : 0,
          bottom: rotateTicks ? 12 : 0,
        }}
        barCategoryGap={pointCount > 6 ? "16%" : "28%"}
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey={xKey}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={{ stroke: "#e5e7eb" }}
          interval={tickInterval}
          minTickGap={12}
          angle={rotateTicks ? -40 : 0}
          textAnchor={rotateTicks ? "end" : "middle"}
          height={rotateTicks ? 72 : 32}
          tickFormatter={(value) => shortenAxisLabel(String(value))}
          tickMargin={rotateTicks ? 8 : 4}
        />
        <YAxis
          tick={{ fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickFormatter={yTickFormatter}
          width={yLabel ? 88 : 48}
          label={
            yLabel
              ? {
                  value: yLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#6b7280", fontSize: 12 },
                }
              : undefined
          }
        />
        <Tooltip
          content={(props) => (
            <ChartTooltip {...props} valueFormatter={valueFormatter} />
          )}
          cursor={{ fill: "transparent" }}
        />
        <Legend iconType="circle" wrapperStyle={{ paddingTop: 16 }} />
        {series.map((item) => (
          <Bar
            key={item.dataKey}
            dataKey={item.dataKey}
            name={item.name}
            fill={item.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={showComparison ? 28 : 48}
          />
        ))}
        {showComparison
          ? series.map((item) => (
              <Bar
                key={`${item.dataKey}__prev`}
                dataKey={`${item.dataKey}__prev`}
                name={`${item.name} (${comparisonLabel})`}
                fill={item.color}
                fillOpacity={0.35}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            ))
          : null}
      </BarChart>
    </ResponsiveContainer>
  );
}
