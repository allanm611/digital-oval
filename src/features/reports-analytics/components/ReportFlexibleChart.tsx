import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shortenAxisLabel } from "../utils/reportTimeWindow";
import type { ReportChartView } from "./ReportChartTypeToggle";

export type ReportFlexibleSeries = {
  dataKey: string;
  name: string;
  color: string;
  /** Use the right axis when this series is on a different scale from the others. */
  axis?: "left" | "right";
  valueFormatter?: (value: number) => string;
};

type ReportRow = Record<string, string | number | null | undefined>;

type ReportFlexibleChartProps = {
  data: ReportRow[];
  xKey: string;
  series: ReportFlexibleSeries[];
  chartType?: ReportChartView;
  yLabel?: string;
  yTickFormatter?: (value: number) => string;
  rightYLabel?: string;
  rightTickFormatter?: (value: number) => string;
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
  comparisonData?: ReportRow[];
  comparisonLabel?: string;
};

const RELATIVE_STACK_SUFFIX = "__rel";

function formatChartNumber(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}

function isRecord(value: unknown): value is ReportRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function baseSeriesKey(dataKey: string | number | undefined): string {
  return String(dataKey ?? "")
    .replace(/__prev$/, "")
    .replace(new RegExp(`${RELATIVE_STACK_SUFFIX}$`), "");
}

function seriesUsesRightAxis(item: ReportFlexibleSeries): boolean {
  return item.axis === "right";
}

/** Dual-axis charts mix incommensurable units (rate vs currency, count vs %). */
export function hasMixedScaleSeries(series: ReportFlexibleSeries[]): boolean {
  return series.some(seriesUsesRightAxis) && series.some((item) => !seriesUsesRightAxis(item));
}

function relativeStackKey(dataKey: string): string {
  return `${dataKey}${RELATIVE_STACK_SUFFIX}`;
}

/**
 * Dual-axis values cannot share one stack. Scale each series to 0–100 of its own
 * max so Stacked still draws one column per category without crushing the smaller unit.
 */
export function withRelativeStackValues(
  rows: ReportRow[],
  series: ReportFlexibleSeries[],
): ReportRow[] {
  const maxByKey = Object.fromEntries(
    series.map((item) => [
      item.dataKey,
      rows.reduce((max, row) => Math.max(max, Number(row[item.dataKey] ?? 0)), 0),
    ]),
  );

  return rows.map((row) => {
    const next: ReportRow = { ...row };
    for (const item of series) {
      const max = maxByKey[item.dataKey] || 0;
      const value = Number(row[item.dataKey] ?? 0);
      next[relativeStackKey(item.dataKey)] =
        max > 0 ? Number(((value / max) * 100).toFixed(2)) : 0;
    }
    return next;
  });
}

type TooltipEntry = {
  color?: string;
  name?: string;
  dataKey?: string | number;
  value?: number | string;
  payload?: ReportRow;
};

