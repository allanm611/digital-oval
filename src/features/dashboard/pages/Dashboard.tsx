import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";

import DashboardLayout from "../components/DashboardLayout";

const DashboardHome = lazy(
  () => import(/* webpackPrefetch: true */ "../components/DashboardHome"),
);

const CampaignPages = {
  CampaignsPage: lazy(() => import("../../campaigns/pages/CampaignsPageWrapper")),
  CampaignsAnalyticsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/CampaignsAnalyticsPage"
      ),
  ),
  CampaignDetailsPage: lazy(() => import("../../campaigns/pages/CampaignDetailsPageWrapper")),
  CreateCampaignPage: lazy(() => import("../../campaigns/pages/CreateCampaignPageWrapper")),
  CampaignFlowDetailsPage: lazy(() => import("../../campaigns/pages/CampaignFlowDetailsPage")),
  CampaignCategoriesPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/CampaignCategoriesPage"
      ),
  ),
  CampaignTypesPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/CampaignTypesPage"
      ),
  ),
  CampaignObjectivesPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/CampaignObjectivesPage"
      ),
  ),
  TeamRolesPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../roles/pages/TeamRolesPermissionsPage"
      ),
  ),
  ProgramsPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../campaigns/pages/ProgramsPage"),
  ),
  ProgramDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/ProgramDetailsPage"
      ),
  ),
  CommunicationPolicyPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/CommunicationPolicyPage"
      ),
  ),
  DepartmentPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/DepartmentPage"
      ),
  ),
  LineOfBusinessPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/LineOfBusinessPage"
      ),
  ),
  CampaignApprovalHistoryPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/CampaignApprovalHistoryPage"
      ),
  ),
  CampaignLifecycleHistoryPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/CampaignLifecycleHistoryPage"
      ),
  ),
  DNDManagementPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/DNDManagementPage"
      ),
  ),
  DNDChannelPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/DNDChannelPage"
      ),
  ),
  VIPListManagementPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/VIPListManagementPage"
      ),
  ),
  SeedListManagementPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/SeedListManagementPage"
      ),
  ),
};

// Offer Pages - All routes preloaded for instant access

const OfferPages = {
  OffersPage: lazy(() => import("../../offers/pages/OffersPageWrapper")),
  OfferDetailsPage: lazy(() => import("../../offers/pages/OfferDetailsPageWrapper")),
  OfferLifecycleHistoryPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../offers/pages/OfferLifecycleHistoryPage"
      ),
  ),
  OfferApprovalHistoryPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../offers/pages/OfferApprovalHistoryPage"
      ),
  ),
  CreateOfferPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../offers/pages/CreateOfferPage"),
  ),
  OfferTypesPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../offers/pages/OfferTypesPage"),
  ),
  OfferCategoriesPage: lazy(() => import("../../offers/pages/OfferCategoriesPageWrapper")),
  TrackingSourcesPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../offers/pages/TrackingSourcesPage"
      ),
  ),
  CreativeTemplatesPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../offers/pages/CreativeTemplatesPage"
      ),
  ),
  RewardTypesPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../offers/pages/RewardTypesPage"),
  ),
  SenderIdsPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../offers/pages/SenderIdsPage"),
  ),
  LanguagesPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../offers/pages/LanguagesPage"),
  ),
  CharacterSetsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../offers/pages/CharacterSetsPage"
      ),
  ),
  OfferCreativeDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../offers/pages/OfferCreativeDetailsPage"
      ),
  ),
};

// Product Pages - All routes preloaded for instant access

const ProductPages = {
  ProductsPage: lazy(() => import("../../products/pages/ProductsPageWrapper")),
  CreateProductPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../products/pages/CreateProductPage"
      ),
  ),
  EditProductPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../products/pages/EditProductPage"
      ),
  ),
  ProductDetailsPage: lazy(() => import("../../products/pages/ProductDetailsPageWrapper")),
  ProductCategoriesPage: lazy(() => import("../../products/pages/ProductCategoriesPageWrapper")),
  ProductTypesPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../products/pages/ProductTypesPage"
      ),
  ),
  ComboTypesPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../products/pages/ComboTypesPage"),
  ),
  ControlGroupsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../products/pages/ControlGroupsPage"
      ),
  ),
};

