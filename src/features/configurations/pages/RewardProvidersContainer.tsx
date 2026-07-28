import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import RewardProvidersPage from "./RewardProvidersPage";
import RewardProviderFormPage from "./RewardProviderFormPage";
import RewardProviderDetailsPage from "./RewardProviderDetailsPage";

export default function RewardProvidersContainer() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3b8169]"></div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<RewardProvidersPage />} />
        <Route
          path="/create"
          element={<RewardProviderFormPage mode="create" />}
        />
        <Route
          path="/:id/edit"
          element={<RewardProviderFormPage mode="edit" />}
        />
        <Route path="/:id/details" element={<RewardProviderDetailsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
