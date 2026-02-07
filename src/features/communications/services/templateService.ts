import { MessageTemplate } from "../types/template";

const STORAGE_KEY = "sentra_message_templates";

class TemplateService {
  /**
   * Get all templates from localStorage
   */
  getTemplates(): MessageTemplate[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultTemplates();
    } catch (error) {
      console.error("Error loading templates:", error);
      return this.getDefaultTemplates();
    }
  }

  /**
   * Save a new template
   */
  saveTemplate(
    template: Omit<MessageTemplate, "id" | "createdAt" | "updatedAt">,
  ): MessageTemplate {
    const templates = this.getTemplates();
    const newTemplate: MessageTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    templates.push(newTemplate);
    this.saveToStorage(templates);
    return newTemplate;
  }

  /**
   * Update an existing template
   */
  updateTemplate(
    id: string,
    updates: Partial<Omit<MessageTemplate, "id" | "createdAt">>,
  ): MessageTemplate | null {
    const templates = this.getTemplates();
    const index = templates.findIndex((t) => t.id === id);

    if (index === -1) return null;

    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage(templates);
    return templates[index];
  }

  /**
   * Delete a template
   */
  deleteTemplate(id: string): boolean {
    const templates = this.getTemplates();
    const filtered = templates.filter((t) => t.id !== id);

    if (filtered.length === templates.length) return false;

    this.saveToStorage(filtered);
    return true;
  }

  /**
   * Get templates by channel
   */
  getTemplatesByChannel(channel: string): MessageTemplate[] {
    return this.getTemplates().filter((t) => t.channel === channel);
  }

  /**
   * Save templates to localStorage
   */
  private saveToStorage(templates: MessageTemplate[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error("Error saving templates:", error);
    }
  }

  /**
   * Get default templates
   */
  private getDefaultTemplates(): MessageTemplate[] {
    return [
      {
        id: "default_welcome_email",
        name: "Welcome Email",
        description: "Welcome message for new customers",
        channel: "EMAIL",
        subject: "Welcome to Sentra, {{first_name}}!",
        body: `<p>Dear <strong>{{first_name}} {{last_name}}</strong>,</p>
<p>Welcome to <strong style="color: #00BBCC;">Sentra</strong>! We're excited to have you on board.</p>
<p>Your account details:</p>
<ul>
  <li>Customer ID: {{customer_id}}</li>
  <li>Phone: {{msisdn}}</li>
</ul>
<p>Thank you for choosing us!</p>
<p><em>The Sentra Team</em></p>`,
        isRichText: true,
        variables: ["first_name", "last_name", "customer_id", "msisdn"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "default_promo_sms",
        name: "Promotional SMS",
        description: "Simple promotional message",
        channel: "SMS",
        body: "Hi {{first_name}}! 🎉 Special offer: Get 50% OFF on your next purchase. Use code: SAVE50. Valid until {{offer_end_date}}. Reply STOP to unsubscribe.",
        isRichText: false,
        variables: ["first_name", "offer_end_date"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "default_data_bundle",
        name: "Data Bundle Offer",
        description: "Data bundle promotional email",
        channel: "EMAIL",
        subject: "📱 Exclusive Data Bundle Offer for {{first_name}}",
        body: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #00BBCC;">Special Data Bundle Offer!</h2>
  <p>Hello <strong>{{first_name}}</strong>,</p>
  <p>We have an exclusive offer just for you:</p>
  <div style="background-color: #F0F9FF; padding: 20px; border-radius: 8px; border-left: 4px solid #00BBCC;">
    <h3 style="margin-top: 0; color: #00BBCC;">5GB Data Bundle</h3>
    <p style="font-size: 24px; font-weight: bold; color: #252829;">Only GHS 10</p>
    <p>Valid for 30 days</p>
  </div>
  <p>Reply <strong>YES</strong> to activate this offer now!</p>
  <p style="color: #666; font-size: 12px;">Offer expires in 48 hours</p>
</div>`,
        isRichText: true,
        variables: ["first_name"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}

export const templateService = new TemplateService();
