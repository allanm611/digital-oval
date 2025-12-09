import React from "react";
import { ConfigurationItem } from "../components/GenericConfigurationPage";
import {
  lineOfBusinessConfig,
  departmentsConfig,
  campaignObjectivesConfig,
  offerTypesConfig,
  campaignTypesConfig,
  segmentTypesConfig,
  productTypesConfig,
  trackingSourcesConfig,
  creativeTemplatesConfig,
  rewardTypesConfig,
  communicationChannelsConfig,
  senderIdsConfig,
  smsRoutesConfig,
  languagesConfig,
} from "../configs/configurationPageConfigs";

// Type pour identifier les différents types de configuration
export type ConfigurationType =
  | "lineOfBusiness"
  | "departments"
  | "campaignObjectives"
  | "offerTypes"
  | "campaignTypes"
  | "segmentTypes"
  | "productTypes"
  | "trackingSources"
  | "creativeTemplates"
  | "rewardTypes"
  | "communicationChannels"
  | "senderIds"
  | "smsRoutes"
  | "languages";

// Service singleton pour gérer les données de configuration
class ConfigurationDataService {
  private data: Map<ConfigurationType, ConfigurationItem[]> = new Map();
  private listeners: Map<
    ConfigurationType,
    Set<(data: ConfigurationItem[]) => void>
  > = new Map();

  constructor() {
    // Initialiser les listeners
    this.listeners.set("lineOfBusiness", new Set());
    this.listeners.set("departments", new Set());
    this.listeners.set("campaignObjectives", new Set());
    this.listeners.set("offerTypes", new Set());
    this.listeners.set("campaignTypes", new Set());
    this.listeners.set("segmentTypes", new Set());
    this.listeners.set("productTypes", new Set());
    this.listeners.set("trackingSources", new Set());
    this.listeners.set("creativeTemplates", new Set());
    this.listeners.set("rewardTypes", new Set());
    this.listeners.set("communicationChannels", new Set());
    this.listeners.set("senderIds", new Set());
    this.listeners.set("smsRoutes", new Set());
    this.listeners.set("languages", new Set());

    // Charger les données depuis localStorage ou utiliser les données par défaut
    this.loadFromStorage();
  }

