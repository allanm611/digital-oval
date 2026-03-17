export type OperatorType = {
  id: number;
  symbol: string;
  label: string;
  requiresValue: boolean;
  requiresTwoValues: boolean;
};

/**
 * Backend-aligned operator IDs.
 * These MUST match the IDs returned by GET /segmentation-fields/profile → field.operators[].id
 *
 * Backend operator mapping:
 *   1  =          equals
 *   2  !=         not equals
 *   3  >          greater than
 *   4  <          less than
 *   5  >=         greater than or equal
 *   6  <=         less than or equal
 *   7  IN         in list
 *   8  NOT IN     not in list
 *  12  BETWEEN    between
 *  13  IS NULL    is empty
 *  14  IS NOT NULL is not empty
 *
 * Date fields use standard operators (1, 3, 4, 5, 6, 12, 13, 14) combined with
 * start_date / end_date fields instead of value.
 */
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
    id: 12,
    symbol: "BETWEEN",
    label: "between",
    requiresValue: true,
    requiresTwoValues: true,
  },
  IS_NULL: {
    id: 13,
    symbol: "IS NULL",
    label: "is empty",
    requiresValue: false,
    requiresTwoValues: false,
  },
  IS_NOT_NULL: {
    id: 14,
    symbol: "IS NOT NULL",
    label: "is not empty",
    requiresValue: false,
    requiresTwoValues: false,
  },
};

/**
 * Fallback: get operators for a given field type when backend operators are not available.
 * Prefer using field.operators[] from the backend API response instead of this function.
 * Field types from backend: "Text", "Number", "Money", "Boolean", "Date", "Timestamp"
 */
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

    // Numeric fields (backend sends "Number" and "Money")
    case "numeric":
    case "number":
    case "money":
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

    // Date/Timestamp fields — use same standard operators
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
