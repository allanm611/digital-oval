import { Routes, Route, Navigate } from "react-router-dom";
import USSDRoutesPage from "./USSDRoutesPage";
import CreateEditUSSDRoutePage from "./CreateEditUSSDRoutePage";

export default function USSDRoutesContainer() {
  return (
    <Routes>
      <Route path="/" element={<USSDRoutesPage />} />
      <Route path="/create" element={<CreateEditUSSDRoutePage />} />
      <Route path="/:id/edit" element={<CreateEditUSSDRoutePage />} />
      <Route path="/:id" element={<CreateEditUSSDRoutePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
