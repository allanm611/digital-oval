import {
  API_CONFIG,
  buildApiUrl,
  getAuthHeaders,
} from "../../../shared/services/api";
import { fetchWithAuthInterceptor } from "../../../shared/services/fetchInterceptor";
import { extractErrorMessage } from "../../../shared/utils/errorHandler";
import type {
  LoyaltyProgram,
  LoyaltyProgramListResult,
  LoyaltyProgramStats,
  LoyaltyProgramStatus,
  LoyaltyProgramWritePayload,
} from "../types/loyaltyProgram";
import { loyaltyProgramSampleStore } from "../data/loyaltyProgramSampleStore";
import {
  extractLoyaltyList,
  normalizeLoyaltyProgram,
  normalizeLoyaltyStats,
  programMatchesQuery,
} from "../utils/loyaltyProgramMapper";

/**
 * Loyalty program API.
 *
 * GET    /loyalty-programs?search&status&limit&offset&skipCache
 * GET    /loyalty-programs/stats
 * GET    /loyalty-programs/:id
 * POST   /loyalty-programs
 * PUT    /loyalty-programs/:id
 * POST   /loyalty-programs/:id/cancel
 *
 * List responses may be a bare array or `{ data, pagination: { total } }`.
 * `points_to: null` means Unlimited. Custom attributes belong to this
 * program only and are not profile-dictionary KPIs.
 */
const BASE_URL = buildApiUrl(API_CONFIG.ENDPOINTS.LOYALTY_PROGRAMS);

export class LoyaltyProgramApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "LoyaltyProgramApiError";
    this.status = status;
  }
}

export interface LoyaltyProgramQuery {
  search?: string;
  status?: LoyaltyProgramStatus | "all";
  page?: number;
  limit?: number;
}

class LoyaltyProgramService {
  /** Live wins for the session once any loyalty call succeeds. */
  private source: "unknown" | "live" | "sample" = "unknown";

  async list(query: LoyaltyProgramQuery = {}): Promise<LoyaltyProgramListResult> {
    if (this.source === "sample") return loyaltyProgramSampleStore.list(query);
    try {
      const live = await this.listFromApi(query);
      this.source = "live";
      return live;
    } catch (error) {
      if (!this.activateSamples(error)) throw error;
      return loyaltyProgramSampleStore.list(query);
    }
  }

  private async listFromApi(query: LoyaltyProgramQuery = {}): Promise<LoyaltyProgramListResult> {
    const limit = query.limit ?? 25;
    const page = query.page ?? 1;
    const offset = Math.max(0, page - 1) * limit;
    let extracted;
    try {
      extracted = await this.fetchList(query, limit, offset);
    } catch (error) {
      if (error instanceof LoyaltyProgramApiError && error.status === 404) {
        throw new LoyaltyProgramApiError(
          "Loyalty programs are not available from the server yet.",
          404,
        );
      }
      throw error;
    }
    const reportedTotal = extracted.total ?? extracted.rows.length;
    const serverPaginated =
      extracted.sawPagination && reportedTotal > extracted.rows.length;

    if (serverPaginated) {
      return {
        items: this.normalizeRows(extracted.rows),
        total: reportedTotal,
        serverPaginated: true,
        source: "live",
      };
    }

    let rows = extracted.rows;
    const serverMayHaveTruncated =
      rows.length >= limit &&
      (offset > 0 || !extracted.sawPagination || reportedTotal <= rows.length);
    if (serverMayHaveTruncated) {
      try {
        const wide = await this.fetchList(query, 500, 0);
        if (wide.rows.length > rows.length) rows = wide.rows;
      } catch {
        // Keep the first page when the wider catalog read fails.
      }
    }

    const items = this.normalizeRows(rows).filter((program) =>
      programMatchesQuery(program, query.search ?? "", query.status ?? "all"),
    );
    return { items, total: items.length, serverPaginated: false, source: "live" };
  }

  async getStats(): Promise<LoyaltyProgramStats | null> {
    if (this.source === "sample") return loyaltyProgramSampleStore.stats();
    try {
      const payload = await this.request<unknown>("/stats?skipCache=true");
      return normalizeLoyaltyStats(payload);
    } catch (error) {
      if (
        error instanceof LoyaltyProgramApiError &&
        (error.status === 404 || error.status === 501)
      ) {
        return this.source === "sample" ? loyaltyProgramSampleStore.stats() : null;
      }
      throw error;
    }
  }

