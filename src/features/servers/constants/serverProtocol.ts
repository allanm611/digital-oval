import type { ServerProtocol } from "../types/server";

export const SERVER_PROTOCOL_OPTIONS: Array<{
  value: ServerProtocol;
  label: string;
}> = [
  { value: "http", label: "HTTP" },
  { value: "https", label: "HTTPS" },
  { value: "ftp", label: "FTP" },
  { value: "ftps", label: "FTPS" },
  { value: "sftp", label: "SFTP" },
  { value: "tcp", label: "TCP" },
  { value: "smtp", label: "SMTP" },
  { value: "smtps", label: "SMTPS" },
];

const DEFAULT_PORTS: Record<string, number> = {
  http: 80,
  https: 443,
  ftp: 21,
  ftps: 990,
  sftp: 22,
  smtp: 25,
  smtps: 465,
};

export function defaultPortForServerProtocol(
  protocol: string,
): number | undefined {
  return DEFAULT_PORTS[protocol];
}

export type ServerProtocolFields = {
  showBasePath: boolean;
  showHealthCheckUrl: boolean;
  /** TLS is implied by the protocol (https, ftps, smtps, sftp). */
  tlsImplied: boolean;
  showAuthType: boolean;
};

export function fieldsForServerProtocol(
  protocol: string,
): ServerProtocolFields {
  const httpLike = protocol === "http" || protocol === "https";
  const mailLike = protocol === "smtp" || protocol === "smtps";
  return {
    showBasePath: httpLike,
    showHealthCheckUrl: httpLike,
    tlsImplied: ["https", "ftps", "smtps", "sftp"].includes(protocol),
    showAuthType: httpLike || protocol === "sftp" || mailLike,
  };
}
