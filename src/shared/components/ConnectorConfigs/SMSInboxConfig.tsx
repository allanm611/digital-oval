import React, { useState } from "react";
import Input from "../ui/Input";
import HeadlessSelect from "../ui/HeadlessSelect";
import Checkbox from "../ui/Checkbox";
import { ConfigComponentProps } from "./types";

export const SMSInboxConfig: React.FC<ConfigComponentProps> = ({config, updateConfiguration}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  return (
    <div className="space-y-6">
      <h4 className="text-sm font-semibold text-gray-700">SMS Inbox Configuration</h4>
      <Input label="Connection Name *" placeholder="" required value={config.connection_name} onChange={(value) => updateConfiguration("connection_name", value)} />
      <Input label="Select Inbox *" placeholder="" required value={config.short_code } onChange={(value) => updateConfiguration("short_code", value)} />
      <HeadlessSelect
        label="Provider"
        options={[
          { value: "MTN", label: "MTN" },
          { value: "Jioce", label: "Jioce" },
          { value: "Test", label: "Test" },
          { value: "Airtel", label: "Airtel" },
        ]}
        value={config.provider || "MTN"}
        onChange={(val) => updateConfiguration("provider", val)}
        className="w-full"
      />
      <div className="flex items-center cursor-pointer" onClick={() => updateConfiguration("filter_by_keyword", !(config.filter_by_keyword || false))}>
        <Checkbox id="filter_by_keyword" checked={config.filter_by_keyword || false} onChange={() => updateConfiguration("filter_by_keyword", !(config.filter_by_keyword || false))} className="mr-2 h-4 w-4" />
        <span className="text-sm font-medium text-gray-700">Filter messages based on keyword</span>
      </div>
      {config.filter_by_keyword && (
        <div className="space-y-6 pt-2">
          <Input label="Delimiter to identify Keyword" placeholder="Comma" value={config.keyword_delimiter || ","} onChange={(value) => updateConfiguration("keyword_delimiter", value)} />
          <Input label="Keyword to identify messages" placeholder="Enter keywords to filter" value={config.keyword_identifier || ""} onChange={(value) => updateConfiguration("keyword_identifier", value)} />
          <div className="grid grid-cols-2 gap-6">
            <HeadlessSelect
              label="Condition on keyword"
              options={[
                { value: "contains", label: "Contains" },
                { value: "starts_with", label: "Starts with" },
                { value: "ends_with", label: "Ends with" },
                { value: "equals", label: "Equals exactly" },
              ]}
              value={config.keyword_condition || "contains"}
              onChange={(val) => updateConfiguration("keyword_condition", val)}
              className="w-full"
            />
            <Input label="Value" placeholder="e.g., VISA, PAYMENT" value={config.keyword_value || ""} onChange={(value) => updateConfiguration("keyword_value", value)} />
          </div>
        </div>
      )}

    </div>
  );
};
