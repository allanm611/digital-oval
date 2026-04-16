import { useState, useEffect, useCallback } from "react";
import { segmentTypeService, SegmentType, CreateSegmentTypeRequest, UpdateSegmentTypeRequest } from "../../features/segments/services/segmentTypeService";

export interface UseBackendSegmentTypeState {
  data: SegmentType[];
  loading: boolean;
  error: string | null;
}

export interface UseBackendSegmentTypeActions {
  refresh: () => Promise<void>;
  create: (data: CreateSegmentTypeRequest) => Promise<SegmentType>;
  update: (id: number, data: UpdateSegmentTypeRequest) => Promise<SegmentType>;
  delete: (id: number) => Promise<void>;
}

export type UseBackendSegmentTypeResult = UseBackendSegmentTypeState & UseBackendSegmentTypeActions;

/**
 * Hook for managing backend-driven segment type data
 * Always fetches fresh data - no caching
 * Supports CRUD operations
 */
export function useBackendSegmentTypeData(): UseBackendSegmentTypeResult {
  const [data, setData] = useState<SegmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch fresh data from backend
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await segmentTypeService.getAllSegmentTypes();

      if (typeof response === "object" && response !== null) {
        if (response.success && response.data) {
          setData(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch segment types");
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      // Silently fail - endpoint may not be ready yet
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new segment type
  const create = useCallback(
    async (createData: CreateSegmentTypeRequest): Promise<SegmentType> => {
      setLoading(true);
      setError(null);
      try {
        const response = await segmentTypeService.createSegmentType(createData);

        if (typeof response === "object" && response !== null) {
          if (response.success && response.data) {
            await refresh();
            return response.data;
          } else {
            throw new Error(response.error || "Failed to create segment type");
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

  // Update existing segment type
  const update = useCallback(
    async (id: number, updateData: UpdateSegmentTypeRequest): Promise<SegmentType> => {
      setLoading(true);
      setError(null);
      try {
        const response = await segmentTypeService.updateSegmentType(id, updateData);

        if (typeof response === "object" && response !== null) {
          if (response.success && response.data) {
            await refresh();
            return response.data;
          } else {
            throw new Error(response.error || "Failed to update segment type");
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

  // Delete segment type
  const deleteItem = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await segmentTypeService.deleteSegmentType(id);

        if (typeof response === "object" && response !== null) {
          if (response.success) {
            await refresh();
          } else {
            throw new Error(response.error || "Failed to delete segment type");
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
