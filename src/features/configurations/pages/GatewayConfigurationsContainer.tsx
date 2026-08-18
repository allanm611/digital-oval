import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import GatewayConfigurationsPage from "./GatewayConfigurationsPage";
import GatewayConfigFormPage from "./GatewayConfigFormPage";
import GatewayConfigDetailsPage from "./GatewayConfigDetailsPage";

export default function GatewayConfigurationsContainer() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3b8169]" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<GatewayConfigurationsPage />} />
        <Route
          path="/create"
          element={<GatewayConfigFormPage mode="create" />}
        />
        <Route
          path="/:id/edit"
          element={<GatewayConfigFormPage mode="edit" />}
        />
        <Route path="/:id/details" element={<GatewayConfigDetailsPage />} />
        {/* Legacy channel-scoped details URL */}
        <Route
          path="/:id/:channel/details"
          element={<GatewayConfigDetailsPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
