import {
  buildApiUrl,
  getAuthHeaders,
} from "../../../shared/services/api";

const BASE_URL = buildApiUrl("");

export type MicaDurationType = "days" | "hours" | "minutes";
export type MicaAction = "add" | "remove";

export interface BonusUnit {
  unitTypeID: number;
  unitAmount: number;
  unitDurationType: MicaDurationType;
  unitDurationPeriod: number;
}

export interface BonusUnitsSubscriber {
  msisdn: string;
  action: MicaAction;
  transactionID: string;
  bonusUnits: BonusUnit[];
}

export interface BonusAirtimeSubscriber {
  msisdn: string;
  action: MicaAction;
  transactionID: string;
  externalRef?: string;
  amount: number;
  durationType: MicaDurationType;
  durationPeriod: number;
}

export interface BonusUnitsRequest {
  channel: string;
  subscriber: BonusUnitsSubscriber[];
}

export interface BonusAirtimeRequest {
  channel: string;
  subscriber: BonusAirtimeSubscriber[];
}

export interface MicaResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
  token?: string;
}

class MicaService {
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

    let body: T & { error?: string; message?: string };
    try {
      body = await response.json();
    } catch {
      throw new Error(`Request failed with status ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(
        body.error || body.message || `Request failed with status ${response.status}`,
      );
    }

    return body;
  }

  /**
   * POST /mica/bonus-units — Award bonus data/voice/SMS units via MICA
   */
  async sendBonusUnits(payload: BonusUnitsRequest): Promise<MicaResponse> {
    return this.request<MicaResponse>("/mica/bonus-units", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * POST /mica/bonus-airtime — Award airtime credit via MICA
   */
  async sendBonusAirtime(payload: BonusAirtimeRequest): Promise<MicaResponse> {
    return this.request<MicaResponse>("/mica/bonus-airtime", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * POST /mica/token — Fetch a fresh MICA OAuth token (debug)
   */
  async getToken(): Promise<MicaResponse> {
    return this.request<MicaResponse>("/mica/token", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  /**
   * DELETE /mica/token/cache — Clear cached MICA token
   */
  async clearTokenCache(): Promise<MicaResponse> {
    return this.request<MicaResponse>("/mica/token/cache", {
      method: "DELETE",
    });
  }
}

export const micaService = new MicaService();

/** Build a unique transaction reference for a test attempt */
export function createMicaTransactionId(prefix = "CVM_TEST"): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}_${stamp}_${rand}`;
}
