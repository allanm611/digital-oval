import type { OfferKpiSummary, OfferReportsResponse } from "../types/ReportsAPI";
import { asFiniteNumber } from "./normalizeOfferReport";
import {
  computeDeltaTrend,
  formatCount,
  formatRate,
  ratePercent,
  type KpiTrend,
} from "./campaignCvmMetrics";

export const OFFER_CVM_LABELS = {
  valueGenerated: "Value Generated",
  incrementalValue: "Incremental Value",
  romi: "ROMI",
  rewardCost: "Reward Cost",
  eligible: "Eligible",
  offered: "Offered",
  takenUp: "Taken Up",
  takeUpRate: "Take-up Rate",
  fulfilled: "Fulfilled",
  targetGroup: "Target Group",
  controlGroup: "Control Group",
} as const;

export const OFFER_FUNNEL_STAGES = [
  "Eligible",
  "Offered",
  "Taken Up",
  "Fulfilled",
] as const;

export type OfferFunnelStage = (typeof OFFER_FUNNEL_STAGES)[number];
export type OfferFunnelPoint = OfferReportsResponse["redemptionFunnel"][number];

export type OfferCvmSnapshot = {
  eligible: number;
  offered: number;
  takenUp: number;
  fulfilled: number;
  takeUpRate: number;
  fulfilmentRate: number;
  valueGenerated: number;
  incrementalValue: number;
  rewardCost: number;
  romi: number;
  targetGroup: number;
  controlGroup: number;
  targetGroupTakenUp: number;
  controlGroupTakenUp: number;
};

/**
 * Maps a stage label onto the CVM offer lifecycle.
 * Legacy digital-marketing names are accepted so live payloads keep working.
 */
export function cvmOfferStage(stage: string): OfferFunnelStage | "" {
  const key = String(stage || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();
  if (!key) return "";
  if (/fulfil|fulfill|provision/.test(key)) return "Fulfilled";
  if (/\bredeem/.test(key)) return "Fulfilled";
  if (/taken|take up|takeup|accept|engag|convert/.test(key)) return "Taken Up";
  if (/offer|present|\bview|sent|communicat|dispatch|deliver/.test(key)) return "Offered";
  if (/eligib|expos|qualif/.test(key)) return "Eligible";
  return "";
}

export function cvmOfferFunnel(
  apiRows: OfferFunnelPoint[] = [],
): OfferFunnelPoint[] {
  const totals: Record<OfferFunnelStage, number> = {
    Eligible: 0,
    Offered: 0,
    "Taken Up": 0,
    Fulfilled: 0,
  };
  let recognized = 0;
  for (const row of apiRows) {
    const label = cvmOfferStage(row.stage);
    if (!label) continue;
    recognized += 1;
    const record = row as unknown as Record<string, unknown>;
    totals[label] += asFiniteNumber(
      record.value ?? record.count ?? record.volume ?? record.customers,
    );
  }
  if (!recognized) return [];
  return OFFER_FUNNEL_STAGES.map((stage) => ({ stage, value: totals[stage] }));
}

export function offerCvmSnapshot(
  summary: Partial<OfferKpiSummary> | null | undefined,
  funnel: OfferFunnelPoint[] = [],
): OfferCvmSnapshot {
  const stages = cvmOfferFunnel(funnel);
  const stageValue = (stage: OfferFunnelStage) =>
    asFiniteNumber(stages.find((row) => row.stage === stage)?.value);

  const funnelActive = stages.some((row) => asFiniteNumber(row.value) > 0);
  const prefer = (fromSummary: number, fromStage: number) =>
    funnelActive ? fromStage || fromSummary : fromSummary || fromStage;

  const takenUp = prefer(
    asFiniteNumber(summary?.takenUp ?? summary?.totalRedemptions ?? summary?.converted),
    stageValue("Taken Up"),
  );
  const offered = prefer(
    asFiniteNumber(summary?.offered ?? summary?.sent),
    stageValue("Offered"),
  );
  const eligible = prefer(asFiniteNumber(summary?.eligible), stageValue("Eligible"));
  const fulfilled = prefer(
    asFiniteNumber(summary?.fulfilled ?? summary?.uniqueConverters),
    stageValue("Fulfilled"),
  );
  const valueGenerated = asFiniteNumber(
    summary?.revenueGenerated ?? summary?.revenue,
  );
  const rewardCost = asFiniteNumber(summary?.totalCost);
  const storedRate = asFiniteNumber(summary?.redemptionRate ?? summary?.conversionRate);
  const takeUpRate = storedRate || ratePercent(takenUp, offered || eligible);
  const romiStored = asFiniteNumber(summary?.roi);
  const romi = romiStored || (rewardCost ? Number((valueGenerated / rewardCost).toFixed(1)) : 0);

  return {
    eligible,
    offered,
    takenUp,
    fulfilled,
    takeUpRate,
    fulfilmentRate: ratePercent(fulfilled, takenUp),
    valueGenerated,
    incrementalValue: asFiniteNumber(summary?.incrementalRevenue),
    rewardCost,
    romi,
    targetGroup: asFiniteNumber(summary?.targetGroup),
    controlGroup: asFiniteNumber(summary?.controlGroup),
    targetGroupTakenUp: asFiniteNumber(summary?.targetGroupTakenUp),
    controlGroupTakenUp: asFiniteNumber(summary?.controlGroupTakenUp),
  };
}

export function previousOfferSnapshot(
  current: OfferCvmSnapshot,
  factor = 0.92,
): OfferCvmSnapshot {
  const scale = (value: number) => Math.round(value * factor);
  return {
    eligible: scale(current.eligible),
    offered: scale(current.offered),
    takenUp: scale(current.takenUp),
    fulfilled: scale(current.fulfilled),
    takeUpRate: Number((current.takeUpRate * 0.96).toFixed(1)),
    fulfilmentRate: Number((current.fulfilmentRate * 0.98).toFixed(1)),
    valueGenerated: scale(current.valueGenerated),
    incrementalValue: scale(current.incrementalValue),
    rewardCost: scale(current.rewardCost),
    romi: Number((current.romi * 0.96).toFixed(1)),
    targetGroup: scale(current.targetGroup),
    controlGroup: scale(current.controlGroup),
    targetGroupTakenUp: scale(current.targetGroupTakenUp),
    controlGroupTakenUp: scale(current.controlGroupTakenUp),
  };
}

export function valuePerTakeUp(snapshot: OfferCvmSnapshot): number {
  if (!snapshot.takenUp) return 0;
  return snapshot.valueGenerated / snapshot.takenUp;
}

export function costPerTakeUp(snapshot: OfferCvmSnapshot): number {
  if (!snapshot.takenUp) return 0;
  return snapshot.rewardCost / snapshot.takenUp;
}

export { computeDeltaTrend, formatCount, formatRate, type KpiTrend };
