import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Edit,
  Play,
  AlertTriangle,
  CheckCircle,
  Database,
} from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import {
  ConnectionTestResult,
  ProcessedDataConnector,
  UpdateDataConnectorRequest,
  DataConnectorFormData,
} from "../types/dataConnector";
import { dataConnectorService } from "../services/dataConnectorService";
import { useToast } from "../../../contexts/ToastContext";
import { tw, color, button } from "../../../shared/utils/utils";
import ConnectorConfigDisplay from "../components/ConnectorConfigDisplay";
import DataConnectorForm from "../components/DataConnectorForm";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import DateFormatter from "../../../shared/components/DateFormatter";
import { getConnectorDisplayName } from "../utils/connectorIcons";

export default function DataConnectorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success } = useToast();

  const [connector, setConnector] = useState<ProcessedDataConnector | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(
    null,
  );
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadConnector = useCallback(async () => {
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
  }, [id, navigate, showError]);

  useEffect(() => {
    if (id) {
      loadConnector();
    }
  }, [id, loadConnector]);

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
    if (!connector) return;

    try {
      setIsDeleting(true);
      await dataConnectorService.deleteDataConnector(connector.id);
      success("Deleted", "Connector removed");
      navigate("/dashboard/data-connectors");
    } catch (err: any) {
      showError("Delete failed", err.message || "Could not delete connector");
    } finally {
      setIsDeleting(false);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner
          variant="modern"
          size="xl"
          color="primary"
          className="mb-4"
        />
        <p className={`${tw.textMuted} font-medium text-sm`}>
          Loading connector details...
        </p>
      </div>
    );
  }

  if (!connector) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Database
            className={`w-16 h-16 text-[${color.primary.accent}] mx-auto mb-4`}
          />
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            Connector Not Found
          </h3>
          <p className={`${tw.textMuted} mb-6`}>
            The data connector you are looking for does not exist.
          </p>
          <button
            onClick={() => navigate("/dashboard/data-connectors")}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 mx-auto text-sm`}
            style={{ backgroundColor: button.action.background }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Connectors
          </button>
        </div>
      </div>
    );
  }

  const ConnectorIcon = connector.iconComponent || Database;
  const connectorTypeLabel = getConnectorDisplayName(connector.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton
          fallbackTo="/dashboard/data-connectors"
          showBreadcrumb={true}
          currentLabel="Data Connector Details"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !connector.is_active}
            className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit border border-gray-300 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed`}
            title={
              connector.is_active
                ? "Test this connection"
                : "Connector must be active"
            }
          >
            {isTesting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isTesting ? "Testing..." : "Test Connection"}
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit`}
            style={{ backgroundColor: button.action.background }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={`${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit`}
            style={{
              backgroundColor: button.delete.background,
              color: button.delete.color,
              border: button.delete.border,
              padding: `${button.delete.paddingY} ${button.delete.paddingX}`,
              borderRadius: button.delete.borderRadius,
              fontSize: button.delete.fontSize,
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <div
            className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}
          >
            <div className="flex items-start space-x-4 mb-6">
              <div
                className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                style={{
                  backgroundColor: connector.colorClass || color.primary.accent,
                }}
              >
                <ConnectorIcon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className={`${tw.tableFirstColumn} ${tw.textPrimary} mb-2`}>
                  {connector.name}
                </h2>
                <p className={`${tw.textSecondary} text-sm leading-relaxed`}>
                  {connector.description || "No description available"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  connector.is_active
                    ? `bg-[${color.status.success}]/10 text-[${color.status.success}]`
                    : `bg-[${color.surface.cards}] text-[${color.text.primary}]`
                }`}
              >
                {connector.is_active ? "Active" : "Inactive"}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[${color.primary.accent}]/10 text-black`}
              >
                {connectorTypeLabel}
              </span>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`border ${tw.rounded} p-6 ${
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
                      testResult.success ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {testResult.success
                      ? "Connection Successful"
                      : "Test Failed"}
                  </h4>
                  <p
                    className={`text-sm mt-1 ${
                      testResult.success ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {testResult.message}
                  </p>
                  {testResult.response_time_ms && (
                    <p className="text-xs mt-2 text-gray-600">
                      Response time: {testResult.response_time_ms} ms
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Information */}
          <div
            className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Connector ID
                </label>
                <p className={`text-sm ${tw.textPrimary} font-mono`}>
                  {connector.id}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Type
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {connectorTypeLabel}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Status
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {connector.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Created By
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {connector.created_by || "System"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Connection Count
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {connector.connection_count ?? 0}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Last Connection Test
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {testResult
                    ? testResult.success
                      ? "Passed"
                      : "Failed"
                    : "Not tested yet"}
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Card */}
          <div
            className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Configuration
            </h3>
            <ConnectorConfigDisplay connector={connector} isEditMode={false} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div
            className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Timeline
            </h3>
            <div className="space-y-5">
              <div className="relative pl-6 border-l-2 border-gray-200">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gray-300"></div>
                <div className="space-y-1">
                  <p
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Created
                  </p>
                  <p className={`text-sm ${tw.textPrimary} font-semibold`}>
                    <DateFormatter
                      date={connector.created_at}
                      useLocale
                      year="numeric"
                      month="short"
                      day="numeric"
                    />
                  </p>
                  <p className={`text-xs ${tw.textMuted}`}>
                    <DateFormatter date={connector.created_at} includeTime />
                  </p>
                </div>
              </div>

              <div className="relative pl-6 border-l-2 border-gray-200">
                <div
                  className="absolute -left-2 top-0 w-4 h-4 rounded-full"
                  style={{ backgroundColor: color.primary.accent }}
                ></div>
                <div className="space-y-1">
                  <p
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Last Updated
                  </p>
                  <p className={`text-sm ${tw.textPrimary} font-semibold`}>
                    <DateFormatter
                      date={connector.updated_at}
                      useLocale
                      year="numeric"
                      month="short"
                      day="numeric"
                    />
                  </p>
                  <p className={`text-xs ${tw.textMuted}`}>
                    <DateFormatter date={connector.updated_at} includeTime />
                  </p>
                </div>
              </div>

              {connector.last_used && (
                <div className="relative pl-6 border-l-2 border-gray-200">
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gray-400"></div>
                  <div className="space-y-1">
                    <p
                      className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                    >
                      Last Used
                    </p>
                    <p className={`text-sm ${tw.textPrimary} font-semibold`}>
                      <DateFormatter
                        date={connector.last_used}
                        useLocale
                        year="numeric"
                        month="short"
                        day="numeric"
                      />
                    </p>
                    <p className={`text-xs ${tw.textMuted}`}>
                      <DateFormatter date={connector.last_used} includeTime />
                    </p>
                  </div>
                </div>
              )}
            </div>
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
        isLoading={isDeleting}
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
