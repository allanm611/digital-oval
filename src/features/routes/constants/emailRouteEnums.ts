export const EMAIL_GATEWAY_OPTIONS = [
  { value: "SENDGRID", label: "SendGrid" },
  { value: "AWS_SES", label: "AWS SES" },
  { value: "MAILGUN", label: "Mailgun" },
  { value: "POSTMARK", label: "Postmark" },
  { value: "INTERNAL_SMTP", label: "Internal SMTP" },
  { value: "GMAIL", label: "Gmail" },
] as const;

export type EmailGatewayEnum = (typeof EMAIL_GATEWAY_OPTIONS)[number]["value"];
