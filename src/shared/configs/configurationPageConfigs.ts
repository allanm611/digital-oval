import {
  Flag,
  Building2,
  Users,
  Briefcase,
  Tag,
  Megaphone,
  Layers,
  Share2,
  MessageSquare,
  Palette,
  Gift,
  Globe,
} from "lucide-react";
import {
  ConfigurationPageConfig,
  ConfigurationItem,
} from "../components/GenericConfigurationPage";
import {
  TypeConfigurationItem,
  TypeConfigurationPageConfig,
} from "../components/TypeConfigurationPage";

// Hardcoded objectives data
const hardcodedObjectives: ConfigurationItem[] = [
  {
    id: 1,
    name: "New Customer Acquisition",
    description: "Attract and convert new customers to your service",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-20T14:45:00Z",
  },
  {
    id: 2,
    name: "Customer Retention",
    description: "Keep existing customers engaged and loyal",
    created_at: "2025-01-10T09:15:00Z",
    updated_at: "2025-01-18T16:20:00Z",
  },
  {
    id: 3,
    name: "Churn Prevention",
    description: "Prevent at-risk customers from leaving",
    created_at: "2025-01-12T11:00:00Z",
    updated_at: "2025-01-19T13:30:00Z",
  },
  {
    id: 4,
    name: "Upsell/Cross-sell",
    description: "Increase revenue from existing customers",
    created_at: "2025-01-14T15:30:00Z",
    updated_at: "2025-01-21T10:15:00Z",
  },
  {
    id: 5,
    name: "Dormant Customer Reactivation",
    description: "Re-engage inactive or dormant customers",
    created_at: "2025-01-08T08:45:00Z",
    updated_at: "2025-01-15T12:00:00Z",
  },
];

// Hardcoded departments data
const hardcodedDepartments: ConfigurationItem[] = [
  {
    id: 1,
    name: "Marketing",
    description: "Responsible for marketing campaigns and customer acquisition",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-20T14:45:00Z",
  },
  {
    id: 2,
    name: "Sales",
    description: "Handles sales operations and customer relationships",
    created_at: "2025-01-10T09:15:00Z",
    updated_at: "2025-01-18T16:20:00Z",
  },
  {
    id: 3,
    name: "Customer Support",
    description: "Provides customer service and technical support",
    created_at: "2025-01-12T11:00:00Z",
    updated_at: "2025-01-19T13:30:00Z",
  },
  {
    id: 4,
    name: "Product Management",
    description: "Manages product development and strategy",
    created_at: "2025-01-14T15:30:00Z",
    updated_at: "2025-01-21T10:15:00Z",
  },
  {
    id: 5,
    name: "Finance",
    description: "Handles financial operations and budget management",
    created_at: "2025-01-08T08:45:00Z",
    updated_at: "2025-01-15T12:00:00Z",
  },
];

// Hardcoded team roles data
const hardcodedTeamRoles: ConfigurationItem[] = [
  {
    id: 1,
    name: "Campaign Manager",
    description: "Responsible for planning and executing marketing campaigns",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-20T14:45:00Z",
  },
  {
    id: 2,
    name: "Content Creator",
    description: "Creates and manages content for campaigns",
    created_at: "2025-01-10T09:15:00Z",
    updated_at: "2025-01-18T16:20:00Z",
  },
  {
    id: 3,
    name: "Data Analyst",
    description: "Analyzes campaign performance and provides insights",
    created_at: "2025-01-12T11:00:00Z",
    updated_at: "2025-01-19T13:30:00Z",
  },
  {
    id: 4,
    name: "Designer",
    description: "Creates visual assets and designs for campaigns",
    created_at: "2025-01-14T15:30:00Z",
    updated_at: "2025-01-21T10:15:00Z",
  },
];

// Hardcoded line of business data
const hardcodedLineOfBusiness: ConfigurationItem[] = [
  {
    id: 1,
    name: "GSM",
    description:
      "Global System for Mobile Communications - Mobile network services",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-20T14:45:00Z",
  },
  {
    id: 2,
    name: "Internet",
    description:
      "Internet and broadband services for residential and business customers",
    created_at: "2025-01-10T09:15:00Z",
    updated_at: "2025-01-18T16:20:00Z",
  },
  {
    id: 3,
    name: "Fixed Line",
    description: "Traditional landline telephone services",
    created_at: "2025-01-12T11:00:00Z",
    updated_at: "2025-01-19T13:30:00Z",
  },
  {
    id: 4,
    name: "Enterprise Solutions",
    description: "Business telecommunications and IT solutions",
    created_at: "2025-01-14T15:30:00Z",
    updated_at: "2025-01-21T10:15:00Z",
  },
  {
    id: 5,
    name: "Digital Services",
    description: "Digital transformation and cloud services",
    created_at: "2025-01-08T08:45:00Z",
    updated_at: "2025-01-15T12:00:00Z",
  },
];

// Hardcoded tracking sources data (for offer performance measurement)
const hardcodedTrackingSources: ConfigurationItem[] = [
  {
    id: 1,
    name: "Recharge Tracking",
    description:
      "Track recharge-based activities and transactions for offer performance",
    created_at: "2025-02-01T09:00:00Z",
    updated_at: "2025-02-06T15:00:00Z",
  },
  {
    id: 2,
    name: "Usage Metric Tracking",
    description:
      "Track usage-based metrics like data consumption, call duration, and SMS volume",
    created_at: "2025-02-02T11:15:00Z",
    updated_at: "2025-02-06T15:00:00Z",
  },
  {
    id: 3,
    name: "Channel Performance",
    description:
      "Track offer performance across different delivery channels (SMS, Email, USSD)",
    created_at: "2025-02-03T12:40:00Z",
    updated_at: "2025-02-06T15:00:00Z",
  },
  {
    id: 4,
    name: "Customer Segment Tracking",
    description:
      "Track offer performance by customer segment and demographic attributes",
    created_at: "2025-02-04T13:20:00Z",
    updated_at: "2025-02-06T15:00:00Z",
  },
  {
    id: 5,
    name: "Product Type Tracking",
    description: "Track offer performance by product type and category",
    created_at: "2025-02-05T08:10:00Z",
    updated_at: "2025-02-06T15:00:00Z",
  },
  {
    id: 6,
    name: "Custom Tracking Source",
    description:
      "Custom tracking parameters for specific business requirements",
    created_at: "2025-02-06T10:30:00Z",
    updated_at: "2025-02-06T15:00:00Z",
  },
];

