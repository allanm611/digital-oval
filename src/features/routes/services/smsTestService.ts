import {
  API_CONFIG,
  buildApiUrl,
  getAuthHeaders,
} from "../../../shared/services/api";

const BASE_URL = buildApiUrl("");

interface SMSTestRequest {
  msisdn: string;
  message: string;
  channel: "SMS" | "EMAIL" | "WHATSAPP" | "PUSH";
  sms_route_id?: number;
  sender_id?: number;
}

interface SMSTestResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    messageId?: string;
    status?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

class SMSTestService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        throw new Error("Request failed");
      } catch (err) {
        throw err;
      }
    }

    return response.json();
  }

  /**
   * POST /communications/test/sms - Send a test SMS
   * @param data SMS test request containing msisdn and message
   * @returns SMS test response with status and details
   */
  async sendTestSMS(data: SMSTestRequest): Promise<SMSTestResponse> {
    return this.request<SMSTestResponse>("/communications/test/sms", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const smsTestService = new SMSTestService();
