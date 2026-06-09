import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { tw, zIndex, color } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";

interface PolicyNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  defaultName?: string;
  title?: string;
}

export default function PolicyNameModal({
  isOpen,
  onClose,
  onConfirm,
  defaultName = "",
  title = "Enter Policy Name",
}: PolicyNameModalProps) {
  const [policyName, setPolicyName] = useState(defaultName);

  useEffect(() => {
    if (isOpen) {
      setPolicyName(defaultName);
    }
  }, [isOpen, defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (policyName.trim()) {
      onConfirm(policyName.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: zIndex.modal }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-60"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white ${tw.rounded} shadow-2xl w-full max-w-md mx-4`}
        style={{ zIndex: zIndex.modal }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-md">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className={`p-1 hover:bg-gray-200 ${tw.rounded} transition-colors`}
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <Input
              label="Policy Name"
              placeholder="Enter a name for the new policy"
              value={policyName}
              onChange={setPolicyName}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors`}
              style={{
                background: "transparent",
                color: color.primary.action,
                border: `1px solid ${color.primary.action}`,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!policyName.trim()}
              className={`${tw.button} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
