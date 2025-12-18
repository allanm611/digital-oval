import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Core dashboard components (always loaded)
import DashboardLayout from "../components/DashboardLayout";

// Lazy loaded components grouped by feature
const DashboardHome = lazy(() => import("../components/DashboardHome"));

// Campaign Pages
const CampaignPages = {
  CampaignsPage: lazy(() => import("../../campaigns/pages/CampaignsPage")),
  CampaignsAnalyticsPage: lazy(() => import("../../campaigns/pages/CampaignsAnalyticsPage")),
  CampaignDetailsPage: lazy(() => import("../../campaigns/pages/CampaignDetailsPage")),
  CreateCampaignPage: lazy(() => import("../../campaigns/pages/CreateCampaignPage")),
  CampaignCategoriesPage: lazy(() => import("../../campaigns/pages/CampaignCategoriesPage")),
  CampaignTypesPage: lazy(() => import("../../campaigns/pages/CampaignTypesPage")),
  CampaignObjectivesPage: lazy(() => import("../../campaigns/pages/CampaignObjectivesPage")),
  TeamRolesPage: lazy(() => import("../../campaigns/pages/TeamRolesPage")),
  ProgramsPage: lazy(() => import("../../campaigns/pages/ProgramsPage")),
  ProgramDetailsPage: lazy(() => import("../../campaigns/pages/ProgramDetailsPage")),
  CommunicationPolicyPage: lazy(() => import("../../campaigns/pages/CommunicationPolicyPage")),
  DepartmentPage: lazy(() => import("../../campaigns/pages/DepartmentPage")),
  LineOfBusinessPage: lazy(() => import("../../campaigns/pages/LineOfBusinessPage")),
  CampaignApprovalHistoryPage: lazy(() => import("../../campaigns/pages/CampaignApprovalHistoryPage")),
  CampaignLifecycleHistoryPage: lazy(() => import("../../campaigns/pages/CampaignLifecycleHistoryPage")),
  DNDManagementPage: lazy(() => import("../../campaigns/pages/DNDManagementPage")),
  DNDChannelPage: lazy(() => import("../../campaigns/pages/DNDChannelPage")),
  VIPListManagementPage: lazy(() => import("../../campaigns/pages/VIPListManagementPage")),
  SeedListManagementPage: lazy(() => import("../../campaigns/pages/SeedListManagementPage")),
};

// Offer Pages
const OfferPages = {
  OffersPage: lazy(() => import("../../offers/pages/OffersPage")),
  OfferDetailsPage: lazy(() => import("../../offers/pages/OfferDetailsPage")),
  OfferLifecycleHistoryPage: lazy(() => import("../../offers/pages/OfferLifecycleHistoryPage")),
  OfferApprovalHistoryPage: lazy(() => import("../../offers/pages/OfferApprovalHistoryPage")),
  CreateOfferPage: lazy(() => import("../../offers/pages/CreateOfferPage")),
  OfferTypesPage: lazy(() => import("../../offers/pages/OfferTypesPage")),
  OfferCategoriesPage: lazy(() => import("../../offers/pages/OfferCategoriesPage")),
  TrackingSourcesPage: lazy(() => import("../../offers/pages/TrackingSourcesPage")),
  CreativeTemplatesPage: lazy(() => import("../../offers/pages/CreativeTemplatesPage")),
  RewardTypesPage: lazy(() => import("../../offers/pages/RewardTypesPage")),
  SenderIdsPage: lazy(() => import("../../offers/pages/SenderIdsPage")),
  SMSRoutesPage: lazy(() => import("../../offers/pages/SMSRoutesPage")),
  LanguagesPage: lazy(() => import("../../offers/pages/LanguagesPage")),
  CharacterSetsPage: lazy(() => import("../../offers/pages/CharacterSetsPage")),
  OfferCreativeDetailsPage: lazy(() => import("../../offers/pages/OfferCreativeDetailsPage")),
};

