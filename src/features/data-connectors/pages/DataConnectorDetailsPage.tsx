import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Database,
  CheckCircle,
  XCircle,
  Calendar,
  Plug,
} from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { DataConnector } from "../types";
import { fetchDataConnectorById } from "../services";
import {
  getConnectorDisplayName,
  getConnectorIcon,
} from "../utils/connectorIcons";
import { tw, color } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import DateFormatter from "../../../shared/components/DateFormatter";

export default function DataConnectorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { t } = useLanguage();

  const [connector, setConnector] = useState<DataConnector | null>(null);
  const [connectionProfiles, setConnectionProfiles] = useState<
    Array<{
      id: number;
      name: string;
      type: string;
      environment: string;
      is_active: boolean;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadConnector();
    }
  }, [id]);

  const loadConnector = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await fetchDataConnectorById(id);

      if (!data) {
        showError("Not Found", "Data connector not found");
        navigate("/dashboard/data-connectors");
        return;
      }

      setConnector(data);

      // Load mock connection profiles (placeholder)
      setConnectionProfiles([
        {
          id: 1,
          name: "Prod Database",
          type: "database",
          environment: "production",
          is_active: true,
        },
        {
          id: 2,
          name: "REST API",
          type: "api",
          environment: "staging",
          is_active: true,
        },
        {
          id: 3,
          name: "Kafka Stream",
          type: "kafka",
          environment: "production",
          is_active: false,
        },
        {
          id: 4,
          name: "Files - S3",
          type: "s3",
          environment: "production",
          is_active: true,
        },
        {
          id: 5,
          name: "Webhook Ingest",
          type: "webhook",
          environment: "dev",
          is_active: true,
        },
      ]);
    } catch (err) {
      console.error("Failed to load data connector:", err);
      showError(
        "Failed to load data connector",
        err instanceof Error ? err.message : "Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    showError("Not Implemented", "Edit functionality coming soon");
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    showError("Not Implemented", "Delete functionality coming soon");
  };

  const handleProfileClick = (profileId: number) => {
    navigate(`/dashboard/connection-profiles/${profileId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!connector) {
    return (
      <div className="text-center py-12">
        <p className={tw.textSecondary}>Data connector not found</p>
      </div>
    );
  }

  const IconComp = connector.icon;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="mb-6">
        <BackButton
          onClick={() =>
            navigateBackOrFallback(navigate, "/dashboard/data-connectors")
          }
        />
      </div>

      {/* Connector Info Card */}
      <div
        className={`${tw.rounded} border ${tw.borderDefault} shadow-sm p-6 bg-transparent`}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 ${tw.rounded}`}
              style={{ backgroundColor: `${color.primary.accent}15` }}
            >
              <IconComp
                className="h-8 w-8"
                style={{ color: color.primary.accent }}
              />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${tw.textPrimary} mb-1`}>
                {connector.name}
              </h1>
              <p className={`text-sm ${tw.textSecondary}`}>
                {getConnectorDisplayName(connector.type)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className={`p-2 ${tw.rounded} border ${tw.borderDefault} hover:bg-gray-50 transition-colors`}
            >
              <Edit className="h-5 w-5" style={{ color: color.text.primary }} />
            </button>
            <button
              onClick={handleDelete}
              className={`p-2 ${tw.rounded} border border-red-200 hover:bg-red-50 transition-colors`}
            >
              <Trash2 className="h-5 w-5 text-red-600" />
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className={`text-sm ${tw.textSecondary} mb-1`}>Status</p>
            <div className="flex items-center gap-2">
              {connector.isActive ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className={`font-medium ${tw.textPrimary}`}>
                    Active
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className={`font-medium ${tw.textSecondary}`}>
                    Inactive
                  </span>
                </>
              )}
            </div>
          </div>

          <div>
            <p className={`text-sm ${tw.textSecondary} mb-1`}>Connections</p>
            <div className="flex items-center gap-2">
              <Database
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <span className={`font-medium ${tw.textPrimary}`}>
                {connector.connectionCount ?? 0}
              </span>
            </div>
          </div>

          <div>
            <p className={`text-sm ${tw.textSecondary} mb-1`}>Last Used</p>
            <div className="flex items-center gap-2">
              <Calendar
                className="h-5 w-5"
                style={{ color: color.text.muted }}
              />
              <span className={`font-medium ${tw.textPrimary}`}>
                {connector.lastUsed ? (
                  <DateFormatter date={connector.lastUsed} format="relative" />
                ) : (
                  "Never"
                )}
              </span>
            </div>
          </div>
        </div>

        {connector.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className={`text-sm ${tw.textSecondary} mb-2`}>Description</p>
            <p className={`${tw.textPrimary}`}>{connector.description}</p>
          </div>
        )}
      </div>

      {/* Connection Profiles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>Connection Profiles</h2>
          <button
            className={`text-sm font-medium ${tw.textSecondary}`}
            onClick={() => showError("Not implemented", "Create profile from here soon")}
          >
            + Add profile
          </button>
        </div>
        {connectionProfiles.length === 0 ? (
          <div className={`${tw.rounded} border ${tw.borderDefault} p-6 text-center bg-transparent`}>
            <Plug className="h-10 w-10 mx-auto mb-2" style={{ color: color.text.muted }} />
            <p className={`${tw.textSecondary}`}>No connection profiles yet</p>
          </div>
        ) : (
          <div>
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopLeftRadius: "0.375rem",
                    }}
                  >
                    Profile Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Type
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Environment
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {connectionProfiles.map((profile) => (
                  <tr
                    key={profile.id}
                    onClick={() => handleProfileClick(profile.id)}
                    className="transition-colors cursor-pointer hover:opacity-75"
                    style={{
                      backgroundColor: "transparent",
                    }}
                  >
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <span className={`font-medium ${tw.textPrimary}`}>
                        {profile.name}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={tw.textPrimary}>{profile.type}</span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={tw.textPrimary}>
                        {profile.environment || "--"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      {profile.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <XCircle className="h-4 w-4" /> Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
