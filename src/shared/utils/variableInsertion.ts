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
  /** Error message if insertion is invalid */
  error?: string;
}

/**
 * Validates if a cursor position is valid for inserting a variable.
 * Prevents inserting variables inside or adjacent to existing variables (nested brackets).
 *
 * @param text - The current text content
 * @param cursorPosition - The cursor position to validate
 * @returns Error message if invalid, empty string if valid
 */
export function validateInsertPosition(
  text: string,
  cursorPosition: number
): string {
  // Check if there are unclosed brackets BEFORE the cursor
  // If so, user must close them first before inserting new variable
  let bracketCount = 0;

  for (let i = 0; i < Math.min(cursorPosition, text.length); i++) {
    if (text[i] === "{" && text[i + 1] === "{") {
      bracketCount++;
      i++; // Skip next character
    } else if (text[i] === "}" && text[i + 1] === "}") {
      bracketCount--;
      i++; // Skip next character
    }
  }

  // If bracketCount > 0, cursor is inside an unclosed variable
  if (bracketCount > 0) {
    return "Cannot insert variable inside another variable";
  }

  // Check if cursor is immediately after {{ or before }}
  // This prevents insertions that would split variable syntax
  const beforeCursor = text.slice(Math.max(0, cursorPosition - 2), cursorPosition);
  const afterCursor = text.slice(cursorPosition, Math.min(text.length, cursorPosition + 2));

  if (beforeCursor === "{{") {
    return "Cannot insert variable inside another variable";
  }

  if (afterCursor === "}}") {
    return "Cannot insert variable inside another variable";
  }

  // Check if there's text between cursor and next }} that isn't closed
  const textAfter = text.slice(cursorPosition);
  const nextClosing = textAfter.indexOf("}}");
  const nextOpening = textAfter.indexOf("{{");

  if (nextClosing !== -1 && (nextOpening === -1 || nextOpening > nextClosing)) {
    // There's a closing }} coming up, which means we're potentially inside incomplete variable syntax
    return "Cannot insert variable inside another variable";
  }

  return "";
}

/**
 * Validates message syntax for properly formed variables.
 *
 * @param text - The text to validate
 * @returns Error message if invalid, empty string if valid
 */
export function validateMessageSyntax(text: string): string {
  // Check for unclosed brackets
  const openCount = (text.match(/\{\{/g) || []).length;
  const closeCount = (text.match(/\}\}/g) || []).length;

  if (openCount !== closeCount) {
    return `Invalid variable syntax: ${openCount} opening brackets but ${closeCount} closing brackets`;
  }

  // Check for nested brackets
  let bracketDepth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{" && text[i + 1] === "{") {
      bracketDepth++;
      if (bracketDepth > 1) {
        return `Invalid variable syntax: Nested brackets found at position ${i}`;
      }
      i++;
    } else if (text[i] === "}" && text[i + 1] === "}") {
      bracketDepth--;
      i++;
    }
  }

  return "";
}

/**
 * Detects if any changes were made inside existing variables
 * Returns error if user tried to edit inside a variable {{ }}
 * Variables should be immutable - users must delete and re-insert instead
 *
 * Allows adding text before, between, and after variables - just not inside them
 *
 * @param oldText - The previous text content
 * @param newText - The new text content
 * @returns Error message if edit inside variable detected, empty string if valid
 */
