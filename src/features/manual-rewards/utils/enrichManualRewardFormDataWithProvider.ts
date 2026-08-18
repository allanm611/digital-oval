import { rewardConfigurationService } from "../../configurations/services/rewardConfigurationService";
import type { ManualRewardData } from "../pages/CreateManualRewardPage";

function readProviderIdFromPreview(
  preview: Record<string, unknown>,
): string | undefined {
  const raw =
    preview.reward_provider_id ??
    preview.provider_id ??
    preview.rewardProviderId;
  if (raw == null || raw === "") return undefined;
  return String(raw);
}

/** Ensures form data includes rewardProviderId (from preview or configuration lookup). */
export async function enrichManualRewardFormDataWithProvider(
  data: ManualRewardData,
  preview: Record<string, unknown> = {},
): Promise<ManualRewardData> {
  const fromPreview = readProviderIdFromPreview(preview);
  if (fromPreview) {
    return { ...data, rewardProviderId: fromPreview };
  }
  if (data.rewardProviderId || data.rewardConfigurationId == null) {
    return data;
  }
  try {
    const cfg = await rewardConfigurationService.getById(
      data.rewardConfigurationId,
    );
    if (cfg.provider_id == null) return data;
    return { ...data, rewardProviderId: String(cfg.provider_id) };
  } catch {
    return data;
  }
}
