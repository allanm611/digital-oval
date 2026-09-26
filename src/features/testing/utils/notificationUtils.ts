import { HealthApiError } from '../services/healthApi';
import type {
  NotificationDeliveryDiagnostics,
  NotificationDeliveryResult,
  NotificationErrorCode,
} from '../types/health';

export function isSmtpConfigured(delivery?: NotificationDeliveryDiagnostics): boolean {
  if (!delivery) return false;
  return delivery.primaryConfigured || delivery.fallbackConfigured;
}

export function describeDeliveryChannel(channel: NotificationDeliveryResult['channel']): string {
  return channel === 'fallback' ? 'Mailtrap (fallback)' : 'Primary SMTP';
}

export function formatDeliverySuccess(result: NotificationDeliveryResult): string {
  const via = describeDeliveryChannel(result.channel);
  const to = result.recipients.join(', ');
  return `Delivered via ${via} to ${to}`;
}

export function formatNotificationError(err: unknown): string {
  if (!(err instanceof HealthApiError)) {
    return err instanceof Error ? err.message : 'Unknown error';
  }

  const code = err.code as NotificationErrorCode | undefined;
  const base = err.message;

  switch (code) {
    case 'DISABLED':
      return `${base} Enable email alerts under notification settings first.`;
    case 'NO_RECIPIENTS':
      return `${base} Add recipients above or enter a test email address.`;
    case 'SMTP_NOT_CONFIGURED':
      return `${base} Configure PLAYWRIGHT_SMTP_* or SMTP_* variables in the backend .env.`;
    case 'DELIVERY_FAILED':
      return err.details ? `${base} (${err.details})` : base;
    case 'VALIDATION_ERROR':
      return base;
    default:
      return err.details ? `${base} — ${err.details}` : base;
  }
}

export function smtpReadinessLabel(delivery?: NotificationDeliveryDiagnostics): {
  ready: boolean;
  label: string;
  hint?: string;
} {
  if (!delivery) {
    return { ready: false, label: 'Unknown', hint: 'Could not load SMTP diagnostics.' };
  }

  if (delivery.primaryConfigured) {
    return {
      ready: true,
      label: 'Primary SMTP configured',
      hint: delivery.fromAddress ? `From: ${delivery.fromAddress}` : undefined,
    };
  }

  if (delivery.fallbackConfigured) {
    return {
      ready: true,
      label: 'Fallback SMTP configured (Mailtrap)',
      hint: delivery.fromAddress ? `From: ${delivery.fromAddress}` : undefined,
    };
  }

  return {
    ready: false,
    label: 'SMTP not configured',
    hint: 'Set PLAYWRIGHT_SMTP_USER/PASS or MAILTRAP_USER/PASS in cvm-backend .env.',
  };
}
