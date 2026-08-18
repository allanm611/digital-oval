import React from "react";
import Input from "../ui/Input";
import Checkbox from "../ui/Checkbox";
import { ConfigComponentProps } from "./types";

export const TCPConfig: React.FC<ConfigComponentProps> = ({config, updateConfiguration}) => (
  <div className="space-y-6">
    <h4 className="text-sm font-semibold text-gray-700">TCP Configuration</h4>
    <div className="grid grid-cols-2 gap-6">
      <Input type="number" label="Buffer Size (optional)" value={config.buffer_size ?? ""} onChange={(value) => updateConfiguration("buffer_size", value ? parseInt(String(value)) : null)} min="1024" max="1048576" />
      <Input type="number" label="Socket Timeout (ms) (optional)" value={config.socket_timeout ?? ""} onChange={(value) => updateConfiguration("socket_timeout", value ? parseInt(String(value)) : null)} min="1000" max="300000" />
    </div>
    <Input label="Decoder" placeholder="Carnage Returned Line Feed" value={config.decoder || ""} onChange={(value) => updateConfiguration("decoder", value)} />
    <div className="space-y-2">
      <div className="flex items-center cursor-pointer" onClick={() => updateConfiguration("non_blocking_io", !(config.non_blocking_io || false))}>
        <Checkbox id="non_blocking_io" checked={config.non_blocking_io || false} onChange={() => updateConfiguration("non_blocking_io", !(config.non_blocking_io || false))} className="mr-2 h-4 w-4" />
        <span className="text-sm text-gray-700">Non-blocking I/O</span>
      </div>
    </div>
  </div>
);
