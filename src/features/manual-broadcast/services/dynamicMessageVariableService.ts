/**
 * Service to manage Dynamic Message Variable configurations
 * Currently uses localStorage, will switch to backend endpoints when ready
 */

export interface DynamicMessageVariableConfig {
  id: number;
  field_name: string;
  field_value: string;
  description?: string;
  is_active: boolean;
  default_value?: string;
}

const STORAGE_KEY = 'cvm_dynamic_message_variables_config';

class DynamicMessageVariableService {
  /**
   * Save configurations to localStorage
   * TODO: Replace with backend endpoint when available
   */
  async saveConfigurations(
    configs: DynamicMessageVariableConfig[]
  ): Promise<void> {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        configs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save dynamic message variable configurations:', error);
      throw new Error('Failed to save configurations');
    }
  }

  /**
   * Load configurations from localStorage
   * TODO: Replace with backend endpoint when available
   */
  async loadConfigurations(): Promise<DynamicMessageVariableConfig[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data);
      return parsed.configs || [];
    } catch (error) {
      console.error('Failed to load dynamic message variable configurations:', error);
      return [];
    }
  }

  /**
   * Get a single field configuration
   */
  async getFieldConfig(fieldId: number): Promise<DynamicMessageVariableConfig | null> {
    try {
      const configs = await this.loadConfigurations();
      return configs.find((c) => c.id === fieldId) || null;
    } catch (error) {
      console.error('Failed to get field configuration:', error);
      return null;
    }
  }

  /**
   * Update a single field configuration
   */
  async updateFieldConfig(
    fieldId: number,
    updates: Partial<DynamicMessageVariableConfig>
  ): Promise<void> {
    try {
      const configs = await this.loadConfigurations();
      const index = configs.findIndex((c) => c.id === fieldId);

      if (index !== -1) {
        configs[index] = { ...configs[index], ...updates, id: fieldId };
        await this.saveConfigurations(configs);
      }
    } catch (error) {
      console.error('Failed to update field configuration:', error);
      throw new Error('Failed to update configuration');
    }
  }

  /**
   * Clear all stored configurations (useful for reset/debugging)
   */
  async clearConfigurations(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear configurations:', error);
      throw new Error('Failed to clear configurations');
    }
  }
}

export const dynamicMessageVariableService = new DynamicMessageVariableService();
