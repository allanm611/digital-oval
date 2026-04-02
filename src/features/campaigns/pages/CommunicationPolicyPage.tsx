import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { color, tw, components, helpers } from "../../../shared/utils/utils";
import {
  CommunicationPolicyConfiguration,
  CreateCommunicationPolicyRequest,
  COMMUNICATION_CHANNELS,
  TimeWindowConfig,
  MaximumCommunicationConfig,
  DNDConfig,
  VIPListConfig,
} from "../types/communicationPolicyConfig";
import CommunicationPolicyModal from "../components/CommunicationPolicyModal";
import { communicationPolicyService } from "../services/communicationPolicyService";

export default function CommunicationPolicyPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [policyToDelete, setPolicyToDelete] =
    useState<CommunicationPolicyConfiguration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [policies, setPolicies] = useState<CommunicationPolicyConfiguration[]>(
    []
  );
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<
    CommunicationPolicyConfiguration | undefined
  >();
  const [isSaving, setIsSaving] = useState(false);

  // Load policies from service and subscribe to changes
  useEffect(() => {
    // Load initial policies
    setPolicies(communicationPolicyService.getAllPolicies());

    // Subscribe to policy changes
    const unsubscribe = communicationPolicyService.subscribe(
      (updatedPolicies) => {
        setPolicies(updatedPolicies);
      }
    );

    return unsubscribe;
  }, []);

  const handleCreatePolicy = () => {
    setEditingPolicy(undefined);
    setIsModalOpen(true);
  };

  const handleEditPolicy = (policy: CommunicationPolicyConfiguration) => {
    setEditingPolicy(policy);
    setIsModalOpen(true);
  };

  const handleDeletePolicy = (policy: CommunicationPolicyConfiguration) => {
    setPolicyToDelete(policy);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!policyToDelete) return;

    setIsDeleting(true);
    try {
      const success = communicationPolicyService.deletePolicy(
        policyToDelete.id
      );
      if (success) {
        showToast(t.communicationPolicy.deleteSuccess);
        setShowDeleteModal(false);
        setPolicyToDelete(null);
      } else {
        showError(t.communicationPolicy.policyNotFound);
      }
    } catch (err) {
      console.error("Failed to delete policy:", err);
      showError(t.communicationPolicy.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPolicyToDelete(null);
  };

  const handlePolicySaved = async (
    policyData: CreateCommunicationPolicyRequest
  ) => {
    try {
      setIsSaving(true);
      if (editingPolicy) {
        // Update existing policy
        const updatedPolicy = communicationPolicyService.updatePolicy(
          editingPolicy.id,
          policyData
        );
        if (updatedPolicy) {
          showToast(t.communicationPolicy.updateSuccess);
        } else {
          showError(t.communicationPolicy.policyNotFound);
          return;
        }
      } else {
        // Create new policy
        communicationPolicyService.createPolicy(policyData);
        showToast(t.communicationPolicy.createSuccess);
      }
      setIsModalOpen(false);
      setEditingPolicy(undefined);
    } catch (err) {
      console.error("Failed to save policy:", err);
      showError(
        t.communicationPolicy.saveFailed,
        t.communicationPolicy.saveFailed
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getChannelsDisplay = (channelValues: string[]) => {
    if (!channelValues || channelValues.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-2">
        {channelValues.map((channelValue) => {
          const channel = COMMUNICATION_CHANNELS.find(
            (ch) => ch.value === channelValue
          );
          if (!channel) return null;

          return (
            <div
              key={channelValue}
              className={`flex items-center px-2 py-1 rounded ${tw.accent10}`}
            >
              <span className={`${tw.caption} font-medium ${tw.textPrimary}`}>
                {channel.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const getComprehensiveConfigSummary = (
    policy: CommunicationPolicyConfiguration
  ) => {
    // For now, we show the current single config, but this should be updated
    // when backend supports multiple configs per policy
    const summaryParts = [];

    switch (policy.type) {
      case "timeWindow": {
        const timeConfig = policy.config as TimeWindowConfig;
        summaryParts.push(`${timeConfig.startTime}-${timeConfig.endTime}`);
        break;
      }
      case "maximumCommunication": {
        const maxConfig = policy.config as MaximumCommunicationConfig;
        summaryParts.push(`Max ${maxConfig.maxCount}/${maxConfig.type}`);
        break;
      }
      case "dnd": {
        const dndConfig = policy.config as DNDConfig;
        summaryParts.push(`${dndConfig.categories.length} categories`);
        break;
      }
      case "vipList": {
        const vipConfig = policy.config as VIPListConfig;
        summaryParts.push(`${vipConfig.action} (P:${vipConfig.priority})`);
        break;
      }
    }

    // Add placeholder for other types to show this is a comprehensive policy
    summaryParts.push("+ 3 more types configured");

    return summaryParts.join(" • ");
  };

  const filteredPolicies = (policies || []).filter(
    (policy) =>
      policy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (policy?.description &&
        policy.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BackButton fallbackTo="/dashboard/configuration" showBreadcrumb={true} currentLabel={t.communicationPolicy.title} />

      {/* Description and Create Button */}
      <div className="flex items-start justify-between gap-4">
        <p className={`text-sm ${tw.textSecondary}`}>
          Configure communication policies to control how and when messages are sent to customers. Define time windows, frequency limits, DND rules, and VIP list handling.
        </p>
        <button
          onClick={handleCreatePolicy}
          className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white w-auto`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="w-4 h-4" />
          {t.communicationPolicy.createPolicy}
        </button>
      </div>

      <div className={tw.surfaceBackground}>
        <div className="relative w-full">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${tw.textMuted}`}
          />
          <input
            type="text"
            placeholder={t.communicationPolicy.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${components.input.default} w-full pl-10 pr-4 py-3 ${tw.caption}`}
          />
        </div>
      </div>

      <div
        className={` ${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner
              variant="modern"
              size="xl"
              color="primary"
              className="mb-4"
            />
            <p className={`${tw.textMuted} font-medium text-sm`}>
              {t.communicationPolicy.loadingPolicies}
            </p>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="text-center py-12">
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm
                ? t.communicationPolicy.noPoliciesFound
                : t.communicationPolicy.createFirstPolicy}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreatePolicy}
                className={`${tw.button} flex items-center gap-2 mx-auto`}
              >
                <Plus className="w-4 h-4" />
                {t.communicationPolicy.createPolicy}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table
                className="w-full min-w-[720px]"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
                <thead style={{ background: color.surface.tableHeader }}>
                  <tr>
                    <th
                      className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider`}
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.communicationPolicy.policy}
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider`}
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.communicationPolicy.channels}
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell`}
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.communicationPolicy.type}
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider`}
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.communicationPolicy.status}
                    </th>
                    <th
                      className={`px-6 py-4 text-right text-xs font-medium uppercase tracking-wider`}
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.communicationPolicy.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPolicies.map((policy) => (
                    <tr key={policy.id} className="transition-colors">
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div>
                          <div
                            className={`font-semibold text-sm sm:text-base ${tw.textPrimary} truncate`}
                            title={policy.name}
                          >
                            {policy.name}
                          </div>
                          <div
                            className={`text-xs sm:text-sm ${tw.textMuted} truncate mt-1`}
                            title={
                              policy.description ||
                              t.communicationPolicy.noDescription
                            }
                          >
                            {policy.description ||
                              t.communicationPolicy.noDescription}
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {getChannelsDisplay(policy.channels)}
                      </td>
                      <td
                        className={`px-6 py-4 hidden md:table-cell`}
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div
                          className={`text-xs sm:text-sm ${tw.textSecondary} truncate max-w-xs`}
                          title={getComprehensiveConfigSummary(policy)}
                        >
                          {getComprehensiveConfigSummary(policy)}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span
                          className={
                            policy.isActive
                              ? helpers.badge("success")
                              : helpers.badge("info")
                          }
                        >
                          {policy.isActive
                            ? t.communicationPolicy.active
                            : t.communicationPolicy.inactive}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-right text-sm font-medium"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditPolicy(policy)}
                            className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
                            style={{ color: color.primary.action }}
                            title={t.communicationPolicy.edit}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePolicy(policy)}
                            className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-all duration-200`}
                            title={t.communicationPolicy.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Keep for very small screens if needed */}
            <div className="hidden">
              {filteredPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="p-4 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`${tw.tableFirstColumn} text-gray-900`}>
                          {policy.name}
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            policy.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {policy.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="mb-2">
                        {getChannelsDisplay(policy.channels)}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {policy.description || "No description"}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        <span className="font-medium">All Policy Types:</span>{" "}
                        {getComprehensiveConfigSummary(policy)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditPolicy(policy)}
                        className={`p-2 text-[#588157] hover:text-[#3A5A40] hover:bg-[#588157]/10 ${tw.rounded} transition-colors`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePolicy(policy)}
                        className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <CommunicationPolicyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPolicy(undefined);
        }}
        policy={editingPolicy}
        onSave={handlePolicySaved}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={t.communicationPolicy.deleteConfirmTitle}
        description={t.communicationPolicy.deleteConfirmMessage}
        itemName={policyToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText={t.communicationPolicy.deletePolicy}
        cancelText={t.common.cancel}
      />
    </div>
  );
}
