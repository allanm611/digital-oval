import { useState, useEffect, useCallback } from 'react';
import { customerIdentityService } from '../../customerIdentity/services/customerIdentityService';

/**
 * Hook to fetch and manage message variable fields for dynamic variable insertion
 *
 * USED BY:
 * - Manual Communications (CascadingVariableSelector)
 * - Offer Creatives (OfferCreativeModal - variable insertion)
 *
 * Filters by is_active: true to only show fields activated in Message Variables Configuration
 * default_value is used as placeholder/default
 *
 * Same endpoint as customer identity fields, but filtered for message variables only
 */

interface MessageVariableField {
  id: number;
  field_name: string;
  field_value: string;
  description?: string;
  field_type?: string;
  source_table?: string;
  is_active?: boolean;
  default_value?: string;
}

interface MessageVariableCategory {
  id?: number;
  category?: string;
  name?: string;
  value?: string;
  description?: string;
  fields?: MessageVariableField[];
  sub_categories?: MessageVariableCategory[];
}

interface UseMessageVariableFieldsReturn {
  categories: MessageVariableCategory[];
  allFields: MessageVariableField[];
  isLoading: boolean;
  error: string | null;
  getFieldById: (id: number) => MessageVariableField | undefined;
  getFieldByValue: (value: string) => MessageVariableField | undefined;
  refetch: () => Promise<void>;
}

export function useMessageVariableFields(): UseMessageVariableFieldsReturn {
  const [categories, setCategories] = useState<MessageVariableCategory[]>([]);
  const [allFields, setAllFields] = useState<MessageVariableField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all categories with their fields
      const profiles = await customerIdentityService.getProfiles(true);
      const allCategories = profiles.data?.[0]?.field_selector_config ?? [];

      // Extract all fields across all categories (including sub-categories), filtering by is_active and is_dynamic_variable
      const allFieldsList: MessageVariableField[] = [];
      const extractFieldsFromCategory = (cat: any) => {
        // Extract fields from the category itself (only if is_active AND is_dynamic_variable)
        if (cat?.fields && Array.isArray(cat.fields)) {
          const activeFields = cat.fields.filter((f: any) => f?.is_active !== false && f?.is_dynamic_variable === true);
          allFieldsList.push(...activeFields);
        }
        // Extract fields from sub-categories
        if (cat?.sub_categories && Array.isArray(cat.sub_categories)) {
          cat.sub_categories.forEach((subCat: any) => {
            if (subCat?.fields && Array.isArray(subCat.fields)) {
              const activeSubFields = subCat.fields.filter((f: any) => f?.is_active !== false && f?.is_dynamic_variable === true);
              allFieldsList.push(...activeSubFields);
            }
          });
        }
      };
      allCategories.forEach(extractFieldsFromCategory);

      // Filter categories recursively to only include those that are active and have active fields marked as dynamic variables
      const filterCategoriesRecursive = (cats: any[]): MessageVariableCategory[] => {
        return cats
          .filter((cat) => cat?.is_active !== false)
          .map((cat) => ({
            ...cat,
            fields: (cat?.fields || []).filter((f: any) => f?.is_active !== false && f?.is_dynamic_variable === true),
            sub_categories: cat?.sub_categories ? filterCategoriesRecursive(cat.sub_categories) : undefined,
          }))
          .filter((cat) => {
            const catValue = (cat.value || '').toLowerCase();
            const hasFields = cat.fields && cat.fields.length > 0;
            const hasSubCategories = cat.sub_categories && cat.sub_categories.length > 0;
            const isSegmentOrQuickList = ['segments', 'quicklists'].includes(catValue);
            return hasFields || hasSubCategories || isSegmentOrQuickList;
          });
      };

      const filteredCategories = filterCategoriesRecursive(allCategories);

      // Set categories and all fields
      setCategories(filteredCategories as MessageVariableCategory[]);
      setAllFields(allFieldsList);
    } catch (err) {
      console.error('Failed to fetch message variable fields:', err);
      setError(err instanceof Error ? err.message : 'Failed to load message variable fields');
      setCategories([]);
      setAllFields([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  // Listen for updates from Message Variables Configuration
  useEffect(() => {
    const handleConfigurationUpdate = () => {
      fetchFields();
    };

    window.addEventListener('messageVariablesConfigurationUpdated', handleConfigurationUpdate);
    return () => window.removeEventListener('messageVariablesConfigurationUpdated', handleConfigurationUpdate);
  }, [fetchFields]);

  const getFieldById = useCallback(
    (id: number): MessageVariableField | undefined => {
      return allFields.find((field) => field.id === id);
    },
    [allFields],
  );

  const getFieldByValue = useCallback(
    (value: string): MessageVariableField | undefined => {
      return allFields.find((field) => field.field_value === value);
    },
    [allFields],
  );

  return {
    categories,
    allFields,
    isLoading,
    error,
    getFieldById,
    getFieldByValue,
    refetch: fetchFields,
  };
}
