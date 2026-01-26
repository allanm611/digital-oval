export const CONNECTION_TYPE_OPTIONS = [
  { value: "database", label: "Database" },
  { value: "api", label: "API" },
  { value: "sftp", label: "SFTP" },
  { value: "ftp", label: "FTP" },
  { value: "s3", label: "S3" },
  { value: "azure_blob", label: "Azure Blob" },
  { value: "kafka", label: "Kafka" },
  { value: "webhook", label: "Webhook" },
] as const;

export type ConnectionTypeValue = typeof CONNECTION_TYPE_OPTIONS[number]['value'];
