import { useState, useEffect, useCallback } from "react";
import { campaignTypeService, CampaignType, CreateCampaignTypeRequest, UpdateCampaignTypeRequest } from "../../features/campaigns/services/campaignTypeService";
import { senderIdService, SenderId } from "../../features/configurations/services/senderIdService";
import { languageService, Language } from "../../features/configurations/services/languageService";
import { characterSetService, CharacterSet } from "../../features/configurations/services/characterSetService";
import { creativeTemplateService, CreativeTemplate } from "../../features/configurations/services/creativeTemplateService";

/**
 * Normalize API response to TypeConfigurationItem format
 * Converts API field names back to metadataValue for display
 */
function normalizeApiResponse(type: string, data: any[]): any[] {
  return data.map(item => {
    const normalized = { ...item };

    switch (type) {
      case "languages":
        // Convert language_code back to metadataValue for display
        if (normalized.language_code) {
          normalized.metadataValue = normalized.language_code;
        }
        // Convert is_active to isActive
        if (normalized.is_active !== undefined) {
          normalized.isActive = normalized.is_active;
        }
        // Keep snake_case fields for custom field mapping
        break;

      case "characterSets":
        // Convert character_set_type back to metadataValue for display
        if (normalized.character_set_type) {
          normalized.metadataValue = normalized.character_set_type;
        }
        // Convert is_active to isActive
        if (normalized.is_active !== undefined) {
          normalized.isActive = normalized.is_active;
        }
        // Convert message_type to messageType for form
        if (normalized.message_type) {
          normalized.messageType = normalized.message_type;
        }
        // Convert character_set_type to characterSetType for form
        if (normalized.character_set_type) {
          normalized.characterSetType = normalized.character_set_type;
        }
        // Convert character_set_size to characterSetSize for form
        if (normalized.character_set_size) {
          normalized.characterSetSize = normalized.character_set_size;
        }
        // Convert character string fields back to camelCase
        if (normalized.standard_chars) {
          normalized.standardChars = normalized.standard_chars;
        }
        if (normalized.double_chars) {
          normalized.doubleChars = normalized.double_chars;
        }
        if (normalized.triple_chars) {
          normalized.tripleChars = normalized.triple_chars;
        }
        if (normalized.quad_chars) {
          normalized.quadChars = normalized.quad_chars;
        }
        break;

      case "senderIds":
        // Convert gateway_key to metadataValue for display
        if (normalized.gateway_key) {
          normalized.metadataValue = normalized.gateway_key;
        }
        // Convert is_active to isActive
        if (normalized.is_active !== undefined) {
          normalized.isActive = normalized.is_active;
        }
        break;

      case "creativeTemplates":
        // Convert primaryChannel to metadataValue for display
        if (normalized.primaryChannel) {
          normalized.metadataValue = normalized.primaryChannel;
        }
        // Convert is_active to isActive
        if (normalized.is_active !== undefined) {
          normalized.isActive = normalized.is_active;
        }
        break;
    }

    return normalized;
  });
}

/**
 * Transform payload from TypeConfigurationPage format to API format
 */
