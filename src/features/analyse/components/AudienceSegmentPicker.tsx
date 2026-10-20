import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import type { SegmentType } from "../../segments/types/segment";
import { analysisService } from "../services/analysisService";
import type { AudienceSource } from "../types/analysis";

interface AudienceSegmentPickerProps {
  source: Extract<AudienceSource, "existing" | "saved_segments">;
  selectedId: number | null;
  onSelect: (segment: SegmentType) => void;
}

export default function AudienceSegmentPicker({
  source,
  selectedId,
  onSelect,
}: AudienceSegmentPickerProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [segments, setSegments] = useState<SegmentType[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<SegmentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rowRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analysisService
      .listAudienceSegments(source, debouncedSearch)
      .then((items) => {
        if (!cancelled) setSegments(items);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setSegments([]);
          setError(extractBackendError(loadError, "Segments could not be loaded."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, source]);

  useEffect(() => {
    if (selectedId == null) {
      setSelectedSegment(null);
      return;
    }
    let cancelled = false;
    analysisService.getAudienceSegment(source, selectedId).then((segment) => {
      if (!cancelled) setSelectedSegment(segment);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, source]);

  useEffect(() => {
    if (selectedId == null || loading) return;
    rowRefs.current[selectedId]?.scrollIntoView({ block: "nearest" });
  }, [loading, segments, selectedId]);

  const selectedIsListed = segments.some((segment) => segment.id === selectedId);

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder={
          source === "saved_segments"
            ? "Search saved segments..."
            : "Search existing segments..."
        }
        value={search}
        onChange={setSearch}
      />
      {selectedSegment && !selectedIsListed && (
        <div
          className={`flex items-center gap-3 border px-4 py-3 ${tw.rounded}`}
          style={{
            borderColor: color.primary.action,
            backgroundColor: "color-mix(in srgb, var(--c-primary-action) 10%, white)",
          }}
        >
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-white"
            style={{ backgroundColor: color.primary.action }}
            aria-hidden="true"
          >
            <Check className="h-3 w-3" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-600">Selected segment</p>
            <p className={`truncate text-sm font-medium ${tw.textPrimary}`}>
              {selectedSegment.name}
            </p>
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className={`text-sm ${tw.textDanger}`}>{error}</p>
      ) : segments.length === 0 ? (
        <p className={`text-sm ${tw.textSecondary}`}>
          {source === "saved_segments"
            ? "No saved segments match this search. Saved segments are private segments and segments you created."
            : "No catalog segments match this search."}
        </p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {segments.map((segment) => {
            const selected = segment.id === selectedId;
            return (
              <button
                key={segment.id}
                type="button"
                ref={(node) => {
                  rowRefs.current[segment.id] = node;
                }}
                aria-pressed={selected}
                onClick={() => onSelect(segment)}
                className={`flex w-full items-start gap-3 border-2 px-4 py-3 text-left ${tw.rounded} ${
                  selected ? "" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                style={
                  selected
                    ? {
                        borderColor: color.primary.action,
                        backgroundColor:
                          "color-mix(in srgb, var(--c-primary-action) 10%, white)",
                      }
                    : undefined
                }
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                    selected ? "text-white" : "bg-white"
                  }`}
                  style={
                    selected
                      ? {
                          backgroundColor: color.primary.action,
                          borderColor: color.primary.action,
                        }
                      : { borderColor: color.border.default }
                  }
                  aria-hidden="true"
                >
                  {selected ? <Check className="h-3 w-3" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className={`text-sm font-medium ${tw.textPrimary}`}>
                      {segment.name}
                    </span>
                    <span
                      className={`shrink-0 text-xs ${selected ? "font-medium" : tw.textSecondary}`}
                      style={selected ? { color: color.primary.action } : undefined}
                    >
                      {selected
                        ? "Selected"
                        : segment.size_estimate == null
                          ? "Size not computed"
                          : `${segment.size_estimate.toLocaleString()} members`}
                    </span>
                  </span>
                  {segment.description && (
                    <span className={`mt-1 block text-xs ${tw.textSecondary}`}>
                      {segment.description}
                    </span>
                  )}
                  {selected && segment.size_estimate != null && (
                    <span className={`mt-1 block text-xs ${tw.textSecondary}`}>
                      {segment.size_estimate.toLocaleString()} members
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
