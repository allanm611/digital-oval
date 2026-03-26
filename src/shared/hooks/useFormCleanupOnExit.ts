import { useEffect } from "react";
import { clearPersistedFormData } from "./useFormDataPersistence";

/**
 * Hook to automatically clear persisted form data when user exits the creation flow
 * Handles: browser back, sidebar navigation, URL changes, tab close, etc.
 *
 * Usage:
 * useFormCleanupOnExit("campaign_form_data");
 */
export function useFormCleanupOnExit(storageKey: string) {
  useEffect(() => {
    return () => {
      // Cleanup: clear persisted data when component unmounts (user leaves page)
      clearPersistedFormData(storageKey);
    };
  }, [storageKey]);
}