function transformPayload(type: string, payload: any): any {
  const transformed = { ...payload };

  switch (type) {
    case "languages":
      // Map metadataValue to language_code
      if (transformed.metadataValue) {
        transformed.language_code = transformed.metadataValue;
        delete transformed.metadataValue;
      }
      // Map character set name to character_set field
      if (transformed.characterSet) {
        transformed.character_set = transformed.characterSet;
        delete transformed.characterSet;
      }
      // Map isActive to is_active
      if (transformed.isActive !== undefined) {
        transformed.is_active = transformed.isActive;
        delete transformed.isActive;
      }
      break;

    case "characterSets":
      // Map isActive to is_active
      if (transformed.isActive !== undefined) {
        transformed.is_active = transformed.isActive;
        delete transformed.isActive;
      }
      // Map messageType to message_type
      if (transformed.messageType) {
        transformed.message_type = transformed.messageType;
        delete transformed.messageType;
      }
      // Map characterSetType to character_set_type
      if (transformed.characterSetType) {
        transformed.character_set_type = transformed.characterSetType;
        delete transformed.characterSetType;
      }
      // Map characterSetSize to character_set_size (as number)
      if (transformed.characterSetSize) {
        transformed.character_set_size = parseInt(String(transformed.characterSetSize), 10);
        delete transformed.characterSetSize;
      }
      // Map character strings (camelCase to snake_case)
      if (transformed.standardChars) {
        transformed.standard_chars = transformed.standardChars;
        delete transformed.standardChars;
      }
      if (transformed.doubleChars) {
        transformed.double_chars = transformed.doubleChars;
        delete transformed.doubleChars;
      }
      if (transformed.tripleChars) {
        transformed.triple_chars = transformed.tripleChars;
        delete transformed.tripleChars;
      }
      if (transformed.quadChars) {
        transformed.quad_chars = transformed.quadChars;
        delete transformed.quadChars;
      }
      // Provide defaults for required character fields
      if (!transformed.standard_chars) {
        transformed.standard_chars = "";
      }
      if (!transformed.double_chars) {
        transformed.double_chars = "";
      }
      if (!transformed.triple_chars) {
        transformed.triple_chars = "";
      }
      if (!transformed.quad_chars) {
        transformed.quad_chars = "";
      }
      // Map metadataValue to character_set_type if no characterSetType
      if (transformed.metadataValue && !transformed.character_set_type) {
        transformed.character_set_type = transformed.metadataValue;
        delete transformed.metadataValue;
      }
      break;

    case "senderIds":
      // Map isActive to is_active
      if (transformed.isActive !== undefined) {
        transformed.is_active = transformed.isActive;
        delete transformed.isActive;
      }
      // Map metadataValue to gateway_key if provided
      if (transformed.metadataValue) {
        transformed.gateway_key = transformed.metadataValue;
        delete transformed.metadataValue;
      }
      break;

    case "creativeTemplates":
      // Map isActive to is_active
      if (transformed.isActive !== undefined) {
        transformed.is_active = transformed.isActive;
        delete transformed.isActive;
      }
      // Map metadataValue to primaryChannel
      if (transformed.metadataValue) {
        transformed.primaryChannel = transformed.metadataValue;
        delete transformed.metadataValue;
      }
      break;
  }

  return transformed;
}

export interface UseBackendConfigDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export interface UseBackendConfigDataActions<T, CreateReq, UpdateReq> {
  refresh: () => Promise<void>;
  create: (data: CreateReq) => Promise<T>;
  update: (id: number, data: UpdateReq) => Promise<T>;
  delete: (id: number) => Promise<void>;
}

export type UseBackendConfigDataResult<T, CreateReq, UpdateReq> = UseBackendConfigDataState<T> & UseBackendConfigDataActions<T, CreateReq, UpdateReq>;

/**
 * Hook for managing backend-driven configuration data
 * Always fetches fresh data - no caching
 * Supports CRUD operations
 * Pass undefined to skip fetching (useful for conditional hook usage in React)
 */
