import { Routes, Route, Navigate } from "react-router-dom";
import KPIsHubPage from "./KPIsHubPage";
import AllKPIsPage from "./AllKPIsPage";
import SystemEventsContainer from "./SystemEventsContainer";
import RevenueMetricsContainer from "./RevenueMetricsContainer";
import UsageMetricsContainer from "./UsageMetricsContainer";
import CreateKPIPage from "./CreateKPIPage";
import KpiDetailsPage from "./KpiDetailsPage";
import SubscriberProfileListPage from "./SubscriberProfileListPage";
import CreateSubscriberProfilePage from "./CreateSubscriberProfilePage";
import SubscriberProfileDetailPage from "./SubscriberProfileDetailPage";
import KpiCategoriesPage from "./KpiCategoriesPage";

export default function KPIsContainer() {
  return (
    <Routes>
      <Route path="/" element={<KPIsHubPage />} />
      <Route path="/all" element={<AllKPIsPage />} />
      <Route path="/create" element={<CreateKPIPage />} />
      <Route path="/:id/edit" element={<CreateKPIPage />} />
      <Route path="/:id" element={<KpiDetailsPage />} />
      <Route path="/subscriber-profiles" element={<SubscriberProfileListPage />} />
      <Route path="/subscriber-profiles/create" element={<CreateSubscriberProfilePage />} />
      <Route path="/subscriber-profiles/:id" element={<SubscriberProfileDetailPage />} />
      <Route path="/subscriber-profiles/:id/edit" element={<CreateSubscriberProfilePage />} />
      <Route path="/system-events/*" element={<SystemEventsContainer />} />
      <Route path="/revenue-metrics/*" element={<RevenueMetricsContainer />} />
      <Route path="/usage-metrics/*" element={<UsageMetricsContainer />} />
      <Route path="/kpi-categories" element={<KpiCategoriesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
