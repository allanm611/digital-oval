export interface ManualReward {
  id: number;
  name: string;
  description?: string;
  rewardType: "bundle" | "airtime" | "points" | "discount" | "cashback";
  rewardValue: string;
  recipientCount: number;
  status: "pending" | "applied" | "scheduled" | "failed";
  appliedCount: number;
  failedCount: number;
  applyType?: "now" | "later";
  audienceType?: "file" | "quicklist" | "direct";
  quicklistId?: number;
  rewardConfigurationId?: number;
  scheduledAt?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
}
