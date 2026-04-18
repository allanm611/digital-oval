import { Plus } from "lucide-react";
import HeadlessSelect from "./ui/HeadlessSelect";
import { color, tw } from "../utils/utils";

interface TypeSelectorProps {
  options: Array<{ value: string | number; label: string }>;
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onCreate?: () => void;
  className?: string;
}

export default function TypeSelector({
  options,
  value,
  onChange,
  placeholder = "Select type",
  disabled = false,
  allowCreate = false,
  onCreate,
  className = "",
}: TypeSelectorProps) {
  return (
    <div className={`flex ${className}`}>
      <div className="flex-1">
        <div
          style={
            allowCreate
              ? {
                  borderTopRightRadius: "0",
                  borderBottomRightRadius: "0",
                  overflow: "hidden",
                }
              : undefined
          }
        >
          <HeadlessSelect
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full"
            searchable={true}
          />
        </div>
      </div>

      {allowCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="px-3 py-2 text-white rounded-r-md flex items-center justify-center text-sm border-l-0"
          style={{
            backgroundColor: color.primary.action,
            borderColor: color.primary.action,
          }}
          title="Create new type"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
