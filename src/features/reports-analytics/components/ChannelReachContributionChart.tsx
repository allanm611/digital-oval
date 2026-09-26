import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import type { CampaignReportsResponse } from "../types/ReportsAPI";
import {
  formatChartCount,
  prepareChannelReachChartData,
} from "../utils/normalizeCampaignReport";
import ReportChartTypeToggle, {
  type ReportChartView,
} from "./ReportChartTypeToggle";
import ReportFlexibleChart from "./ReportFlexibleChart";

type ChannelReachPoint = CampaignReportsResponse["channelReach"][number];

interface ChannelReachContributionChartProps {
  data: ChannelReachPoint[];
  ensureCatalog?: boolean;
  emptyMessage?: string;
  chartType?: ReportChartView;
  onChartTypeChange?: (view: ReportChartView) => void;
  showTypeToggle?: boolean;
}

type TooltipEntry = {
  color?: string;
  dataKey?: string;
  name?: string;
  value?: number | string;
  payload?: {
    channel?: string;
    sent?: number;
    delivered?: number;
    uniqueAudience?: number;
    uniqueRate?: string;
  };
};

function ChannelReachTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const sent = Number(point?.sent || 0);
  const uniqueAudience = Number(point?.uniqueAudience || 0);

  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}>
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.dataKey || entry.name}
          className="flex items-center justify-between gap-6 text-sm text-gray-600"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-semibold text-gray-900">
            {formatChartCount(entry.value)}
          </span>
        </div>
      ))}
      <p className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-500">
        Unique audience {point?.uniqueRate || "0%"} of sent
        {sent > 0
          ? ` · ${uniqueAudience.toLocaleString("en-US")} of ${sent.toLocaleString("en-US")}`
          : ""}
      </p>
    </div>
  );
}

function axisCeiling(max: number): number {
  if (!Number.isFinite(max) || max <= 0) return 1;
  const padded = max * 1.15;
  const magnitude = Math.pow(10, Math.max(0, Math.floor(Math.log10(padded)) - 1));
  return Math.max(1, Math.ceil(padded / magnitude) * magnitude);
}

export default function ChannelReachContributionChart({
  data,
  ensureCatalog = false,
  emptyMessage = "No channel activity in this window.",
  chartType: controlledType,
  onChartTypeChange,
  showTypeToggle = false,
}: ChannelReachContributionChartProps) {
  const [internalType, setInternalType] = useState<ReportChartView>("bar");
  const chartType = controlledType ?? internalType;
  const handleChartTypeChange = (view: ReportChartView) => {
    onChartTypeChange?.(view);
    if (controlledType === undefined) setInternalType(view);
  };

  const chartData = useMemo(
    () => prepareChannelReachChartData(data, { ensureCatalog }),
    [data, ensureCatalog],
  );

  const palette = colors.reportCharts.campaignReports.channelReach;
  const sentColor = palette.sent;
  const deliveredColor = palette.delivered;
  const uniqueColor = palette.uniqueAudience;
  const angledTicks = chartData.length > 4;
  const series = [
    { dataKey: "sent", name: "Sent", color: sentColor },
    { dataKey: "delivered", name: "Delivered", color: deliveredColor },
    { dataKey: "uniqueAudience", name: "Unique Audience", color: uniqueColor },
  ];

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const chart =
    chartType === "bar" ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          barCategoryGap={chartData.length <= 2 ? "38%" : "18%"}
          barGap={6}
          margin={{ top: 22, right: 16, left: 8, bottom: angledTicks ? 28 : 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="channel"
            interval={0}
            height={angledTicks ? 64 : 32}
            tick={({ x, y, payload, index }) => {
              const point = chartData[index];
              const idle = !point?.sent && !point?.delivered && !point?.uniqueAudience;
              return (
                <text
                  x={x}
                  y={y}
                  dy={10}
                  textAnchor={angledTicks ? "end" : "middle"}
                  transform={angledTicks ? `rotate(-28 ${x} ${y})` : undefined}
                  fill={idle ? "#9ca3af" : "#4b5563"}
                  fontSize={11}
                >
                  {payload?.value}
                </text>
              );
            }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickFormatter={formatChartCount}
            domain={[0, axisCeiling]}
            width={48}
            label={{
              value: "Volume",
              angle: -90,
              position: "insideLeft",
              offset: 8,
              style: { fill: "#6b7280", fontSize: 11 },
            }}
          />
          <Tooltip content={<ChannelReachTooltip />} cursor={{ fill: "transparent" }} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: 8 }} />
          {series.map((item) => (
            <Bar
              key={item.dataKey}
              dataKey={item.dataKey}
              name={item.name}
              fill={item.color}
              maxBarSize={48}
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                dataKey={item.dataKey}
                position="top"
                formatter={(value: number) =>
                  Number(value) > 0 ? formatChartCount(value) : ""
                }
                style={{ fill: "#111827", fontSize: 10, fontWeight: 600 }}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <ReportFlexibleChart
        data={chartData}
        xKey="channel"
        series={series}
        chartType={chartType}
        yLabel="Volume"
        yTickFormatter={(value) => formatChartCount(value)}
        emptyMessage={emptyMessage}
      />
    );

  if (!showTypeToggle) return chart;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex justify-end">
        <ReportChartTypeToggle value={chartType} onChange={handleChartTypeChange} />
      </div>
      <div className="min-h-0 flex-1">{chart}</div>
    </div>
  );
}