// Hardcoded creative templates data
const hardcodedCreativeTemplates: TypeConfigurationItem[] = [
  // SMS Templates (5)
  {
    id: 1,
    name: "SMS Transactional Template (English)",
    description:
      "Two-line SMS with placeholders for amount, date, and short link",
    isActive: true,
    metadataValue: "SMS",
    locale: "en",
    title: "Transaction Alert",
    text_body:
      "Your transaction of {{amount}} on {{date}} was successful. Reference: {{reference}}. View details: {{link}}",
    variables: {
      amount: "KES 100",
      date: "2024-01-15",
      reference: "TXN123456",
      link: "https://example.com/txn",
    },
    created_at: "2025-02-01T10:00:00Z",
    updated_at: "2025-02-01T10:00:00Z",
  },
  {
    id: 2,
    name: "SMS Promotional Template (English)",
    description: "Promotional SMS with offer details and call-to-action",
    isActive: true,
    metadataValue: "SMS",
    locale: "en",
    text_body:
      "Hi {{customer_name}}! 🎉 Special offer: Get {{discount}}% OFF on {{product_name}}. Use code: {{promo_code}}. Valid until {{expiry_date}}. Reply STOP to unsubscribe.",
    variables: {
      customer_name: "John",
      discount: "50",
      product_name: "Data Bundle",
      promo_code: "SAVE50",
      expiry_date: "2024-12-31",
    },
    created_at: "2025-02-01T10:01:00Z",
    updated_at: "2025-02-01T10:01:00Z",
  },
  {
    id: 100,
    name: "SMS Promotional Template (French)",
    description:
      "Promotional SMS with offer details and call-to-action - French",
    isActive: true,
    metadataValue: "SMS",
    locale: "fr",
    text_body:
      "Bonjour {{customer_name}}! 🎉 Offre spéciale: Obtenez {{discount}}% de réduction sur {{product_name}}. Code: {{promo_code}}. Valide jusqu'au {{expiry_date}}. Répondez STOP pour vous désabonner.",
    variables: {
      customer_name: "Jean",
      discount: "50",
      product_name: "Forfait de données",
      promo_code: "ECONOMISEZ50",
      expiry_date: "2024-12-31",
    },
    created_at: "2025-02-01T10:01:00Z",
    updated_at: "2025-02-01T10:01:00Z",
  },
  {
    id: 101,
    name: "SMS Promotional Template (Swahili)",
    description:
      "Promotional SMS with offer details and call-to-action - Swahili",
    isActive: true,
    metadataValue: "SMS",
    locale: "sw",
    text_body:
      "Hujambo {{customer_name}}! 🎉 Ofa maalum: Pata punguzo la {{discount}}% kwenye {{product_name}}. Tumia nambari: {{promo_code}}. Inaendelea hadi {{expiry_date}}. Jibu STOP kujiondoa.",
    variables: {
      customer_name: "Juma",
      discount: "50",
      product_name: "Kifurushi cha Data",
      promo_code: "OKOA50",
      expiry_date: "2024-12-31",
    },
    created_at: "2025-02-01T10:01:00Z",
    updated_at: "2025-02-01T10:01:00Z",
  },
  {
    id: 3,
    name: "SMS Alert Template",
    description: "Alert notification with important information",
    isActive: true,
    metadataValue: "SMS",
    text_body:
      "ALERT: {{alert_type}} - {{message}}. Action required by {{deadline}}. Contact: {{support_number}}",
    variables: {
      alert_type: "Account Update",
      message: "Your account balance is low",
      deadline: "2024-12-31",
      support_number: "+256700000000",
    },
    created_at: "2025-02-01T10:02:00Z",
    updated_at: "2025-02-01T10:02:00Z",
  },
  {
    id: 4,
    name: "SMS Welcome Template",
    description: "Welcome message for new customers",
    isActive: true,
    metadataValue: "SMS",
    text_body:
      "Welcome {{customer_name}}! Thank you for joining {{company_name}}. Your account is now active. Get started: {{welcome_link}}",
    variables: {
      customer_name: "John",
      company_name: "Sentra",
      welcome_link: "https://example.com/welcome",
    },
    created_at: "2025-02-01T10:03:00Z",
    updated_at: "2025-02-01T10:03:00Z",
  },
  {
    id: 5,
    name: "SMS Reminder Template",
    description: "Reminder message with deadline and action items",
    isActive: true,
    metadataValue: "SMS",
    text_body:
      "Reminder: {{reminder_message}}. Due: {{due_date}}. Take action: {{action_link}}",
    variables: {
      reminder_message: "Your subscription expires soon",
      due_date: "2024-12-31",
      action_link: "https://example.com/renew",
    },
    created_at: "2025-02-01T10:04:00Z",
    updated_at: "2025-02-01T10:04:00Z",
  },
  // Email Templates (5)
  {
    id: 6,
    name: "Email Promotional Template",
    description:
      "Rich HTML template with hero banner, CTA button, and footer content",
    isActive: true,
    metadataValue: "Email",
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
    created_at: "2025-02-01T10:05:00Z",
    updated_at: "2025-02-01T10:05:00Z",
  },
  {
    id: 7,
    name: "Email Newsletter Template",
    description: "Newsletter format with multiple sections and images",
    isActive: true,
    metadataValue: "Email",
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
    created_at: "2025-02-01T10:06:00Z",
    updated_at: "2025-02-01T10:06:00Z",
  },
  {
    id: 8,
    name: "Email Transactional Template",
    description:
      "Clean transactional email with receipt or confirmation details",
    isActive: true,
    metadataValue: "Email",
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
    created_at: "2025-02-01T10:07:00Z",
    updated_at: "2025-02-01T10:07:00Z",
  },
  {
    id: 9,
    name: "Email Welcome Template",
    description: "Welcome email with onboarding information",
    isActive: true,
    metadataValue: "Email",
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
    created_at: "2025-02-01T10:08:00Z",
    updated_at: "2025-02-01T10:08:00Z",
  },
  {
    id: 10,
    name: "Email Invitation Template",
    description: "Invitation email with event details and RSVP",
    isActive: true,
    metadataValue: "Email",
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
    created_at: "2025-02-01T10:09:00Z",
    updated_at: "2025-02-01T10:09:00Z",
  },
  // Push Notification Templates (2)
  {
    id: 11,
    name: "Push Notification Template",
    description: "Short push notification with title and body placeholders",
    isActive: true,
    metadataValue: "Push",
    title: "{{notification_title}}",
    text_body: "{{notification_body}}",
    variables: {
      notification_title: "New Offer Available",
      notification_body: "Check out our latest promotion! Tap to view details.",
    },
    created_at: "2025-02-01T10:10:00Z",
    updated_at: "2025-02-01T10:10:00Z",
  },
  {
    id: 12,
    name: "Push Alert Template",
    description: "Alert-style push notification for urgent updates",
    isActive: true,
    metadataValue: "Push",
    title: "⚠️ {{alert_title}}",
    text_body: "{{alert_message}}. Action required.",
    variables: {
      alert_title: "Important Update",
      alert_message: "Your account needs attention",
    },
    created_at: "2025-02-01T10:11:00Z",
    updated_at: "2025-02-01T10:11:00Z",
  },
  // In-App Templates (2)
  {
    id: 13,
    name: "In-App Banner Template",
    description: "Responsive in-app banner with image, headline, and CTA",
    isActive: true,
    metadataValue: "InApp",
    title: "{{banner_title}}",
    text_body: "{{banner_description}}",
    variables: {
      banner_title: "Limited Time Offer",
      banner_description:
        "Get {{discount}}% off on selected items. Offer ends {{end_date}}.",
      discount: "30",
      end_date: "2024-12-31",
    },
    created_at: "2025-02-01T10:15:00Z",
    updated_at: "2025-02-01T10:15:00Z",
  },
  {
    id: 14,
    name: "In-App Modal Template",
    description: "Modal popup with offer details and action buttons",
    isActive: true,
    metadataValue: "InApp",
    title: "{{modal_title}}",
    text_body: "{{modal_content}}",
    variables: {
      modal_title: "Special Offer",
      modal_content: "You have a special offer waiting! Tap to claim.",
    },
    created_at: "2025-02-01T10:16:00Z",
    updated_at: "2025-02-01T10:16:00Z",
  },
  // Web Templates (2)
  {
    id: 15,
    name: "Web Banner Template",
    description: "Web page banner with promotional content",
    isActive: true,
    metadataValue: "Web",
    title: "{{banner_title}}",
    html_body: `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
      <h2 style="margin: 0;">{{banner_title}}</h2>
      <p style="margin: 10px 0 0 0;">{{banner_subtitle}}</p>
    </div>`,
    variables: {
      banner_title: "Special Promotion",
      banner_subtitle: "Limited time offer - Act now!",
    },
    created_at: "2025-02-01T10:17:00Z",
    updated_at: "2025-02-01T10:17:00Z",
  },
  {
    id: 16,
    name: "Web Popup Template",
    description: "Website popup with offer and close option",
    isActive: true,
    metadataValue: "Web",
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
    created_at: "2025-02-01T10:18:00Z",
    updated_at: "2025-02-01T10:18:00Z",
  },
  // USSD Templates (2)
  {
    id: 17,
    name: "USSD Prompt Template",
    description: "USSD prompt layout with menu options and short instruction",
    isActive: true,
    metadataValue: "USSD",
    text_body:
      "{{ussd_prompt}}\n1. {{option1}}\n2. {{option2}}\n3. {{option3}}",
    variables: {
      ussd_prompt: "Welcome! Select an option:",
      option1: "Check Balance",
      option2: "Buy Data",
      option3: "View Offers",
    },
    created_at: "2025-02-01T10:20:00Z",
    updated_at: "2025-02-01T10:20:00Z",
  },
  {
    id: 18,
    name: "USSD Confirmation Template",
    description: "USSD confirmation message with transaction details",
    isActive: true,
    metadataValue: "USSD",
    text_body:
      "CONFIRMED: {{transaction_type}}\nAmount: {{amount}}\nRef: {{reference}}\nDate: {{date}}",
    variables: {
      transaction_type: "Payment",
      amount: "KES 100",
      reference: "TXN123456",
      date: "2024-01-15",
    },
    created_at: "2025-02-01T10:21:00Z",
    updated_at: "2025-02-01T10:21:00Z",
  },
  // WhatsApp Templates (2)
  {
    id: 19,
    name: "WhatsApp Text Template",
    description: "Simple WhatsApp text message with formatting",
    isActive: true,
    metadataValue: "WhatsApp",
    text_body: "👋 Hi {{customer_name}}!\n\n{{message}}\n\n{{footer_text}}",
    variables: {
      customer_name: "John",
      message: "Thank you for your interest in our services!",
      footer_text: "Reply HELP for support.",
    },
    created_at: "2025-02-01T10:22:00Z",
    updated_at: "2025-02-01T10:22:00Z",
  },
  {
    id: 20,
    name: "WhatsApp Interactive Template",
    description: "WhatsApp message with buttons and quick replies",
    isActive: true,
    metadataValue: "WhatsApp",
    text_body:
      "{{message}}\n\n*Options:*\n1️⃣ {{option1}}\n2️⃣ {{option2}}\n3️⃣ {{option3}}",
    variables: {
      message: "How can we help you today?",
      option1: "View Offers",
      option2: "Check Balance",
      option3: "Contact Support",
    },
    created_at: "2025-02-01T10:23:00Z",
    updated_at: "2025-02-01T10:23:00Z",
  },
  // IVR Templates (2)
  {
    id: 21,
    name: "IVR Welcome Template",
    description: "IVR welcome message with menu options",
    isActive: true,
    metadataValue: "IVR",
    text_body:
      "Welcome to {{company_name}}. {{welcome_message}} Press 1 for {{option1}}, Press 2 for {{option2}}, Press 3 for {{option3}}.",
    variables: {
      company_name: "Sentra",
      welcome_message: "Thank you for calling.",
      option1: "Account Information",
      option2: "Support",
      option3: "Offers",
    },
    created_at: "2025-02-01T10:24:00Z",
    updated_at: "2025-02-01T10:24:00Z",
  },
  {
    id: 22,
    name: "IVR Confirmation Template",
    description: "IVR confirmation message with transaction summary",
    isActive: true,
    metadataValue: "IVR",
    text_body:
      "Your {{transaction_type}} has been confirmed. Amount: {{amount}}. Reference: {{reference}}. Thank you for using {{company_name}}.",
    variables: {
      transaction_type: "payment",
      amount: "KES 1,000",
      reference: "TXN123456",
      company_name: "Sentra",
    },
    created_at: "2025-02-01T10:25:00Z",
    updated_at: "2025-02-01T10:25:00Z",
  },
];

