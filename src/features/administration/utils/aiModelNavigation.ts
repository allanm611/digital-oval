export const AI_MODELS_HUB_PATH = "/dashboard/ai-models";
export const AI_MODEL_CONFIGURATION_PATH = "/dashboard/ai-models/configuration";
export const INSIGHT_WORKBENCH_PATH = "/dashboard/ai-models/insight-workbench";

export function workbenchCategoryPath(categorySlug: string): string {
  return `${INSIGHT_WORKBENCH_PATH}/categories/${encodeURIComponent(categorySlug)}`;
}

export function workbenchModelPath(modelId: string): string {
  return `${INSIGHT_WORKBENCH_PATH}/models/${encodeURIComponent(modelId)}`;
}

export function newWorkbenchModelPath(
  categorySlug: string,
  templateId?: string,
): string {
  const params = new URLSearchParams({ category: categorySlug });
  if (templateId) params.set("template", templateId);
  return `${INSIGHT_WORKBENCH_PATH}/models/new?${params.toString()}`;
}

export function aiModelViewPath(providerId: string): string {
  return `${AI_MODEL_CONFIGURATION_PATH}/${encodeURIComponent(providerId)}`;
}

export function aiModelEditPath(providerId: string): string {
  return `${AI_MODEL_CONFIGURATION_PATH}/${encodeURIComponent(providerId)}/edit`;
}
