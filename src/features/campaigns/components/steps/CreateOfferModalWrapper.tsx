import { X } from "lucide-react";
import { createPortal } from "react-dom";
import CreateOfferPage from "../../../offers/pages/CreateOfferPage";

import { tw, zIndexTokens } from "../../../../shared/utils/utils";
interface CreateOfferModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onOfferCreated?: (offerId: number) => void;
}

export default function CreateOfferModalWrapper({
  isOpen,
  onClose,
  onOfferCreated,
}: CreateOfferModalWrapperProps) {
  if (!isOpen) return null;

  const handleSuccess = (offerId: number) => {
    onOfferCreated?.(offerId);
    onClose();
  };

  return createPortal(
    <div
      className="fixed flex items-center justify-center p-4"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: zIndexTokens.overlay,
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative bg-white ${tw.rounded} shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden`}
        style={{ zIndex: zIndexTokens.modal }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Create New Offer
            </h2>
            <p className="text-gray-600 mt-1">
              Follow the steps to create a comprehensive offer
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <CreateOfferPage onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
