import { useCallback, useEffect, useState } from "react";
import { gatewayProviderService } from "../services/gatewayProviderService";
import type { GatewayProviderField } from "../services/gatewayProviderService";
import {
  CUSTOM_PROTOCOL,
  GATEWAY_PROTOCOLS,
  cloneProtocolFields,
  getGatewayProtocol,
  mergeProtocolCatalog,
  type GatewayProtocolDefinition,
} from "../constants/gatewayProtocol";

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export function useGatewayProtocols() {
  const [catalog, setCatalog] =
    useState<GatewayProtocolDefinition[]>(GATEWAY_PROTOCOLS);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const remote = await gatewayProviderService.getSupportedProtocols({
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (remote.length > 0) {
          setCatalog(mergeProtocolCatalog(remote));
          setUsingFallback(false);
        } else {
          setCatalog(GATEWAY_PROTOCOLS);
          setUsingFallback(true);
        }
      } catch (error) {
        if (isAbortError(error) || controller.signal.aborted) return;
        setCatalog(GATEWAY_PROTOCOLS);
        setUsingFallback(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => controller.abort();
  }, []);

  const getProtocol = useCallback(
    (value?: string | null) => getGatewayProtocol(value, catalog),
    [catalog],
  );

  const fetchPreset = useCallback(
    async (
      protocol: string,
      options?: { signal?: AbortSignal; refresh?: boolean },
    ): Promise<GatewayProviderField[]> => {
      const code = (protocol || "").trim().toLowerCase();
      if (!code || code === CUSTOM_PROTOCOL) {
        return [];
      }

      try {
        const preset = await gatewayProviderService.getProtocolPreset(code, {
          signal: options?.signal,
          skipCache: options?.refresh,
        });
        return cloneProtocolFields(preset.fields || []);
      } catch (error) {
        if (isAbortError(error)) throw error;
        return cloneProtocolFields(getGatewayProtocol(code, catalog)?.fields || []);
      }
    },
    [catalog],
  );

  return {
    catalog,
    loading,
    usingFallback,
    getProtocol,
    fetchPreset,
  };
}
