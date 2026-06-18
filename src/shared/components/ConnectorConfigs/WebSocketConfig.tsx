import React from "react";
import { Eye, EyeOff } from "lucide-react";
import Input from "../ui/Input";
import { ConfigComponentProps } from "./types";

export const WebSocketConfig: React.FC<ConfigComponentProps> = ({config, updateConfiguration, showPasswords, togglePasswordVisibility}) => (
  <div className="space-y-6">
    <h4 className="text-sm font-semibold text-gray-700">WebSocket Configuration</h4>
    <Input label="Connection Name" placeholder="My WebSocket Connection" value={config.connection_name || ""} onChange={(value) => updateConfiguration("connection_name", value)} />
    <Input type="url" label="URL" value={config.url || ""} onChange={(value) => updateConfiguration("url", String(value))} placeholder="ws://localhost:8080" />
    <Input label="HTTP Path" placeholder="/ws" value={config.http_path || "/ws"} onChange={(value) => updateConfiguration("http_path", value)} />
    <div className="grid grid-cols-2 gap-6">
      <Input label="Username" placeholder="Optional" value={config.username || ""} onChange={(value) => updateConfiguration("username", value)} />
      <Input
        type={showPasswords.websocket_password ? "text" : "password"}
        label="Password"
        value={config.password || ""}
        onChange={(value) => updateConfiguration("password", String(value))}
        placeholder="••••••••"
      />
    </div>
  </div>
);
