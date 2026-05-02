import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { EmailRoute, CreateEmailRouteRequest, UpdateEmailRouteRequest } from "../types/emailRoute";

const BASE_URL = buildApiUrl("/email-routes");

export const EMAIL_ROUTES_DUMMY_DATA: EmailRoute[] = [
  {
    id: 1,
    name: "SendGrid Production",
    description: "SendGrid SMTP for production email campaigns",
    gateway_provider: "SENDGRID",
    smtp_host: "smtp.sendgrid.net",
    smtp_port: 587,
    smtp_username: "apikey",
    smtp_password: "***hidden***",
    from_address: "noreply@company.com",
    is_active: true,
    created_at: "2026-01-15T10:30:00Z",
    updated_at: "2026-04-20T14:45:00Z",
  },
  {
    id: 2,
    name: "AWS SES Backup",
    description: "AWS SES for backup email delivery",
    gateway_provider: "AWS_SES",
    smtp_host: "email-smtp.us-east-1.amazonaws.com",
    smtp_port: 587,
    smtp_username: "ses-user",
    smtp_password: "***hidden***",
    from_address: "support@company.com",
    is_active: true,
    created_at: "2026-02-10T09:15:00Z",
    updated_at: "2026-04-18T16:20:00Z",
  },
  {
    id: 3,
    name: "Mailgun Staging",
    description: "Mailgun SMTP for staging environment",
    gateway_provider: "MAILGUN",
    smtp_host: "smtp.mailgun.org",
    smtp_port: 587,
    smtp_username: "postmaster@sandbox.mailgun.org",
    smtp_password: "***hidden***",
    from_address: "test@company.com",
    is_active: false,
    created_at: "2026-03-05T11:00:00Z",
    updated_at: "2026-04-15T13:30:00Z",
  },
];

class EmailRouteService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
    }

    return response.json();
  }

  async getAllRoutes() {
    try {
      const data = await this.request<{ success: boolean; data: EmailRoute[] }>("");
      return data.data;
    } catch (err) {
      return EMAIL_ROUTES_DUMMY_DATA;
    }
  }

  async getRouteById(id: number) {
    try {
      const data = await this.request<{ success: boolean; data: EmailRoute }>(
        `/${id}`
      );
      return data.data;
    } catch (err) {
      const route = EMAIL_ROUTES_DUMMY_DATA.find(r => r.id === id);
      if (route) return route;
      throw err;
    }
  }

  async createRoute(data: CreateEmailRouteRequest) {
    const response = await this.request<{ success: boolean; data: EmailRoute }>(
      "",
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }

  async updateRoute(id: number, data: UpdateEmailRouteRequest) {
    const response = await this.request<{ success: boolean; data: EmailRoute }>(
      `/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }

  async deleteRoute(id: number) {
    const response = await this.request<{ success: boolean; message: string }>(
      `/${id}`,
      {
        method: "DELETE",
      }
    );
    return response;
  }
}

export const emailRouteService = new EmailRouteService();
