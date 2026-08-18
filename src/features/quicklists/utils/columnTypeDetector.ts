export type ColumnType = "email" | "date" | "number" | "text";

export interface ColumnDefault {
  columnName: string;
  type: ColumnType;
  defaultValue: string;
}

/**
 * Detects the type of a value
 */
export function detectColumnType(value: string | null | undefined): ColumnType {
  if (!value || typeof value !== "string" || value.trim() === "") {
    return "text";
  }

  const trimmedValue = value.trim().toLowerCase();

  // Email detection: contains @ and dot
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
    return "email";
  }

  // Number detection: all digits, possibly with decimals or negative
  if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
    return "number";
  }

  // Date detection: common date formats
  // YYYY-MM-DD, DD-MM-YYYY, MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD
  if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(trimmedValue) ||
      /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(trimmedValue)) {
    return "date";
  }

  return "text";
}

/**
 * Gets the default value for a column type
 */
export function getDefaultForType(type: ColumnType): string {
  switch (type) {
    case "email":
      return "customer@gmail.com";
    case "date":
      return getTodaysDate();
    case "number":
      return "0";
    case "text":
      return "customer";
    default:
      return "customer";
  }
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
function getTodaysDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Auto-fills column defaults based on first data row
 */
export function autoFillDefaults(
  firstDataRow: string[],
  headers: string[]
): ColumnDefault[] {
  if (!headers || !firstDataRow || headers.length === 0) {
    return [];
  }

  const defaults: ColumnDefault[] = [];

  headers.forEach((columnName, index) => {
    const value = firstDataRow[index];
    const type = detectColumnType(value);
    const defaultValue = getDefaultForType(type);

    defaults.push({
      columnName,
      type,
      defaultValue,
    });
  });

  return defaults;
}

/**
 * Converts column defaults array to Record<string, string> for form submission
 */
export function columnsToDefaultsRecord(
  columns: ColumnDefault[]
): Record<string, string> {
  return columns.reduce(
    (acc, col) => {
      acc[col.columnName] = col.defaultValue;
      return acc;
    },
    {} as Record<string, string>
  );
}
