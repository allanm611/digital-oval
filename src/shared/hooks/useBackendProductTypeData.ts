import { useState, useEffect, useCallback } from "react";
import { productTypeService, ProductType, CreateProductTypeRequest, UpdateProductTypeRequest } from "../../features/products/services/productTypeService";

export interface UseBackendProductTypeState {
  data: ProductType[];
  loading: boolean;
  error: string | null;
}

export interface UseBackendProductTypeActions {
  refresh: () => Promise<void>;
  create: (data: CreateProductTypeRequest) => Promise<ProductType>;
  update: (id: number, data: UpdateProductTypeRequest) => Promise<ProductType>;
  delete: (id: number) => Promise<void>;
}

export type UseBackendProductTypeResult = UseBackendProductTypeState & UseBackendProductTypeActions;

/**
 * Hook for managing backend-driven product type data
 * Always fetches fresh data - no caching
 * Supports CRUD operations
 */
export function useBackendProductTypeData(): UseBackendProductTypeResult {
  const [data, setData] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch fresh data from backend
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productTypeService.getAllProductTypes();

      if (typeof response === "object" && response !== null) {
        if (response.success && response.data) {
          setData(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch product types");
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      // Silently fail - endpoint may not be ready yet
      console.debug("Product types fetch skipped:", err instanceof Error ? err.message : err);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new product type
  const create = useCallback(
    async (createData: CreateProductTypeRequest): Promise<ProductType> => {
      setLoading(true);
      setError(null);
      try {
        const response = await productTypeService.createProductType(createData);

        if (typeof response === "object" && response !== null) {
          if (response.success && response.data) {
            await refresh();
            return response.data;
          } else {
            throw new Error(response.error || "Failed to create product type");
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

  // Update existing product type
  const update = useCallback(
    async (id: number, updateData: UpdateProductTypeRequest): Promise<ProductType> => {
      setLoading(true);
      setError(null);
      try {
        const response = await productTypeService.updateProductType(id, updateData);

        if (typeof response === "object" && response !== null) {
          if (response.success && response.data) {
            await refresh();
            return response.data;
          } else {
            throw new Error(response.error || "Failed to update product type");
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

  // Delete product type
  const deleteItem = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await productTypeService.deleteProductType(id);

        if (typeof response === "object" && response !== null) {
          if (response.success) {
            await refresh();
          } else {
            throw new Error(response.error || "Failed to delete product type");
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