// Hardcoded reward types data
const hardcodedRewardTypes: TypeConfigurationItem[] = [
  {
    id: 1,
    name: "Bundle Reward",
    description: "Provision data, voice, or SMS bundles as rewards",
    isActive: true,
    metadataValue: "bundle",
    created_at: "2025-02-01T11:00:00Z",
    updated_at: "2025-02-01T11:00:00Z",
  },
  {
    id: 2,
    name: "Points Reward",
    description: "Allocate loyalty or experience points",
    isActive: true,
    metadataValue: "points",
    created_at: "2025-02-01T11:05:00Z",
    updated_at: "2025-02-01T11:05:00Z",
  },
  {
    id: 3,
    name: "Discount Reward",
    description: "Percentage or amount-based discounts on future purchases",
    isActive: true,
    metadataValue: "discount",
    created_at: "2025-02-01T11:10:00Z",
    updated_at: "2025-02-01T11:10:00Z",
  },
  {
    id: 4,
    name: "Cashback Reward",
    description: "Cashback credited to customer wallet or account balance",
    isActive: true,
    metadataValue: "cashback",
    created_at: "2025-02-01T11:15:00Z",
    updated_at: "2025-02-01T11:15:00Z",
  },
  {
    id: 5,
    name: "Custom Fulfilment",
    description: "Custom reward fulfilment with bespoke business logic",
    isActive: false,
    metadataValue: "custom",
    created_at: "2025-02-01T11:20:00Z",
    updated_at: "2025-02-01T11:20:00Z",
  },
];

