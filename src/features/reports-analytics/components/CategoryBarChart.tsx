import { memo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { tw, color } from "../../../shared/utils/utils";
import { CategoryChartPoint } from "./CategoryDistributionChart";

interface CategoryBarChartProps {
  title: string;
  subtitle?: string;
  data: CategoryChartPoint[];
  emptyMessage?: string;
  className?: string;
}

function CategoryBarChartComponent({
  title,
  subtitle,
  data,
  emptyMessage = "No category data available",
  className = "",
}: CategoryBarChartProps) {
  return (
    <div
      className={`bg-white ${tw.rounded} border border-gray-200 overflow-hidden ${className}`.trim()}
    >
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className={tw.cardHeading}>{title}</h2>
        {subtitle && (
          <p className={`${tw.cardSubHeading} text-black mt-1`}>{subtitle}</p>
        )}
      </div>
      <div className="p-6">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-black">{emptyMessage}</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
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
                <Bar
                  dataKey="value"
                  fill={color.primary.accent}
                  radius={[8, 8, 0, 0]}
                  barSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export const CategoryBarChart = memo(CategoryBarChartComponent);
export default CategoryBarChart;
