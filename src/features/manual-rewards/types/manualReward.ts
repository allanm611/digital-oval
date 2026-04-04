export interface ManualReward {
  id: number;
  name: string;
  rewardType: "bundle" | "points" | "discount" | "cashback";
  rewardValue: string;
  recipientCount: number;
  status: "pending" | "applied" | "scheduled" | "failed";
  appliedCount: number;
  failedCount: number;
  scheduledAt?: string;
  createdAt: string;
  createdBy: string;
}
