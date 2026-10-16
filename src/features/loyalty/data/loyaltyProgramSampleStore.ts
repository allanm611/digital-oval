import type {
  LoyaltyProgram,
  LoyaltyProgramListResult,
  LoyaltyProgramStats,
  LoyaltyProgramWritePayload,
} from "../types/loyaltyProgram";
import { createSampleLoyaltyRecords } from "./loyaltyProgramSamples";
import {
  normalizeLoyaltyProgram,
  programMatchesQuery,
  summarizeLoyaltyPrograms,
} from "../utils/loyaltyProgramMapper";

const STORAGE_KEY = "sentra.loyalty.sampleCatalog.v1";

/**
 * Session catalog used when /loyalty-programs is not available.
 * Create, edit, and cancel update this copy only. A refresh keeps the
 * walkthrough; a new browser session starts from the sample programs again.
 */
class LoyaltyProgramSampleStore {
  private programs = this.restore();

  list(query: {
    search?: string;
    status?: LoyaltyProgram["status"] | "all";
    page?: number;
    limit?: number;
  }): LoyaltyProgramListResult {
    const items = this.programs.filter((program) =>
      programMatchesQuery(program, query.search ?? "", query.status ?? "all"),
    );
    return {
      items: items.map(clone),
      total: items.length,
      serverPaginated: false,
      source: "sample",
    };
  }

  stats(): LoyaltyProgramStats {
    return summarizeLoyaltyPrograms(this.programs);
  }

  getById(id: number): LoyaltyProgram {
    const program = this.programs.find((item) => item.id === id);
    if (!program) {
      throw new Error("This loyalty program was not found.");
    }
    return clone(program);
  }

  create(payload: LoyaltyProgramWritePayload): LoyaltyProgram {
    const program = this.toProgram(this.nextId(), payload, null);
    this.programs = [program, ...this.programs];
    this.persist();
    return clone(program);
  }

  update(id: number, payload: LoyaltyProgramWritePayload): LoyaltyProgram {
    const current = this.programs.find((item) => item.id === id);
    if (!current) {
      throw new Error("This loyalty program was not found.");
    }
    if (current.status === "cancelled") {
      throw new Error("A cancelled program cannot be changed.");
    }
    const next = this.toProgram(id, payload, current);
    this.programs = this.programs.map((item) => (item.id === id ? next : item));
    this.persist();
    return clone(next);
  }

  cancel(id: number): LoyaltyProgram {
    const current = this.programs.find((item) => item.id === id);
    if (!current) {
      throw new Error("This loyalty program was not found.");
    }
    const next: LoyaltyProgram = {
      ...current,
      status: "cancelled",
      updatedBy: "You",
      updatedAt: new Date().toISOString(),
    };
    this.programs = this.programs.map((item) => (item.id === id ? next : item));
    this.persist();
    return clone(next);
  }

  private toProgram(
    id: number,
    payload: LoyaltyProgramWritePayload,
    current: LoyaltyProgram | null,
  ): LoyaltyProgram {
    const program = normalizeLoyaltyProgram({
      ...payload,
      id,
      member_count: current?.memberCount ?? 0,
      created_by_name:
        current && current.createdBy !== "—" ? current.createdBy : "You",
      updated_by_name: "You",
      created_at: current?.createdAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (!program) {
      throw new Error("The sample program could not be saved.");
    }
    return program;
  }

  private nextId(): number {
    return this.programs.reduce((highest, program) => Math.max(highest, program.id), 100) + 1;
  }

  private restore(): LoyaltyProgram[] {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.every(isStoredProgram)) {
          return parsed;
        }
      }
    } catch {
      // A blocked or corrupt session store falls back to the seed.
    }
    const seeded = this.seed();
    this.persist(seeded);
    return seeded;
  }

  private seed(): LoyaltyProgram[] {
    return createSampleLoyaltyRecords()
      .map((record) => normalizeLoyaltyProgram(record))
      .filter((program): program is LoyaltyProgram => program !== null);
  }

  private persist(programs = this.programs) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
    } catch {
      // The walkthrough still works until the page is refreshed.
    }
  }
}

function isStoredProgram(value: unknown): value is LoyaltyProgram {
  if (!value || typeof value !== "object") return false;
  const program = value as Partial<LoyaltyProgram>;
  return typeof program.id === "number" && typeof program.name === "string";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const loyaltyProgramSampleStore = new LoyaltyProgramSampleStore();