// Segment Pages - All routes preloaded for instant access

const SegmentPages = {
  SegmentManagementPage: lazy(() => import("../../segments/pages/SegmentManagementPageWrapper")),
  SegmentAnalyticsPage: lazy(() => import("../../segments/pages/SegmentAnalyticsPage")),
  SegmentDetailsPage: lazy(() => import("../../segments/pages/SegmentDetailsPageWrapper")),
  EditSegmentPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../segments/pages/EditSegmentPage"
      ),
  ),
  SegmentCategoriesPage: lazy(() => import("../../segments/pages/SegmentCategoriesPageWrapper")),
  SegmentListPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../quicklists/pages/QuickListPage"
      ),
  ),
  SegmentTypesPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../segments/pages/SegmentTypesPage"
      ),
  ),
};

// Job Pages - All routes preloaded for instant access

const JobPages = {
  JobTypesPage: lazy(
    () => import(/* webpackPrefetch: true */ "../../jobs/pages/JobTypesPage"),
  ),
  ScheduledJobsPage: lazy(() => import("../../jobs/pages/ScheduledJobsPageWrapper")),
  ScheduledJobDetailsPage: lazy(() => import("../../jobs/pages/ScheduledJobDetailsPageWrapper")),
  CreateScheduledJobPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/CreateScheduledJobPage"
      ),
  ),
  ScheduledJobsAnalyticsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/ScheduledJobsAnalyticsPage"
      ),
  ),
  JobDependenciesPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/JobDependenciesPage"
      ),
  ),
  JobDependenciesAnalyticsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/JobDependenciesAnalyticsPage"
      ),
  ),
  JobWorkflowStepsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/JobWorkflowStepsPage"
      ),
  ),
  JobWorkflowStepDetailsPage: lazy(() => import("../../jobs/pages/JobWorkflowStepDetailsPageWrapper")),
  CreateJobWorkflowStepPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/CreateJobWorkflowStepPage"
      ),
  ),
  JobWorkflowStepsAnalyticsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/JobWorkflowStepsAnalyticsPage"
      ),
  ),
  WorkflowsPage: lazy(
    () => import(/* webpackPrefetch: true */ "../../jobs/pages/WorkflowsPage"),
  ),
  WorkflowDetailsPage: lazy(() => import("../../jobs/pages/WorkflowDetailsPageWrapper")),
  CreateWorkflowPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../jobs/pages/CreateWorkflowPage"),
  ),
  WorkflowsAnalyticsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/WorkflowsAnalyticsPage"
      ),
  ),
  JobExecutionsPage: lazy(() => import("../../jobs/pages/JobExecutionsPageWrapper")),
  JobExecutionDetailsPage: lazy(() => import("../../jobs/pages/JobExecutionDetailsPageWrapper")),
  JobExecutionsAnalyticsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/JobExecutionsAnalyticsPage"
      ),
  ),
  StepExecutionsPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../jobs/pages/StepExecutionsPage"),
  ),
  StepExecutionDetailsPage: lazy(() => import("../../jobs/pages/StepExecutionDetailsPageWrapper")),
  StepExecutionsAnalyticsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/StepExecutionsAnalyticsPage"
      ),
  ),
};

// User Pages - All routes preloaded for instant access
const UserPages = {
  UserManagementPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../users/pages/UserManagementPageWrapper"
      ),
  ),
  UserAnalyticsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../users/pages/UserAnalyticsPageWrapper"
      ),
  ),
  UserDetailsPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../users/pages/UserDetailsPage"),
  ),
  UserProfilePage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../users/pages/UserProfilePage"),
  ),
};

