export function supportsHtmlBody(channel: string): boolean {
  return channel === "Email" || channel === "Web";
}

export function requiresHtmlBody(channel: string): boolean {
  return channel === "Email";
}
