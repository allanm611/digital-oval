import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { Listbox } from "@headlessui/react";
import {
  DataConnectorFormData,
  DataConnectorType,
  ProcessedDataConnector,
} from "../types/dataConnector";
import { getConnectorDisplayName } from "../utils/connectorIcons";
import { color, zIndex } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";

interface DataConnectorFormProps {
  connector?: ProcessedDataConnector;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DataConnectorFormData) => Promise<void>;
  loading?: boolean;
  availableTypes?: DataConnectorType[];
}

// ==================== MAIN FORM COMPONENT ====================

const DataConnectorForm: React.FC<DataConnectorFormProps> = ({
  connector,
  isOpen,
  onClose,
  onSave,
  loading = false,
  availableTypes,
}) => {
  const [formData, setFormData] = useState<DataConnectorFormData>({
    name: "",
    type: "",
    description: "",
    connection_profile_id: undefined,
    configuration: {},
  });

  const handleTypeChange = useCallback((newType: DataConnectorType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
    }));
  }, []);

  // Reset form when connector changes or modal opens
  useEffect(() => {
    if (connector) {
      setFormData({
        name: connector.name,
        type: connector.type,
        description: connector.description,
        connection_profile_id: connector.connection_profile_id,
        configuration: {},
      });
    } else {
      setFormData({
        name: "",
        type: "",
        description: "",
        connection_profile_id: undefined,
        configuration: {},
      });
    }
  }, [connector, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save connector:", error);
    }
  };

  // const handleTestConnection = async () => {
  //   setTestingConnection(true);
  //   setTestResult(null);
  //
  //   try {
  //     const result = await dataConnectorService.testConnectionConfig(
  //       formData.type,
  //       formData.configuration || {},
  //     );
  //     setTestResult(result);
  //   } catch (err) {
  //     setTestResult({
  //       success: false,
  //       message: "Unexpected error during test",
  //       error_details: err instanceof Error ? err.message : undefined,
  //     });
  //   } finally {
  //     setTestingConnection(false);
  //   }
  // };

  if (!isOpen) return null;

  const connectorTypes: DataConnectorType[] =
    availableTypes && availableTypes.length > 0
      ? availableTypes
      : ["tcp", "websocket", "kafka", "jdbc", "sms_inbox", "api", "files"];
  const isEditing = !!connector;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing
                ? `Edit ${getConnectorDisplayName(formData.type)}`
                : "Create Data Connector"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing
                ? "Update connector details"
                : "Configure a new data connector"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="p-6 space-y-2">
            <h3 className="text-sm font-semibold text-black">
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, name: String(value) }))
                  }
                  placeholder="Enter connector name"
                  variant="medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <Listbox value={formData.type} onChange={handleTypeChange}>
                  <div className="relative">
                    <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white text-left text-sm hover:bg-gray-50 transition-colors">
                      {formData.type ? getConnectorDisplayName(formData.type) : "Select option"}
                    </Listbox.Button>
                    <Listbox.Options className="absolute top-full left-0 right-0 mt-2 border border-gray-300 rounded-md bg-white shadow-lg z-50 max-h-60 overflow-y-auto">
                      {connectorTypes.map((type) => (
                        <Listbox.Option
                          key={type}
                          value={type}
                          className="px-3 py-2 hover:bg-blue-50 text-black cursor-pointer text-sm"
                        >
                          {getConnectorDisplayName(type)}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 py-2 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Enter a description for this connector"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm font-medium resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="px-4 py-2 text-white rounded-md font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            style={{ backgroundColor: color.primary.action }}
          >
            {loading ? "Saving..." : "Create Connector"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataConnectorForm;
