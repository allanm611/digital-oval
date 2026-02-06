import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { tw, zIndex } from "../../../shared/utils/utils";

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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Name
            </label>
            <input
              type="text"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Enter a name for the new policy"
              autoFocus
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!policyName.trim()}
              className={`${tw.button} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Create Policy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
