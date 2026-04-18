import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, MessageSquare, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import SearchInput from "../../../shared/components/ui/SearchInput";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import CreateButton from "../../../shared/components/ui/CreateButton";
import OfferCreativeFormModal from "../components/OfferCreativeFormModal";
import { offerCreativeService } from "../services/offerCreativeService";
import { OfferCreative } from "../types/offerCreative";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function OfferCreativesPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [creatives, setCreatives] = useState<OfferCreative[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<OfferCreative | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [isTogglingActive, setIsTogglingActive] = useState<number | null>(null);

  useEffect(() => {
    loadCreatives();
  }, []);

  const loadCreatives = async () => {
    try {
      setLoading(true);
      const response = await offerCreativeService.superSearch({ limit: 100 });
      setCreatives(response?.data || []);
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Failed to load offer creatives");
      setCreatives([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCreatives = creatives.filter(
    (creative) =>
      creative.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creative.channel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedCreative(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleEdit = (creative: OfferCreative) => {
    setSelectedCreative(creative);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleModalSave = async (creativeData: any) => {
    try {
      if (modalMode === "create") {
        await offerCreativeService.create(creativeData);
      } else if (selectedCreative) {
        await offerCreativeService.update(selectedCreative.id, creativeData);
      }
      await loadCreatives();
    } catch (err) {
      throw err;
    }
  };

  const handleToggleActive = async (e: React.MouseEvent, creative: OfferCreative) => {
    e.stopPropagation();
    try {
      setIsTogglingActive(creative.id);
      if (creative.is_active) {
        await offerCreativeService.deactivate(creative.id);
      } else {
        await offerCreativeService.activate(creative.id);
      }
      await loadCreatives();
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsTogglingActive(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, creative: OfferCreative) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: "Delete Creative",
      message: `Are you sure you want to delete "${creative.title}"?`,
      confirmText: "Delete",
      isDangerous: true,
    });

    if (!confirmed) return;

    try {
      await offerCreativeService.delete(creative.id);
      success("Success", "Creative deleted successfully");
      await loadCreatives();
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Failed to delete creative");
    }
  };

  return (
    <div className="space-y-6">
      <BackButton fallbackTo="/dashboard/configuration" showBreadcrumb currentLabel="Offer Creatives" />

      {/* Description and Create Button */}
      <div className="flex items-start justify-between gap-4">
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage reusable creatives across different channels and locales
        </p>
        <CreateButton onClick={handleCreate} />
      </div>

      {/* Search */}
      <div className="my-5">
        <SearchInput
          placeholder="Search offer creatives..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      {/* Table */}
      <div
        className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
      >
        {loading ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <LoadingSpinner size="lg" variant="default" />
            </div>
            <p className={`${tw.textMuted}`}>Loading offer creatives...</p>
          </div>
        ) : filteredCreatives.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {searchTerm && (
              <p className={`${tw.textMuted} mb-6`}>
                No offer creatives found. Try adjusting your search terms.
              </p>
            )}
            {!searchTerm && (
              <>
                <p className={`${tw.textMuted} mb-6`}>
                  Create your first offer creative to get started.
                </p>
                <CreateButton onClick={handleCreate} />
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[720px]"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopLeftRadius: "0.375rem",
                    }}
                  >
                    Title
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Channel
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Locale
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCreatives.map((creative) => (
                  <tr
                    key={creative.id}
                    className="cursor-pointer transition-colors"
                    onClick={() => handleEdit(creative)}
                  >
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className={`${tw.tableFirstColumn} ${tw.textPrimary}`}>
                        {creative.title}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                      }}
                    >
                      <div className={`text-sm ${tw.textPrimary}`}>{creative.channel}</div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                      }}
                    >
                      <div className={`text-sm ${tw.textPrimary}`}>{creative.locale}</div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                      }}
                    >
                      <button
                        onClick={(e) => handleToggleActive(e, creative)}
                        disabled={isTogglingActive === creative.id}
                        className={`text-sm font-medium transition-colors disabled:opacity-50 ${
                          creative.is_active
                            ? tw.textSuccess
                            : tw.textSecondary
                        }`}
                      >
                        {creative.is_active ? t.genericConfig.active : t.genericConfig.inactive}
                      </button>
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/offer-creatives/${creative.id}`);
                          }}
                          className={`${tw.textAction} hover:opacity-75 transition-opacity`}
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(creative);
                          }}
                          className={`${tw.textAction} hover:opacity-75 transition-opacity`}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, creative)}
                          className="text-red-600 hover:opacity-75 transition-opacity"
                          title="Delete"
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
        )}
      </div>

      {/* Modal */}
      <OfferCreativeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        initialCreative={selectedCreative}
        mode={modalMode}
      />
    </div>
  );
}
