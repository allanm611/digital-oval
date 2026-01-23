import React from "react";
import { DataConnectorsGridProps } from "../types";
import DataConnectorCard from "./DataConnectorCard";
import { tw } from "../../../shared/utils/utils";

const DataConnectorsGrid: React.FC<DataConnectorsGridProps> = ({
  connectors,
  onConnectorClick,
  className = "",
}) => {
  if (connectors.length === 0) {
    return (
      <div className="py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
          No data connectors found
        </h3>
        <p className={`${tw.textSecondary}`}>
          Get started by creating your first data connector.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
    >
      {connectors.map((connector) => (
        <DataConnectorCard
          key={connector.id}
          connector={connector}
          onClick={onConnectorClick}
        />
      ))}
    </div>
  );
};

export default DataConnectorsGrid;
