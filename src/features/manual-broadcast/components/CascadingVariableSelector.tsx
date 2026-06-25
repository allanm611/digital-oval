/**
 * CascadingVariableSelector Component
 *
 * A cascading dropdown selector for template variables.
 * Shows sources (categories) in the first level, fields in the second level (submenu).
 * More ergonomic than the hierarchical panel approach.
 * 
 * Uses useMessageVariableFields() which returns ONLY fields activated for message variables.
 * This ensures consistency across Manual Communications and Offer Creatives.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronRight, Database } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useMessageVariableFields } from "../hooks/useMessageVariableFields";
import type { TemplateVariable, ProfileSource, ProfileField } from "../types";

const PRIMARY_COLOR = "#3B82F6";

interface QuicklistColumn {
  name: string;
  [key: string]: any;
}

interface CascadingVariableSelectorProps {
  onVariableSelect: (variable: TemplateVariable) => void;
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
  quicklistColumns?: QuicklistColumn[];
}

export default function CascadingVariableSelector({
  onVariableSelect,
  isOpen,
  onClose,
  quicklistColumns = [],
}: CascadingVariableSelectorProps) {
  const { t } = useLanguage();
  const { categories, isLoading } = useMessageVariableFields();
  const [hoveredSourceId, setHoveredSourceId] = useState<number | null>(null);
  const [hoveredQuicklistSource, setHoveredQuicklistSource] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform categories to ProfileSource format, flattening categories with only sub-categories
  const { profileSources, categoryMap } = useMemo(() => {
    let sourceIndex = 0;
    const flattenedSources: ProfileSource[] = [];
    const sourceToCategory = new Map<number, any>();

    const processCategoryRecursive = (category: any) => {
      // Count direct fields
      const directFieldCount = category.fields?.length || 0;
      const hasSubCategories = category.sub_categories && category.sub_categories.length > 0;

      // If category has no direct fields but has sub-categories, process sub-categories instead
      if (directFieldCount === 0 && hasSubCategories) {
        category.sub_categories.forEach(processCategoryRecursive);
      } else {
        // Count all fields (direct + from sub-categories)
        let totalFieldCount = directFieldCount;
        if (hasSubCategories) {
          category.sub_categories.forEach((subCat: any) => {
            totalFieldCount += subCat.fields?.length || 0;
          });
        }

        const source: ProfileSource = {
          id: sourceIndex,
          name: category.category || category.name || "Unknown",
          value:
            category.value ||
            category.category?.toLowerCase().replace(/\s+/g, "_") ||
            "",
          description: "",
          fieldCount: totalFieldCount,
        };

        flattenedSources.push(source);
        sourceToCategory.set(sourceIndex, category);
        sourceIndex++;
      }
    };

    categories.forEach(processCategoryRecursive);
    return {
      profileSources: flattenedSources.filter((source) => source.name),
      categoryMap: sourceToCategory,
    };
  }, [categories]);

  // Get fields for hovered source
  const hoveredSourceFields: ProfileField[] = useMemo(() => {
    if (hoveredSourceId === null) return [];

    const category = categoryMap.get(hoveredSourceId);
    if (!category || !category.fields) return [];

    return (category.fields || []).map((field: any) => {
      const fieldType = field?.field_type ?? field?.type ?? "text";
      return {
        id: field?.id,
        name: field?.field_name || "Unknown",
        value: field?.field_value ?? "",
        description: field?.description ?? "",
        fieldType: String(fieldType || "text"),
        sourceTable: field?.source_table ?? "",
      };
    });
  }, [categoryMap, hoveredSourceId]);

  // Filter fields by search query
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return hoveredSourceFields;
    const query = searchQuery.toLowerCase();
    return hoveredSourceFields.filter(
      (field) =>
        (field.name || "").toLowerCase().includes(query) ||
        (field.description && field.description.toLowerCase().includes(query)),
    );
  }, [hoveredSourceFields, searchQuery]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Handle field selection
  const handleFieldSelect = (field: ProfileField) => {
    const source = profileSources.find((s) => s.id === hoveredSourceId);
    if (!source) return;

    const fieldType = field?.fieldType ?? field?.type ?? "text";
    const templateVariable: TemplateVariable = {
      id: field.id,
      name: field.name ?? "Unknown",
      value: field.value ?? "",
      sourceId: source.id,
      sourceName: source.name ?? "Unknown",
      sourceValue: source.value ?? "",
      description: field.description ?? "",
      fieldType: String(fieldType || "text"),
    };

    onVariableSelect(templateVariable);
    onClose();
    setSearchQuery("");
    setHoveredSourceId(null);
  };

  // Handle quicklist column selection
  const handleQuicklistColumnSelect = (columnName: string) => {
    const templateVariable: TemplateVariable = {
      id: columnName,
      name: columnName,
      value: columnName,
      sourceId: -1,
      sourceName: "Quicklist Columns",
      sourceValue: "quicklist_columns",
      description: `Column from quicklist: ${columnName}`,
      fieldType: "quicklist_column",
    };

    onVariableSelect(templateVariable);
    onClose();
    setSearchQuery("");
    setHoveredQuicklistSource(false);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 mt-1 z-50 flex"
      style={{ minWidth: "200px" }}
    >
      {/* Sources List (Level 1) */}
      <div
        className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        style={{ minWidth: "220px" }}
      >
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">
            {t.manualBroadcast.selectProfileSource}
          </p>
        </div>

        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full mx-auto" />
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {/* Quicklist Columns Section */}
            {quicklistColumns.length > 0 && (
              <div
                onMouseEnter={() => {
                  setHoveredQuicklistSource(true);
                  setHoveredSourceId(null);
                }}
                className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Database
                    className="w-4 h-4"
                    style={{
                      color: "#9CA3AF",
                    }}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${tw.textPrimary}`}
                    >
                      Quicklist Columns
                    </p>
                    <p className="text-xs text-gray-400">
                      {quicklistColumns.length}{" "}
                      {quicklistColumns.length === 1 ? "column" : "columns"}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className="w-4 h-4"
                  style={{
                    color: "#D1D5DB",
                  }}
                />
              </div>
            )}

            {/* KPI Source Categories */}
            {profileSources.map((source) => (
              <div
                key={source.id}
                onMouseEnter={() => {
                  setHoveredSourceId(source.id);
                  setHoveredQuicklistSource(false);
                }}
                className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Database
                    className="w-4 h-4"
                    style={{
                      color: "#9CA3AF",
                    }}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${tw.textPrimary}`}
                    >
                      {source.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {source.fieldCount}{" "}
                      {source.fieldCount === 1
                        ? t.manualBroadcast.fieldSingular
                        : t.manualBroadcast.fieldPlural}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className="w-4 h-4"
                  style={{
                    color: "#D1D5DB",
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fields List (Level 2 - Submenu) */}
      {hoveredQuicklistSource && quicklistColumns.length > 0 && (
        <div
          className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden ml-1"
          style={{ minWidth: "280px" }}
        >
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              {t.manualBroadcast.selectField}
            </p>
            {/* Search Input */}
            <SearchInput
              placeholder="Search columns..."
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {quicklistColumns
              .filter((col) =>
                searchQuery.trim()
                  ? col.name.toLowerCase().includes(searchQuery.toLowerCase())
                  : true
              )
              .map((column) => (
                <div
                  key={column.name}
                  onClick={() => handleQuicklistColumnSelect(column.name)}
                  className="px-3 py-2 cursor-pointer flex items-center justify-between"
                >
                  <p className="text-sm text-gray-900">{column.name}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {hoveredSourceId !== null && hoveredSourceFields.length > 0 && (
        <div
          className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden ml-1"
          style={{ minWidth: "280px" }}
        >
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              {t.manualBroadcast.selectField}
            </p>
            {/* Search Input */}
            <SearchInput
              placeholder={t.manualBroadcast.searchFields}
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredFields.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {t.manualBroadcast.noFieldsMatchSearch}
              </div>
            ) : (
              filteredFields.map((field) => (
                <div
                  key={field.id}
                  onClick={() => handleFieldSelect(field)}
                  className="px-3 py-2.5 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <p className={`text-sm font-medium ${tw.textPrimary}`}>
                    {field.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    {field.description || `{{${field.value}}}`}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
