import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trash2,
  Edit,
  X,
  PlayCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
  Settings,
  Database,
  Activity,
  Shield,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import {
  ConnectionTestResult,
  DataConnector,
  UpdateDataConnectorRequest,
} from "../types/dataConnector";
import { dataConnectorService } from "../services/dataConnectorService";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { tw } from "../../../shared/utils/utils";
import ConnectorConfigDisplay from "../components/ConnectorConfigDisplay";
// import ConnectionProfilesSection from "../components/ConnectionProfilesSection";
// import AddConnectionModal from "../components/AddConnectionModal";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";

export default function DataConnectorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success } = useToast();
  const { t } = useLanguage();

  const [connector, setConnector] = useState<DataConnector | null>(null);
  const [connectionProfiles, setConnectionProfiles] = useState<
    Array<{
      id: number;
      name: string;
      type: string;
      status: "active" | "inactive" | "error";
      last_used?: string;
      connections?: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<DataConnector | null>(null);
  const [isAddConnectionModalOpen, setIsAddConnectionModalOpen] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(
    null,
  );
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "config" | "profiles"
  >("overview");

  useEffect(() => {
    if (id) {
      loadConnector();
    }
  }, [id]);

  const loadConnector = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await dataConnectorService.fetchDataConnectorById(id);

      if (!data) {
        showError("Not Found", "Data connector not found");
        navigate("/dashboard/data-connectors");
        return;
      }

      setConnector(data);

      // Load connection profiles with more realistic data
      setConnectionProfiles([
        {
          id: 1,
          name: "CDR-Primary",
          type: "Database",
          status: "active",
          last_used: "2024-01-15 14:30",
          connections: 8,
        },
        {
          id: 2,
          name: "CDR-Backup",
          type: "Database",
          status: "active",
          last_used: "2024-01-14 09:15",
          connections: 3,
        },
        {
          id: 3,
          name: "CDR-Archive",
          type: "Database",
          status: "inactive",
          last_used: "2024-01-10 16:45",
          connections: 0,
        },
        {
          id: 4,
          name: "API-Endpoint",
          type: "API",
          status: "error",
          last_used: "2024-01-12 11:20",
          connections: 1,
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

  const handleSaveEdit = async () => {
    if (!editFormData || !connector) return;

    try {
      setIsSaving(true);

      const payload: UpdateDataConnectorRequest = {
        name: editFormData.name.trim(),
        description: editFormData.description?.trim(),
        is_active: editFormData.is_active,
        configuration: editFormData.configuration ?? undefined,
      };

      const updated = await dataConnectorService.updateDataConnector(
        connector.id,
        payload,
      );

      if (updated) {
        setConnector(updated);
        success("Saved", "Connector updated successfully");
      }

      setIsEditMode(false);
      setEditFormData(null);
    } catch (err: any) {
      showError("Save failed", err.message || "Could not update connector");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditFormData(null);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await dataConnectorService.deleteDataConnector(connector!.id);
      success("Deleted", "Connector removed");
      navigate("/dashboard/data-connectors");
    } catch (err: any) {
      showError("Delete failed", err.message || "Could not delete connector");
    }
  };

  const handleTestConnection = async () => {
    if (!connector) return;

    try {
      setIsTesting(true);
      setTestResult(null);

      const result = await dataConnectorService.testDataConnectorConnection(
        connector.id,
      );
      setTestResult(result);

      if (result.success) {
        success("Connection OK", result.message);
      } else {
        showError("Connection failed", result.message);
      }
    } catch (err: any) {
      showError("Test failed", err.message || "Connection test error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleProfileClick = (profileId: number) => {
    navigate(`/dashboard/connection-profiles/${profileId}`);
  };

  const handleAddConnection = () => {
    setIsAddConnectionModalOpen(true);
  };

  const handleConnectionModalSuccess = async () => {
    await loadConnector();
    success("Success", "Connection profile added");
  };

  const handleEditProfile = (profileId: number) => {
    navigate(`/dashboard/connection-profiles/${profileId}/edit`);
  };

  const handleDeleteProfile = (profileId: number) => {
    // TODO: Implement delete confirmation
    showError("Not Implemented", "Delete functionality coming soon");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "database":
        return <Database className="h-5 w-5" />;
      case "api":
        return <Settings className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!connector) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">
            Connector Not Found
          </h2>
          <p className="text-gray-600">
            The data connector you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/dashboard/data-connectors")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Connectors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <BackButton
              fallbackTo="/dashboard/data-connectors"
              className="hover:bg-gray-100 rounded-lg p-2"
            />
            {isEditMode ? (
              <div className="space-y-3 flex-1">
                <input
                  value={editFormData?.name ?? ""}
                  onChange={(e) =>
                    setEditFormData((p) =>
                      p ? { ...p, name: e.target.value } : null,
                    )
                  }
                  className="text-3xl font-bold w-full border-b-2 border-blue-500 bg-transparent focus:outline-none focus:border-blue-600 px-2 py-1"
                  placeholder="Enter connector name"
                />
                <textarea
                  value={editFormData?.description ?? ""}
                  onChange={(e) =>
                    setEditFormData((p) =>
                      p ? { ...p, description: e.target.value } : null,
                    )
                  }
                  className="w-full text-base border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                  rows={2}
                  placeholder="Enter description..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className={`${tw.tableFirstColumn} text-gray-900`}>
                    {connector.name}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${connector.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {connector.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {connector.description || "No description provided"}
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {connector.type}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Profiles</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {
                      connectionProfiles.filter((p) => p.status === "active")
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Tested</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {testResult ? "Now" : "Never"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
          {!isEditMode ? (
            <>
              <button
                onClick={handleTestConnection}
                disabled={isTesting || !connector.is_active}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  connector.is_active
                    ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                    : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                Test Connection
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleEdit}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Test Result Banner */}
      {testResult && (
        <div
          className={`rounded-xl border-l-4 ${
            testResult.success
              ? "bg-green-50 border-green-500"
              : "bg-red-50 border-red-500"
          }`}
        >
          <div className="p-4 flex items-start gap-4">
            {testResult.success ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {testResult.success
                  ? "Connection Successful"
                  : "Connection Failed"}
              </h3>
              <p className="text-gray-700 mt-1">{testResult.message}</p>
              {testResult.error_details && (
                <div className="mt-2 p-3 bg-white/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    Error Details:
                  </p>
                  <p className="text-sm text-gray-600 mt-1 font-mono">
                    {testResult.error_details}
                  </p>
                </div>
              )}
              {testResult.response_time_ms && (
                <p className="text-sm text-gray-500 mt-3">
                  Response time:{" "}
                  <span className="font-medium">
                    {testResult.response_time_ms}ms
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "config"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab("profiles")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "profiles"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Connection Profiles ({connectionProfiles.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Connection Profiles Preview */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Connection Profiles
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Manage your connection profiles
                    </p>
                  </div>
                  <button
                    onClick={handleAddConnection}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Add Profile
                  </button>
                </div>
                <div className="space-y-3">
                  {connectionProfiles.slice(0, 3).map((profile) => (
                    <div
                      key={profile.id}
                      className="group flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => handleProfileClick(profile.id)}
                    >
                      <div className="flex items-center gap-4">
                        {getTypeIcon(profile.type)}
                        <div>
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                            {profile.name}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(profile.status)}`}
                            >
                              {profile.status.charAt(0).toUpperCase() +
                                profile.status.slice(1)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {profile.connections} connections
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                    </div>
                  ))}
                </div>
                {connectionProfiles.length > 3 && (
                  <button
                    onClick={() => setActiveTab("profiles")}
                    className="w-full mt-4 py-3 text-center text-blue-600 hover:text-blue-800 text-sm font-medium border border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    View all {connectionProfiles.length} profiles
                  </button>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        Connection test performed
                      </p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Success
                    </span>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        Configuration updated
                      </p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting || !connector.is_active}
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <PlayCircle className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Test Connection
                      </span>
                    </div>
                    {isTesting && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/dashboard/data-connectors/${connector.id}/logs`,
                      )
                    }
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        View Logs
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </button>
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <Edit className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Edit Connector
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Connector Info */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Connector Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="text-sm font-mono text-gray-900">
                      {connector.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-sm text-gray-900">
                      {connector.created_at}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="text-sm text-gray-900">
                      {connector.updated_at}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {connector.type}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "config" && (
          <ConnectorConfigDisplay
            connector={editFormData || connector}
            isEditMode={isEditMode}
            onConfigChange={(updatedConfig) => {
              if (editFormData) {
                setEditFormData({
                  ...editFormData,
                  configuration: updatedConfig,
                });
              }
            }}
          />
        )}

        {activeTab === "profiles" && (
          <div className="text-center text-gray-500 py-8">
            <p>Connection Profiles</p>
          </div>
          // <ConnectionProfilesSection
          //   profiles={connectionProfiles.map(p => ({
          //     id: p.id,
          //     name: p.name,
          //     type: p.type,
          //     is_active: p.status === 'active',
          //   }))}
          //   connectorId={connector.id}
          //   connectorType={connector.type}
          //   onProfileClick={handleProfileClick}
          //   onAddProfile={handleAddConnection}
          //   onEditProfile={handleEditProfile}
          //   onDeleteProfile={handleDeleteProfile}
          // />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Data Connector"
        description={`Are you sure you want to delete "${connector.name}"? This action cannot be undone and all associated connection profiles will be removed.`}
        itemName={connector.name}
        isLoading={false}
        confirmText="Delete Connector"
        cancelText="Cancel"
        variant="warning"
        onConfirm={confirmDelete}
      />

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
// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Trash2, Edit, X, PlayCircle, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
// import BackButton from "../../../shared/components/ui/BackButton";
// import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
// import { ConnectionTestResult, DataConnector, UpdateDataConnectorRequest } from "../types";
// import { fetchDataConnectorById } from "../services";
// import { tw, color, button } from "../../../shared/utils/utils";
// import { useToast } from "../../../contexts/ToastContext";
// import { useLanguage } from "../../../contexts/LanguageContext";
// import ConnectorConfigDisplay from "../components/ConnectorConfigDisplay";
// import ConnectionProfilesSection from "../components/ConnectionProfilesSection";
// import AddConnectionModal from "../components/AddConnectionModal";
// import { updateDataConnector, deleteDataConnector, testDataConnectorConnection } from "../services";
// // import ConfirmDialog from "../../../shared/components/ui/ConfirmDialog";

// export default function DataConnectorDetailsPage() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const { error: showError, success } = useToast();
//   const { t } = useLanguage();

//   const [connector, setConnector] = useState<DataConnector | null>(null);
//   const [connectionProfiles, setConnectionProfiles] = useState<
//     Array<{
//       id: number;
//       name: string;
//       type: string;
//       is_active: boolean;
//     }>
//   >([]);
//   const [loading, setLoading] = useState(true);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [editFormData, setEditFormData] = useState<DataConnector | null>(null);
//   const [isAddConnectionModalOpen, setIsAddConnectionModalOpen] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
//   const [isTesting, setIsTesting] = useState(false);

//   useEffect(() => {
//     if (id) {
//       loadConnector();
//     }
//   }, [id]);

//   const loadConnector = async () => {
//     if (!id) return;

//     try {
//       setLoading(true);
//       const data = await dataConnectorService.fetchDataConnectorById(id);

//       if (!data) {
//         showError("Not Found", "Data connector not found");
//         navigate("/dashboard/data-connectors");
//         return;
//       }

//       setConnector(data);

//       // Load mock connection profiles (placeholder)
//       setConnectionProfiles([
//         {
//           id: 1,
//           name: "CDR-Primary",
//           type: "database",
//           is_active: true,
//         },
//         {
//           id: 2,
//           name: "CDR-Backup",
//           type: "database",
//           is_active: true,
//         },
//         {
//           id: 3,
//           name: "CDR-Archive",
//           type: "database",
//           is_active: false,
//         },
//       ]);
//     } catch (err) {
//       console.error("Failed to load data connector:", err);
//       showError(
//         "Failed to load data connector",
//         err instanceof Error ? err.message : "Please try again later.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Replace mock in loadConnector
//   // const profiles = await fetchConnectionProfiles({ dataConnectorId: id });
//   // setConnectionProfiles(profiles.map(p => ({
//   //   id: p.id,
//   //   name: p.name,
//   //   type: p.connectionType || p.type || 'unknown', // adjust field name
//   //   is_active: p.is_active ?? true,
//   // })));

//   const handleEdit = () => {
//     setIsEditMode(true);
//     setEditFormData(connector);
//   };

//   const handleSaveEdit = async () => {
//     if (!editFormData || !connector) return;

//     try {
//       setIsSaving(true);

//       const payload: UpdateDataConnectorRequest = {
//         name: editFormData.name.trim(),
//         description: editFormData.description?.trim(),
//         is_active: editFormData.is_active,
//         configuration: editFormData.configuration ?? undefined,
//         // metadata: add if supported
//       };

//       const updated = await dataConnectorService.updateDataConnector(connector.id, payload);

//       if (updated) {
//         setConnector(updated);
//         success("Saved", "Connector updated successfully");
//       }

//       setIsEditMode(false);
//       setEditFormData(null);
//     } catch (err: any) {
//       showError("Save failed", err.message || "Could not update connector");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleCancelEdit = () => {
//     setIsEditMode(false);
//     setEditFormData(null);
//   };

//   const handleDelete = async () => {
//     setShowDeleteConfirm(true);
//   };

//   const confirmDelete = async () => {
//     try {
//       await dataConnectorService.deleteDataConnector(connector!.id);
//       success("Deleted", "Connector removed");
//       navigate("/dashboard/data-connectors");
//     } catch (err: any) {
//       showError("Delete failed", err.message || "Could not delete connector");
//     }
//   };

//   const handleTestConnection = async () => {
//     if (!connector) return;

//     try {
//       setIsTesting(true);
//       setTestResult(null);

//       const result = await dataConnectorService.testDataConnectorConnection(connector.id);
//       setTestResult(result);

//       if (result.success) {
//         success("Connection OK", result.message);
//       } else {
//         showError("Connection failed", result.message);
//       }
//     } catch (err: any) {
//       showError("Test failed", err.message || "Connection test error");
//     } finally {
//       setIsTesting(false);
//     }
//   };

//   const handleProfileClick = (profileId: number) => {
//     navigate(`/dashboard/connection-profiles/${profileId}`);
//   };

//   const handleAddConnection = () => {
//     setIsAddConnectionModalOpen(true);
//   };

//   const handleConnectionModalSuccess = async () => {
//     await loadConnector(); // refreshes connector + profiles
//     success("Success", "Connection profile added");
//   };

//   const handleEditProfile = (profileId: number) => {
//     navigate(`/dashboard/connection-profiles/${profileId}/edit`);
//   };

//   const handleDeleteProfile = (profileId: number) => {
//     // TODO: Implement delete confirmation and API call
//     showError("Not Implemented", "Delete functionality coming soon");
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-12">
//         <LoadingSpinner />
//       </div>
//     );
//   }

//   if (!connector) {
//     return (
//       <div className="text-center py-12">
//         <p className={tw.textSecondary}>Data connector not found</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       {/* Header & Actions */}
//       <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
//         <div className="flex items-start gap-4">
//           <BackButton fallbackTo="/dashboard/data-connectors" />
//           <div>
//             {isEditMode ? (
//               <div className="space-y-3">
//                 <input
//                   value={editFormData?.name ?? ""}
//                   onChange={e => setEditFormData(p => p ? { ...p, name: e.target.value } : null)}
//                   className="text-2xl font-bold w-full border-b-2 border-blue-500 bg-transparent focus:outline-none"
//                 />
//                 <textarea
//                   value={editFormData?.description ?? ""}
//                   onChange={e => setEditFormData(p => p ? { ...p, description: e.target.value } : null)}
//                   className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
//                   rows={2}
//                 />
//               </div>
//             ) : (
//               <>
//                 <h1 className="text-2xl font-bold text-gray-900">{connector.name}</h1>
//                 <p className="mt-1 text-gray-600">{connector.description || "No description"}</p>
//               </>
//             )}
//           </div>
//         </div>

//         <div className="flex flex-wrap gap-3">
//           {!isEditMode && (
//             <>
//               <button
//                 onClick={handleTestConnection}
//                 disabled={isTesting || !connector.is_active}
//                 className={`inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium ${
//                   connector.is_active
//                     ? "border-green-600 text-green-700 hover:bg-green-50"
//                     : "border-gray-300 text-gray-400 cursor-not-allowed"
//                 } disabled:opacity-60`}
//               >
//                 {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
//                 Test Connection
//               </button>

//               <button
//                 onClick={handleEdit}
//                 className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
//               >
//                 <Edit className="h-4 w-4" />
//                 Edit
//               </button>

//               <button
//                 onClick={() => setShowDeleteConfirm(true)}
//                 className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
//               >
//                 <Trash2 className="h-4 w-4" />
//                 Delete
//               </button>
//             </>
//           )}

//           {isEditMode && (
//             <>
//               <button
//                 onClick={handleCancelEdit}
//                 disabled={isSaving}
//                 className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveEdit}
//                 disabled={isSaving}
//                 className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
//               >
//                 {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
//                 Save Changes
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Test Result */}
//       {testResult && (
//         <div className={`p-4 rounded-lg border ${
//           testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
//         }`}>
//           <div className="flex items-start gap-3">
//             {testResult.success ? (
//               <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
//             ) : (
//               <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
//             )}
//             <div className="flex-1">
//               <p className="font-medium">{testResult.message}</p>
//               {testResult.error_details && <p className="text-sm mt-1 text-red-700">{testResult.error_details}</p>}
//               {testResult.response_time_ms && (
//                 <p className="text-xs text-gray-600 mt-2">Response time: {testResult.response_time_ms}ms</p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* <ConfirmDialog
//           isOpen={showDeleteConfirm}
//           title="Delete Data Connector"
//           message={`Are you sure you want to delete "${connector?.name}"? This action cannot be undone.`}
//           confirmText="Delete"
//           confirmVariant="danger"
//           onConfirm={confirmDelete}
//           onCancel={() => setShowDeleteConfirm(false)}
//         /> */}

//         <ConnectorConfigDisplay
//           connector={editFormData || connector}
//           isEditMode={isEditMode}
//           onConfigChange={(updatedConfig) => {
//             if (editFormData) {
//               setEditFormData({
//                 ...editFormData,
//                 configuration: updatedConfig,
//               });
//             }
//           }}
//         />
//         <ConnectionProfilesSection
//         profiles={connectionProfiles}
//         connectorId={connector.id}
//         connectorType={connector.type}
//         onProfileClick={handleProfileClick}
//         onAddProfile={handleAddConnection}
//         onEditProfile={handleEditProfile}
//         onDeleteProfile={handleDeleteProfile}
//       />

//       <AddConnectionModal
//         isOpen={isAddConnectionModalOpen}
//         onClose={() => setIsAddConnectionModalOpen(false)}
//         connectorType={connector.type}
//         onSuccess={handleConnectionModalSuccess}
//         />
//     </div>
//   );
// }

// // return (
// //     <div className="flex items-center justify-between mb-6">
// //       <div className="flex items-center gap-4">
// //         <BackButton fallbackTo="/dashboard/data-connectors" />
// //         {isEditMode ? (
// //           <div className="space-y-3">
// //             <input
// //               type="text"
// //               value={editFormData?.name ?? ""}
// //               onChange={(e) => setEditFormData(prev => prev ? { ...prev, name: e.target.value } : null)}
// //               className="text-2xl font-bold w-full border-b-2 border-blue-500 focus:outline-none bg-transparent"
// //             />
// //             <textarea
// //               value={editFormData?.description ?? ""}
// //               onChange={(e) => setEditFormData(prev => prev ? { ...prev, description: e.target.value } : null)}
// //               className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
// //               rows={2}
// //               placeholder="Enter description..."
// //             />
// //           </div>
// //         ) : (
// //           <>
// //             <h1 className="text-2xl font-bold text-gray-900">{connector.name}</h1>
// //             <p className="text-gray-600 mt-1">{connector.description || "No description provided."}</p>
// //           </>
// //         )}
// //       </div>

// //       <div className="flex items-center gap-3">
// //         {isEditMode ? (
// //           <>
// //             <button
// //               onClick={handleCancelEdit}
// //               disabled={isSaving}
// //               className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
// //             >
// //               Cancel
// //             </button>
// //             <button
// //               onClick={handleSaveEdit}
// //               disabled={isSaving}
// //               className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
// //             >
// //               {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
// //               Save Changes
// //             </button>
// //           </>
// //         ) : (
// //           <>
// //             <button
// //               onClick={handleTestConnection}
// //               disabled={isTesting || !connector.is_active}
// //               className="inline-flex items-center gap-2 px-4 py-2 border border-green-600 text-green-700 rounded-md hover:bg-green-50 disabled:opacity-50"
// //             >
// //               {isTesting ? (
// //                 <Loader2 className="h-4 w-4 animate-spin" />
// //               ) : (
// //                 <PlayCircle className="h-4 w-4" />
// //               )}
// //               Test Connection
// //             </button>

// //             <button
// //               onClick={handleEdit}
// //               className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
// //             >
// //               <Edit className="h-4 w-4" />
// //               Edit
// //             </button>

// //             <button
// //               onClick={handleDelete}
// //               className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
// //             >
// //               <Trash2 className="h-4 w-4" />
// //               Delete
// //             </button>
// //           </>
// //         )}
// //       </div>
// //       {testResult && (
// //         <div className={`mt-4 p-4 rounded-lg border ${
// //           testResult.success
// //             ? "bg-green-50 border-green-200 text-green-800"
// //             : "bg-red-50 border-red-200 text-red-800"
// //         }`}>
// //           <div className="flex items-start">
// //             {testResult.success ? (
// //               <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
// //             ) : (
// //               <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
// //             )}
// //             <div>
// //               <p className="font-medium">{testResult.message}</p>
// //               {testResult.error_details && (
// //                 <p className="text-sm mt-1 opacity-90">{testResult.error_details}</p>
// //               )}
// //               {testResult.response_time_ms && (
// //                 <p className="text-xs mt-2 text-gray-600">
// //                   Response time: {testResult.response_time_ms} ms
// //                 </p>
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //       <ConfirmDialog
// //         isOpen={showDeleteConfirm}
// //         title="Delete Data Connector"
// //         message={`Are you sure you want to delete "${connector?.name}"? This action cannot be undone.`}
// //         confirmText="Delete"
// //         confirmVariant="danger"
// //         onConfirm={confirmDelete}
// //         onCancel={() => setShowDeleteConfirm(false)}
// //       />

// //       <ConnectorConfigDisplay
// //         connector={editFormData || connector}
// //         isEditMode={isEditMode}
// //         onConfigChange={(updatedConfig) => {
// //           if (editFormData) {
// //             setEditFormData({
// //               ...editFormData,
// //               configuration: updatedConfig,
// //             });
// //           }
// //         }}
// //       />
// //     </div>

// //   );
