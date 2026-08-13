import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { color, tw } from "../../../../shared/utils/utils";
import { zIndex } from "../../../../shared/utils/tokens";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import SearchInput from "../../../../shared/components/ui/SearchInput";
import {
  dataTypeToApplicableGroup,
  operatorAppliesToDataType,
  trackingOperatorLabel,
  type TrackingSelectorOperator,
} from "../../types/engineTrackingSource";

const TYPE_FILTERS = [
  { value: "all", label: "All types" },
  { value: "Text", label: "Text" },
  { value: "Numeric", label: "Numeric" },
  { value: "Date", label: "Date" },
];

export interface SelectOperatorsModalProps {
  open: boolean;
  fieldName?: string;
  dataType?: string;
  catalog: TrackingSelectorOperator[];
  selectedIds: number[];
  onClose: () => void;
  onConfirm: (operators: TrackingSelectorOperator[]) => void;
}

function requirementLabel(op: TrackingSelectorOperator): string {
  if (op.requiresTwoValues) return "Two values (BETWEEN)";
  if (op.requiresValue === false) return "No comparison value";
  return "Requires a value";
}

/**
 * Mirrors Offer Tracking "Select Tracking Sources": search, type filter,
 * checkbox table, confirm. Lists the full operator catalog with symbol + meaning.
 */
export default function SelectOperatorsModal({
  open,
  fieldName,
  dataType,
  catalog,
  selectedIds,
  onClose,
  onConfirm,
}: SelectOperatorsModalProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const [attachedIds, setAttachedIds] = useState<number[]>([]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setTypeFilter("all");
    setPendingIds([...selectedIds]);
    setAttachedIds([...selectedIds]);
    // Reset only when the modal opens so parent re-renders do not wipe checks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const recommendedGroup = dataTypeToApplicableGroup(dataType);

  const filteredOperators = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((op) => {
      if (typeFilter !== "all") {
        const types = (op.applicableFieldTypes || []).map((t) =>
          String(t).toLowerCase(),
        );
        if (!types.includes(typeFilter.toLowerCase())) return false;
      }
      if (!q) return true;
      const haystack = [
        op.symbol,
        op.code,
        trackingOperatorLabel(op),
        ...(op.applicableFieldTypes || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [catalog, search, typeFilter]);

  if (!open) return null;

  const resetAndClose = () => {
    setSearch("");
    setTypeFilter("all");
    setPendingIds([...selectedIds]);
    onClose();
  };

  const togglePending = (id: number) => {
    setPendingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    const selected = catalog.filter((op) => pendingIds.includes(op.id));
    onConfirm(selected);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal - 1 }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-200 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-gray-900">
              Select Operators
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose comparison operators for{" "}
              {fieldName?.trim() ? (
                <span className="font-medium text-gray-700">{fieldName}</span>
              ) : (
                "this field"
              )}
              . Symbol is what offer rules send; name is the meaning. Operators
              recommended for {recommendedGroup} fields are marked.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 space-y-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <SearchInput
              placeholder="Search by symbol or name..."
              value={search}
              onChange={setSearch}
            />
            <div className="w-48">
              <div className="[&_button]:py-2 [&_li]:py-1.5">
                <HeadlessSelect
                  label="Filter"
                  options={TYPE_FILTERS}
                  value={typeFilter}
                  onChange={(value) => setTypeFilter(String(value))}
                  placeholder="Filter by type"
                  zIndex={zIndex.popover}
                />
              </div>
            </div>
          </div>
        </div>

        {pendingIds.length > 0 ? (
          <div className="px-6 flex-shrink-0 my-3">
            <div
              className={`${tw.rounded} p-4 border text-sm`}
              style={{
                backgroundColor: "white",
                borderColor: color.primary.accent,
                color: color.primary.accent,
              }}
            >
              <div className="flex items-center justify-between">
                <span>
                  {pendingIds.length} operator
                  {pendingIds.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  type="button"
                  onClick={() => setPendingIds([])}
                  className="font-medium hover:opacity-80 transition-opacity"
                  style={{ color: color.primary.accent }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-6">
          {filteredOperators.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">
                No operators match your search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      Select
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requires
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Field types
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOperators.map((op) => {
                    const checked = pendingIds.includes(op.id);
                    const recommended = operatorAppliesToDataType(
                      op,
                      dataType,
                    );
                    return (
                      <tr
                        key={op.id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          checked ? "bg-gray-50" : ""
                        }`}
                        onClick={() => togglePending(op.id)}
                      >
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              id={`operator-${op.id}`}
                              checked={checked}
                              onChange={() => togglePending(op.id)}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {checked ? (
                              <Check
                                className="w-4 h-4 shrink-0"
                                style={{ color: color.primary.accent }}
                              />
                            ) : null}
                            {op.symbol || op.code}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{trackingOperatorLabel(op)}</span>
                            {attachedIds.includes(op.id) ? (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                Attached
                              </span>
                            ) : null}
                            {recommended ? (
                              <span
                                className="text-[11px] px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: "rgba(0, 187, 204, 0.12)",
                                  color: color.primary.accent,
                                }}
                              >
                                Recommended
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {requirementLabel(op)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {(op.applicableFieldTypes || []).join(", ") || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <span className="text-sm text-gray-600">
            {pendingIds.length} of {filteredOperators.length} shown operator
            {filteredOperators.length !== 1 ? "s" : ""} selected
          </span>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={resetAndClose}
              className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded}`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={pendingIds.length === 0}
              className={`px-4 py-2 text-white ${tw.rounded} disabled:opacity-50`}
              style={{ backgroundColor: color.primary.action }}
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
