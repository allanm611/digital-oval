import { createPortal } from "react-dom";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { tw, zIndex } from "../../../shared/utils/utils";
interface RegularModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

export default function RegularModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
}: RegularModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-4xl",
    full: "max-w-7xl",
  };

  return createPortal(
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative"
        style={{ zIndex: zIndex.modal }}
        onClose={closeOnOverlayClick ? onClose : () => {}}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            style={{ zIndex: zIndex.modal }}
            aria-hidden="true"
          />
        </Transition.Child>

        <div className="fixed inset-0" style={{ zIndex: zIndex.modal }}>
          <div className="flex min-h-full items-center justify-center p-4 overflow-y-auto">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={`relative transform overflow-hidden flex flex-col ${tw.rounded} ${tw.surfaceBackground} ${tw.textPrimary} text-left shadow-xl transition-all w-full ${sizeClasses[size]}`}
                style={{
                  zIndex: zIndex.modal + 1,
                  maxHeight: "calc(100vh - 2rem)",
                }}
              >
                {/* Header */}
                <div
                  className={`flex-shrink-0 flex items-center justify-between border-b ${tw.borderDefault} px-6 py-3 ${tw.surfaceBackground}`}
                >
                  <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
                    {title}
                  </h2>
                  {showCloseButton && (
                    <button
                      type="button"
                      className={`${tw.rounded} ${tw.textMuted} hover:text-[var(--c-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--c-interactive-focus)]`}
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 px-6 py-4 overflow-y-auto">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>,
    document.body,
  );
}
