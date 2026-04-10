export type NotificationType =
  | "campaign_approval_request"
  | "campaign_approved"
  | "campaign_rejected"
  | "campaign_status_changed"
  | "campaign_execution_started"
  | "campaign_execution_completed"
  | "campaign_error"
  | "offer_approval_request"
  | "offer_approved"
  | "offer_rejected"
  | "offer_status_changed"
  | "segment_computation_completed"
  | "segment_computation_failed"
  | "segment_refresh_needed"
  | "segment_large_computation_warning"
  | "scheduled_job_completed"
  | "scheduled_job_failed"
  | "scheduled_job_started"
  | "user_account_request"
  | "role_permission_changed"
  | "system_maintenance"
  | "security_alert"
  | "broadcast_delivery_status"
  | "communication_policy_violation"
  | "channel_delivery_failure"
  | "system_update"
  | "feature_announcement"
  | "important_alert"
  | "general";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

// Notification payload structure from API
export interface NotificationPayload {
  record_id?: number | string;
  actor_id?: string;
  table_name?: string;
  action_type?: string;
  [key: string]: any;
}

// Inbox notification structure (from GET /notifications/inbox)
export interface InboxNotification {
  id: number;
  user_id: number;
  notification_log_id: number;
  title: string;
  message: string;
  payload: NotificationPayload;
  is_read: boolean;
  created_at: string;
}

// Subscription rule metadata
export interface SubscriptionRule {
  id: number;
  notification_rule_id: number;
  rule_name: string;
  rule_template: string;
}

// User's subscription to a notification rule
export interface NotificationSubscription extends SubscriptionRule {
  user_id: number;
  is_enabled: boolean;
}

// Request body for updating subscriptions (PUT /notifications/subscriptions)
export interface UpdateSubscriptionsRequest {
  subscriptions: Array<{
    notification_rule_id: number;
    is_enabled: boolean;
  }>;
}

// Response from GET /notifications/subscriptions
export interface GetSubscriptionsResponse {
  success: boolean;
  data: NotificationSubscription[];
}

// Response from PUT /notifications/subscriptions
export interface UpdateSubscriptionsResponse {
  success: boolean;
  message?: string;
  data?: {
    updated_count: number;
  };
}

// Response from GET /notifications/inbox
export interface GetInboxResponse {
  success: boolean;
  data: InboxNotification[];
}

// Response from mark as read operations
export interface MarkNotificationReadResponse {
  success: boolean;
  data?: {
    id?: number;
    is_read: boolean;
    updated_at?: string;
  };
  message?: string;
  count?: number;
}
