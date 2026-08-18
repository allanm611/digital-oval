export const CRON_PRESETS = [
  { label: 'Every 15 min', value: '*/15 * * * *' },
  { label: 'Every 30 min', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Daily midnight', value: '0 0 * * *' },
  { label: 'Daily 9am', value: '0 9 * * *' },
  { label: 'Weekdays 9am', value: '0 9 * * 1-5' },
] as const;

export function validateCron(expr: string): string | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return 'Must have exactly 5 fields (min hr dom mon dow)';
  }
  return null;
}

export function cronToHuman(cron: string): string {
  const map: Record<string, string> = {
    '*/15 * * * *': 'Every 15 minutes',
    '*/30 * * * *': 'Every 30 minutes',
    '0 * * * *': 'Every hour at :00',
    '0 */6 * * *': 'Every 6 hours',
    '0 0 * * *': 'Daily at midnight',
    '0 9 * * *': 'Daily at 9:00 AM',
    '0 9 * * 1-5': 'Weekdays at 9:00 AM',
  };
  return map[cron] ?? `Custom: ${cron}`;
}
