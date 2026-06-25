/**
 * HierarchicalVariableSelector Component
 * 
 * Main component for hierarchical variable selection from customer profile sources.
 * Combines ProfileSourceSelector and ProfileFieldSelector to provide a two-level
 * selection interface for template variables.
 * 
 * Requirements: 3.1, 3.2, 3.3
 * - WHEN a user opens the variable selector in the message editor THEN the Manual_Broadcast_System 
 *   SHALL display a list of available Profile_Sources
 * - WHEN a user selects a Profile_Source THEN the Manual_Broadcast_System 
 *   SHALL display the available Profile_Fields for that source
 * - WHEN a user selects a Profile_Field THEN the Manual_Broadcast_System 
 *   SHALL insert the corresponding Template_Variable into the message at the cursor position
 */

import { useState, useMemo, useCallback } from "react";
import { ArrowLeft, Variable } from "lucide-react";
import { tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";

// Primary color for styling
const PRIMARY_COLOR = "#3B82F6";
import { useMessageVariableFields } from "../hooks/useMessageVariableFields";
import ProfileSourceSelector from "./ProfileSourceSelector";
import ProfileFieldSelector from "./ProfileFieldSelector";
import type { TemplateVariable, ProfileSource, ProfileField } from "../types";

interface QuicklistColumn {
  name: string;
  [key: string]: any;
}

interface HierarchicalVariableSelectorProps {
  /** Callback when a variable is selected */
  onVariableSelect: (variable: TemplateVariable) => void;
  /** Initially selected source ID */
  selectedSource?: number;
  /** Callback when source selection changes */
  onSourceChange?: (sourceId: number) => void;
  /** Custom class name for the container */
  className?: string;
  /** Quicklist columns to display as an additional source */
  quicklistColumns?: QuicklistColumn[];
}

export default function HierarchicalVariableSelector({
  onVariableSelect,
  selectedSource: initialSelectedSource,
  onSourceChange,
  className = "",
  quicklistColumns = [],
}: HierarchicalVariableSelectorProps) {
  const { t } = useLanguage();
  const { categories, isLoading, error } = useMessageVariableFields();
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(
    initialSelectedSource ?? null
  );
  const [isQuicklistSelected, setIsQuicklistSelected] = useState(false);

  // Transform categories to ProfileSource format
  const profileSources: ProfileSource[] = useMemo(() => {
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      value: category.value,
      description: category.description,
      fieldCount: category.fields?.length || 0,
    }));
  }, [categories]);

  // Get fields for the selected source
  const selectedSourceFields: ProfileField[] = useMemo(() => {
    if (selectedSourceId === null) return [];
    
    const category = categories.find((c) => c.id === selectedSourceId);
    if (!category || !category.fields) return [];

    return category.fields.map((field) => {
      const fieldType = field?.field_type ?? field?.type ?? "text";
      return {
        id: field.id,
        name: field?.field_name ?? "",
        value: field?.field_value ?? "",
        description: field?.description ?? "",
        fieldType: String(fieldType || "text"),
        sourceTable: field?.source_table ?? "",
      };
    });
  }, [categories, selectedSourceId]);

  // Get the selected source name
  const selectedSourceName = useMemo(() => {
    if (selectedSourceId === null) return "";
    const source = profileSources.find((s) => s.id === selectedSourceId);
    return source?.name || "";
  }, [profileSources, selectedSourceId]);

  // Handle source selection
  const handleSourceSelect = useCallback(
    (sourceId: number) => {
      setSelectedSourceId(sourceId);
      setIsQuicklistSelected(false);
      onSourceChange?.(sourceId);
    },
    [onSourceChange]
  );

  // Handle quicklist selection
  const handleQuicklistSelect = useCallback(() => {
    setIsQuicklistSelected(true);
    setSelectedSourceId(null);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    setSelectedSourceId(null);
    setIsQuicklistSelected(false);
  }, []);

  // Handle quicklist column selection
  const handleQuicklistColumnSelect = useCallback(
    (columnName: string) => {
      const templateVariable: TemplateVariable = {
        id: columnName,
        name: columnName,
        value: columnName,
        sourceId: -1, // Special ID for quicklist columns
        sourceName: "Quicklist Columns",
        description: `Column from quicklist: ${columnName}`,
        fieldType: "quicklist_column",
      };

      onVariableSelect(templateVariable);
    },
    [onVariableSelect]
  );

  // Handle field selection - convert to TemplateVariable and emit
  const handleFieldSelect = useCallback(
    (field: ProfileField) => {
      const source = profileSources.find((s) => s.id === selectedSourceId);
      if (!source) return;

      const templateVariable: TemplateVariable = {
        id: field.id,
        name: field.name,
        value: field.value,
        sourceId: source.id,
        sourceName: source.name,
        description: field.description,
        fieldType: field.fieldType,
      };

      onVariableSelect(templateVariable);
    },
    [profileSources, selectedSourceId, onVariableSelect]
  );

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700"
        style={{ backgroundColor: `${PRIMARY_COLOR}08` }}
      >
        {(selectedSourceId !== null || isQuicklistSelected) && (
          <button
            onClick={handleBack}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            aria-label="Back to sources"
          >
            <ArrowLeft className={`w-4 h-4 ${tw.textSecondary}`} />
          </button>
        )}
        <Variable className="w-4 h-4" style={{ color: PRIMARY_COLOR }} />
        <span className={`text-sm font-medium ${tw.textPrimary}`}>
          {isQuicklistSelected
            ? "Quicklist Columns"
            : selectedSourceId !== null
            ? selectedSourceName
            : t.manualBroadcast.selectProfileSource}
        </span>
      </div>

      {/* Content */}
      <div className="p-2">
        {selectedSourceId === null && !isQuicklistSelected ? (
          <ProfileSourceSelector
            sources={profileSources}
            selectedSourceId={selectedSourceId}
            onSourceSelect={handleSourceSelect}
            onQuicklistSelect={quicklistColumns.length > 0 ? handleQuicklistSelect : undefined}
            quicklistColumnCount={quicklistColumns.length}
            isLoading={isLoading}
            error={error ? t.manualBroadcast.errorLoadingFields : null}
          />
        ) : isQuicklistSelected ? (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {quicklistColumns.map((column, idx) => (
              <button
                key={`${column.name}-${idx}`}
                onClick={() => handleQuicklistColumnSelect(column.name)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <p className={`text-sm font-medium ${tw.textPrimary}`}>
                  {column.name}
                </p>
                <ChevronRight className={`w-4 h-4 ${tw.textMuted}`} />
              </button>
            ))}
          </div>
        ) : (
          <ProfileFieldSelector
            fields={selectedSourceFields}
            onFieldSelect={handleFieldSelect}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
