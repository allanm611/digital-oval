import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { color, tw, zIndex } from "../../utils/utils";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: "delete" | "warning";
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "delete",
}: DeleteConfirmModalProps) {
  const isWarning = variant === "warning";
  const actionColor = color.primary.action; // Action color from tokens
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative"
        style={{ zIndex: zIndex.modal }}
        onClose={onClose}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div
          className="fixed inset-0 overflow-y-auto"
          style={{ zIndex: zIndex.modal }}
        >
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
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
                className={`relative transform overflow-hidden ${tw.rounded} ${tw.surfaceBackground} px-4 pb-4 pt-5 ${tw.textPrimary} text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6`}
              >
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className={`${tw.rounded} ${tw.surfaceBackground} ${tw.textMuted} hover:text-[var(--c-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--c-interactive-focus)] focus:ring-offset-2`}
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div
                    className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                      isWarning ? "" : "bg-red-100"
                    }`}
                    style={
                      isWarning ? { backgroundColor: `${actionColor}20` } : {}
                    }
                  >
                    <ExclamationTriangleIcon
                      className={`h-6 w-6 ${isWarning ? "" : "text-red-600"}`}
                      style={isWarning ? { color: actionColor } : {}}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className={`text-base font-semibold leading-6 ${tw.textPrimary}`}
                    >
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className={`text-sm ${tw.textMuted}`}>{description}</p>
                      <p
                        className={`mt-2 text-sm font-medium ${tw.textPrimary}`}
                      >
                        "{itemName}"
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center ${
                      tw.rounded
                    } px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed ${
                      isWarning
                        ? ""
                        : "bg-red-600 hover:bg-red-500 focus-visible:outline-red-600"
                    }`}
                    style={
                      isWarning
                        ? {
                            backgroundColor: actionColor,
                          }
                        : {}
                    }
                    onMouseEnter={(e) => {
                      if (isWarning && !isLoading) {
                        // Slightly lighter for hover on dark action color
                        e.currentTarget.style.backgroundColor = "#3a3d3f";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isWarning && !isLoading) {
                        e.currentTarget.style.backgroundColor = actionColor;
                      }
                    }}
                    onClick={onConfirm}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? isWarning
                        ? "Processing..."
                        : "Deleting..."
                      : confirmText}
                  </button>
                  <button
                    type="button"
                    className={`mt-3 inline-flex w-full justify-center ${tw.rounded} px-3 py-2 text-sm font-semibold shadow-sm sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--c-text-primary)',
                      border: '1px solid var(--c-text-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
