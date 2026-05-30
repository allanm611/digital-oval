import { Routes, Route, Navigate } from "react-router-dom";
import RoutesManagementPage from "./RoutesManagementPage";
import CreateRoutePage from "./CreateRoutePage";
import SMSRoutesPage from "./SMSRoutesPage";
import SMSRouteFormPage from "./SMSRouteFormPage";
import SMSRouteDetailsPage from "./SMSRouteDetailsPage";

export default function RoutesContainer() {
  return (
    <Routes>
      <Route path="/" element={<RoutesManagementPage />} />
      <Route path="/create" element={<CreateRoutePage />} />
      <Route path="/sms" element={<SMSRoutesPage />} />
      <Route path="/sms/create" element={<SMSRouteFormPage mode="create" />} />
      <Route path="/sms/:id" element={<SMSRouteDetailsPage />} />
      <Route path="/sms/:id/edit" element={<SMSRouteFormPage mode="edit" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