// Hardcoded communication channels data
const hardcodedCommunicationChannels: TypeConfigurationItem[] = [
  {
    id: 1,
    name: "SMS - Normal",
    description: "Standard SMS delivery routed via telecom SMSC",
    isActive: true,
    created_at: "2025-02-01T10:00:00Z",
    updated_at: "2025-02-01T10:00:00Z",
  },
  {
    id: 2,
    name: "SMS - Flash",
    description: "Flash SMS (display only) used for urgent notifications",
    isActive: true,
    created_at: "2025-02-01T10:05:00Z",
    updated_at: "2025-02-01T10:05:00Z",
  },
  {
    id: 3,
    name: "Email",
    description: "Transactional and marketing email channel",
    isActive: true,
    created_at: "2025-02-01T10:10:00Z",
    updated_at: "2025-02-01T10:10:00Z",
  },
  {
    id: 4,
    name: "USSD - Push",
    description: "Push USSD messages triggered automatically",
    isActive: false,
    created_at: "2025-02-01T10:15:00Z",
    updated_at: "2025-02-01T10:15:00Z",
  },
  {
    id: 5,
    name: "USSD - Interactive",
    description: "Interactive USSD menu journeys",
    isActive: true,
    created_at: "2025-02-01T10:20:00Z",
    updated_at: "2025-02-01T10:20:00Z",
  },
  {
    id: 6,
    name: "Push Notification",
    description: "Mobile app push via FCM/APNS",
    isActive: true,
    created_at: "2025-02-01T10:25:00Z",
    updated_at: "2025-02-01T10:25:00Z",
  },
];

// Hardcoded sender IDs data
const hardcodedSenderIds: TypeConfigurationItem[] = [
  {
    id: 1,
    name: "Effortel",
    description: "Sender ID for Effortel service communications",
    isActive: true,
    metadataValue: "active",
    created_at: "2025-01-16T09:15:00Z",
    updated_at: "2025-01-18T16:20:00Z",
  },
  {
    id: 3,
    name: "Equitel",
    description: "Sender ID for Equitel mobile network communications",
    isActive: true,
    metadataValue: "active",
    created_at: "2025-01-17T11:00:00Z",
    updated_at: "2025-01-19T13:30:00Z",
  },
  {
    id: 4,
    name: "EquitelKE",
    description: "Sender ID for Equitel Kenya communications",
    isActive: true,
    metadataValue: "active",
    created_at: "2025-01-18T15:30:00Z",
    updated_at: "2025-01-21T10:15:00Z",
  },
  {
    id: 5,
    name: "EquitelAlert",
    description: "Sender ID for alert and notification messages",
    isActive: true,
    metadataValue: "active",
    created_at: "2025-01-19T08:45:00Z",
    updated_at: "2025-01-22T12:00:00Z",
  },
  {
    id: 6,
    name: "EquitelPromo",
    description: "Sender ID for promotional messages",
    isActive: true,
    metadataValue: "active",
    created_at: "2025-01-20T10:00:00Z",
    updated_at: "2025-01-23T12:00:00Z",
  },
];

// Hardcoded SMS routes/gateways data
const hardcodedSMSRoutes: TypeConfigurationItem[] = [
  {
    id: 1,
    name: "Route 1",
    description: "SMS route configuration",
    isActive: true,
    metadataValue: "Route1",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-20T14:45:00Z",
  },
  {
    id: 2,
    name: "Route 2",
    description: "SMS route configuration",
    isActive: true,
    metadataValue: "Route2",
    created_at: "2025-01-16T09:15:00Z",
    updated_at: "2025-01-18T16:20:00Z",
  },
  {
    id: 3,
    name: "Route 3",
    description: "SMS route configuration",
    isActive: true,
    metadataValue: "Route3",
    created_at: "2025-01-17T11:00:00Z",
    updated_at: "2025-01-19T13:30:00Z",
  },
  {
    id: 4,
    name: "Route 4",
    description: "SMS route configuration",
    isActive: true,
    metadataValue: "Route4",
    created_at: "2025-01-18T15:30:00Z",
    updated_at: "2025-01-21T10:15:00Z",
  },
  {
    id: 5,
    name: "Route 5",
    description: "SMS route configuration",
    isActive: true,
    metadataValue: "Route5",
    created_at: "2025-01-19T08:45:00Z",
    updated_at: "2025-01-22T12:00:00Z",
  },
];

