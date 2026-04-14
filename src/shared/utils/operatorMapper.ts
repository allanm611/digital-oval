export type OperatorType = {
  id: number;
  symbol: string;
  label: string;
  requiresValue: boolean;
  requiresTwoValues: boolean;
};


const OPERATORS: Record<string, OperatorType> = {
  EQUALS: {
    id: 1,
    symbol: "=",
    label: "equals",
    requiresValue: true,
    requiresTwoValues: false,
  },
  NOT_EQUALS: {
    id: 2,
    symbol: "!=",
    label: "not equals",
    requiresValue: true,
    requiresTwoValues: false,
  },
  GREATER_THAN: {
    id: 3,
    symbol: ">",
    label: "greater than",
    requiresValue: true,
    requiresTwoValues: false,
  },
  LESS_THAN: {
    id: 4,
    symbol: "<",
    label: "less than",
    requiresValue: true,
    requiresTwoValues: false,
  },
  GREATER_THAN_OR_EQUAL: {
    id: 5,
    symbol: ">=",
    label: "greater than or equal",
    requiresValue: true,
    requiresTwoValues: false,
  },
  LESS_THAN_OR_EQUAL: {
    id: 6,
    symbol: "<=",
    label: "less than or equal",
    requiresValue: true,
    requiresTwoValues: false,
  },
  IN: {
    id: 7,
    symbol: "IN",
    label: "in list",
    requiresValue: true,
    requiresTwoValues: false,
  },
  NOT_IN: {
    id: 8,
    symbol: "NOT IN",
    label: "not in list",
    requiresValue: true,
    requiresTwoValues: false,
  },
  BETWEEN: {
    id: 9,
    symbol: "BETWEEN",
    label: "between",
    requiresValue: true,
    requiresTwoValues: true,
  },
  IS_NULL: {
    id: 10,
    symbol: "IS NULL",
    label: "is empty",
    requiresValue: false,
    requiresTwoValues: false,
  },
  IS_NOT_NULL: {
    id: 11,
    symbol: "IS NOT NULL",
    label: "is not empty",
    requiresValue: false,
    requiresTwoValues: false,
  },
  ON_DATE: {
    id: 12,
    symbol: "ON",
    label: "on_date",
    requiresValue: true,
    requiresTwoValues: false,
  },
  BETWEEN_DATES: {
    id: 13,
    symbol: "BETWEEN",
    label: "between_dates",
    requiresValue: true,
    requiresTwoValues: true,
  },
  SINCE_DATE: {
    id: 14,
    symbol: "SINCE",
    label: "since_date",
    requiresValue: true,
    requiresTwoValues: false,
  },
  UNTIL_DATE: {
    id: 15,
    symbol: "UNTIL",
    label: "until_date",
    requiresValue: true,
    requiresTwoValues: false,
  },
};

export function getOperatorsForFieldType(fieldType: string): OperatorType[] {
  const fieldTypeNormalized = (fieldType || "").toLowerCase().trim();

  switch (fieldTypeNormalized) {
    // Text/String fields
    case "text":
    case "varchar":
    case "string":
      return [
        OPERATORS.EQUALS,
        OPERATORS.NOT_EQUALS,
        OPERATORS.IN,
        OPERATORS.NOT_IN,
        OPERATORS.IS_NULL,
        OPERATORS.IS_NOT_NULL,
      ];

    // Regular numeric fields (no date operators)
    
    case "number":
    case "integer":
    case "int":
    case "bigint":
    case "float":
    case "double":
      return [
        OPERATORS.EQUALS,
        OPERATORS.NOT_EQUALS,
        OPERATORS.GREATER_THAN,
        OPERATORS.LESS_THAN,
        OPERATORS.GREATER_THAN_OR_EQUAL,
        OPERATORS.LESS_THAN_OR_EQUAL,
        OPERATORS.IN,
        OPERATORS.NOT_IN,
        OPERATORS.BETWEEN,
        OPERATORS.IS_NULL,
        OPERATORS.IS_NOT_NULL,
      ];

    // KPI metric fields (money, decimal,numeric) - includes date operators for date range filtering
    // Backend uses these types for metrics like revenue, usage.
    case "money":
    case "numeric":
    case "decimal":
      return [
        OPERATORS.EQUALS,
        OPERATORS.NOT_EQUALS,
        OPERATORS.GREATER_THAN,
        OPERATORS.LESS_THAN,
        OPERATORS.GREATER_THAN_OR_EQUAL,
        OPERATORS.LESS_THAN_OR_EQUAL,
        OPERATORS.IN,
        OPERATORS.NOT_IN,
        OPERATORS.BETWEEN,
        OPERATORS.ON_DATE,
        OPERATORS.BETWEEN_DATES,
        OPERATORS.SINCE_DATE,
        OPERATORS.UNTIL_DATE,
        OPERATORS.IS_NULL,
        OPERATORS.IS_NOT_NULL,
      ];

    // Boolean fields
    case "boolean":
    case "bool":
      return [
        OPERATORS.EQUALS,
        OPERATORS.NOT_EQUALS,
        OPERATORS.IS_NULL,
        OPERATORS.IS_NOT_NULL,
      ];

    // Date/Timestamp fields — includes date-specific operators
    // The frontend renders date pickers and sends start_date/end_date
    case "date":
    case "timestamp":
    case "timestamptz":
    case "datetime":
      return [
        OPERATORS.EQUALS,
        OPERATORS.GREATER_THAN,
        OPERATORS.LESS_THAN,
        OPERATORS.GREATER_THAN_OR_EQUAL,
        OPERATORS.LESS_THAN_OR_EQUAL,
        OPERATORS.BETWEEN,
        OPERATORS.ON_DATE,
        OPERATORS.BETWEEN_DATES,
        OPERATORS.SINCE_DATE,
        OPERATORS.UNTIL_DATE,
        OPERATORS.IS_NULL,
        OPERATORS.IS_NOT_NULL,
      ];

    // Default: return basic operators
    default:
      return [
        OPERATORS.EQUALS,
        OPERATORS.NOT_EQUALS,
        OPERATORS.IN,
        OPERATORS.NOT_IN,
        OPERATORS.IS_NULL,
        OPERATORS.IS_NOT_NULL,
      ];
  }
}

/**
 * Date range operators for numeric field conditions
 * Used as secondary dropdown when numeric operator is selected
 * Maps to date operator IDs 12-15
 */
export const DATE_OPERATORS = [
  { value: "on", label: "On", id: 12 },
  { value: "between", label: "Between", id: 13 },
  { value: "since", label: "Since", id: 14 },
  { value: "until", label: "Until", id: 15 },
];