// Settings & Configuration Pages - All routes preloaded for instant access
const SettingsPages = {
  ConfigurationPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../configurations/pages/ConfigurationPage"
      ),
  ),
  ConfigurationDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../configurations/pages/ConfigurationDetailsPage"
      ),
  ),
  SettingsPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../settings/pages/SettingsPage"),
  ),
  CommunicationChannelsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../settings/pages/CommunicationChannelsPage"
      ),
  ),
  SettingsSMSRoutesPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../settings/pages/SMSRoutesPage"),
  ),
  SMSRoutesPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../routes/pages/RoutesContainer"),
  ),
  RoutesPage: lazy(
    () => import(/* webpackPrefetch: true */ "../../settings/pages/RoutesPage"),
  ),
  SMSTestPage: lazy(
    () => import(/* webpackPrefetch: true */ "../../settings/pages/SMSTestPage"),
  ),
};

// Server & Connection Pages - All routes preloaded for instant access
const ServerPages = {
  DataConnectorsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../data-connectors/pages/DataConnectors"
      ),
  ),
  DataConnectorDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../data-connectors/pages/DataConnectorDetailsPage"
      ),
  ),
  ServersPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../servers/pages/ServersPageWrapper"
      ),
  ),
  ServerDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../servers/pages/ServerDetailsPageWrapper"
      ),
  ),
  ServerFormPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../servers/pages/ServerFormPage"),
  ),
  ConnectionProfilesPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../connection-profiles/pages/ConnectionProfilesPage"
      ),
  ),
  ConnectionProfileDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../connection-profiles/pages/ConnectionProfileDetailsPage"
      ),
  ),
  ConnectionProfileFormPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../connection-profiles/pages/ConnectionProfileFormPage"
      ),
  ),
  ConnectionProfilesAnalyticsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../connection-profiles/pages/ConnectionProfilesAnalyticsPage"
      ),
  ),
  KPIsPage: lazy(
    () => import(/* webpackPrefetch: true */ "../../kpis/pages/KPIsContainer"),
  ),
};

// ETL Pages - All routes preloaded for instant access
const EtlPages = {
  EtlFileRegistryPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../etl/pages/EtlFileRegistryPage"),
  ),
  EtlFetchControlsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../etl/pages/EtlFetchControlsPage"
      ),
  ),
  EtlAnalyticsPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../etl/pages/EtlAnalyticsPage"),
  ),
};

// Analytics & Reports Pages - All routes preloaded for instant access
// Using Suspense wrapper for faster perceived loading

const AnalyticsPages = {
  OverallDashboardPerformancePage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "./OverallDashboardPerformancePage"),
  ),
  CustomerProfileReportsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../reports-analytics/pages/CustomerProfileReportsPage"
      ),
  ),
  CustomersPage: lazy(() => import("../../customers360/pages/CustomersPageWrapper")),
  CustomerSearchResultsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../customers360/pages/CustomerSearchResultsPage"
      ),
  ),
  CampaignReportsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../reports-analytics/pages/CampaignReportsPage"
      ),
  ),
  DeliverySMSReportsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../reports-analytics/pages/DeliverySMSReportsPage"
      ),
  ),
  DeliveryEmailReportsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../reports-analytics/pages/DeliveryEmailReportsPage"
      ),
  ),
  OfferReportsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../reports-analytics/pages/OfferReportsPage"
      ),
  ),
};

