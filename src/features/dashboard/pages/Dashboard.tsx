import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import DashboardHome from "../components/DashboardHome";
import CampaignsPage from "../../campaigns/pages/CampaignsPage";
import CampaignsAnalyticsPage from "../../campaigns/pages/CampaignsAnalyticsPage";
import CampaignDetailsPage from "../../campaigns/pages/CampaignDetailsPage";
import CreateCampaignPage from "../../campaigns/pages/CreateCampaignPage";
import CampaignCategoriesPage from "../../campaigns/pages/CampaignCategoriesPage";
import CampaignTypesPage from "../../campaigns/pages/CampaignTypesPage";
import CampaignObjectivesPage from "../../campaigns/pages/CampaignObjectivesPage";
import TeamRolesPage from "../../campaigns/pages/TeamRolesPage";
import ProgramsPage from "../../campaigns/pages/ProgramsPage";
import ProgramDetailsPage from "../../campaigns/pages/ProgramDetailsPage";
import CommunicationPolicyPage from "../../campaigns/pages/CommunicationPolicyPage";
import OffersPage from "../../offers/pages/OffersPage";
import OfferDetailsPage from "../../offers/pages/OfferDetailsPage";
import OfferLifecycleHistoryPage from "../../offers/pages/OfferLifecycleHistoryPage";
import OfferApprovalHistoryPage from "../../offers/pages/OfferApprovalHistoryPage";
import SegmentManagementPage from "../../segments/pages/SegmentManagementPage";
import SegmentDetailsPage from "../../segments/pages/SegmentDetailsPage";
import EditSegmentPage from "../../segments/pages/EditSegmentPage";
import SegmentCategoriesPage from "../../segments/pages/SegmentCategoriesPage";
import SegmentListPage from "../../segments/pages/SegmentListPage";
import SegmentTypesPage from "../../segments/pages/SegmentTypesPage";
import CreateOfferPage from "../../offers/pages/CreateOfferPage";
import ProductsPage from "../../products/pages/ProductsPage";
import CreateProductPage from "../../products/pages/CreateProductPage";
import EditProductPage from "../../products/pages/EditProductPage";
import ProductDetailsPage from "../../products/pages/ProductDetailsPage";
import ProductCategoriesPage from "../../products/pages/ProductCategoriesPage";
import ProductTypesPage from "../../products/pages/ProductTypesPage";
import OfferTypesPage from "../../offers/pages/OfferTypesPage";
import OfferCategoriesPage from "../../offers/pages/OfferCategoriesPage";
import TrackingSourcesPage from "../../offers/pages/TrackingSourcesPage";
import CreativeTemplatesPage from "../../offers/pages/CreativeTemplatesPage";
import RewardTypesPage from "../../offers/pages/RewardTypesPage";
// import CategoryDetailsPage from "../../offers/pages/CategoryDetailsPage";
import UserManagementPage from "../components/UserManagementPage";
import UserDetailsPage from "../../users/pages/UserDetailsPage";
import UserProfilePage from "../../users/pages/UserProfilePage";
import ConfigurationPage from "../components/ConfigurationPage";
import ConfigurationDetailsPage from "../components/ConfigurationDetailsPage";
import ControlGroupsPage from "../../products/pages/ControlGroupsPage";
import DepartmentPage from "../../campaigns/pages/DepartmentPage";
import LineOfBusinessPage from "../../campaigns/pages/LineOfBusinessPage";
import OfferCreativeDetailsPage from "../../offers/pages/OfferCreativeDetailsPage";
import QuickListsPage from "../../quicklists/pages/QuickListsPage";
import QuickListDetailsPage from "../../quicklists/pages/QuickListDetailsPage";
import CreateManualBroadcastPage from "../../manual-broadcast/pages/CreateManualBroadcastPage";
import CustomerIdentityPage from "../../customer/pages/CustomerIdentityPage";
import CustomerIdentityFieldDetailsPage from "../../customer/pages/CustomerIdentityFieldDetailsPage";
import CampaignApprovalHistoryPage from "../../campaigns/pages/CampaignApprovalHistoryPage";
import CampaignLifecycleHistoryPage from "../../campaigns/pages/CampaignLifecycleHistoryPage";
import SearchResultsPage from "../../../shared/pages/SearchResultsPage";
import OverallDashboardPerformancePage from "./OverallDashboardPerformancePage";
import CustomerProfileReportsPage from "./CustomerProfileReportsPage";
import CustomersPage from "./CustomersPage";
import CustomerSearchResultsPage from "./CustomerSearchResultsPage";
import CampaignReportsPage from "./CampaignReportsPage";
import DeliverySMSReportsPage from "./DeliverySMSReportsPage";
import DeliveryEmailReportsPage from "./DeliveryEmailReportsPage";
import OfferReportsPage from "./OfferReportsPage";
import SettingsPage from "../../settings/pages/SettingsPage";
import CommunicationChannelsPage from "../../settings/pages/CommunicationChannelsPage";
import ServersPage from "../../servers/pages/ServersPage";
import ServerDetailsPage from "../../servers/pages/ServerDetailsPage";
import ServerFormPage from "../../servers/pages/ServerFormPage";
import ConnectionProfilesPage from "../../connection-profiles/pages/ConnectionProfilesPage";
import ConnectionProfileDetailsPage from "../../connection-profiles/pages/ConnectionProfileDetailsPage";
import ConnectionProfileFormPage from "../../connection-profiles/pages/ConnectionProfileFormPage";
import ConnectionProfilesAnalyticsPage from "../../connection-profiles/pages/ConnectionProfilesAnalyticsPage";
import JobTypesPage from "../../jobs/pages/JobTypesPage";
import ScheduledJobsPage from "../../jobs/pages/ScheduledJobsPage";
import ScheduledJobDetailsPage from "../../jobs/pages/ScheduledJobDetailsPage";
import CreateScheduledJobPage from "../../jobs/pages/CreateScheduledJobPage";
import ScheduledJobsAnalyticsPage from "../../jobs/pages/ScheduledJobsAnalyticsPage";
import JobDependenciesPage from "../../jobs/pages/JobDependenciesPage";
import JobDependenciesAnalyticsPage from "../../jobs/pages/JobDependenciesAnalyticsPage";
import JobWorkflowStepsPage from "../../jobs/pages/JobWorkflowStepsPage";
import NotificationsPage from "../../notifications/pages/NotificationsPage";
import DNDManagementPage from "../../campaigns/pages/DNDManagementPage";
import VIPListManagementPage from "../../campaigns/pages/VIPListManagementPage";
import SeedListManagementPage from "../../campaigns/pages/SeedListManagementPage";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route
          path="/campaigns/analytics"
          element={<CampaignsAnalyticsPage />}
        />
        <Route path="/campaigns/:id" element={<CampaignDetailsPage />} />
        <Route path="/campaigns/:id/edit" element={<CreateCampaignPage />} />
        <Route path="/campaigns/create" element={<CreateCampaignPage />} />
        {/* Campaign history pages - placeholder for future use when backend endpoints are implemented */}
        <Route
          path="/campaigns/:id/approval-history"
          element={<CampaignApprovalHistoryPage />}
        />
        <Route
          path="/campaigns/:id/lifecycle-history"
          element={<CampaignLifecycleHistoryPage />}
        />
        <Route path="/campaign-catalogs" element={<CampaignCategoriesPage />} />
        <Route path="/campaign-types" element={<CampaignTypesPage />} />
        {/* Commented out - now using modal instead of page */}
        {/* <Route
          path="/campaign-catalogs/:catalogId/assign"
          element={<AssignItemsPage itemType="campaigns" />}
        /> */}
        <Route
          path="/campaign-objectives"
          element={<CampaignObjectivesPage />}
        />
        <Route path="/team-roles" element={<TeamRolesPage />} />
        <Route path="/departments" element={<DepartmentPage />} />
        <Route path="/line-of-business" element={<LineOfBusinessPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/:id" element={<ProgramDetailsPage />} />
        <Route
          path="/campaign-communication-policy"
          element={<CommunicationPolicyPage />}
        />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/offers/create" element={<CreateOfferPage />} />
        <Route path="/offers/:id" element={<OfferDetailsPage />} />
        <Route path="/offers/:id/edit" element={<CreateOfferPage />} />
        <Route
          path="/offers/:id/approval-history"
          element={<OfferApprovalHistoryPage />}
        />
        <Route
          path="/offers/:id/lifecycle-history"
          element={<OfferLifecycleHistoryPage />}
        />
        <Route
          path="/offer-creatives/:id"
          element={<OfferCreativeDetailsPage />}
        />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/create" element={<CreateProductPage />} />
        <Route path="/products/:id" element={<ProductDetailsPage />} />
        <Route path="/products/:id/edit" element={<EditProductPage />} />
        <Route path="/products/catalogs" element={<ProductCategoriesPage />} />
        {/* Commented out - now using modal instead of page */}
        {/* <Route
          path="/products/catalogs/:catalogId/assign"
          element={<AssignItemsPage itemType="products" />}
        /> */}
        <Route path="/product-types" element={<ProductTypesPage />} />
        <Route path="/offer-types" element={<OfferTypesPage />} />
        <Route path="/offer-catalogs" element={<OfferCategoriesPage />} />
        {/* Commented out - now using modal instead of page */}
        {/* <Route
          path="/offer-catalogs/:catalogId/assign"
          element={<AssignItemsPage itemType="offers" />}
        /> */}
        {/* <Route path="/offer-catalogs/:id" element={<CategoryDetailsPage />} /> */}
        <Route path="/user-management" element={<UserManagementPage />} />
        <Route path="/user-management/:id" element={<UserDetailsPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/segments" element={<SegmentManagementPage />} />
        <Route path="/segments/:id" element={<SegmentDetailsPage />} />
        <Route path="/segments/:id/edit" element={<EditSegmentPage />} />
        <Route path="/segment-catalogs" element={<SegmentCategoriesPage />} />
        {/* Commented out - now using modal instead of page */}
        {/* <Route
          path="/segment-catalogs/:catalogId/assign"
          element={<AssignItemsPage itemType="segments" />}
        /> */}
        <Route path="/segment-list" element={<SegmentListPage />} />
        <Route path="/segment-types" element={<SegmentTypesPage />} />
        <Route path="/control-groups" element={<ControlGroupsPage />} />
        <Route path="/quicklists" element={<QuickListsPage />} />
        <Route
          path="/quicklists/create"
          element={<CreateManualBroadcastPage />}
        />
        <Route path="/quicklists/:id" element={<QuickListDetailsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/configuration" element={<ConfigurationPage />} />
        <Route
          path="/configuration/:id"
          element={<ConfigurationDetailsPage />}
        />
        <Route
          path="/offer-tracking-sources"
          element={<TrackingSourcesPage />}
        />
        <Route path="/creative-templates" element={<CreativeTemplatesPage />} />
        <Route path="/reward-types" element={<RewardTypesPage />} />
        <Route
          path="/communication-channels"
          element={<CommunicationChannelsPage />}
        />
        <Route path="/customer-identity" element={<CustomerIdentityPage />} />
        <Route
          path="/customer-identity/fields/:id"
          element={<CustomerIdentityFieldDetailsPage />}
        />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route
          path="/reports/overview"
          element={<OverallDashboardPerformancePage />}
        />
        <Route
          path="/reports/customer-profiles"
          element={<CustomerProfileReportsPage />}
        />
        <Route
          path="/reports/customer-profiles/search"
          element={<CustomerSearchResultsPage />}
        />
        <Route path="/reports/campaigns" element={<CampaignReportsPage />} />
        <Route path="/reports/offers" element={<OfferReportsPage />} />
        <Route path="/reports/delivery" element={<DeliverySMSReportsPage />} />
        <Route
          path="/reports/email-delivery"
          element={<DeliveryEmailReportsPage />}
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/servers" element={<ServersPage />} />
        <Route path="/servers/new" element={<ServerFormPage mode="create" />} />
        <Route
          path="/servers/:id/edit"
          element={<ServerFormPage mode="edit" />}
        />
        <Route path="/servers/:id" element={<ServerDetailsPage />} />
        <Route
          path="/connection-profiles"
          element={<ConnectionProfilesPage />}
        />
        <Route
          path="/connection-profiles/new"
          element={<ConnectionProfileFormPage mode="create" />}
        />
        <Route
          path="/connection-profiles/:id/edit"
          element={<ConnectionProfileFormPage mode="edit" />}
        />
        <Route
          path="/connection-profiles/analytics"
          element={<ConnectionProfilesAnalyticsPage />}
        />
        <Route
          path="/connection-profiles/:id"
          element={<ConnectionProfileDetailsPage />}
        />
        <Route path="/jobs" element={<ScheduledJobsPage />} />
        <Route path="/scheduled-jobs" element={<ScheduledJobsPage />} />
        <Route
          path="/scheduled-jobs/:id"
          element={<ScheduledJobDetailsPage />}
        />
        <Route
          path="/scheduled-jobs/:id/edit"
          element={<CreateScheduledJobPage />}
        />
        <Route
          path="/scheduled-jobs/create"
          element={<CreateScheduledJobPage />}
        />
        <Route
          path="/scheduled-jobs/analytics"
          element={<ScheduledJobsAnalyticsPage />}
        />
        <Route path="/job-types" element={<JobTypesPage />} />
        <Route path="/job-dependencies" element={<JobDependenciesPage />} />
        <Route
          path="/job-dependencies/analytics"
          element={<JobDependenciesAnalyticsPage />}
        />
        <Route path="/job-workflow-steps" element={<JobWorkflowStepsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/dnd-management" element={<DNDManagementPage />} />
        <Route
          path="/vip-list-management"
          element={<VIPListManagementPage />}
        />
        <Route
          path="/seed-list-management"
          element={<SeedListManagementPage />}
        />
      </Routes>
    </DashboardLayout>
  );
}