// Product Pages
const ProductPages = {
  ProductsPage: lazy(() => import("../../products/pages/ProductsPage")),
  CreateProductPage: lazy(() => import("../../products/pages/CreateProductPage")),
  EditProductPage: lazy(() => import("../../products/pages/EditProductPage")),
  ProductDetailsPage: lazy(() => import("../../products/pages/ProductDetailsPage")),
  ProductCategoriesPage: lazy(() => import("../../products/pages/ProductCategoriesPage")),
  ProductTypesPage: lazy(() => import("../../products/pages/ProductTypesPage")),
  ComboTypesPage: lazy(() => import("../../products/pages/ComboTypesPage")),
  ControlGroupsPage: lazy(() => import("../../products/pages/ControlGroupsPage")),
};

// Segment Pages
const SegmentPages = {
  SegmentManagementPage: lazy(() => import("../../segments/pages/SegmentManagementPage")),
  SegmentDetailsPage: lazy(() => import("../../segments/pages/SegmentDetailsPage")),
  EditSegmentPage: lazy(() => import("../../segments/pages/EditSegmentPage")),
  SegmentCategoriesPage: lazy(() => import("../../segments/pages/SegmentCategoriesPage")),
  SegmentListPage: lazy(() => import("../../segments/pages/SegmentListPage")),
  SegmentTypesPage: lazy(() => import("../../segments/pages/SegmentTypesPage")),
};

// Job Pages
const JobPages = {
  JobTypesPage: lazy(() => import("../../jobs/pages/JobTypesPage")),
  ScheduledJobsPage: lazy(() => import("../../jobs/pages/ScheduledJobsPage")),
  ScheduledJobDetailsPage: lazy(() => import("../../jobs/pages/ScheduledJobDetailsPage")),
  CreateScheduledJobPage: lazy(() => import("../../jobs/pages/CreateScheduledJobPage")),
  ScheduledJobsAnalyticsPage: lazy(() => import("../../jobs/pages/ScheduledJobsAnalyticsPage")),
  JobDependenciesPage: lazy(() => import("../../jobs/pages/JobDependenciesPage")),
  JobDependenciesAnalyticsPage: lazy(() => import("../../jobs/pages/JobDependenciesAnalyticsPage")),
  JobWorkflowStepsPage: lazy(() => import("../../jobs/pages/JobWorkflowStepsPage")),
  JobWorkflowStepDetailsPage: lazy(() => import("../../jobs/pages/JobWorkflowStepDetailsPage")),
  CreateJobWorkflowStepPage: lazy(() => import("../../jobs/pages/CreateJobWorkflowStepPage")),
  JobWorkflowStepsAnalyticsPage: lazy(() => import("../../jobs/pages/JobWorkflowStepsAnalyticsPage")),
  WorkflowsPage: lazy(() => import("../../jobs/pages/WorkflowsPage")),
  WorkflowDetailsPage: lazy(() => import("../../jobs/pages/WorkflowDetailsPage")),
  CreateWorkflowPage: lazy(() => import("../../jobs/pages/CreateWorkflowPage")),
  WorkflowsAnalyticsPage: lazy(() => import("../../jobs/pages/WorkflowsAnalyticsPage")),
  JobExecutionsPage: lazy(() => import("../../jobs/pages/JobExecutionsPage")),
  JobExecutionDetailsPage: lazy(() => import("../../jobs/pages/JobExecutionDetailsPage")),
  JobExecutionsAnalyticsPage: lazy(() => import("../../jobs/pages/JobExecutionsAnalyticsPage")),
  StepExecutionsPage: lazy(() => import("../../jobs/pages/StepExecutionsPage")),
  StepExecutionDetailsPage: lazy(() => import("../../jobs/pages/StepExecutionDetailsPage")),
  StepExecutionsAnalyticsPage: lazy(() => import("../../jobs/pages/StepExecutionsAnalyticsPage")),
};