export function validateNoEditInsideVariables(
  oldText: string,
  newText: string
): string {
  // Find all variable positions in oldText
  const variableRanges: Array<{ start: number; end: number }> = [];
  const variablePattern = /\{\{[^}]*\}\}/g;
  let match;
  while ((match = variablePattern.exec(oldText)) !== null) {
    variableRanges.push({ start: match.index, end: match.index + match[0].length });
  }

  // Find the first position where oldText and newText differ
  let diffStart = 0;
  let diffEnd = 0;

  // Find where changes start
  for (let i = 0; i < Math.min(oldText.length, newText.length); i++) {
    if (oldText[i] !== newText[i]) {
      diffStart = i;
      break;
    }
  }

  // Find where changes end (check from the end)
  const oldEnd = oldText.length - 1;
  const newEnd = newText.length - 1;
  for (let i = 0; i < Math.min(oldText.length, newText.length); i++) {
    if (oldText[oldEnd - i] !== newText[newEnd - i]) {
      diffEnd = Math.min(oldText.length, newText.length) - i;
      break;
    }
  }

  // Check if the changed range overlaps with any variable's INTERIOR (not just boundaries)
  for (const range of variableRanges) {
    // Only block if the change is strictly inside the variable brackets {{ }}
    // Allow changes at the boundaries (start and end of variable)
    const variableStart = range.start + 2; // After {{
    const variableEnd = range.end - 2; // Before }}

    // If change is inside the variable interior, block it
    if (diffStart >= variableStart && diffStart < variableEnd) {
      return "You can't edit inside a variable";
    }

    if (diffEnd > variableStart && diffEnd <= variableEnd) {
      return "You can't edit inside a variable";
    }
  }

  return "";
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
  const sourceKey = (variable.sourceName || "source")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  // Use the field value directly (already in correct format)
  const fieldKey = variable.value || "field";

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
 * @returns VariableInsertionResult containing the new text and cursor position, or an error
 */
export function insertVariableAtCursor(
  text: string,
  cursorPosition: number,
  variable: TemplateVariable,
): VariableInsertionResult {
  // Ensure cursor position is within valid bounds
  const safePosition = Math.max(0, Math.min(cursorPosition, text.length));

  // Validate cursor position - prevent inserting inside existing variables
  const positionError = validateInsertPosition(text, safePosition);
  if (positionError) {
    return {
      newText: text,
      newCursorPosition: safePosition,
      error: positionError,
    };
  }

  // Format the variable placeholder
  const placeholder = formatVariablePlaceholder(variable);

  // Split text at cursor position and insert placeholder
  const beforeCursor = text.slice(0, safePosition);
  const afterCursor = text.slice(safePosition);

  const newText = beforeCursor + placeholder + afterCursor;
  const newCursorPosition = safePosition + placeholder.length;

  // Validate the resulting syntax
  const syntaxError = validateMessageSyntax(newText);
  if (syntaxError) {
    return {
      newText: text,
      newCursorPosition: safePosition,
      error: syntaxError,
    };
  }

  return {
    newText,
    newCursorPosition,
  };
}

/**
 * Checks if the cursor position is inside a variable bracket {{ }}
 * Used to prevent typing inside variables
 *
 * @param text - The current text content
 * @param cursorPosition - The cursor position
 * @returns True if cursor is inside a variable, false otherwise
 */
export function isCursorInsideVariable(text: string, cursorPosition: number): boolean {
  let bracketDepth = 0;

  for (let i = 0; i < Math.min(cursorPosition, text.length); i++) {
    if (text[i] === "{" && text[i + 1] === "{") {
      bracketDepth++;
      i++; // Skip next character
    } else if (text[i] === "}" && text[i + 1] === "}") {
      bracketDepth--;
      i++; // Skip next character
    }
  }

  return bracketDepth > 0;
}

/**
 * Gets the current cursor position from a textarea or input element.
 *
 * @param element - The textarea or input element
 * @returns The current cursor position, or the end of text if not determinable
 */
export function getCursorPosition(
  element: HTMLTextAreaElement | HTMLInputElement | null,
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
  position: number,
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
  onChange?: (newValue: string) => void,
): string | null {
  if (!element) {
    return null;
  }

  const currentText = element.value;
  const cursorPosition = getCursorPosition(element);

  const { newText, newCursorPosition } = insertVariableAtCursor(
    currentText,
    cursorPosition,
    variable,
  );

  // Update the element value
  element.value = newText;

  // Set cursor position after the inserted variable
  setCursorPosition(element, newCursorPosition);

  // Call the onChange callback if provided
  onChange?.(newText);

  return newText;
}
