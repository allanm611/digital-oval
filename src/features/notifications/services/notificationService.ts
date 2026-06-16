import {
  InboxNotification,
  GetInboxResponse,
  GetSubscriptionsResponse,
  UpdateSubscriptionsRequest,
  UpdateSubscriptionsResponse,
  MarkNotificationReadResponse,
  NotificationRuleResource,
  GetNotificationRulesResponse,
  CreateNotificationRuleResponse,
  UpdateNotificationRuleResponse,
  DeleteNotificationRuleResponse,
  GetEventConditionsResponse,
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
        body: JSON.stringify({ rules: subscriptions }),
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

  /**
   * GET /notifications/rules - Get all notification rules
   * Retrieves all configured notification rules
   */
  async getNotificationRules(): Promise<GetNotificationRulesResponse> {
    try {
      const url = buildApiUrl("/notifications/rules");
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GetNotificationRulesResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch notification rules:", error);
      throw error;
    }
  }

  /**
   * POST /notifications/rules - Create new notification rule
   * Creates a new notification rule for triggering notifications
   */
  async createNotificationRule(
    rule: NotificationRuleResource
  ): Promise<CreateNotificationRuleResponse> {
    try {
      const url = buildApiUrl("/notifications/rules");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CreateNotificationRuleResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to create notification rule:", error);
      throw error;
    }
  }

  /**
   * PUT /notifications/rules/:id - Update notification rule
   * Updates an existing notification rule
   */
  async updateNotificationRule(
    id: number | string,
    rule: NotificationRuleResource
  ): Promise<UpdateNotificationRuleResponse> {
    try {
      const url = buildApiUrl(`/notifications/rules/${id}`);
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: UpdateNotificationRuleResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to update notification rule:", error);
      throw error;
    }
  }

  /**
   * DELETE /notifications/rules/:id - Delete notification rule
   * Deletes a notification rule
   */
  async deleteNotificationRule(
    id: number | string
  ): Promise<DeleteNotificationRuleResponse> {
    try {
      const url = buildApiUrl(`/notifications/rules/${id}`);
      const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: DeleteNotificationRuleResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to delete notification rule:", error);
      throw error;
    }
  }

  /**
   * GET /notifications/event-conditions?tableName=X - Get event conditions for a table
   * Retrieves all event conditions available for a specific table
   */
  async getEventConditions(tableName: string): Promise<GetEventConditionsResponse> {
    try {
      const url = buildApiUrl(`/notifications/event-conditions?tableName=${tableName}`);
      const response = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GetEventConditionsResponse = await response.json();
      return data;
    } catch (error) {
      console.error(`Failed to fetch event conditions for table ${tableName}:`, error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
