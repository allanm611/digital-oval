import type { AttributeFieldOption } from "../types/loyaltyProgram";

/**
 * Sample profile fields used only when the profile dictionary cannot be
 * loaded. Ids stay in a reserved range so they do not collide with live KPIs.
 */
export const SAMPLE_ATTRIBUTE_FIELDS: AttributeFieldOption[] = [
  {
    id: "9101",
    numericId: 9101,
    name: "Data contribution",
    fieldValue: "data_revenue",
    sourceType: "usage_metric",
  },
  {
    id: "9102",
    numericId: 9102,
    name: "Total revenue",
    fieldValue: "total_revenue",
    sourceType: "usage_metric",
  },
  {
    id: "9103",
    numericId: 9103,
    name: "Tenure (months)",
    fieldValue: "tenure_months",
    sourceType: "numeric_profile",
  },
  {
    id: "9104",
    numericId: 9104,
    name: "ARPU",
    fieldValue: "arpu",
    sourceType: "numeric_profile",
  },
  {
    id: "9105",
    numericId: 9105,
    name: "Contract value",
    fieldValue: "contract_value",
    sourceType: "static_field",
  },
];

/**
 * API-shaped records. Dates move with today so Active, Scheduled, and
 * Expired stay meaningful. The service normalizes these through the same
 * mapper as a live response.
 */
