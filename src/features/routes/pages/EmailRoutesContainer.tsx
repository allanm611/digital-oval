import { Routes, Route, Navigate } from "react-router-dom";
import EmailRoutesPage from "./EmailRoutesPage";
import EmailRouteFormPage from "./EmailRouteFormPage";
import EmailRouteDetailsPage from "./EmailRouteDetailsPage";

export default function EmailRoutesContainer() {
  return (
    <Routes>
      <Route path="/" element={<EmailRoutesPage />} />
      <Route path="/create" element={<EmailRouteFormPage mode="create" />} />
      <Route path="/:id" element={<EmailRouteDetailsPage />} />
      <Route path="/:id/edit" element={<EmailRouteFormPage mode="edit" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
