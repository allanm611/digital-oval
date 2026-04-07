import { useState, useEffect, useCallback } from "react";
import { campaignTypeService, CampaignType, CreateCampaignTypeRequest, UpdateCampaignTypeRequest } from "../../features/campaigns/services/campaignTypeService";
import { offerTypeService, OfferType, CreateOfferTypeRequest, UpdateOfferTypeRequest } from "../../features/offers/services/offerTypeService";
import { rewardTypeService, RewardType, CreateRewardTypeRequest, UpdateRewardTypeRequest } from "../../features/offers/services/rewardTypeService";
import { segmentTypeService, SegmentType, CreateSegmentTypeRequest, UpdateSegmentTypeRequest } from "../../features/segments/services/segmentTypeService";
import { productTypeService, ProductType, CreateProductTypeRequest, UpdateProductTypeRequest } from "../../features/products/services/productTypeService";
import { senderIdService, SenderId } from "../../features/configurations/services/senderIdService";
import { languageService, Language } from "../../features/configurations/services/languageService";
import { characterSetService, CharacterSet } from "../../features/configurations/services/characterSetService";
import { creativeTemplateService, CreativeTemplate } from "../../features/configurations/services/creativeTemplateService";
import { smsRouteService, SmsRoute, CreateSmsRouteRequest, UpdateSmsRouteRequest } from "../../features/routes/services/smsRouteService";
import { comboTypeService, ComboType, CreateComboTypeRequest, UpdateComboTypeRequest } from "../../features/products/services/comboTypeService";
import { notificationTypeService, NotificationType, CreateNotificationTypeRequest, UpdateNotificationTypeRequest } from "../services/notificationTypeService";
import { vipListService, VIPList, CreateVIPListRequest, AddVIPMemberRequest } from "../services/vipListService";
import { controlGroupService, ControlGroup, CreateControlGroupRequest, UpdateControlGroupRequest } from "../services/controlGroupService";

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

      case "comboTypes":
        // Convert is_active to isActive
        if (normalized.is_active !== undefined) {
          normalized.isActive = normalized.is_active;
        }
        // Convert combo_resources to comboResources and transform nested fields
        if (normalized.combo_resources && Array.isArray(normalized.combo_resources)) {
          normalized.comboResources = normalized.combo_resources.map((resource: any) => ({
            type: resource.resource_type,
            value: resource.unit_value,
            unit: resource.unit,
            sharedValidity: resource.shared_validity,
            sharedValidityHours: resource.shared_validity_hours,
          }));
        }
        // Convert shared_validity to sharedValidity
        if (normalized.shared_validity !== undefined) {
          normalized.sharedValidity = normalized.shared_validity;
        }
        // Convert shared_price to sharedPrice
        if (normalized.shared_price !== undefined) {
          normalized.sharedPrice = normalized.shared_price;
        }
        // Convert validity_hours to validityHours
        if (normalized.validity_hours !== undefined) {
          normalized.validityHours = normalized.validity_hours;
        }
        break;

      case "notificationTypes":
        // Convert is_active to isActive
        if (normalized.is_active !== undefined) {
          normalized.isActive = normalized.is_active;
        }
        break;

      case "vipLists":
        // VIP Lists come with snake_case fields already, just keep them as is
        // No conversion needed
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
      // Remove isActive - API doesn't accept this field
      delete transformed.isActive;
      // Map metadataValue to primaryChannel
      if (transformed.metadataValue) {
        transformed.primaryChannel = transformed.metadataValue;
        delete transformed.metadataValue;
      }
      break;

    case "campaignTypes":
    case "offerTypes":
    case "segmentTypes":
    case "productTypes":
      // Map isActive to is_active
      if (transformed.isActive !== undefined) {
        transformed.is_active = transformed.isActive;
        delete transformed.isActive;
      }
      break;

    case "rewardTypes":
      // Map isActive to is_active
      if (transformed.isActive !== undefined) {
        transformed.is_active = transformed.isActive;
        delete transformed.isActive;
      }
      // Note: reward_key should not be changed - it comes from metadataValue in modal
      if (transformed.metadataValue) {
        transformed.reward_key = transformed.metadataValue;
        delete transformed.metadataValue;
      }
      break;

    case "comboTypes":
      // Map isActive to is_active
      if (transformed.isActive !== undefined) {
        transformed.is_active = transformed.isActive;
        delete transformed.isActive;
      }
      // Map comboResources to combo_resources with nested field transformations
      if (transformed.comboResources && Array.isArray(transformed.comboResources)) {
        transformed.combo_resources = transformed.comboResources.map((resource: any) => ({
          resource_type: resource.type,
          unit_value: resource.value,
          unit: resource.unit,
          shared_validity: resource.sharedValidity,
          shared_validity_hours: resource.sharedValidityHours,
          ...(resource.price !== undefined && { price: resource.price }),
        }));
        delete transformed.comboResources;
      }
      // Map sharedValidity to shared_validity
      if (transformed.sharedValidity !== undefined) {
        transformed.shared_validity = transformed.sharedValidity;
        delete transformed.sharedValidity;
      }
      // Remove sharedPrice - API doesn't accept this field
      delete transformed.sharedPrice;
      // Map validityHours to validity_hours
      if (transformed.validityHours !== undefined) {
        transformed.validity_hours = transformed.validityHours;
        delete transformed.validityHours;
      }
      break;

    case "notificationTypes":
      // Map isActive to is_active
      if (transformed.isActive !== undefined) {
        transformed.is_active = transformed.isActive;
        delete transformed.isActive;
      }
      break;

    case "vipLists":
      // Map isActive to is_active
      if (transformed.isActive !== undefined) {
        transformed.is_active = transformed.isActive;
        delete transformed.isActive;
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
  type: "campaignTypes" | "offerTypes" | "segmentTypes" | "productTypes" | "rewardTypes" | "senderIds" | "languages" | "characterSets" | "creativeTemplates" | "smsRoutes" | "comboTypes" | "notificationTypes" | "vipLists" | "controlGroups" | undefined
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

        case "offerTypes":
          response = await offerTypeService.getAllOfferTypes();
          if (response?.success && response?.data) {
            setData(normalizeApiResponse(type, Array.isArray(response.data) ? response.data : []));
          } else if (Array.isArray(response)) {
            setData(normalizeApiResponse(type, response));
          } else {
            setData([]);
          }
          break;

        case "segmentTypes":
          response = await segmentTypeService.getAllSegmentTypes();
          if (response?.success && response?.data) {
            setData(normalizeApiResponse(type, Array.isArray(response.data) ? response.data : []));
          } else if (Array.isArray(response)) {
            setData(normalizeApiResponse(type, response));
          } else {
            setData([]);
          }
          break;

        case "productTypes":
          response = await productTypeService.getAllProductTypes();
          if (response?.success && response?.data) {
            setData(normalizeApiResponse(type, Array.isArray(response.data) ? response.data : []));
          } else if (Array.isArray(response)) {
            setData(normalizeApiResponse(type, response));
          } else {
            setData([]);
          }
          break;

        case "rewardTypes":
          response = await rewardTypeService.getAllRewardTypes();
          if (response?.success && response?.data) {
            setData(normalizeApiResponse(type, Array.isArray(response.data) ? response.data : []));
          } else if (Array.isArray(response)) {
            setData(normalizeApiResponse(type, response));
          } else {
            setData([]);
          }
          break;

        case "smsRoutes":
          response = await smsRouteService.getAllRoutes();
          if (Array.isArray(response)) {
            setData(normalizeApiResponse(type, response));
          } else {
            setData([]);
          }
          break;

        case "comboTypes":
          response = await comboTypeService.getAllComboTypes();
          if (response?.data && Array.isArray(response.data)) {
            setData(normalizeApiResponse(type, response.data));
          } else if (Array.isArray(response)) {
            setData(normalizeApiResponse(type, response));
          } else {
            setData([]);
          }
          break;

        case "notificationTypes":
          response = await notificationTypeService.getAll();
          if (Array.isArray(response)) {
            setData(normalizeApiResponse(type, response));
          } else {
            setData([]);
          }
          break;

        case "vipLists":
          response = await vipListService.getAll();
          if (Array.isArray(response)) {
            setData(normalizeApiResponse(type, response));
          } else {
            setData([]);
          }
          break;

        case "controlGroups":
          response = await controlGroupService.getAll();
          if (Array.isArray(response)) {
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
      setError(null);
      try {
        const payload = transformPayload(type || "", createData);
        let response: any;
        switch (type) {
          case "campaignTypes":
            response = await campaignTypeService.createCampaignType(payload);
            if (response?.success && response?.data) {
              return response.data;
            } else {
              throw new Error(response?.error || "Failed to create item");
            }
          case "offerTypes":
            response = await offerTypeService.createOfferType(payload);
            return response?.data || response;
          case "segmentTypes":
            response = await segmentTypeService.createSegmentType(payload);
            return response?.data || response;
          case "productTypes":
            response = await productTypeService.createProductType(payload);
            return response?.data || response;
          case "rewardTypes":
            response = await rewardTypeService.createRewardType(payload);
            return response?.data || response;
          case "senderIds":
          case "languages":
          case "characterSets":
          case "creativeTemplates":
            if (type === "senderIds") response = await senderIdService.createSenderId(payload);
            else if (type === "languages") response = await languageService.createLanguage(payload);
            else if (type === "characterSets") response = await characterSetService.createCharacterSet(payload);
            else if (type === "creativeTemplates") response = await creativeTemplateService.createCreativeTemplate(payload);
            // Return the data if wrapped, otherwise return response directly
            return response?.data || response;
          case "smsRoutes":
            response = await smsRouteService.createRoute(payload);
            return response;
          case "comboTypes":
            response = await comboTypeService.createComboType(payload);
            return response?.data || response;
          case "notificationTypes":
            response = await notificationTypeService.create(payload);
            return response;
          case "vipLists":
            response = await vipListService.create(payload);
            return response;
          case "controlGroups":
            response = await controlGroupService.create(payload);
            return response;
          default:
            throw new Error(`Unknown configuration type: ${type}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      }
    },
    [type]
  );

  // Update existing item
  const update = useCallback(
    async (id: number, updateData: any): Promise<any> => {
      setError(null);
      try {
        const payload = transformPayload(type || "", updateData);
        let response: any;
        switch (type) {
          case "campaignTypes":
            response = await campaignTypeService.updateCampaignType(id, payload);
            if (response?.success && response?.data) {
              return response.data;
            } else {
              throw new Error(response?.error || "Failed to update item");
            }
          case "offerTypes":
            response = await offerTypeService.updateOfferType(id, payload);
            return response?.data || response;
          case "segmentTypes":
            response = await segmentTypeService.updateSegmentType(id, payload);
            return response?.data || response;
          case "productTypes":
            response = await productTypeService.updateProductType(id, payload);
            return response?.data || response;
          case "rewardTypes":
            response = await rewardTypeService.updateRewardType(id, payload);
            return response?.data || response;
          case "senderIds":
          case "languages":
          case "characterSets":
          case "creativeTemplates":
            if (type === "senderIds") response = await senderIdService.updateSenderId(id, payload);
            else if (type === "languages") response = await languageService.updateLanguage(id, payload);
            else if (type === "characterSets") response = await characterSetService.updateCharacterSet(id, payload);
            else if (type === "creativeTemplates") response = await creativeTemplateService.updateCreativeTemplate(id, payload);
            // Return the data if wrapped, otherwise return response directly
            return response?.data || response;
          case "smsRoutes":
            response = await smsRouteService.updateRoute(payload);
            return response;
          case "comboTypes":
            response = await comboTypeService.updateComboType(id, payload);
            return response?.data || response;
          case "notificationTypes":
            response = await notificationTypeService.update(id, payload);
            return response;
          case "vipLists":
            response = await vipListService.update(id, payload);
            return response;
          case "controlGroups":
            response = await controlGroupService.update(id, payload);
            return response;
          default:
            throw new Error(`Unknown configuration type: ${type}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      }
    },
    [type]
  );

  // Delete item
  const deleteItem = useCallback(
    async (id: number): Promise<void> => {
      setError(null);
      try {
        let response: any;
        switch (type) {
          case "campaignTypes":
            response = await campaignTypeService.deleteCampaignType(id);
            if (!response?.success) {
              throw new Error(response?.error || "Failed to delete item");
            }
            break;
          case "offerTypes":
            await offerTypeService.deleteOfferType(id);
            break;
          case "segmentTypes":
            await segmentTypeService.deleteSegmentType(id);
            break;
          case "productTypes":
            await productTypeService.deleteProductType(id);
            break;
          case "rewardTypes":
            await rewardTypeService.deleteRewardType(id);
            break;
          case "senderIds":
          case "languages":
          case "characterSets":
          case "creativeTemplates":
            if (type === "senderIds") await senderIdService.deleteSenderId(id);
            else if (type === "languages") await languageService.deleteLanguage(id);
            else if (type === "characterSets") await characterSetService.deleteCharacterSet(id);
            else if (type === "creativeTemplates") await creativeTemplateService.deleteCreativeTemplate(id);
            break;
          case "smsRoutes":
            await smsRouteService.deleteRoute(id);
            break;
          case "comboTypes":
            await comboTypeService.deleteComboType(id);
            break;
          case "notificationTypes":
            await notificationTypeService.delete(id);
            break;
          case "vipLists":
            await vipListService.delete(id);
            break;
          case "controlGroups":
            await controlGroupService.delete(id);
            break;
          default:
            throw new Error(`Unknown configuration type: ${type}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      }
    },
    [type]
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
