import React from "react";
import Input from "../ui/Input";
import { ConfigComponentProps } from "./types";

export const S3Config: React.FC<ConfigComponentProps> = ({
  config,
  updateConfiguration,
  showPasswords,
}) => (
  <div className="space-y-6">
    <h4 className="text-sm font-semibold text-gray-700">S3 Configuration</h4>
    <div className="grid grid-cols-2 gap-6">
      <Input
        required
        label="Bucket Name *"
        placeholder="my-bucket"
        value={config.bucket_name || ""}
        onChange={(value) => updateConfiguration("bucket_name", value)}
      />
      <Input
        required
        label="Region *"
        placeholder="eu-west-1"
        value={config.region || ""}
        onChange={(value) => updateConfiguration("region", value)}
      />
    </div>
    <Input
      label="Prefix / Path"
      placeholder="incoming/"
      value={config.prefix || ""}
      onChange={(value) => updateConfiguration("prefix", value)}
    />
    <div className="grid grid-cols-2 gap-6">
      <Input
        label="Access Key ID"
        value={config.access_key_id || ""}
        onChange={(value) => updateConfiguration("access_key_id", value)}
      />
      <Input
        type={showPasswords.s3_secret ? "text" : "password"}
        label="Secret Access Key"
        value={config.secret_access_key || ""}
        onChange={(value) =>
          updateConfiguration("secret_access_key", String(value))
        }
        placeholder="••••••••"
      />
    </div>
  </div>
);
