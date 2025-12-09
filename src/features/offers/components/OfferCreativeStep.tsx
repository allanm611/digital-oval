import { useState, useMemo } from "react";
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
import { color } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import RegularModal from "../../../shared/components/ui/RegularModal";
import {
  CreativeChannel,
  Locale,
  COMMON_LOCALES,
  OfferCreative,
  RenderCreativeResponse,
} from "../types/offerCreative";
import { offerCreativeService } from "../services/offerCreativeService";
import { useConfigurationData } from "../../../shared/services/configurationDataService";
import { TypeConfigurationItem } from "../../../shared/components/TypeConfigurationPage";
import {
  SMSSmartphonePreview,
  EmailLaptopPreview,
} from "./CreativePreviewComponents";

interface LocalOfferCreative extends Omit<OfferCreative, "id" | "offer_id"> {
  id: string; // Use string for local temp ID
  offer_id?: number; // Optional until saved
}

// Helper function to replace variables in text (client-side preview)
const replaceVariables = (
  text: string,
  variables: Record<string, string | number | boolean>
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

// Helper function to calculate SMS segments
// Rules: First segment = 160 chars, subsequent segments = 153 chars each
// Sender ID is automatically prepended, so it counts toward the total
const calculateSMSSegments = (
  messageText: string,
  senderId: string = ""
): { totalChars: number; smsCount: number } => {
  if (!messageText && !senderId) {
    return { totalChars: 0, smsCount: 0 };
  }

  // Sender ID is prepended with ": " (2 chars) if message exists
  const senderIdPrefix = senderId ? `${senderId}: ` : "";
  const fullMessage = senderIdPrefix + messageText;
  const totalChars = fullMessage.length;

  if (totalChars === 0) {
    return { totalChars: 0, smsCount: 0 };
  }

  // Calculate SMS segments
  // First segment: 160 characters
  // Subsequent segments: 153 characters each
  if (totalChars <= 160) {
    return { totalChars, smsCount: 1 };
  }

  // More than 160 chars - calculate segments
  const remainingChars = totalChars - 160;
  const additionalSegments = Math.ceil(remainingChars / 153);
  const smsCount = 1 + additionalSegments;

  return { totalChars, smsCount };
};

interface OfferCreativeStepProps {
  creatives: LocalOfferCreative[];
  onCreativesChange: (creatives: LocalOfferCreative[]) => void;
  validationError?: string; // Optional validation error message
}

// Channel configuration with icons
const CHANNELS: Array<{
  value: CreativeChannel;
  label: string;
  icon: typeof Smartphone;
}> = [
  { value: "SMS", label: "SMS", icon: Smartphone },
  { value: "Email", label: "Email", icon: Mail },
  { value: "Push", label: "Push Notification", icon: MessageSquare },
  { value: "InApp", label: "In-App", icon: Monitor },
  { value: "Web", label: "Web", icon: Monitor },
  { value: "IVR", label: "IVR", icon: PhoneCall },
  { value: "USSD", label: "USSD", icon: Phone },
  { value: "WhatsApp", label: "WhatsApp", icon: MessageSquare },
];

// Locale labels for display - will use languages from config
const getLocaleLabel = (
  locale: Locale,
  languages?: TypeConfigurationItem[]
): string => {
  // If languages config is available, use it
  if (languages && languages.length > 0) {
    const language = languages.find((lang) => lang.metadataValue === locale);
    if (language) return language.name;
  }

  // Fallback to hardcoded map
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
}: OfferCreativeStepProps) {
  // Load creative templates from configuration
  const { data: templates } = useConfigurationData("creativeTemplates");
  // Load sender IDs and SMS routes from configuration
  const { data: senderIds } = useConfigurationData("senderIds");
  const { data: smsRoutes } = useConfigurationData("smsRoutes");
  // Load languages from configuration
  const { data: languages } = useConfigurationData("languages");
  // Initialize selectedCreative from creatives if available, otherwise null
  const [selectedCreative, setSelectedCreative] = useState<string | null>(
    () => {
      return creatives.length > 0 ? creatives[0].id : null;
    }
  );
  // Track raw JSON text for variables to allow free typing
  const [variablesText, setVariablesText] = useState<Record<string, string>>(
    {}
  );
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
  const [variableOverrides, setVariableOverrides] = useState<string>("");

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addCreative = () => {
    const newCreative: LocalOfferCreative = {
      id: generateId(),
      channel: "SMS", // Default to SMS
      locale: "en", // Default locale
      title: "",
      text_body: "",
      html_body: "",
      variables: {} as Record<string, string | number | boolean>,
      is_active: true,
    };

    const updatedCreatives = [...creatives, newCreative];
    onCreativesChange(updatedCreatives);
    setSelectedCreative(newCreative.id);
    // Initialize empty variables text for new creative
    setVariablesText((prev) => ({ ...prev, [newCreative.id]: "" }));
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
    setVariablesText((prev) => {
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
      c.id === id ? { ...c, ...updates } : c
    );
    onCreativesChange(updatedCreatives);
  };

  const selectedCreativeData = creatives.find((c) => c.id === selectedCreative);
  const getChannelConfig = (channel: CreativeChannel) =>
    CHANNELS.find((c) => c.value === channel);

  // Filter templates by channel and locale
  // Templates use metadataValue for channel, and locale field for language matching
  const getTemplatesForChannelAndLocale = (
    channel: CreativeChannel,
    locale: Locale
  ) => {
    return (templates as TypeConfigurationItem[]).filter((template) => {
      if (!template.isActive) return false;

      // Check if template matches channel
      const matchesChannel =
        template.metadataValue?.toLowerCase() === channel.toLowerCase();

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
      selectedCreativeData.locale
    );
  }, [selectedCreativeData?.channel, selectedCreativeData?.locale, templates]);

  // Handle template selection
  const handleTemplateSelect = (templateId: number | null) => {
    if (!selectedCreativeData || !templateId) return;

    const template = templates.find((t) => t.id === templateId) as
      | TypeConfigurationItem
      | undefined;
    if (!template) return;

    // Update selected template
    setSelectedTemplates((prev) => ({
      ...prev,
      [selectedCreativeData.id]: templateId,
    }));

    // Get template variables (default values)
    const templateVariables = template.variables || {};

    // Populate creative fields with template content (from config)
    const updates: Partial<LocalOfferCreative> = {
      // Set channel if template has a specific channel
      channel:
        (template.metadataValue as CreativeChannel) ||
        selectedCreativeData.channel,
    };

    // Populate title, text_body, html_body if template has them
    // Replace placeholders with actual values immediately
    if (template.title) {
      updates.title = replaceVariables(template.title, templateVariables);
    }
    if (template.text_body) {
      updates.text_body = replaceVariables(
        template.text_body,
        templateVariables
      );
    }
    if (template.html_body) {
      updates.html_body = replaceVariables(
        template.html_body,
        templateVariables
      );
    }
    if (template.variables) {
      updates.variables = template.variables;
      // Update variables text for display
      setVariablesText((prev) => ({
        ...prev,
        [selectedCreativeData.id]: JSON.stringify(template.variables, null, 2),
      }));
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

  // Get variables text for current creative (with fallback)
  const getVariablesText = (creativeId: string): string => {
    if (variablesText[creativeId]) {
      return variablesText[creativeId];
    }
    const creative = creatives.find((c) => c.id === creativeId);
    if (creative?.variables && Object.keys(creative.variables).length > 0) {
      return JSON.stringify(creative.variables, null, 2);
    }
    return "";
  };

  // Update variables text and try to parse
  const handleVariablesChange = (creativeId: string, text: string) => {
    // Store the raw text
    setVariablesText((prev) => ({ ...prev, [creativeId]: text }));

    // Try to parse and update if valid JSON
    if (text.trim() === "") {
      updateCreative(creativeId, { variables: {} });
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        updateCreative(creativeId, { variables: parsed });
      } else {
        // Invalid structure - keep the text but don't update variables
        // This allows user to continue typing to fix it
      }
    } catch {
      // Invalid JSON while typing - that's okay, just don't update variables yet
      // User can continue typing
    }
  };

  // Handle preview button click
  const handlePreview = async () => {
    if (!selectedCreativeData) return;

    setIsPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewResult(null);

    // Initialize variable overrides with stored variables
    const storedVars = selectedCreativeData.variables || {};
    setVariableOverrides(JSON.stringify(storedVars, null, 2));

    // Check if creative has been saved (has numeric ID)
    // Saved creatives have numeric string IDs (e.g., "123"), unsaved have random strings (e.g., "abc123xyz")
    const creativeId = selectedCreativeData.id;
    const numericId =
      typeof creativeId === "number"
        ? creativeId
        : !isNaN(Number(creativeId)) &&
          Number(creativeId) > 0 &&
          String(Number(creativeId)) === String(creativeId)
        ? Number(creativeId)
        : null;

    if (numericId !== null) {
      // Creative has been saved - use render endpoint
      try {
        const overrides = storedVars; // Use stored variables as default
        const response = await offerCreativeService.render(
          numericId,
          { variableOverrides: overrides },
          true // Skip cache
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rendered = (response as any).data || response;
        setPreviewResult(rendered);
      } catch (err) {
        // Failed to render creative
        setPreviewError(
          err instanceof Error ? err.message : "Failed to render creative"
        );

        // Fallback to client-side preview
        const clientPreview = {
          rendered_title: replaceVariables(
            selectedCreativeData.title || "",
            storedVars
          ),
          rendered_text_body: replaceVariables(
            selectedCreativeData.text_body || "",
            storedVars
          ),
          rendered_html_body: replaceVariables(
            selectedCreativeData.html_body || "",
            storedVars
          ),
        };
        setPreviewResult(clientPreview);
      }
    } else {
      // Creative not saved yet - use client-side preview
      const clientPreview = {
        rendered_title: replaceVariables(
          selectedCreativeData.title || "",
          storedVars
        ),
        rendered_text_body: replaceVariables(
          selectedCreativeData.text_body || "",
          storedVars
        ),
        rendered_html_body: replaceVariables(
          selectedCreativeData.html_body || "",
          storedVars
        ),
      };
      setPreviewResult(clientPreview);
    }

    setPreviewLoading(false);
  };

  // Handle preview with custom variable overrides
  const handlePreviewWithOverrides = async () => {
    if (!selectedCreativeData) return;

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      // Parse variable overrides
      let overrides: Record<string, string | number | boolean> = {};
      if (variableOverrides.trim()) {
        overrides = JSON.parse(variableOverrides);
      }

      // Merge with stored variables (overrides take precedence)
      const finalOverrides = {
        ...(selectedCreativeData.variables || {}),
        ...overrides,
      };

      // Check if creative has been saved
      const creativeId = selectedCreativeData.id;
      const numericId =
        typeof creativeId === "number"
          ? creativeId
          : !isNaN(Number(creativeId)) &&
            Number(creativeId) > 0 &&
            String(Number(creativeId)) === String(creativeId)
          ? Number(creativeId)
          : null;

      if (numericId !== null) {
        // Use render endpoint
        const response = await offerCreativeService.render(
          numericId,
          { variableOverrides: finalOverrides },
          true
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rendered = (response as any).data || response;
        setPreviewResult(rendered);
      } else {
        // Client-side preview
        const clientPreview = {
          rendered_title: replaceVariables(
            selectedCreativeData.title || "",
            finalOverrides
          ),
          rendered_text_body: replaceVariables(
            selectedCreativeData.text_body || "",
            finalOverrides
          ),
          rendered_html_body: replaceVariables(
            selectedCreativeData.html_body || "",
            finalOverrides
          ),
        };
        setPreviewResult(clientPreview);
      }
    } catch (err) {
      // Failed to preview with overrides
      setPreviewError(
        err instanceof Error ? err.message : "Invalid variable overrides JSON"
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation Error Display */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
        <div className="bg-white rounded-md border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Creatives Added
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Create compelling content for your offer across different channels
          </p>
          <button
            onClick={addCreative}
            className="inline-flex items-center px-4 py-2 text-sm text-white rounded-md font-medium"
            style={{
              backgroundColor: color.primary.action,
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Creative
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creative List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-md border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Creatives</h3>
                <button
                  onClick={addCreative}
                  className="inline-flex items-center px-4 py-2 text-sm text-white rounded-md font-medium"
                  style={{
                    backgroundColor: color.primary.action,
                  }}
                >
                  <Plus className="w-5 h-5 mr-1.5" />
                  Add Creative
                </button>
              </div>

              <div className="space-y-2">
                {creatives.map((creative) => {
                  const channelConfig = getChannelConfig(creative.channel);
                  const Icon = channelConfig?.icon || MessageSquare;

                  return (
                    <div
                      key={creative.id}
                      onClick={() => setSelectedCreative(creative.id)}
                      className={`p-3 rounded-md border cursor-pointer transition-all ${
                        selectedCreative === creative.id
                          ? "border-gray-300 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-md flex items-center justify-center bg-gray-100">
                            <Icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {channelConfig?.label || creative.channel}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Globe className="w-3 h-3 mr-1" />
                              {getLocaleLabel(creative.locale)}
                            </div>
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

          {/* Creative Editor */}
          <div className="lg:col-span-2">
            {selectedCreativeData ? (
              <div className="bg-white rounded-md border border-gray-200 p-6 w-full">
                <div className="space-y-6">
                  {/* Channel and Locale */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Channel
                      </label>
                      <HeadlessSelect
                        value={selectedCreativeData.channel}
                        onChange={(value) => {
                          const newChannel = value as CreativeChannel;
                          updateCreative(selectedCreativeData.id, {
                            channel: newChannel,
                          });
                          // Clear template selection when channel changes
                          setSelectedTemplates((prev) => ({
                            ...prev,
                            [selectedCreativeData.id]: null,
                          }));
                        }}
                        options={CHANNELS.map((channel) => ({
                          value: channel.value,
                          label: channel.label,
                        }))}
                        placeholder="Select channel"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Locale / Language
                      </label>
                      <HeadlessSelect
                        value={selectedCreativeData.locale}
                        onChange={(value) => {
                          updateCreative(selectedCreativeData.id, {
                            locale: value as Locale,
                          });
                          // Clear template selection when locale changes
                          // so user can select a template matching the new locale
                          setSelectedTemplates((prev) => {
                            const updated = { ...prev };
                            delete updated[selectedCreativeData.id];
                            return updated;
                          });
                        }}
                        options={[
                          ...((languages as TypeConfigurationItem[]) || [])
                            .filter((lang) => lang.isActive)
                            .map((lang) => ({
                              label: lang.name,
                              value: lang.metadataValue as string,
                            })),
                          // Fallback to COMMON_LOCALES if languages config is empty
                          ...((languages as TypeConfigurationItem[])?.length ===
                          0
                            ? COMMON_LOCALES.map((locale) => ({
                                label: getLocaleLabel(locale),
                                value: locale,
                              }))
                            : []),
                        ]}
                        placeholder="Select language"
                      />
                    </div>
                  </div>

                  {/* Template Selector */}
                  {availableTemplates.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Creative Template (Optional)
                        </label>
                        {selectedTemplates[selectedCreativeData.id] && (
                          <button
                            onClick={handleClearTemplate}
                            className="text-xs text-gray-500 underline"
                          >
                            Clear Template
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <HeadlessSelect
                          value={
                            selectedTemplates[selectedCreativeData.id]
                              ? selectedTemplates[
                                  selectedCreativeData.id
                                ]!.toString()
                              : ""
                          }
                          onChange={(value) =>
                            handleTemplateSelect(value ? Number(value) : null)
                          }
                          options={[
                            { value: "", label: "Select template" },
                            ...availableTemplates.map((template) => {
                              // Get language name if template has locale
                              let languageLabel = "";
                              if (template.locale && languages) {
                                const language = (
                                  languages as TypeConfigurationItem[]
                                ).find(
                                  (lang) =>
                                    lang.metadataValue === template.locale
                                );
                                if (language) {
                                  languageLabel = ` (${language.name})`;
                                }
                              }
                              return {
                                value: template.id.toString(),
                                label: `${template.name}${languageLabel}${
                                  template.description
                                    ? ` - ${template.description}`
                                    : ""
                                }`,
                              };
                            }),
                          ]}
                          placeholder="Select a template to start with..."
                        />
                        {selectedTemplates[selectedCreativeData.id] && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                            <FileText className="w-3 h-3" />
                            <span>
                              Template selected. You can customize the fields
                              below.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sender ID (for SMS) or Title (for other channels) */}
                  {selectedCreativeData.channel === "SMS" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sender ID
                      </label>
                      <HeadlessSelect
                        value={selectedCreativeData.title || ""}
                        onChange={(value) =>
                          updateCreative(selectedCreativeData.id, {
                            title: value || "",
                          })
                        }
                        options={[
                          { label: "Select Sender ID", value: "" },
                          ...((senderIds as TypeConfigurationItem[]) || [])
                            .filter(
                              (senderId) =>
                                senderId.isActive &&
                                senderId.metadataValue === "active"
                            )
                            .map((senderId) => ({
                              label: senderId.name,
                              value: senderId.name,
                            })),
                        ]}
                        placeholder="Select Sender ID..."
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        maxLength={160}
                        value={selectedCreativeData.title}
                        onChange={(e) =>
                          updateCreative(selectedCreativeData.id, {
                            title: e.target.value,
                          })
                        }
                        placeholder="Enter creative title..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                      />
                    </div>
                  )}

                  {/* SMS Route (for SMS channel only) */}
                  {selectedCreativeData.channel === "SMS" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SMS Route
                      </label>
                      <HeadlessSelect
                        value={
                          (selectedCreativeData.variables as any)?.sms_route ||
                          ""
                        }
                        onChange={(value) =>
                          updateCreative(selectedCreativeData.id, {
                            variables: {
                              ...selectedCreativeData.variables,
                              sms_route: value || undefined,
                            },
                          })
                        }
                        options={[
                          { label: "Select Route", value: "" },
                          ...((smsRoutes as TypeConfigurationItem[]) || [])
                            .filter((route) => route.isActive)
                            .map((route) => ({
                              label: route.name,
                              value: route.name,
                            })),
                        ]}
                        placeholder="Select SMS Route..."
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Text Body */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Text Body
                      </label>
                      {selectedCreativeData.channel === "SMS" &&
                        (() => {
                          const senderId = selectedCreativeData.title || "";
                          const { totalChars, smsCount } = calculateSMSSegments(
                            selectedCreativeData.text_body || "",
                            senderId
                          );
                          return (
                            <span
                              className={`text-xs font-medium ${
                                smsCount > 1
                                  ? "text-orange-600"
                                  : totalChars > 150
                                  ? "text-yellow-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {totalChars} / {smsCount} SMS
                            </span>
                          );
                        })()}
                    </div>
                    <textarea
                      value={selectedCreativeData.text_body}
                      onChange={(e) => {
                        // Allow any length - messages will split into multiple SMS
                        updateCreative(selectedCreativeData.id, {
                          text_body: e.target.value,
                        });
                      }}
                      placeholder="Enter the text content..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                    />
                    {selectedCreativeData.channel === "SMS" &&
                      (() => {
                        const senderId = selectedCreativeData.title || "";
                        const { totalChars, smsCount } = calculateSMSSegments(
                          selectedCreativeData.text_body || "",
                          senderId
                        );
                        if (smsCount > 1) {
                          return (
                            <p className="mt-1 text-xs text-orange-600">
                              Message will be sent as {smsCount} SMS
                              {smsCount > 1 ? "es" : ""} (charged separately)
                            </p>
                          );
                        }
                        return null;
                      })()}
                  </div>

                  {/* HTML Body (for email/web) */}
                  {(selectedCreativeData.channel === "Email" ||
                    selectedCreativeData.channel === "Web") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        HTML Body
                      </label>
                      <textarea
                        value={selectedCreativeData.html_body}
                        onChange={(e) =>
                          updateCreative(selectedCreativeData.id, {
                            html_body: e.target.value,
                          })
                        }
                        placeholder="Enter HTML content..."
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none font-mono text-sm"
                      />
                    </div>
                  )}

                  {/* Variables */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variables (JSON)
                    </label>
                    <textarea
                      value={getVariablesText(selectedCreativeData.id)}
                      onChange={(e) =>
                        handleVariablesChange(
                          selectedCreativeData.id,
                          e.target.value
                        )
                      }
                      placeholder='{"variable_name": "value"}'
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none font-mono text-sm"
                    />
                    <div className="text-xs text-gray-500 mt-1 flex items-start gap-2">
                      <span>
                        Use variables like {`{{variable_name}}`} in your content
                      </span>
                      {(() => {
                        const text = getVariablesText(selectedCreativeData.id);
                        if (text.trim() && text.trim() !== "{}") {
                          try {
                            JSON.parse(text);
                            return (
                              <span className="text-green-600">
                                ✓ Valid JSON
                              </span>
                            );
                          } catch {
                            return (
                              <span className="text-red-600">
                                ⚠ Invalid JSON (keep typing...)
                              </span>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Preview Button */}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handlePreview}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md"
                      style={{
                        backgroundColor: color.primary.action,
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Creative
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-md border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Creative Selected
                </h3>
                <p className="text-gray-500 text-sm">
                  Select a creative from the list above to start editing.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <RegularModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewError(null);
          setPreviewResult(null);
          setVariableOverrides("");
        }}
        title="Preview Creative"
        size="2xl"
      >
        <div className="space-y-6">
          {/* Variable Overrides */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variable Overrides (JSON) - Optional
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Override variable values to see how the creative looks with
              different data. Leave empty to use stored variables.
            </p>
            <textarea
              value={variableOverrides}
              onChange={(e) => setVariableOverrides(e.target.value)}
              placeholder='{"customerName": "Alice", "discount": "75%"}'
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none font-mono text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-500">
                {(() => {
                  if (!variableOverrides.trim())
                    return "Using stored variables";
                  try {
                    JSON.parse(variableOverrides);
                    return <span className="text-green-600">✓ Valid JSON</span>;
                  } catch {
                    return <span className="text-red-600">⚠ Invalid JSON</span>;
                  }
                })()}
              </div>
              <button
                onClick={handlePreviewWithOverrides}
                disabled={previewLoading}
                className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: color.primary.action,
                }}
              >
                {previewLoading ? "Rendering..." : "Update Preview"}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {previewError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
              {selectedCreativeData?.channel === "SMS" ||
              selectedCreativeData?.channel === "SMS Flash" ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    SMS Preview
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
              ) : selectedCreativeData?.channel === "Email" ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Email Preview
                  </h3>
                  <EmailLaptopPreview
                    title={previewResult.rendered_title}
                    htmlBody={previewResult.rendered_html_body}
                    textBody={previewResult.rendered_text_body}
                  />
                </div>
              ) : (
                // Fallback for other channels (Web, USSD, etc.)
                <div className="space-y-4">
                  {previewResult.rendered_title && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rendered Title
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <p className="text-gray-900">
                          {previewResult.rendered_title}
                        </p>
                      </div>
                    </div>
                  )}

                  {previewResult.rendered_text_body && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rendered Text Body
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {previewResult.rendered_text_body}
                        </p>
                      </div>
                    </div>
                  )}

                  {previewResult.rendered_html_body && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rendered HTML Body
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
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
                          No content to preview. Add title, text body, or HTML
                          body.
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Click "Update Preview" to see how your creative will look.</p>
            </div>
          )}
        </div>
      </RegularModal>
    </div>
  );
}
