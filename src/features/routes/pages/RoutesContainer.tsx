import { Routes, Route, Navigate } from "react-router-dom";
import RoutesManagementPage from "./RoutesManagementPage";
import CreateRoutePage from "./CreateRoutePage";
import EditRoutePage from "./EditRoutePage";
import RouteDetailsPage from "./RouteDetailsPage";

export default function RoutesContainer() {
  return (
    <Routes>
      <Route path="/" element={<RoutesManagementPage />} />
      <Route path="/create" element={<CreateRoutePage />} />
      <Route path="/:id" element={<RouteDetailsPage />} />
      <Route path="/:id/edit" element={<EditRoutePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
