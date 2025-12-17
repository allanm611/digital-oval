/**
 * Configuration Types for CVM System
 *
 * This file defines all TypeScript interfaces for the configuration management system.
 * These types are used for both frontend and backend API contracts.
 *
 * Generated: 2025-12-17
 * Shared between: Frontend & Backend teams
 */

// ============================================================================
// BASE CONFIGURATION TYPES
// ============================================================================

/**
 * Base configuration item interface
 * All configuration items should extend this
 */
export interface BaseConfigurationItem {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Extended configuration item with metadata
 */
export interface ConfigurationItemWithMetadata extends BaseConfigurationItem {
  metadataValue?: string | number;
}

// ============================================================================
// CAMPAIGN CONFIGURATIONS
// ============================================================================

/**
 * Campaign Objective
 * Represents goals for campaigns (e.g., "Increase Sales", "Boost Engagement")
 */
export type CampaignObjective = ConfigurationItemWithMetadata;

/**
 * Campaign Type
 * Classification of campaigns (e.g., "Email Campaign", "SMS Campaign")
 */
export type CampaignType = ConfigurationItemWithMetadata;

/**
 * Campaign Category
 * Additional categorization for campaigns
 */
export type CampaignCategory = BaseConfigurationItem;

// ============================================================================
// OFFER CONFIGURATIONS
// ============================================================================

/**
 * Offer Type
 * Classification of offers (e.g., "Data", "Voice", "SMS", "Combo")
 */
export type OfferType = ConfigurationItemWithMetadata;

/**
 * Offer Category
 * Categorization for offers
 */
export type OfferCategory = BaseConfigurationItem;

/**
 * Tracking Source
 * Sources for tracking offer performance (e.g., "Email", "SMS", "Mobile App")
 */
export type TrackingSource = ConfigurationItemWithMetadata;

/**
 * Reward Type
 * Types of rewards (e.g., "Bonus", "Discount", "Loyalty Points")
 */
export type RewardType = ConfigurationItemWithMetadata;

/**
 * Sender ID
 * SMS/Email sender identifications
 */
export type SenderId = ConfigurationItemWithMetadata;

/**
 * SMS Route
 * SMS gateway routing configurations
 */
export type SmsRoute = ConfigurationItemWithMetadata;

/**
 * Communication Channel
 * Available communication channels (e.g., "SMS", "Email", "Push", "USSD")
 */
export type CommunicationChannel = ConfigurationItemWithMetadata;

/**
 * Creative Template
 * Message templates for campaigns with HTML/text content
 */
export interface CreativeTemplate extends BaseConfigurationItem {
  title?: string;
  text_body?: string;
  html_body?: string;
  variables?: Record<string, string | number | boolean>;
  locale?: string;
  // Inherits: id, name, description, isActive, created_at, updated_at
}

// ============================================================================
// PRODUCT CONFIGURATIONS
// ============================================================================

/**
 * Product Type
 * Classification of products (e.g., "Data", "Voice", "SMS", "Combo", "Utilities")
 */
export type ProductType = ConfigurationItemWithMetadata;

/**
 * Combo Resource
 * Individual resource within a combo (Data, Voice, or SMS)
 */
export interface ComboResource {
  type: "data" | "voice" | "sms";
  value: number;
  unit: string; // e.g., "data_mb", "onnet_minutes", "sms_count"
  sharedValidity: boolean; // Whether this resource uses shared validity hours
  sharedValidityHours: number; // Individual validity hours (if not using shared)
}

/**
 * Combo Type
 * Definition of combo products (e.g., "Data + Voice", "Data + SMS")
 * Includes resources, pricing, and validity configuration
 */
export interface ComboType extends ConfigurationItemWithMetadata {
  // Combo-specific fields
  comboResources?: ComboResource[]; // Array of resources in the combo
  sharedValidity?: boolean; // Whether all resources share the same validity hours
  validityHours?: number; // Shared validity hours for all resources (if sharedValidity is true)
  price?: number; // Price of the combo bundle
}

/**
 * Product Category
 * Categorization for products
 */
export type ProductCategory = BaseConfigurationItem;

// ============================================================================
// SEGMENT CONFIGURATIONS
// ============================================================================

/**
 * Segment Type
 * Types of segments (e.g., "Dynamic", "Static", "List-based")
 */
export type SegmentType = ConfigurationItemWithMetadata;

/**
 * Segment Category
 * Categorization for segments
 */
export type SegmentCategory = BaseConfigurationItem;

// ============================================================================
// ORGANIZATION CONFIGURATIONS
// ============================================================================

/**
 * Department
 * Organization departments
 */
export type Department = BaseConfigurationItem;

/**
 * Team Role
 * Roles for team members with responsibilities
 */
export type TeamRole = BaseConfigurationItem;

/**
 * Line of Business
 * Business lines and services
 */
export type LineOfBusiness = ConfigurationItemWithMetadata;

// ============================================================================
// LOCALIZATION CONFIGURATIONS
// ============================================================================

/**
 * Language
 * Supported languages with locale codes and character set configurations
 */
export interface Language extends BaseConfigurationItem {
  languageCode: string;
  country: string;
  characterSet: string;
  whatsappLanguageCode?: string;
  metadataValue?: string; // locale code (e.g., "en-US", "fr-FR")
  // Inherits: id, name, description, isActive, created_at, updated_at
}

/**
 * Character Set
 * Character encoding configurations for different scripts
 */
export interface CharacterSet extends BaseConfigurationItem {
  messageType: string;
  characterSetType: string;
  characterSetSize?: number;
  standardChars?: string;
  doubleChars?: string;
  tripleChars?: string;
  quadChars?: string;
  // Inherits: id, name, description, isActive, created_at, updated_at
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Generic Configuration List Response
 */
export interface ConfigurationListResponse<T extends BaseConfigurationItem> {
  success: boolean;
  data: T[];
  error?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Generic Configuration Item Response
 */
export interface ConfigurationItemResponse<T extends BaseConfigurationItem> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Generic Create Configuration Request
 */
export interface CreateConfigurationRequest<
  T extends Omit<BaseConfigurationItem, "id" | "created_at" | "updated_at">
> {
  data: T;
}

/**
 * Generic Update Configuration Request
 */
export interface UpdateConfigurationRequest<
  T extends Partial<
    Omit<BaseConfigurationItem, "id" | "created_at" | "updated_at">
  >
> {
  data: T;
}

/**
 * Generic Delete Configuration Response
 */
export interface DeleteConfigurationResponse {
  success: boolean;
  message: string;
  error?: string;
}

// ============================================================================
// SEARCH/FILTER TYPES
// ============================================================================

/**
 * Configuration Search Parameters
 */
export interface ConfigurationSearchParams {
  search?: string;
  limit?: number;
  offset?: number;
  isActive?: boolean;
  sortBy?: "name" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// BULK OPERATION TYPES
// ============================================================================

/**
 * Bulk Create Request
 */
export interface BulkCreateConfigurationsRequest<
  T extends Omit<BaseConfigurationItem, "id" | "created_at" | "updated_at">
> {
  data: T[];
}

/**
 * Bulk Create Response
 */
export interface BulkCreateConfigurationsResponse<
  T extends BaseConfigurationItem
> {
  success: boolean;
  created: number;
  failed: number;
  data?: T[];
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

/**
 * Bulk Update Request
 */
export interface BulkUpdateConfigurationsRequest<
  T extends BaseConfigurationItem
> {
  data: T[];
}

/**
 * Bulk Delete Request
 */
export interface BulkDeleteConfigurationsRequest {
  ids: number[];
}

/**
 * Bulk Delete Response
 */
export interface BulkDeleteConfigurationsResponse {
  success: boolean;
  deletedCount: number;
  message: string;
  error?: string;
}

// ============================================================================
// UNION TYPES FOR ALL CONFIGURATIONS
// ============================================================================

/**
 * All possible configuration types (Campaign)
 */
export type CampaignConfiguration =
  | CampaignObjective
  | CampaignType
  | CampaignCategory;

/**
 * All possible configuration types (Offer)
 */
export type OfferConfiguration =
  | OfferType
  | OfferCategory
  | TrackingSource
  | RewardType
  | SenderId
  | SmsRoute
  | CommunicationChannel
  | CreativeTemplate;

/**
 * All possible configuration types (Product)
 */
export type ProductConfiguration = ProductType | ComboType | ProductCategory;

/**
 * All possible configuration types (Segment)
 */
export type SegmentConfiguration = SegmentType | SegmentCategory;

/**
 * All possible configuration types (Organization)
 */
export type OrganizationConfiguration = Department | TeamRole | LineOfBusiness;

/**
 * All possible configuration types (Localization)
 */
export type LocalizationConfiguration = Language | CharacterSet;

/**
 * All configuration types combined
 */
export type AllConfigurations =
  | CampaignConfiguration
  | OfferConfiguration
  | ProductConfiguration
  | SegmentConfiguration
  | OrganizationConfiguration
  | LocalizationConfiguration;

// ============================================================================
// API ENDPOINT MAPPINGS
// ============================================================================

/**
 * Configuration endpoints mapping for backend
 *
 * BASE_URL: /api/configuration
 *
 * ENDPOINTS:
 * - GET    /campaign-objectives              - List all campaign objectives
 * - GET    /campaign-objectives/:id          - Get single campaign objective
 * - POST   /campaign-objectives              - Create campaign objective
 * - PUT    /campaign-objectives/:id          - Update campaign objective
 * - DELETE /campaign-objectives/:id          - Delete campaign objective
 * - POST   /campaign-objectives/bulk/create  - Bulk create
 * - PUT    /campaign-objectives/bulk/update  - Bulk update
 * - DELETE /campaign-objectives/bulk/delete  - Bulk delete
 *
 * Same pattern applies for:
 * - /campaign-types
 * - /campaign-categories
 * - /offer-types
 * - /offer-categories
 * - /tracking-sources
 * - /reward-types
 * - /sender-ids
 * - /sms-routes
 * - /communication-channels
 * - /creative-templates
 * - /product-types
 * - /combo-types
 * - /product-categories
 * - /segment-types
 * - /segment-categories
 * - /departments
 * - /team-roles
 * - /line-of-business
 * - /languages
 * - /character-sets
 */

/**
 * Configuration type to endpoint mapping
 */
export const CONFIGURATION_ENDPOINTS = {
  // Campaign
  CAMPAIGN_OBJECTIVES: "/api/configuration/campaign-objectives",
  CAMPAIGN_TYPES: "/api/configuration/campaign-types",
  CAMPAIGN_CATEGORIES: "/api/configuration/campaign-categories",

  // Offer
  OFFER_TYPES: "/api/configuration/offer-types",
  OFFER_CATEGORIES: "/api/configuration/offer-categories",
  TRACKING_SOURCES: "/api/configuration/tracking-sources",
  REWARD_TYPES: "/api/configuration/reward-types",
  SENDER_IDS: "/api/configuration/sender-ids",
  SMS_ROUTES: "/api/configuration/sms-routes",
  COMMUNICATION_CHANNELS: "/api/configuration/communication-channels",
  CREATIVE_TEMPLATES: "/api/configuration/creative-templates",

  // Product
  PRODUCT_TYPES: "/api/configuration/product-types",
  COMBO_TYPES: "/api/configuration/combo-types",
  PRODUCT_CATEGORIES: "/api/configuration/product-categories",

  // Segment
  SEGMENT_TYPES: "/api/configuration/segment-types",
  SEGMENT_CATEGORIES: "/api/configuration/segment-categories",

  // Organization
  DEPARTMENTS: "/api/configuration/departments",
  TEAM_ROLES: "/api/configuration/team-roles",
  LINE_OF_BUSINESS: "/api/configuration/line-of-business",

  // Localization
  LANGUAGES: "/api/configuration/languages",
  CHARACTER_SETS: "/api/configuration/character-sets",
} as const;
