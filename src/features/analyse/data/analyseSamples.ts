import type { CustomerIdentityField } from "../../customerIdentity/types/customerIdentity";
import type {
  SegmentCondition,
  SegmentConditionGroup,
  SegmentType,
} from "../../segments/types/segment";
import type {
  AnalysisInsight,
  AnalysisRecord,
  AudienceSource,
} from "../types/analysis";

function condition(
  id: string,
  input: Partial<SegmentCondition> & Pick<SegmentCondition, "conditionType" | "operator" | "value">,
): SegmentCondition {
  return {
    type: "string",
    field_name: input.field_name,
    field: input.field,
    ...input,
    id,
  };
}

function group(
  id: string,
  operator: "AND" | "OR",
  conditions: SegmentCondition[],
  groupOperator?: "AND" | "OR",
): SegmentConditionGroup {
  return { id, operator, conditions, groupOperator };
}

export function sampleNewConditions(): SegmentConditionGroup[] {
  return [
    group("sample-group-profile", "AND", [
      condition("sample-subscription", {
        conditionType: "customer_identity",
        field: "subscription_type",
        field_name: "Subscription type",
        operator: "equals",
        operator_id: 1,
        value: "Prepaid",
        type: "string",
      }),
      condition("sample-region", {
        conditionType: "customer_identity",
        field: "region",
        field_name: "Region",
        operator: "equals",
        operator_id: 1,
        value: "Nairobi",
        type: "string",
      }),
    ]),
    group(
      "sample-group-usage",
      "AND",
      [
        condition("sample-arpu", {
          conditionType: "revenue_metric",
          field: "arpu",
          field_name: "ARPU",
          operator: "greater than",
          operator_id: 3,
          value: 500,
          type: "number",
          time_window: "last_30_days",
          time_window_id: 2,
        }),
      ],
      "AND",
    ),
  ];
}

function roamingConditions(): SegmentConditionGroup[] {
  return [
    group("sample-roaming", "AND", [
      condition("sample-roam-flag", {
        conditionType: "usage_metric",
        field: "roaming_days",
        field_name: "Roaming days",
        operator: "greater than",
        operator_id: 3,
        value: 3,
        type: "number",
        time_window: "last_30_days",
        time_window_id: 2,
      }),
      condition("sample-plan", {
        conditionType: "customer_identity",
        field: "subscription_type",
        field_name: "Subscription type",
        operator: "equals",
        operator_id: 1,
        value: "Postpaid",
        type: "string",
      }),
    ]),
  ];
}

function catalogSegment(
  input: Pick<SegmentType, "id" | "name" | "description" | "visibility" | "size_estimate"> & {
    created_by_user_id?: number | null;
  },
): SegmentType {
  return {
    id: input.id,
    name: input.name,
    code: `SEG-${input.id}`,
    type: "dynamic",
    category: null,
    parent_segment: null,
    description: input.description,
    definition: null,
    query: null,
    count_query: null,
    size_estimate: input.size_estimate,
    last_computed_at: "2026-10-10T08:00:00.000Z",
    tags: [],
    is_active: true,
    created_at: "2026-09-02T08:00:00.000Z",
    updated_at: "2026-10-10T08:00:00.000Z",
    updated_by: "Sample",
    visibility: input.visibility,
    created_by_user_id: input.created_by_user_id ?? 1,
  };
}

