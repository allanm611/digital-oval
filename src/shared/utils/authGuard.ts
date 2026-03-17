/**
 * Auth guard utilities for enforcing authentication requirements
 * Use these to prevent API calls with null user IDs
 */

export interface AuthGuardOptions {
  throwError?: boolean; // If true, throws error instead of returning false
  errorMessage?: string;
}

/**
 * Validates that user is authenticated with a valid user_id
 * @param userId - The user ID to validate
 * @param options - Guard options
 * @returns true if valid, false/throws if not
 */
export function validateUserAuth(
  userId: number | undefined | null,
  options: AuthGuardOptions = {}
): boolean {
  const { throwError = false, errorMessage = "User not authenticated" } = options;

  if (!userId || userId === 0) {
    if (throwError) {
      throw new Error(errorMessage);
    }
    return false;
  }

  return true;
}

/**
 * Returns the user ID if valid, otherwise returns null
 * Use this as a safe way to get user_id for API calls
 */
export function getSafeUserId(userId: number | undefined | null): number | null {
  return userId && userId !== 0 ? userId : null;
}

/**
 * Type guard to ensure user object has valid user_id
 */
export function isAuthenticatedUser(
  user: any
): user is { user_id: number; [key: string]: any } {
  return user && typeof user.user_id === "number" && user.user_id > 0;
}
