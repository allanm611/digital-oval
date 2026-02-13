import { useEffect } from "react";

/**
 * Hook for persisting form data to localStorage
 * Automatically saves data on change and loads on mount
 */
export function useFormDataPersistence<T>(
  key: string,
  formData: T,
  setFormData: (data: T) => void,
  shouldClear?: boolean,
) {
  // Load persisted data on mount (only in create mode, not in edit mode)
  useEffect(() => {
    // Skip loading from localStorage if shouldClear is true (edit mode)
    if (shouldClear) {
      return;
    }

    const savedData = localStorage.getItem(key);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as T;
        setFormData(parsed);
      } catch (error) {
        console.error(
          `Failed to parse persisted data from key "${key}":`,
          error,
        );
      }
    }
  }, [key, shouldClear]); // Run on mount or when shouldClear changes

  // Save data whenever it changes (only in create mode)
  useEffect(() => {
    if (shouldClear) {
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(formData));
    } catch (error) {
      console.error(`Failed to persist data to key "${key}":`, error);
    }
  }, [key, formData, shouldClear]);

  // Clear persisted data if requested
  useEffect(() => {
    if (shouldClear) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(
          `Failed to clear persisted data for key "${key}":`,
          error,
        );
      }
    }
  }, [shouldClear, key]);
}

/**
 * Utility to clear persisted form data
 */
export function clearPersistedFormData(key: string) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to clear persisted data for key "${key}":`, error);
  }
}

/**
 * Utility to get persisted form data
 */
export function getPersistedFormData<T>(key: string): T | null {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    return JSON.parse(saved) as T;
  } catch (error) {
    console.error(`Failed to get persisted data from key "${key}":`, error);
    return null;
  }
}