// Hardcoded languages/locales data
const hardcodedLanguages: TypeConfigurationItem[] = [
  {
    id: 1,
    name: "English",
    description: "English language (generic)",
    isActive: true,
    metadataValue: "en",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-20T14:45:00Z",
  },
  {
    id: 2,
    name: "English (US)",
    description: "English language for United States",
    isActive: true,
    metadataValue: "en-US",
    created_at: "2025-01-16T09:15:00Z",
    updated_at: "2025-01-18T16:20:00Z",
  },
  {
    id: 3,
    name: "English (UK)",
    description: "English language for United Kingdom",
    isActive: true,
    metadataValue: "en-GB",
    created_at: "2025-01-17T11:00:00Z",
    updated_at: "2025-01-19T13:30:00Z",
  },
  {
    id: 4,
    name: "French",
    description: "French language (generic)",
    isActive: true,
    metadataValue: "fr",
    created_at: "2025-01-18T15:30:00Z",
    updated_at: "2025-01-21T10:15:00Z",
  },
  {
    id: 5,
    name: "French (Canada)",
    description: "French language for Canada",
    isActive: true,
    metadataValue: "fr-CA",
    created_at: "2025-01-19T08:45:00Z",
    updated_at: "2025-01-22T12:00:00Z",
  },
  {
    id: 6,
    name: "French (France)",
    description: "French language for France",
    isActive: true,
    metadataValue: "fr-FR",
    created_at: "2025-01-20T14:20:00Z",
    updated_at: "2025-01-23T09:30:00Z",
  },
  {
    id: 7,
    name: "Spanish",
    description: "Spanish language (generic)",
    isActive: true,
    metadataValue: "es",
    created_at: "2025-01-21T10:15:00Z",
    updated_at: "2025-01-24T11:00:00Z",
  },
  {
    id: 8,
    name: "Spanish (Spain)",
    description: "Spanish language for Spain",
    isActive: true,
    metadataValue: "es-ES",
    created_at: "2025-01-22T12:00:00Z",
    updated_at: "2025-01-25T14:00:00Z",
  },
  {
    id: 9,
    name: "Spanish (Mexico)",
    description: "Spanish language for Mexico",
    isActive: true,
    metadataValue: "es-MX",
    created_at: "2025-01-23T13:30:00Z",
    updated_at: "2025-01-26T15:30:00Z",
  },
  {
    id: 10,
    name: "Swahili",
    description: "Swahili language (generic)",
    isActive: true,
    metadataValue: "sw",
    created_at: "2025-01-24T09:00:00Z",
    updated_at: "2025-01-27T10:00:00Z",
  },
  {
    id: 11,
    name: "Swahili (Uganda)",
    description: "Swahili language for Uganda",
    isActive: true,
    metadataValue: "sw-UG",
    created_at: "2025-01-25T11:00:00Z",
    updated_at: "2025-01-28T12:00:00Z",
  },
  {
    id: 12,
    name: "Swahili (Kenya)",
    description: "Swahili language for Kenya",
    isActive: true,
    metadataValue: "sw-KE",
    created_at: "2025-01-26T14:00:00Z",
    updated_at: "2025-01-29T13:00:00Z",
  },
  {
    id: 13,
    name: "German",
    description: "German language (generic)",
    isActive: true,
    metadataValue: "de",
    created_at: "2025-01-27T10:30:00Z",
    updated_at: "2025-01-30T14:30:00Z",
  },
  {
    id: 14,
    name: "German (Germany)",
    description: "German language for Germany",
    isActive: true,
    metadataValue: "de-DE",
    created_at: "2025-01-28T12:00:00Z",
    updated_at: "2025-01-31T15:00:00Z",
  },
  {
    id: 15,
    name: "Arabic",
    description: "Arabic language (generic)",
    isActive: true,
    metadataValue: "ar",
    created_at: "2025-01-29T13:30:00Z",
    updated_at: "2025-02-01T16:00:00Z",
  },
  {
    id: 16,
    name: "Arabic (Saudi Arabia)",
    description: "Arabic language for Saudi Arabia",
    isActive: true,
    metadataValue: "ar-SA",
    created_at: "2025-01-30T15:00:00Z",
    updated_at: "2025-02-02T17:00:00Z",
  },
  {
    id: 17,
    name: "Portuguese",
    description: "Portuguese language (generic)",
    isActive: true,
    metadataValue: "pt",
    created_at: "2025-01-31T11:00:00Z",
    updated_at: "2025-02-03T18:00:00Z",
  },
  {
    id: 18,
    name: "Portuguese (Brazil)",
    description: "Portuguese language for Brazil",
    isActive: true,
    metadataValue: "pt-BR",
    created_at: "2025-02-01T14:00:00Z",
    updated_at: "2025-02-04T19:00:00Z",
  },
  {
    id: 19,
    name: "Portuguese (Portugal)",
    description: "Portuguese language for Portugal",
    isActive: true,
    metadataValue: "pt-PT",
    created_at: "2025-02-02T16:00:00Z",
    updated_at: "2025-02-05T20:00:00Z",
  },
];

// Campaign Objectives Configuration
export const campaignObjectivesConfig: ConfigurationPageConfig = {
  // Page configuration
  title: "Campaign Objectives",
  subtitle: "Define and manage your campaign objectives",
  entityName: "objective",
  entityNamePlural: "objectives",
  configType: "campaignObjectives",

  // Navigation
  backPath: "/dashboard/configuration",

  // UI
  icon: Flag,
  searchPlaceholder: "Search objectives by name or description...",

  // Data
  initialData: hardcodedObjectives,

  // Labels
  createButtonText: "Create Objective",
  modalTitle: {
    create: "Create New Campaign Objective",
    edit: "Edit Campaign Objective",
  },
  nameLabel: "Objective Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,

  // Validation
  nameMaxLength: 100,
  descriptionMaxLength: 500,

  // Messages
  deleteConfirmTitle: "Delete Objective",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Objective created successfully",
  updateSuccessMessage: "Objective updated successfully",
  deleteErrorMessage: "Failed to delete objective",
  saveErrorMessage: "Please try again later.",
};

// Departments Configuration
export const departmentsConfig: ConfigurationPageConfig = {
  // Page configuration
  title: "Departments",
  subtitle: "Define and manage your departments",
  entityName: "department",
  entityNamePlural: "departments",
  configType: "departments",

  // Navigation
  backPath: "/dashboard/configuration",

  // UI
  icon: Building2,
  searchPlaceholder: "Search departments by name or description...",

  // Data
  initialData: hardcodedDepartments,

  // Labels
  createButtonText: "Create Department",
  modalTitle: {
    create: "Create New Department",
    edit: "Edit Department",
  },
  nameLabel: "Department Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,

  // Validation
  nameMaxLength: 100,
  descriptionMaxLength: 500,

  // Messages
  deleteConfirmTitle: "Delete Department",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Department created successfully",
  updateSuccessMessage: "Department updated successfully",
  deleteErrorMessage: "Failed to delete department",
  saveErrorMessage: "Please try again later.",
};

// Team Roles Configuration
export const teamRolesConfig: ConfigurationPageConfig = {
  // Page configuration
  title: "Team Roles",
  subtitle: "Define and manage team roles and responsibilities",
  entityName: "role",
  entityNamePlural: "roles",

  // Navigation
  backPath: "/dashboard/configuration",

  // UI
  icon: Users,
  searchPlaceholder: "Search roles by name or description...",

  // Data
  initialData: hardcodedTeamRoles,

  // Labels
  createButtonText: "Create Role",
  modalTitle: {
    create: "Create New Team Role",
    edit: "Edit Team Role",
  },
  nameLabel: "Role Name",
  nameRequired: true,
  descriptionLabel: "Role Description",
  descriptionRequired: true,

  // Validation
  nameMaxLength: 80,
  descriptionMaxLength: 300,

  // Messages
  deleteConfirmTitle: "Delete Role",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete the role "${name}"? This action cannot be undone.`,
  deleteSuccessMessage: (name: string) =>
    `Role "${name}" has been deleted successfully.`,
  createSuccessMessage: "Team role created successfully",
  updateSuccessMessage: "Team role updated successfully",
  deleteErrorMessage: "Failed to delete team role",
  saveErrorMessage: "Please try again later.",
};

// Line of Business Configuration
export const lineOfBusinessConfig: ConfigurationPageConfig = {
  // Page configuration
  title: "Line of Business",
  subtitle: "Define and manage your business lines and services",
  entityName: "business line",
  entityNamePlural: "business lines",
  configType: "lineOfBusiness",

  // Navigation
  backPath: "/dashboard/configuration",

  // UI
  icon: Briefcase,
  searchPlaceholder: "Search business lines by name or description...",

  // Data
  initialData: hardcodedLineOfBusiness,

  // Labels
  createButtonText: "Create Business Line",
  modalTitle: {
    create: "Create New Line of Business",
    edit: "Edit Line of Business",
  },
  nameLabel: "Business Line Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,

  // Validation
  nameMaxLength: 100,
  descriptionMaxLength: 500,

  // Messages
  deleteConfirmTitle: "Delete Business Line",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Business line created successfully",
  updateSuccessMessage: "Business line updated successfully",
  deleteErrorMessage: "Failed to delete business line",
  saveErrorMessage: "Please try again later.",
};

// Tracking Sources Configuration (Offer)
export const trackingSourcesConfig: ConfigurationPageConfig = {
  title: "Offer Tracking Sources",
  subtitle:
    "Manage tracking sources for measuring offer performance and analytics",
  entityName: "tracking source",
  entityNamePlural: "tracking sources",
  configType: "trackingSources",
  backPath: "/dashboard/configuration",
  icon: Share2,
  searchPlaceholder: "Search tracking sources...",
  initialData: hardcodedTrackingSources,
  createButtonText: "Add Tracking Source",
  modalTitle: {
    create: "Create Tracking Source",
    edit: "Edit Tracking Source",
  },
  nameLabel: "Tracking Source Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,
  nameMaxLength: 120,
  descriptionMaxLength: 600,
  deleteConfirmTitle: "Delete Tracking Source",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"?`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Tracking source created successfully",
  updateSuccessMessage: "Tracking source updated successfully",
  deleteErrorMessage: "Failed to delete tracking source",
  saveErrorMessage: "Please try again later.",
};

