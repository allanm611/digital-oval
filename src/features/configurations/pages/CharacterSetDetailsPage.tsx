import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { characterSetService, CharacterSet } from "../services/characterSetService";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw } from "../../../shared/utils/utils";

export default function CharacterSetDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();
  const [characterSet, setCharacterSet] = useState<CharacterSet | null>(null);
  const [loading, setLoading] = useState(true);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteCharacterSet } = useDeleteConfirm({
    onDelete: async (charSetId) => {
      await characterSetService.deleteCharacterSet(typeof charSetId === "string" ? Number(charSetId) : charSetId);
      showSuccess(t("messages.success"), t("characterSets.deleteSuccess"));
      navigate("/dashboard/character-sets");
    },
    itemLabel: "Character Set",
  });

  useEffect(() => {
    loadCharacterSet();
  }, [id]);

  const loadCharacterSet = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await characterSetService.getCharacterSetById(Number(id));
      setCharacterSet(data);
    } catch (err) {
      showError(t("messages.error"), t("characterSets.loadError"));
      navigate("/dashboard/character-sets");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (characterSet) {
      openDeleteConfirm(characterSet.id, characterSet.name);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!characterSet) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton fallbackTo="/dashboard/character-sets" />
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
              {characterSet.name}
            </h1>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              {characterSet.description}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/dashboard/character-sets/${id}/edit`)}
            className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="h-4 w-4 mr-2" />
            {t("common.edit")}
          </button>
          <button
            onClick={handleDeleteClick}
            className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
            style={{ backgroundColor: "#DC2626" }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("common.delete")}
          </button>
        </div>
      </div>

      <div className={`bg-white ${tw.rounded} border`} style={{ borderColor: color.border.default }}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className={`text-xs font-medium ${tw.textSecondary} mb-2`}>
                {t("characterSets.messageType")}
              </p>
              <p className={`text-sm font-semibold ${tw.textPrimary}`}>
                {characterSet.message_type}
              </p>
            </div>
            <div>
              <p className={`text-xs font-medium ${tw.textSecondary} mb-2`}>
                {t("characterSets.characterSetType")}
              </p>
              <p className={`text-sm font-semibold ${tw.textPrimary}`}>
                {characterSet.character_set_type}
              </p>
            </div>
            <div>
              <p className={`text-xs font-medium ${tw.textSecondary} mb-2`}>
                {t("characterSets.characterSetSize")}
              </p>
              <p className={`text-sm font-semibold ${tw.textPrimary}`}>
                {characterSet.character_set_size}
              </p>
            </div>
            <div>
              <p className={`text-xs font-medium ${tw.textSecondary} mb-2`}>
                {t("common.status")}
              </p>
              <p className={`text-sm font-semibold ${tw.textPrimary}`}>
                {characterSet.is_active ? t("common.active") : t("common.inactive")}
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              {t("characterSets.characterSets")}
            </h3>
            <div className="space-y-4">
              {characterSet.standard_chars && (
                <div>
                  <p className={`text-xs font-medium ${tw.textSecondary} mb-1`}>
                    {t("characterSets.standardCharacters")}
                  </p>
                  <p className={`text-sm ${tw.textPrimary} font-mono break-all`}>
                    {characterSet.standard_chars}
                  </p>
                </div>
              )}
              {characterSet.double_chars && (
                <div>
                  <p className={`text-xs font-medium ${tw.textSecondary} mb-1`}>
                    {t("characterSets.doubleCharacters")}
                  </p>
                  <p className={`text-sm ${tw.textPrimary} font-mono break-all`}>
                    {characterSet.double_chars}
                  </p>
                </div>
              )}
              {characterSet.triple_chars && (
                <div>
                  <p className={`text-xs font-medium ${tw.textSecondary} mb-1`}>
                    {t("characterSets.tripleCharacters")}
                  </p>
                  <p className={`text-sm ${tw.textPrimary} font-mono break-all`}>
                    {characterSet.triple_chars}
                  </p>
                </div>
              )}
              {characterSet.quad_chars && (
                <div>
                  <p className={`text-xs font-medium ${tw.textSecondary} mb-1`}>
                    {t("characterSets.quadCharacters")}
                  </p>
                  <p className={`text-sm ${tw.textPrimary} font-mono break-all`}>
                    {characterSet.quad_chars}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className={`text-xs font-medium ${tw.textSecondary} mb-1`}>
                  {t("common.createdAt")}
                </p>
                <p className={tw.textPrimary}>
                  {new Date(characterSet.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className={`text-xs font-medium ${tw.textSecondary} mb-1`}>
                  {t("common.updatedAt")}
                </p>
                <p className={tw.textPrimary}>
                  {new Date(characterSet.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDeleteCharacterSet}
        title={t("characterSets.deleteTitle") || "Delete Character Set"}
        description={t("characterSets.deleteDescription") || "This action cannot be undone."}
        itemName={deleteConfirm.itemName}
        isLoading={isDeleting}
      />
    </div>
  );
}