export const SAMPLE_AUDIENCE_SEGMENTS: SegmentType[] = [
  catalogSegment({
    id: 9201,
    name: "Active prepaid subscribers",
    description: "Prepaid lines with activity in the last 30 days.",
    visibility: "public",
    size_estimate: 184320,
  }),
  catalogSegment({
    id: 9202,
    name: "Postpaid contract base",
    description: "Active postpaid contracts on a current plan.",
    visibility: "public",
    size_estimate: 64210,
  }),
  catalogSegment({
    id: 9203,
    name: "Data-heavy youth",
    description: "Subscribers aged 18–24 with high data usage.",
    visibility: "public",
    size_estimate: 41880,
  }),
  catalogSegment({
    id: 9204,
    name: "Roaming travelers",
    description: "Lines with roaming usage in the current quarter.",
    visibility: "public",
    size_estimate: 12640,
  }),
  catalogSegment({
    id: 9205,
    name: "My Nairobi prepaid",
    description: "Private saved segment for the Nairobi prepaid base.",
    visibility: "private",
    size_estimate: 55340,
  }),
  catalogSegment({
    id: 9206,
    name: "Winback dormant 60 days",
    description: "Saved segment of lines silent for 60 days.",
    visibility: "private",
    size_estimate: 22190,
  }),
  catalogSegment({
    id: 9207,
    name: "Corporate accounts",
    description: "Saved segment of company-paid lines.",
    visibility: "private",
    size_estimate: 8044,
  }),
];

function analysis(
  input: Omit<AnalysisRecord, "code" | "ruleType" | "sqlQuery" | "visibility"> & {
    audienceSource: AudienceSource;
  },
): AnalysisRecord {
  return {
    ...input,
    code: `ANL-${input.id}`,
    ruleType: "rule",
    sqlQuery: "",
    visibility: "public",
  };
}

export function createSampleAnalyses(): AnalysisRecord[] {
  return [
    analysis({
      id: 9101,
      name: "Analysis_31_10/7/2025",
      description: "Prepaid Nairobi subscribers with ARPU above 500 in the last 30 days.",
      isFavourite: true,
      audienceSource: "new",
      sourceSegmentId: null,
      conditions: sampleNewConditions(),
      countIndividualAsRecipient: true,
      uniqueIdentifier: "msisdn",
      sizeEstimate: 18640,
      createdAt: "2025-10-07T09:15:00.000Z",
      updatedAt: "2026-10-12T11:20:00.000Z",
    }),
    analysis({
      id: 9102,
      name: "Dormant data users",
      description: "Existing catalog segment of data users who have gone quiet.",
      isFavourite: false,
      audienceSource: "existing",
      sourceSegmentId: 9203,
      conditions: [],
      countIndividualAsRecipient: false,
      uniqueIdentifier: null,
      sizeEstimate: 41880,
      createdAt: "2026-08-18T10:00:00.000Z",
      updatedAt: "2026-10-09T16:40:00.000Z",
    }),
    analysis({
      id: 9103,
      name: "Youth weekend bundle",
      description: "Saved private segment used to review weekend bundle take-up.",
      isFavourite: false,
      audienceSource: "saved_segments",
      sourceSegmentId: 9205,
      conditions: [],
      countIndividualAsRecipient: false,
      uniqueIdentifier: null,
      sizeEstimate: 55340,
      createdAt: "2026-07-02T08:30:00.000Z",
      updatedAt: "2026-10-04T13:05:00.000Z",
    }),
    analysis({
      id: 9104,
      name: "Postpaid roaming watch",
      description: "Postpaid lines with more than 3 roaming days in the last month.",
      isFavourite: true,
      audienceSource: "new",
      sourceSegmentId: null,
      conditions: roamingConditions(),
      countIndividualAsRecipient: false,
      uniqueIdentifier: null,
      sizeEstimate: 7420,
      createdAt: "2026-09-14T07:45:00.000Z",
      updatedAt: "2026-10-14T09:10:00.000Z",
    }),
    analysis({
      id: 9105,
      name: "Winback 60 days",
      description: "Saved segment of subscribers silent for 60 days.",
      isFavourite: false,
      audienceSource: "saved_segments",
      sourceSegmentId: 9206,
      conditions: [],
      countIndividualAsRecipient: true,
      uniqueIdentifier: "customer_id",
      sizeEstimate: 22190,
      createdAt: "2026-06-21T12:00:00.000Z",
      updatedAt: "2026-09-28T15:25:00.000Z",
    }),
  ];
}

