import { useState, useCallback } from "react";
import { useToast } from "../../contexts/ToastContext";
import { extractBackendError } from "../utils/errorHandler";

interface UseDeleteConfirmProps {
  onDelete: (id: number | string) => Promise<void>;
  itemLabel?: string;
}

interface DeleteConfirmState {
  id: number | string | null;
  itemName: string;
}

export function useDeleteConfirm({ onDelete, itemLabel = "Item" }: UseDeleteConfirmProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ id: null, itemName: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const openDeleteConfirm = useCallback((id: number | string, itemName: string) => {
    setDeleteConfirm({ id, itemName });
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirm({ id: null, itemName: "" });
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleteConfirm.id === null) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteConfirm.id);
      showSuccess(`${itemLabel} deleted successfully`);
      closeDeleteConfirm();
    } catch (err) {
      const errorMsg = extractBackendError(err);
      showError(`Failed to delete ${itemLabel.toLowerCase()}: ${errorMsg}`);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirm.id, onDelete, itemLabel, closeDeleteConfirm, showSuccess, showError]);

  return {
    deleteConfirm,
    isDeleting,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleDelete,
    isOpen: deleteConfirm.id !== null,
  };
}
