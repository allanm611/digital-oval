/**
 * Variable Insertion Utilities for Manual Broadcast
 * 
 * Provides functions to insert template variables at cursor positions
 * in text inputs and textareas.
 * 
 * Requirements: 3.3 - WHEN a user selects a Profile_Field THEN the Manual_Broadcast_System 
 * SHALL insert the corresponding Template_Variable into the message at the cursor position
 */

import type { TemplateVariable } from "../types";

/**
 * Result of a variable insertion operation.
 */
export interface VariableInsertionResult {
  /** The new text with the variable inserted */
  newText: string;
  /** The new cursor position after insertion */
  newCursorPosition: number;
}

/**
 * Formats a template variable into its placeholder string representation.
 * Format: {{source_name.field_value}}
 * 
 * @param variable - The template variable to format
 * @returns The formatted placeholder string (e.g., "{{customer_identity.phone_number}}")
 */
export function formatVariablePlaceholder(variable: TemplateVariable): string {
  // Convert source name to snake_case for consistency
  const sourceKey = variable.sourceName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  
  // Use the field value directly (already in correct format)
  const fieldKey = variable.value;
  
  return `{{${sourceKey}.${fieldKey}}}`;
}

/**
 * Inserts a template variable placeholder at the specified cursor position in the text.
 * 
 * Requirements: 3.3 - WHEN a user selects a Profile_Field THEN the Manual_Broadcast_System 
 * SHALL insert the corresponding Template_Variable into the message at the cursor position
 * 
 * @param text - The current text content
 * @param cursorPosition - The position where the variable should be inserted (0-based index)
 * @param variable - The template variable to insert
 * @returns VariableInsertionResult containing the new text and cursor position
 */
export function insertVariableAtCursor(
  text: string,
  cursorPosition: number,
  variable: TemplateVariable
): VariableInsertionResult {
  // Ensure cursor position is within valid bounds
  const safePosition = Math.max(0, Math.min(cursorPosition, text.length));
  
  // Format the variable placeholder
  const placeholder = formatVariablePlaceholder(variable);
  
  // Split text at cursor position and insert placeholder
  const beforeCursor = text.slice(0, safePosition);
  const afterCursor = text.slice(safePosition);
  
  const newText = beforeCursor + placeholder + afterCursor;
  const newCursorPosition = safePosition + placeholder.length;
  
  return {
    newText,
    newCursorPosition,
  };
}

/**
 * Gets the current cursor position from a textarea or input element.
 * 
 * @param element - The textarea or input element
 * @returns The current cursor position, or the end of text if not determinable
 */
export function getCursorPosition(
  element: HTMLTextAreaElement | HTMLInputElement | null
): number {
  if (!element) {
    return 0;
  }
  
  // selectionStart gives us the cursor position
  return element.selectionStart ?? element.value.length;
}

/**
 * Sets the cursor position in a textarea or input element.
 * 
 * @param element - The textarea or input element
 * @param position - The position to set the cursor to
 */
export function setCursorPosition(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  position: number
): void {
  if (!element) {
    return;
  }
  
  // Ensure position is within bounds
  const safePosition = Math.max(0, Math.min(position, element.value.length));
  
  // Set both selection start and end to the same position (no selection, just cursor)
  element.setSelectionRange(safePosition, safePosition);
  
  // Focus the element to make the cursor visible
  element.focus();
}

/**
 * Inserts a variable at the current cursor position in a textarea or input element.
 * This is a convenience function that combines getting cursor position, inserting,
 * and updating the element.
 * 
 * @param element - The textarea or input element
 * @param variable - The template variable to insert
 * @param onChange - Callback to update the parent component's state with the new value
 * @returns The new text value, or null if the element is not available
 */
export function insertVariableInElement(
  element: HTMLTextAreaElement | HTMLInputElement | null,
  variable: TemplateVariable,
  onChange?: (newValue: string) => void
): string | null {
  if (!element) {
    return null;
  }
  
  const currentText = element.value;
  const cursorPosition = getCursorPosition(element);
  
  const { newText, newCursorPosition } = insertVariableAtCursor(
    currentText,
    cursorPosition,
    variable
  );
  
  // Update the element value
  element.value = newText;
  
  // Set cursor position after the inserted variable
  setCursorPosition(element, newCursorPosition);
  
  // Call the onChange callback if provided
  onChange?.(newText);
  
  return newText;
}
