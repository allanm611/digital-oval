import {
  EmailGatewayConfig,
  CreateEmailGatewayConfigRequest,
  UpdateEmailGatewayConfigRequest,
} from "../types/emailGatewayConfig";

export const EMAIL_GATEWAY_DUMMY_DATA: EmailGatewayConfig[] = [
  {
    id: 1,
    name: "SendGrid Production",
    description: "Primary SendGrid account for production emails",
    channel_type: "EMAIL",
    provider_type: "SENDGRID",
    is_active: true,
    credentials: {
      smtp_host: "smtp.sendgrid.net",
      smtp_port: 587,
      smtp_username: "apikey",
      smtp_password: "***hidden***",
      from_address: "noreply@company.com",
      tls_enabled: true,
      reply_to_address: "support@company.com",
    },
    created_at: "2026-01-15T10:30:00Z",
    updated_at: "2026-04-20T14:45:00Z",
  },
  {
    id: 2,
    name: "AWS SES Backup",
    description: "Backup email service using AWS SES",
    channel_type: "EMAIL",
    provider_type: "AWS_SES",
    is_active: true,
    credentials: {
      smtp_host: "email-smtp.us-east-1.amazonaws.com",
      smtp_port: 587,
      smtp_username: "ses-user",
      smtp_password: "***hidden***",
      from_address: "support@company.com",
      tls_enabled: true,
    },
    created_at: "2026-02-10T09:15:00Z",
    updated_at: "2026-04-18T16:20:00Z",
  },
  {
    id: 3,
    name: "Mailgun Staging",
    description: "Mailgun SMTP for staging environment",
    channel_type: "EMAIL",
    provider_type: "MAILGUN",
    is_active: false,
    credentials: {
      smtp_host: "smtp.mailgun.org",
      smtp_port: 587,
      smtp_username: "mailgun-user",
      smtp_password: "***hidden***",
      from_address: "test@company.com",
      tls_enabled: true,
    },
    created_at: "2026-03-05T11:00:00Z",
    updated_at: "2026-04-15T13:30:00Z",
  },
];

class EmailGatewayConfigService {
  getAllConfigs(): Promise<EmailGatewayConfig[]> {
    return Promise.resolve(EMAIL_GATEWAY_DUMMY_DATA);
  }

  getConfigById(id: number): Promise<EmailGatewayConfig> {
    const config = EMAIL_GATEWAY_DUMMY_DATA.find((c) => c.id === id);
    if (!config) return Promise.reject(new Error("Config not found"));
    return Promise.resolve(config);
  }

  createConfig(data: CreateEmailGatewayConfigRequest): Promise<EmailGatewayConfig> {
    const newConfig: EmailGatewayConfig = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(newConfig);
  }

  updateConfig(id: number, data: UpdateEmailGatewayConfigRequest): Promise<EmailGatewayConfig> {
    const config = EMAIL_GATEWAY_DUMMY_DATA.find((c) => c.id === id);
    const updatedConfig: EmailGatewayConfig = {
      id,
      ...data,
      created_at: config?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(updatedConfig);
  }

  deleteConfig(id: number): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: "Deleted" });
  }
}

export const emailGatewayConfigService = new EmailGatewayConfigService();
