import { useState } from "react";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";
import { buildCatalogTag } from "../utils/catalogTags";

type EntityType = "offer" | "product" | "segment" | "campaign";

interface RemoveFromCatalogOptions {
  entityType: EntityType;
  entityId: number | string;
  categoryId: number | string;
  categoryName: string;
  onSuccess?: () => Promise<void> | void;
  onRefresh?: () => Promise<void> | void;
  onRefreshCategories?: () => Promise<void> | void;
  onRefreshCounts?: () => Promise<void> | void;
  getEntityById: (id: number) => Promise<{ data?: unknown } | unknown>;
  updateEntity: (id: number, updates: Record<string, unknown>) => Promise<void>;
  removeEntityTag?: (id: number, tag: string) => Promise<void>;
  buildCatalogTagFn?: (categoryId: number | string) => string;
  onShowPrimaryCategoryWarning?: (entityId: number | string, entityType: EntityType) => Promise<void>;
}

export function useRemoveFromCatalog() {
  const { confirm, setConfirmLoading, closeConfirm } = useConfirm();
  const { success: showToast, error: showError } = useToast();
  const [removingId, setRemovingId] = useState<number | string | null>(null);

  const removeFromCatalog = async (options: RemoveFromCatalogOptions) => {
    const {
      entityType,
      entityId,
      categoryId,
      categoryName,
      onSuccess,
      onRefresh,
      onRefreshCategories,
      onRefreshCounts,
      getEntityById,
      updateEntity,
      removeEntityTag,
      buildCatalogTagFn = buildCatalogTag,
      onShowPrimaryCategoryWarning,
    } = options;

    // Show confirmation modal
    const confirmed = await confirm({
      title: `Remove ${
        entityType.charAt(0).toUpperCase() + entityType.slice(1)
      }`,
      message: `Are you sure you want to remove this ${entityType} from "${categoryName}"?`,
      type: "warning",
      confirmText: "Remove",
      cancelText: "Cancel",
    });

    if (!confirmed) {
      return;
    }

    try {
      setConfirmLoading(true);
      setRemovingId(entityId);

      // Get the entity details
      const entityResponse = await getEntityById(Number(entityId));
      const entityData =
        (entityResponse &&
          typeof entityResponse === "object" &&
          "data" in entityResponse &&
          entityResponse.data) ||
        entityResponse;

      if (!entityData || typeof entityData !== "object") {
        setConfirmLoading(false);
        closeConfirm();
        showError(
          `Failed to load ${entityType} details`,
          "Please try again later."
        );
        setRemovingId(null);
        return;
      }

      // Check if it's the primary category
      // Note: Segments use 'category', others use 'category_id'
      const entityDataObj = entityData as Record<string, unknown>;
      const categoryField = entityDataObj.category_id ?? entityDataObj.category;
      const primaryCategoryId =
        typeof categoryField === "string"
          ? parseInt(categoryField, 10)
          : categoryField;
      const isPrimaryCategory =
        primaryCategoryId !== null &&
        primaryCategoryId !== undefined &&
        !Number.isNaN(primaryCategoryId) &&
        Number(primaryCategoryId) === Number(categoryId);

      if (isPrimaryCategory) {
        setConfirmLoading(false);
        closeConfirm();

        // If a callback is provided, use it instead of the generic confirm
        if (onShowPrimaryCategoryWarning) {
          await onShowPrimaryCategoryWarning(entityId, entityType);
        } else {
          // Fallback to the generic confirm if no callback provided
          await confirm({
            title: "Primary Category",
            message: `This catalog is the ${entityType}'s primary category. Change the ${entityType}'s primary category before removing it from this catalog.`,
            type: "info",
            confirmText: "Got it",
            cancelText: "Close",
          });
        }
        setRemovingId(null);
        return;
      }

      // Check if it has the catalog tag
      const catalogTag = buildCatalogTagFn(categoryId);
      const tags = Array.isArray(entityDataObj.tags) ? entityDataObj.tags : [];
      const hasCatalogTag = tags.includes(catalogTag);

      // If it doesn't have the tag, check if it's still the primary category
      // (items can appear in list via primary category even without tag)
      if (!hasCatalogTag) {
        // Double-check: is it still the primary category?
        // Note: Segments use 'category', others use 'category_id'
        const currentCategoryField =
          entityDataObj.category_id ?? entityDataObj.category;
        const currentPrimaryCategoryId =
          typeof currentCategoryField === "string"
            ? parseInt(currentCategoryField, 10)
            : currentCategoryField;
        const isStillPrimary =
          currentPrimaryCategoryId !== null &&
          currentPrimaryCategoryId !== undefined &&
          !Number.isNaN(currentPrimaryCategoryId) &&
          Number(currentPrimaryCategoryId) === Number(categoryId);

        if (isStillPrimary) {
          // It's the primary category but we already handled that case above
          // This shouldn't happen, but just in case, refresh and return
          setConfirmLoading(false);
          closeConfirm();
          if (onRefresh) {
            await onRefresh();
          }
          setRemovingId(null);
          return;
        }

        // Not primary and no tag - item shouldn't be in the catalog
        // This can happen if:
        // 1. Item was shown because it was primary category, but category_id changed
        // 2. Item was removed from catalog but list wasn't refreshed
        // 3. Data inconsistency
        setConfirmLoading(false);
        closeConfirm();
        showError(
          `${
            entityType.charAt(0).toUpperCase() + entityType.slice(1)
          } is not assigned to this catalog.`,
          "The item may have been removed or its category changed. Refreshing the list..."
        );
        setRemovingId(null);
        // Refresh the list to remove it if it's no longer valid
        if (onRefresh) {
          await onRefresh();
        }
        return;
      }

      // Remove the tag
      if (removeEntityTag) {
        // Products use a specific removeTag method
        await removeEntityTag(Number(entityId), catalogTag);
      } else {
        // Other entities use update with tags array
        const updatedTags = tags.filter((tag: string) => tag !== catalogTag);
        await updateEntity(Number(entityId), { tags: updatedTags });
      }

      // Refresh data
      if (onRefresh) {
        await onRefresh();
      }
      if (onRefreshCounts) {
        await Promise.resolve(onRefreshCounts());
      }
      if (onRefreshCategories) {
        await Promise.resolve(onRefreshCategories());
      }

      setConfirmLoading(false);
      closeConfirm();
      showToast(
        `${
          entityType.charAt(0).toUpperCase() + entityType.slice(1)
        } removed from catalog successfully`
      );

      if (onSuccess) {
        await Promise.resolve(onSuccess());
      }
    } catch (err) {
      setConfirmLoading(false);
      closeConfirm();
      showError(
        `Failed to remove ${entityType}`,
        err instanceof Error ? err.message : "Please try again later."
      );
    } finally {
      setRemovingId(null);
    }
  };

  return {
    removeFromCatalog,
    removingId,
  };
}
