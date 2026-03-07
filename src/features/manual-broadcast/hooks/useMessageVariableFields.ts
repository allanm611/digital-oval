import { useState, useEffect, useCallback } from 'react';
import { customerIdentityService } from '../../customerIdentity/services/customerIdentityService';

/**
 * Hook to fetch and manage message variable fields for dynamic variable insertion
 * 
 * USED BY:
 * - Manual Communications (CascadingVariableSelector)
 * - Offer Creatives (OfferCreativeModal - variable insertion)
 * 
 * FUTURE: When backend adds support, will filter by:
 * - is_active: true (only activated fields shown)
 * - default_value: used as placeholder/default
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
  fields: MessageVariableField[];
}

interface UseMessageVariableFieldsReturn {
  categories: MessageVariableCategory[];
  allFields: MessageVariableField[];
  isLoading: boolean;
  error: string | null;
  getFieldById: (id: number) => MessageVariableField | undefined;
  getFieldByValue: (value: string) => MessageVariableField | undefined;
}

export function useMessageVariableFields(): UseMessageVariableFieldsReturn {
  const [categories, setCategories] = useState<MessageVariableCategory[]>([]);
  const [allFields, setAllFields] = useState<MessageVariableField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all categories with their fields
        const profiles = await customerIdentityService.getProfiles(true);
        const allCategories = profiles.data?.[0]?.field_selector_config ?? [];

        // Extract all fields across all categories
        const allFieldsList: MessageVariableField[] = [];
        allCategories.forEach((cat) => {
          if (cat.fields && Array.isArray(cat.fields)) {
            allFieldsList.push(...cat.fields);
          }
        });

        // Set categories and all fields
        setCategories(allCategories as MessageVariableCategory[]);
        setAllFields(allFieldsList);
      } catch (err) {
        console.error('Failed to fetch message variable fields:', err);
        setError(err instanceof Error ? err.message : 'Failed to load message variable fields');
        setCategories([]);
        setAllFields([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFields();
  }, []);

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
  };
}
