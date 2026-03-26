import { useState, useEffect, useCallback } from "react";
import { rewardTypeService, RewardType, CreateRewardTypeRequest, UpdateRewardTypeRequest } from "../../features/offers/services/rewardTypeService";

export interface UseBackendRewardTypeState {
  data: RewardType[];
  loading: boolean;
  error: string | null;
}

export interface UseBackendRewardTypeActions {
  refresh: () => Promise<void>;
  create: (data: CreateRewardTypeRequest) => Promise<RewardType>;
  update: (id: number, data: UpdateRewardTypeRequest) => Promise<RewardType>;
  delete: (id: number) => Promise<void>;
}

export type UseBackendRewardTypeResult = UseBackendRewardTypeState & UseBackendRewardTypeActions;

/**
 * Hook for managing backend-driven reward type data
 * Always fetches fresh data - no caching
 * Supports CRUD operations
 */
export function useBackendRewardTypeData(): UseBackendRewardTypeResult {
  const [data, setData] = useState<RewardType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch fresh data from backend
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rewardTypeService.getAllRewardTypes();

      if (typeof response === "object" && response !== null) {
        if (response.success && response.data) {
          setData(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch reward types");
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      // Silently fail - endpoint may not be ready yet
      console.debug("Reward types fetch skipped:", err instanceof Error ? err.message : err);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new reward type
  const create = useCallback(
    async (createData: CreateRewardTypeRequest): Promise<RewardType> => {
      setLoading(true);
      setError(null);
      try {
        const response = await rewardTypeService.createRewardType(createData);

        if (typeof response === "object" && response !== null) {
          if (response.success && response.data) {
            await refresh();
            return response.data;
          } else {
            throw new Error(response.error || "Failed to create reward type");
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

  // Update existing reward type
  const update = useCallback(
    async (id: number, updateData: UpdateRewardTypeRequest): Promise<RewardType> => {
      setLoading(true);
      setError(null);
      try {
        const response = await rewardTypeService.updateRewardType(id, updateData);

        if (typeof response === "object" && response !== null) {
          if (response.success && response.data) {
            await refresh();
            return response.data;
          } else {
            throw new Error(response.error || "Failed to update reward type");
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

  // Delete reward type
  const deleteItem = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await rewardTypeService.deleteRewardType(id);

        if (typeof response === "object" && response !== null) {
          if (response.success) {
            await refresh();
          } else {
            throw new Error(response.error || "Failed to delete reward type");
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
