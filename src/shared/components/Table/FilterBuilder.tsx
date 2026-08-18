import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { TableColumn } from "./types";
import HeadlessSelect from "../ui/HeadlessSelect";
import Input from "../ui/Input";
import { buttons } from "../../utils/tokens";

interface FilterCondition {
  columnId: string;
  operator: string;
  value: any;
}

interface FilterBuilderProps<T> {
  columns: TableColumn<T>[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: { [columnId: string]: FilterCondition }) => void;
  currentFilters: { [columnId: string]: FilterCondition };
  defaultColumnId?: string | null;
}

// Operator configurations per data type
const OPERATORS_BY_TYPE = {
  text: [
    { value: "contains", label: "contains" },
    { value: "does not contain", label: "does not contain" },
    { value: "equals", label: "equals" },
    { value: "does not equal", label: "does not equal" },
    { value: "starts with", label: "starts with" },
    { value: "ends with", label: "ends with" },
    { value: "is empty", label: "is empty" },
    { value: "is not empty", label: "is not empty" },
    { value: "is any of", label: "is any of" },
  ],
  number: [
    { value: "=", label: "=" },
    { value: "!=", label: "!=" },
    { value: ">", label: ">" },
    { value: ">=", label: ">=" },
    { value: "<", label: "<" },
    { value: "<=", label: "<=" },
    { value: "is empty", label: "is empty" },
    { value: "is not empty", label: "is not empty" },
    { value: "is any of", label: "is any of" },
  ],
  date: [
    { value: "is", label: "is" },
    { value: "is not", label: "is not" },
    { value: "is after", label: "is after" },
    { value: "is on or after", label: "is on or after" },
    { value: "is before", label: "is before" },
    { value: "is on or before", label: "is on or before" },
    { value: "is empty", label: "is empty" },
    { value: "is not empty", label: "is not empty" },
  ],
  select: [
    { value: "is", label: "is" },
    { value: "is not", label: "is not" },
    { value: "is any of", label: "is any of" },
  ],
};

