import { useState, useEffect, useCallback } from 'react';
import { segmentService } from '../services/segmentService';
import type { 
  SegmentationField, 
  SegmentationFieldCategory,
  SegmentationOperator 
} from '../types/segment';

interface UseSegmentationFieldsReturn {
  categories: SegmentationFieldCategory[];
  allFields: SegmentationField[];
  isLoading: boolean;
  error: string | null;
  getFieldById: (id: number) => SegmentationField | undefined;
  getFieldByValue: (value: string) => SegmentationField | undefined;
  getFieldByName: (fieldName: string) => SegmentationField | undefined;
  getOperatorsForField: (fieldId: number) => SegmentationOperator[];
  getFieldType: (fieldId: number) => string | null;
}

/**
 * Hook to fetch and manage segmentation fields from the backend
 */
export function useSegmentationFields(): UseSegmentationFieldsReturn {
  const [categories, setCategories] = useState<SegmentationFieldCategory[]>([]);
  const [allFields, setAllFields] = useState<SegmentationField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await segmentService.getSegmentationFields(true);

        if (response && response.success && response.data && response.data.length > 0) {
          const fieldCategories = response.data[0]?.field_selector_config || [];
          setCategories(Array.isArray(fieldCategories) ? fieldCategories : []);

          // Flatten all fields from all categories and subcategories
          const fields = (Array.isArray(fieldCategories) ? fieldCategories : []).flatMap(category => {
            const categoryFields = category.fields || [];
            const subcategoryFields = (category.sub_categories || []).flatMap(sub => sub.fields || []);
            return [...categoryFields, ...subcategoryFields];
          });
          setAllFields(Array.isArray(fields) ? fields : []);
        } else {
          setCategories([]);
          setAllFields([]);
        }
      } catch (err) {
        console.error('Failed to fetch segmentation fields:', err);
        setError(err instanceof Error ? err.message : 'Failed to load segmentation fields');
        // Ensure we always set empty arrays, never null
        setCategories([]);
        setAllFields([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFields();
  }, []);

  const getFieldById = useCallback((id: number): SegmentationField | undefined => {
    return allFields.find(field => field.id === id);
  }, [allFields]);

  const getFieldByValue = useCallback((value: string): SegmentationField | undefined => {
    return allFields.find(field => field.field_value === value);
  }, [allFields]);

  const getFieldByName = useCallback((fieldName: string): SegmentationField | undefined => {
    return allFields.find(field => field.field_name === fieldName);
  }, [allFields]);

  const getOperatorsForField = useCallback((fieldId: number): SegmentationOperator[] => {
    const field = getFieldById(fieldId);
    return field?.operators || [];
  }, [allFields, getFieldById]);

  const getFieldType = useCallback((fieldId: number): string | null => {
    const field = getFieldById(fieldId);
    return field?.field_type || null;
  }, [allFields, getFieldById]);

  return {
    categories,
    allFields,
    isLoading,
    error,
    getFieldById,
    getFieldByValue,
    getFieldByName,
    getOperatorsForField,
    getFieldType,
  };
}