export function createSampleLoyaltyRecords(): unknown[] {
  const activeStart = shiftDate(-120);
  const activeEnd = shiftDate(180);
  const scheduledStart = shiftDate(30);
  const scheduledEnd = shiftDate(200);
  const expiredStart = shiftDate(-400);
  const expiredEnd = shiftDate(-20);

  return [
    {
      id: 101,
      name: "Gold Rewards",
      description:
        "Earn bonus points on recharges and data bundles. Points stay in this program and can be redeemed as airtime or bundle rewards.",
      status: "active",
      member_count: 12840,
      start_date: activeStart,
      end_date: activeEnd,
      bonus_points_validity: "limited",
      bonus_points_validity_days: 365,
      tier_evaluation_mode: "automated",
      segmentation_tiers: [
        { tier_name: "Bronze", points_from: 0, points_to: 999 },
        { tier_name: "Silver", points_from: 1000, points_to: 4999 },
        { tier_name: "Gold", points_from: 5000, points_to: null },
      ],
      segmentation_points_validity: "limited",
      segmentation_points_validity_days: 180,
      custom_attributes: [
        {
          name: "Data revenue share",
          operands: [
            operand("K1", "usage_metric", 9101, "Data contribution", "data_revenue"),
            operand("K2", "usage_metric", 9102, "Total revenue", "total_revenue"),
          ],
          formula: "K1/K2",
          condition: { operator: "greater_than", value: 0.2, value_to: null },
        },
      ],
      created_by_name: "Amina Yusuf",
      updated_by_name: "Daniel Otieno",
      created_at: daysAgoIso(120),
      updated_at: daysAgoIso(2),
    },
    {
      id: 102,
      name: "Prepaid Weekend Club",
      description:
        "Weekend voice and data members. Tiers are assigned manually through the subscriber tier API.",
      status: "active",
      member_count: 2406,
      start_date: shiftDate(-40),
      end_date: shiftDate(90),
      bonus_points_validity: "unlimited",
      bonus_points_validity_days: null,
      tier_evaluation_mode: "manual",
      segmentation_tiers: [
        { tier_name: "Base" },
        { tier_name: "Plus" },
        { tier_name: "Premier" },
      ],
      segmentation_points_validity: "limited",
      segmentation_points_validity_days: 90,
      custom_attributes: [],
      created_by_name: "Daniel Otieno",
      updated_by_name: "Amina Yusuf",
      created_at: daysAgoIso(40),
      updated_at: daysAgoIso(6),
    },
    {
      id: 103,
      name: "Ramadan Saver",
      description:
        "A short seasonal program. Registration opens on the start date. Bonus points expire 45 days after they are earned.",
      status: "scheduled",
      member_count: 0,
      start_date: scheduledStart,
      end_date: scheduledEnd,
      bonus_points_validity: "limited",
      bonus_points_validity_days: 45,
      tier_evaluation_mode: "automated",
      segmentation_tiers: [
        { tier_name: "Member", points_from: 0, points_to: 2499 },
        { tier_name: "Patron", points_from: 2500, points_to: null },
      ],
      segmentation_points_validity: "limited",
      segmentation_points_validity_days: 60,
      custom_attributes: [],
      created_by_name: "Grace Wanjiku",
      updated_by_name: "Grace Wanjiku",
      created_at: daysAgoIso(8),
      updated_at: daysAgoIso(8),
    },
    {
      id: 104,
      name: "Device Upgrade 2025",
      description:
        "Closed upgrade program. Bonus points do not expire, so members can still redeem a remaining balance.",
      status: "expired",
      member_count: 873,
      start_date: expiredStart,
      end_date: expiredEnd,
      bonus_points_validity: "unlimited",
      bonus_points_validity_days: null,
      tier_evaluation_mode: "automated",
      segmentation_tiers: [
        { tier_name: "Starter", points_from: 0, points_to: 499 },
        { tier_name: "Upgrade", points_from: 500, points_to: null },
      ],
      segmentation_points_validity: "limited",
      segmentation_points_validity_days: 30,
      custom_attributes: [],
      created_by_name: "Amina Yusuf",
      updated_by_name: "System",
      created_at: daysAgoIso(400),
      updated_at: daysAgoIso(20),
    },
    {
      id: 105,
      name: "Youth Data Club",
      description:
        "Cancelled youth program. Members remain on record, and no new registrations or bonus points are accepted.",
      status: "cancelled",
      member_count: 5102,
      start_date: shiftDate(-200),
      end_date: shiftDate(40),
      bonus_points_validity: "limited",
      bonus_points_validity_days: 120,
      tier_evaluation_mode: "automated",
      segmentation_tiers: [
        { tier_name: "Youth", points_from: 0, points_to: 1999 },
        { tier_name: "Youth Plus", points_from: 2000, points_to: null },
      ],
      segmentation_points_validity: "unlimited",
      segmentation_points_validity_days: null,
      custom_attributes: [],
      created_by_name: "Peter Kamau",
      updated_by_name: "Amina Yusuf",
      created_at: daysAgoIso(200),
      updated_at: daysAgoIso(12),
    },
    {
      id: 106,
      name: "Enterprise Scorecard",
      description:
        "Draft program for contract accounts. The custom attribute estimates value from tenure, ARPU, and contract value.",
      status: "draft",
      member_count: 0,
      start_date: shiftDate(14),
      end_date: shiftDate(380),
      bonus_points_validity: "limited",
      bonus_points_validity_days: 730,
      tier_evaluation_mode: "automated",
      segmentation_tiers: [
        { tier_name: "Standard", points_from: 0, points_to: 9999 },
        { tier_name: "Key", points_from: 10000, points_to: 49999 },
        { tier_name: "Strategic", points_from: 50000, points_to: null },
      ],
      segmentation_points_validity: "unlimited",
      segmentation_points_validity_days: null,
      custom_attributes: [
        {
          name: "Account value index",
          operands: [
            operand("K1", "numeric_profile", 9103, "Tenure (months)", "tenure_months"),
            operand("K2", "numeric_profile", 9104, "ARPU", "arpu"),
            operand("K3", "static_field", 9105, "Contract value", "contract_value"),
          ],
          formula: "(K1+K2)/K3",
          condition: { operator: "between", value: 0.1, value_to: 2 },
        },
      ],
      created_by_name: "Grace Wanjiku",
      updated_by_name: "Grace Wanjiku",
      created_at: daysAgoIso(3),
      updated_at: daysAgoIso(1),
    },
  ];
}

function operand(
  key: string,
  sourceType: string,
  fieldId: number,
  fieldName: string,
  fieldValue: string,
) {
  return {
    key,
    source_type: sourceType,
    field_id: fieldId,
    field_name: fieldName,
    field_value: fieldValue,
  };
}

function shiftDate(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}
