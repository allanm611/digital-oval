export interface Broadcast {
  broadcast_id: string;
  broadcast_name: string;
  run_id: string;
  status: "completed" | "running" | "failed" | "paused" | "pending";
  actual_start_time: string;
  actual_end_time: string;
  messages_queued: number;
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  total_batches: number;
  processed_count: number;
  error_count: number;
  retry_count: number;
  avg_processing_time_ms: number;
  delivery_rate: number;
}

export interface BroadcastsResponse {
  success: boolean;
  data: Broadcast[];
  total: number;
}
