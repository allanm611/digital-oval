export function supportsHtmlBody(channel: string): boolean {
  return channel === "Email" || channel === "Web";
}

export function requiresHtmlBody(channel: string): boolean {
  return channel === "Email";
}

/** Strip HTML tags to produce a plain-text body. */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Ensure Email creatives have html_body populated.
 * Rich Text content was previously saved only to text_body; this recovers that
 * and wraps plain text so backend validation still passes.
 */
export function ensureEmailHtmlBody<
  T extends { channel: string; text_body?: string; html_body?: string },
>(creative: T): T {
  if (!requiresHtmlBody(creative.channel)) return creative;
  if (creative.html_body?.trim()) return creative;

  const text = creative.text_body?.trim();
  if (!text) return creative;

  const html_body = /<[a-z][\s\S]*>/i.test(text) ? text : `<p>${text}</p>`;
  return {
    ...creative,
    html_body,
    text_body: stripHtmlTags(html_body) || text,
  };
}
