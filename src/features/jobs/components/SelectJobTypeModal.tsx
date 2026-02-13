import { useState } from "react";
import { X, Megaphone, Database } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";

interface SelectJobTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (type: "campaign" | "etl") => void;
}

export default function SelectJobTypeModal({
  isOpen,
  onClose,
  onContinue,
}: SelectJobTypeModalProps) {
  const [selectedType, setSelectedType] = useState<"campaign" | "etl" | null>(
    null,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white ${tw.rounded} w-full max-w-md shadow-xl`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            What should this job run?
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Campaign Option */}
          <button
            onClick={() => setSelectedType("campaign")}
            className={`w-full p-4 ${tw.rounded} transition-all text-left bg-white relative border-2 ${
              selectedType === "campaign" ? "border-transparent" : "border-gray-200"
            }`}
          >
            {selectedType === "campaign" && (
              <div
                className={`absolute ${tw.rounded} pointer-events-none border-2`}
                style={{
                  borderColor: color.primary.accent,
                  top: "-2px",
                  right: "-2px",
                  bottom: "-2px",
                  left: "-2px",
                }}
              />
            )}
            <div className="flex items-start gap-3">
              <div
                className={`p-2 ${tw.rounded}`}
                style={{
                  backgroundColor: color.primary.accent,
                }}
              >
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Campaign</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Execute a marketing campaign on a schedule
                </p>
              </div>
            </div>
          </button>

          {/* ETL Option */}
          <button
            onClick={() => setSelectedType("etl")}
            className={`w-full p-4 ${tw.rounded} transition-all text-left bg-white relative border-2 ${
              selectedType === "etl" ? "border-transparent" : "border-gray-200"
            }`}
          >
            {selectedType === "etl" && (
              <div
                className={`absolute ${tw.rounded} pointer-events-none border-2`}
                style={{
                  borderColor: color.primary.accent,
                  top: "-2px",
                  right: "-2px",
                  bottom: "-2px",
                  left: "-2px",
                }}
              />
            )}
            <div className="flex items-start gap-3">
              <div
                className={`p-2 ${tw.rounded}`}
                style={{
                  backgroundColor: color.primary.accent,
                }}
              >
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">ETL</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Run a data processing or ETL job
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 bg-gray-50">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedType) {
                onContinue(selectedType);
                setSelectedType(null);
              }
            }}
            disabled={!selectedType}
            className={`flex-1 px-4 py-2 text-sm font-semibold text-white ${tw.rounded} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            style={{
              backgroundColor: color.primary.action,
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
