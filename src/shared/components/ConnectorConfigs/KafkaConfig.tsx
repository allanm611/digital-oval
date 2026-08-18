import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Input from "../ui/Input";
import { ConfigComponentProps } from "./types";

export const KafkaConfig: React.FC<ConfigComponentProps> = ({config, updateConfiguration}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const handleBrokersChange = (value: string) => {
    const brokers = value.split(",").map((b) => b.trim()).filter((b) => b);
    updateConfiguration("brokers", brokers);
  };
  return (
    <div className="space-y-6">
      <h4 className="text-sm font-semibold text-gray-700">Kafka Configuration</h4>
      <Input label="Connection Name" placeholder="My Kafka Connection" value={config.connection_name || ""} onChange={(value) => updateConfiguration("connection_name", value)} />
      <Input label="Topic Name *" placeholder="my-topic" required value={config.topic_name || ""} onChange={(value) => updateConfiguration("topic_name", value)} />
      <div className="mb-2">
        <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="w-full flex items-center justify-between hover:bg-gray-50 py-2">
          <span className="text-sm font-semibold text-gray-700">Advanced Configuration</span>
          {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {isAdvancedOpen && (
          <div className="space-y-6 pt-2">
            <Input label="Brokers *" placeholder="localhost:9092, localhost:9093" required value={Array.isArray(config.brokers) ? config.brokers.join(", ") : config.brokers || ""} onChange={(value) => handleBrokersChange(value)} />
            <Input label="Group Identifier" placeholder="my-consumer-group" value={config.group_identifier || ""} onChange={(value) => updateConfiguration("group_identifier", value)} />
          </div>
        )}
      </div>
    </div>
  );
};
