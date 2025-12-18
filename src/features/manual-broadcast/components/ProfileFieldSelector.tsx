/**
 * ProfileFieldSelector Component
 * 
 * Displays fields filtered by selected source with search/filter capability.
 * This is the second level of the hierarchical variable selector.
 * 
 * Requirements: 3.2, 3.4
 * - WHEN a user selects a Profile_Source THEN the Manual_Broadcast_System 
 *   SHALL display the available Profile_Fields for that source
 * - WHEN displaying Profile_Fields THEN the Manual_Broadcast_System 
 *   SHALL show the field name and description for each available field
 */

import { useState, useMemo } from "react";
import { Search, FileText, Hash, Calendar, ToggleLeft, Clock } from "lucide-react";
import { tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import type { ProfileField } from "../types";

// Primary color for styling
const PRIMARY_COLOR = "#3B82F6";

interface ProfileFieldSelectorProps {
  /** Array of profile fields to display */
  fields: ProfileField[];
  /** Callback when a field is selected */
  onFieldSelect: (field: ProfileField) => void;
  /** Initial search query */
  searchQuery?: string;
  /** Whether the component is in loading state */
  isLoading?: boolean;
}

/**
 * Returns the appropriate icon for a field type
 */
function getFieldTypeIcon(fieldType: string) {
  switch (fieldType.toLowerCase()) {
    case "numeric":
    case "integer":
    case "number":
      return Hash;
    case "date":
      return Calendar;
    case "timestamp":
      return Clock;
    case "boolean":
      return ToggleLeft;
    case "text":
    case "string":
    default:
      return FileText;
  }
}

export default function ProfileFieldSelector({
  fields,
  onFieldSelect,
  searchQuery: initialSearchQuery = "",
  isLoading = false,
}: ProfileFieldSelectorProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  // Filter fields based on search query
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) {
      return fields;
    }
    const query = searchQuery.toLowerCase().trim();
    return fields.filter(
      (field) =>
        field.name.toLowerCase().includes(query) ||
        field.description.toLowerCase().includes(query) ||
        field.value.toLowerCase().includes(query)
    );
  }, [fields, searchQuery]);

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full mx-auto mb-2" />
        <p className={`text-sm ${tw.textMuted}`}>{t.manualBroadcast.loading}</p>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className={`text-sm ${tw.textMuted}`}>
          {t.manualBroadcast.noFieldsAvailable}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className={`text-xs font-medium ${tw.textSecondary} px-2`}>
        {t.manualBroadcast.selectField}
      </p>
      
      {/* Search input */}
      <div className="px-2">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tw.textMuted}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.manualBroadcast.searchFields}
            className={`w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 ${tw.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>
      </div>

      {/* Fields list */}
      <div className="max-h-56 overflow-y-auto">
        {filteredFields.length === 0 ? (
          <div className="p-4 text-center">
            <p className={`text-sm ${tw.textMuted}`}>
              {t.manualBroadcast.noFieldsMatchSearch}
            </p>
          </div>
        ) : (
          filteredFields.map((field) => {
            const IconComponent = getFieldTypeIcon(field.fieldType);
            
            return (
              <button
                key={field.id}
                onClick={() => onFieldSelect(field)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-800`}
              >
                <div
                  className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${PRIMARY_COLOR}15` }}
                >
                  <IconComponent
                    className="w-3.5 h-3.5"
                    style={{ color: PRIMARY_COLOR }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${tw.textPrimary} truncate`}>
                    {field.name}
                  </p>
                  {field.description && (
                    <p className={`text-xs ${tw.textMuted} line-clamp-2 mt-0.5`}>
                      {field.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