  async getById(id: number): Promise<LoyaltyProgram> {
    if (this.source === "sample") return loyaltyProgramSampleStore.getById(id);
    try {
      const payload = await this.request<unknown>(`/${id}?skipCache=true`);
      const program = normalizeLoyaltyProgram(unwrapRecord(payload));
      if (!program) {
        throw new LoyaltyProgramApiError("This loyalty program was not found.", 404);
      }
      this.source = "live";
      return program;
    } catch (error) {
      if (!this.activateSamples(error)) throw error;
      return loyaltyProgramSampleStore.getById(id);
    }
  }

  async create(payload: LoyaltyProgramWritePayload): Promise<LoyaltyProgram> {
    if (this.source === "sample") return loyaltyProgramSampleStore.create(payload);
    try {
      const response = await this.request<unknown>("", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const program = normalizeLoyaltyProgram(unwrapRecord(response));
      if (!program) {
        throw new LoyaltyProgramApiError(
          "The program was saved, but the server response could not be read.",
          500,
        );
      }
      this.source = "live";
      return program;
    } catch (error) {
      if (!this.activateSamples(error)) throw error;
      return loyaltyProgramSampleStore.create(payload);
    }
  }

  async update(
    id: number,
    payload: LoyaltyProgramWritePayload,
  ): Promise<LoyaltyProgram> {
    if (this.source === "sample") {
      return loyaltyProgramSampleStore.update(id, payload);
    }
    try {
      const response = await this.request<unknown>(`/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const program = normalizeLoyaltyProgram(unwrapRecord(response));
      if (!program) {
        throw new LoyaltyProgramApiError(
          "The program was saved, but the server response could not be read.",
          500,
        );
      }
      this.source = "live";
      return program;
    } catch (error) {
      if (!this.activateSamples(error)) throw error;
      return loyaltyProgramSampleStore.update(id, payload);
    }
  }

  async cancel(id: number, updatedBy?: number): Promise<LoyaltyProgram> {
    if (this.source === "sample") return loyaltyProgramSampleStore.cancel(id);
    try {
      const response = await this.request<unknown>(`/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ updated_by: updatedBy ?? null }),
      });
      const program = normalizeLoyaltyProgram(unwrapRecord(response));
      this.source = "live";
      if (!program) return this.getById(id);
      return program;
    } catch (error) {
      if (!this.activateSamples(error)) throw error;
      return loyaltyProgramSampleStore.cancel(id);
    }
  }

  /**
   * Use the session catalog only before any live loyalty call has succeeded.
   * A missing route (404 or 501) or a network failure qualifies, in every
   * build, so the program flow can be walked through before the API exists.
   * A 500 does not, and a later successful live call locks this session to
   * the server.
   */
  private activateSamples(error: unknown): boolean {
    if (this.source === "live") return false;
    if (error instanceof LoyaltyProgramApiError) {
      if (error.status !== 404 && error.status !== 501) return false;
    } else if (!(error instanceof TypeError)) {
      return false;
    }
    this.source = "sample";
    return true;
  }

  private async fetchList(
    query: LoyaltyProgramQuery,
    limit: number,
    offset: number,
  ) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    params.set("skipCache", "true");
    if (query.search?.trim()) params.set("search", query.search.trim());
    if (query.status && query.status !== "all") params.set("status", query.status);
    const payload = await this.request<unknown>(`?${params.toString()}`);
    return extractLoyaltyList(payload);
  }

  private normalizeRows(rows: unknown[]): LoyaltyProgram[] {
    return rows
      .map((row) => normalizeLoyaltyProgram(row))
      .filter((program): program is LoyaltyProgram => program !== null);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetchWithAuthInterceptor(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new LoyaltyProgramApiError(
        extractErrorMessage(body, response.status),
        response.status,
      );
    }

    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  }
}

function unwrapRecord(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }
  const body = payload as { data?: unknown };
  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    return body.data;
  }
  return payload;
}

export const loyaltyProgramService = new LoyaltyProgramService();
