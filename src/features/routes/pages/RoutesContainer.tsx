import { Routes, Route, Navigate } from "react-router-dom";
import RoutesManagementPage from "./RoutesManagementPage";
import CreateRoutePage from "./CreateRoutePage";

export default function RoutesContainer() {
  return (
    <Routes>
      <Route path="/" element={<RoutesManagementPage />} />
      <Route path="/create" element={<CreateRoutePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