// Creative Templates Configuration
export const creativeTemplatesConfig: TypeConfigurationPageConfig = {
  title: "Creative Templates",
  subtitle:
    "Manage reusable creative templates for SMS, Email, Push, and other channels",
  entityName: "creative template",
  entityNamePlural: "creative templates",
  configType: "creativeTemplates",
  backPath: "/dashboard/configuration",
  icon: Palette,
  searchPlaceholder: "Search creative templates...",
  initialData: hardcodedCreativeTemplates,
  createButtonText: "Create Creative Template",
  modalTitle: {
    create: "Create Creative Template",
    edit: "Edit Creative Template",
  },
  nameLabel: "Template Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,
  nameMaxLength: 120,
  descriptionMaxLength: 600,
  metadataField: {
    label: "Primary Channel",
    type: "text",
    placeholder: "e.g., SMS, Email, Push",
  },
  statusLabel: "Status",
  deleteConfirmTitle: "Delete Creative Template",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"? This does not remove existing creatives.`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Creative template created successfully",
  updateSuccessMessage: "Creative template updated successfully",
  deleteErrorMessage: "Failed to delete creative template",
  saveErrorMessage: "Please try again later.",
};

// Reward Types Configuration
export const rewardTypesConfig: TypeConfigurationPageConfig = {
  title: "Reward Types",
  subtitle: "Define reusable reward fulfilment types for offer rewards",
  entityName: "reward type",
  entityNamePlural: "reward types",
  configType: "rewardTypes",
  backPath: "/dashboard/configuration",
  icon: Gift,
  searchPlaceholder: "Search reward types...",
  initialData: hardcodedRewardTypes,
  createButtonText: "Create Reward Type",
  modalTitle: {
    create: "Create Reward Type",
    edit: "Edit Reward Type",
  },
  nameLabel: "Reward Type Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,
  nameMaxLength: 120,
  descriptionMaxLength: 600,
  metadataField: {
    label: "Fulfilment Key",
    type: "text",
    placeholder: "e.g., bundle, points, discount",
  },
  statusLabel: "Status",
  deleteConfirmTitle: "Delete Reward Type",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"?`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Reward type created successfully",
  updateSuccessMessage: "Reward type updated successfully",
  deleteErrorMessage: "Failed to delete reward type",
  saveErrorMessage: "Please try again later.",
};

// Hardcoded offer types data
const hardcodedOfferTypes: TypeConfigurationItem[] = [
  {
    id: 1,
    name: "Data",
    description: "Data bundle offers and packages",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z",
    isActive: true,
  },
  {
    id: 2,
    name: "Voice",
    description: "Voice call offers and packages",
    created_at: "2025-01-16T09:15:00Z",
    updated_at: "2025-01-16T09:15:00Z",
    isActive: true,
  },
  {
    id: 3,
    name: "SMS",
    description: "SMS text message offers and packages",
    created_at: "2025-01-17T11:00:00Z",
    updated_at: "2025-01-17T11:00:00Z",
    isActive: true,
  },
  {
    id: 4,
    name: "Combo",
    description: "Combined data, voice, and SMS packages",
    created_at: "2025-01-18T15:30:00Z",
    updated_at: "2025-01-18T15:30:00Z",
    isActive: true,
  },
  {
    id: 5,
    name: "Voucher",
    description: "Voucher-based offers and discounts",
    created_at: "2025-01-19T08:45:00Z",
    updated_at: "2025-01-19T08:45:00Z",
    isActive: true,
  },
  {
    id: 6,
    name: "Loyalty",
    description: "Loyalty program offers and rewards",
    created_at: "2025-01-20T14:20:00Z",
    updated_at: "2025-01-20T14:20:00Z",
    isActive: true,
  },
  {
    id: 7,
    name: "Bundle",
    description: "Product or service bundle packages",
    created_at: "2025-01-21T10:15:00Z",
    updated_at: "2025-01-21T10:15:00Z",
    isActive: true,
  },
  {
    id: 8,
    name: "Bonus",
    description: "Bonus value and extra benefits",
    created_at: "2025-01-22T12:00:00Z",
    updated_at: "2025-01-22T12:00:00Z",
    isActive: true,
  },
];

// Hardcoded campaign types data
const hardcodedCampaignTypes: TypeConfigurationItem[] = [
  {
    id: 1,
    name: "Multiple Target Group",
    description:
      "Target multiple segments with different offers for each segment",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z",
    isActive: true,
  },
  {
    id: 2,
    name: "Champion-Challenger",
    description: "Test challenger strategies against a champion segment",
    created_at: "2025-01-16T09:15:00Z",
    updated_at: "2025-01-16T09:15:00Z",
    isActive: true,
  },
  {
    id: 3,
    name: "A/B Test",
    description: "Compare two variants (A and B) with equal distribution",
    created_at: "2025-01-17T11:00:00Z",
    updated_at: "2025-01-17T11:00:00Z",
    isActive: true,
  },
  {
    id: 4,
    name: "Round Robin",
    description: "Sequential offer rotation based on time intervals",
    created_at: "2025-01-18T15:30:00Z",
    updated_at: "2025-01-18T15:30:00Z",
    isActive: true,
  },
  {
    id: 5,
    name: "Multiple Level",
    description: "Conditional offer mapping with behavioral triggers",
    created_at: "2025-01-19T08:45:00Z",
    updated_at: "2025-01-19T08:45:00Z",
    isActive: true,
  },
];

