import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart3, Check, Gift, X } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import SearchInput from "../../../shared/components/ui/SearchInput";
import type { OfferTrackingSource } from "../types/offerTrackingSource";
import { engineSourceTypeLabel } from "../../configurations/types/engineTrackingSource";
import { TRACKING_TYPE_OPTIONS } from "../utils/trackingSourcesConfig";

export interface SelectOfferRewardTrackingSourcesModalProps {
  open: boolean;
  sources: OfferTrackingSource[];
  onClose: () => void;
  onConfirm: (sourceIds: string[]) => void;
  title?: string;
  description?: string;
  emptyDescription?: string;
  /** Overlay stacking; raise above a parent modal (e.g. campaign configure). */
  overlayZIndex?: number;
}

function trackingTypeLabel(type: string | undefined): string {
  if (!type) return "—";
  return (
    TRACKING_TYPE_OPTIONS.find((t) => t.value === type)?.label ||
    engineSourceTypeLabel(type)
  );
}

/**
 * Mirrors Offer Tracking "Select Tracking Sources" UX, but the pool is
 * offer-attached tracking sources that do not yet have a reward.
 * Rewards never pick from the global catalog — that keeps Tracking → Rewards
 * as a real dependency chain.
 */
export default function SelectOfferRewardTrackingSourcesModal({
  open,
  sources,
  onClose,
  onConfirm,
  title = "Select Tracking Sources for Rewards",
  description = "Choose offer tracking sources to bind rewards to. Each source can only have one reward.",
  emptyDescription = "No unused tracking sources on this offer. Add sources in the Tracking step, or remove an existing reward to free a source.",
  overlayZIndex,
}: SelectOfferRewardTrackingSourcesModalProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setTypeFilter("all");
    setPendingIds([]);
  }, [open]);

  const typeFilterOptions = useMemo(() => {
    const types = new Set(
      sources.map((s) => String(s.type)).filter(Boolean),
    );
    return [
      { value: "all", label: "All Types" },
      ...TRACKING_TYPE_OPTIONS.filter((t) => types.has(t.value)),
      ...[...types]
        .filter((t) => !TRACKING_TYPE_OPTIONS.some((o) => o.value === t))
        .map((t) => ({ value: t, label: t })),
    ];
  }, [sources]);

  const filteredSources = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sources.filter((s) => {
      if (typeFilter !== "all" && String(s.type) !== typeFilter) return false;
      if (!q) return true;
      return (
        (s.name || "").toLowerCase().includes(q) ||
        String(s.type).toLowerCase().includes(q)
      );
    });
  }, [sources, search, typeFilter]);

  if (!open) return null;

  const resetAndClose = () => {
    setSearch("");
    setTypeFilter("all");
    setPendingIds([]);
    onClose();
  };

  const togglePending = (id: string) => {
    setPendingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    if (pendingIds.length === 0) return;
    // Preserve table order for predictable left-list ordering.
    const ordered = filteredSources
      .map((s) => s.id)
      .filter((id) => pendingIds.includes(id));
    const remaining = pendingIds.filter((id) => !ordered.includes(id));
    onConfirm([...ordered, ...remaining]);
    setSearch("");
    setTypeFilter("all");
    setPendingIds([]);
  };

  const layer = overlayZIndex ?? zIndex.modal - 1;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: layer }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 space-y-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <SearchInput
              placeholder="Search tracking sources..."
              value={search}
              onChange={setSearch}
            />
            <div className="w-48">
              <div className="[&_button]:py-2 [&_li]:py-1.5">
                <HeadlessSelect
                  label="Filter"
                  options={typeFilterOptions}
                  value={typeFilter}
                  onChange={(value) => setTypeFilter(String(value))}
                  placeholder="Filter by type"
                  zIndex={layer + 50}
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
                  {pendingIds.length} source
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
          {filteredSources.length === 0 ? (
            <div className="text-center py-12">
              {sources.length === 0 ? (
                <>
                  <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    {emptyDescription}
                  </p>
                </>
              ) : (
                <>
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    No tracking sources match your search.
                  </p>
                </>
              )}
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
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rules
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSources.map((source) => {
                    const id = source.id;
                    const checked = pendingIds.includes(id);
                    const ruleCount = (source.rules || []).filter(
                      (r) => r.enabled !== false,
                    ).length;
                    return (
                      <tr
                        key={id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          checked ? "bg-gray-50" : ""
                        }`}
                        onClick={() => togglePending(id)}
                      >
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              id={`reward-source-${id}`}
                              checked={checked}
                              onChange={() => togglePending(id)}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {checked ? (
                              <Check
                                className="w-4 h-4 shrink-0"
                                style={{ color: color.primary.accent }}
                              />
                            ) : null}
                            {source.name?.trim() ||
                              `Tracking source (${source.type})`}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {trackingTypeLabel(String(source.type))}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{ruleCount}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {source.enabled === false ? "Disabled" : "Enabled"}
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
            {pendingIds.length} of {filteredSources.length} shown source
            {filteredSources.length !== 1 ? "s" : ""} selected
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
