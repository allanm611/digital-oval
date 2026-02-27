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

  // Priority 3: Check for message property
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message;

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
