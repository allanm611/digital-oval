import { BarChart3, LineChart, AreaChart, Layers } from "lucide-react";
import { tw } from "../../../shared/utils/utils";

export type ReportChartView = "bar" | "stacked" | "line" | "area";

const VIEW_OPTIONS: Array<{
  id: ReportChartView;
  label: string;
  icon: typeof BarChart3;
}> = [
  { id: "bar", label: "Bar", icon: BarChart3 },
  { id: "stacked", label: "Stacked", icon: Layers },
  { id: "line", label: "Line", icon: LineChart },
  { id: "area", label: "Area", icon: AreaChart },
];

type ReportChartTypeToggleProps = {
  value: ReportChartView;
  onChange: (view: ReportChartView) => void;
  views?: ReportChartView[];
};

export default function ReportChartTypeToggle({
  value,
  onChange,
  views = ["bar", "stacked", "line", "area"],
}: ReportChartTypeToggleProps) {
  const options = VIEW_OPTIONS.filter((option) => views.includes(option.id));
  if (options.length < 2) return null;

  return (
    <div
      className={`inline-flex items-center ${tw.rounded} border border-gray-200 bg-gray-50 p-0.5`}
      role="group"
      aria-label="Chart type"
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
            aria-pressed={active}
            title={option.label}
          >
            <option.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
