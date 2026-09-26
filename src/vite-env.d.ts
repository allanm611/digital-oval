/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_AI_GENERATE_URL?: string;
  readonly VITE_USE_BACKEND_AI?: string;
  readonly VITE_SILENT_MODE?: string;
}
