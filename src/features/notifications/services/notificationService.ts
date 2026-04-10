import {
  InboxNotification,
  GetInboxResponse,
  GetSubscriptionsResponse,
  UpdateSubscriptionsRequest,
  UpdateSubscriptionsResponse,
  MarkNotificationReadResponse,
} from "../types/notification";
import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";

class NotificationService {
  /**
   * GET /notifications/inbox - Get user's notification inbox
   * Retrieves all notifications sent to the current user
   */
  async getInboxNotifications(): Promise<GetInboxResponse> {
    try {
      const url = buildApiUrl("/notifications/inbox");
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GetInboxResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch inbox notifications:", error);
      throw error;
    }
  }

  /**
   * PUT /notifications/inbox/:id/read - Mark single notification as read
   * Marks a specific notification as read
   */
  async markNotificationAsRead(
    id: number | string
  ): Promise<MarkNotificationReadResponse> {
    try {
      const url = buildApiUrl(`/notifications/inbox/${id}/read`);
      const response = await fetch(url, {
        method: "PUT",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MarkNotificationReadResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      throw error;
    }
  }

  /**
   * PUT /notifications/inbox/read-all - Mark all notifications as read
   * Marks all unread notifications as read in one action
   */
  async markAllInboxAsRead(): Promise<MarkNotificationReadResponse> {
    try {
      const url = buildApiUrl("/notifications/inbox/read-all");
      const response = await fetch(url, {
        method: "PUT",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MarkNotificationReadResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      throw error;
    }
  }

  /**
   * DELETE /notifications/inbox/:id - Delete notification from inbox
   * Removes a notification from user's inbox
   */
  async deleteInboxNotification(id: number | string): Promise<{ success: boolean }> {
    try {
      const url = buildApiUrl(`/notifications/inbox/${id}`);
      const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to delete notification:", error);
      throw error;
    }
  }

  /**
   * GET /notifications/subscriptions - Get user's notification subscriptions
   * Retrieves which notification types the user is subscribed to
   */
  async getNotificationSubscriptions(): Promise<GetSubscriptionsResponse> {
    try {
      const url = buildApiUrl("/notifications/subscriptions");
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GetSubscriptionsResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch notification subscriptions:", error);
      throw error;
    }
  }

  /**
   * PUT /notifications/subscriptions - Update user's notification subscriptions
   * Updates which notification types the user wants to receive
   */
  async updateNotificationSubscriptions(
    subscriptions: UpdateSubscriptionsRequest["subscriptions"]
  ): Promise<UpdateSubscriptionsResponse> {
    try {
      const url = buildApiUrl("/notifications/subscriptions");
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptions }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: UpdateSubscriptionsResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to update notification subscriptions:", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