function ChartTooltip({
  active,
  label,
  payload,
  series,
  valueFormatter = formatChartNumber,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
  series: ReportFlexibleSeries[];
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry) => {
        const key = baseSeriesKey(entry.dataKey);
        const match = series.find((item) => item.dataKey === key);
        const format = match?.valueFormatter || valueFormatter;
        const raw = isRecord(entry.payload) && match ? entry.payload[match.dataKey] : entry.value;
        const numeric = typeof raw === "number" ? raw : Number(raw);
        return (
          <div
            key={`${entry.name}-${key}`}
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
              {Number.isFinite(numeric) ? format(numeric) : raw}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportFlexibleChart({
  data,
  xKey,
  series,
  chartType = "bar",
  yLabel,
  yTickFormatter,
  rightYLabel,
  rightTickFormatter,
  valueFormatter = formatChartNumber,
  emptyMessage = "No points in this window.",
  comparisonData,
  comparisonLabel = "Previous period",
}: ReportFlexibleChartProps) {
  if (!data.length || !series.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const stacked = chartType === "stacked";
  const mixedScale = hasMixedScaleSeries(series);
  const relativeStack = stacked && mixedScale;
  const showComparison = Boolean(comparisonData?.length) && !stacked;
  const hasRightAxis = !stacked && series.some(seriesUsesRightAxis);

  const comparedData = showComparison
    ? data.map((row, index) => {
        const previous = comparisonData?.[index];
        const extra: Record<string, string | number> = {};
        for (const item of series) {
          extra[`${item.dataKey}__prev`] = Number(previous?.[item.dataKey] ?? 0);
        }
        return { ...row, ...extra };
      })
    : data;
  const chartData = relativeStack
    ? withRelativeStackValues(comparedData, series)
    : comparedData;

  const pointCount = chartData.length;
  const longestLabel = chartData.reduce(
    (max, row) => Math.max(max, String(row[xKey] ?? "").length),
    0,
  );
  const rotateTicks = pointCount > 4 || longestLabel > 8;
  const tickInterval =
    pointCount <= 8 ? 0 : Math.max(0, Math.ceil(pointCount / 8) - 1);

  const axisId = (item: ReportFlexibleSeries) =>
    hasRightAxis ? (seriesUsesRightAxis(item) ? "right" : "left") : undefined;

  const plotKey = (item: ReportFlexibleSeries) =>
    relativeStack ? relativeStackKey(item.dataKey) : item.dataKey;

  const stackedYLabel = relativeStack ? "Relative to series max" : yLabel;
  const stackedYTick = relativeStack
    ? (value: number) => String(Math.round(value))
    : yTickFormatter;

  const axisProps = {
    x: (
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
    ),
    y: (
      <YAxis
        yAxisId={hasRightAxis ? "left" : undefined}
        tick={{ fill: "#6b7280" }}
        axisLine={{ stroke: "#e5e7eb" }}
        tickFormatter={stackedYTick}
        width={stackedYLabel ? 88 : 48}
        domain={relativeStack ? [0, "auto"] : undefined}
        label={
          stackedYLabel
            ? {
                value: stackedYLabel,
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6b7280", fontSize: 12 },
              }
            : undefined
        }
      />
    ),
    yRight: hasRightAxis ? (
      <YAxis
        yAxisId="right"
        orientation="right"
        tick={{ fill: "#6b7280" }}
        axisLine={{ stroke: "#e5e7eb" }}
        tickFormatter={rightTickFormatter}
        width={rightYLabel ? 88 : 48}
        label={
          rightYLabel
            ? {
                value: rightYLabel,
                angle: 90,
                position: "insideRight",
                style: { fill: "#6b7280", fontSize: 12 },
              }
            : undefined
        }
      />
    ) : null,
  };

  const shared = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      {axisProps.x}
      {axisProps.y}
      {axisProps.yRight}
      <Tooltip
        content={(props) => (
          <ChartTooltip
            {...props}
            series={series}
            valueFormatter={valueFormatter}
          />
        )}
        cursor={{ fill: "transparent" }}
      />
      <Legend iconType="circle" wrapperStyle={{ paddingTop: 16 }} />
    </>
  );

  const margin = {
    top: 20,
    right: hasRightAxis ? (rightYLabel ? 24 : 16) : 16,
    left: stackedYLabel ? 12 : 0,
    bottom: rotateTicks ? 12 : 0,
  };

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={margin}>
          {shared}
          {series.map((item) => (
            <Line
              key={item.dataKey}
              yAxisId={axisId(item)}
              type="monotone"
              dataKey={item.dataKey}
              name={item.name}
              stroke={item.color}
              strokeWidth={2}
              dot={{ r: pointCount > 12 ? 0 : 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
          {showComparison
            ? series.map((item) => (
                <Line
                  key={`${item.dataKey}__prev`}
                  yAxisId={axisId(item)}
                  type="monotone"
                  dataKey={`${item.dataKey}__prev`}
                  name={`${item.name} (${comparisonLabel})`}
                  stroke={item.color}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  strokeOpacity={0.55}
                  dot={false}
                />
              ))
            : null}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={margin}>
          {shared}
          {series.map((item) => (
            <Area
              key={item.dataKey}
              yAxisId={axisId(item)}
              type="monotone"
              dataKey={item.dataKey}
              name={item.name}
              stroke={item.color}
              fill={item.color}
              fillOpacity={0.18}
              strokeWidth={2}
            />
          ))}
          {showComparison
            ? series.map((item) => (
                <Area
                  key={`${item.dataKey}__prev`}
                  yAxisId={axisId(item)}
                  type="monotone"
                  dataKey={`${item.dataKey}__prev`}
                  name={`${item.name} (${comparisonLabel})`}
                  stroke={item.color}
                  fill={item.color}
                  fillOpacity={0.06}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  strokeOpacity={0.55}
                />
              ))
            : null}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  const lastStackIndex = series.length - 1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={margin}
        barCategoryGap={pointCount > 6 ? "16%" : "28%"}
        barGap={stacked ? 0 : 4}
      >
        {shared}
        {series.map((item, index) => (
          <Bar
            key={item.dataKey}
            yAxisId={axisId(item)}
            dataKey={plotKey(item)}
            name={item.name}
            fill={item.color}
            stackId={stacked ? "cvm" : undefined}
            radius={stacked ? (index === lastStackIndex ? [4, 4, 0, 0] : [0, 0, 0, 0]) : [4, 4, 0, 0]}
            maxBarSize={showComparison ? 28 : stacked ? 56 : 48}
          />
        ))}
        {showComparison
          ? series.map((item) => (
              <Bar
                key={`${item.dataKey}__prev`}
                yAxisId={axisId(item)}
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
