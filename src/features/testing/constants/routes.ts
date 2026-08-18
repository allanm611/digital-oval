/** Top-level base path for the health-check feature (mirrors /documentation for docs). */
export const HEALTH_CHECK_BASE = '/health-check';

export function healthCheckPath(...segments: string[]): string {
  const suffix = segments.filter(Boolean).join('/');
  return suffix ? `${HEALTH_CHECK_BASE}/${suffix}` : HEALTH_CHECK_BASE;
}

export function healthCheckModulePath(moduleId: string, ...segments: string[]): string {
  return healthCheckPath(moduleId, ...segments);
}
