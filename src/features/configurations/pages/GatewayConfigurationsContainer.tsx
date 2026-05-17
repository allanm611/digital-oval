import { Routes, Route, Navigate, useParams } from "react-router-dom";
import GatewayConfigurationsPage from "./GatewayConfigurationsPage";
import GatewayConfigFormPage from "./GatewayConfigFormPage";
import GatewayConfigDetailsPage from "./GatewayConfigDetailsPage";

export default function GatewayConfigurationsContainer() {
  return (
    <Routes>
      <Route path="/" element={<GatewayConfigurationsPage />} />
      <Route path="/create" element={<GatewayConfigFormPage mode="create" />} />
      <Route path="/:id/edit" element={<GatewayConfigFormPage mode="edit" />} />
      <Route path="/:id/:channel/details" element={<GatewayConfigDetailsPageWrapper />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function GatewayConfigDetailsPageWrapper() {
  const { channel } = useParams<{ channel: string }>();
  return <GatewayConfigDetailsPage channel={channel as "EMAIL" | "SMS" | "WHATSAPP" | "PUSH"} />;
}
