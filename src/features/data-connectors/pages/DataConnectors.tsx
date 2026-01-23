import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plug,
  CheckCircle,
  Database,
  Layers,
  Eye,
} from "lucide-react";
import { DataConnector } from "../types";
import { fetchDataConnectors } from "../services";
import { getConnectorDisplayName } from "../utils/connectorIcons";
import { tw, color, button } from "../../../shared/utils/utils";

export default function DataConnectors() {
  const [connectors, setConnectors] = useState<DataConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadConnectors = async () => {
    try {
      setLoading(true);
      const response = await fetchDataConnectors({
        search: searchTerm || undefined,
      });
      setConnectors(response.data);
    } catch (error) {
      console.error("Failed to load data connectors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateConnector = () => {
    // TODO: Implement create connector modal
    console.log("Create connector clicked");
  };

  const handleConnectorClick = (connector: DataConnector) => {
    // Placeholder for navigation to connector detail or connections view
    console.log("Connector clicked:", connector);
  };

  return (
    <div className="">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            Data Connectors
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Manage and monitor your data connections across sources and
            destinations
          </p>
        </div>
        <button
          onClick={handleCreateConnector}
          className={`inline-flex items-center gap-2 px-6 py-2 text-sm font-medium ${tw.rounded} transition-colors`}
          style={{
            backgroundColor: color.primary.action,
            color: "white",
          }}
        >
          + Create
        </button>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Plug
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">
                Total Connectors
              </p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {connectors.length}
            </p>
          </div>
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">Active</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {connectors.filter((c) => c.isActive).length}
            </p>
          </div>
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Database
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">
                Total Connections
              </p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {connectors.reduce((sum, c) => sum + (c.connectionCount || 0), 0)}
            </p>
          </div>
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Layers
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">
                Connector Types
              </p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {new Set(connectors.map((c) => c.type)).size}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
            style={{ color: color.text.muted }}
          />
          <input
            type="text"
            placeholder="Search connectors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearchTerm(searchTerm)}
            className={`w-full pl-10 pr-4 py-3 text-sm border ${tw.borderDefault} ${tw.rounded} focus:outline-none transition-all duration-200 bg-white focus:ring-2 focus:ring-[${color.primary.accent}]/20`}
          />
        </div>

        <button
          onClick={() => console.log("Filters clicked")}
          className={`flex items-center gap-2 ${tw.rounded} transition-colors font-medium`}
          style={{
            backgroundColor: button.secondaryAction.background,
            color: button.secondaryAction.color,
            border: button.secondaryAction.border,
            padding: `${button.secondaryAction.paddingY} ${button.secondaryAction.paddingX}`,
            borderRadius: button.secondaryAction.borderRadius,
            fontSize: button.secondaryAction.fontSize,
          }}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-600">
          <div
            className="animate-spin rounded-full h-5 w-5 border-b-2"
            style={{ borderColor: color.primary.action }}
          ></div>
          <span>Loading connectors...</span>
        </div>
      ) : (
        <div
          className={` ${tw.rounded} border ${tw.borderDefault} shadow-sm overflow-hidden`}
        >
          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Connector
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Type
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Connections
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Last Used
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs sm:text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {connectors.length === 0 ? (
                  <tr>
                    <td
                      className={`px-6 py-6 text-sm ${tw.textSecondary}`}
                      colSpan={6}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      No data connectors found. Get started by creating your
                      first connector.
                    </td>
                  </tr>
                ) : (
                  connectors.map((connector) => (
                    <tr key={connector.id} className="transition-colors">
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex flex-col gap-1">
                          <span
                            className={`text-sm font-semibold ${tw.textPrimary}`}
                          >
                            {connector.name}
                          </span>
                          {/* <span className={`text-xs ${tw.textSecondary}`}>
                            {connector.description}
                          </span> */}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className={tw.textPrimary}>
                          {getConnectorDisplayName(connector.type)}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="inline-flex items-center font-medium text-gray-900">
                          {connector.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className={`font-medium ${tw.textPrimary}`}>
                          {connector.connectionCount ?? "--"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className={tw.textPrimary}>
                          {connector.lastUsed
                            ? connector.lastUsed.toLocaleDateString()
                            : "--"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-sm"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleConnectorClick(connector)}
                            className={`p-2 ${tw.rounded} hover:bg-[${color.interactive.hover}] transition-colors`}
                            aria-label="View connector"
                          >
                            <Eye
                              className="h-5 w-5"
                              style={{ color: color.text.primary }}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
