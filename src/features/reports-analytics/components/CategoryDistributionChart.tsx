import { memo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { tw, color } from "../../../shared/utils/utils";

export type CategoryChartPoint = {
  label: string;
  value: number;
};

export type CategoryView = "segments" | "offers" | "campaigns" | "products";

interface CategoryDistributionChartProps {
  title: string;
  subtitle: string;
  data: CategoryChartPoint[];
  loading: boolean;
  emptyMessage?: string;
  selectedView: CategoryView;
  onViewChange: (view: CategoryView) => void;
}

const viewOptions: Array<{ id: CategoryView; label: string }> = [
  { id: "segments", label: "Segments" },
  { id: "offers", label: "Offers" },
  { id: "campaigns", label: "Campaigns" },
  { id: "products", label: "Products" },
];

const gradientId = "categoryAreaGradient";

function CategoryDistributionChartComponent({
  title,
  subtitle,
  data,
  loading,
  emptyMessage = "No category data available",
  selectedView,
  onViewChange,
}: CategoryDistributionChartProps) {
  return (
    <div className={`bg-white ${tw.rounded} border border-gray-200 overflow-hidden`}>
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className={tw.cardHeading}>{title}</h2>
          <p className={`${tw.cardSubHeading} text-black mt-1`}>{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {viewOptions.map((option) => {
            const isActive = option.id === selectedView;
            return (
              <button
                key={option.id}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  isActive
                    ? "bg-black text-white border-black"
                    : "border-gray-300 text-black hover:bg-gray-100"
                }`}
                onClick={() => onViewChange(option.id)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-72">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2" />
              <p className="text-sm text-black">Loading distribution...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-72">
            <p className="text-sm text-black">{emptyMessage}</p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={color.primary.accent}
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor={color.primary.accent}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={{ stroke: "#E5E7EB" }}
                  interval={0}
                  angle={data.length > 6 ? -25 : 0}
                  textAnchor={data.length > 6 ? "end" : "middle"}
                />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={{ stroke: "#E5E7EB" }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: number) =>
                    `${value.toLocaleString()} items`
                  }
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "#000000",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color.primary.accent}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export const CategoryDistributionChart = memo(
  CategoryDistributionChartComponent
);

export default CategoryDistributionChart;
