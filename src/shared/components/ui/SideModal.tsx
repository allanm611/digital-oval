import { createPortal } from "react-dom";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { tw, zIndex } from "../../../shared/utils/utils";
interface SideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  position?: "left" | "right";
}

export default function SideModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  position = "right",
}: SideModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "w-80",
    md: "w-96",
    lg: "w-[28rem]",
    xl: "w-[32rem]",
  };

  const positionClasses = {
    left: "left-0",
    right: "right-0",
  };

  return createPortal(
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
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom={
                position === "right" ? "translate-x-full" : "-translate-x-full"
              }
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo={
                position === "right" ? "translate-x-full" : "-translate-x-full"
              }
            >
              <Dialog.Panel
                className={`pointer-events-auto w-screen ${sizeClasses[size]} ${positionClasses[position]} fixed top-0 h-full bg-white shadow-xl`}
              >
                <div className="flex h-full flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {title}
                    </h2>
                    <button
                      type="button"
                      className={`${tw.rounded} text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white`}
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">{children}</div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>,
    document.body
  );
}
