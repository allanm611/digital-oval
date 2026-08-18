import React, { useState } from "react";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import HeadlessSelect from "../ui/HeadlessSelect";
import Checkbox from "../ui/Checkbox";
import { ConfigComponentProps } from "./types";

export const JDBCConfig: React.FC<ConfigComponentProps> = ({
  config,
  updateConfiguration,
  showPasswords,
  togglePasswordVisibility,
}) => {
  const [isQueryOpen, setIsQueryOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h4 className="text-sm font-semibold text-gray-700">JDBC Configuration</h4>

      <HeadlessSelect
        label="Database Type *"
        options={[
          { value: "mysql", label: "MySQL" },
          { value: "postgres", label: "PostgreSQL" },
          { value: "mssql", label: "Microsoft SQL Server" },
          { value: "oracle", label: "Oracle" },
        ]}
        value={config.database_type || "mysql"}
        onChange={(val) => updateConfiguration("database_type", val)}
        className="w-full"
      />

      <div className="grid grid-cols-2 gap-6">
        <Input label="Host *" type="text" required value={config.host || ""} onChange={(value) => updateConfiguration("host", String(value))} placeholder="localhost" />
        <Input label="Port *" type="number" required value={config.port || 3306} onChange={(value) => updateConfiguration("port", parseInt(String(value)) || 3306)} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Input label="Database Name *" placeholder="database_name" required value={config.database || ""} onChange={(value) => updateConfiguration("database", value)} />
        <Input label="Timeout (seconds)" type="number" placeholder="Optional (1-300)" value={config.timeout_seconds || ""} onChange={(value) => updateConfiguration("timeout_seconds", value ? parseInt(String(value)) : undefined)} min="1" max="300" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Input label="Username *" placeholder="Database username" required value={config.username || ""} onChange={(value) => updateConfiguration("username", value)} />
        <Input
          type={showPasswords.jdbc_password ? "text" : "password"}
          label="Password *"
          required
          value={config.password || ""}
          onChange={(value) => updateConfiguration("password", String(value))}
          placeholder="••••••••"
        />
      </div>

      <Input label="Connection String (Optional)" placeholder="jdbc:mysql://localhost:3306/database" value={config.connection_string || ""} onChange={(value) => updateConfiguration("connection_string", value)} />

      <div>
        <button type="button" onClick={() => setIsQueryOpen(!isQueryOpen)} className="w-full flex items-center justify-between hover:bg-gray-50">
          <span className="text-sm font-medium text-gray-700">Query Configuration</span>
          {isQueryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isQueryOpen && (
          <div className="pt-2">
            <Textarea
              label="SQL Query"
              value={config.select_query || ""}
              onChange={(value) => updateConfiguration("select_query", value)}
              rows={4}
              placeholder="SELECT * FROM table_name WHERE condition"
              className="font-mono"
            />
          </div>
        )}
      </div>

      <div className="flex items-center cursor-pointer" onClick={() => updateConfiguration("ssl_enabled", !(config.ssl_enabled || false))}>
        <Checkbox id="ssl_enabled" checked={config.ssl_enabled || false} onChange={() => updateConfiguration("ssl_enabled", !(config.ssl_enabled || false))} className="mr-2 h-4 w-4" />
        <span className="text-sm text-gray-700">Enable SSL Connection</span>
      </div>
    </div>
  );
};
