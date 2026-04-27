import { Routes, Route, Navigate } from "react-router-dom";
import PushNotificationRoutesPage from "./PushNotificationRoutesPage";
import PushNotificationRouteFormPage from "./PushNotificationRouteFormPage";
import PushNotificationRouteDetailsPage from "./PushNotificationRouteDetailsPage";

export default function PushNotificationRoutesContainer() {
  return (
    <Routes>
      <Route path="/" element={<PushNotificationRoutesPage />} />
      <Route path="/create" element={<PushNotificationRouteFormPage mode="create" />} />
      <Route path="/:id" element={<PushNotificationRouteDetailsPage />} />
      <Route path="/:id/edit" element={<PushNotificationRouteFormPage mode="edit" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