  // Charger les données depuis localStorage
  private loadFromStorage(): void {
    try {
      const storedData = localStorage.getItem("configurationData");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        this.data.set(
          "lineOfBusiness",
          parsed.lineOfBusiness || [...lineOfBusinessConfig.initialData]
        );
        this.data.set(
          "departments",
          parsed.departments || [...departmentsConfig.initialData]
        );
        this.data.set(
          "campaignObjectives",
          parsed.campaignObjectives || [...campaignObjectivesConfig.initialData]
        );
        this.data.set(
          "offerTypes",
          parsed.offerTypes || [...offerTypesConfig.initialData]
        );
        this.data.set(
          "campaignTypes",
          parsed.campaignTypes || [...campaignTypesConfig.initialData]
        );
        this.data.set(
          "segmentTypes",
          parsed.segmentTypes || [...segmentTypesConfig.initialData]
        );
        this.data.set(
          "productTypes",
          parsed.productTypes || [...productTypesConfig.initialData]
        );
        this.data.set(
          "trackingSources",
          parsed.trackingSources || [...trackingSourcesConfig.initialData]
        );
        this.data.set(
          "creativeTemplates",
          parsed.creativeTemplates || [...creativeTemplatesConfig.initialData]
        );
        this.data.set(
          "rewardTypes",
          parsed.rewardTypes || [...rewardTypesConfig.initialData]
        );
        this.data.set(
          "communicationChannels",
          parsed.communicationChannels || [
            ...communicationChannelsConfig.initialData,
          ]
        );
        this.data.set(
          "senderIds",
          parsed.senderIds || [...senderIdsConfig.initialData]
        );
        this.data.set(
          "smsRoutes",
          parsed.smsRoutes || [...smsRoutesConfig.initialData]
        );
        this.data.set(
          "languages",
          parsed.languages || [...languagesConfig.initialData]
        );
      } else {
        // Première fois, utiliser les données par défaut
        this.data.set("lineOfBusiness", [...lineOfBusinessConfig.initialData]);
        this.data.set("departments", [...departmentsConfig.initialData]);
        this.data.set("campaignObjectives", [
          ...campaignObjectivesConfig.initialData,
        ]);
        this.data.set("offerTypes", [...offerTypesConfig.initialData]);
        this.data.set("campaignTypes", [...campaignTypesConfig.initialData]);
        this.data.set("segmentTypes", [...segmentTypesConfig.initialData]);
        this.data.set("productTypes", [...productTypesConfig.initialData]);
        this.data.set("trackingSources", [
          ...trackingSourcesConfig.initialData,
        ]);
        this.data.set("creativeTemplates", [
          ...creativeTemplatesConfig.initialData,
        ]);
        this.data.set("rewardTypes", [...rewardTypesConfig.initialData]);
        this.data.set("communicationChannels", [
          ...communicationChannelsConfig.initialData,
        ]);
        this.data.set("senderIds", [...senderIdsConfig.initialData]);
        this.data.set("smsRoutes", [...smsRoutesConfig.initialData]);
        this.data.set("languages", [...languagesConfig.initialData]);
        this.saveToStorage();
      }
    } catch (error) {
      console.error("Error loading configuration data from storage:", error);
      // En cas d'erreur, utiliser les données par défaut
      this.data.set("lineOfBusiness", [...lineOfBusinessConfig.initialData]);
      this.data.set("departments", [...departmentsConfig.initialData]);
      this.data.set("campaignObjectives", [
        ...campaignObjectivesConfig.initialData,
      ]);
      this.data.set("offerTypes", [...offerTypesConfig.initialData]);
      this.data.set("campaignTypes", [...campaignTypesConfig.initialData]);
      this.data.set("segmentTypes", [...segmentTypesConfig.initialData]);
      this.data.set("productTypes", [...productTypesConfig.initialData]);
      this.data.set("trackingSources", [...trackingSourcesConfig.initialData]);
      this.data.set("creativeTemplates", [
        ...creativeTemplatesConfig.initialData,
      ]);
      this.data.set("rewardTypes", [...rewardTypesConfig.initialData]);
      this.data.set("communicationChannels", [
        ...communicationChannelsConfig.initialData,
      ]);
      this.data.set("senderIds", [...senderIdsConfig.initialData]);
      this.data.set("smsRoutes", [...smsRoutesConfig.initialData]);
      this.data.set("languages", [...languagesConfig.initialData]);
    }
  }

  // Sauvegarder les données dans localStorage
  private saveToStorage(): void {
    try {
      const dataToSave = {
        lineOfBusiness: this.data.get("lineOfBusiness") || [],
        departments: this.data.get("departments") || [],
        campaignObjectives: this.data.get("campaignObjectives") || [],
        offerTypes: this.data.get("offerTypes") || [],
        campaignTypes: this.data.get("campaignTypes") || [],
        segmentTypes: this.data.get("segmentTypes") || [],
        productTypes: this.data.get("productTypes") || [],
        trackingSources: this.data.get("trackingSources") || [],
        creativeTemplates: this.data.get("creativeTemplates") || [],
        rewardTypes: this.data.get("rewardTypes") || [],
        communicationChannels: this.data.get("communicationChannels") || [],
        senderIds: this.data.get("senderIds") || [],
        smsRoutes: this.data.get("smsRoutes") || [],
        languages: this.data.get("languages") || [],
      };
      localStorage.setItem("configurationData", JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving configuration data to storage:", error);
    }
  }

  // Obtenir les données pour un type de configuration
  getData(type: ConfigurationType): ConfigurationItem[] {
    return this.data.get(type) || [];
  }

  // Mettre à jour les données pour un type de configuration
  setData(type: ConfigurationType, newData: ConfigurationItem[]): void {
    this.data.set(type, [...newData]);
    this.saveToStorage();
    this.notifyListeners(type, newData);
  }

  // Ajouter un nouvel élément
  addItem(
    type: ConfigurationType,
    item: Omit<ConfigurationItem, "id" | "created_at" | "updated_at">
  ): ConfigurationItem {
    const currentData = this.getData(type);
    const newItem: ConfigurationItem = {
      id: Math.max(...currentData.map((i) => i.id), 0) + 1,
      ...item,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedData = [...currentData, newItem];
    this.setData(type, updatedData);
    return newItem;
  }

  // Mettre à jour un élément existant
  updateItem(
    type: ConfigurationType,
    id: number,
    updates: Partial<Omit<ConfigurationItem, "id" | "created_at">>
  ): ConfigurationItem | null {
    const currentData = this.getData(type);
    const itemIndex = currentData.findIndex((item) => item.id === id);

    if (itemIndex === -1) return null;

    const updatedItem = {
      ...currentData[itemIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const updatedData = [...currentData];
    updatedData[itemIndex] = updatedItem;
    this.setData(type, updatedData);
    return updatedItem;
  }

  // Supprimer un élément
  deleteItem(type: ConfigurationType, id: number): boolean {
    const currentData = this.getData(type);
    const filteredData = currentData.filter((item) => item.id !== id);

    if (filteredData.length === currentData.length) return false;

    this.setData(type, filteredData);
    return true;
  }

  // S'abonner aux changements de données
  subscribe(
    type: ConfigurationType,
    listener: (data: ConfigurationItem[]) => void
  ): () => void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.add(listener);
    }

    // Retourner une fonction de désabonnement
    return () => {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.delete(listener);
      }
    };
  }

  // Notifier tous les listeners d'un type de configuration
  private notifyListeners(
    type: ConfigurationType,
    data: ConfigurationItem[]
  ): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach((listener) => listener([...data]));
    }
  }

  // Réinitialiser les données aux valeurs par défaut
  resetToDefaults(type: ConfigurationType): void {
    switch (type) {
      case "lineOfBusiness":
        this.setData(type, [...lineOfBusinessConfig.initialData]);
        break;
      case "departments":
        this.setData(type, [...departmentsConfig.initialData]);
        break;
      case "campaignObjectives":
        this.setData(type, [...campaignObjectivesConfig.initialData]);
        break;
      case "offerTypes":
        this.setData(type, [...offerTypesConfig.initialData]);
        break;
      case "campaignTypes":
        this.setData(type, [...campaignTypesConfig.initialData]);
        break;
      case "segmentTypes":
        this.setData(type, [...segmentTypesConfig.initialData]);
        break;
      case "productTypes":
        this.setData(type, [...productTypesConfig.initialData]);
        break;
      case "trackingSources":
        this.setData(type, [...trackingSourcesConfig.initialData]);
        break;
      case "communicationChannels":
        this.setData(type, [...communicationChannelsConfig.initialData]);
        break;
      case "creativeTemplates":
        this.setData(type, [...creativeTemplatesConfig.initialData]);
        break;
      case "rewardTypes":
        this.setData(type, [...rewardTypesConfig.initialData]);
        break;
      case "senderIds":
        this.setData(type, [...senderIdsConfig.initialData]);
        break;
      case "smsRoutes":
        this.setData(type, [...smsRoutesConfig.initialData]);
        break;
      case "languages":
        this.setData(type, [...languagesConfig.initialData]);
        break;
    }
  }

  // Obtenir un élément par ID
  getItemById(
    type: ConfigurationType,
    id: number
  ): ConfigurationItem | undefined {
    return this.getData(type).find((item) => item.id === id);
  }
}

// Instance singleton
export const configurationDataService = new ConfigurationDataService();

// Hook React pour utiliser les données de configuration
export function useConfigurationData(type: ConfigurationType) {
  const [data, setData] = React.useState<ConfigurationItem[]>(() =>
    configurationDataService.getData(type)
  );

  React.useEffect(() => {
    // S'abonner aux changements
    const unsubscribe = configurationDataService.subscribe(type, setData);

    // Nettoyer l'abonnement
    return unsubscribe;
  }, [type]);

  return {
    data,
    addItem: (
      item: Omit<ConfigurationItem, "id" | "created_at" | "updated_at">
    ) => configurationDataService.addItem(type, item),
    updateItem: (
      id: number,
      updates: Partial<Omit<ConfigurationItem, "id" | "created_at">>
    ) => configurationDataService.updateItem(type, id, updates),
    deleteItem: (id: number) => configurationDataService.deleteItem(type, id),
    getItemById: (id: number) => configurationDataService.getItemById(type, id),
    resetToDefaults: () => configurationDataService.resetToDefaults(type),
  };
}
