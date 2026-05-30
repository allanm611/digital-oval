import { Routes, Route, Navigate } from "react-router-dom";
import SMSRoutesPage from "./SMSRoutesPage";
import SMSRouteFormPage from "./SMSRouteFormPage";
import SMSRouteDetailsPage from "./SMSRouteDetailsPage";

export default function SMSRoutesContainer() {
  return (
    <Routes>
      <Route path="/" element={<SMSRoutesPage />} />
      <Route path="/create" element={<SMSRouteFormPage mode="create" />} />
      <Route path="/:id" element={<SMSRouteDetailsPage />} />
      <Route path="/:id/edit" element={<SMSRouteFormPage mode="edit" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
