export const AI_MODELS_HUB_PATH = "/dashboard/ai-models";
export const AI_MODEL_CONFIGURATION_PATH = "/dashboard/ai-models/configuration";

export function aiModelViewPath(providerId: string): string {
  return `${AI_MODEL_CONFIGURATION_PATH}/${encodeURIComponent(providerId)}`;
}

export function aiModelEditPath(providerId: string): string {
  return `${AI_MODEL_CONFIGURATION_PATH}/${encodeURIComponent(providerId)}/edit`;
}
