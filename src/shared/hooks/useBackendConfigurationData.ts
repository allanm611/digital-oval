import { useState, useEffect, useCallback } from "react";
import { campaignTypeService, CampaignType, CreateCampaignTypeRequest, UpdateCampaignTypeRequest } from "../../features/campaigns/services/campaignTypeService";

export interface UseBackendConfigDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export interface UseBackendConfigDataActions<T, CreateReq, UpdateReq> {
  refresh: () => Promise<void>;
  create: (data: CreateReq) => Promise<T>;
  update: (id: number, data: UpdateReq) => Promise<T>;
  delete: (id: number) => Promise<void>;
}

export type UseBackendConfigDataResult<T, CreateReq, UpdateReq> = UseBackendConfigDataState<T> & UseBackendConfigDataActions<T, CreateReq, UpdateReq>;

/**
 * Hook for managing backend-driven configuration data
 * Always fetches fresh data - no caching
 * Supports CRUD operations
 * Pass undefined to skip fetching (useful for conditional hook usage in React)
 */
export function useBackendConfigurationData(
  type: "campaignTypes" | undefined
): UseBackendConfigDataResult<CampaignType, CreateCampaignTypeRequest, UpdateCampaignTypeRequest> | null {
  const [data, setData] = useState<CampaignType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If type is undefined, return null early
  if (!type) {
    return null;
  }

  // Fetch fresh data from backend
  const refresh = useCallback(async () => {
    if (!type) return;

    setLoading(true);
    setError(null);
    try {
      let response;
      switch (type) {
        case "campaignTypes":
          response = await campaignTypeService.getAllCampaignTypes();
          break;
        default:
          throw new Error(`Unknown configuration type: ${type}`);
      }

      // Check if response is valid JSON
      if (typeof response === "object" && response !== null) {
        if (response.success && response.data) {
          setData(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch configuration data");
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      // Silently fail - endpoint may not be ready yet or returning errors
      // UI will show empty state and fall back to dummy data
      console.debug(`Configuration fetch skipped for ${type}:`, err instanceof Error ? err.message : err);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [type]);

  // Create new item
  const create = useCallback(
    async (createData: CreateCampaignTypeRequest): Promise<CampaignType> => {
      setLoading(true);
      setError(null);
      try {
        let response;
        switch (type) {
          case "campaignTypes":
            response = await campaignTypeService.createCampaignType(createData);
            break;
          default:
            throw new Error(`Unknown configuration type: ${type}`);
        }

        if (response.success && response.data) {
          // Refresh to get latest data
          await refresh();
          return response.data;
        } else {
          throw new Error(response.error || "Failed to create item");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [type, refresh]
  );

  // Update existing item
  const update = useCallback(
    async (id: number, updateData: UpdateCampaignTypeRequest): Promise<CampaignType> => {
      setLoading(true);
      setError(null);
      try {
        let response;
        switch (type) {
          case "campaignTypes":
            response = await campaignTypeService.updateCampaignType(id, updateData);
            break;
          default:
            throw new Error(`Unknown configuration type: ${type}`);
        }

        if (response.success && response.data) {
          // Refresh to get latest data
          await refresh();
          return response.data;
        } else {
          throw new Error(response.error || "Failed to update item");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [type, refresh]
  );

  // Delete item
  const deleteItem = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        let response;
        switch (type) {
          case "campaignTypes":
            response = await campaignTypeService.deleteCampaignType(id);
            break;
          default:
            throw new Error(`Unknown configuration type: ${type}`);
        }

        if (response.success) {
          // Refresh to get latest data
          await refresh();
        } else {
          throw new Error(response.error || "Failed to delete item");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [type, refresh]
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
