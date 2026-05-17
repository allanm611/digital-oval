/**
 * Detects if a string is HTML by checking for common HTML patterns
 */
export function isHtmlError(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  return /^<\s*html/i.test(trimmed) || /^<\s*body/i.test(trimmed) || /^<!DOCTYPE/i.test(trimmed);
}

/**
 * Gets a user-friendly message based on HTTP status code
 */
function getStatusCodeMessage(statusCode?: number): string {
  switch (statusCode) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return "Unauthorized. Please log in again.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "Conflict. The resource may have been modified.";
    case 422:
      return "Invalid data. Please check your input.";
    case 429:
      return "Too many requests. Please try again later.";
    case 500:
      return "Internal server error. Please try again later.";
    case 502:
    case 503:
    case 504:
      return "Service temporarily unavailable. Please try again in a moment.";
    default:
      return "";
  }
}

/**
 * Extracts a meaningful error message from various error response formats
 */
export function extractErrorMessage(
  errorBody: string,
  statusCode?: number,
): string {
  if (!errorBody) {
    return getStatusCodeMessage(statusCode) || "An error has occurred";
  }

  // Check if it's HTML (from proxy/gateway)
  if (isHtmlError(errorBody)) {
    // Try to extract status text from HTML (e.g., <h1>503 Service Unavailable</h1>)
    const statusMatch = errorBody.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (statusMatch?.[1]) {
      const extracted = statusMatch[1].trim();
      // Return just the status text without the number if it's a standard HTTP error
      const textOnly = extracted.replace(/^\d+\s+/, "");
      return textOnly || "Service temporarily unavailable";
    }
    // Fallback for HTML errors
    return getStatusCodeMessage(statusCode) || "Service temporarily unavailable";
  }

  // Try to parse as JSON
  try {
    const errorData = JSON.parse(errorBody);
    if (errorData.error) return String(errorData.error);
    if (errorData.message) return String(errorData.message);
    if (errorData.details) return String(errorData.details);
    if (typeof errorData === "string") return errorData;
  } catch {
    // Not JSON, continue
  }

  // If it looks like plain text without HTML, return it (but limit length)
  const plainText = errorBody.replace(/<[^>]*>/g, "").trim();
  if (plainText && plainText.length < 500 && !plainText.includes("<!DOCTYPE")) {
    return plainText;
  }

  return getStatusCodeMessage(statusCode) || "An error has occurred";
}

/**
 * Extract backend error message intelligently
 * Returns the backend error if available, falls back to friendly message for unknown errors
 */
export const extractBackendError = (
  error: unknown,
  defaultMessage: string = "Failed to process request"
): string => {
  // Priority 1: Check for backend error response
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as { response?: { data?: unknown } }).response;
    if (response?.data && typeof response.data === "object") {
      const data = response.data as Record<string, unknown>;
      // Return backend error message if it exists
      if (data.error && typeof data.error === "string") {
        return data.error;
      }
      if (data.message && typeof data.message === "string") {
        return data.message;
      }
    }
  }

  // Priority 2: Check for direct error property
  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as { error?: unknown }).error === "string"
  ) {
    return (error as { error: string }).error;
  }

  // Priority 3: Check for message property (including HTML error detection)
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message;

    // Check if message is HTML (from proxy/gateway returning error pages)
    if (isHtmlError(message)) {
      const cleanMessage = extractErrorMessage(message);
      if (cleanMessage && cleanMessage !== defaultMessage) {
        return cleanMessage;
      }
      return "Service temporarily unavailable. Please try again in a moment.";
    }

    // Try to extract JSON error from message like "500 - {...}"
    const jsonMatch = message.match(/\{.*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.error && typeof parsed.error === "string") {
          return parsed.error;
        }
        if (parsed.message && typeof parsed.message === "string") {
          return parsed.message;
        }
      } catch {
        // JSON parsing failed, continue to use message as-is
      }
    }

    // Filter out generic HTTP errors
    if (!message.includes("HTTP error") && !message.includes("status:")) {
      return message;
    }
  }

  // Fallback to default friendly message
  return defaultMessage;
};