export function FilterBuilder<T extends { id?: number | string } = any>({
  columns,
  isOpen,
  onClose,
  onApply,
  currentFilters,
  defaultColumnId,
}: FilterBuilderProps<T>) {
  // Get first filter, use provided default, or use first filterable column
  const firstFilterEntry = Object.entries(currentFilters)[0];
  const firstFilterableColumn = columns.find((col) => col.filterConfig);
  const initialColumnId = firstFilterEntry?.[0] || defaultColumnId || firstFilterableColumn?.id || "";

  const [columnId, setColumnId] = useState(initialColumnId);
  const [operator, setOperator] = useState(firstFilterEntry?.[1]?.operator || "");
  const [value, setValue] = useState(firstFilterEntry?.[1]?.value || null);

  // Update columnId when the modal opens with a new defaultColumnId
  useEffect(() => {
    if (isOpen && defaultColumnId) {
      setColumnId(defaultColumnId);
      setOperator("");
      setValue(null);
    }
  }, [isOpen, defaultColumnId]);

  const column = columns.find((c) => c.id === columnId);
  const filterType = column?.filterConfig?.type;
  const operators = getOperatorsForType(filterType);
  const needsValueInput = !["is empty", "is not empty"].includes(operator);

  const handleColumnChange = (newColumnId: string) => {
    setColumnId(newColumnId);
    setOperator(""); // Reset operator
    setValue(null); // Reset value
  };

  const handleOperatorChange = (newOperator: string) => {
    setOperator(newOperator);
    if (["is empty", "is not empty"].includes(newOperator)) {
      setValue(null);
    }
  };

  const handleApply = () => {
    const result: { [columnId: string]: FilterCondition } = {};
    if (columnId && operator && (value !== null || ["is empty", "is not empty"].includes(operator))) {
      result[columnId] = {
        columnId,
        operator,
        value,
      };
    }
    onApply(result);
    onClose();
  };

  const handleClear = () => {
    onApply({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className="rounded-lg shadow-lg p-6 w-full max-w-xl mx-4"
        style={{ backgroundColor: "var(--c-surface-cards)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-lg font-semibold"
            style={{ color: "var(--c-text-primary)" }}
          >
            Filter
          </h3>
          <button
            onClick={onClose}
            style={{ color: "var(--c-text-muted)" }}
            className="hover:opacity-70 transition-opacity"
          >
            <X size={20} />
          </button>
        </div>

        {/* Single Filter Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Column Dropdown */}
          <div>
            <label style={{ color: "var(--c-text-secondary)" }} className="text-xs font-medium mb-2 block">
              Columns
            </label>
            <HeadlessSelect
              options={columns
                .filter((col) => col.filterConfig)
                .map((col) => ({
                  value: col.id,
                  label: col.label,
                }))}
              value={columnId}
              onChange={(val) => handleColumnChange(val || "")}
              placeholder="Select column"
            />
          </div>

          {/* Operator Dropdown */}
          <div>
            <label style={{ color: "var(--c-text-secondary)" }} className="text-xs font-medium mb-2 block">
              Operator
            </label>
            <HeadlessSelect
              options={operators}
              value={operator}
              onChange={(val) => handleOperatorChange(val || "")}
              placeholder="Select operator"
              disabled={!columnId}
            />
          </div>

          {/* Value Input */}
          <div>
            <label style={{ color: "var(--c-text-secondary)" }} className="text-xs font-medium mb-2 block">
              Value
            </label>
            {needsValueInput ? (
              <ValueInput
                filterType={filterType}
                operator={operator}
                value={value}
                onChange={setValue}
                options={column?.filterConfig?.options}
              />
            ) : (
              <div
                style={{
                  backgroundColor: "var(--c-surface-cards)",
                  color: "var(--c-text-secondary)",
                  border: "1px solid var(--c-text-secondary)",
                }}
                className="px-3 py-2 rounded text-sm"
              >
                —
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClear}
            style={{
              backgroundColor: "transparent",
              color: "var(--c-text-primary)",
              border: "1px solid var(--c-text-primary)",
              padding: `${buttons.bordered.paddingY} ${buttons.bordered.paddingX}`,
              borderRadius: buttons.bordered.borderRadius,
              fontSize: buttons.bordered.fontSize,
            }}
            className="transition-colors font-medium"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            style={{
              background: buttons.action.background,
              color: buttons.action.color,
              border: buttons.action.border,
              padding: `${buttons.action.paddingY} ${buttons.action.paddingX}`,
              borderRadius: buttons.action.borderRadius,
              fontSize: buttons.action.fontSize,
            }}
            className="hover:opacity-90 transition-opacity font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

interface ValueInputProps {
  filterType?: string;
  operator: string;
  value: any;
  onChange: (value: any) => void;
  options?: string[];
}

function ValueInput({
  filterType,
  operator,
  value,
  onChange,
  options,
}: ValueInputProps) {
  if (filterType === "text") {
    if (operator === "is any of") {
      return (
        <Input
          type="text"
          value={value || ""}
          onChange={onChange}
          placeholder="Enter values (comma-separated)"
          variant="medium"
        />
      );
    }
    return (
      <Input
        type="text"
        value={value || ""}
        onChange={onChange}
        placeholder="Enter value"
        variant="medium"
      />
    );
  }

  if (filterType === "number") {
    if (operator === "is any of") {
      return (
        <Input
          type="text"
          value={value || ""}
          onChange={onChange}
          placeholder="Enter numbers (comma-separated)"
          variant="medium"
        />
      );
    }
    return (
      <Input
        type="number"
        value={value ?? ""}
        onChange={(val) => onChange(val === "" ? null : Number(val))}
        placeholder="Enter number"
        variant="medium"
      />
    );
  }

  if (filterType === "date") {
    if (operator === "is not") {
      return (
        <Input
          type="date"
          value={value || ""}
          onChange={onChange}
          variant="medium"
        />
      );
    }
    return (
      <Input
        type="date"
        value={value || ""}
        onChange={onChange}
        variant="medium"
      />
    );
  }

  if (filterType === "select" || filterType === "multiselect") {
    return (
      <HeadlessSelect
        options={
          options?.map((opt) => ({
            value: opt,
            label: opt.charAt(0).toUpperCase() + opt.slice(1),
          })) || []
        }
        value={value}
        onChange={onChange}
        placeholder="Select value"
      />
    );
  }

  return null;
}

function getOperatorsForType(filterType?: string) {
  switch (filterType) {
    case "text":
      return OPERATORS_BY_TYPE.text;
    case "number":
      return OPERATORS_BY_TYPE.number;
    case "date":
      return OPERATORS_BY_TYPE.date;
    case "select":
    case "multiselect":
      return OPERATORS_BY_TYPE.select;
    default:
      return [];
  }
}
