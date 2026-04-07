import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { creativeTemplateService } from "../../configurations/services/creativeTemplateService";
import { useToast } from "../../../contexts/ToastContext";
import { tw, color, button } from "../../../shared/utils/utils";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import type { CreativeTemplate } from "../../configurations/services/creativeTemplateService";

export default function CreativeTemplateDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success } = useToast();

  const [template, setTemplate] = useState<CreativeTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTemplate = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await creativeTemplateService.getCreativeTemplateById(
        parseInt(id),
      );

      setTemplate(data);
    } catch (err) {
      console.error("Failed to load creative template:", err);
      showError(
        "Failed to load creative template",
        err instanceof Error ? err.message : "Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showError]);

  useEffect(() => {
    if (id) {
      loadTemplate();
    }
  }, [id, loadTemplate]);

  const confirmDelete = async () => {
    if (!template) return;

    try {
      setIsDeleting(true);
      await creativeTemplateService.deleteCreativeTemplate(template.id);
      success("Deleted", "Creative template removed");
      navigate("/dashboard/creative-templates");
    } catch (err: any) {
      showError("Delete failed", err.message || "Could not delete template");
    } finally {
      setIsDeleting(false);
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
          Loading template details...
        </p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            Template Not Found
          </h3>
          <p className={`${tw.textMuted} mb-6`}>
            The creative template you are looking for does not exist.
          </p>
          <button
            onClick={() => navigate("/dashboard/creative-templates")}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 mx-auto text-sm`}
            style={{ backgroundColor: button.action.background }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <BackButton
          fallbackTo="/dashboard/creative-templates"
          showBreadcrumb={true}
          currentLabel="Creative Template Details"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/dashboard/creative-templates/${template.id}/edit`)}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overview */}
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
              {template.name}
            </h2>
            <p className={`text-sm ${tw.textMuted} mb-4`}>
              {template.description || "No description provided"}
            </p>
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  template.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {template.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Configuration */}
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
              Template Content
            </h3>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Code
                </label>
                <p className={`text-sm ${tw.textPrimary} font-mono`}>
                  {template.code}
                </p>
              </div>

              {template.title && (
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Title
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>{template.title}</p>
                </div>
              )}

              {template.body_text && (
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Body Text
                  </label>
                  <p className={`text-sm ${tw.textPrimary} whitespace-pre-wrap`}>
                    {template.body_text}
                  </p>
                </div>
              )}

              {template.body_html && (
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Body HTML
                  </label>
                  <pre className={`text-xs ${tw.textPrimary} overflow-x-auto`}>
                    {template.body_html}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
              Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Channel
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {template.channel}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Locale
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {template.locale || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Timeline */}
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="relative pl-6 border-l-2 border-gray-200">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gray-300"></div>
                <div className="space-y-1">
                  <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Created
                  </p>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {template.created_at
                      ? new Date(template.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="relative pl-6 border-l-2 border-gray-200">
                <div
                  className="absolute -left-2 top-0 w-4 h-4 rounded-full"
                  style={{ backgroundColor: color.primary.accent }}
                ></div>
                <div className="space-y-1">
                  <p className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Last Updated
                  </p>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {template.updated_at
                      ? new Date(template.updated_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Creative Template"
        description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
        itemName={template.name}
        isLoading={isDeleting}
        confirmText="Delete Template"
        cancelText="Cancel"
        variant="warning"
        onConfirm={confirmDelete}
      />

    </div>
  );
}
