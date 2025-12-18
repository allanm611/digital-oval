/**
 * ProfileSourceSelector Component
 * 
 * Displays a list of profile sources from segmentation fields.
 * This is the first level of the hierarchical variable selector.
 * 
 * Requirements: 3.1
 * - WHEN a user opens the variable selector in the message editor THEN the Manual_Broadcast_System 
 *   SHALL display a list of available Profile_Sources (Customer Identity, Subscription Details, 
 *   Service Status, Personal Information, Location Information)
 */

import { ChevronRight, Database } from "lucide-react";
import { tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import type { ProfileSource } from "../types";

// Primary color for styling
const PRIMARY_COLOR = "#3B82F6";

interface ProfileSourceSelectorProps {
  /** Array of profile sources to display */
  sources: ProfileSource[];
  /** Currently selected source ID */
  selectedSourceId: number | null;
  /** Callback when a source is selected */
  onSourceSelect: (sourceId: number) => void;
  /** Whether the component is in loading state */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
}

export default function ProfileSourceSelector({
  sources,
  selectedSourceId,
  onSourceSelect,
  isLoading = false,
  error = null,
}: ProfileSourceSelectorProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full mx-auto mb-2" />
        <p className={`text-sm ${tw.textMuted}`}>{t.manualBroadcast.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className={`text-sm ${tw.danger}`}>
          {error}
        </p>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className={`text-sm ${tw.textMuted}`}>
          {t.manualBroadcast.noSourcesAvailable}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className={`text-xs font-medium ${tw.textSecondary} px-2 py-1`}>
        {t.manualBroadcast.selectProfileSource}
      </p>
      <div className="max-h-64 overflow-y-auto">
        {sources.map((source) => {
          const isSelected = selectedSourceId === source.id;
          const fieldCountLabel = source.fieldCount === 1 
            ? t.manualBroadcast.fieldSingular 
            : t.manualBroadcast.fieldPlural;

          return (
            <button
              key={source.id}
              onClick={() => onSourceSelect(source.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-left rounded-md transition-colors ${
                isSelected
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              style={{
                borderLeft: isSelected ? `3px solid ${PRIMARY_COLOR}` : "3px solid transparent",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isSelected
                      ? `${PRIMARY_COLOR}20`
                      : "rgba(107, 114, 128, 0.1)",
                  }}
                >
                  <Database
                    className="w-4 h-4"
                    style={{
                      color: isSelected ? PRIMARY_COLOR : "currentColor",
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isSelected ? "" : tw.textPrimary
                    }`}
                    style={{ color: isSelected ? PRIMARY_COLOR : undefined }}
                  >
                    {source.name}
                  </p>
                  <p className={`text-xs ${tw.textMuted} truncate`}>
                    {source.fieldCount} {fieldCountLabel}
                  </p>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 flex-shrink-0 ${tw.textMuted}`}
                style={{ color: isSelected ? PRIMARY_COLOR : undefined }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
