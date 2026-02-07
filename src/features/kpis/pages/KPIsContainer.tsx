import { Routes, Route, Navigate } from "react-router-dom";
import KPIsHubPage from "./KPIsHubPage";
import AllKPIsPage from "./AllKPIsPage";
import SystemEventsContainer from "./SystemEventsContainer";
import RevenueMetricsContainer from "./RevenueMetricsContainer";
import UsageMetricsContainer from "./UsageMetricsContainer";

export default function KPIsContainer() {
  return (
    <Routes>
      <Route path="/" element={<KPIsHubPage />} />
      <Route path="/all" element={<AllKPIsPage />} />
      <Route path="/system-events/*" element={<SystemEventsContainer />} />
      <Route path="/revenue-metrics/*" element={<RevenueMetricsContainer />} />
      <Route path="/usage-metrics/*" element={<UsageMetricsContainer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
