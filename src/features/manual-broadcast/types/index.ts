/**
 * Manual Broadcast Enhancement Types
 * 
 * Types for the enhanced Manual Broadcast module supporting:
 * - Subscription ID field selection from uploaded files
 * - Hierarchical variable selection from customer profile sources
 * - Template variable insertion in messages
 */

/**
 * Represents a template variable that can be inserted into a message.
 * Variables are selected from the hierarchical profile field selector.
 */
export interface TemplateVariable {
  /** Unique identifier for the field */
  id: number;
  /** Display name (e.g., "Phone Number") */
  name: string;
  /** Backend field value (e.g., "phone_number") */
  value: string;
  /** ID of the category/source this field belongs to */
  sourceId: number;
  /** Name of the source category (e.g., "Customer Identity") */
  sourceName: string;
  /** Description of the field */
  description: string;
  /** Field data type: "text", "numeric", "date", "boolean", "timestamp" */
  fieldType: string;
}

/**
 * Represents a profile source category containing related fields.
 * Sources are the first level of the hierarchical selector.
 */
export interface ProfileSource {
  /** Unique identifier for the source category */
  id: number;
  /** Display name (e.g., "Customer Identity", "Subscription Details") */
  name: string;
  /** Backend value (e.g., "customer_identity") */
  value: string;
  /** Description of the source category */
  description: string;
  /** Number of fields available in this source */
  fieldCount: number;
}

/**
 * Represents a profile field within a source category.
 * Fields are the second level of the hierarchical selector.
 */
export interface ProfileField {
  /** Unique identifier for the field */
  id: number;
  /** Display name (e.g., "Phone Number") */
  name: string;
  /** Backend field value (e.g., "phone_number") */
  value: string;
  /** Description of the field */
  description: string;
  /** Field data type: "text", "numeric", "date", "boolean", "timestamp" */
  fieldType: string;
  /** Source table in the database */
  sourceTable: string;
}

/**
 * Result of parsing an uploaded file for column extraction.
 */
export interface FileParseResult {
  /** Whether the parsing was successful */
  success: boolean;
  /** Array of column names extracted from the file header */
  columns: string[];
  /** Total number of data rows in the file */
  rowCount: number;
  /** Sample data from the first few rows (for preview) */
  sampleData?: Record<string, string>[];
  /** Error message if parsing failed */
  error?: string;
}

/**
 * Communication channel types supported by the broadcast system.
 */
export type CommunicationChannel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";

/**
 * Input method for defining the target audience.
 */
export type AudienceInputMethod = "file" | "manual";
