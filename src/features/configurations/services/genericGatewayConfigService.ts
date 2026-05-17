import {
  CreateGatewayConfigRequest,
  UpdateGatewayConfigRequest,
  GatewayConfig,
} from "../types/genericGatewayConfig";

const GENERIC_GATEWAY_DUMMY_DATA: GatewayConfig[] = [];

class GenericGatewayConfigService {
  getAllConfigs(): Promise<GatewayConfig[]> {
    return Promise.resolve(GENERIC_GATEWAY_DUMMY_DATA);
  }

  getConfigById(id: number): Promise<GatewayConfig> {
    const config = GENERIC_GATEWAY_DUMMY_DATA.find((c) => c.id === id);
    if (!config) return Promise.reject(new Error("Config not found"));
    return Promise.resolve(config);
  }

  createConfig(data: CreateGatewayConfigRequest): Promise<GatewayConfig> {
    const newConfig: GatewayConfig = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(newConfig);
  }

  updateConfig(id: number, data: UpdateGatewayConfigRequest): Promise<GatewayConfig> {
    const config = GENERIC_GATEWAY_DUMMY_DATA.find((c) => c.id === id);
    const updatedConfig: GatewayConfig = {
      id,
      ...data,
      created_at: config?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return Promise.resolve(updatedConfig);
  }

  deleteConfig(id: number): Promise<{ success: boolean; message: string }> {
    return Promise.resolve({ success: true, message: "Deleted" });
  }
}

export const genericGatewayConfigService = new GenericGatewayConfigService();
