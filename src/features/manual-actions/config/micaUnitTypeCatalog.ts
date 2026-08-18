/**
 * MICA Unit Type catalog
 *
 * Confirmed IDs are NOT in the backend repo (`communication/mica` only
 * accepts numeric `unitTypeID`). Fill this list once MICA/ops confirms
 * the official catalog for this environment.
 *
 * Until then, the Rewards Test UI still allows entering a custom numeric ID.
 */
export interface MicaUnitTypeOption {
  id: number;
  label: string;
  /** Optional: data | voice | sms | other */
  category?: string;
  notes?: string;
}

/**
 * Replace / extend with ops-confirmed values for UAT / production.
 * Example shape (IDs are placeholders — do not treat as live):
 *   { id: 1, label: "Data MB", category: "data" }
 */
export const MICA_UNIT_TYPE_CATALOG: MicaUnitTypeOption[] = [
  // TODO(ops): confirm and populate official MICA unitTypeID values
];

export const MICA_UNIT_TYPE_CUSTOM_VALUE = "__custom__";

export function getMicaUnitTypeLabel(id: number): string {
  const match = MICA_UNIT_TYPE_CATALOG.find((item) => item.id === id);
  return match ? `${match.label} (${id})` : String(id);
}
