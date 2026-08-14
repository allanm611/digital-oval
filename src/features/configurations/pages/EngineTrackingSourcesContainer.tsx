import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import EngineTrackingSourcesPage from "./EngineTrackingSourcesPage";
import EngineTrackingSourceFormPage from "./EngineTrackingSourceFormPage";
import EngineTrackingSourceDetailsPage from "./EngineTrackingSourceDetailsPage";

export default function EngineTrackingSourcesContainer() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3b8169]"></div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<EngineTrackingSourcesPage />} />
        <Route
          path="/create"
          element={<EngineTrackingSourceFormPage mode="create" />}
        />
        <Route
          path="/:id/edit"
          element={<EngineTrackingSourceFormPage mode="edit" />}
        />
        <Route
          path="/:id/details"
          element={<EngineTrackingSourceDetailsPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
