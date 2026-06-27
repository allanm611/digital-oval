import { useState, useMemo, useRef, useEffect, lazy } from "react";
import {
  Plus,
  Trash2,
  Globe,
  MessageSquare,
  Mail,
  Smartphone,
  Monitor,
  Phone,
  PhoneCall,
  Eye,
  FileText,
} from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import { supportsHtmlBody, requiresHtmlBody } from "../utils/channelUtils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import TypeSelector from "../../../shared/components/TypeSelector";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import RegularModal from "../../../shared/components/ui/RegularModal";
import {
  CreativeChannel,
  Locale,
  OfferCreative,
  RenderCreativeResponse,
} from "../types/offerCreative";
import { offerCreativeService } from "../services/offerCreativeService";
import { useLanguage } from "../../../contexts/LanguageContext";
import { ConfigurationItem } from "../../configurations/components/ConfigurationManager";
import { senderIdService, SenderId } from "../../configurations/services/senderIdService";
import { creativeTemplateService, CreativeTemplate } from "../../configurations/services/creativeTemplateService";
import { smsRouteService } from "../../routes/services/smsRouteService";
import { SMSRoute } from "../../routes/types/smsRoute";
import { languageService, Language } from "../../configurations/services/languageService";
import {
  SMSSmartphonePreview,
  EmailLaptopPreview,
  WhatsAppPhonePreview,
  PushNotificationPreview,
  USSDMenuPreview,
} from "./CreativePreviewComponents";
import PreviewPanel from "../../communications/components/PreviewPanel";
import RichTextEditor from "../../communications/components/RichTextEditor";
import CascadingVariableSelector from "../../manual-broadcast/components/CascadingVariableSelector";
import {
  insertVariableAtCursor,
  formatVariablePlaceholder,
  validateInsertPosition,
} from "../../../shared/utils/variableInsertion";
import type { TemplateVariable } from "../../manual-broadcast/types";
import CreateLanguageModal from "./CreateLanguageModal";
import CreativeTemplateFormModal from "./CreativeTemplateFormModal";

interface LocalOfferCreative extends Omit<OfferCreative, "id" | "offer_id"> {
  id: string; // Use string for local temp ID
  offer_id?: number; // Optional until saved
}

// Helper function to replace variables in text (client-side preview)
const replaceVariables = (
  text: string,
  variables: Record<string, string | number | boolean>,
): string => {
  if (!text) return "";
  let result = text;
  Object.keys(variables).forEach((key) => {
    const value = String(variables[key]);
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, value);
  });
  return result;
};

interface OfferCreativeStepProps {
  creatives: LocalOfferCreative[];
  onCreativesChange: (creatives: LocalOfferCreative[]) => void;
  validationError?: string; // Optional validation error message
  communicationChannelId?: number; // Communication channel ID from step 1
  communicationChannels?: Array<{ id: number; name: string }>; // Available channels from config
}

type ActiveField = "title" | "body";

// Channel configuration with icons - labels will be populated from translations
const CHANNEL_CONFIG: Array<{
  value: CreativeChannel;
  translationKey: string;
  icon: typeof Smartphone;
}> = [
  { value: "Email", translationKey: "offers.channels.email", icon: Mail },
  { value: "SMS", translationKey: "offers.channels.sms", icon: Smartphone },
  {
    value: "USSD",
    translationKey: "offers.channels.ussd",
    icon: Smartphone,
  },
  {
    value: "WhatsApp",
    translationKey: "offers.channels.whatsApp",
    icon: MessageSquare,
  },
  {
    value: "Push",
    translationKey: "offers.channels.pushNotification",
    icon: MessageSquare,
  },
];

// Locale labels for display - will use languages from API
const getLocaleLabel = (
  locale: Locale,
  languages?: Language[],
  t?: Record<string, any>,
): string => {
  // If languages are available, use them
  if (languages && languages.length > 0) {
    const language = languages.find((lang) => lang.language_code === locale);
    if (language) return language.name;
  }

  // Fallback to translations if available
  if (t && t.offers && t.offers.locales && t.offers.locales[locale]) {
    return t.offers.locales[locale];
  }

  // Final fallback to hardcoded map
  const localeMap: Record<string, string> = {
    en: "English",
    "en-US": "English (US)",
    "en-GB": "English (UK)",
    fr: "French",
    "fr-CA": "French (Canada)",
    "fr-FR": "French (France)",
    es: "Spanish",
    "es-ES": "Spanish (Spain)",
    "es-MX": "Spanish (Mexico)",
    de: "German",
    "de-DE": "German (Germany)",
    ar: "Arabic",
    "ar-SA": "Arabic (Saudi Arabia)",
    pt: "Portuguese",
    "pt-BR": "Portuguese (Brazil)",
    "pt-PT": "Portuguese (Portugal)",
    sw: "Swahili",
    "sw-UG": "Swahili (Uganda)",
    "sw-KE": "Swahili (Kenya)",
  };
  return localeMap[locale] || locale;
};

// Template content mapping - provides actual template content for each template
interface TemplateContent {
  title?: string;
  text_body?: string;
  html_body?: string;
  variables?: Record<string, string | number | boolean>;
}

// TEMPLATE_CONTENT_MAP is defined but not currently used - kept for future use
 
