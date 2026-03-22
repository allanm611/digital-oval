export interface NavItem {
  title: string;
  path?: string;
  children?: NavItem[];
}

export const docsNav: NavItem[] = [
  {
    title: "Campaign Management",
    path: "features/campaigns",
    children: [
      { title: "All Campaigns", path: "features/campaigns" },
      { title: "Campaign Objectives", path: "features/campaigns" },
      { title: "Programs", path: "features/campaigns" },
      { title: "Campaign Catalogs", path: "features/campaigns" },
      { title: "Campaign Types", path: "features/campaigns" },
    ],
  },
  {
    title: "Offer Management",
    path: "features/offers",
    children: [
      { title: "All Offers", path: "features/offers" },
      { title: "Offer Types", path: "features/offers" },
      { title: "Offer Catalogs", path: "features/offers" },
    ],
  },
  {
    title: "Product Management",
    path: "features/products",
    children: [
      { title: "All Products", path: "features/products" },
      { title: "Product Types", path: "features/products" },
      { title: "Product Catalogs", path: "features/products" },
    ],
  },
  {
    title: "Segment Management",
    path: "features/segments",
    children: [
      { title: "All Segments", path: "features/segments" },
      { title: "Segment Types", path: "features/segments" },
      { title: "Segment Catalogs", path: "features/segments" },
      { title: "Quick Lists", path: "features/quicklists" },
    ],
  },
  {
    title: "Customer 360 Profile",
    path: "features/customers360",
    children: [
      { title: "Customers", path: "features/customers360" },
      { title: "Customer Identity", path: "features/customerIdentity" },
    ],
  },
  {
    title: "User Management",
    path: "features/users",
    children: [
      { title: "All Users", path: "features/users" },
      { title: "Access Control", path: "features/roles" },
    ],
  },
  {
    title: "Communications",
    path: "features/communications",
    children: [
      { title: "Manual Broadcast", path: "features/manual-broadcast" },
      { title: "Manual Rewards", path: "features/manual-rewards" },
      { title: "Notifications", path: "features/notifications" },
    ],
  },
  {
    title: "Reports & Analytics",
    path: "features/reports-analytics",
    children: [
      { title: "Reports", path: "features/reports-analytics" },
      { title: "KPIs", path: "features/kpis" },
      { title: "ETL", path: "features/etl" },
    ],
  },
  {
    title: "System & Configuration",
    path: "features/settings",
    children: [
      { title: "Settings", path: "features/settings" },
      { title: "Configurations", path: "features/configurations" },
      { title: "Connection Profiles", path: "features/connection-profiles" },
      { title: "Servers", path: "features/servers" },
      { title: "Jobs", path: "features/jobs" },
    ],
  },
];
