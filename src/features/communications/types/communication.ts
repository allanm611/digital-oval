export type CommunicationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';

export interface MessageTemplate {
  title?: string;
  body: string;
}

export interface ColumnCondition {
  column: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface CommunicationFilters {
  column_conditions: ColumnCondition[];
  limit?: number;
}

export interface SendCommunicationRequest {
  source_type: 'quicklist';
  source_id: number;
  channels: CommunicationChannel[];
  message_template: MessageTemplate;
  filters?: CommunicationFilters;
  batch_size?: number;
  created_by?: number;
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
  id: string;
  execution_id: string;
  channel: string;
  status?: string;
  recipient?: string;
  sent_at?: string;
  error_message?: string;
  // Add other fields that might be in the response
  [key: string]: any;
}

// Request types for analytics
export interface GetExecutionsRequest {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
  channel?: CommunicationChannel;
  source_type?: string;
}

export interface GetLogsRequest {
  limit?: number;
  offset?: number;
  execution_id?: string;
  channel?: CommunicationChannel;
  status?: "sent" | "failed" | "pending";
  start_date?: string;
  end_date?: string;
}

// Response types
export interface CommunicationExecutionsResponse {
  success: boolean;
  data: CommunicationExecution[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface CommunicationStatsResponse {
  success: boolean;
  data: CommunicationStats;
}

export interface CommunicationLogsResponse {
  success: boolean;
  data: CommunicationLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
