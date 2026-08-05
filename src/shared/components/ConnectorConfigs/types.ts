// Common interface for configuration components
export interface ConfigComponentProps {
  config: any;
  updateConfiguration: (key: string, value: any) => void;
  /** Atomic multi-key update — preferred for Postman-style sync logic */
  patchConfiguration?: (updates: Record<string, any>) => void;
  /** Change this when external config is loaded (e.g. edit mode) to re-hydrate UI state */
  hydrateKey?: string;
  showPasswords: Record<string, boolean>;
  togglePasswordVisibility: (field: string) => void;
}
