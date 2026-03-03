export interface NavItem {
  title: string;
  path?: string;
  children?: NavItem[];
}

export const docsNav: NavItem[] = [
  {
    title: "Getting Started",
    children: [
      { title: "Authentication", path: "features/auth" },
      { title: "Dashboard", path: "features/dashboard" },
      { title: "Campaign Management", path: "features/campaigns" },
      { title: "Offer Management", path: "features/offers" },
    ],
  },
  {
    title: "Core Features",
    children: [
      { title: "Campaigns", path: "features/campaigns" },
      { title: "Communications", path: "features/communications" },
      { title: "Customer 360", path: "features/customers360" },
      { title: "Customer Identity", path: "features/customerIdentity" },
      { title: "Dashboard", path: "features/dashboard" },
    ],
  },
  {
    title: "Management",
    children: [
      { title: "Users", path: "features/users" },
      { title: "Roles & Permissions", path: "features/roles" },
      { title: "Settings", path: "features/settings" },
      { title: "Configurations", path: "features/configurations" },
    ],
  },
  {
    title: "Marketing & Sales",
    children: [
      { title: "Offers", path: "features/offers" },
      { title: "Segments", path: "features/segments" },
      { title: "Products", path: "features/products" },
      { title: "Manual Broadcast", path: "features/manual-broadcast" },
      { title: "Manual Rewards", path: "features/manual-rewards" },
      { title: "Quick Lists", path: "features/quicklists" },
    ],
  },
  {
    title: "Data & Analytics",
    children: [
      { title: "Reports & Analytics", path: "features/reports-analytics" },
      { title: "KPIs", path: "features/kpis" },
      { title: "ETL", path: "features/etl" },
    ],
  },
  {
    title: "Automation",
    children: [
      { title: "Jobs", path: "features/jobs" },
      { title: "Servers", path: "features/servers" },
    ],
  },
];