export function useBackendConfigurationData(
  type: "campaignTypes" | "senderIds" | "languages" | "characterSets" | "creativeTemplates" | undefined
): UseBackendConfigDataResult<any, any, any> | null {
  const [data, setData] = useState<CampaignType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If type is undefined, return null early
  if (!type) {
    return null;
  }

  // Fetch fresh data from backend
  const refresh = useCallback(async () => {
    if (!type) return;

    setLoading(true);
    setError(null);
    try {
      let response: any;

      switch (type) {
        case "campaignTypes":
          response = await campaignTypeService.getAllCampaignTypes();
          // Campaign types return wrapped response
          if (response?.success && response?.data) {
            setData(response.data);
          } else {
            throw new Error(response?.error || "Failed to fetch campaign types");
          }
          break;

        case "senderIds":
          response = await senderIdService.getSenderIds();
          if (response?.success && response?.data) {
            setData(normalizeApiResponse(type, Array.isArray(response.data) ? response.data : []));
          } else if (Array.isArray(response)) {
            setData(normalizeApiResponse(type, response));
          } else {
            setData([]);
          }
          break;

        case "languages":
          response = await languageService.getLanguages();
          if (response?.success && response?.data) {
            setData(normalizeApiResponse(type, Array.isArray(response.data) ? response.data : []));
          } else if (Array.isArray(response)) {
            setData(normalizeApiResponse(type, response));
          } else {
            setData([]);
          }
          break;

        case "characterSets":
          response = await characterSetService.getCharacterSets();
          if (response?.success && response?.data) {
            setData(normalizeApiResponse(type, Array.isArray(response.data) ? response.data : []));
          } else if (Array.isArray(response)) {
            setData(normalizeApiResponse(type, response));
          } else {
            setData([]);
          }
          break;

        case "creativeTemplates":
          response = await creativeTemplateService.getCreativeTemplates();
          if (response?.success && response?.data) {
            setData(normalizeApiResponse(type, Array.isArray(response.data) ? response.data : []));
          } else if (Array.isArray(response)) {
            setData(normalizeApiResponse(type, response));
          } else {
            setData([]);
          }
          break;

        default:
          throw new Error(`Unknown configuration type: ${type}`);
      }
    } catch (err) {
      // Silently fail - endpoint may not be ready yet or returning errors
      console.debug(`Configuration fetch failed for ${type}:`, err instanceof Error ? err.message : err);
      setData([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [type]);

  // Create new item
  const create = useCallback(
    async (createData: any): Promise<any> => {
      setLoading(true);
      setError(null);
      try {
        const payload = transformPayload(type || "", createData);
        let response: any;
        switch (type) {
          case "campaignTypes":
            response = await campaignTypeService.createCampaignType(payload);
            if (response?.success && response?.data) {
              await refresh();
              return response.data;
            } else {
              throw new Error(response?.error || "Failed to create item");
            }
          case "senderIds":
          case "languages":
          case "characterSets":
          case "creativeTemplates":
            if (type === "senderIds") response = await senderIdService.createSenderId(payload);
            else if (type === "languages") response = await languageService.createLanguage(payload);
            else if (type === "characterSets") response = await characterSetService.createCharacterSet(payload);
            else if (type === "creativeTemplates") response = await creativeTemplateService.createCreativeTemplate(payload);
            await refresh();
            // Return the data if wrapped, otherwise return response directly
            return response?.data || response;
          default:
            throw new Error(`Unknown configuration type: ${type}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [type, refresh]
  );

  // Update existing item
  const update = useCallback(
    async (id: number, updateData: any): Promise<any> => {
      setLoading(true);
      setError(null);
      try {
        const payload = transformPayload(type || "", updateData);
        let response: any;
        switch (type) {
          case "campaignTypes":
            response = await campaignTypeService.updateCampaignType(id, payload);
            if (response?.success && response?.data) {
              await refresh();
              return response.data;
            } else {
              throw new Error(response?.error || "Failed to update item");
            }
          case "senderIds":
          case "languages":
          case "characterSets":
          case "creativeTemplates":
            if (type === "senderIds") response = await senderIdService.updateSenderId(id, payload);
            else if (type === "languages") response = await languageService.updateLanguage(id, payload);
            else if (type === "characterSets") response = await characterSetService.updateCharacterSet(id, payload);
            else if (type === "creativeTemplates") response = await creativeTemplateService.updateCreativeTemplate(id, payload);
            await refresh();
            // Return the data if wrapped, otherwise return response directly
            return response?.data || response;
          default:
            throw new Error(`Unknown configuration type: ${type}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [type, refresh]
  );

  // Delete item
  const deleteItem = useCallback(
    async (id: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        let response: any;
        switch (type) {
          case "campaignTypes":
            response = await campaignTypeService.deleteCampaignType(id);
            if (response?.success) {
              await refresh();
            } else {
              throw new Error(response?.error || "Failed to delete item");
            }
            break;
          case "senderIds":
          case "languages":
          case "characterSets":
          case "creativeTemplates":
            if (type === "senderIds") await senderIdService.deleteSenderId(id);
            else if (type === "languages") await languageService.deleteLanguage(id);
            else if (type === "characterSets") await characterSetService.deleteCharacterSet(id);
            else if (type === "creativeTemplates") await creativeTemplateService.deleteCreativeTemplate(id);
            await refresh();
            break;
          default:
            throw new Error(`Unknown configuration type: ${type}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [type, refresh]
  );

  // Fetch data on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    create,
    update,
    delete: deleteItem,
  };
}
