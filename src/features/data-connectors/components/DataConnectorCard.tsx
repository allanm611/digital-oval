import React from "react";
import { DataConnectorCardProps } from "../types";
import {
  getConnectorIcon,
  getConnectorDisplayName,
} from "../utils/connectorIcons";
import { tw } from "../../../shared/utils/utils";

const DataConnectorCard: React.FC<DataConnectorCardProps> = ({
  connector,
  onClick,
  className = "",
}) => {
  const { icon: IconComponent, color } = getConnectorIcon(connector.type);

  const handleClick = () => {
    if (onClick) {
      onClick(connector);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative bg-white ${tw.rounded} border ${tw.borderDefault} p-5 sm:p-6 transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer
        ${onClick ? "hover:bg-gray-50" : ""}
        ${className}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 ${tw.rounded} bg-gray-50`}
          style={{ color }}
        >
          <IconComponent size={24} />
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connector.is_active ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span className="text-xs text-gray-500">
            {connector.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
        {connector.name}
      </h3>

      <p className={`text-sm ${tw.textSecondary} mb-3`}>
        {connector.description}
      </p>

      <div
        className={`flex items-center justify-between text-xs ${tw.textMuted}`}
      >
        <span>{getConnectorDisplayName(connector.type)}</span>
        {connector.connectionCount !== undefined && (
          <span>{connector.connectionCount} connections</span>
        )}
      </div>

      {connector.lastUsed && (
        <div className={`mt-2 text-xs ${tw.textMuted}`}>
          Last used: {connector.lastUsed.toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default DataConnectorCard;
