import React from "react";
import Input from "../ui/Input";
import Checkbox from "../ui/Checkbox";
import { ConfigComponentProps } from "./types";

export const FTPConfig: React.FC<ConfigComponentProps> = ({config, updateConfiguration, showPasswords, togglePasswordVisibility}) => (
  <div className="space-y-6">
    <h4 className="text-sm font-semibold text-gray-700">FTP Configuration</h4>
    <div className="grid grid-cols-2 gap-6">
      <Input
        type="text"
        required
        label="Host *"
        value={config.host || ""}
        onChange={(value) => updateConfiguration("host", String(value))}
        placeholder="ftp.example.com"
      />
      <Input
        type="number"
        label="Port"
        value={config.port || 21}
        onChange={(value) => updateConfiguration("port", parseInt(String(value)) || 21)}
      />
    </div>
    <div className="grid grid-cols-2 gap-6">
      <Input
        required
        label="Username *"
        value={config.username || ""}
        onChange={(value) => updateConfiguration("username", value)}
        placeholder="ftp user"
      />
      <Input
        type={showPasswords.ftp_password ? "text" : "password"}
        required
        label="Password *"
        value={config.password || ""}
        onChange={(value) => updateConfiguration("password", String(value))}
        placeholder="••••••••"
      />
    </div>
    <div className="flex items-center cursor-pointer" onClick={() => updateConfiguration("passive_mode", !(config.passive_mode || false))}>
      <Checkbox id="passive_mode" checked={config.passive_mode || false} onChange={() => updateConfiguration("passive_mode", !(config.passive_mode || false))} className="mr-2 h-4 w-4" />
      <span className="text-sm text-gray-700">Passive Mode</span>
    </div>
  </div>
);
