import { userService } from "../../users/services/userService";

export async function resolveUserDisplayName(
  userId: number | null | undefined,
): Promise<string> {
  if (userId == null || !Number.isFinite(userId)) {
    return "Not recorded";
  }

  try {
    const userRes = await userService.getUserById(userId);
    const user = userRes.data as {
      display_name?: string | null;
      username?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
    };
    if (user?.display_name?.trim()) {
      return user.display_name.trim();
    }
    if (user?.first_name || user?.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(" ");
    }
    if (user?.username) {
      return user.username;
    }
    if (user?.email) {
      return user.email;
    }
  } catch {
    // fall through
  }

  return `User #${userId}`;
}
