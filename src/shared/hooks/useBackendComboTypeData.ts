import { useState, useEffect, useCallback } from "react";
import { comboTypeService, ComboType, CreateComboTypeRequest, UpdateComboTypeRequest } from "../../features/products/services/comboTypeService";

export interface UseBackendComboTypeState {
  data: ComboType[];
  loading: boolean;
  error: string | null;
}

export interface UseBackendComboTypeActions {
  refresh: () => Promise<void>;
  create: (data: CreateComboTypeRequest) => Promise<ComboType>;
  update: (id: number, data: UpdateComboTypeRequest) => Promise<ComboType>;
  delete: (id: number) => Promise<void>;
}

export type UseBackendComboTypeResult = UseBackendComboTypeState & UseBackendComboTypeActions;

/**
 * Hook for managing backend-driven combo type data
 * Always fetches fresh data - no caching
 * Supports CRUD operations
 */
export function useBackendComboTypeData(): UseBackendComboTypeResult {
  const [data, setData] = useState<ComboType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch fresh data from backend
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await comboTypeService.getAllComboTypes();

      if (typeof response === "object" && response !== null) {
        if (response.success && response.data) {
          setData(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch combo types");
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      // Silently fail - endpoint may not be ready yet
      console.debug("Combo types fetch skipped:", err instanceof Error ? err.message : err);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new combo type
  const create = useCallback(
    async (createData: CreateComboTypeRequest): Promise<ComboType> => {
      setLoading(true);
      setError(null);
      try {
        const response = await comboTypeService.createComboType(createData);

        if (typeof response === "object" && response !== null) {
          if (response.success && response.data) {
            await refresh();
            return response.data;
          } else {
            throw new Error(response.error || "Failed to create combo type");
          }
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  // Update existing combo type
  const update = useCallback(
    async (id: number, updateData: UpdateComboTypeRequest): Promise<ComboType> => {
      setLoading(true);
      setError(null);
      try {
        const response = await comboTypeService.updateComboType(id, updateData);

        if (typeof response === "object" && response !== null) {
          if (response.success && response.data) {
            await refresh();
            return response.data;
          } else {
            throw new Error(response.error || "Failed to update combo type");
          }
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  // Delete combo type
  const deleteItem = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await comboTypeService.deleteComboType(id);

        if (typeof response === "object" && response !== null) {
          if (response.success) {
            await refresh();
          } else {
            throw new Error(response.error || "Failed to delete combo type");
          }
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  // Fetch data on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    create,
    update,
    delete: deleteItem,
  };
}
