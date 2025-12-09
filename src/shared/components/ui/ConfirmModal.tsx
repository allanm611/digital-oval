import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, XCircle, Info, X } from "lucide-react";
import { color , tw} from "../../utils/utils";

export type ConfirmType = "danger" | "warning" | "success" | "info";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const typeConfig = {
  danger: {
    icon: XCircle,
    iconColor: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    confirmButtonColor: "bg-red-600 hover:bg-red-700 focus:ring-0",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    confirmButtonColor: "bg-yellow-600 hover:bg-yellow-700 focus:ring-0",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    confirmButtonColor: "bg-[#3A5A40] hover:bg-[#2f4a35] focus:ring-0",
  },
  info: {
    icon: Info,
    iconColor: "", // Will use accent color from tokens
    bgColor: "", // No background color
    borderColor: "border-gray-200",
    confirmButtonColor: "", // Will use action color from tokens
  },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "warning",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isLoading = false,
}: ConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  const config = typeConfig[type];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? "bg-opacity-50" : "bg-opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full max-w-md transform overflow-hidden ${tw.rounded} bg-white shadow-2xl transition-all duration-300 ${
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          {/* Header */}
          <div
            className={`px-6 pt-6 pb-4 ${config.bgColor || "bg-white"} ${
              config.borderColor
            } border-b`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-full ${
                    config.bgColor || "bg-transparent"
                  }`}
                >
                  <IconComponent
                    className={`w-6 h-6 ${config.iconColor || ""}`}
                    style={
                      type === "info"
                        ? { color: color.primary.accent }
                        : undefined
                    }
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className={`p-1 hover:bg-gray-100 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-gray-700 leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex space-x-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 focus:outline-none focus:ring-0 focus:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white ${tw.rounded} focus:outline-none focus:ring-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                config.confirmButtonColor || ""
              }`}
              style={
                type === "info"
                  ? {
                      backgroundColor: color.primary.action,
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (type === "info" && !isLoading) {
                  e.currentTarget.style.backgroundColor = "#1a1c1d"; // Slightly darker on hover
                }
              }}
              onMouseLeave={(e) => {
                if (type === "info" && !isLoading) {
                  e.currentTarget.style.backgroundColor = color.primary.action;
                }
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
