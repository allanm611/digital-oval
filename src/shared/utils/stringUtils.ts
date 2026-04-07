/**
 * Interpolate a string with template variables
 * @param template - String with {{varName}} placeholders
 * @param values - Object with variable values
 * @returns Interpolated string
 */
export function interpolate(template: string, values: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined ? String(values[key]) : match;
  });
}
