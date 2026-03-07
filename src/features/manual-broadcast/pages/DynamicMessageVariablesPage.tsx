import { useState, useEffect } from 'react';
import { Power, PowerOff, Search, Edit, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { color, tw } from '../../../shared/utils/utils';
import { useMessageVariableFields } from '../hooks/useMessageVariableFields';
import { dynamicMessageVariableService } from '../services/dynamicMessageVariableService';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import BackButton from '../../../shared/components/ui/BackButton';

interface MessageVariableFieldConfig {
  id: number;
  field_name: string;
  field_value: string;
  description?: string;
  is_active: boolean;
  type?: string;
  default_value?: string;
}

interface CategoryConfig {
  id?: string;
  name: string;
  is_active: boolean;
  fields: MessageVariableFieldConfig[];
}

export default function DynamicMessageVariablesPage() {
  const { categories, allFields, isLoading } = useMessageVariableFields();

  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>([]);
  const [fieldConfigs, setFieldConfigs] = useState<MessageVariableFieldConfig[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editedDefaultValues, setEditedDefaultValues] = useState<{ [key: number]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [togglingCategoryId, setTogglingCategoryId] = useState<string | null>(null);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initialize configurations from fetched fields
  useEffect(() => {
    const loadStoredConfigurations = async () => {
      try {
        const storedConfigs = await dynamicMessageVariableService.loadConfigurations();

        const configs: MessageVariableFieldConfig[] = allFields.map((field) => {
          const stored = storedConfigs.find((c) => c.id === field.id);
          return (
            stored || {
              id: field.id,
              field_name: field.field_name,
              field_value: field.field_value,
              description: field.description,
              type: field.type,
              is_active: true,
              default_value: field.default_value || '',
            }
          );
        });
        setFieldConfigs(configs);

        // Build category configs
        const catConfigs: CategoryConfig[] = categories.map((cat) => ({
          id: cat.name || cat.category || 'General',
          name: cat.name || cat.category || 'General',
          is_active: true,
          fields: configs.filter((field) => {
            const catFields = cat.fields || [];
            return catFields.some((f) => f.id === field.id);
          }),
        }));
        setCategoryConfigs(catConfigs);
        setExpandedCategories(new Set(catConfigs.map((c) => c.id || c.name)));
      } catch (error) {
        console.error('Failed to load configurations:', error);
      }
    };

    if (allFields.length > 0) {
      loadStoredConfigurations();
    }
  }, [allFields, categories]);

  const toggleCategoryExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleToggleCategoryActive = async (categoryId: string) => {
    try {
      setTogglingCategoryId(categoryId);
      const updated = categoryConfigs.map((cat) =>
        cat.id === categoryId ? { ...cat, is_active: !cat.is_active } : cat
      );
      setCategoryConfigs(updated);
      await dynamicMessageVariableService.saveConfigurations(fieldConfigs);
    } catch (error) {
      console.error('Failed to toggle category activation:', error);
    } finally {
      setTogglingCategoryId(null);
    }
  };

  const handleToggleFieldActive = async (fieldId: number) => {
    try {
      setTogglingId(fieldId);
      const updated = fieldConfigs.map((config) =>
        config.id === fieldId ? { ...config, is_active: !config.is_active } : config
      );
      setFieldConfigs(updated);
      await dynamicMessageVariableService.saveConfigurations(updated);
    } catch (error) {
      console.error('Failed to toggle field activation:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDefaultValueChange = (fieldId: number, value: string) => {
    setEditedDefaultValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSaveCategoryDefaults = async (categoryId: string) => {
    try {
      setSavingCategoryId(categoryId);
      const category = categoryConfigs.find((c) => c.id === categoryId);
      if (!category) return;

      // Update field configs with edited default values
      const updated = fieldConfigs.map((config) => {
        if (editedDefaultValues.hasOwnProperty(config.id)) {
          return { ...config, default_value: editedDefaultValues[config.id] };
        }
        return config;
      });

      setFieldConfigs(updated);
      await dynamicMessageVariableService.saveConfigurations(updated);

      // Clear edited values for this category
      const clearedValues = { ...editedDefaultValues };
      category.fields.forEach((field) => {
        delete clearedValues[field.id];
      });
      setEditedDefaultValues(clearedValues);
    } catch (error) {
      console.error('Failed to save category defaults:', error);
    } finally {
      setSavingCategoryId(null);
    }
  };

  // Filter categories and fields by search term
  const filteredCategories = categoryConfigs
    .map((cat) => ({
      ...cat,
      fields: cat.fields.filter(
        (field) =>
          field.field_name.toLowerCase().includes(debouncedSearchTerm) ||
          field.description?.toLowerCase().includes(debouncedSearchTerm) ||
          field.field_value.toLowerCase().includes(debouncedSearchTerm)
      ),
    }))
    .filter((cat) => cat.fields.length > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <BackButton fallbackTo="/dashboard/configurations" />
        <div>
          <h1 className={`${tw.tableFirstColumn} ${tw.textPrimary}`}>
            Dynamic Message Variables
          </h1>
          <p className={`${tw.textSecondary} text-sm mt-1`}>
            Manage customer identity fields for message and creative variables
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search fields by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-gray-400"
        />
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div
            className={`${tw.rounded} border p-8 text-center`}
            style={{ borderColor: color.border.default, backgroundColor: 'white' }}
          >
            <Search className={`w-12 h-12 ${tw.textMuted} mx-auto mb-4`} />
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
              {searchTerm ? 'No fields found' : 'No fields available'}
            </h3>
            <p className={tw.textSecondary}>
              {searchTerm ? 'Try adjusting your search terms' : 'No fields are available'}
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category.id}
              className={`${tw.rounded} border overflow-hidden`}
              style={{ borderColor: color.border.default, backgroundColor: 'white' }}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategoryExpanded(category.id || category.name)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {expandedCategories.has(category.id || category.name) ? (
                    <ChevronDown className="w-5 h-5" style={{ color: color.text.primary }} />
                  ) : (
                    <ChevronRight className="w-5 h-5" style={{ color: color.text.primary }} />
                  )}
                  <div className="text-left">
                    <h3 className={`font-semibold ${tw.textPrimary}`}>{category.name}</h3>
                    <p className={`text-xs ${tw.textMuted}`}>{category.fields.length} fields</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCategoryActive(category.id || category.name);
                  }}
                  disabled={togglingCategoryId === (category.id || category.name)}
                  className="p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  title={category.is_active ? 'Deactivate category' : 'Activate category'}
                >
                  {togglingCategoryId === (category.id || category.name) ? (
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  ) : category.is_active ? (
                    <PowerOff className="w-4 h-4 text-orange-600" />
                  ) : (
                    <Power className="w-4 h-4 text-green-600" />
                  )}
                </button>
              </button>

              {/* Category Fields */}
              {expandedCategories.has(category.id || category.name) && (
                <div style={{ borderTop: `1px solid ${color.border.default}` }}>
                  <div className="divide-y divide-gray-200">
                    {category.fields.map((field) => (
                      <div
                        key={field.id}
                        className="p-4"
                        style={{ opacity: category.is_active ? 1 : 0.6 }}
                      >
                        {/* Field Name and Toggle */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {field.field_value}
                              </code>
                              <h4 className={`font-medium ${tw.textPrimary}`}>{field.field_name}</h4>
                            </div>
                            {field.description && (
                              <p className={`text-sm ${tw.textSecondary}`}>{field.description}</p>
                            )}
                            {field.type && (
                              <p className={`text-xs ${tw.textMuted} mt-1`}>Type: {field.type}</p>
                            )}
                          </div>

                          <button
                            onClick={() => handleToggleFieldActive(field.id)}
                            disabled={togglingId === field.id || !category.is_active}
                            className="p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 ml-2"
                            title={field.is_active ? 'Deactivate field' : 'Activate field'}
                          >
                            {togglingId === field.id ? (
                              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                            ) : field.is_active ? (
                              <PowerOff className="w-4 h-4 text-orange-600" />
                            ) : (
                              <Power className="w-4 h-4 text-green-600" />
                            )}
                          </button>
                        </div>

                        {/* Default Value Input */}
                        <div>
                          <label className={`text-xs font-medium ${tw.textMuted} block mb-2`}>
                            Default Value
                          </label>
                          <input
                            type="text"
                            value={editedDefaultValues[field.id] !== undefined ? editedDefaultValues[field.id] : field.default_value || ''}
                            onChange={(e) => handleDefaultValueChange(field.id, e.target.value)}
                            placeholder="e.g., N/A, Unknown..."
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1"
                            style={{ borderColor: color.primary.accent }}
                            disabled={!category.is_active}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Save Button */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={() => handleSaveCategoryDefaults(category.id || category.name)}
                      disabled={savingCategoryId === (category.id || category.name) || !category.is_active}
                      className="px-4 py-2 text-sm font-medium text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: color.primary.action }}
                    >
                      {savingCategoryId === (category.id || category.name) ? 'Saving...' : 'Save Defaults'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