const CAMPAIGNS = [
  { id: 501, name: "October prepaid recharge", usageCount: 3, lastUsed: "2026-10-11" },
  { id: 502, name: "Weekend data bundle", usageCount: 2, lastUsed: "2026-10-08" },
  { id: 503, name: "Roaming welcome", usageCount: 1, lastUsed: "2026-09-30" },
  { id: 504, name: "Winback SMS", usageCount: 4, lastUsed: "2026-10-02" },
];

function sampleRows(seed: number): Array<Record<string, unknown>> {
  const regions = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];
  const plans = ["Prepaid", "Postpaid"];
  return Array.from({ length: 8 }, (_, index) => {
    const n = seed + index;
    return {
      msisdn: `2547${String(10000000 + n * 37).slice(0, 8)}`,
      customer_id: 44000 + n,
      region: regions[index % regions.length],
      subscription_type: plans[index % plans.length],
      arpu: 280 + ((n * 17) % 900),
      status: index % 5 === 0 ? "Dormant" : "Active",
    };
  });
}

function growthSeries(members: number): AnalysisInsight["growth"] {
  const start = new Date("2026-08-16T00:00:00.000Z");
  return Array.from({ length: 8 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index * 7);
    const memberCount = Math.round(members * (0.86 + index * 0.02));
    const previous = index === 0 ? memberCount : Math.round(members * (0.86 + (index - 1) * 0.02));
    const growthRate = previous === 0 ? 0 : ((memberCount - previous) / previous) * 100;
    return {
      date: date.toISOString().slice(0, 10),
      memberCount,
      growthRate: Math.round(growthRate * 10) / 10,
    };
  });
}

export function buildSampleInsight(analysis: AnalysisRecord): AnalysisInsight {
  const base = analysis.sizeEstimate ?? 12000;
  const memberCount = analysis.countIndividualAsRecipient
    ? Math.round(base * 0.86)
    : base;
  const campaignSlice =
    analysis.audienceSource === "saved_segments"
      ? CAMPAIGNS.slice(2)
      : analysis.audienceSource === "existing"
        ? CAMPAIGNS.slice(0, 3)
        : CAMPAIGNS.slice(0, 2);

  return {
    segmentId: analysis.sourceSegmentId ?? analysis.id,
    memberCount,
    growthRate: analysis.countIndividualAsRecipient ? 3.4 : 6.8,
    engagementScore: analysis.audienceSource === "new" ? 72.4 : 64.1,
    churnRate: analysis.audienceSource === "saved_segments" ? 4.8 : 2.1,
    growth: growthSeries(memberCount),
    campaigns: campaignSlice,
    sample: sampleRows(analysis.id),
    warnings: [
      analysis.countIndividualAsRecipient
        ? "Sample audience. Each person is counted once using the selected identity field."
        : "Sample audience. These figures are for the walkthrough and are not a live segment preview.",
    ],
  };
}

export const SAMPLE_IDENTITY_FIELDS: CustomerIdentityField[] = [
  {
    id: 1,
    field_name: "MSISDN",
    field_value: "msisdn",
    description: "Mobile number",
    field_pg_type: "varchar",
    field_type_precision: null,
    validation: null,
    ui: null,
    operators: [],
    default_operator: "equals",
  },
  {
    id: 2,
    field_name: "Customer ID",
    field_value: "customer_id",
    description: "Internal customer identifier",
    field_pg_type: "bigint",
    field_type_precision: null,
    validation: null,
    ui: null,
    operators: [],
    default_operator: "equals",
  },
  {
    id: 3,
    field_name: "National ID",
    field_value: "national_id",
    description: "National identity number",
    field_pg_type: "varchar",
    field_type_precision: null,
    validation: null,
    ui: null,
    operators: [],
    default_operator: "equals",
  },
];
