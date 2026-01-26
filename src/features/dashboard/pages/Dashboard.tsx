import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";

// Core dashboard components (always loaded)
import DashboardLayout from "../components/DashboardLayout";

// Lazy loaded components grouped by feature - All preloaded for instant access
const DashboardHome = lazy(
  () => import(/* webpackPrefetch: true */ "../components/DashboardHome"),
);

// Campaign Pages - All routes preloaded for instant access
// Using Suspense wrappers for faster perceived loading
import CampaignsPageWrapper from "../../campaigns/pages/CampaignsPageWrapper";
import CreateCampaignPageWrapper from "../../campaigns/pages/CreateCampaignPageWrapper";
import CampaignDetailsPageWrapper from "../../campaigns/pages/CampaignDetailsPageWrapper";

const CampaignPages = {
  CampaignsPage: CampaignsPageWrapper,
  CampaignsAnalyticsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../campaigns/pages/CampaignsAnalyticsPage"
      ),
  ),
  CampaignDetailsPage: CampaignDetailsPageWrapper,
  CreateCampaignPage: CreateCampaignPageWrapper,
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
// Using Suspense wrappers for faster perceived loading
import OfferCategoriesPageWrapper from "../../offers/pages/OfferCategoriesPageWrapper";
import OfferDetailsPageWrapper from "../../offers/pages/OfferDetailsPageWrapper";
import OffersPageWrapper from "../../offers/pages/OffersPageWrapper";

const OfferPages = {
  OffersPage: OffersPageWrapper,
  OfferDetailsPage: OfferDetailsPageWrapper,
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
  OfferCategoriesPage: OfferCategoriesPageWrapper,
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
  SMSRoutesPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../offers/pages/SMSRoutesPage"),
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
// Using Suspense wrappers for faster perceived loading
import ProductCategoriesPageWrapper from "../../products/pages/ProductCategoriesPageWrapper";
import ProductDetailsPageWrapper from "../../products/pages/ProductDetailsPageWrapper";
import ProductsPageWrapper from "../../products/pages/ProductsPageWrapper";

const ProductPages = {
  ProductsPage: ProductsPageWrapper,
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
  ProductDetailsPage: ProductDetailsPageWrapper,
  ProductCategoriesPage: ProductCategoriesPageWrapper,
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
// Using Suspense wrappers for faster perceived loading
import SegmentCategoriesPageWrapper from "../../segments/pages/SegmentCategoriesPageWrapper";
import SegmentDetailsPageWrapper from "../../segments/pages/SegmentDetailsPageWrapper";
import SegmentManagementPageWrapper from "../../segments/pages/SegmentManagementPageWrapper";

const SegmentPages = {
  SegmentManagementPage: SegmentManagementPageWrapper,
  SegmentDetailsPage: SegmentDetailsPageWrapper,
  EditSegmentPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../segments/pages/EditSegmentPage"
      ),
  ),
  SegmentCategoriesPage: SegmentCategoriesPageWrapper,
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
// Using Suspense wrappers for faster perceived loading
import ScheduledJobsPageWrapper from "../../jobs/pages/ScheduledJobsPageWrapper";
import JobExecutionsPageWrapper from "../../jobs/pages/JobExecutionsPageWrapper";

const JobPages = {
  JobTypesPage: lazy(
    () => import(/* webpackPrefetch: true */ "../../jobs/pages/JobTypesPage"),
  ),
  ScheduledJobsPage: ScheduledJobsPageWrapper,
  ScheduledJobDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/ScheduledJobDetailsPage"
      ),
  ),
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
  JobWorkflowStepDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/JobWorkflowStepDetailsPage"
      ),
  ),
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
  WorkflowDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/WorkflowDetailsPage"
      ),
  ),
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
  JobExecutionsPage: JobExecutionsPageWrapper,
  JobExecutionDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/JobExecutionDetailsPage"
      ),
  ),
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
  StepExecutionDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../jobs/pages/StepExecutionDetailsPage"
      ),
  ),
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
      import(/* webpackPrefetch: true */ "../components/UserManagementPage"),
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
    () => import(/* webpackPrefetch: true */ "../components/ConfigurationPage"),
  ),
  ConfigurationDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../components/ConfigurationDetailsPage"
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
  RoutesPage: lazy(
    () => import(/* webpackPrefetch: true */ "../../settings/pages/RoutesPage"),
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
    () => import(/* webpackPrefetch: true */ "../../servers/pages/ServersPage"),
  ),
  ServerDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../servers/pages/ServerDetailsPage"
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
};

