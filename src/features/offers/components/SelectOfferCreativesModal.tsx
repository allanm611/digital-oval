import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, FileText, Plus, X } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import SearchInput from "../../../shared/components/ui/SearchInput";
import type { OfferCreative } from "../types/offerCreative";

export interface SelectOfferCreativesModalProps {
  open: boolean;
  creatives: OfferCreative[];
  loading?: boolean;
  channelLabel?: string;
  canCreateNew?: boolean;
  onClose: () => void;
  onConfirm: (creativeIds: number[]) => void;
  onCreateNew: () => void;
  localeLabel: (locale: string) => string;
}

function creativeDisplayName(creative: OfferCreative): string {
  return (
    creative.title?.trim() ||
    creative.name?.trim() ||
    `Creative #${creative.id}`
  );
}

function creativeSnippet(creative: OfferCreative): string {
  const text = (creative.text_body || creative.html_body || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "—";
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

/**
 * Mirrors Offer Tracking "Select Tracking Sources": search, language filter,
 * multi-select table, and Create. The parent passes only creatives that are
 * still available (not already on the offer, locale not already used).
 */
export default function SelectOfferCreativesModal({
  open,
  creatives = [],
  loading = false,
  channelLabel,
  canCreateNew = true,
  onClose,
  onConfirm,
  onCreateNew,
  localeLabel,
}: SelectOfferCreativesModalProps) {
  const [search, setSearch] = useState("");
  const [localeFilter, setLocaleFilter] = useState("all");
  const [pendingIds, setPendingIds] = useState<number[]>([]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setLocaleFilter("all");
    setPendingIds([]);
  }, [open]);

  const localeFilterOptions = useMemo(() => {
    const locales = Array.from(
      new Set(creatives.map((c) => c.locale).filter(Boolean)),
    );
    return [
      { value: "all", label: "All Languages" },
      ...locales.map((locale) => ({
        value: locale,
        label: localeLabel(locale),
      })),
    ];
  }, [creatives, localeLabel]);

  const filteredCreatives = useMemo(() => {
    const q = search.trim().toLowerCase();
    return creatives.filter((c) => {
      if (localeFilter !== "all" && c.locale !== localeFilter) return false;
      if (!q) return true;
      const haystack = [
        creativeDisplayName(c),
        c.locale,
        localeLabel(c.locale),
        c.channel,
        c.text_body,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [creatives, search, localeFilter, localeLabel]);

  const pendingLocales = useMemo(() => {
    return new Set(
      creatives
        .filter((c) => pendingIds.includes(c.id) && c.locale)
        .map((c) => c.locale),
    );
  }, [creatives, pendingIds]);

  if (!open) return null;

  const resetAndClose = () => {
    setSearch("");
    setLocaleFilter("all");
    setPendingIds([]);
    onClose();
  };

  const togglePending = (id: number) => {
    const creative = creatives.find((c) => c.id === id);
    if (!creative) return;
    setPendingIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (
        creative.locale &&
        creatives.some(
          (c) => prev.includes(c.id) && c.locale === creative.locale,
        )
      ) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleConfirm = () => {
    if (pendingIds.length === 0) return;
    const ordered = filteredCreatives
      .map((c) => c.id)
      .filter((id) => pendingIds.includes(id));
    const remaining = pendingIds.filter((id) => !ordered.includes(id));
    onConfirm([...ordered, ...remaining]);
    setSearch("");
    setLocaleFilter("all");
    setPendingIds([]);
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
              Select Creative Templates
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose creative templates and their languages for this offer
              {channelLabel ? ` (${channelLabel})` : ""}. Each creative template, and
              each language on this channel, can only be added once.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onCreateNew}
              disabled={!canCreateNew}
              className={`inline-flex items-center shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium text-white ${tw.rounded} hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
              title={
                canCreateNew
                  ? "Create a new creative for an unused language"
                  : "All languages already have creatives"
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Creative
            </button>
            <button
              type="button"
              onClick={resetAndClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 pt-4 space-y-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <SearchInput
              placeholder="Search creatives..."
              value={search}
              onChange={setSearch}
            />
            <div className="w-48">
              <div className="[&_button]:py-2 [&_li]:py-1.5">
                <HeadlessSelect
                  label="Filter"
                  options={localeFilterOptions}
                  value={localeFilter}
                  onChange={(value) => setLocaleFilter(String(value))}
                  placeholder="Filter by language"
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
                  {pendingIds.length} creative
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
          {loading ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              Loading creatives...
            </div>
          ) : filteredCreatives.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                {creatives.length === 0
                  ? "No unused creatives available for this channel and language. Create a new creative, or remove one from the offer to free a language."
                  : "No creatives match your search."}
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
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preview
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCreatives.map((creative) => {
                    const id = creative.id;
                    const checked = pendingIds.includes(id);
                    const localeTaken =
                      Boolean(creative.locale) &&
                      pendingLocales.has(creative.locale) &&
                      !checked;
                    return (
                      <tr
                        key={id}
                        className={`${
                          localeTaken
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer hover:bg-gray-50"
                        } ${checked ? "bg-gray-50" : ""}`}
                        onClick={() => {
                          if (!localeTaken) togglePending(id);
                        }}
                        title={
                          localeTaken
                            ? `${localeLabel(creative.locale)} is already selected in this list`
                            : undefined
                        }
                      >
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              id={`offer-creative-${id}`}
                              checked={checked}
                              disabled={localeTaken}
                              onChange={() => {
                                if (!localeTaken) togglePending(id);
                              }}
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
                            {creativeDisplayName(creative)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {creative.channel}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {localeLabel(creative.locale)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                          {creativeSnippet(creative)}
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
            {pendingIds.length} of {filteredCreatives.length} shown creative
            {filteredCreatives.length !== 1 ? "s" : ""} selected
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
