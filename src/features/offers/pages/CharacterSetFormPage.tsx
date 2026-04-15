import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { characterSetService, CharacterSet } from "../../configurations/services/characterSetService";
import { MESSAGE_TYPE_OPTIONS, MessageTypeEnum } from "../../configurations/configs/ts/messageTypeEnum";
import { CHARACTER_SET_TYPE_OPTIONS, CharacterSetTypeEnum } from "../../configurations/configs/ts/characterSetTypeEnum";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import BackButton from "../../../shared/components/ui/BackButton";
import { tw, color, button } from "../../../shared/utils/utils";
import Checkbox from "../../../shared/components/ui/Checkbox";

export default function CharacterSetFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [messageType, setMessageType] = useState("SMS");
  const [characterSetType, setCharacterSetType] = useState("");
  const [characterSetSize, setCharacterSetSize] = useState("");
  const [standardChars, setStandardChars] = useState("");
  const [doubleChars, setDoubleChars] = useState("");
  const [tripleChars, setTripleChars] = useState("");
  const [quadChars, setQuadChars] = useState("");

  // Load existing character set if editing
  useEffect(() => {
    if (id) {
      const loadCharacterSet = async () => {
        try {
          const data = await characterSetService.getCharacterSetById(parseInt(id));
          setName(data.name);
          setDescription(data.description || "");
          setIsActive(data.is_active ?? true);
          setMessageType(data.message_type || "SMS");
          setCharacterSetType(data.character_set_type || "");
          setCharacterSetSize(String(data.character_set_size || ""));
          setStandardChars(data.standard_chars || "");
          setDoubleChars(data.double_chars || "");
          setTripleChars(data.triple_chars || "");
          setQuadChars(data.quad_chars || "");
        } catch (err) {
          showError("Error", "Failed to load character set");
          navigate("/dashboard/character-sets");
        } finally {
          setLoading(false);
        }
      };
      loadCharacterSet();
    } else {
      setLoading(false);
    }
  }, [id, navigate, showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError("Error", "Name is required");
      return;
    }
    if (!standardChars.trim()) {
      showError("Error", "Standard characters are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        description,
        is_active: isActive,
        message_type: messageType,
        character_set_type: characterSetType,
        character_set_size: parseInt(characterSetSize) || 160,
        standard_chars: standardChars,
        double_chars: doubleChars,
        triple_chars: tripleChars,
        quad_chars: quadChars,
      };

      if (id) {
        await characterSetService.updateCharacterSet(parseInt(id), payload);
        showSuccess("Character Set", "Updated successfully");
      } else {
        await characterSetService.createCharacterSet(payload);
        showSuccess("Character Set", "Created successfully");
      }
      navigate("/dashboard/character-sets");
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <BackButton fallbackTo="/dashboard/character-sets" showBreadcrumb={true} currentLabel={id ? "Edit Character Set" : "Create Character Set"} />

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">
          {id ? "Edit Character Set" : "Create Character Set"}
        </h2>

        {/* Basic Info */}
        <div className="space-y-3 pb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., GSM Default"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe this character set"
            />
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-3 pb-4">
          <h3 className="text-sm font-semibold text-gray-900">Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Type *
              </label>
              <HeadlessSelect
                value={messageType}
                onChange={(value) => setMessageType(String(value || ""))}
                options={MESSAGE_TYPE_OPTIONS}
                placeholder="Select message type"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Character Set Type *
              </label>
              <HeadlessSelect
                value={characterSetType}
                onChange={(value) => setCharacterSetType(String(value || ""))}
                options={CHARACTER_SET_TYPE_OPTIONS}
                placeholder="Select character set type"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Character Set Size
            </label>
            <input
              type="number"
              value={characterSetSize}
              onChange={(e) => setCharacterSetSize(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 160"
            />
          </div>
        </div>

        {/* Characters */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Character Strings</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Standard Characters *
            </label>
            <textarea
              value={standardChars}
              onChange={(e) => setStandardChars(e.target.value)}
              rows={3}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
              placeholder="e.g., ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Double Characters (optional)
            </label>
            <textarea
              value={doubleChars}
              onChange={(e) => setDoubleChars(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
              placeholder="Characters that take 2 positions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Triple Characters (optional)
            </label>
            <textarea
              value={tripleChars}
              onChange={(e) => setTripleChars(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
              placeholder="Characters that take 3 positions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quad Characters (optional)
            </label>
            <textarea
              value={quadChars}
              onChange={(e) => setQuadChars(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
              placeholder="Characters that take 4 positions"
            />
          </div>
        </div>

        {/* Active Status */}
        <div
          className="flex items-center gap-2 pt-4 pb-2 cursor-pointer"
          onClick={() => setIsActive(!isActive)}
        >
          <Checkbox
            id="isActive"
            checked={isActive}
            onChange={() => setIsActive(!isActive)}
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard/character-sets")}
            style={{
              background: button.bordered.background,
              color: button.bordered.color,
              border: button.bordered.border,
              paddingTop: button.bordered.paddingY,
              paddingBottom: button.bordered.paddingY,
              paddingLeft: button.bordered.paddingX,
              paddingRight: button.bordered.paddingX,
              borderRadius: button.bordered.borderRadius,
              fontSize: button.bordered.fontSize,
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "rgba(37, 40, 41, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                button.bordered.background;
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: button.action.background,
              color: button.action.color,
              border: button.action.border,
              paddingTop: button.action.paddingY,
              paddingBottom: button.action.paddingY,
              paddingLeft: button.action.paddingX,
              paddingRight: button.action.paddingX,
              borderRadius: button.action.borderRadius,
              fontSize: button.action.fontSize,
              fontWeight: "500",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: saving ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.opacity = "0.9";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = saving ? "0.5" : "1";
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
