import { userService } from "../../features/users/services/userService";

// In-memory cache for user names
const userNameCache = new Map<number, string>();

/**
 * Get user display name by ID with caching
 * Returns display name, full name, email, or "User #ID" fallback
 */
export async function getUserDisplayName(userId: number | null | undefined): Promise<string> {
  if (!userId) return "—";

  // Check cache first
  if (userNameCache.has(userId)) {
    return userNameCache.get(userId) || "—";
  }

  try {
    const response = await userService.getUserById(userId, true);
    const user = response?.data;

    if (user) {
      const nameFromParts = `${user.first_name || ""} ${user.last_name || ""}`.trim();
      const displayName =
        user.display_name ||
        nameFromParts ||
        user.email_address ||
        user.email ||
        `User #${userId}`;

      // Cache the result
      userNameCache.set(userId, displayName);
      return displayName;
    }
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
  }

  const fallback = `User #${userId}`;
  userNameCache.set(userId, fallback);
  return fallback;
}

/**
 * Batch fetch multiple user names
 */
export async function getUserDisplayNames(userIds: (number | null | undefined)[]): Promise<Map<number, string>> {
  const results = new Map<number, string>();
  const idsToFetch = userIds.filter((id): id is number => Boolean(id) && !userNameCache.has(id));

  // Get cached values
  userIds.forEach((id) => {
    if (id && userNameCache.has(id)) {
      results.set(id, userNameCache.get(id) || "—");
    }
  });

  // Fetch uncached values
  if (idsToFetch.length > 0) {
    const fetchPromises = idsToFetch.map((id) => getUserDisplayName(id));
    const names = await Promise.all(fetchPromises);
    names.forEach((name, index) => {
      results.set(idsToFetch[index], name);
    });
  }

  return results;
}

/**
 * Clear cache (useful for testing or when user data changes)
 */
export function clearUserNameCache(): void {
  userNameCache.clear();
}

/**
 * Clear specific user from cache
 */
export function clearUserFromCache(userId: number): void {
  userNameCache.delete(userId);
}
