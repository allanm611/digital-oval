import { Routes, Route, Navigate } from "react-router-dom";
import SystemEventsPage from "./SystemEventsPage";
import SystemEventDetailsPage from "./SystemEventDetailsPage";

export default function SystemEventsContainer() {
  return (
    <Routes>
      <Route path="/" element={<SystemEventsPage />} />
      <Route path="/:id" element={<SystemEventDetailsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
