import { X } from "lucide-react";
import { createPortal } from "react-dom";
import CreateOfferPage from "../../../offers/pages/CreateOfferPage";

import { tw } from "../../../../shared/utils/utils";
import { zIndex } from "../../../../shared/utils/tokens";
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
        zIndex: zIndex.overlay,
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
        style={{ zIndex: zIndex.modal }}
      >
        {/* Modal Header - Not Sticky */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Offer
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
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

        {/* Modal Content - Scrollable, with sticky bottom nav support */}
        <div className="flex-1 overflow-y-auto relative" style={{ zIndex: 1 }}>
          <div className="p-6 relative z-10 bg-white min-h-[calc(100vh-120px)]">
            <CreateOfferPage onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
