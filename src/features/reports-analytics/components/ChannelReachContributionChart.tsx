import { useMemo } from "react";
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

type ChannelReachPoint = CampaignReportsResponse["channelReach"][number];

interface ChannelReachContributionChartProps {
  data: ChannelReachPoint[];
  ensureCatalog?: boolean;
  emptyMessage?: string;
}

type TooltipEntry = {
  color?: string;
  dataKey?: string;
  name?: string;
  value?: number | string;
  payload?: {
    channel?: string;
    reach?: number;
    impressions?: number;
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
  const reach = Number(point?.reach || 0);
  const impressions = Number(point?.impressions || 0);

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
        Unique reach {point?.uniqueRate || "0%"}
        {impressions > 0 ? ` · ${reach.toLocaleString("en-US")} of ${impressions.toLocaleString("en-US")}` : ""}
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
}: ChannelReachContributionChartProps) {
  const chartData = useMemo(
    () => prepareChannelReachChartData(data, { ensureCatalog }),
    [data, ensureCatalog],
  );

  const reachColor = colors.reportCharts.campaignReports.channelReach.reach;
  const impressionsColor =
    colors.reportCharts.campaignReports.channelReach.impressions;
  const angledTicks = chartData.length > 4;

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        barCategoryGap={chartData.length <= 2 ? "38%" : "22%"}
        barGap={10}
        margin={{ top: 22, right: 44, left: 8, bottom: angledTicks ? 28 : 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="channel"
          interval={0}
          height={angledTicks ? 64 : 32}
          tick={({ x, y, payload, index }) => {
            const point = chartData[index];
            const idle = !point?.reach && !point?.impressions;
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
          yAxisId="reach"
          orientation="left"
          allowDecimals={false}
          tick={{ fill: reachColor, fontSize: 11 }}
          tickFormatter={formatChartCount}
          domain={[0, axisCeiling]}
          width={48}
          label={{
            value: "Reach",
            angle: -90,
            position: "insideLeft",
            offset: 8,
            style: { fill: reachColor, fontSize: 11 },
          }}
        />
        <YAxis
          yAxisId="impressions"
          orientation="right"
          allowDecimals={false}
          tick={{ fill: impressionsColor, fontSize: 11 }}
          tickFormatter={formatChartCount}
          domain={[0, axisCeiling]}
          width={48}
          label={{
            value: "Impressions",
            angle: 90,
            position: "insideRight",
            offset: 8,
            style: { fill: impressionsColor, fontSize: 11 },
          }}
        />
        <Tooltip content={<ChannelReachTooltip />} cursor={{ fill: "transparent" }} />
        <Legend iconType="circle" wrapperStyle={{ paddingTop: 8 }} />
        <Bar
          yAxisId="reach"
          dataKey="reach"
          name="Reach"
          fill={reachColor}
          maxBarSize={56}
          radius={[4, 4, 0, 0]}
        >
          <LabelList
              dataKey="reach"
              position="top"
              formatter={(value: number) =>
                Number(value) > 0 ? formatChartCount(value) : ""
              }
              style={{ fill: "#111827", fontSize: 11, fontWeight: 600 }}
            />
        </Bar>
        <Bar
          yAxisId="impressions"
          dataKey="impressions"
          name="Impressions"
          fill={impressionsColor}
          maxBarSize={56}
          radius={[4, 4, 0, 0]}
        >
          <LabelList
              dataKey="impressions"
              position="top"
              formatter={(value: number) =>
                Number(value) > 0 ? formatChartCount(value) : ""
              }
              style={{ fill: "#4b5563", fontSize: 11 }}
            />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
