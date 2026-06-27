import { Routes, Route, Navigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import RevenueMetricsPage from "./RevenueMetricsPage";
import RevenueMetricFormPage from "./RevenueMetricFormPage";
import RevenueMetricDetailsPage from "./RevenueMetricDetailsPage";

export default function RevenueMetricsContainer() {
  const { t } = useLanguage();
  return (
    <Routes>
      <Route path="/" element={<RevenueMetricsPage />} />
      <Route path="/create" element={<RevenueMetricFormPage mode="create" />} />
      <Route path="/:id" element={<RevenueMetricDetailsPage />} />
      <Route path="/:id/edit" element={<RevenueMetricFormPage mode="edit" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
