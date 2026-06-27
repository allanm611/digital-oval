import { Routes, Route, Navigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import SystemEventsPage from "./SystemEventsPage";
import SystemEventDetailsPage from "./SystemEventDetailsPage";

export default function SystemEventsContainer() {
  const { t } = useLanguage();
  return (
    <Routes>
      <Route path="/" element={<SystemEventsPage />} />
      <Route path="/:id" element={<SystemEventDetailsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
