export type CommunicationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';

export interface MessageTemplate {
  title?: string;
  body: string;
}

export interface ColumnCondition {
  column_name: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN';
  value: string | number | any[];
}

export interface CommunicationFilters {
  column_conditions?: ColumnCondition[];
  limit?: number;
}

export interface RecipientData {
  msisdn?: string;
  email?: string;
  custom_data?: Record<string, any>;
  [key: string]: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface SendCommunicationRequest {
  communication_id?: number; // Communication definition ID from createCommunication()
  source_type: 'quicklist' | 'segment' | 'manual';
  source_id?: number; // Required for quicklist/segment
  name?: string; // Broadcast name
  channels: CommunicationChannel[];
  message_template: MessageTemplate;
  recipient_list?: RecipientData[]; // Required for manual source_type
  filters?: CommunicationFilters;
  batch_size?: number;
  created_by?: number;
  upload_type?: string;
}

export interface ChannelSummary {
  channel: CommunicationChannel;
  messages_sent: number;
  messages_failed: number;
}

export interface CommunicationResult {
  execution_id: string;
  source_type: string;
  source_id: number;
  total_recipients: number;
  total_messages_attempted: number;
  total_messages_sent: number;
  total_messages_failed: number;
  execution_time_ms: number;
  channel_summaries: ChannelSummary[];
}

export interface SendCommunicationResponse {
  success: boolean;
  data: CommunicationResult;
}

// Analytics and monitoring types
export interface CommunicationStats {
  total_executions: number;
  total_messages_sent: number;
  total_messages_failed: number;
  success_rate: number;
  executions_today: number;
  messages_today: number;
}

export interface CommunicationExecution {
  id: number;
  execution_id: string;
  source_type: string;
  source_id: number;
  created_at?: string;
  updated_at?: string;
  status?: string;
  // Add other fields that might be in the response
  [key: string]: any;
}

export interface CommunicationLog {
  id: number;
  execution_id: string;
  channel: CommunicationChannel;
  recipient_identifier: string; // Email or phone number
  title?: string;
  body_preview?: string;
  status: 'sent' | 'failed' | 'pending';
  error_code?: string;
  error_message?: string;
  created_at: string;
  [key: string]: any;
}

export interface TemplateVariable {
  quicklist_id: number;
  available_variables: string[];
  usage_example: string;
}

export interface TemplateVariablesResponse {
  success: boolean;
  data: TemplateVariable;
}

// Request types for analytics
export interface GetExecutionsRequest {
  page?: number;
  limit?: number;
  offset?: number; // Legacy - for backward compatibility
  start_date?: string;
  end_date?: string;
  channel?: CommunicationChannel;
  source_type?: string;
}

export interface GetLogsRequest {
  page?: number;
  limit?: number;
  offset?: number; // Legacy - for backward compatibility
  execution_id?: string;
  channel?: CommunicationChannel;
  status?: "sent" | "failed" | "pending";
  start_date?: string;
  end_date?: string;
}

export interface GetStatsRequest {
  days?: number; // Default: 30
}

// Response types
export interface CommunicationExecutionDetail {
  id: number;
  execution_id: string;
  source_type: string;
  source_id?: number;
  source_name?: string;
  total_recipients: number;
  messages_sent: number;
  messages_failed: number;
  execution_time_ms: number;
  created_at: string;
}

export interface CommunicationExecutionSummary extends CommunicationExecutionDetail {
  total_messages_attempted: number;
  channel_summaries: ChannelSummary[];
  updated_at: string;
}

export interface CommunicationExecutionsResponse {
  success: boolean;
  data: {
    executions: CommunicationExecutionDetail[];
    pagination: PaginationMeta;
  };
}

export interface CommunicationExecutionDetailResponse {
  success: boolean;
  data: {
    execution: CommunicationExecutionDetail;
    recent_logs: CommunicationLog[];
  };
}

export interface CommunicationStatsData {
  period_days: number;
  total_executions: number;
  total_messages_sent: number;
  total_messages_failed: number;
  success_rate: number;
  by_channel: Record<
    CommunicationChannel,
    {
      sent: number;
      failed: number;
    }
  >;
}

export interface CommunicationStatsResponse {
  success: boolean;
  data: {
    period_days: number;
    stats: CommunicationStatsData;
  };
}

export interface CommunicationLogsResponse {
  success: boolean;
  data: {
    logs: CommunicationLog[];
    pagination: PaginationMeta;
  };
}

// Manual Broadcasts Types
export interface ManualBroadcast {
  id: number;
  execution_id: string;
  source_type: string;
  source_id: number | null;
  channels: CommunicationChannel[];
  message_template: MessageTemplate;
  total_recipients: number;
  messages_attempted: number;
  messages_sent: number;
  messages_failed: number;
  channel_summaries: ChannelSummary[];
  status: "pending" | "processing" | "completed" | "failed" | string;
  execution_time_ms: number;
  created_by: number | null;
  created_at: string;
  completed_at?: string;
  source_name: string;
  original_filename?: string;
}

export interface ManualBroadcastsResponse {
  success: boolean;
  data: {
    broadcasts: ManualBroadcast[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

// Create Communication Definition Request
export interface CreateCommunicationRequest {
  name: string;
  description: string;
  source_type: "quicklist" | "manual" | string;
  source_id?: number;
  channels: CommunicationChannel[];
  message_template: MessageTemplate;
  created_by?: number;
}

export interface CreateCommunicationResponse {
  success: boolean;
  data: {
    id: number;
    message: string;
  };
}

// Get All Communications Response
export interface Communication {
  id: number;
  name: string;
  description: string;
  source_type: string;
  source_id?: number;
  channels: CommunicationChannel[];
  message_template: MessageTemplate;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface GetCommunicationsResponse {
  success: boolean;
  data: Communication[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Send Manual Communication Request
export interface ManualCommunicationRecipient {
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

export interface SendManualCommunicationRequest {
  source_type: "manual";
  channels: CommunicationChannel[];
  message_template: MessageTemplate;
  recipient_list: ManualCommunicationRecipient[];
}

export interface SendManualCommunicationResponse {
  success: boolean;
  data: {
    execution_id: string;
    source_type: string;
    total_recipients: number;
    total_messages_attempted: number;
    total_messages_sent: number;
    total_messages_failed: number;
    execution_time_ms: number;
    channel_summaries: ChannelSummary[];
  };
}
