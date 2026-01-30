import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plug,
  CheckCircle,
  Database,
  Layers,
  MoreVertical,
  Eye,
  Copy,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import { DataConnector } from "../types";
import { fetchDataConnectors } from "../services";
import { getConnectorIcon } from "../utils/connectorIcons";
import { tw, color, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import CreateButton from "../../../shared/components/ui/CreateButton";

export default function DataConnectors() {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const [connectors, setConnectors] = useState<DataConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setActionMenuOpen(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleConnectorClick = (connector: DataConnector) => {
    navigate(`/dashboard/data-connectors/${connector.id}`);
  };

  const handleMenuToggle = (
    e: React.MouseEvent<HTMLButtonElement>,
    connectorId: string,
  ) => {
    e.stopPropagation();
    setActionMenuOpen((prev) => (prev === connectorId ? null : connectorId));
  };

  const handleMenuAction = (
    e: React.MouseEvent<HTMLButtonElement>,
    action: "view" | "clone" | "export" | "import" | "delete",
    connector: DataConnector,
  ) => {
    e.stopPropagation();
    setActionMenuOpen(null);

    switch (action) {
      case "view":
        handleConnectorClick(connector);
        break;
      case "clone":
        showError("Not implemented", "Clone connector will be available soon");
        break;
      case "export":
        showError("Not implemented", "Export connector will be available soon");
        break;
      case "import":
        showError("Not implemented", "Import connector will be available soon");
        break;
      case "delete":
        showError("Not implemented", "Delete connector will be available soon");
        break;
      default:
        break;
    }
  };

  return (
    <div className="">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            Data Connectors
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Manage and monitor your data connections across sources and
            destinations
          </p>
        </div>
        <CreateButton onClick={() => setShowCreateModal(true)} />
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
                      colSpan={5}
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
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {(() => {
                              const IconComp = connector.icon;
                              return (
                                <IconComp
                                  className="h-5 w-5"
                                  style={{ color: getConnectorIcon(connector.type).color }}
                                />
                              );
                            })()}
                          </div>
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
                        </div>
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
                        <div className="relative flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleConnectorClick(connector)}
                            className={`group p-3 ${tw.rounded} ${tw.textSecondary} hover:bg-[${color.primary.accent}]/10 transition-all duration-200`}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) =>
                              handleMenuAction(e, "delete", connector)
                            }
                            className={`group p-3 ${tw.rounded} text-red-600 hover:bg-red-50 transition-all duration-200`}
                            title="Delete connector"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => handleMenuToggle(e, connector.id)}
                              className={`group p-3 ${tw.rounded} ${tw.textSecondary} hover:bg-[${color.primary.accent}]/10 transition-all duration-200`}
                              aria-label="More actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {actionMenuOpen === connector.id && (
                              <div
                                className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {[
                                  { key: "clone", label: "Clone", icon: Copy },
                                  { key: "export", label: "Export", icon: Download },
                                  { key: "import", label: "Import", icon: Upload },
                                ].map((item) => (
                                  <button
                                    key={item.key}
                                    className={`w-full flex items-center px-4 py-2 text-left text-sm transition-colors ${tw.textPrimary} hover:bg-gray-50`}
                                    onClick={(e) =>
                                      handleMenuAction(
                                        e,
                                        item.key as "clone" | "export" | "import",
                                        connector,
                                      )
                                    }
                                  >
                                    <item.icon className="h-4 w-4 mr-3" />
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
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