// User Pages
const UserPages = {
  UserManagementPage: lazy(() => import("../components/UserManagementPage")),
  UserDetailsPage: lazy(() => import("../../users/pages/UserDetailsPage")),
  UserProfilePage: lazy(() => import("../../users/pages/UserProfilePage")),
};

// Settings & Configuration Pages
const SettingsPages = {
  ConfigurationPage: lazy(() => import("../components/ConfigurationPage")),
  ConfigurationDetailsPage: lazy(() => import("../components/ConfigurationDetailsPage")),
  SettingsPage: lazy(() => import("../../settings/pages/SettingsPage")),
  CommunicationChannelsPage: lazy(() => import("../../settings/pages/CommunicationChannelsPage")),
  SettingsSMSRoutesPage: lazy(() => import("../../settings/pages/SMSRoutesPage")),
  RoutesPage: lazy(() => import("../../settings/pages/RoutesPage")),
};

// Server & Connection Pages
const ServerPages = {
  ServersPage: lazy(() => import("../../servers/pages/ServersPage")),
  ServerDetailsPage: lazy(() => import("../../servers/pages/ServerDetailsPage")),
  ServerFormPage: lazy(() => import("../../servers/pages/ServerFormPage")),
  ConnectionProfilesPage: lazy(() => import("../../connection-profiles/pages/ConnectionProfilesPage")),
  ConnectionProfileDetailsPage: lazy(() => import("../../connection-profiles/pages/ConnectionProfileDetailsPage")),
  ConnectionProfileFormPage: lazy(() => import("../../connection-profiles/pages/ConnectionProfileFormPage")),
  ConnectionProfilesAnalyticsPage: lazy(() => import("../../connection-profiles/pages/ConnectionProfilesAnalyticsPage")),
};

// Analytics & Reports Pages
const AnalyticsPages = {
  OverallDashboardPerformancePage: lazy(() => import("./OverallDashboardPerformancePage")),
  CustomerProfileReportsPage: lazy(() => import("./CustomerProfileReportsPage")),
  CustomersPage: lazy(() => import("./CustomersPage")),
  CustomerSearchResultsPage: lazy(() => import("./CustomerSearchResultsPage")),
  CampaignReportsPage: lazy(() => import("./CampaignReportsPage")),
  DeliverySMSReportsPage: lazy(() => import("./DeliverySMSReportsPage")),
  DeliveryEmailReportsPage: lazy(() => import("./DeliveryEmailReportsPage")),
  OfferReportsPage: lazy(() => import("./OfferReportsPage")),
};

