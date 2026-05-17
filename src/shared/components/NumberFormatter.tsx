import { formatNumber, formatCurrency } from "../services/numberService";

interface NumberFormatterProps {
  value: number | null | undefined;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  className?: string;
}

/**
 * Reusable component for formatting and displaying numbers.
 * Automatically uses the number format settings from the settings page.
 *
 * @example
 * <NumberFormatter value={1000000} />
 * // Displays: "1,000,000" (if US format is set)
 *
 * <NumberFormatter value={1234.567} maximumFractionDigits={2} />
 * // Displays: "1,234.57"
 */
export default function NumberFormatter({
  value,
  minimumFractionDigits,
  maximumFractionDigits,
  useGrouping = true,
  className = "",
}: NumberFormatterProps) {
  const formatted = formatNumber(value, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  });

  return <span className={className}>{formatted}</span>;
}

interface CurrencyFormatterProps {
  value: number | null | undefined;
  currencyCode?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  className?: string;
}

/**
 * Reusable component for formatting and displaying currency.
 * Automatically uses the number format and currency settings from the settings page.
 *
 * @example
 * <CurrencyFormatter value={99.99} currencyCode="USD" />
 * // Displays: "$99.99" (if US format is set)
 *
 * <CurrencyFormatter value={99.99} currencyCode="EUR" />
 * // Displays: "99,99 €" (if European format is set)
 */
export function CurrencyFormatter({
  value,
  currencyCode,
  minimumFractionDigits,
  maximumFractionDigits,
  className = "",
}: CurrencyFormatterProps) {
  const formatted = formatCurrency(value, currencyCode, {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return <span className={className}>{formatted}</span>;
}
