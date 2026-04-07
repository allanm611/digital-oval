import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trash2,
  Edit,
  PlayCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Database,
  Activity,
  Shield,
  RefreshCw,
  ExternalLink,
  Clock,
} from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import {
  ConnectionTestResult,
  DataConnector,
  UpdateDataConnectorRequest,
  DataConnectorFormData,
} from "../types/dataConnector";
import { dataConnectorService } from "../services/dataConnectorService";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { tw, color, button } from "../../../shared/utils/utils";
import ConnectorConfigDisplay from "../components/ConnectorConfigDisplay";
import DataConnectorForm from "../components/DataConnectorForm";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";

export default function DataConnectorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success } = useToast();
  const { t } = useLanguage();

  const [connector, setConnector] = useState<DataConnector | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(
    null,
  );
  const [isTesting, setIsTesting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const confirmDelete = async () => {
    try {
      await dataConnectorService.deleteDataConnector(connector!.id);
      success("Deleted", "Connector removed");
      navigate("/dashboard/data-connectors");
    } catch (err: any) {
      showError("Delete failed", err.message || "Could not delete connector");
    }
  };

  const handleFormClose = () => {
    setShowEditModal(false);
  };

  const handleFormSave = async (formData: DataConnectorFormData) => {
    if (!connector) return;

    try {
      const payload: UpdateDataConnectorRequest = {
        name: formData.name.trim(),
        description: formData.description?.trim(),
        is_active: connector.is_active,
        configuration: formData.configuration,
      };

      const updated = await dataConnectorService.updateDataConnector(
        connector.id,
        payload,
      );

      if (updated) {
        setConnector(updated);
        success("Success", "Connector updated successfully");
        setShowEditModal(false);
      }
    } catch (err: any) {
      showError("Save failed", err.message || "Could not update connector");
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <BackButton
          fallbackTo="/dashboard/data-connectors"
          showBreadcrumb={true}
          currentLabel="Data Connector Details"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !connector.is_active}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-900 text-gray-900 rounded text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              connector.is_active
                ? "Test this connection"
                : "Connector must be active"
            }
          >
            {isTesting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            ) : (
              <PlayCircle className="w-4 h-4" />
            )}
            {isTesting ? "Testing..." : "Test Connection"}
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className={`flex items-center gap-2 ${tw.button} text-sm`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded text-sm font-medium transition-colors hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overview Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              {connector.name}
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              {connector.description || "No description provided"}
            </p>
            <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
              <span
                className={`px-2 py-1 rounded text-sm font-medium ${
                  connector.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {connector.is_active ? "Active" : "Inactive"}
              </span>
              <span className="text-sm text-gray-500 capitalize">
                Type: {connector.type}
              </span>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Configuration
            </h3>
            <ConnectorConfigDisplay connector={connector} isEditMode={false} />
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`border rounded-lg p-4 ${
                testResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <h4
                    className={`text-sm font-medium ${
                      testResult.success
                        ? "text-green-900"
                        : "text-red-900"
                    }`}
                  >
                    {testResult.success ? "Connection Successful" : "Test Failed"}
                  </h4>
                  <p
                    className={`text-sm mt-1 ${
                      testResult.success
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {testResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Recent Activity
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-4 w-4 text-gray-400" />
                  <span>Created on {connector.created_at}</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Last updated {connector.updated_at}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Details</h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Connector ID</p>
                <p className="text-sm font-mono text-gray-900">
                  {connector.id}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Type</p>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {connector.type}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-gray-900">
                    {connector.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Connection Test</p>
                <div className="flex items-center gap-2">
                  {testResult?.success ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-700">
                        Passed
                      </p>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-600">Not tested yet</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Quick Links
            </h3>
            <button
              onClick={() =>
                navigate(`/dashboard/data-connectors/${connector.id}/logs`)
              }
              className="w-full flex items-center justify-between p-2 border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  View Logs
                </span>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Data Connector"
        description={`Are you sure you want to delete "${connector.name}"? This action cannot be undone.`}
        itemName={connector.name}
        isLoading={false}
        confirmText="Delete Connector"
        cancelText="Cancel"
        variant="warning"
        onConfirm={confirmDelete}
      />

      {/* Edit Form Modal */}
      <DataConnectorForm
        connector={connector}
        isOpen={showEditModal}
        onClose={handleFormClose}
        onSave={handleFormSave}
      />
    </div>
  );
}
