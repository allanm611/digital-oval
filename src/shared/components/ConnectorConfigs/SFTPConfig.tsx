import React from "react";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import { ConfigComponentProps } from "./types";

export const SFTPConfig: React.FC<ConfigComponentProps> = ({config, updateConfiguration, showPasswords, togglePasswordVisibility}) => (
  <div className="space-y-6">
    <h4 className="text-sm font-semibold text-gray-700">SFTP Configuration</h4>
    <div className="grid grid-cols-2 gap-6">
      <Input
        type="text"
        required
        label="Host *"
        value={config.host || ""}
        onChange={(value) => updateConfiguration("host", String(value))}
        placeholder="sftp.example.com"
      />
      <Input
        type="number"
        label="Port"
        value={config.port || 22}
        onChange={(value) => updateConfiguration("port", parseInt(String(value)) || 22)}
      />
    </div>
    <div className="grid grid-cols-2 gap-6">
      <Input
        required
        label="Username *"
        value={config.username || ""}
        onChange={(value) => updateConfiguration("username", value)}
        placeholder="sftp user"
      />
      <Input
        type={showPasswords.sftp_password ? "text" : "password"}
        label="Password (or use Private Key)"
        value={config.password || ""}
        onChange={(value) => updateConfiguration("password", String(value))}
        placeholder="••••••••"
      />
    </div>
    <Textarea
      label="Private Key (PEM format)"
      value={config.private_key || ""}
      onChange={(value) => updateConfiguration("private_key", value)}
      rows={4}
      placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
      className="font-mono"
    />
    <div className="grid grid-cols-2 gap-6">
      <Input label="Remote Path" placeholder="/data/incoming" value={config.remote_path || ""} onChange={(value) => updateConfiguration("remote_path", value)} />
      <Input label="Local Path" placeholder="/local/staging" value={config.local_path || ""} onChange={(value) => updateConfiguration("local_path", value)} />
    </div>
  </div>
);
