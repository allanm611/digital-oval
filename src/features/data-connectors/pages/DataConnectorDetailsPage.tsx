import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Edit,
  Play,
  AlertTriangle,
  CheckCircle,
  Database,
  Plus,
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
import { connectionProfileService } from "../../connection-profiles/services/connectionProfileService";
import { ConnectionProfileType } from "../../connection-profiles/types/connectionProfile";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { tw, color, button } from "../../../shared/utils/utils";
import DataConnectorForm from "../components/DataConnectorForm";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import DateFormatter from "../../../shared/components/DateFormatter";
import { getConnectorDisplayName } from "../utils/connectorIcons";
import SelectConnectionProfileModal from "../components/SelectConnectionProfileModal";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

export default function DataConnectorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success } = useToast();

  const handleViewConnectionProfile = (profileId: number) => {
    navigate(`/dashboard/connection-profiles/${profileId}`);
  };

  const [connector, setConnector] = useState<ProcessedDataConnector | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [connectionProfiles, setConnectionProfiles] = useState<
    ConnectionProfileType[]
  >([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [testingProfileId, setTestingProfileId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<
    Record<number, ConnectionTestResult>
  >({});
  const [showSelectProfileModal, setShowSelectProfileModal] = useState(false);

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

      // Fetch the connection profile attached to this connector using its connection_profile_id
      setLoadingProfiles(true);
      try {
        if (data.connection_profile_id) {
          const profile = await connectionProfileService.getProfile(
            data.connection_profile_id,
            true
          );
          setConnectionProfiles([profile]);
        } else {
          setConnectionProfiles([]);
        }
      } catch (profileError) {
        console.error("Failed to fetch connection profile:", profileError);
        // Don't fail the whole page load if profile can't be fetched
        setConnectionProfiles([]);
      }
    } catch (err) {
      console.error("Failed to load data connector:", err);
      showError("Failed to load data connector", extractBackendError(error, "Failed to load data connector. Please try again."));
    } finally {
      setLoading(false);
      setLoadingProfiles(false);
    }
  }, [id, navigate, showError]);

  useEffect(() => {
    if (id) {
      loadConnector();
    }
  }, [id, loadConnector]);

  // const handleTestConnection = async () => {
  //   if (!connector) return;
  //
  //   try {
  //     setIsTesting(true);
  //     setTestResult(null);
  //
  //     const result = await dataConnectorService.testDataConnectorConnection(
  //       connector.id,
  //     );
  //     setTestResult(result);
  //
  //     if (result.success) {
  //       success("Connection OK", result.message);
  //     } else {
  //       showError("Connection failed", result.message);
  //     }
  //   } catch (err: any) {
  //     showError("Test failed", err.message || "Connection test error");
  //   } finally {
  //     setIsTesting(false);
  //   }
  // };

  const handleTestProfile = async (profileId: number) => {
    try {
      setTestingProfileId(profileId);

      const result = await connectionProfileService.testConnectionProfile(
        profileId,
      );

      setTestResults((prev) => ({ ...prev, [profileId]: result }));

      if (result.success) {
        success("Connection OK", result.message);
      } else {
        showError("Connection failed", result.message);
      }
    } catch (err: any) {
      const errorResult = {
        success: false,
        message: "Test failed",
        error_details: err.message || "Connection test error",
      };
      setTestResults((prev) => ({ ...prev, [profileId]: errorResult }));

      showError("Test failed", extractBackendError(err, "Test failed. Please try again."));
    } finally {
      setTestingProfileId(null);
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
      showError("Delete failed", extractBackendError(error, "Delete failed. Please try again."));
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
      setIsSavingForm(true);
      // Get connection_profile_id from form or from the first attached profile
      let profileId = formData.connection_profile_id;
      if (!profileId && connectionProfiles.length > 0) {
        profileId = connectionProfiles[0].id;
      }

      const payload: UpdateDataConnectorRequest = {
        name: formData.name.trim(),
        description: formData.description?.trim(),
        is_active: connector.is_active,
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
      showError("Save failed", extractBackendError(err, "Save failed. Please try again."));
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleSelectConnectionProfile = async (
    profile: ConnectionProfileType
  ) => {
    if (!connector) {
      showError("Error", "Connector not found");
      return;
    }

    if (!profile) {
      showError("Error", "Profile not selected");
      return;
    }

    try {
      const payload: UpdateDataConnectorRequest = {
        name: connector.name,
        description: connector.description,
        is_active: connector.is_active,
        connection_profile_id: profile.id,
      };

      const updated = await dataConnectorService.updateDataConnector(
        connector.id,
        payload,
      );

      if (!updated) {
        showError("Error", "Failed to update connector");
        return;
      }

      // Reload the attached connection profile
      const updatedProfile = await connectionProfileService.getProfile(
        profile.id,
        true
      );

      if (!updatedProfile) {
        showError("Error", "Failed to reload profile after attachment");
        return;
      }

      // Add to existing profiles instead of replacing
      setConnectionProfiles((prev) => {
        if (!prev) {
          return [updatedProfile];
        }

        const exists = prev.some((p) => p.id === profile.id);
        if (exists) {
          return prev;
        }

        return [...prev, updatedProfile];
      });

      const profileName = profile.profile_name || profile.name || "Unknown";
      success("Success", `Connected profile "${profileName}"`);
    } catch (err: any) {
      showError(
        "Failed to connect profile",
        extractBackendError(err, "Could not link connection profile")
      );
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
      <div className="">
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
    <div className="">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-8">
        <BackButton

          showBreadcrumb={true}
          currentLabel="Data Connector Details"
        />
        <div className="flex flex-wrap items-center gap-2">
          {/*
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
          */}

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Overview Card */}
          <div
            className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] px-6 pt-6 pb-3 flex-shrink-0`}
          >
            <div className="flex items-start gap-2 mb-1">
              <div
                className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                style={{
                  backgroundColor: connector.colorClass || color.primary.accent,
                }}
              >
                <ConnectorIcon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
                  {connector.name}
                </h2>
                <p className={`${tw.textSecondary} text-sm leading-relaxed`}>
                  {connector.description || "No description available"}
                </p>
              </div>
            </div>
            <div className="pt-3 pb-0 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
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
                    Updated By
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {connector.updated_by || "—"}
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
                  {/*
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
                  */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="h-full">
          {/* Timeline */}
          <div
            className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6 h-full`}
          >
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
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

      {/* Connection Profiles - Full Width */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-semibold ${tw.textPrimary}`}>
            Connection Profiles
          </h3>
          <button
            onClick={() => setShowSelectProfileModal(true)}
            className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Connection Profile
          </button>
        </div>
        {loadingProfiles ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        ) : connectionProfiles.length > 0 ? (
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
                  ID
                </th>
                <th
                  className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider"
                  style={{ color: color.surface.tableHeaderText }}
                >
                  Name
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
                  Last Used
                </th>
                <th
                  className="px-6 py-4 text-center text-xs sm:text-sm font-medium uppercase tracking-wider"
                  style={{ color: color.surface.tableHeaderText }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {connectionProfiles.map((profile) => {
                const testResult = testResults[profile.id];
                return (
                  <React.Fragment key={profile.id}>
                    <tr
                      style={{ backgroundColor: color.surface.tablebodybg }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewConnectionProfile(profile.id)}
                          className="text-sm font-medium break-all hover:underline"
                          style={{ color: color.primary.accent }}
                          title="Click to view connection profile details"
                        >
                          {profile.id}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm font-medium ${tw.textPrimary}`}>
                          {(profile as any).profile_name || profile.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm ${tw.textPrimary}`}>
                          {(profile as any).connection_type || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${tw.textPrimary}`}>
                          {(profile as any).is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm ${tw.textPrimary}`}>
                          {(profile as any).last_used_at ? (
                            <DateFormatter date={(profile as any).last_used_at} useUserTimezone />
                          ) : (
                            "—"
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleTestProfile(profile.id)}
                            disabled={testingProfileId === profile.id}
                            className="px-4 py-2 text-white rounded font-semibold flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: button.action.background }}
                          >
                            {testingProfileId === profile.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                Testing...
                              </>
                            ) : (
                              "Test"
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8">
            <p className={`${tw.textMuted} text-sm`}>
              No connection profiles attached to this connector
            </p>
          </div>
        )}
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
        loading={isSavingForm}
      />

      {/* Select Connection Profile Modal */}
      <SelectConnectionProfileModal
        isOpen={showSelectProfileModal}
        onClose={() => setShowSelectProfileModal(false)}
        onSelect={handleSelectConnectionProfile}
        dataConnectorType={connector.type}
        currentProfileId={connectionProfiles[0]?.id}
      />
    </div>
  );
}
