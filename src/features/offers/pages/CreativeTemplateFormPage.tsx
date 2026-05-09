import { useEffect, useState } from "react";
import Input from '../../../shared/components/ui/Input';
import { useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import {
  creativeTemplateService,
  type ChannelEnum,
} from "../../configurations/services/creativeTemplateService";
import { languageService } from "../../configurations/services/languageService";
import { communicationChannelService } from "../../../shared/services/communicationChannelService";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { tw, button, color } from "../../../shared/utils/utils";

type LanguageOption = { value: string; label: string };

export default function CreativeTemplateFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState("");
  const [locale, setLocale] = useState("");
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [variablesText, setVariablesText] = useState("");

  const [languageOptions, setLanguageOptions] = useState<LanguageOption[]>([]);
  const [channelOptions, setChannelOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await languageService.getLanguages();
        const languages = Array.isArray(response)
          ? response
          : (response as any)?.data || [];

        const options = (languages || [])
          .filter((lang: any) => lang?.is_active ?? true)
          .map((lang: any) => ({
            value: String(lang.language_code || ""),
            label: `${lang.name} (${lang.language_code})`,
          }))
          .filter((opt: LanguageOption) => opt.value);

        setLanguageOptions(options);
      } catch {
        setLanguageOptions([]);
      }
    };

    loadLanguages();
  }, []);

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const channels = await communicationChannelService.getAll();
        const options = (channels || [])
          .filter((ch: any) => ch.is_active !== false)
          .map((ch: any) => ({
            label: ch.name,
            value: ch.name, // Use name as value
          }));
        setChannelOptions(options);
      } catch {
        setChannelOptions([]);
      }
    };

    loadChannels();
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const loadTemplate = async () => {
      try {
        const template = await creativeTemplateService.getCreativeTemplateById(
          parseInt(id, 10),
        );

        setName(template?.name || "");
        setDescription(template?.description || "");
        setCode(template?.code || "");
        setChannel(template?.channel || template?.primaryChannel || "");
        setLocale(template?.locale || "");
        setTitle(template?.title || "");
        setBodyText(template?.body_text || template?.text_body || "");
        setBodyHtml(template?.body_html || template?.html_body || "");
        setVariablesText(
          template?.variables ? JSON.stringify(template.variables, null, 2) : "",
        );
      } catch (err) {
        showError(
          "Error",
          err instanceof Error ? err.message : "Failed to load template",
        );
        navigate("/dashboard/creative-templates");
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [id, navigate, showError]);

  // For now, remove loading state when component mounts
  useEffect(() => {
    setLoading(false);
  }, []);

  // Map channel name to enum value for submission
  const mapChannelNameToEnum = (channelName: string): ChannelEnum => {
    const nameUpper = channelName.toUpperCase();
    if (nameUpper.includes("WHATSAPP")) return "WhatsApp" as ChannelEnum;
    if (nameUpper.includes("EMAIL")) return "Email" as ChannelEnum;
    if (nameUpper.includes("SMS")) return "SMS" as ChannelEnum;
    if (nameUpper.includes("PUSH")) return "Push" as ChannelEnum;
    if (nameUpper.includes("USSD")) return "USSD" as ChannelEnum;
    return channel as ChannelEnum;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !code.trim() || !channel) {
      showError("Validation", "Name, code, and channel are required");
      return;
    }

    let parsedVariables: Record<string, unknown> | undefined;
    if (variablesText.trim()) {
      try {
        parsedVariables = JSON.parse(variablesText);
      } catch {
        showError("Validation", "Variables must be valid JSON");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        code: code.trim(),
        primaryChannel: mapChannelNameToEnum(channel),
        locale: locale || undefined,
        title: title.trim() || undefined,
        text_body: bodyText.trim() || undefined,
        html_body: bodyHtml.trim() || undefined,
        variables: parsedVariables,
      };

      if (id) {
        await creativeTemplateService.updateCreativeTemplate(parseInt(id, 10), payload);
        showSuccess("Creative Template", "Updated successfully");
      } else {
        await creativeTemplateService.createCreativeTemplate(payload);
        showSuccess("Creative Template", "Created successfully");
      }

      navigate("/dashboard/creative-templates");
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to save template",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <BackButton
        fallbackTo="/dashboard/creative-templates"
        showBreadcrumb={true}
        currentLabel={id ? "Edit Creative Template" : "Create Creative Template"}
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white rounded-lg p-6 border border-gray-200"
      >
        <h2 className="text-sm font-semibold text-gray-900">
          {id ? "Edit Creative Template" : "Create Creative Template"}
        </h2>

        <div className="space-y-3 pb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <Input
              type="text"
              value={name}
              onChange={(value) => setName(String(value))}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Template name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Template description"
            />
          </div>
        </div>

        <div className="space-y-3 pb-4">
          <h3 className="text-sm font-semibold text-gray-900">Template Configuration</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
            <Input
              type="text"
              value={code}
              onChange={(value) => setCode(String(value))}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="Unique template code"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channel *</label>
              <HeadlessSelect
                value={channel}
                onChange={(value) => setChannel(String(value || ""))}
                options={channelOptions}
                placeholder="Select a channel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Locale</label>
              <HeadlessSelect
                value={locale}
                onChange={(value) => setLocale(String(value || ""))}
                options={languageOptions}
                placeholder="Select a locale"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <Input
              type="text"
              value={title}
              onChange={(value) => setTitle(String(value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Template title"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Template Content</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body Text</label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Plain text content"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body HTML</label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
              placeholder="HTML content"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Variables (JSON)</label>
            <textarea
              value={variablesText}
              onChange={(e) => setVariablesText(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
              placeholder='{"name": "customer"}'
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard/creative-templates")}
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
