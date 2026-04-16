import { useState, useEffect, useCallback } from "react";
import { campaignTypeService } from "../../features/campaigns/services/campaignTypeService";
import type { CampaignType, CreateCampaignTypeRequest, UpdateCampaignTypeRequest } from "../../features/campaigns/types/campaignType";
import type { ApiResponse } from "../../shared/types/api";

export interface UseBackendCampaignTypeState {
  data: CampaignType[];
  loading: boolean;
  error: string | null;
}

export interface UseBackendCampaignTypeActions {
  refresh: () => Promise<void>;
  create: (data: CreateCampaignTypeRequest) => Promise<CampaignType>;
  update: (id: number, data: UpdateCampaignTypeRequest) => Promise<CampaignType>;
  delete: (id: number) => Promise<void>;
}

export type UseBackendCampaignTypeResult = UseBackendCampaignTypeState & UseBackendCampaignTypeActions;

/**
 * Hook for managing backend-driven campaign type data
 * Always fetches fresh data - no caching
 * Supports CRUD operations
 */
export function useBackendCampaignTypeData(): UseBackendCampaignTypeResult {
  const [data, setData] = useState<CampaignType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch fresh data from backend
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await campaignTypeService.getAllCampaignTypes();

      if (typeof response === "object" && response !== null) {
        if ((response as ApiResponse<CampaignType[]>).success && (response as ApiResponse<CampaignType[]>).data) {
          setData((response as ApiResponse<CampaignType[]>).data);
        } else {
          throw new Error((response as ApiResponse<CampaignType[]>).error || "Failed to fetch campaign types");
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

  // Create new campaign type
  const create = useCallback(
    async (createData: CreateCampaignTypeRequest): Promise<CampaignType> => {
      setLoading(true);
      setError(null);
      try {
        const response = await campaignTypeService.createCampaignType(createData);

        if (typeof response === "object" && response !== null) {
          if ((response as ApiResponse<CampaignType>).success && (response as ApiResponse<CampaignType>).data) {
            await refresh();
            return (response as ApiResponse<CampaignType>).data;
          } else {
            throw new Error((response as ApiResponse<CampaignType>).error || "Failed to create campaign type");
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

  // Update existing campaign type
  const update = useCallback(
    async (id: number, updateData: UpdateCampaignTypeRequest): Promise<CampaignType> => {
      setLoading(true);
      setError(null);
      try {
        const response = await campaignTypeService.updateCampaignType(id, updateData);

        if (typeof response === "object" && response !== null) {
          if ((response as ApiResponse<CampaignType>).success && (response as ApiResponse<CampaignType>).data) {
            await refresh();
            return (response as ApiResponse<CampaignType>).data;
          } else {
            throw new Error((response as ApiResponse<CampaignType>).error || "Failed to update campaign type");
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

  // Delete campaign type
  const deleteItem = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await campaignTypeService.deleteCampaignType(id);

        if (typeof response === "object" && response !== null) {
          if ((response as ApiResponse<{ message: string }>).success) {
            await refresh();
          } else {
            throw new Error((response as ApiResponse<{ message: string }>).error || "Failed to delete campaign type");
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
