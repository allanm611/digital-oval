import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import GatewayProvidersPage from "./GatewayProvidersPage";
import GatewayProviderFormPage from "./GatewayProviderFormPage";
import GatewayProviderDetailsPage from "./GatewayProviderDetailsPage";

export default function GatewayProvidersContainer() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3b8169]"></div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<GatewayProvidersPage />} />
        <Route
          path="/create"
          element={<GatewayProviderFormPage mode="create" />}
        />
        <Route
          path="/:id/edit"
          element={<GatewayProviderFormPage mode="edit" />}
        />
        <Route path="/:id/details" element={<GatewayProviderDetailsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
