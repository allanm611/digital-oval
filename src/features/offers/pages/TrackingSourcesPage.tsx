import { useEffect, useMemo, useState } from "react";
import { ConfigurationManager } from "../../configurations/components/ConfigurationManager";
import type { ConfigurationItem } from "../../configurations/components/ConfigurationManager";
import { getTrackingSourcesConfig } from "../../configurations/configs/configurationPageConfigs";
import { trackingSourceService } from "../../configurations/services/trackingSourceService";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";

export default function TrackingSourcesPage() {
  const { t } = useLanguage();
  const baseConfig = useMemo(() => getTrackingSourcesConfig(t), [t]);
  const [initialData, setInitialData] = useState<ConfigurationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadWarning, setLoadWarning] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadWarning("");
      try {
        const data = await trackingSourceService.getAll();
        if (!cancelled) {
          setInitialData(data.map((s) => ({ ...s }) as ConfigurationItem));
        }
      } catch (error) {
        console.error(
          "[TrackingSourcesPage] Failed to load /offer-tracking-sources",
          error,
        );
        if (!cancelled) {
          setInitialData(baseConfig.initialData);
          setLoadWarning(
            "Could not reach offer-tracking-sources API. Showing local fallback data.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [baseConfig.initialData]);

  const config = useMemo(
    () => ({
      ...baseConfig,
      initialData,
    }),
    [baseConfig, initialData],
  );

  if (loading && initialData.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {loadWarning ? (
        <div className="mx-4 mt-2 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {loadWarning}
        </div>
      ) : null}
      <ConfigurationManager
        config={config}
        loading={loading}
        persistence={{
          onCreate: async (data) => {
            const created = await trackingSourceService.create({
              name: String(data.name || ""),
              description: data.description,
              type: String(data.type || "custom"),
              dataSource: String(data.dataSource || "custom_api"),
              parameters: Array.isArray(data.parameters) ? data.parameters : [],
              displayMetrics: Array.isArray(data.displayMetrics)
                ? data.displayMetrics
                : [],
              conditions: Array.isArray(data.conditions)
                ? data.conditions
                : undefined,
              lookbackPeriod: data.lookbackPeriod,
              customLookbackDate: data.customLookbackDate,
              isActive: data.isActive !== false,
            });
            return created as ConfigurationItem;
          },
          onUpdate: async (id, data) => {
            const updated = await trackingSourceService.update(id, {
              name: data.name,
              description: data.description,
              type: data.type,
              dataSource: data.dataSource,
              parameters: Array.isArray(data.parameters)
                ? data.parameters
                : undefined,
              displayMetrics: Array.isArray(data.displayMetrics)
                ? data.displayMetrics
                : undefined,
              conditions: Array.isArray(data.conditions)
                ? data.conditions
                : undefined,
              lookbackPeriod: data.lookbackPeriod,
              customLookbackDate: data.customLookbackDate,
              isActive: data.isActive,
            });
            return updated as ConfigurationItem;
          },
          onDelete: async (id) => {
            await trackingSourceService.remove(id);
          },
          onToggleActive: async (id, isActive) => {
            return (await trackingSourceService.setActive(
              id,
              isActive,
            )) as ConfigurationItem;
          },
        }}
      />
    </div>
  );
}
