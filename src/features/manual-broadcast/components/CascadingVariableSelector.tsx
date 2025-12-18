/**
 * CascadingVariableSelector Component
 * 
 * A cascading dropdown selector for template variables.
 * Shows sources in the first level, fields in the second level (submenu).
 * More ergonomic than the hierarchical panel approach.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronRight, Search, Database } from "lucide-react";
import { tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useSegmentationFields } from "../../segments/hooks/useSegmentationFields";
import type { TemplateVariable, ProfileSource, ProfileField } from "../types";

const PRIMARY_COLOR = "#3B82F6";

interface CascadingVariableSelectorProps {
  onVariableSelect: (variable: TemplateVariable) => void;
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export default function CascadingVariableSelector({
  onVariableSelect,
  isOpen,
  onClose,
}: CascadingVariableSelectorProps) {
  const { t } = useLanguage();
  const { categories, isLoading } = useSegmentationFields();
  const [hoveredSourceId, setHoveredSourceId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Get fields for hovered source
  const hoveredSourceFields: ProfileField[] = useMemo(() => {
    if (hoveredSourceId === null) return [];
    
    const category = categories.find((c) => c.id === hoveredSourceId);
    if (!category || !category.fields) return [];

    return category.fields.map((field) => ({
      id: field.id,
      name: field.field_name,
      value: field.field_value,
      description: field.description,
      fieldType: field.field_type,
      sourceTable: field.source_table,
    }));
  }, [categories, hoveredSourceId]);

  // Filter fields by search query
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return hoveredSourceFields;
    const query = searchQuery.toLowerCase();
    return hoveredSourceFields.filter(
      (field) =>
        field.name.toLowerCase().includes(query) ||
        field.description.toLowerCase().includes(query)
    );
  }, [hoveredSourceFields, searchQuery]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
    onClose();
    setSearchQuery("");
    setHoveredSourceId(null);
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
            {profileSources.map((source) => (
              <div
                key={source.id}
                onMouseEnter={() => setHoveredSourceId(source.id)}
                className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${
                  hoveredSourceId === source.id ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database 
                    className="w-4 h-4" 
                    style={{ color: hoveredSourceId === source.id ? PRIMARY_COLOR : "#9CA3AF" }}
                  />
                  <div>
                    <p className={`text-sm font-medium ${hoveredSourceId === source.id ? "text-blue-600" : tw.textPrimary}`}>
                      {source.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {source.fieldCount} {source.fieldCount === 1 ? t.manualBroadcast.fieldSingular : t.manualBroadcast.fieldPlural}
                    </p>
                  </div>
                </div>
                <ChevronRight 
                  className="w-4 h-4" 
                  style={{ color: hoveredSourceId === source.id ? PRIMARY_COLOR : "#D1D5DB" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fields List (Level 2 - Submenu) */}
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
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.manualBroadcast.searchFields}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
                  className="px-3 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
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
