import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, Plus, X } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import Checkbox from "../../../shared/components/ui/Checkbox";
import SearchInput from "../../../shared/components/ui/SearchInput";
import type { ErrorGroup } from "../../configurations/types/errorGroup";
import {
  errorGroupIdKey,
  formatErrorGroupLabel,
  resolveErrorGroupDefaultFailureMessage,
} from "../../configurations/types/errorGroup";

export interface SelectedErrorGroupChoice {
  id: string;
  message: string;
}

export interface SelectErrorGroupsModalProps {
  open: boolean;
  /** Catalog groups not yet attached to the reward rule. */
  groups: ErrorGroup[];
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (selections: SelectedErrorGroupChoice[]) => void;
  /** Opens Configure Error Group (same role as Create Tracking Source). */
  onCreate: () => void;
}

/**
 * Mirrors Offer Tracking "Select Tracking Sources":
 * search + selectable table of remaining error groups with their messages.
 */
export default function SelectErrorGroupsModal({
  open,
  groups,
  loading = false,
  error = "",
  onClose,
  onConfirm,
  onCreate,
}: SelectErrorGroupsModalProps) {
  const [search, setSearch] = useState("");
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [pendingMessages, setPendingMessages] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setPendingIds([]);
    setPendingMessages({});
  }, [open]);

  const rows = useMemo(
    () =>
      groups.map((group) => {
        const id = errorGroupIdKey(group.id);
        return {
          id,
          name: formatErrorGroupLabel(group),
          description: group.description?.trim() || "",
          message: resolveErrorGroupDefaultFailureMessage(group),
          codeCount: Array.isArray(group.mappings) ? group.mappings.length : 0,
          active: group.is_active !== false,
        };
      }),
    [groups],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        row.message.toLowerCase().includes(q),
    );
  }, [rows, search]);

  if (!open) return null;

  const resetAndClose = () => {
    setSearch("");
    setPendingIds([]);
    setPendingMessages({});
    onClose();
  };

  const togglePending = (id: string, defaultMessage: string) => {
    setPendingIds((prev) => {
      if (prev.includes(id)) {
        setPendingMessages((messages) => {
          const next = { ...messages };
          delete next[id];
          return next;
        });
        return prev.filter((x) => x !== id);
      }
      setPendingMessages((messages) => ({
        ...messages,
        [id]: messages[id] ?? defaultMessage,
      }));
      return [...prev, id];
    });
  };

  const updatePendingMessage = (id: string, message: string) => {
    setPendingMessages((prev) => ({ ...prev, [id]: message }));
  };

  const handleConfirm = () => {
    if (pendingIds.length === 0) return;
    const ordered = filteredRows
      .map((row) => row.id)
      .filter((id) => pendingIds.includes(id));
    const remaining = pendingIds.filter((id) => !ordered.includes(id));
    const selections = [...ordered, ...remaining].map((id) => {
      const row = rows.find((r) => r.id === id);
      return {
        id,
        message: (pendingMessages[id] ?? row?.message ?? "").trim(),
      };
    });
    onConfirm(selections);
    setSearch("");
    setPendingIds([]);
    setPendingMessages({});
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.popover }}
      onClick={resetAndClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-200 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-gray-900">
              Select Error Groups
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose error groups and their messages for this reward. Already
              selected groups are hidden so each can only be added once.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onCreate}
              className={`inline-flex items-center shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium text-white ${tw.rounded} hover:opacity-90 transition-all`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Error Group
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

        <div className="px-6 pt-4 flex-shrink-0">
          <SearchInput
            placeholder="Search error groups..."
            value={search}
            onChange={setSearch}
          />
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
                  {pendingIds.length} group
                  {pendingIds.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPendingIds([]);
                    setPendingMessages({});
                  }}
                  className="font-medium hover:opacity-80 transition-opacity"
                  style={{ color: color.primary.accent }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="my-3 flex-shrink-0" />
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              Loading error groups...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 text-sm">{error}</div>
          ) : filteredRows.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                {groups.length === 0
                  ? "No remaining error groups to add. Create a new group, or remove one already on this reward."
                  : "No error groups match your search."}
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
                      Message
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Codes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRows.map((row) => {
                    const checked = pendingIds.includes(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          checked ? "bg-gray-50" : ""
                        }`}
                        onClick={() => togglePending(row.id, row.message)}
                      >
                        <td className="px-4 py-3 align-top">
                          <div
                            className="flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              id={`error-group-select-${row.id}`}
                              checked={checked}
                              onChange={() =>
                                togglePending(row.id, row.message)
                              }
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {checked ? (
                              <Check
                                className="w-4 h-4 shrink-0"
                                style={{ color: color.primary.accent }}
                              />
                            ) : null}
                            {row.name}
                          </div>
                        </td>
                        <td
                          className="px-4 py-3 align-top text-gray-600 min-w-[220px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {checked ? (
                            <input
                              type="text"
                              value={pendingMessages[row.id] ?? row.message}
                              onChange={(e) =>
                                updatePendingMessage(row.id, e.target.value)
                              }
                              placeholder="Message for this error group..."
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                            />
                          ) : (
                            <span className="line-clamp-2">
                              {row.message || "—"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-gray-600">
                          {row.codeCount}
                        </td>
                        <td className="px-4 py-3 align-top text-gray-500 max-w-xs truncate">
                          {row.description || "—"}
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
            {pendingIds.length} of {filteredRows.length} shown group
            {filteredRows.length !== 1 ? "s" : ""} selected
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