// Hardcoded segment types data
const hardcodedSegmentTypes: TypeConfigurationItem[] = [
  {
    id: 1,
    name: "Static",
    description:
      "Manually curated member lists that remain fixed until explicitly updated",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z",
    isActive: true,
  },
  {
    id: 2,
    name: "Dynamic",
    description:
      "Rule-driven segments that recalculate membership based on the latest customer data",
    created_at: "2025-01-16T09:15:00Z",
    updated_at: "2025-01-16T09:15:00Z",
    isActive: true,
  },
  {
    id: 3,
    name: "Predictive",
    description:
      "Model-led segments produced by machine learning scoring or propensity models",
    created_at: "2025-01-17T11:00:00Z",
    updated_at: "2025-01-17T11:00:00Z",
    isActive: true,
  },
  {
    id: 4,
    name: "Behavioral",
    description:
      "Segments based on customer activity signals like recency, frequency, or channel engagement",
    created_at: "2025-01-18T15:30:00Z",
    updated_at: "2025-01-18T15:30:00Z",
    isActive: true,
  },
  {
    id: 5,
    name: "Demographic",
    description:
      "Grouping built around demographic attributes such as age, region, or income band",
    created_at: "2025-01-19T08:45:00Z",
    updated_at: "2025-01-19T08:45:00Z",
    isActive: true,
  },
  {
    id: 6,
    name: "Geographic",
    description:
      "Location-based segmentation using country, region, or site-level metadata",
    created_at: "2025-01-20T14:20:00Z",
    updated_at: "2025-01-20T14:20:00Z",
    isActive: true,
  },
  {
    id: 7,
    name: "Transactional",
    description:
      "Built using spend, frequency, or specific purchase patterns from billing and POS systems",
    created_at: "2025-01-21T10:15:00Z",
    updated_at: "2025-01-21T10:15:00Z",
    isActive: true,
  },
];

// Hardcoded product types data
const hardcodedProductTypes: TypeConfigurationItem[] = [
  {
    id: 1,
    name: "Data Products",
    description:
      "Mobile data bundles, internet packages, and data-related services",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z",
    isActive: true,
    metadataValue: 25,
  },
  {
    id: 2,
    name: "Voice Products",
    description: "Call minutes, voice packages, and communication services",
    created_at: "2025-01-16T09:15:00Z",
    updated_at: "2025-01-16T09:15:00Z",
    isActive: true,
    metadataValue: 18,
  },
  {
    id: 3,
    name: "SMS Products",
    description: "Text messaging packages and SMS-based services",
    created_at: "2025-01-17T11:00:00Z",
    updated_at: "2025-01-17T11:00:00Z",
    isActive: true,
    metadataValue: 12,
  },
  {
    id: 4,
    name: "Value Added Services",
    description:
      "Additional services like music streaming, gaming, and content",
    created_at: "2025-01-18T15:30:00Z",
    updated_at: "2025-01-18T15:30:00Z",
    isActive: true,
    metadataValue: 8,
  },
  {
    id: 5,
    name: "Device Products",
    description: "Mobile devices, accessories, and hardware products",
    created_at: "2025-01-19T08:45:00Z",
    updated_at: "2025-01-19T08:45:00Z",
    isActive: false,
    metadataValue: 5,
  },
];

// Offer Types Configuration
export const offerTypesConfig: TypeConfigurationPageConfig = {
  // Page configuration
  title: "Offer Types",
  subtitle:
    "Define and manage different types of offers available in your system",
  entityName: "offer type",
  entityNamePlural: "offer types",
  configType: "offerTypes",

  // Navigation
  backPath: "/dashboard/configuration",

  // UI
  icon: Tag,
  searchPlaceholder: "Search offer types by name or description...",

  // Data
  initialData: hardcodedOfferTypes,

  // Labels
  createButtonText: "Create Offer Type",
  modalTitle: {
    create: "Create New Offer Type",
    edit: "Edit Offer Type",
  },
  nameLabel: "Offer Type Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,

  // Validation
  nameMaxLength: 100,
  descriptionMaxLength: 500,

  // Messages
  deleteConfirmTitle: "Delete Offer Type",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Offer type created successfully",
  updateSuccessMessage: "Offer type updated successfully",
  deleteErrorMessage: "Failed to delete offer type",
  saveErrorMessage: "Please try again later.",
};

// Campaign Types Configuration
export const campaignTypesConfig: TypeConfigurationPageConfig = {
  // Page configuration
  title: "Campaign Types",
  subtitle:
    "Define and manage different types of campaigns available in your system",
  entityName: "campaign type",
  entityNamePlural: "campaign types",
  configType: "campaignTypes",

  // Navigation
  backPath: "/dashboard/configuration",

  // UI
  icon: Megaphone,
  searchPlaceholder: "Search campaign types by name or description...",

  // Data
  initialData: hardcodedCampaignTypes,

  // Labels
  createButtonText: "Create Campaign Type",
  modalTitle: {
    create: "Create New Campaign Type",
    edit: "Edit Campaign Type",
  },
  nameLabel: "Campaign Type Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,

  // Validation
  nameMaxLength: 100,
  descriptionMaxLength: 500,

  // Messages
  deleteConfirmTitle: "Delete Campaign Type",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Campaign type created successfully",
  updateSuccessMessage: "Campaign type updated successfully",
  deleteErrorMessage: "Failed to delete campaign type",
  saveErrorMessage: "Please try again later.",
};

// Segment Types Configuration
export const segmentTypesConfig: TypeConfigurationPageConfig = {
  // Page configuration
  title: "Segment Types",
  subtitle:
    "Define and manage different types of segments available in your system",
  entityName: "segment type",
  entityNamePlural: "segment types",
  configType: "segmentTypes",

  // Navigation
  backPath: "/dashboard/configuration",

  // UI
  icon: Layers,
  searchPlaceholder: "Search segment types by name or description...",

  // Data
  initialData: hardcodedSegmentTypes,

  // Labels
  createButtonText: "Create Segment Type",
  modalTitle: {
    create: "Create New Segment Type",
    edit: "Edit Segment Type",
  },
  nameLabel: "Segment Type Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,

  // Validation
  nameMaxLength: 100,
  descriptionMaxLength: 500,

  // Messages
  deleteConfirmTitle: "Delete Segment Type",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Segment type created successfully",
  updateSuccessMessage: "Segment type updated successfully",
  deleteErrorMessage: "Failed to delete segment type",
  saveErrorMessage: "Please try again later.",
};

