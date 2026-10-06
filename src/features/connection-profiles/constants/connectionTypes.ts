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

export type ConnectionTypeValue =
  (typeof CONNECTION_TYPE_OPTIONS)[number]["value"];

export const DATABASE_TYPE_OPTIONS = [
  { value: "mysql", label: "MySQL" },
  { value: "postgres", label: "PostgreSQL" },
  { value: "mssql", label: "Microsoft SQL Server" },
  { value: "oracle", label: "Oracle" },
] as const;

export type DatabaseTypeValue = (typeof DATABASE_TYPE_OPTIONS)[number]["value"];

const CONNECTION_TYPE_LABELS: Record<string, string> = {
  ...Object.fromEntries(
    CONNECTION_TYPE_OPTIONS.map((option) => [option.value, option.label]),
  ),
  jdbc: "JDBC",
  tcp: "TCP",
  websocket: "WebSocket",
  sms_inbox: "SMS Inbox",
  files: "Files",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  http: "HTTP",
  rest: "REST",
};

const CONNECTION_TYPE_ACRONYMS = new Set([
  "api",
  "sftp",
  "ftp",
  "s3",
  "jdbc",
  "tcp",
  "http",
  "rest",
  "sms",
]);

export function formatConnectionTypeLabel(type?: string | null): string {
  const key = String(type || "").trim().toLowerCase();
  if (!key) return "";
  const known = CONNECTION_TYPE_LABELS[key];
  if (known) return known;
  return key
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) =>
      CONNECTION_TYPE_ACRONYMS.has(part)
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}
