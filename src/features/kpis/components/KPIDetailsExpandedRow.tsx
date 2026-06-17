import { color, tw } from "../../../shared/utils/utils";
import { KPI } from "../types/kpi";
import DateFormatter from "../../../shared/components/DateFormatter";

interface KPIDetailsExpandedRowProps {
  kpi: KPI;
  colSpan: number;
}

export default function KPIDetailsExpandedRow({
  kpi,
  colSpan,
}: KPIDetailsExpandedRowProps) {
  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return value;
  };

  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpi.description && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Description
            </label>
            <div className={`text-sm ${tw.textPrimary} break-words`}>
              {formatValue(kpi.description)}
            </div>
          </div>
        )}

        {kpi.source && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Source
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(kpi.source)}
            </div>
          </div>
        )}

        {kpi.field_type && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Field Type
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(kpi.field_type.charAt(0).toUpperCase() + kpi.field_type.slice(1))}
            </div>
          </div>
        )}

        {kpi.field_value && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Field Value
            </label>
            <div className={`text-sm ${tw.textPrimary} break-words font-mono`}>
              {formatValue(kpi.field_value)}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${tw.textMuted}`}>
            Status
          </label>
          <div className={`text-sm ${tw.textPrimary}`}>
            {kpi.is_active ? "Active" : "Inactive"}
          </div>
        </div>

        {kpi.subcategory && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Subcategory
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(kpi.subcategory)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
