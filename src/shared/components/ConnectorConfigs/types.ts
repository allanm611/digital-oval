// Common interface for configuration components
export interface ConfigComponentProps {
  config: any;
  updateConfiguration: (key: string, value: any) => void;
  showPasswords: Record<string, boolean>;
  togglePasswordVisibility: (field: string) => void;
}
