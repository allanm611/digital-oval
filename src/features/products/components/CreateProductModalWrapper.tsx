import { createPortal } from "react-dom";
import { X } from "lucide-react";
import CreateProductPage from "../pages/CreateProductPage";
import { tw } from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";

interface CreateProductModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (productId: number) => void;
}

export default function CreateProductModalWrapper({
  isOpen,
  onClose,
  onProductCreated,
}: CreateProductModalWrapperProps) {
  if (!isOpen) return null;

  const handleSuccess = (productId: number) => {
    onProductCreated?.(productId);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.popover }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative bg-white ${tw.rounded} shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden`}
        style={{ zIndex: zIndex.popover + 1 }}
      >
        {/* Page Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <CreateProductPage onSuccess={handleSuccess} onClose={onClose} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
