import { useState, useEffect } from "react";
import Input from '../../../shared/components/ui/Input';
import Textarea from '../../../shared/components/ui/Textarea';
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
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
          showError("Error", extractBackendError(err, "Error. Please try again."));
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
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <BackButton showBreadcrumb={true} currentLabel={id ? "Edit Character Set" : "Create Character Set"} />

      <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-lg p-6 border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">
          {id ? "Edit Character Set" : "Create Character Set"}
        </h2>

        {/* Basic Info */}
        <div className="space-y-6">
          <Input
            type="text"
            label="Name"
            value={name}
            onChange={(value) => setName(String(value))}
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(value) => setDescription(value)}
            rows={2}
          />
        </div>

        {/* Configuration */}
        <div className="space-y-3 pb-4">
          <h3 className="text-sm font-semibold text-gray-900">Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <HeadlessSelect
                label="Message Type *"
                value={messageType}
                onChange={(value) => setMessageType(String(value || ""))}
                options={MESSAGE_TYPE_OPTIONS}
                placeholder="Select message type"
              />
            </div>

            <div>
              <HeadlessSelect
                label="Character Set Type *"
                value={characterSetType}
                onChange={(value) => setCharacterSetType(String(value || ""))}
                options={CHARACTER_SET_TYPE_OPTIONS}
                placeholder="Select character set type"
              />
            </div>
          </div>

          <Input
            type="number"
            label="Character Set Size"
            value={characterSetSize}
            onChange={(value) => setCharacterSetSize(String(value))}
          />
        </div>

        {/* Characters */}
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-gray-900">Character Strings</h3>

          <Textarea
            label="Standard Characters"
            value={standardChars}
            onChange={(value) => setStandardChars(value)}
            rows={3}
            required
            className="font-mono"
          />

          <Textarea
            label="Double Characters (optional)"
            value={doubleChars}
            onChange={(value) => setDoubleChars(value)}
            rows={2}
            className="font-mono"
          />

          <Textarea
            label="Triple Characters (optional)"
            value={tripleChars}
            onChange={(value) => setTripleChars(value)}
            rows={2}
            className="font-mono"
          />

          <Textarea
            label="Quad Characters (optional)"
            value={quadChars}
            onChange={(value) => setQuadChars(value)}
            rows={2}
            className="font-mono"
          />
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
            {saving ? (id ? "Updating..." : "Creating...") : (id ? "Update" : "Create")}
          </button>
        </div>
      </form>
    </div>
  );
}
