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
  // Load persisted data on mount
  useEffect(() => {
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
  }, [key]); // Only run on mount

  // Save data whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(formData));
    } catch (error) {
      console.error(`Failed to persist data to key "${key}":`, error);
    }
  }, [key, formData]);

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