const _TEMPLATE_CONTENT_MAP: Record<number, TemplateContent> = {
  // SMS Templates (5)
  1: {
    // SMS Transactional Template
    title: "Transaction Alert",
    text_body:
      "Your transaction of {{amount}} on {{date}} was successful. Reference: {{reference}}. View details: {{link}}",
    variables: {
      amount: "KES 100",
      date: "2024-01-15",
      reference: "TXN123456",
      link: "https://example.com/txn",
    },
  },
  2: {
    // SMS Promotional Template
    text_body:
      "Hi {{customer_name}}! 🎉 Special offer: Get {{discount}}% OFF on {{product_name}}. Use code: {{promo_code}}. Valid until {{expiry_date}}. Reply STOP to unsubscribe.",
    variables: {
      customer_name: "John",
      discount: "50",
      product_name: "Data Bundle",
      promo_code: "SAVE50",
      expiry_date: "2024-12-31",
    },
  },
  3: {
    // SMS Alert Template
    text_body:
      "ALERT: {{alert_type}} - {{message}}. Action required by {{deadline}}. Contact: {{support_number}}",
    variables: {
      alert_type: "Account Update",
      message: "Your account balance is low",
      deadline: "2024-12-31",
      support_number: "+256700000000",
    },
  },
  4: {
    // SMS Welcome Template
    text_body:
      "Welcome {{customer_name}}! Thank you for joining {{company_name}}. Your account is now active. Get started: {{welcome_link}}",
    variables: {
      customer_name: "John",
      company_name: "Sentra",
      welcome_link: "https://example.com/welcome",
    },
  },
  5: {
    // SMS Reminder Template
    text_body:
      "Reminder: {{reminder_message}}. Due: {{due_date}}. Take action: {{action_link}}",
    variables: {
      reminder_message: "Your subscription expires soon",
      due_date: "2024-12-31",
      action_link: "https://example.com/renew",
    },
  },
  // Email Templates (5)
  6: {
    // Email Promotional Template
    title: "Special Offer for You!",
    text_body: "Don't miss out on our exclusive offer!",
    html_body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">{{title}}</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">{{message}}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{cta_link}}" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">{{cta_text}}</a>
        </div>
      </div>
      <div style="padding: 20px; background: #ffffff; text-align: center; font-size: 12px; color: #6b7280;">
        <p>{{footer_text}}</p>
      </div>
    </div>`,
    variables: {
      title: "Special Offer for You!",
      message:
        "Get {{discount}}% off on your next purchase. Limited time only!",
      cta_text: "Claim Offer",
      cta_link: "https://example.com/offer",
      footer_text: "This is an automated message. Please do not reply.",
      discount: "25",
    },
  },
  7: {
    // Email Newsletter Template
    title: "{{newsletter_title}}",
    html_body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1f2937; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">{{newsletter_title}}</h1>
      </div>
      <div style="padding: 30px; background: #ffffff;">
        <h2 style="color: #111827;">{{section1_title}}</h2>
        <p style="color: #374151; line-height: 1.6;">{{section1_content}}</p>
        <h2 style="color: #111827; margin-top: 30px;">{{section2_title}}</h2>
        <p style="color: #374151; line-height: 1.6;">{{section2_content}}</p>
      </div>
      <div style="padding: 20px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280;">
        <p>{{unsubscribe_link}}</p>
      </div>
    </div>`,
    variables: {
      newsletter_title: "Monthly Newsletter",
      section1_title: "Latest Updates",
      section1_content: "Check out our latest features and improvements.",
      section2_title: "Featured Offers",
      section2_content: "Don't miss these exclusive deals!",
      unsubscribe_link: "Unsubscribe",
    },
  },
  8: {
    // Email Transactional Template
    title: "{{transaction_type}} Confirmation",
    html_body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #111827;">{{transaction_type}} Confirmation</h2>
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Transaction ID:</strong> {{transaction_id}}</p>
        <p><strong>Amount:</strong> {{amount}}</p>
        <p><strong>Date:</strong> {{transaction_date}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      <p style="color: #6b7280; font-size: 12px;">{{footer_note}}</p>
    </div>`,
    variables: {
      transaction_type: "Payment",
      transaction_id: "TXN123456",
      amount: "KES 1,000",
      transaction_date: "2024-01-15",
      status: "Completed",
      footer_note: "This is an automated confirmation email.",
    },
  },
  9: {
    // Email Welcome Template
    title: "Welcome to {{company_name}}!",
    html_body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #10b981; padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0;">Welcome, {{customer_name}}!</h1>
      </div>
      <div style="padding: 30px; background: #ffffff;">
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">{{welcome_message}}</p>
        <div style="margin: 30px 0;">
          <h3 style="color: #111827;">Getting Started:</h3>
          <ul style="color: #374151; line-height: 1.8;">
            <li>{{step1}}</li>
            <li>{{step2}}</li>
            <li>{{step3}}</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{get_started_link}}" style="display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Get Started</a>
        </div>
      </div>
    </div>`,
    variables: {
      company_name: "Sentra",
      customer_name: "John",
      welcome_message:
        "Thank you for joining us! We're excited to have you on board.",
      step1: "Complete your profile",
      step2: "Explore our services",
      step3: "Start using our platform",
      get_started_link: "https://example.com/get-started",
    },
  },
  10: {
    // Email Invitation Template
    title: "You're Invited: {{event_name}}",
    html_body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #8b5cf6; padding: 30px; text-align: center; color: white;">
        <h1 style="margin: 0;">You're Invited!</h1>
      </div>
      <div style="padding: 30px; background: #ffffff;">
        <h2 style="color: #111827;">{{event_name}}</h2>
        <p style="color: #374151; line-height: 1.6;"><strong>Date:</strong> {{event_date}}</p>
        <p style="color: #374151; line-height: 1.6;"><strong>Time:</strong> {{event_time}}</p>
        <p style="color: #374151; line-height: 1.6;"><strong>Location:</strong> {{event_location}}</p>
        <p style="color: #374151; line-height: 1.6; margin-top: 20px;">{{event_description}}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{rsvp_link}}" style="display: inline-block; padding: 12px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">RSVP Now</a>
        </div>
      </div>
    </div>`,
    variables: {
      event_name: "Product Launch Event",
      event_date: "2024-12-15",
      event_time: "2:00 PM",
      event_location: "Virtual Event",
      event_description: "Join us for an exciting product launch!",
      rsvp_link: "https://example.com/rsvp",
    },
  },
  // Push Notification Templates (2)
  11: {
    // Push Notification Template
    title: "{{notification_title}}",
    text_body: "{{notification_body}}",
    variables: {
      notification_title: "New Offer Available",
      notification_body: "Check out our latest promotion! Tap to view details.",
    },
  },
  12: {
    // Push Alert Template
    title: "⚠️ {{alert_title}}",
    text_body: "{{alert_message}}. Action required.",
    variables: {
      alert_title: "Important Update",
      alert_message: "Your account needs attention",
    },
  },
  // In-App Templates (2)
  13: {
    // In-App Banner Template
    title: "{{banner_title}}",
    text_body: "{{banner_description}}",
    variables: {
      banner_title: "Limited Time Offer",
      banner_description:
        "Get {{discount}}% off on selected items. Offer ends {{end_date}}.",
      discount: "30",
      end_date: "2024-12-31",
    },
  },
  14: {
    // In-App Modal Template
    title: "{{modal_title}}",
    text_body: "{{modal_content}}",
    variables: {
      modal_title: "Special Offer",
      modal_content: "You have a special offer waiting! Tap to claim.",
    },
  },
  // Web Templates (2)
  15: {
    // Web Banner Template
    title: "{{banner_title}}",
    html_body: `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
      <h2 style="margin: 0;">{{banner_title}}</h2>
      <p style="margin: 10px 0 0 0;">{{banner_subtitle}}</p>
    </div>`,
    variables: {
      banner_title: "Special Promotion",
      banner_subtitle: "Limited time offer - Act now!",
    },
  },
  16: {
    // Web Popup Template
    title: "{{popup_title}}",
    html_body: `<div style="padding: 30px; text-align: center;">
      <h2 style="color: #111827;">{{popup_title}}</h2>
      <p style="color: #374151;">{{popup_message}}</p>
      <button style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">{{cta_button}}</button>
    </div>`,
    variables: {
      popup_title: "Exclusive Offer",
      popup_message: "Get 20% off your first purchase!",
      cta_button: "Claim Now",
    },
  },
  // USSD Templates (2)
  17: {
    // USSD Prompt Template
    text_body:
      "{{ussd_prompt}}\n1. {{option1}}\n2. {{option2}}\n3. {{option3}}",
    variables: {
      ussd_prompt: "Welcome! Select an option:",
      option1: "Check Balance",
      option2: "Buy Data",
      option3: "View Offers",
    },
  },
  18: {
    // USSD Confirmation Template
    text_body:
      "CONFIRMED: {{transaction_type}}\nAmount: {{amount}}\nRef: {{reference}}\nDate: {{date}}",
    variables: {
      transaction_type: "Payment",
      amount: "KES 100",
      reference: "TXN123456",
      date: "2024-01-15",
    },
  },
  // WhatsApp Templates (2)
  19: {
    // WhatsApp Text Template
    text_body: "👋 Hi {{customer_name}}!\n\n{{message}}\n\n{{footer_text}}",
    variables: {
      customer_name: "John",
      message: "Thank you for your interest in our services!",
      footer_text: "Reply HELP for support.",
    },
  },
  20: {
    // WhatsApp Interactive Template
    text_body:
      "{{message}}\n\n*Options:*\n1️⃣ {{option1}}\n2️⃣ {{option2}}\n3️⃣ {{option3}}",
    variables: {
      message: "How can we help you today?",
      option1: "View Offers",
      option2: "Check Balance",
      option3: "Contact Support",
    },
  },
  // IVR Templates (2)
  21: {
    // IVR Welcome Template
    text_body:
      "Welcome to {{company_name}}. {{welcome_message}} Press 1 for {{option1}}, Press 2 for {{option2}}, Press 3 for {{option3}}.",
    variables: {
      company_name: "Sentra",
      welcome_message: "Thank you for calling.",
      option1: "Account Information",
      option2: "Support",
      option3: "Offers",
    },
  },
  22: {
    // IVR Confirmation Template
    text_body:
      "Your {{transaction_type}} has been confirmed. Amount: {{amount}}. Reference: {{reference}}. Thank you for using {{company_name}}.",
    variables: {
      transaction_type: "payment",
      amount: "KES 1,000",
      reference: "TXN123456",
      company_name: "Sentra",
    },
  },
};

export default function OfferCreativeStep({
  creatives,
  onCreativesChange,
  validationError,
  communicationChannelId,
  communicationChannels,
}: OfferCreativeStepProps) {
  const { t } = useLanguage();

  // Modal states for creating languages and templates
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Map communication channel ID to creative channel name using actual channel config
  const getDefaultChannelFromId = (channelId?: number): CreativeChannel => {
    if (!channelId || !communicationChannels) return "SMS";

    const channel = communicationChannels.find(ch => ch.id === channelId);
    if (!channel) return "SMS";

    const channelName = channel.name.toUpperCase();
    const validChannels: CreativeChannel[] = ["Email", "SMS", "USSD", "WhatsApp", "Push"];

    // Try to match the channel name with valid creative channels
    for (const validChannel of validChannels) {
      if (channelName.includes(validChannel.toUpperCase())) {
        return validChannel;
      }
    }

    return "SMS"; // Fallback to SMS if no match
  };

  // Fetch creative templates from backend
  const [templates, setTemplates] = useState<CreativeTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Fetch sender IDs from backend
  const [senderIds, setSenderIds] = useState<SenderId[]>([]);
  const [senderIdsLoading, setSenderIdsLoading] = useState(true);

  // Fetch SMS routes from backend
  const [smsRoutes, setSmsRoutes] = useState<SMSRoute[]>([]);
  const [smsRoutesLoading, setSmsRoutesLoading] = useState(true);

  // Fetch languages from backend API
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languagesLoading, setLanguagesLoading] = useState(true);

  // Fetch creative templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setTemplatesLoading(true);
        const response = await creativeTemplateService.getCreativeTemplates();
        // Extract data from ApiResponse wrapper
        const templateData = response.data || [];
        setTemplates(Array.isArray(templateData) ? templateData : []);
      } catch (error) {
        console.error("Failed to fetch creative templates:", error);
        setTemplates([]);
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Fetch sender IDs on component mount
  useEffect(() => {
    const fetchSenderIds = async () => {
      try {
        setSenderIdsLoading(true);
        const response = await senderIdService.getSenderIds();
        // Extract data from ApiResponse wrapper
        const senderIdData = response.data || [];
        setSenderIds(Array.isArray(senderIdData) ? senderIdData : []);
      } catch (error) {
        console.error("Failed to fetch sender IDs:", error);
        setSenderIds([]);
      } finally {
        setSenderIdsLoading(false);
      }
    };
    fetchSenderIds();
  }, []);

  // Fetch SMS routes on component mount
  useEffect(() => {
    const fetchSmsRoutes = async () => {
      try {
        setSmsRoutesLoading(true);
        const routes = await smsRouteService.getAllRoutes();
        setSmsRoutes(Array.isArray(routes) ? routes : []);
      } catch (error) {
        console.error("Failed to fetch SMS routes:", error);
        setSmsRoutes([]);
      } finally {
        setSmsRoutesLoading(false);
      }
    };
    fetchSmsRoutes();
  }, []);

  // Fetch languages from backend API
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLanguagesLoading(true);
        const response = await languageService.getLanguages();

        // Handle API response wrapper (success, data structure)
        let languageData: Language[] = [];
        if (response && typeof response === "object") {
          // If response has a 'data' property (wrapped response)
          if ("data" in response && Array.isArray(response.data)) {
            languageData = response.data;
          }
          // If response is directly an array
          else if (Array.isArray(response)) {
            languageData = response;
          }
        }

        setLanguages(languageData);
      } catch (error) {
        console.error("Failed to fetch languages:", error);
        setLanguages([]);
      } finally {
        setLanguagesLoading(false);
      }
    };
    fetchLanguages();
  }, []);

  // Handle language creation - auto-select it
  const handleLanguageCreated = async (newLanguage: Language) => {
    setLanguages((prev) => [...prev, newLanguage]);
    setIsLanguageModalOpen(false);

    // Auto-select the newly created language if we have a selected creative
    if (selectedCreativeData) {
      updateCreative(selectedCreativeData.id, {
        locale: newLanguage.language_code as Locale,
      });
      // Clear template selection when locale changes
      setSelectedTemplates((prev) => {
        const updated = { ...prev };
        delete updated[selectedCreativeData.id];
        return updated;
      });
    }
  };

  // Handle template creation - auto-select it
  const handleTemplateCreated = async (newTemplate: CreativeTemplate) => {
    setTemplates((prev) => [...prev, newTemplate]);
    setIsTemplateModalOpen(false);

    // Auto-select the newly created template if we have a selected creative
    if (selectedCreativeData) {
      handleTemplateSelect(newTemplate.id);
    }
  };

  // Clear creatives when channel changes in step 1
  useEffect(() => {
    if (creatives.length > 0 && communicationChannelId) {
      const defaultChannel = getDefaultChannelFromId(communicationChannelId);
      // Check if any creative has a different channel than the new default
      const hasChannelMismatch = creatives.some((c) => c.channel !== defaultChannel);

      if (hasChannelMismatch) {
        // Channel changed, clear all creatives
        onCreativesChange([]);
        setSelectedCreative(null);
        setSelectedTemplates({});
      }
    }
  }, [communicationChannelId]);

  // Initialize selectedCreative from creatives if available, otherwise null
  const [selectedCreative, setSelectedCreative] = useState<string | null>(
    () => {
      return creatives.length > 0 ? creatives[0].id : null;
    },
  );

  // Get languages already used by other creatives
  const getUsedLanguages = (): string[] => {
    return creatives
      .filter((c) => c.id !== selectedCreative) // Exclude current creative
      .map((c) => c.locale)
      .filter((locale): locale is string => !!locale);
  };

  // Compute language options with proper null checks
  const languageOptions = useMemo(() => {
    // Check if languages data exists and is an array
    if (!languages || !Array.isArray(languages) || languages.length === 0) {
      return [];
    }

    const usedLanguages = getUsedLanguages();

    // Safely map languages to dropdown options
    return languages
      .filter((lang) => {
        // Check if lang is a valid object with required properties
        if (!lang || typeof lang !== "object") {
          return false;
        }
        // Check if lang has is_active property and it's truthy
        if (!lang.is_active) {
          return false;
        }
        return true;
      })
      .map((lang) => {
        // Safely access properties with null checks
        const name = lang?.name ?? "Unknown Language";
        const value = lang?.language_code ?? "";
        const id = lang?.id;

        // Only include in options if we have a valid value
        if (!value) {
          return null;
        }

        return {
          label: name,
          value: String(value),
          id: id,
          isUsed: usedLanguages.includes(value),
        };
      })
      .filter((option) => option !== null) as Array<{
      label: string;
      value: string;
      isUsed: boolean;
    }>;
  }, [languages, creatives, selectedCreative]);
  // Track selected template for each creative
  const [selectedTemplates, setSelectedTemplates] = useState<
    Record<string, number | null>
  >(() => {
    // Initialize from existing creatives that have template_type_id
    const initial: Record<string, number | null> = {};
    creatives.forEach((creative) => {
      if (creative.template_type_id) {
        initial[creative.id] = creative.template_type_id;
      }
    });
    return initial;
  });

  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] =
    useState<RenderCreativeResponse | null>(null);

  // Variable insertion state (aligned with Manual Communications step)
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [activeField, setActiveField] = useState<ActiveField>("body");
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [variableError, setVariableError] = useState<string>("");
  const [selectedVariables, setSelectedVariables] = useState<
    TemplateVariable[]
  >([]);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRichTextMap, setIsRichTextMap] = useState<Record<string, boolean>>(
    {},
  );

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addCreative = () => {
    const defaultChannel = getDefaultChannelFromId(communicationChannelId);

    const newCreative: LocalOfferCreative = {
      id: generateId(),
      channel: defaultChannel, // Use channel from step 1 communication channel selection
      locale: "" as Locale, // User must explicitly select language
      title: "",
      text_body: "",
      html_body: "",
      variables: {} as Record<string, string | number | boolean>,
      is_active: true,
    };

    const updatedCreatives = [...creatives, newCreative];
    onCreativesChange(updatedCreatives);
    setSelectedCreative(newCreative.id);
    // Initialize empty template selection for new creative
    setSelectedTemplates((prev) => ({ ...prev, [newCreative.id]: null }));
  };

  const removeCreative = (id: string) => {
    const updatedCreatives = creatives.filter((c) => c.id !== id);
    onCreativesChange(updatedCreatives);

    // Clean up template selection and variables text
    setSelectedTemplates((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // Update selection if we removed the currently selected creative
    if (selectedCreative === id) {
      const newSelection =
        updatedCreatives.length > 0 ? updatedCreatives[0].id : null;
      setSelectedCreative(newSelection);
    }
  };

  const updateCreative = (id: string, updates: Partial<LocalOfferCreative>) => {
    const updatedCreatives = creatives.map((c) =>
      c.id === id ? { ...c, ...updates } : c,
    );
    onCreativesChange(updatedCreatives);
  };

  const selectedCreativeData = creatives.find((c) => c.id === selectedCreative);

  // Use draft creative if none selected (for inline creation flow)
  const editingCreative = selectedCreativeData || {
    id: 'temp-draft',
    channel: getDefaultChannelFromId(communicationChannelId),
    locale: languageOptions.find((opt) => !opt.isUsed)?.value || "en",
    title: "",
    text_body: "",
    html_body: "",
    variables: {} as Record<string, string | number | boolean>,
    is_active: true,
  };

  // Get channel label from translation
  const getChannelLabel = (channel: CreativeChannel): string => {
    const config = CHANNEL_CONFIG.find((c) => c.value === channel);
    if (!config) return channel;
    const keys = config.translationKey.split(".");
    let value: any = t;
    for (const key of keys) {
      value = value?.[key];
      if (!value) return channel;
    }
    return value as string;
  };

  const getChannelConfig = (channel: CreativeChannel) => {
    const config = CHANNEL_CONFIG.find((c) => c.value === channel);
    if (!config) return undefined;
    return {
      value: config.value,
      label: getChannelLabel(channel),
      icon: config.icon,
    };
  };

  // Filter templates by channel and locale
  const getTemplatesForChannelAndLocale = (
    channel: CreativeChannel,
    locale: Locale,
  ) => {
    return templates.filter((template) => {
      if (!template.is_active) return false;

      // Check if template matches channel (compare with creative channel)
      const matchesChannel =
        template.channel?.toLowerCase() === channel.toLowerCase();

      // Check if template has locale field
      // If template doesn't have locale specified, show it for all locales (backward compatibility)
      // If template has locale, it must match the creative's locale
      const templateLocale = template.locale;
      const matchesLocale = !templateLocale || templateLocale === locale;

      return matchesChannel && matchesLocale;
    });
  };

  // Get available templates for current creative's channel and locale
  const availableTemplates = useMemo(() => {
    if (!selectedCreativeData) return [];
    return getTemplatesForChannelAndLocale(
      selectedCreativeData.channel,
      selectedCreativeData.locale,
    );
  }, [selectedCreativeData?.channel, selectedCreativeData?.locale, templates]);

  // Handle template selection
  const handleTemplateSelect = (templateId: number | null) => {
    if (!selectedCreativeData || !templateId) return;

    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    // Update selected template
    setSelectedTemplates((prev) => ({
      ...prev,
      [selectedCreativeData.id]: templateId,
    }));

    // Get template variables (default values)
    const templateVariables = template.variables || {};

    // Populate creative fields with template content
    const updates: Partial<LocalOfferCreative> = {
      // Set channel if template has a specific channel
      channel:
        (template.channel as CreativeChannel) ||
        selectedCreativeData.channel,
    };

    // Populate title, text_body, html_body if template has them
    // Replace placeholders with actual values immediately
    if (template.title) {
      updates.title = replaceVariables(template.title, templateVariables);
    }
    if (template.body_text) {
      updates.text_body = replaceVariables(
        template.body_text,
        templateVariables,
      );
    }
    if (template.body_html) {
      updates.html_body = replaceVariables(
        template.body_html,
        templateVariables,
      );
    }
    if (template.variables) {
      updates.variables = template.variables;
    }

    updateCreative(selectedCreativeData.id, updates);
  };

  // Clear template selection
  const handleClearTemplate = () => {
    if (!selectedCreativeData) return;
    setSelectedTemplates((prev) => ({
      ...prev,
      [selectedCreativeData.id]: null,
    }));
    // Clear template_type_id but keep the content (user can still edit)
    updateCreative(selectedCreativeData.id, {
      template_type_id: undefined,
    });
  };

  // Variable selection handlers (matches Manual Communications step)
  const handleVariableSelect = (variable: TemplateVariable) => {
    if (!selectedVariables.find((v) => v.id === variable.id)) {
      setSelectedVariables((prev) => [...prev, variable]);
    }

    if (!selectedCreativeData) return;

    const isRichText = isRichTextMap[selectedCreativeData.id] || false;

    // Get actual cursor position from DOM element
    let actualCursorPosition = cursorPosition;
    if (activeField === "title" && titleInputRef.current) {
      actualCursorPosition = titleInputRef.current.selectionStart || 0;
    } else if (activeField === "body" && bodyTextareaRef.current) {
      actualCursorPosition = bodyTextareaRef.current.selectionStart || 0;
    }

    if (activeField === "title") {
      // Validate cursor position before insertion
      const positionError = validateInsertPosition(
        selectedCreativeData.title || "",
        actualCursorPosition,
      );
      if (positionError) {
        setVariableError(positionError);
        return;
      }

      setVariableError(""); // Clear any previous errors
      const result = insertVariableAtCursor(
        selectedCreativeData.title || "",
        actualCursorPosition,
        variable,
      );

      if (result.error) {
        setVariableError(result.error);
        return;
      }

      updateCreative(selectedCreativeData.id, { title: result.newText });
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.setSelectionRange(
            result.newCursorPosition,
            result.newCursorPosition,
          );
          titleInputRef.current.focus();
        }
      }, 0);
    } else {
      if (selectedCreativeData.channel === "Email" && isRichText) {
        const placeholder = formatVariablePlaceholder(variable);
        const newBody = `${selectedCreativeData.text_body || ""} ${placeholder} `;
        updateCreative(selectedCreativeData.id, { text_body: newBody });
        setVariableError("");
      } else {
        // Validate cursor position before insertion
        const positionError = validateInsertPosition(
          selectedCreativeData.text_body || "",
          actualCursorPosition,
        );
        if (positionError) {
          setVariableError(positionError);
          return;
        }

        setVariableError(""); // Clear any previous errors
        const result = insertVariableAtCursor(
          selectedCreativeData.text_body || "",
          actualCursorPosition,
          variable,
        );

        if (result.error) {
          setVariableError(result.error);
          return;
        }

        updateCreative(selectedCreativeData.id, { text_body: result.newText });
        setTimeout(() => {
          if (bodyTextareaRef.current) {
            bodyTextareaRef.current.setSelectionRange(
              result.newCursorPosition,
              result.newCursorPosition,
            );
            bodyTextareaRef.current.focus();
          }
        }, 0);
      }
    }

    setShowVariableSelector(false);
  };

  const getCharacterInfo = (text: string) => {
    const charCount = text.length;
    const isUnicode = /[^\x00-\x7F]/.test(text);
    const singleSegmentLimit = isUnicode ? 70 : 160;
    const multiSegmentLimit = isUnicode ? 67 : 153;
    let segments = 1;
    if (charCount > singleSegmentLimit) {
      segments = Math.ceil(charCount / multiSegmentLimit);
    }
    const remainingInSegment = charCount % multiSegmentLimit;
    const remaining = segments === 1
      ? singleSegmentLimit - charCount
      : multiSegmentLimit - remainingInSegment;
    return { charCount, segments, isUnicode, remaining: Math.max(0, remaining) };
  };

  // Handle preview button click - client-side only
  const handlePreview = () => {
    if (!selectedCreativeData) return;

    setIsPreviewOpen(true);
    setPreviewError(null);

    // Extract all variable placeholders from the creative content
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const previewVars: Record<string, string | number | boolean> = {};

    // Build preview variables by extracting placeholders from all content
    const contentToPreview = [
      selectedCreativeData.title || "",
      selectedCreativeData.text_body || "",
      selectedCreativeData.html_body || "",
    ].join(" ");

    let match;
    while ((match = variableRegex.exec(contentToPreview)) !== null) {
      const variablePath = match[1].trim();
      if (!previewVars[variablePath]) {
        // Get default_value from stored variables (from backend)
        const storedVar = selectedCreativeData.variables?.[variablePath];
        const defaultValue = storedVar?.default_value;
        if (defaultValue != null) {
          previewVars[variablePath] = defaultValue;
        }
      }
    }

    // Client-side preview with variable replacement using default values
    const clientPreview = {
      rendered_title: replaceVariables(
        selectedCreativeData.title || "",
        previewVars,
      ),
      rendered_text_body: replaceVariables(
        selectedCreativeData.text_body || "",
        previewVars,
      ),
      rendered_html_body: replaceVariables(
        selectedCreativeData.html_body || "",
        previewVars,
      ),
    };
    setPreviewResult(clientPreview);
  };

  return (
    <div className="space-y-6">
      {/* Validation Error Display */}
      {validationError && (
        <div className={`bg-red-50 border border-red-200 ${tw.rounded} p-4`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 font-medium">
                {validationError}
              </p>
            </div>
          </div>
        </div>
      )}

      {creatives.length === 0 ? (
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-8 text-center`}
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t.offers.creatives.noCreativesAdded}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {t.offers.creatives.subheadline}
          </p>
          <button
            onClick={addCreative}
            className={`inline-flex items-center px-4 py-2 text-sm text-white ${tw.rounded} font-medium`}
            style={{
              backgroundColor: color.primary.action,
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t.offers.creatives.addCreative}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creative List - Left Column (1/3) */}
          <div className="lg:col-span-1">
            <div
              className={`bg-white ${tw.rounded} border border-gray-200 p-4`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {t.offers.creatives.title}
                </h3>
                <button
                  onClick={addCreative}
                  disabled={languageOptions.length > 0 && languageOptions.filter((opt) => !opt.isUsed).length === 0}
                  className={`inline-flex items-center px-4 py-2 text-sm text-white ${tw.rounded} font-medium ${languageOptions.length > 0 && languageOptions.filter((opt) => !opt.isUsed).length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    backgroundColor: color.primary.action,
                  }}
                  title={languageOptions.length > 0 && languageOptions.filter((opt) => !opt.isUsed).length === 0 ? "All languages already have creatives" : ""}
                >
                  <Plus className="w-5 h-5 mr-1.5" />
                  {t.offers.creatives.addCreative}
                </button>
              </div>

              {languageOptions.length > 0 && languageOptions.filter((opt) => !opt.isUsed).length === 0 && creatives.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                  <p className="text-xs text-amber-700">
                    Each creative is limited to one language. All available languages already have creatives. To add more creatives, create a new language in your configuration.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {creatives.map((creative) => {
                  const channelConfig = getChannelConfig(creative.channel);
                  const Icon = channelConfig?.icon || MessageSquare;

                  return (
                    <div
                      key={creative.id}
                      onClick={() => setSelectedCreative(creative.id)}
                      className={`p-3 ${
                        tw.rounded
                      } border cursor-pointer transition-all ${
                        selectedCreative === creative.id
                          ? "border-gray-300 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 ${tw.rounded} flex items-center justify-center bg-gray-100`}
                          >
                            <Icon className={`p-2 icon-edit ${tw.rounded} w-4 h-4 `} />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {channelConfig?.label || creative.channel}
                            </div>
                            {creative.locale && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <Globe className="w-3 h-3 mr-1" />
                                {getLocaleLabel(
                                  creative.locale,
                                  Array.isArray(languages) ? languages : undefined,
                                  t
                                )}
                              </div>
                            )}
                            {!creative.locale && (
                              <div className="text-xs text-amber-600 flex items-center">
                                <Globe className="w-3 h-3 mr-1" />
                                Language not selected
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCreative(creative.id);
                          }}
                          className="p-1 text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {creative.title && (
                        <div className="mt-2 text-xs text-gray-600 truncate">
                          {creative.title}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Creative Editor - Center Column (1/3) */}
          <div className="lg:col-span-1">
            <div
              className={`bg-white ${tw.rounded} border border-gray-200 p-6`}
            >
              {!selectedCreativeData && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 mb-6">
                  <p className="text-xs text-blue-700">
                    Add a creative from the left panel to begin editing.
                  </p>
                </div>
              )}
              <div className="space-y-6">
                  {/* Channel Selection - Commented out: will be moved to step 1 */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.offers.channel.label}
                    </label>
                    <HeadlessSelect
                      value={selectedCreativeData.channel}
                      onChange={(value) => {
                        const newChannel = value as CreativeChannel;
                        updateCreative(selectedCreativeData.id, {
                          channel: newChannel,
                        });
                        setSelectedTemplates((prev) => ({
                          ...prev,
                          [selectedCreativeData.id]: null,
                        }));
                      }}
                      options={CHANNEL_CONFIG.map((channel) => ({
                        value: channel.value,
                        label: getChannelLabel(channel.value),
                      }))}
                      placeholder={t.offers.channel.placeholder}
                      zIndex={zIndex.popover}
                    />
                  </div> */}

                  {/* Locale Selection */}
                  <HeadlessSelect
                    label={t.offers.locale.label + " *"}
                    value={editingCreative.locale || ""}
                    onChange={(value) => {
                      if (selectedCreativeData) {
                        updateCreative(selectedCreativeData.id, {
                          locale: value as Locale,
                        });
                        // Clear template selection when locale changes
                        setSelectedTemplates((prev) => {
                          const updated = { ...prev };
                          delete updated[selectedCreativeData.id];
                          return updated;
                        });
                      }
                    }}
                    options={[
                      { label: "Select a language", value: "" },
                      ...languageOptions.filter((opt) => !opt.isUsed),
                    ]}
                    placeholder={
                      languageOptions.length === 0
                        ? "No languages configured"
                        : "Select a language"
                    }
                    disabled={selectedCreativeData ? languageOptions.filter((opt) => !opt.isUsed).length === 0 : false}
                  />

                  {/* Template Selector */}
                  <div className="relative">
                    {selectedCreativeData && selectedTemplates[selectedCreativeData.id] && (
                      <button
                        onClick={handleClearTemplate}
                        className="absolute right-0 top-0 text-xs text-gray-500 underline z-10"
                      >
                        Clear
                      </button>
                    )}
                    <HeadlessSelect
                      label="Creative Template (Optional)"
                      value={
                        selectedCreativeData && selectedTemplates[selectedCreativeData.id]
                          ? selectedTemplates[
                              selectedCreativeData.id
                            ]!.toString()
                          : ""
                      }
                      onChange={(value) =>
                        selectedCreativeData && handleTemplateSelect(value ? Number(value) : null)
                      }
                      options={[
                        { value: "", label: "Select template" },
                        ...availableTemplates.map((template) => {
                          let languageLabel = "";
                          if (
                            template.locale &&
                            languages &&
                            Array.isArray(languages) &&
                            languages.length > 0
                          ) {
                            const language = languages.find(
                              (lang) =>
                                lang &&
                                lang.language_code &&
                                lang.language_code === template.locale
                            );
                            if (language && language.name) {
                              languageLabel = " (" + language.name + ")";
                            }
                          }
                          return {
                            value: template.id.toString(),
                            label: template.name + languageLabel + (template.description ? " - " + template.description : ""),
                          };
                        }),
                      ]}
                      placeholder="Select a template to start with..."
                    />
                    {selectedTemplates[selectedCreativeData?.id] && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        <FileText className="w-3 h-3" />
                        <span>
                          Template selected. You can customize the fields
                          below.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sender ID (SMS) or Subject (Email) */}
                  <div className="space-y-4">
                    {/* Sender ID for SMS */}
                    {editingCreative.channel === "SMS" && (
                      <HeadlessSelect
                        label={t.offers.senderId.label}
                        value={editingCreative.title || ""}
                        onChange={(value) =>
                          selectedCreativeData && updateCreative(selectedCreativeData.id, {
                            title: value || "",
                          })
                        }
                        options={[
                          { label: t.offers.senderId.defaultPlaceholder, value: "" },
                          ...(senderIds || [])
                            .filter((senderId) => senderId.is_active)
                            .map((senderId) => ({
                              label: senderId.name,
                              value: senderId.name,
                            })),
                        ]}
                        placeholder={t.offers.senderId.defaultPlaceholder}
                        className="w-full"
                        zIndex={zIndex.popover}
                        disabled={senderIdsLoading}
                      />
                    )}

                    {/* Title/Subject Line for all channels */}
                    {(() => {
                      const getTitleConfig = (channel: CreativeChannel) => {
                        switch (channel) {
                          case "Email":
                            return { label: t.offers.subjectLine.label, placeholder: t.offers.subjectLine.placeholder, maxLength: 160 };
                          case "SMS":
                            return { label: "Message Title", placeholder: "Enter message title", maxLength: 60 };
                          case "WhatsApp":
                            return { label: "Message Title", placeholder: "Enter message title", maxLength: 100 };
                          case "Push":
                            return { label: "Notification Title", placeholder: "Enter notification title", maxLength: 65 };
                          case "USSD":
                            return { label: "Menu Title", placeholder: "Enter menu title", maxLength: 50 };
                          default:
                            return { label: "Title", placeholder: "Enter title", maxLength: 160 };
                        }
                      };

                      const config = getTitleConfig(editingCreative.channel);

                      return (
                        <Input
                          ref={titleInputRef}
                          label={config.label + " *"}
                          placeholder={config.placeholder}
                          maxLength={config.maxLength}
                          value={editingCreative.title || ""}
                          onChange={(value) => {
                            setActiveField("title");
                            selectedCreativeData && updateCreative(selectedCreativeData.id, {
                              title: value,
                            });
                          }}
                          onClick={(e) => {
                            setActiveField("title");
                            setCursorPosition(
                              e.currentTarget.selectionStart || 0,
                            );
                          }}
                          onFocus={(e) => {
                            setActiveField("title");
                            setCursorPosition(
                              e.currentTarget.selectionStart || 0,
                            );
                          }}
                        />
                      );
                    })()}

                    {/* SMS Route (for SMS channel only) - Moved to step 1 */}
                    {/* {selectedCreativeData.channel === "SMS" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t.offers.smsRoute.label}
                        </label>
                        <HeadlessSelect
                          value={selectedCreativeData.sms_route || ""}
                          onChange={(value) => {
                            updateCreative(selectedCreativeData.id, {
                              sms_route: value,
                            });
                          }}
                          options={
                            smsRoutes?.filter((route) => route.is_active)
                              .map((route) => ({
                                value: route.id?.toString() || "",
                                label: route.name,
                              })) || []
                          }
                          placeholder={t.offers.smsRoute.placeholder}
                          zIndex={zIndex.popover}
                        />
                      </div>
                    )} */}

                    {/* Email HTML Body Requirement Hint */}
                    {editingCreative.channel === "Email" && (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs text-blue-700">
                          ℹ️ For Email channels, you need to enable <strong>Rich Text</strong> mode to generate the HTML body required by the backend.
                        </p>
                      </div>
                    )}

                    {/* Message content toolbar */}
                    <div
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: color.surface.cards }}
                    >
                      <span className={`text-sm font-medium ${tw.textPrimary}`}>
                        {t.offers.messageContent.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {(editingCreative.channel === "Email" ||
                          editingCreative.channel === "SMS" ||
                          editingCreative.channel === "WhatsApp" ||
                          editingCreative.channel === "Push") && (
                          <button
                            type="button"
                            onClick={() =>
                              selectedCreativeData && setIsRichTextMap((prev) => ({
                                ...prev,
                                [selectedCreativeData.id]:
                                  !prev[selectedCreativeData.id],
                              }))
                            }
                            className="px-3 py-1.5 text-sm rounded-md border transition-colors"
                            style={{
                              backgroundColor: selectedCreativeData && isRichTextMap[
                                selectedCreativeData.id
                              ]
                                ? `${color.primary.accent}10`
                                : "white",
                              borderColor: selectedCreativeData && isRichTextMap[
                                selectedCreativeData.id
                              ]
                                ? color.primary.accent
                                : color.border.default,
                              color: selectedCreativeData && isRichTextMap[selectedCreativeData.id]
                                ? color.primary.accent
                                : color.text.secondary,
                            }}
                          >
                            {selectedCreativeData && isRichTextMap[selectedCreativeData.id]
                              ? t.offers.richText
                              : t.offers.plainText}
                          </button>
                        )}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setShowVariableSelector(!showVariableSelector)
                            }
                            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors"
                            style={{
                              backgroundColor: color.primary.accent,
                              color: "white",
                            }}
                          >
                            {t.offers.messageContent.insertVariable}
                          </button>
                          <div
                            className="absolute left-0 mt-1"
                            style={{ zIndex: zIndex.popover }}
                          >
                            <CascadingVariableSelector
                              isOpen={showVariableSelector}
                              onClose={() => setShowVariableSelector(false)}
                              onVariableSelect={handleVariableSelect}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message Body */}
                    {selectedCreativeData && isRichTextMap[selectedCreativeData.id] ? (
                        <div
                          onClick={() => setActiveField("body")}
                          onFocus={() => setActiveField("body")}
                        >
                          <RichTextEditor
                            value={editingCreative.text_body || ""}
                            onChange={(value) => {
                              selectedCreativeData && updateCreative(selectedCreativeData.id, {
                                text_body: value,
                              });
                            }}
                            placeholder={t.offers.messageBody.placeholder}
                            minHeight="250px"
                          />
                        </div>
                      ) : (
                        <Textarea
                          ref={bodyTextareaRef}
                          label={t.offers.messageBody.label || "Message"}
                          value={editingCreative.text_body || ""}
                          onChange={(value) => {
                            setActiveField("body");
                            selectedCreativeData && updateCreative(selectedCreativeData.id, {
                              text_body: value,
                            });
                          }}
                          onClickCapture={(e) => {
                            setActiveField("body");
                            setCursorPosition(
                              (e.target as HTMLTextAreaElement).selectionStart || 0,
                            );
                          }}
                          onFocus={(e) => {
                            setActiveField("body");
                            setCursorPosition(
                              e.currentTarget.selectionStart || 0,
                            );
                          }}
                          placeholder={t.offers.messageBody.placeholder}
                          rows={8}
                          disabled={!selectedCreativeData}
                        />
                      )}

                    {variableError && (
                      <div className="mt-3 text-sm text-red-700">
                        {variableError}
                      </div>
                    )}

                    {/* Preview Button and Info bar */}
                    <div className="mt-4">
                      <button
                        onClick={handlePreview}
                        disabled={!selectedCreativeData || (!editingCreative.title && !editingCreative.text_body && !editingCreative.html_body)}
                        className={`px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50`}
                      >
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Panel - Right Column (1/3) */}
          {creatives.length > 0 && (
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <PreviewPanel
                  channel={editingCreative.channel === "SMS" ? "SMS" : editingCreative.channel === "Email" ? "EMAIL" : editingCreative.channel === "WhatsApp" ? "WHATSAPP" : "PUSH"}
                  title={editingCreative.title}
                  body={editingCreative.text_body || ""}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      <RegularModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewError(null);
          setPreviewResult(null);
        }}
        title={t.offers.preview.title}
        size="2xl"
      >
        <div className="space-y-6">
          {/* Error Display */}
          {previewError && (
            <div
              className={`bg-red-50 border border-red-200 ${tw.rounded} p-4`}
            >
              <p className="text-sm text-red-800">{previewError}</p>
            </div>
          )}

          {/* Preview Result */}
          {previewLoading && !previewResult ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          ) : previewResult ? (
            <div className="space-y-6">
              {/* Device-Specific Previews */}
              {editingCreative?.channel === "SMS" ||
              editingCreative?.channel === "SMS Flash" ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    {t.offers.preview.smsPreview}
                  </h3>
                  <SMSSmartphonePreview
                    message={
                      previewResult.rendered_text_body ||
                      previewResult.rendered_title ||
                      ""
                    }
                    title={previewResult.rendered_title}
                  />
                </div>
              ) : editingCreative?.channel === "Email" ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    {t.offers.preview.emailPreview}
                  </h3>
                  <EmailLaptopPreview
                    title={previewResult.rendered_title}
                    htmlBody={previewResult.rendered_html_body}
                    textBody={previewResult.rendered_text_body}
                  />
                </div>
              ) : editingCreative?.channel === "WhatsApp" ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    WhatsApp Preview
                  </h3>
                  <WhatsAppPhonePreview
                    message={
                      previewResult.rendered_text_body ||
                      previewResult.rendered_title ||
                      ""
                    }
                    title={previewResult.rendered_title}
                  />
                </div>
              ) : editingCreative?.channel === "Push" ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Push Notification Preview
                  </h3>
                  <PushNotificationPreview
                    message={
                      previewResult.rendered_text_body ||
                      previewResult.rendered_title ||
                      ""
                    }
                    title={previewResult.rendered_title}
                  />
                </div>
              ) : editingCreative?.channel === "USSD" ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    USSD Menu Preview
                  </h3>
                  <USSDMenuPreview
                    message={
                      previewResult.rendered_text_body ||
                      previewResult.rendered_title ||
                      ""
                    }
                    title={previewResult.rendered_title}
                  />
                </div>
              ) : (
                // Fallback for other channels
                <div className="space-y-4">
                  {previewResult.rendered_title && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.offers.preview.renderedTitle}
                      </label>
                      <div
                        className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}
                      >
                        <p className="text-gray-900">
                          {previewResult.rendered_title}
                        </p>
                      </div>
                    </div>
                  )}

                  {previewResult.rendered_text_body && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.offers.preview.renderedTextBody}
                      </label>
                      <div
                        className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}
                      >
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {previewResult.rendered_text_body}
                        </p>
                      </div>
                    </div>
                  )}

                  {previewResult.rendered_html_body && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.offers.preview.renderedHtmlBody}
                      </label>
                      <div
                        className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}
                      >
                        <div
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: previewResult.rendered_html_body,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {!previewResult.rendered_title &&
                    !previewResult.rendered_text_body &&
                    !previewResult.rendered_html_body && (
                      <div className="text-center py-8 text-gray-500">
                        <p>
                          {t.offers.preview.noContent}
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>
                {t.offers.preview.clickToPreview}
              </p>
            </div>
          )}
        </div>
      </RegularModal>

      {/* Create Language Modal */}
      <CreateLanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        onLanguageCreated={handleLanguageCreated}
      />

      {/* Create Creative Template Modal */}
      <CreativeTemplateFormModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        defaultChannelId={communicationChannelId}
        defaultLocale={editingCreative.locale}
        communicationChannels={communicationChannels?.map((ch) => ({ id: ch.id, name: ch.name, code: ch.code }))}
        onSave={async (formData) => {
          const newTemplate = await creativeTemplateService.createCreativeTemplate(formData);
          if (newTemplate) {
            handleTemplateCreated(newTemplate);
          }
        }}
      />
    </div>
  );
}
