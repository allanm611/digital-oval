import React, { useState } from "react";
import Input from "../ui/Input";
import HeadlessSelect from "../ui/HeadlessSelect";
import { ConfigComponentProps } from "./types";

export const FilesConfig: React.FC<ConfigComponentProps> = ({config, updateConfiguration}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  return (
    <div className="space-y-6">
      <h4 className="text-sm font-semibold text-gray-700">Files Configuration</h4>
      <Input label="Job Name" placeholder="File Processing Job" value={config.job_name || ""} onChange={(value) => updateConfiguration("job_name", value)} />
      <HeadlessSelect
        label="Protocol"
        options={[
          { value: "local", label: "Local File System" },
          { value: "ftp", label: "FTP" },
          { value: "sftp", label: "SFTP" },
        ]}
        value={config.protocol || "local"}
        onChange={(val) => updateConfiguration("protocol", val)}
        className="w-full"
      />
      <Input label="Connection Name" placeholder="File Connection Name" value={config.Connection_Name || ""} onChange={(value) => updateConfiguration("Connection_Name", value)} />
      <div className="grid grid-cols-2 gap-6">
        <Input label="Input Path" placeholder="/path/to/input" value={config.input_path || ""} onChange={(value) => updateConfiguration("input_path", value)} />
        <Input label="Output Path" placeholder="/path/to/output" value={config.output_path || ""} onChange={(value) => updateConfiguration("output_path", value)} />
      </div>
      <Input label="Regex" placeholder="*.txt, *.csv" value={config.regex_pattern || ""} onChange={(value) => updateConfiguration("regex_pattern", value)} />
    </div>
  );
};
