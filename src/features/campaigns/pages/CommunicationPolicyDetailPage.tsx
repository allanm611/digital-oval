import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, ShieldCheck, Power, PowerOff } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import DateFormatter from "../../../shared/components/DateFormatter";
import { color, tw, button as buttonStyle } from "../../../shared/utils/utils";
import {
  CommunicationPolicyConfiguration,
  CreateCommunicationPolicyRequest,
  TimeWindowConfig,
  MaximumCommunicationConfig,
  DNDConfig,
  VIPListConfig,
} from "../types/communicationPolicyConfig";
import CommunicationPolicyModal from "../components/CommunicationPolicyModal";
import { communicationPolicyService } from "../services/communicationPolicyService";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

export default function CommunicationPolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const [policy, setPolicy] = useState<CommunicationPolicyConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const loadPolicy = useCallback(async () => {
    setLoading(true);
    try {
      const data = await communicationPolicyService.getAllPolicies();
      const found = data.find((p) => p.id === Number(id));
      setPolicy(found || null);
    } catch (err) {
      showError("Unable to Load Policy", extractBackendError(err, "Failed to load policy. Please try again later."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  const handleToggleActive = async () => {
    if (!policy) return;
    const newActive = !policy.is_active;
    setIsToggling(true);
    setPolicy((prev) => prev ? { ...prev, is_active: newActive } : prev);
    try {
      await communicationPolicyService.updatePolicy(policy.id, { is_active: newActive } as any);
      showToast(newActive ? "Activated" : "Deactivated", `${policy.name} has been ${newActive ? "activated" : "deactivated"}`);
    } catch (err) {
      showError("Unable to Update Policy", extractBackendError(err, "Failed to update policy status. Please try again later."));
      setPolicy((prev) => prev ? { ...prev, is_active: !newActive } : prev);
    } finally {
      setIsToggling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!policy) return;
    setIsDeleting(true);
    try {
      await communicationPolicyService.deletePolicy(policy.id);
      showToast(t.communicationPolicy.deleteSuccess);
      navigate("/dashboard/campaign-communication-policy");
    } catch (err) {
      showError("Unable to Delete Policy", extractBackendError(err, "Failed to delete policy. Please try again later."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePolicySaved = async (policyData: CreateCommunicationPolicyRequest) => {
    if (!policy) return;
    try {
      setIsSaving(true);
      await communicationPolicyService.updatePolicy(policy.id, policyData);
      showToast(t.communicationPolicy.updateSuccess);
      await loadPolicy();
      setIsModalOpen(false);
    } catch (err) {
      showError("Unable to Update Policy", extractBackendError(err, "Failed to update policy. Please try again later."));
    } finally {
      setIsSaving(false);
    }
  };

  const renderConfigDetails = () => {
    if (!policy) return null;
    switch (policy.type_code) {
      case "timeWindow": {
        const c = policy.config as TimeWindowConfig;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Start Time" value={c.startTime} />
            <Field label="End Time" value={c.endTime} />
            {c.timezone && <Field label="Timezone" value={c.timezone} />}
            {c.days && c.days.length > 0 && (
              <Field
                label="Days"
                value={c.days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}
              />
            )}
          </div>
        );
      }
      case "maximumCommunication": {
        const c = policy.config as MaximumCommunicationConfig;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Period" value={c.type} />
            <Field label="Max Count" value={String(c.maxCount)} />
            {c.resetTime && <Field label="Reset Time" value={c.resetTime} />}
            {c.resetDay && <Field label="Reset Day" value={c.resetDay} />}
          </div>
        );
      }
      case "dnd": {
        const c = policy.config as DNDConfig;
        if (!c.categories || c.categories.length === 0) {
          return <p className={`text-sm ${tw.textMuted}`}>No categories configured</p>;
        }
        return (
          <div className="space-y-3">
            {c.categories.map((cat, i) => (
              <div
                key={i}
                className="grid grid-cols-2 gap-4 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="space-y-1">
                  <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>Type</p>
                  <p className={`text-sm ${tw.textPrimary}`}>{cat.type}</p>
                </div>
                <div className="space-y-1">
                  <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>Value</p>
                  <p className={`text-sm ${tw.textPrimary}`}>{cat.value || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        );
      }
      case "vipList": {
        const c = policy.config as VIPListConfig;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Action" value={c.action} />
            {c.priority !== undefined && <Field label="Priority" value={String(c.priority)} />}
          </div>
        );
      }
      default:
        return <p className={`text-sm ${tw.textMuted}`}>No configuration details available</p>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner variant="modern" size="xl" color="primary" className="mb-4" />
        <p className={`${tw.textMuted} font-medium text-sm`}>Loading policy details...</p>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <ShieldCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>Policy Not Found</h3>
          <p className={`${tw.textMuted} mb-6`}>The policy you are looking for does not exist.</p>
          <button
            onClick={() => navigate("/dashboard/campaign-communication-policy")}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold text-sm flex items-center gap-2 mx-auto`}
            style={{ backgroundColor: buttonStyle.action.background }}
          >
            Back to Policies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <BackButton
         
          showBreadcrumb
          currentLabel="Policy Details"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleActive}
            disabled={isToggling}
            className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: buttonStyle.secondaryAction.background, color: "black" }}
            onMouseEnter={(e) => { if (!isToggling) (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            {isToggling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                {policy.is_active ? "Deactivating..." : "Activating..."}
              </>
            ) : policy.is_active ? (
              <>
                <PowerOff className="w-4 h-4" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="w-4 h-4" />
                Activate
              </>
            )}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm`}
            style={{ backgroundColor: buttonStyle.action.background }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            <Edit className="w-4 h-4" />
            Edit Policy
          </button>
          <button
            onClick={() => openDeleteConfirm(item?.id || 0, item?.name || "")}
            className={`${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm`}
            style={{
              backgroundColor: buttonStyle.delete.background,
              color: buttonStyle.delete.color,
              border: buttonStyle.delete.border,
              padding: `${buttonStyle.delete.paddingY} ${buttonStyle.delete.paddingX}`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <div className="flex items-start space-x-4 mb-6">
              <div
                className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                style={{ backgroundColor: color.primary.accent }}
              >
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className={`text-lg font-bold ${tw.textPrimary} mb-1`}>{policy.name}</h2>
                <p className={`${tw.textSecondary} text-sm leading-relaxed`}>
                  {policy.description || "No description available"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  policy.is_active
                    ? `bg-green-100 text-green-700`
                    : `bg-gray-100 text-gray-600`
                }`}
              >
                {policy.is_active ? "Active" : "Inactive"}
              </span>
              {(policy as any).type_name && (
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium`}
                  style={{ backgroundColor: `${color.primary.accent}15`, color: color.primary.accent }}
                >
                  {(policy as any).type_name}
                </span>
              )}
            </div>
          </div>

          {/* Policy Details */}
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>Policy Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Policy Type" value={(policy as any).type_name || policy.type_code} />
              <Field label="Status" value={policy.is_active ? "Active" : "Inactive"} />
              {(policy as any).type_description && (
                <div className="md:col-span-2 space-y-1">
                  <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>Type Description</p>
                  <p className={`text-sm ${tw.textPrimary}`}>{(policy as any).type_description}</p>
                </div>
              )}
              <div className="md:col-span-2 space-y-1">
                <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>Channels</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {policy.channels?.map((ch) => (
                    <span
                      key={ch}
                      className={`text-xs font-medium px-2.5 py-1 ${tw.rounded}`}
                      style={{ backgroundColor: `${color.primary.accent}15`, color: color.primary.accent }}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>Configuration</h3>
            {renderConfigDetails()}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>Timeline</h3>
            <div className="space-y-5">
              <div className="relative pl-6 border-l-2 border-gray-200">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gray-300" />
                <div className="space-y-1">
                  <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>Created</p>
                  <p className={`text-sm ${tw.textPrimary} font-semibold`}>
                    <DateFormatter date={policy.created_at} useLocale year="numeric" month="short" day="numeric" />
                  </p>
                  <p className={`text-xs ${tw.textMuted}`}>
                    <DateFormatter date={policy.created_at} includeTime />
                  </p>
                </div>
              </div>
              {policy.updated_at && (
                <div className="relative pl-6 border-l-2 border-gray-200">
                  <div
                    className="absolute -left-2 top-0 w-4 h-4 rounded-full"
                    style={{ backgroundColor: color.primary.accent }}
                  />
                  <div className="space-y-1">
                    <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>Last Updated</p>
                    <p className={`text-sm ${tw.textPrimary} font-semibold`}>
                      <DateFormatter date={policy.updated_at} useLocale year="numeric" month="short" day="numeric" />
                    </p>
                    <p className={`text-xs ${tw.textMuted}`}>
                      <DateFormatter date={policy.updated_at} includeTime />
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CommunicationPolicyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        policy={policy}
        onSave={handlePolicySaved}
        isSaving={isSaving}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => closeDeleteConfirm()}
        onConfirm={handleConfirmDelete}
        title={t.communicationPolicy.deleteConfirmTitle}
        description={t.communicationPolicy.deleteConfirmMessage}
        itemName={policy.name}
        isLoading={isDeleting}
        confirmText={t.communicationPolicy.deletePolicy}
        cancelText={t.common.cancel}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className={`text-xs font-medium text-gray-400 uppercase tracking-wide`}>{label}</p>
      <p className={`text-sm font-medium text-gray-900`}>{value}</p>
    </div>
  );
}
