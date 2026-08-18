import { Routes, Route, Navigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import UsageMetricsPage from "./UsageMetricsPage";
import UsageMetricFormPage from "./UsageMetricFormPage";
import UsageMetricDetailsPage from "./UsageMetricDetailsPage";

export default function UsageMetricsContainer() {
  const { t } = useLanguage();
  return (
    <Routes>
      <Route path="/" element={<UsageMetricsPage />} />
      <Route path="/create" element={<UsageMetricFormPage mode="create" />} />
      <Route path="/:id" element={<UsageMetricDetailsPage />} />
      <Route path="/:id/edit" element={<UsageMetricFormPage mode="edit" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
