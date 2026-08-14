import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import RewardConfigurationsPage from "./RewardConfigurationsPage";
import RewardConfigurationFormPage from "./RewardConfigurationFormPage";
import RewardConfigurationDetailsPage from "./RewardConfigurationDetailsPage";

export default function RewardConfigurationsContainer() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3b8169]" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<RewardConfigurationsPage />} />
        <Route
          path="/create"
          element={<RewardConfigurationFormPage mode="create" />}
        />
        <Route
          path="/:id/edit"
          element={<RewardConfigurationFormPage mode="edit" />}
        />
        <Route
          path="/:id/details"
          element={<RewardConfigurationDetailsPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
