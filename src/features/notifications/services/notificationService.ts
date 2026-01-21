import {
  Notification,
  NotificationResponse,
  NotificationStats,
  GetNotificationsQuery,
  MarkAsReadRequest,
  MarkAllAsReadResponse,
  // ApiSuccessResponse,
} from "../types/notification";
import {
  hardcodedCampaigns,
  hardcodedSegments,
  hardcodedOffers,
} from "../../../shared/configs/configurationPageConfigs";

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "campaign_approval_request",
    title: "Campaign Approval Required",
    message: `Campaign '${hardcodedCampaigns[0].name}' is pending your approval`,
    priority: "high",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), 
    actionUrl: `/dashboard/campaigns/${hardcodedCampaigns[0].id}`,
    actionLabel: "Review Campaign",
  },
  {
    id: 2,
    type: "campaign_approved",
    title: "Campaign Approved",
    message: `Your campaign '${hardcodedCampaigns[1].name}' has been approved and is now active`,
    priority: "medium",
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), 
    actionUrl: `/dashboard/campaigns/${hardcodedCampaigns[1].id}`,
    actionLabel: "View Campaign",
  },
  {
    id: 3,
    type: "offer_approval_request",
    title: "Offer Approval Required",
    message: `Offer '${hardcodedOffers[2].name}' requires your approval`,
    priority: "high",
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), 
    actionUrl: `/dashboard/offers/${hardcodedOffers[2].id}`,
    actionLabel: "Review Offer",
  },
  {
    id: 4,
    type: "segment_computation_completed",
    title: "Segment Computation Completed",
    message: `Segment '${hardcodedSegments[0].name}' has finished computing with ${hardcodedSegments[0].member_count.toLocaleString()} members`,
    priority: "low",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    actionUrl: `/dashboard/segments/${hardcodedSegments[0].id}`,
    actionLabel: "View Segment",
  },
  {
    id: 5,
    type: "segment_computation_failed",
    title: "Segment Computation Failed",
    message: `Segment '${hardcodedSegments[1].name}' computation failed. Please check the segment criteria`,
    priority: "high",
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    actionUrl: `/dashboard/segments/${hardcodedSegments[1].id}`,
    actionLabel: "Fix Segment",
  },
  {
    id: 6,
    type: "campaign_execution_started",
    title: "Campaign Execution Started",
    message: `Campaign '${hardcodedCampaigns[2].name}' has started executing`,
    priority: "medium",
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7 hours ago
    actionUrl: `/dashboard/campaigns/${hardcodedCampaigns[2].id}`,
    actionLabel: "View Campaign",
  },
  {
    id: 7,
    type: "offer_approved",
    title: "Offer Approved",
    message: `Offer '${hardcodedOffers[3].name}' has been approved`,
    priority: "medium",
    isRead: true,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
    actionUrl: `/dashboard/offers/${hardcodedOffers[3].id}`,
    actionLabel: "View Offer",
  },
  {
    id: 8,
    type: "channel_delivery_failure",
    title: "Channel Delivery Failure",
    message: `SMS delivery failed for campaign '${hardcodedCampaigns[0].name}'. 234 messages failed to deliver`,
    priority: "high",
    isRead: false,
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), // 14 hours ago
    actionUrl: `/dashboard/campaigns/${hardcodedCampaigns[0].id}`,
    actionLabel: "View Campaign",
  },
  {
    id: 9,
    type: "communication_policy_violation",
    title: "Communication Policy Violation",
    message: `Campaign '${hardcodedCampaigns[2].name}' violated DND policy. 12 messages sent outside allowed hours`,
    priority: "high",
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(), // 15 hours ago
    actionUrl: `/dashboard/campaigns/${hardcodedCampaigns[2].id}`,
    actionLabel: "View Campaign",
  },
  {
    id: 10,
    type: "system_update",
    title: "System Update Available",
    message: `New system update with offer '${hardcodedOffers[4].name}' integration and improved analytics`,
    priority: "low",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
  },
];

// Store for managing read/unread state (in-memory only)
let notificationStore = [...MOCK_NOTIFICATIONS];