// Other Pages
const OtherPages = {
  QuickListsPage: lazy(() => import("../../quicklists/pages/QuickListsPage")),
  QuickListDetailsPage: lazy(() => import("../../quicklists/pages/QuickListDetailsPage")),
  CreateManualBroadcastPage: lazy(() => import("../../manual-broadcast/pages/CreateManualBroadcastPage")),
  CreateManualRewardPage: lazy(() => import("../../manual-rewards/pages/CreateManualRewardPage")),
  ManualRewardsPage: lazy(() => import("../../manual-rewards/pages/ManualRewardsPage")),
  CustomerIdentityPage: lazy(() => import("../../customer/pages/CustomerIdentityPage")),
  CustomerIdentityFieldDetailsPage: lazy(() => import("../../customer/pages/CustomerIdentityFieldDetailsPage")),
  SearchResultsPage: lazy(() => import("../../../shared/pages/SearchResultsPage")),
  NotificationsPage: lazy(() => import("../../notifications/pages/NotificationsPage")),
};

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/campaigns" element={<CampaignPages.CampaignsPage />} />
        <Route
          path="/campaigns/analytics"
          element={<CampaignPages.CampaignsAnalyticsPage />}
        />
        <Route path="/campaigns/:id" element={<CampaignPages.CampaignDetailsPage />} />
        <Route path="/campaigns/:id/edit" element={<CampaignPages.CreateCampaignPage />} />
        <Route path="/campaigns/create" element={<CampaignPages.CreateCampaignPage />} />
        {/* Campaign history pages - placeholder for future use when backend endpoints are implemented */}
        <Route
          path="/campaigns/:id/approval-history"
          element={<CampaignPages.CampaignApprovalHistoryPage />}
        />
        <Route
          path="/campaigns/:id/lifecycle-history"
          element={<CampaignPages.CampaignLifecycleHistoryPage />}
        />
        <Route path="/campaign-catalogs" element={<CampaignPages.CampaignCategoriesPage />} />
        <Route path="/campaign-types" element={<CampaignPages.CampaignTypesPage />} />
        {/* Commented out - now using modal instead of page */}
        {/* <Route
          path="/campaign-catalogs/:catalogId/assign"
          element={<AssignItemsPage itemType="campaigns" />}
        /> */}
        <Route
          path="/campaign-objectives"
          element={<CampaignPages.CampaignObjectivesPage />}
        />
        <Route path="/team-roles" element={<CampaignPages.TeamRolesPage />} />
        <Route path="/departments" element={<CampaignPages.DepartmentPage />} />
        <Route path="/line-of-business" element={<CampaignPages.LineOfBusinessPage />} />
        <Route path="/programs" element={<CampaignPages.ProgramsPage />} />
        <Route path="/programs/:id" element={<CampaignPages.ProgramDetailsPage />} />
        <Route
          path="/campaign-communication-policy"
          element={<CampaignPages.CommunicationPolicyPage />}
        />
        <Route path="/offers" element={<OfferPages.OffersPage />} />
        <Route path="/offers/create" element={<OfferPages.CreateOfferPage />} />
        <Route path="/offers/:id" element={<OfferPages.OfferDetailsPage />} />
        <Route path="/offers/:id/edit" element={<OfferPages.CreateOfferPage />} />
        <Route
          path="/offers/:id/approval-history"
          element={<OfferPages.OfferApprovalHistoryPage />}
        />
        <Route
          path="/offers/:id/lifecycle-history"
          element={<OfferPages.OfferLifecycleHistoryPage />}
        />
        <Route
          path="/offer-creatives/:id"
          element={<OfferPages.OfferCreativeDetailsPage />}
        />
        <Route path="/products" element={<ProductPages.ProductsPage />} />
        <Route path="/products/create" element={<ProductPages.CreateProductPage />} />
        <Route path="/products/:id" element={<ProductPages.ProductDetailsPage />} />
        <Route path="/products/:id/edit" element={<ProductPages.EditProductPage />} />
        <Route path="/products/catalogs" element={<ProductPages.ProductCategoriesPage />} />
        {/* Commented out - now using modal instead of page */}
        {/* <Route
          path="/products/catalogs/:catalogId/assign"
          element={<AssignItemsPage itemType="products" />}
        /> */}
        <Route path="/product-types" element={<ProductPages.ProductTypesPage />} />
        <Route path="/combo-types" element={<ProductPages.ComboTypesPage />} />
        <Route path="/offer-types" element={<OfferPages.OfferTypesPage />} />
        <Route path="/offer-catalogs" element={<OfferPages.OfferCategoriesPage />} />
        {/* Commented out - now using modal instead of page */}
        {/* <Route
          path="/offer-catalogs/:catalogId/assign"
          element={<AssignItemsPage itemType="offers" />}
        /> */}
        {/* <Route path="/offer-catalogs/:id" element={<CategoryDetailsPage />} /> */}
        <Route path="/user-management" element={<UserPages.UserManagementPage />} />
        <Route path="/user-management/:id" element={<UserPages.UserDetailsPage />} />
        <Route path="/profile" element={<UserPages.UserProfilePage />} />
        <Route path="/segments" element={<SegmentPages.SegmentManagementPage />} />
        <Route path="/segments/:id" element={<SegmentPages.SegmentDetailsPage />} />
        <Route path="/segments/:id/edit" element={<SegmentPages.EditSegmentPage />} />
        <Route path="/segment-catalogs" element={<SegmentPages.SegmentCategoriesPage />} />
        {/* Commented out - now using modal instead of page */}
        {/* <Route
          path="/segment-catalogs/:catalogId/assign"
          element={<AssignItemsPage itemType="segments" />}
        /> */}
        <Route path="/segment-list" element={<SegmentPages.SegmentListPage />} />
        <Route path="/segment-types" element={<SegmentPages.SegmentTypesPage />} />
        <Route path="/control-groups" element={<ProductPages.ControlGroupsPage />} />
        <Route path="/quicklists" element={<OtherPages.QuickListsPage />} />
        <Route
          path="/quicklists/create"
          element={<OtherPages.CreateManualBroadcastPage />}
        />
        <Route path="/manual-rewards" element={<OtherPages.ManualRewardsPage />} />
        <Route
          path="/manual-rewards/create"
          element={<OtherPages.CreateManualRewardPage />}
        />
        <Route path="/quicklists/:id" element={<OtherPages.QuickListDetailsPage />} />
        <Route path="/customers" element={<AnalyticsPages.CustomersPage />} />
        <Route path="/configuration" element={<SettingsPages.ConfigurationPage />} />
        <Route
          path="/configuration/:id"
          element={<SettingsPages.ConfigurationDetailsPage />}
        />
        <Route
          path="/offer-tracking-sources"
          element={<OfferPages.TrackingSourcesPage />}
        />
        <Route path="/creative-templates" element={<OfferPages.CreativeTemplatesPage />} />
        <Route path="/reward-types" element={<OfferPages.RewardTypesPage />} />
        <Route path="/sender-ids" element={<OfferPages.SenderIdsPage />} />
        <Route path="/languages" element={<OfferPages.LanguagesPage />} />
        <Route path="/character-sets" element={<OfferPages.CharacterSetsPage />} />
        <Route
          path="/communication-channels"
          element={<SettingsPages.CommunicationChannelsPage />}
        />
        <Route
          path="/sms-routes"
          element={<SettingsPages.SettingsSMSRoutesPage />}
        />
        <Route
          path="/routes"
          element={<SettingsPages.RoutesPage />}
        />
        <Route path="/customer-identity" element={<OtherPages.CustomerIdentityPage />} />
        <Route
          path="/customer-identity/fields/:id"
          element={<OtherPages.CustomerIdentityFieldDetailsPage />}
        />
        <Route path="/search" element={<OtherPages.SearchResultsPage />} />
        <Route
          path="/reports/overview"
          element={<AnalyticsPages.OverallDashboardPerformancePage />}
        />
        <Route
          path="/reports/customer-profiles"
          element={<AnalyticsPages.CustomerProfileReportsPage />}
        />
        <Route
          path="/reports/customer-profiles/search"
          element={<AnalyticsPages.CustomerSearchResultsPage />}
        />
        <Route path="/reports/campaigns" element={<AnalyticsPages.CampaignReportsPage />} />
        <Route path="/reports/offers" element={<AnalyticsPages.OfferReportsPage />} />
        <Route path="/reports/delivery" element={<AnalyticsPages.DeliverySMSReportsPage />} />
        <Route
          path="/reports/email-delivery"
          element={<AnalyticsPages.DeliveryEmailReportsPage />}
        />
        <Route path="/settings" element={<SettingsPages.SettingsPage />} />
        <Route path="/servers" element={<ServerPages.ServersPage />} />
        <Route path="/servers/new" element={<ServerPages.ServerFormPage mode="create" />} />
        <Route
          path="/servers/:id/edit"
          element={<ServerPages.ServerFormPage mode="edit" />}
        />
        <Route path="/servers/:id" element={<ServerPages.ServerDetailsPage />} />
        <Route
          path="/connection-profiles"
          element={<ServerPages.ConnectionProfilesPage />}
        />
        <Route
          path="/connection-profiles/new"
          element={<ServerPages.ConnectionProfileFormPage mode="create" />}
        />
        <Route
          path="/connection-profiles/:id/edit"
          element={<ServerPages.ConnectionProfileFormPage mode="edit" />}
        />
        <Route
          path="/connection-profiles/analytics"
          element={<ServerPages.ConnectionProfilesAnalyticsPage />}
        />
        <Route
          path="/connection-profiles/:id"
          element={<ServerPages.ConnectionProfileDetailsPage />}
        />
        <Route path="/jobs" element={<JobPages.ScheduledJobsPage />} />
        <Route path="/scheduled-jobs" element={<JobPages.ScheduledJobsPage />} />
        <Route
          path="/scheduled-jobs/:id"
          element={<JobPages.ScheduledJobDetailsPage />}
        />
        <Route
          path="/scheduled-jobs/:id/edit"
          element={<JobPages.CreateScheduledJobPage />}
        />
        <Route
          path="/scheduled-jobs/create"
          element={<JobPages.CreateScheduledJobPage />}
        />
        <Route
          path="/scheduled-jobs/analytics"
          element={<JobPages.ScheduledJobsAnalyticsPage />}
        />
        <Route path="/job-types" element={<JobPages.JobTypesPage />} />
        <Route path="/job-dependencies" element={<JobPages.JobDependenciesPage />} />
        <Route
          path="/job-dependencies/analytics"
          element={<JobPages.JobDependenciesAnalyticsPage />}
        />
        <Route path="/job-workflow-steps" element={<JobPages.JobWorkflowStepsPage />} />
        <Route
          path="/job-workflow-steps/create"
          element={<JobPages.CreateJobWorkflowStepPage />}
        />
        <Route
          path="/job-workflow-steps/:id"
          element={<JobPages.JobWorkflowStepDetailsPage />}
        />
        <Route
          path="/job-workflow-steps/:id/edit"
          element={<JobPages.CreateJobWorkflowStepPage />}
        />
        <Route
          path="/job-workflow-steps/analytics"
          element={<JobPages.JobWorkflowStepsAnalyticsPage />}
        />
        <Route path="/workflows" element={<JobPages.WorkflowsPage />} />
        <Route path="/workflows/create" element={<JobPages.CreateWorkflowPage />} />
        <Route path="/workflows/:id" element={<JobPages.WorkflowDetailsPage />} />
        <Route path="/workflows/:id/edit" element={<JobPages.CreateWorkflowPage />} />
        <Route
          path="/workflows/analytics"
          element={<JobPages.WorkflowsAnalyticsPage />}
        />
        <Route path="/job-executions" element={<JobPages.JobExecutionsPage />} />
        <Route
          path="/job-executions/:id"
          element={<JobPages.JobExecutionDetailsPage />}
        />
        <Route
          path="/job-executions/analytics"
          element={<JobPages.JobExecutionsAnalyticsPage />}
        />
        <Route path="/step-executions" element={<JobPages.StepExecutionsPage />} />
        <Route
          path="/step-executions/:id"
          element={<JobPages.StepExecutionDetailsPage />}
        />
        <Route
          path="/step-executions/analytics"
          element={<JobPages.StepExecutionsAnalyticsPage />}
        />
        <Route path="/notifications" element={<OtherPages.NotificationsPage />} />
        <Route path="/dnd-management" element={<CampaignPages.DNDManagementPage />} />
        <Route path="/dnd-management/:channel" element={<CampaignPages.DNDChannelPage />} />
        <Route
          path="/vip-list-management"
          element={<CampaignPages.VIPListManagementPage />}
        />
        <Route
          path="/seed-list-management"
          element={<CampaignPages.SeedListManagementPage />}
        />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
}
