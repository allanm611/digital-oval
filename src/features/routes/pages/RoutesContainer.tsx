import { Routes, Route, Navigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import RoutesManagementPage from "./RoutesManagementPage";
import CreateRoutePage from "./CreateRoutePage";
import RouteDetailsPage from "./RouteDetailsPage";

export default function RoutesContainer() {
  const { t } = useLanguage();
  return (
    <Routes>
      <Route path="/" element={<RoutesManagementPage />} />
      <Route path="/create" element={<CreateRoutePage />} />
      <Route path="/edit/:id" element={<CreateRoutePage />} />
      <Route path="/:id" element={<RouteDetailsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
