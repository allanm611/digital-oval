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
  CONTAINS: {
    id: 7,
    symbol: "LIKE",
    label: "contains",
    requiresValue: true,
    requiresTwoValues: false,
  },
  NOT_CONTAINS: {
    id: 8,
    symbol: "NOT LIKE",
    label: "not contains",
    requiresValue: true,
    requiresTwoValues: false,
  },
  IN: {
    id: 9,
    symbol: "IN",
    label: "in",
    requiresValue: true,
    requiresTwoValues: false,
  },
  NOT_IN: {
    id: 10,
    symbol: "NOT IN",
    label: "not in",
    requiresValue: true,
    requiresTwoValues: false,
  },
  BETWEEN: {
    id: 11,
    symbol: "BETWEEN",
    label: "between dates",
    requiresValue: true,
    requiresTwoValues: true,
  },
  IS_NULL: {
    id: 12,
    symbol: "IS NULL",
    label: "is null",
    requiresValue: false,
    requiresTwoValues: false,
  },
  IS_NOT_NULL: {
    id: 13,
    symbol: "IS NOT NULL",
    label: "is not null",
    requiresValue: false,
    requiresTwoValues: false,
  },
  ON_DATE: {
    id: 14,
    symbol: "=",
    label: "on date",
    requiresValue: true,
    requiresTwoValues: false,
  },
  AFTER_DATE: {
    id: 15,
    symbol: ">=",
    label: "after date",
    requiresValue: true,
    requiresTwoValues: false,
  },
  BEFORE_DATE: {
    id: 16,
    symbol: "<=",
    label: "before date",
    requiresValue: true,
    requiresTwoValues: false,
  },
  BETWEEN_DAYS: {
    id: 17,
    symbol: "BETWEEN",
    label: "in last days",
    requiresValue: true,
    requiresTwoValues: false,
  },
  BETWEEN_DATES: {
    id: 18,
    symbol: "BETWEEN",
    label: "between dates",
    requiresValue: true,
    requiresTwoValues: true,
  },
};

/**
 * Get operators for a given field type
 * Field types: "text", "numeric", "boolean", "date", "timestamp"
 */
export function getOperatorsForFieldType(fieldType: string): OperatorType[] {
  const fieldTypeNormalized = (fieldType || "").toLowerCase().trim();

  switch (fieldTypeNormalized) {
    // Text/String fields (Customer Identity fields)
    case "text":
    case "varchar":
    case "string":
      return [
        OPERATORS.EQUALS,
        OPERATORS.NOT_EQUALS,
        OPERATORS.CONTAINS,
        OPERATORS.NOT_CONTAINS,
        OPERATORS.IN,
        OPERATORS.NOT_IN,
        OPERATORS.IS_NULL,
        OPERATORS.IS_NOT_NULL,
      ];

    // Numeric fields
    case "numeric":
    case "integer":
    case "int":
    case "bigint":
    case "decimal":
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

    // Boolean fields
    case "boolean":
    case "bool":
      return [
        OPERATORS.EQUALS,
        OPERATORS.NOT_EQUALS,
        OPERATORS.IS_NULL,
        OPERATORS.IS_NOT_NULL,
      ];

    // Date/Timestamp fields - use date-specific operators
    case "date":
    case "timestamp":
    case "timestamptz":
    case "datetime":
      return [
        OPERATORS.ON_DATE,
        OPERATORS.AFTER_DATE,
        OPERATORS.BEFORE_DATE,
        OPERATORS.BETWEEN_DATES,
        OPERATORS.BETWEEN_DAYS,
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
 * Get a single operator by ID
 */
export function getOperatorById(id: number): OperatorType | undefined {
  return Object.values(OPERATORS).find((op) => op.id === id);
}

/**
 * Get a single operator by symbol
 */
export function getOperatorBySymbol(symbol: string): OperatorType | undefined {
  return Object.values(OPERATORS).find((op) => op.symbol === symbol);
}

/**
 * Get a single operator by label
 */
export function getOperatorByLabel(label: string): OperatorType | undefined {
  return Object.values(OPERATORS).find((op) => op.label === label);
}

/**
 * Get all operators
 */
export function getAllOperators(): OperatorType[] {
  return Object.values(OPERATORS);
}
