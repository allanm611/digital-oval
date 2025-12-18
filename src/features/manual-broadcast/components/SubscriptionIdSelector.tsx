/**
 * SubscriptionIdSelector Component
 * 
 * Displays a dropdown to select the Subscription ID field from uploaded file columns.
 * Uses HeadlessSelect for consistent styling with the rest of the application.
 * 
 * Requirements: 1.1, 1.2
 * - WHEN a user selects the file upload method THEN the Manual_Broadcast_System 
 *   SHALL display a dropdown to select the Subscription ID field from the uploaded file columns
 * - WHEN a file is uploaded THEN the Manual_Broadcast_System SHALL parse the file headers 
 *   and populate the Subscription ID field dropdown with available columns
 */

import { AlertCircle } from "lucide-react";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";

interface SubscriptionIdSelectorProps {
  /** Array of column names extracted from the uploaded file */
  fileColumns: string[];
  /** Currently selected column name */
  selectedColumn: string | null;
  /** Callback when a column is selected */
  onColumnSelect: (column: string) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Whether to show validation error */
  error?: boolean;
  /** Custom error message to display */
  errorMessage?: string;
}

export default function SubscriptionIdSelector({
  fileColumns,
  selectedColumn,
  onColumnSelect,
  disabled = false,
  error = false,
  errorMessage,
}: SubscriptionIdSelectorProps) {
  const { t } = useLanguage();

  // Convert file columns to select options
  const options = fileColumns.map((column) => ({
    value: column,
    label: column,
  }));

  // Handle column selection
  const handleChange = (value: string | number) => {
    onColumnSelect(String(value));
  };

  return (
    <div className="space-y-2">
      <label className={`block text-sm font-medium ${tw.textPrimary}`}>
        {t.manualBroadcast.subscriptionIdLabel || "Subscription ID Field *"}
      </label>
      <p className={`text-xs ${tw.textSecondary} mb-2`}>
        {t.manualBroadcast.subscriptionIdHelper || 
          "Select the column that contains the unique identifier for each customer"}
      </p>
      
      <HeadlessSelect
        options={options}
        value={selectedColumn || ""}
        onChange={handleChange}
        placeholder={t.manualBroadcast.subscriptionIdPlaceholder || "Select Subscription ID column..."}
        disabled={disabled || fileColumns.length === 0}
        error={error}
      />

      {/* Error message display */}
      {error && errorMessage && (
        <div className="flex items-center gap-2 mt-2">
          <AlertCircle
            className="w-4 h-4 flex-shrink-0"
            style={{ color: color.status.danger }}
          />
          <p className="text-xs" style={{ color: color.status.danger }}>
            {errorMessage}
          </p>
        </div>
      )}

      {/* Info message when no columns available */}
      {fileColumns.length === 0 && !disabled && (
        <p className={`text-xs ${tw.textMuted} mt-1`}>
          {t.manualBroadcast.uploadFileFirst || "Upload a file to see available columns"}
        </p>
      )}
    </div>
  );
}
