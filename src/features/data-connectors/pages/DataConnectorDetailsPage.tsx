import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, X } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { DataConnector } from "../types";
import { fetchDataConnectorById } from "../services";
import { tw, color, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import ConnectorConfigDisplay from "../components/ConnectorConfigDisplay";
import ConnectionProfilesSection from "../components/ConnectionProfilesSection";
import AddConnectionModal from "../components/AddConnectionModal";

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
      is_active: boolean;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<DataConnector | null>(null);
  const [isAddConnectionModalOpen, setIsAddConnectionModalOpen] = useState(false);

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
          name: "CDR-Primary",
          type: "database",
          is_active: true,
        },
        {
          id: 2,
          name: "CDR-Backup",
          type: "database",
          is_active: true,
        },
        {
          id: 3,
          name: "CDR-Archive",
          type: "database",
          is_active: false,
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
    setIsEditMode(true);
    setEditFormData(connector);
  };

  const handleSaveEdit = () => {
    // TODO: Implement actual save to API
    // For now, just update local state
    if (editFormData) {
      setConnector(editFormData);
      setIsEditMode(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFormData(null);
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    showError("Not Implemented", "Delete functionality coming soon");
  };

  const handleProfileClick = (profileId: number) => {
    navigate(`/dashboard/connection-profiles/${profileId}`);
  };

  const handleAddConnection = () => {
    setIsAddConnectionModalOpen(true);
  };

  const handleConnectionModalSuccess = () => {
    // Refresh connection profiles list
    if (id) {
      loadConnector();
    }
  };

  const handleEditProfile = (profileId: number) => {
    navigate(`/dashboard/connection-profiles/${profileId}/edit`);
  };

  const handleDeleteProfile = (profileId: number) => {
    // TODO: Implement delete confirmation and API call
    showError("Not Implemented", "Delete functionality coming soon");
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

  return (
    <div className="space-y-6">
      {/* Connector Info Card */}
      <div
        className={`${tw.rounded} border border-gray-200 shadow-sm p-6 bg-white`}
      >
        {/* Header with Back Button and Name */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BackButton fallbackTo="/dashboard/data-connectors" />
            <h1 className="text-2xl font-bold text-black">{connector.name}</h1>
          </div>
          {!isEditMode && (
            <div className="flex gap-3">
              <button
                onClick={handleEdit}
                className={`inline-flex items-center gap-2 ${tw.rounded} transition-colors text-white`}
                style={{
                  backgroundColor: color.primary.action,
                  padding: `${button.action.paddingY} ${button.action.paddingX}`,
                }}
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className={`inline-flex items-center gap-2 ${tw.rounded} transition-colors text-white hover:opacity-90`}
                style={{
                  backgroundColor: "#ef4444",
                  padding: `${button.action.paddingY} ${button.action.paddingX}`,
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
          {isEditMode && (
            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                className={`inline-flex items-center gap-2 ${tw.rounded} transition-colors text-white`}
                style={{
                  backgroundColor: color.primary.action,
                  padding: `${button.action.paddingY} ${button.action.paddingX}`,
                }}
              >
                <Edit className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className={`inline-flex items-center gap-2 ${tw.rounded} transition-colors text-white`}
                style={{
                  backgroundColor: "#6b7280",
                  padding: `${button.action.paddingY} ${button.action.paddingX}`,
                }}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Basic Information Section */}
        <div className="pt-4 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Description</p>
            {isEditMode && editFormData ? (
              <textarea
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                rows={3}
              />
            ) : (
              <p className="text-black">{connector.description}</p>
            )}
          </div>

          {connector.lastUsed && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Used</p>
                <p className="text-sm font-medium text-black">
                  {new Date(connector.lastUsed).toLocaleDateString()}
                </p>
              </div>
              {connector.connectionCount !== undefined && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Connection Profiles
                  </p>
                  <p className="text-sm font-medium text-black">
                    {connector.connectionCount}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Section */}
      <div
        className={`${tw.rounded} border border-gray-200 shadow-sm p-6 bg-white`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black">Configuration</h2>
          {isEditMode && (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded">
              Editing Mode
            </span>
          )}
        </div>
        {editFormData ? (
          <ConnectorConfigDisplay
            connector={editFormData}
            isEditMode={isEditMode}
            onConfigChange={(field, value) => {
              if (!editFormData.config) return;
              setEditFormData({
                ...editFormData,
                config: {
                  ...editFormData.config,
                  [field]: value,
                },
              });
            }}
          />
        ) : (
          <ConnectorConfigDisplay connector={connector} isEditMode={false} />
        )}
      </div>

      {/* Connection Profiles Section */}
      {!isEditMode && (
        <ConnectionProfilesSection
          connectorId={connector.id}
          connectorType={connector.type}
          profiles={connectionProfiles}
          onAddProfile={handleAddConnection}
          onProfileClick={handleProfileClick}
          onEditProfile={handleEditProfile}
          onDeleteProfile={handleDeleteProfile}
        />
      )}

      {/* Add Connection Modal */}
      <AddConnectionModal
        isOpen={isAddConnectionModalOpen}
        onClose={() => setIsAddConnectionModalOpen(false)}
        connectorType={connector.type}
        onSuccess={handleConnectionModalSuccess}
      />
    </div>
  );
}
