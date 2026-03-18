import { useState, useEffect, useCallback } from "react";
import { offerTypeService, OfferType, CreateOfferTypeRequest, UpdateOfferTypeRequest } from "../../features/offers/services/offerTypeService";

export interface UseBackendOfferTypeState {
  data: OfferType[];
  loading: boolean;
  error: string | null;
}

export interface UseBackendOfferTypeActions {
  refresh: () => Promise<void>;
  create: (data: CreateOfferTypeRequest) => Promise<OfferType>;
  update: (id: number, data: UpdateOfferTypeRequest) => Promise<OfferType>;
  delete: (id: number) => Promise<void>;
}

export type UseBackendOfferTypeResult = UseBackendOfferTypeState & UseBackendOfferTypeActions;

/**
 * Hook for managing backend-driven offer type data
 * Always fetches fresh data - no caching
 * Supports CRUD operations
 */
export function useBackendOfferTypeData(): UseBackendOfferTypeResult {
  const [data, setData] = useState<OfferType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch fresh data from backend
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await offerTypeService.getAllOfferTypes();

      if (typeof response === "object" && response !== null) {
        if (response.success && response.data) {
          setData(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch offer types");
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      // Silently fail - endpoint may not be ready yet
      console.debug("Offer types fetch skipped:", err instanceof Error ? err.message : err);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new offer type
  const create = useCallback(
    async (createData: CreateOfferTypeRequest): Promise<OfferType> => {
      setLoading(true);
      setError(null);
      try {
        const response = await offerTypeService.createOfferType(createData);

        if (typeof response === "object" && response !== null) {
          if (response.success && response.data) {
            await refresh();
            return response.data;
          } else {
            throw new Error(response.error || "Failed to create offer type");
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

  // Update existing offer type
  const update = useCallback(
    async (id: number, updateData: UpdateOfferTypeRequest): Promise<OfferType> => {
      setLoading(true);
      setError(null);
      try {
        const response = await offerTypeService.updateOfferType(id, updateData);

        if (typeof response === "object" && response !== null) {
          if (response.success && response.data) {
            await refresh();
            return response.data;
          } else {
            throw new Error(response.error || "Failed to update offer type");
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

  // Delete offer type
  const deleteItem = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await offerTypeService.deleteOfferType(id);

        if (typeof response === "object" && response !== null) {
          if (response.success) {
            await refresh();
          } else {
            throw new Error(response.error || "Failed to delete offer type");
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