// ETL Pages - All routes preloaded for instant access
const EtlPages = {
  EtlFileRegistryPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../etl/pages/EtlFileRegistryPage"),
  ),
  EtlPendingFilesPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../etl/pages/EtlPendingFilesPage"),
  ),
  EtlFetchControlsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../etl/pages/EtlFetchControlsPage"
      ),
  ),
  EtlStatisticsPage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "../../etl/pages/EtlStatisticsPage"),
  ),
};

// Analytics & Reports Pages - All routes preloaded for instant access
// Using Suspense wrapper for faster perceived loading
import CustomersPageWrapper from "./CustomersPageWrapper";

const AnalyticsPages = {
  OverallDashboardPerformancePage: lazy(
    () =>
      import(/* webpackPrefetch: true */ "./OverallDashboardPerformancePage"),
  ),
  CustomerProfileReportsPage: lazy(
    () => import(/* webpackPrefetch: true */ "./CustomerProfileReportsPage"),
  ),
  CustomersPage: CustomersPageWrapper,
  CustomerSearchResultsPage: lazy(
    () => import(/* webpackPrefetch: true */ "./CustomerSearchResultsPage"),
  ),
  CampaignReportsPage: lazy(
    () => import(/* webpackPrefetch: true */ "./CampaignReportsPage"),
  ),
  DeliverySMSReportsPage: lazy(
    () => import(/* webpackPrefetch: true */ "./DeliverySMSReportsPage"),
  ),
  DeliveryEmailReportsPage: lazy(
    () => import(/* webpackPrefetch: true */ "./DeliveryEmailReportsPage"),
  ),
  OfferReportsPage: lazy(
    () => import(/* webpackPrefetch: true */ "./OfferReportsPage"),
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
        /* webpackPrefetch: true */ "../../quicklists/pages/ManualBroadcastListsPage"
      ),
  ),
  QuickListsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../quicklists/pages/QuickListsPage"
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
        /* webpackPrefetch: true */ "../../quicklists/pages/QuickListDetailsPage"
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
        /* webpackPrefetch: true */ "../../customer/pages/CustomerIdentityPage"
      ),
  ),
  CustomerIdentityFieldDetailsPage: lazy(
    () =>
      import(
        /* webpackPrefetch: true */ "../../customer/pages/CustomerIdentityFieldDetailsPage"
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
            path="/user-management/:id"
            element={<UserPages.UserDetailsPage />}
          />
          <Route path="/profile" element={<UserPages.UserProfilePage />} />
          <Route
            path="/segments"
            element={<SegmentPages.SegmentManagementPage />}
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
            path="/manual-communications"
            element={<OtherPages.ManualBroadcastListsPage />}
          />
          <Route path="/quick-lists" element={<OtherPages.QuickListPage />} />
          {/* <Route path="/quicklists" element={<OtherPages.QuickListsPage />} /> */}
          <Route
            path="/communications/analytics"
            element={<OtherPages.CommunicationAnalyticsPage />}
          />
          <Route
            path="/manual-communications/create"
            element={<OtherPages.CreateManualBroadcastPage />}
          />
          <Route
            path="/manual-rewards"
            element={<OtherPages.ManualRewardsPage />}
          />
          <Route
            path="/manual-rewards/create"
            element={<OtherPages.CreateManualRewardPage />}
          />
          {/* <Route
            path="/quicklists/:id"
            element={<OtherPages.QuickListDetailsPage />}
          /> */}
          <Route
            path="/manual-communication/:id"
            element={<OtherPages.QuickListDetailsPage />}
          />
          <Route path="/customers" element={<AnalyticsPages.CustomersPage />} />
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
            path="/sms-routes"
            element={<SettingsPages.SettingsSMSRoutesPage />}
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
            element={<EtlPages.EtlStatisticsPage />}
          />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
}
