import React, { CSSProperties, ReactNode } from "react";
import { tw } from "../../utils/utils";

interface ModalFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
  cancelClassName?: string;
  confirmClassName?: string;
  cancelStyle?: CSSProperties;
  confirmStyle?: CSSProperties;
  isLoading?: boolean;
  disabled?: boolean;
  leftContent?: ReactNode;
}

export default function ModalFooter({
  onCancel,
  onConfirm,
  cancelText = "Cancel",
  confirmText = "Save",
  cancelClassName,
  confirmClassName,
  cancelStyle,
  confirmStyle,
  isLoading = false,
  disabled = false,
  leftContent,
}: ModalFooterProps) {
  return (
    <div className={`flex ${leftContent ? "justify-between" : "justify-end"} gap-3`}>
      {leftContent && <div>{leftContent}</div>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading || disabled}
          className={
            cancelClassName ||
            `px-4 py-2 text-gray-700 bg-gray-100 ${tw.rounded} hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed`
          }
          style={cancelStyle}
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading || disabled}
          className={confirmClassName}
          style={confirmStyle}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
