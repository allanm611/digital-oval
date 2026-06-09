import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { characterSetService } from "../../configurations/services/characterSetService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { tw, color, button } from "../../../shared/utils/utils";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import type { CharacterSet } from "../../configurations/types/characterSetType";
import DateFormatter from "../../../shared/components/DateFormatter";

export default function CharacterSetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError, success } = useToast();

  const [characterSet, setCharacterSet] = useState<CharacterSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCharacterSet = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await characterSetService.getCharacterSetById(parseInt(id));

      if (!data) {
        showError("Not Found", "Character set not found");
        navigate("/dashboard/character-sets");
        return;
      }

      setCharacterSet(data);
    } catch (err) {
      console.error("Failed to load character set:", err);
      showError("Failed to load character set", extractBackendError(error, "Failed to load character set. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showError]);

  useEffect(() => {
    if (id) {
      loadCharacterSet();
    }
  }, [id, loadCharacterSet]);

  const confirmDelete = async () => {
    if (!characterSet) return;

    try {
      setIsDeleting(true);
      await characterSetService.deleteCharacterSet(characterSet.id);
      success("Deleted", "Character set removed");
      navigate("/dashboard/character-sets");
    } catch (err: any) {
      showError("Delete failed", extractBackendError(error, "Delete failed. Please try again."));
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
          Loading character set details...
        </p>
      </div>
    );
  }

  if (!characterSet) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            Character Set Not Found
          </h3>
          <p className={`${tw.textMuted} mb-6`}>
            The character set you are looking for does not exist.
          </p>
          <button
            onClick={() => navigate("/dashboard/character-sets")}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 mx-auto text-sm`}
            style={{ backgroundColor: button.action.background }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Character Sets
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
         
          showBreadcrumb={true}
          currentLabel="Character Set Details"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/dashboard/character-sets/${characterSet.id}/edit`)}
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
              {characterSet.name}
            </h2>
            <p className={`text-sm ${tw.textMuted} mb-4`}>
              {characterSet.description || "No description provided"}
            </p>
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  characterSet.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {characterSet.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}>
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
              Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Message Type
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {characterSet.message_type}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Character Set Type
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {characterSet.character_set_type}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Character Set Size
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {characterSet.character_set_size}
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                  Standard Characters
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {characterSet.standard_chars || "N/A"}
                </p>
              </div>
              {characterSet.double_chars && (
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Double Characters
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {characterSet.double_chars}
                  </p>
                </div>
              )}
              {characterSet.triple_chars && (
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Triple Characters
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {characterSet.triple_chars}
                  </p>
                </div>
              )}
              {characterSet.quad_chars && (
                <div className="space-y-1">
                  <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                    Quad Characters
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {characterSet.quad_chars}
                  </p>
                </div>
              )}
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
                    {characterSet.created_at
                      ? <DateFormatter date={characterSet.created_at} useUserTimezone includeTime />
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
                    {characterSet.updated_at
                      ? <DateFormatter date={characterSet.updated_at} useUserTimezone includeTime />
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
        title="Delete Character Set"
        description={`Are you sure you want to delete "${characterSet.name}"? This action cannot be undone.`}
        itemName={characterSet.name}
        isLoading={isDeleting}
        confirmText="Delete Character Set"
        cancelText="Cancel"
        variant="warning"
        onConfirm={confirmDelete}
      />

    </div>
  );
}
