export interface Execution {
  id: number;
  type: "campaign" | "broadcast" | "manual_reward" | "scheduled_job";
  name: string;
  status: "running" | "success" | "failed" | "pending";
  executedAt: string;
  completedAt?: string;
  recipientsCount?: number;
  successCount?: number;
  failureCount?: number;
  errorMessage?: string;
  duration?: number;
  triggeredBy?: string;
}

const dummyExecutions: Execution[] = [
  {
    id: 1,
    type: "campaign",
    name: "Black Friday Campaign",
    status: "running",
    executedAt: "2026-05-14T14:30:00Z",
    recipientsCount: 850,
    successCount: 800,
    failureCount: 50,
    duration: 450,
    triggeredBy: "Admin",
  },
  {
    id: 2,
    type: "broadcast",
    name: "Weekly Newsletter",
    status: "failed",
    executedAt: "2026-05-14T10:15:00Z",
    completedAt: "2026-05-14T10:25:00Z",
    recipientsCount: 650,
    successCount: 500,
    failureCount: 150,
    duration: 600,
    errorMessage: "Email service timeout",
    triggeredBy: "Jane Smith",
  },
  {
    id: 3,
    type: "manual_reward",
    name: "VIP Birthday Bonus",
    status: "success",
    executedAt: "2026-05-14T09:00:00Z",
    completedAt: "2026-05-14T09:05:00Z",
    recipientsCount: 320,
    successCount: 320,
    failureCount: 0,
    duration: 300,
    triggeredBy: "Admin User",
  },
  {
    id: 4,
    type: "scheduled_job",
    name: "Daily Audience Sync",
    status: "success",
    executedAt: "2026-05-14T08:00:00Z",
    completedAt: "2026-05-14T08:15:00Z",
    recipientsCount: 1000,
    successCount: 1000,
    failureCount: 0,
    duration: 900,
    triggeredBy: "Admin",
  },
  {
    id: 5,
    type: "campaign",
    name: "Spring Promo Campaign",
    status: "success",
    executedAt: "2026-05-14T07:30:00Z",
    completedAt: "2026-05-14T07:45:00Z",
    recipientsCount: 750,
    successCount: 720,
    failureCount: 30,
    duration: 900,
    triggeredBy: "Mike Johnson",
  },
  {
    id: 6,
    type: "broadcast",
    name: "Flash Sale Alert",
    status: "running",
    executedAt: "2026-05-14T06:00:00Z",
    recipientsCount: 540,
    successCount: 500,
    failureCount: 40,
    duration: 720,
    triggeredBy: "Admin",
  },
  {
    id: 7,
    type: "manual_reward",
    name: "Loyalty Points Bonus",
    status: "success",
    executedAt: "2026-05-13T16:30:00Z",
    completedAt: "2026-05-13T16:32:00Z",
    recipientsCount: 425,
    successCount: 425,
    failureCount: 0,
    duration: 120,
    triggeredBy: "Sarah Williams",
  },
  {
    id: 8,
    type: "scheduled_job",
    name: "Generate Weekly Report",
    status: "failed",
    executedAt: "2026-05-13T00:00:00Z",
    completedAt: "2026-05-13T00:30:00Z",
    duration: 1800,
    errorMessage: "Database connection failed",
    triggeredBy: "Admin",
  },
  {
    id: 9,
    type: "campaign",
    name: "Customer Appreciation Campaign",
    status: "success",
    executedAt: "2026-05-12T12:00:00Z",
    completedAt: "2026-05-12T12:30:00Z",
    recipientsCount: 900,
    successCount: 880,
    failureCount: 20,
    duration: 1800,
    triggeredBy: "Emily Davis",
  },
  {
    id: 10,
    type: "broadcast",
    name: "Product Launch Announcement",
    status: "success",
    executedAt: "2026-05-12T08:00:00Z",
    completedAt: "2026-05-12T08:20:00Z",
    recipientsCount: 780,
    successCount: 750,
    failureCount: 30,
    duration: 1200,
    triggeredBy: "Admin",
  },
];

export const executionService = {
  async getExecutions(filters?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    let executions = [...dummyExecutions];

    if (filters?.type && filters.type !== "all") {
      executions = executions.filter((e) => e.type === filters.type);
    }

    if (filters?.status && filters.status !== "all") {
      executions = executions.filter((e) => e.status === filters.status);
    }

    return {
      data: executions,
      total: executions.length,
    };
  },

  async getExecutionStatistics() {
    const running = dummyExecutions.filter((e) => e.status === "running").length;
    const success = dummyExecutions.filter((e) => e.status === "success").length;
    const failed = dummyExecutions.filter((e) => e.status === "failed").length;

    return {
      total_executions: dummyExecutions.length,
      running_count: running,
      success_count: success,
      failed_count: failed,
    };
  },

  async getExecutionById(id: number) {
    return dummyExecutions.find((e) => e.id === id);
  },
};