class NotificationService {
  // Simulate API delay
  private async delay(ms: number = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * GET /notifications - Get all notifications for the current user
   */
  async getNotifications(
    query?: GetNotificationsQuery
  ): Promise<NotificationResponse> {
    await this.delay(200);

    let filtered = [...notificationStore];

    // Apply filters
    if (query?.type) {
      filtered = filtered.filter((n) => n.type === query.type);
    }
    if (query?.priority) {
      filtered = filtered.filter((n) => n.priority === query.priority);
    }
    if (query?.isRead !== undefined) {
      filtered = filtered.filter((n) => n.isRead === query.isRead);
    }
    if (query?.search) {
      const searchLower = query.search.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower)
      );
    }

    // Sort by createdAt (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 50;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginated,
      pagination: {
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
    };
  }

  /**
   * GET /notifications/stats - Get notification statistics
   */
  async getNotificationStats(): Promise<ApiSuccessResponse<NotificationStats>> {
    await this.delay(100);

    const unread = notificationStore.filter((n) => !n.isRead).length;
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    notificationStore.forEach((n) => {
      byType[n.type] = (byType[n.type] || 0) + 1;
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
    });

    return {
      success: true,
      data: {
        total: notificationStore.length,
        unread,
        byType: byType as Record<NotificationType, number>,
        byPriority: byPriority as Record<NotificationPriority, number>,
      },
    };
  }

  /**
   * GET /notifications/:id - Get a specific notification
   */
  async getNotificationById(
    id: string | number
  ): Promise<ApiSuccessResponse<Notification>> {
    await this.delay(100);
    const notification = notificationStore.find((n) => n.id === id);
    if (!notification) {
      throw new Error("Notification not found");
    }
    return {
      success: true,
      data: notification,
    };
  }

  /**
   * PATCH /notifications/mark-as-read - Mark notifications as read
   */
  async markAsRead(
    request: MarkAsReadRequest
  ): Promise<ApiSuccessResponse<{ count: number }>> {
    await this.delay(200);
    let count = 0;
    notificationStore = notificationStore.map((n) => {
      if (request.notificationIds.includes(n.id) && !n.isRead) {
        count++;
        return { ...n, isRead: true };
      }
      return n;
    });
    return {
      success: true,
      data: { count },
    };
  }

  /**
   * PATCH /notifications/mark-all-as-read - Mark all notifications as read
   */
  async markAllAsRead(): Promise<MarkAllAsReadResponse> {
    await this.delay(200);
    let count = 0;
    notificationStore = notificationStore.map((n) => {
      if (!n.isRead) {
        count++;
        return { ...n, isRead: true };
      }
      return n;
    });
    return {
      success: true,
      message: `Marked ${count} notifications as read`,
      count,
    };
  }

  /**
   * DELETE /notifications/:id - Delete a notification
   */
  async deleteNotification(
    id: string | number
  ): Promise<ApiSuccessResponse<{ deleted: boolean }>> {
    await this.delay(200);
    const index = notificationStore.findIndex((n) => n.id === id);
    if (index === -1) {
      throw new Error("Notification not found");
    }
    notificationStore.splice(index, 1);
    return {
      success: true,
      data: { deleted: true },
    };
  }

  /**
   * DELETE /notifications - Delete multiple notifications
   */
  async deleteNotifications(
    ids: (string | number)[]
  ): Promise<ApiSuccessResponse<{ count: number }>> {
    await this.delay(200);
    const initialLength = notificationStore.length;
    notificationStore = notificationStore.filter((n) => !ids.includes(n.id));
    const count = initialLength - notificationStore.length;
    return {
      success: true,
      data: { count },
    };
  }

  /**
   * DELETE /notifications/read - Delete all read notifications
   */
  async deleteAllRead(): Promise<ApiSuccessResponse<{ count: number }>> {
    await this.delay(200);
    const initialLength = notificationStore.length;
    notificationStore = notificationStore.filter((n) => !n.isRead);
    const count = initialLength - notificationStore.length;
    return {
      success: true,
      data: { count },
    };
  }
}

export const notificationService = new NotificationService();
