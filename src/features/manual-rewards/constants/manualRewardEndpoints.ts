/**
 * Manual rewards API (database-service)
 * Mounted at: app.use("/manual-reward", ManualRewardsRouter)
 */
export const MANUAL_REWARD_API = {
  base: "/manual-reward",
  list: "",
  create: "",
  byId: (id: number) => `/${id}`,
  apply: (id: number) => `/${id}/apply`,
} as const;