// Product Types Configuration
export const productTypesConfig: TypeConfigurationPageConfig = {
  title: "Product Types",
  subtitle: "Define and manage different types of products in your catalog",
  entityName: "product type",
  entityNamePlural: "product types",
  configType: "productTypes",
  backPath: "/dashboard/products",
  icon: Briefcase,
  searchPlaceholder: "Search product types by name or description...",
  initialData: hardcodedProductTypes,
  createButtonText: "Create Product Type",
  modalTitle: {
    create: "Create New Product Type",
    edit: "Edit Product Type",
  },
  nameLabel: "Product Type Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,
  nameMaxLength: 120,
  descriptionMaxLength: 600,
  statusLabel: "Status",
  metadataField: {
    label: "Associated Products",
    type: "number",
    placeholder: "Enter number of products",
  },
  deleteConfirmTitle: "Delete Product Type",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Product type created successfully",
  updateSuccessMessage: "Product type updated successfully",
  deleteErrorMessage: "Failed to delete product type",
  saveErrorMessage: "Please try again later.",
};

// Communication Channels Configuration
export const communicationChannelsConfig: TypeConfigurationPageConfig = {
  title: "Communication Channels",
  subtitle:
    "Manage channels such as SMS, Email, USSD, Push and control their availability",
  entityName: "communication channel",
  entityNamePlural: "communication channels",
  configType: "communicationChannels",
  backPath: "/dashboard/configuration",
  icon: MessageSquare,
  searchPlaceholder: "Search channels...",
  initialData: hardcodedCommunicationChannels,
  createButtonText: "Create Channel",
  modalTitle: {
    create: "Create Communication Channel",
    edit: "Edit Communication Channel",
  },
  nameLabel: "Channel Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,
  nameMaxLength: 120,
  descriptionMaxLength: 600,
  deleteConfirmTitle: "Delete Channel",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"?`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Communication channel created successfully",
  updateSuccessMessage: "Communication channel updated successfully",
  deleteErrorMessage: "Failed to delete communication channel",
  saveErrorMessage: "Please try again later.",
};

// Sender IDs Configuration
export const senderIdsConfig: TypeConfigurationPageConfig = {
  title: "Sender IDs",
  subtitle:
    "Manage SMS sender IDs for branding and compliance. Only Super Admins can create or modify sender IDs.",
  entityName: "sender ID",
  entityNamePlural: "sender IDs",
  configType: "senderIds",
  backPath: "/dashboard/configuration",
  icon: MessageSquare,
  searchPlaceholder: "Search sender IDs...",
  initialData: hardcodedSenderIds,
  createButtonText: "Create Sender ID",
  modalTitle: {
    create: "Create New Sender ID",
    edit: "Edit Sender ID",
  },
  nameLabel: "Sender ID Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,
  nameMaxLength: 12, // Sender IDs are typically 3-12 characters
  descriptionMaxLength: 500,
  statusLabel: "Status",
  deleteConfirmTitle: "Delete Sender ID",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"? This may affect existing SMS creatives.`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Sender ID created successfully",
  updateSuccessMessage: "Sender ID updated successfully",
  deleteErrorMessage: "Failed to delete sender ID",
  saveErrorMessage: "Please try again later.",
};

// SMS Routes/Gateways Configuration
export const smsRoutesConfig: TypeConfigurationPageConfig = {
  title: "SMS Routes",
  subtitle:
    "Manage SMS gateway routes for message delivery. Routes determine which gateway provider is used to send SMS messages.",
  entityName: "SMS route",
  entityNamePlural: "SMS routes",
  configType: "smsRoutes",
  backPath: "/dashboard/configuration",
  icon: MessageSquare,
  searchPlaceholder: "Search routes...",
  initialData: hardcodedSMSRoutes,
  createButtonText: "Create Route",
  modalTitle: {
    create: "Create New SMS Route",
    edit: "Edit SMS Route",
  },
  nameLabel: "Route Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,
  nameMaxLength: 100,
  descriptionMaxLength: 500,
  metadataField: {
    label: "Gateway Provider",
    type: "text",
    placeholder: "e.g., MTN, Airtel, Aggregator",
  },
  statusLabel: "Status",
  deleteConfirmTitle: "Delete SMS Route",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"? This may affect SMS delivery.`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "SMS route created successfully",
  updateSuccessMessage: "SMS route updated successfully",
  deleteErrorMessage: "Failed to delete SMS route",
  saveErrorMessage: "Please try again later.",
};

// Languages/Locales Configuration
export const languagesConfig: TypeConfigurationPageConfig = {
  title: "Languages",
  subtitle:
    "Manage available languages and locales for offer creatives. Each language can be used to create localized message content.",
  entityName: "language",
  entityNamePlural: "languages",
  configType: "languages",
  backPath: "/dashboard/configuration",
  icon: Globe,
  searchPlaceholder: "Search languages...",
  initialData: hardcodedLanguages,
  createButtonText: "Create Language",
  modalTitle: {
    create: "Create New Language",
    edit: "Edit Language",
  },
  nameLabel: "Language Name",
  nameRequired: true,
  descriptionLabel: "Description",
  descriptionRequired: false,
  nameMaxLength: 100,
  descriptionMaxLength: 500,
  metadataField: {
    label: "Locale Code",
    type: "text",
    placeholder: "e.g., en, fr-CA, sw-UG",
  },
  statusLabel: "Status",
  deleteConfirmTitle: "Delete Language",
  deleteConfirmMessage: (name: string) =>
    `Are you sure you want to delete "${name}"? This may affect existing creatives using this language.`,
  deleteSuccessMessage: (name: string) =>
    `"${name}" has been deleted successfully.`,
  createSuccessMessage: "Language created successfully",
  updateSuccessMessage: "Language updated successfully",
  deleteErrorMessage: "Failed to delete language",
  saveErrorMessage: "Please try again later.",
};

// Helper function to create new configuration easily
export function createConfigurationPageConfig(
  overrides: Partial<ConfigurationPageConfig>
): ConfigurationPageConfig {
  return {
    // Default values
    title: "Configuration",
    subtitle: "Manage configuration items",
    entityName: "item",
    entityNamePlural: "items",
    backPath: "/dashboard/configuration",
    icon: Flag,
    searchPlaceholder: "Search items...",
    initialData: [],
    createButtonText: "Create Item",
    modalTitle: {
      create: "Create New Item",
      edit: "Edit Item",
    },
    nameLabel: "Name",
    nameRequired: true,
    descriptionLabel: "Description",
    descriptionRequired: false,
    nameMaxLength: 100,
    descriptionMaxLength: 500,
    deleteConfirmTitle: "Delete Item",
    deleteConfirmMessage: (name: string) =>
      `Are you sure you want to delete "${name}"?`,
    deleteSuccessMessage: (name: string) =>
      `"${name}" has been deleted successfully.`,
    createSuccessMessage: "Item created successfully",
    updateSuccessMessage: "Item updated successfully",
    deleteErrorMessage: "Failed to delete item",
    saveErrorMessage: "Please try again later.",

    // Apply overrides
    ...overrides,
  };
}
