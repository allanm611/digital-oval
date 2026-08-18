import { Routes, Route, Navigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import WhatsAppRoutesPage from "./WhatsAppRoutesPage";
import WhatsAppRouteFormPage from "./WhatsAppRouteFormPage";
import WhatsAppRouteDetailsPage from "./WhatsAppRouteDetailsPage";

export default function WhatsAppRoutesContainer() {
  const { t } = useLanguage();
  return (
    <Routes>
      <Route path="/" element={<WhatsAppRoutesPage />} />
      <Route path="/create" element={<WhatsAppRouteFormPage mode="create" />} />
      <Route path="/:id" element={<WhatsAppRouteDetailsPage />} />
      <Route path="/:id/edit" element={<WhatsAppRouteFormPage mode="edit" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
