import { ChevronDown } from "lucide-react";
import { color, tw } from "../utils/utils";
import { formatDateWithTimezone } from "../services/dateService";
import { getSettingsTimezoneOffset } from "../utils/settingsHelper";

export interface FieldConfig {
  key: string;
  label: string;
  format?: "text" | "date" | "currency" | "percentage" | "badge";
  formatter?: (value: unknown) => React.ReactNode;
}

interface ExpandableTableRowProps {
  isExpanded: boolean;
  onToggle: () => void;
  title: React.ReactNode;
  colSpan: number;
  data: Record<string, unknown>;
  fieldConfig: FieldConfig[];
  isLoading?: boolean;
}

const defaultFormatters = {
  text: (val: unknown) => val || "—",
  date: (val: unknown) => {
    if (!val) return "—";
    try {
      return formatDateWithTimezone(new Date(val as string), getSettingsTimezoneOffset());
    } catch {
      return "—";
    }
  },
  currency: (val: unknown) => {
    if (val === null || val === undefined) return "—";
    return `$${Number(val).toLocaleString()}`;
  },
  percentage: (val: unknown) => {
    if (val === null || val === undefined) return "—";
    return `${Number(val)}%`;
  },
  badge: (val: unknown) => val || "—",
};

export const ExpandableTableRow = ({
  isExpanded,
  onToggle,
  title,
  colSpan,
  data,
  fieldConfig,
  isLoading = false,
}: ExpandableTableRowProps) => {
  const formatValue = (field: FieldConfig, value: unknown): React.ReactNode => {
    if (field.formatter) {
      return field.formatter(value);
    }

    const format = field.format || "text";
    const formatter = defaultFormatters[format as keyof typeof defaultFormatters];
    return formatter ? formatter(value) : value;
  };

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-opacity-75 transition-colors"
        style={{ backgroundColor: color.surface.tablebodybg }}
      >
        <td colSpan={colSpan} className="px-6 py-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="flex items-center gap-3 w-full hover:opacity-70 transition-opacity"
          >
            <ChevronDown
              size={18}
              className={`transition-transform flex-shrink-0 ${
                isExpanded ? "rotate-180" : ""
              }`}
              style={{ color: color.text.muted }}
            />
            <span className={tw.textPrimary}>{title}</span>
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr style={{ backgroundColor: color.surface.tablebodybg }}>
          <td colSpan={colSpan} className="px-6 py-6">
            {isLoading ? (
              <div className={`text-sm ${tw.textMuted} text-center`}>
                Loading details...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fieldConfig.map((field) => {
                  const value = data[field.key];
                  const isEmpty =
                    value === null ||
                    value === undefined ||
                    value === "" ||
                    (Array.isArray(value) && value.length === 0);

                  return (
                    <div key={field.key} className="flex flex-col gap-1">
                      <label className={`text-xs font-medium uppercase tracking-wider ${tw.textMuted}`}>
                        {field.label}
                      </label>
                      <div
                        className={`text-sm ${
                          isEmpty ? tw.textMuted : tw.textPrimary
                        }`}
                      >
                        {formatValue(field, value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};
