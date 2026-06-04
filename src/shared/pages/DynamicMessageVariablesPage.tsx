import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { color, tw } from '../utils/utils';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { customerIdentityService } from '../../features/customerIdentity/services/customerIdentityService';
import { extractBackendError } from "../utils/errorHandler";;;
import { kpiService } from '../../features/kpis/services/kpiService';
import { kpiCategoryService } from '../../features/kpis/services/kpiCategoryService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import BackButton from '../components/ui/BackButton';
import ActivateDeactivateButton from '../components/ui/ActivateDeactivateButton';
import HeadlessSelect from '../components/ui/HeadlessSelect';
import SearchInput from '../components/ui/SearchInput';
import { createPortal } from 'react-dom';

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
  backendId?: number;
  name: string;
  is_active: boolean;
  fields: MessageVariableFieldConfig[];
  sub_categories?: CategoryConfig[];
}

export default function DynamicMessageVariablesPage() {
  const { success: showToast, error: showError } = useToast();
  const { user } = useAuth();

  // Fetch ALL data (including inactive) for config management
  const [categories, setCategories] = useState<any[]>([]);
  const [allFields, setAllFields] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>([]);
  const [fieldConfigs, setFieldConfigs] = useState<MessageVariableFieldConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [togglingFieldIds, setTogglingFieldIds] = useState<Map<number, 'activate' | 'deactivate'>>(new Map());
  const [togglingCategoryId, setTogglingCategoryId] = useState<string | null>(null);
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<CategoryConfig | null>(null);

  // Fetch all data without filtering (including inactive categories/fields)
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true);
        const response = await customerIdentityService.getProfiles(true);
        const allCategories = response.data?.[0]?.field_selector_config ?? [];

        // Extract all fields (including inactive)
        const allFieldsList: any[] = [];
        const extractAllFields = (cat: any) => {
          if (cat.fields && Array.isArray(cat.fields)) {
            allFieldsList.push(...cat.fields);
          }
          if (cat.sub_categories && Array.isArray(cat.sub_categories)) {
            cat.sub_categories.forEach((subCat: any) => {
              if (subCat.fields && Array.isArray(subCat.fields)) {
                allFieldsList.push(...subCat.fields);
              }
            });
          }
        };
        allCategories.forEach(extractAllFields);

        setCategories(allCategories);
        setAllFields(allFieldsList);
      } catch (error) {
        console.error('Failed to load all message variable data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initialize configurations from fetched fields
  useEffect(() => {
    try {
      const configs: MessageVariableFieldConfig[] = allFields.map((field) => ({
        id: field.id,
        field_name: field.field_name,
        field_value: field.field_value,
        description: field.description,
        type: field.type,
        is_active: field.is_active !== false,
        default_value: field.default_value || '',
      }));
      setFieldConfigs(configs);

      // Build category configs with sub-categories support
      const buildCategoryConfigs = (categories: any[]): CategoryConfig[] => {
        return categories
          .filter((cat) => {
            const catValue = (cat.value || '').toLowerCase();
            return !['segments', 'quicklists'].includes(catValue);
          })
          .map((cat) => {
          // Get direct fields
          const catFieldIds = new Set<number>();
          if (cat.fields && Array.isArray(cat.fields)) {
            cat.fields.forEach((f: any) => catFieldIds.add(f.id));
          }

          // Build sub-categories if they exist
          const subCategoryConfigs = cat.sub_categories
            ? buildCategoryConfigs(cat.sub_categories)
            : undefined;

          return {
            id: cat.name || cat.category || 'General',
            backendId: cat.id,
            name: cat.name || cat.category || 'General',
            is_active: cat.is_active !== false,
            fields: configs.filter((field) => catFieldIds.has(field.id)),
            sub_categories: subCategoryConfigs,
          };
        });
      };

      const catConfigs = buildCategoryConfigs(categories);
      setCategoryConfigs(catConfigs);
    } catch (error) {
      console.error('Failed to load configurations:', error);
    }
  }, [allFields, categories]);

  // Update category configs when field configs change
  useEffect(() => {
    if (categoryConfigs.length > 0 && fieldConfigs.length > 0) {
      const updateCatFieldsRecursive = (cats: CategoryConfig[]): CategoryConfig[] => {
        return cats.map((cat) => ({
          ...cat,
          fields: cat.fields.map((field) => {
            const updatedField = fieldConfigs.find((f) => f.id === field.id);
            return updatedField || field;
          }),
          sub_categories: cat.sub_categories ? updateCatFieldsRecursive(cat.sub_categories) : undefined,
        }));
      };

      const updatedCatConfigs = updateCatFieldsRecursive(categoryConfigs);
      setCategoryConfigs(updatedCatConfigs);

      // Also update selected category modal if it's open
      if (selectedCategoryForModal) {
        const findCategoryRecursive = (cats: CategoryConfig[]): CategoryConfig | undefined => {
          for (const cat of cats) {
            if (cat.id === selectedCategoryForModal.id) return cat;
            if (cat.sub_categories) {
              const found = findCategoryRecursive(cat.sub_categories);
              if (found) return found;
            }
          }
          return undefined;
        };

        const updatedCategory = findCategoryRecursive(updatedCatConfigs);
        if (updatedCategory) {
          setSelectedCategoryForModal(updatedCategory);
        }
      }
    }
  }, [fieldConfigs]);

  const handleToggleCategoryActive = async (categoryId: string) => {
    try {
      setTogglingCategoryId(categoryId);

      // Find category recursively (handles nested sub_categories)
      const findCategoryRecursive = (cats: CategoryConfig[]): CategoryConfig | undefined => {
        for (const cat of cats) {
          if (cat.id === categoryId) return cat;
          if (cat.sub_categories) {
            const found = findCategoryRecursive(cat.sub_categories);
            if (found) return found;
          }
        }
        return undefined;
      };

      const foundCat = findCategoryRecursive(categoryConfigs);
      if (!foundCat || !foundCat.backendId) {
        showError('Failed to update category');
        return;
      }

      const isDeactivating = foundCat.is_active;
      const newStatus = !isDeactivating;

      // Toggle category recursively in UI (optimistic update)
      const toggleCategoryRecursive = (cats: CategoryConfig[]): CategoryConfig[] => {
        return cats.map((cat) => {
          if (cat.id === categoryId) {
            return { ...cat, is_active: newStatus };
          }
          if (cat.sub_categories) {
            return { ...cat, sub_categories: toggleCategoryRecursive(cat.sub_categories) };
          }
          return cat;
        });
      };

      const oldCategoryConfigs = categoryConfigs;
      const updated = toggleCategoryRecursive(categoryConfigs);
      setCategoryConfigs(updated);

      // If deactivating, also deactivate all fields in this category (optimistic)
      let oldFieldConfigs = fieldConfigs;
      if (isDeactivating && foundCat) {
        oldFieldConfigs = fieldConfigs;
        const updatedFields = fieldConfigs.map((field) =>
          foundCat.fields.some((f) => f.id === field.id)
            ? { ...field, is_active: false }
            : field
        );
        setFieldConfigs(updatedFields);
      }

      try {
        // Call backend to update category status
        await kpiCategoryService.updateKpiCategory(foundCat.backendId, {
          is_active: newStatus,
        });

        showToast(`Category ${isDeactivating ? 'deactivated' : 'activated'} successfully`);
      } catch (error) {
        // Revert UI if API fails
        setCategoryConfigs(oldCategoryConfigs);
        setFieldConfigs(oldFieldConfigs);
        throw error;
      }
    } catch (error) {
      console.error('Failed to toggle category activation:', error);
      showError(extractBackendError(error, 'Failed to update category'));
    } finally {
      setTogglingCategoryId(null);
    }
  };

  const handleToggleFieldActive = async (fieldId: number, desiredState?: boolean) => {
    try {
      const field = fieldConfigs.find((f) => f.id === fieldId);
      if (!field) {
        showError('Failed to update field');
        return;
      }

      const newState = desiredState !== undefined ? desiredState : !field.is_active;
      const action = newState ? 'activate' : 'deactivate';

      setTogglingFieldIds((prev) => new Map(prev).set(fieldId, action));

      // Update UI optimistically
      const oldFieldConfigs = fieldConfigs;
      const updated = fieldConfigs.map((config) =>
        config.id === fieldId
          ? { ...config, is_active: newState }
          : config
      );
      setFieldConfigs(updated);

      try {
        // Call backend to update field status
        await kpiService.toggleKPIStatus(field.id, newState);

        showToast(`Field ${newState ? 'activated' : 'deactivated'} successfully`);
      } catch (error) {
        // Revert UI if API fails
        setFieldConfigs(oldFieldConfigs);
        throw error;
      }
    } catch (error) {
      console.error('Failed to toggle field activation:', error);
      showError(extractBackendError(error, 'Failed to update field'));
    } finally {
      setTogglingFieldIds((prev) => {
        const next = new Map(prev);
        next.delete(fieldId);
        return next;
      });
    }
  };

  // Flatten categories to show sub-categories instead of parents with no direct fields
  const getFlattenedCategories = (cats: CategoryConfig[]): CategoryConfig[] => {
    const flattened: CategoryConfig[] = [];

    cats.forEach((cat) => {
      // If category has no direct fields but has sub-categories, show the sub-categories instead
      const fieldCount = cat.fields?.length ?? 0;
      const hasSubCategories = cat.sub_categories && cat.sub_categories.length > 0;

      if (fieldCount === 0 && hasSubCategories) {
        flattened.push(...getFlattenedCategories(cat.sub_categories));
      } else {
        // Otherwise, include the category as-is
        flattened.push(cat);
      }
    });

    return flattened;
  };

  const flatCategories = getFlattenedCategories(categoryConfigs);

  // Filter categories by search term and selected category
  const filteredCategories = flatCategories
    .filter((cat) => selectedCategory === 'all' || cat.id === selectedCategory)
    .filter((cat) =>
      cat.name.toLowerCase().includes(debouncedSearchTerm) ||
      cat.fields.some(
        (field) =>
          (field.field_name || "").toLowerCase().includes(debouncedSearchTerm) ||
          (field.field_value || "").toLowerCase().includes(debouncedSearchTerm)
      )
    );

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
      <BackButton showBreadcrumb={true} currentLabel="Message Variables Configuration" />

      {/* Search Bar and Category Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
          />
        </div>
        <div className="w-48">
          <HeadlessSelect
            options={[
              { value: 'all', label: 'All Categories' },
              ...flatCategories.map((cat) => ({
                value: cat.id || cat.name,
                label: cat.name,
              })),
            ]}
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value as string)}
            placeholder="Filter by category"
          />
        </div>
      </div>

      {/* Category Cards Grid */}
      {filteredCategories.length === 0 ? (
        <div
          className={`${tw.rounded} border p-8 text-center bg-white`}
          style={{ borderColor: color.border.default }}
        >
          <Search className={`w-12 h-12 ${tw.textMuted} mx-auto mb-4`} />
          <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
            {searchTerm ? 'No categories found' : 'No categories available'}
          </h3>
          <p className={tw.textSecondary}>
            {searchTerm ? 'Try adjusting your search terms' : 'No message variables have been activated yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category.id || category.name}
              className="bg-white border border-gray-200 rounded-lg p-6"
              style={{ opacity: category.is_active ? 1 : 0.6 }}
            >
              {/* Card Header: Name + Toggle */}
              <div className="flex items-start justify-between mb-2">
                <h3 className={`${tw.tableFirstColumn} text-gray-900 flex-1`}>
                  {category.name}
                </h3>
                <ActivateDeactivateButton
                  isActive={category.is_active}
                  onToggle={() => handleToggleCategoryActive(category.id || category.name)}
                  disabled={togglingCategoryId === (category.id || category.name)}
                  isLoading={togglingCategoryId === (category.id || category.name)}
                  title={category.is_active ? 'Deactivate category' : 'Activate category'}
                />
              </div>

              {/* Divider with Count and Button */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  {(category.fields?.length ?? 0)} field{(category.fields?.length ?? 0) !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => {
                    setSelectedCategoryForModal(category);
                    setIsFieldsModalOpen(true);
                  }}
                  className="text-sm font-medium text-gray-700 hover:underline transition-colors"
                >
                  View Fields
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fields Modal */}
      {isFieldsModalOpen && selectedCategoryForModal && (
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
          >
            <div
              className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className={`${tw.textPrimary} text-xl font-semibold`}>
                  {selectedCategoryForModal.name} - Fields
                </h2>
                <button
                  onClick={() => setIsFieldsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body - Table */}
              <div className="flex-1 overflow-auto px-6 py-4">
                <div
                  className={`border ${tw.rounded} overflow-hidden`}
                  style={{ borderColor: color.border.default }}
                >
                  <table
                    className="min-w-full divide-y"
                    style={{ borderColor: color.border.default }}
                  >
                    <thead style={{ backgroundColor: color.surface.cards }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Field Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Field Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Default Value
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className="bg-white divide-y"
                      style={{ borderColor: color.border.default }}
                    >
                      {selectedCategoryForModal.fields.map((field) => (
                        <tr
                          key={field.id}
                          className="transition-colors hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm text-black">
                            {field.field_value}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-black truncate">
                              {field.field_name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-black">
                              {field.description || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-black">
                            0
                          </td>
                          <td className="px-4 py-3 text-sm text-black">
                            {field.is_active ? 'Active' : 'Inactive'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleToggleFieldActive(field.id, true)}
                                disabled={field.is_active || togglingFieldIds.has(field.id) || !selectedCategoryForModal.is_active}
                                className="px-4 py-2 text-sm font-medium text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: color.primary.action }}
                              >
                                {togglingFieldIds.get(field.id) === 'activate' ? '...' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleToggleFieldActive(field.id, false)}
                                disabled={!field.is_active || togglingFieldIds.has(field.id) || !selectedCategoryForModal.is_active}
                                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {togglingFieldIds.get(field.id) === 'deactivate' ? '...' : 'Deactivate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setIsFieldsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
}