// Other Pages - All routes preloaded for instant access
const OtherPages = {
  ManualBroadcastsHubPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../manual-actions/pages/ManualBroadcastsHubPage"
      ),
  ),
  ManualBroadcastListsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../manual-broadcast/pages/ManualBroadcastListsPage"
      ),
  ),
  BroadcastDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../manual-broadcast/pages/BroadcastDetailsPage"
      ),
  ),
  QuickListsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../quicklists/pages/QuickListsPageWrapper"
      ),
  ),
  QuickListPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../quicklists/pages/QuickListPage"
      ),
  ),
  QuickListDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../quicklists/pages/QuickListDetailsPageWrapper"
      ),
  ),
  CreateManualBroadcastPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../manual-broadcast/pages/CreateManualBroadcastPage"
      ),
  ),
  CommunicationAnalyticsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../communications/pages/CommunicationAnalyticsPage"
      ),
  ),
  CreateManualRewardPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../manual-rewards/pages/CreateManualRewardPage"
      ),
  ),
  ManualRewardsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../manual-rewards/pages/ManualRewardsPage"
      ),
  ),
  CustomerIdentityPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../customerIdentity/pages/CustomerIdentityPage"
      ),
  ),
  CustomerIdentityFieldDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../customerIdentity/pages/CustomerIdentityFieldDetailsPage"
      ),
  ),
  SearchResultsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../../shared/pages/SearchResultsPage"
      ),
  ),
  NotificationsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../notifications/pages/NotificationsPage"
      ),
  ),
};

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/campaigns" element={<CampaignPages.CampaignsPage />} />
          <Route
            path="/campaigns/analytics"
            element={<CampaignPages.CampaignsAnalyticsPage />}
          />
          <Route
            path="/campaigns/:id"
            element={<CampaignPages.CampaignDetailsPage />}
          />
          <Route
            path="/campaigns/:campaignId/flows/:flowId"
            element={<CampaignPages.CampaignFlowDetailsPage />}
          />
          <Route
            path="/campaigns/:id/edit"
            element={<CampaignPages.CreateCampaignPage />}
          />
          <Route
            path="/campaigns/create"
            element={<CampaignPages.CreateCampaignPage />}
          />
          {/* Campaign history pages - placeholder for future use when backend endpoints are implemented */}
          <Route
            path="/campaigns/:id/approval-history"
            element={<CampaignPages.CampaignApprovalHistoryPage />}
          />
          <Route
            path="/campaigns/:id/lifecycle-history"
            element={<CampaignPages.CampaignLifecycleHistoryPage />}
          />
          <Route
            path="/campaign-catalogs"
            element={<CampaignPages.CampaignCategoriesPage />}
          />
          <Route
            path="/campaign-types"
            element={<CampaignPages.CampaignTypesPage />}
          />
          {/* Commented out - now using modal instead of page */}
          {/* <Route
          path="/campaign-catalogs/:catalogId/assign"
          element={<AssignItemsPage itemType="campaigns" />}
        /> */}
          <Route
            path="/campaign-objectives"
            element={<CampaignPages.CampaignObjectivesPage />}
          />
          <Route
            path="/access-control"
            element={<CampaignPages.TeamRolesPage />}
          />
          <Route
            path="/departments"
            element={<CampaignPages.DepartmentPage />}
          />
          <Route
            path="/line-of-business"
            element={<CampaignPages.LineOfBusinessPage />}
          />
          <Route path="/programs" element={<CampaignPages.ProgramsPage />} />
          <Route
            path="/programs/:id"
            element={<CampaignPages.ProgramDetailsPage />}
          />
          <Route
            path="/campaign-communication-policy"
            element={<CampaignPages.CommunicationPolicyPage />}
          />
          <Route path="/offers" element={<OfferPages.OffersPage />} />
          <Route
            path="/offers/create"
            element={<OfferPages.CreateOfferPage />}
          />
          <Route path="/offers/:id" element={<OfferPages.OfferDetailsPage />} />
          <Route
            path="/offers/:id/edit"
            element={<OfferPages.CreateOfferPage />}
          />
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
          <Route
            path="/products/create"
            element={<ProductPages.CreateProductPage />}
          />
          <Route
            path="/products/:id"
            element={<ProductPages.ProductDetailsPage />}
          />
          <Route
            path="/products/:id/edit"
            element={<ProductPages.EditProductPage />}
          />
          <Route
            path="/products/catalogs"
            element={<ProductPages.ProductCategoriesPage />}
          />
          {/* Commented out - now using modal instead of page */}
          {/* <Route
          path="/products/catalogs/:catalogId/assign"
          element={<AssignItemsPage itemType="products" />}
        /> */}
          <Route
            path="/product-types"
            element={<ProductPages.ProductTypesPage />}
          />
          <Route
            path="/combo-types"
            element={<ProductPages.ComboTypesPage />}
          />
          <Route path="/offer-types" element={<OfferPages.OfferTypesPage />} />
          <Route
            path="/offer-catalogs"
            element={<OfferPages.OfferCategoriesPage />}
          />
          {/* Commented out - now using modal instead of page */}
          {/* <Route
          path="/offer-catalogs/:catalogId/assign"
          element={<AssignItemsPage itemType="offers" />}
        /> */}
          {/* <Route path="/offer-catalogs/:id" element={<CategoryDetailsPage />} /> */}
          <Route
            path="/user-management"
            element={<UserPages.UserManagementPage />}
          />
          <Route
            path="/user-management/analytics"
            element={<UserPages.UserAnalyticsPage />}
          />
          <Route
            path="/user-management/:id"
            element={<UserPages.UserDetailsPage />}
          />
          <Route path="/profile" element={<UserPages.UserProfilePage />} />
          <Route
            path="/segments"
            element={<SegmentPages.SegmentManagementPage />}
          />
          <Route
            path="/segments/analytics"
            element={<SegmentPages.SegmentAnalyticsPage />}
          />
          <Route
            path="/segments/:id"
            element={<SegmentPages.SegmentDetailsPage />}
          />
          <Route
            path="/segments/:id/edit"
            element={<SegmentPages.EditSegmentPage />}
          />
          <Route
            path="/segment-catalogs"
            element={<SegmentPages.SegmentCategoriesPage />}
          />
          {/* Commented out - now using modal instead of page */}
          {/* <Route
          path="/segment-catalogs/:catalogId/assign"
          element={<AssignItemsPage itemType="segments" />}
        /> */}
          <Route
            path="/segment-list"
            element={<SegmentPages.SegmentListPage />}
          />
          <Route
            path="/segment-types"
            element={<SegmentPages.SegmentTypesPage />}
          />
          <Route
            path="/control-groups"
            element={<ProductPages.ControlGroupsPage />}
          />
          <Route
            path="/manual-broadcasts"
            element={<OtherPages.ManualBroadcastsHubPage />}
          />
          <Route
            path="/manual-communications/create"
            element={<OtherPages.CreateManualBroadcastPage />}
          />
          <Route
            path="/manual-communications/:id/edit"
            element={<OtherPages.CreateManualBroadcastPage />}
          />
          <Route
            path="/manual-communications/:id"
            element={<OtherPages.BroadcastDetailsPage />}
          />
          <Route
            path="/manual-communications"
            element={<OtherPages.ManualBroadcastListsPage />}
          />
          <Route path="/quick-lists" element={<OtherPages.QuickListsPage />} />
          {/* <Route path="/quicklists" element={<OtherPages.QuickListsPage />} /> */}
          <Route
            path="/communications/analytics"
            element={<OtherPages.CommunicationAnalyticsPage />}
          />
          <Route
            path="/manual-rewards"
            element={<OtherPages.ManualRewardsPage />}
          />
          <Route
            path="/manual-rewards/create"
            element={<OtherPages.CreateManualRewardPage />}
          />
          <Route
            path="/quick-lists/:id"
            element={<OtherPages.QuickListDetailsPage />}
          />
          <Route
            path="/manual-communication/:id"
            element={<OtherPages.QuickListDetailsPage />}
          />
          <Route path="/customers" element={<AnalyticsPages.CustomersPage />} />
          <Route
            path="/customers/details/:customerId"
            element={<AnalyticsPages.CustomerSearchResultsPage />}
          />
          <Route
            path="/configuration"
            element={<SettingsPages.ConfigurationPage />}
          />
          <Route
            path="/configuration/:id"
            element={<SettingsPages.ConfigurationDetailsPage />}
          />
          <Route
            path="/offer-tracking-sources"
            element={<OfferPages.TrackingSourcesPage />}
          />
          <Route
            path="/creative-templates"
            element={<OfferPages.CreativeTemplatesPage />}
          />
          <Route
            path="/reward-types"
            element={<OfferPages.RewardTypesPage />}
          />
          <Route path="/sender-ids" element={<OfferPages.SenderIdsPage />} />
          <Route path="/languages" element={<OfferPages.LanguagesPage />} />
          <Route
            path="/character-sets"
            element={<OfferPages.CharacterSetsPage />}
          />
          <Route
            path="/communication-channels"
            element={<SettingsPages.CommunicationChannelsPage />}
          />
          <Route
            path="/sms-routes/*"
            element={<SettingsPages.SMSRoutesPage />}
          />
          <Route
            path="/sms-test"
            element={<SettingsPages.SMSTestPage />}
          />
          <Route path="/routes" element={<SettingsPages.RoutesPage />} />
          <Route
            path="/customer-identity"
            element={<OtherPages.CustomerIdentityPage />}
          />
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
          <Route
            path="/reports/campaigns"
            element={<AnalyticsPages.CampaignReportsPage />}
          />
          <Route
            path="/reports/offers"
            element={<AnalyticsPages.OfferReportsPage />}
          />
          <Route
            path="/reports/delivery"
            element={<AnalyticsPages.DeliverySMSReportsPage />}
          />
          <Route
            path="/reports/email-delivery"
            element={<AnalyticsPages.DeliveryEmailReportsPage />}
          />
          <Route path="/settings" element={<SettingsPages.SettingsPage />} />
          <Route path="/servers" element={<ServerPages.ServersPage />} />
          <Route
            path="/servers/new"
            element={<ServerPages.ServerFormPage mode="create" />}
          />
          <Route
            path="/servers/:id/edit"
            element={<ServerPages.ServerFormPage mode="edit" />}
          />
          <Route
            path="/servers/:id"
            element={<ServerPages.ServerDetailsPage />}
          />
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
          <Route
            path="/data-connectors"
            element={<ServerPages.DataConnectorsPage />}
          />
          <Route
            path="/data-connectors/:id"
            element={<ServerPages.DataConnectorDetailsPage />}
          />
          <Route path="/kpis/*" element={<ServerPages.KPIsPage />} />
          <Route path="/jobs" element={<JobPages.ScheduledJobsPage />} />
          <Route
            path="/scheduled-jobs"
            element={<JobPages.ScheduledJobsPage />}
          />
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
          <Route
            path="/job-dependencies"
            element={<JobPages.JobDependenciesPage />}
          />
          <Route
            path="/job-dependencies/analytics"
            element={<JobPages.JobDependenciesAnalyticsPage />}
          />
          <Route
            path="/job-workflow-steps"
            element={<JobPages.JobWorkflowStepsPage />}
          />
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
          <Route
            path="/workflows/create"
            element={<JobPages.CreateWorkflowPage />}
          />
          <Route
            path="/workflows/:id"
            element={<JobPages.WorkflowDetailsPage />}
          />
          <Route
            path="/workflows/:id/edit"
            element={<JobPages.CreateWorkflowPage />}
          />
          <Route
            path="/workflows/analytics"
            element={<JobPages.WorkflowsAnalyticsPage />}
          />
          <Route
            path="/job-executions"
            element={<JobPages.JobExecutionsPage />}
          />
          <Route
            path="/job-executions/:id"
            element={<JobPages.JobExecutionDetailsPage />}
          />
          <Route
            path="/job-executions/analytics"
            element={<JobPages.JobExecutionsAnalyticsPage />}
          />
          <Route
            path="/step-executions"
            element={<JobPages.StepExecutionsPage />}
          />
          <Route
            path="/step-executions/:id"
            element={<JobPages.StepExecutionDetailsPage />}
          />
          <Route
            path="/step-executions/analytics"
            element={<JobPages.StepExecutionsAnalyticsPage />}
          />
          <Route
            path="/notifications"
            element={<OtherPages.NotificationsPage />}
          />
          <Route
            path="/dnd-management"
            element={<CampaignPages.DNDManagementPage />}
          />
          <Route
            path="/dnd-management/:channel"
            element={<CampaignPages.DNDChannelPage />}
          />
          <Route
            path="/vip-list-management"
            element={<CampaignPages.VIPListManagementPage />}
          />
          <Route
            path="/seed-list-management"
            element={<CampaignPages.SeedListManagementPage />}
          />
          <Route path="/etl" element={<EtlPages.EtlFileRegistryPage />} />
          <Route
            path="/etl/fetch"
            element={<EtlPages.EtlFetchControlsPage />}
          />
          <Route
            path="/etl/analytics"
            element={<EtlPages.EtlAnalyticsPage />}
          />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
}
