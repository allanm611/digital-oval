import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import {
  Target,
  DollarSign,
  Gift,
  Palette,
  BarChart,
  Eye,
  Package,
  Settings,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import FormField from "../../../shared/components/FormField";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";
import {
  useFormDataPersistence,
  clearPersistedFormData,
} from "../../../shared/hooks/useFormDataPersistence";
import { useFormCleanupOnExit } from "../../../shared/hooks/useFormCleanupOnExit";
import MultiStepFormWrapper from "../../../shared/components/MultiStepFormWrapper";
import {
  CreateOfferRequest,
  UpdateOfferRequest,
  Offer,
  OfferTypeEnum,
  OfferProductLink,
} from "../types/offer";
import { Product } from "../../products/types/product";
import { offerService } from "../services/offerService";
import { offerCategoryService } from "../services/offerCategoryService";
import { productService } from "../../products/services/productService";
import { offerCreativeService } from "../services/offerCreativeService";
import { communicationChannelService, CommunicationChannel } from "../../../shared/services/communicationChannelService";
import { routeService } from "../../routes/services/routeService";
import { SMSRoute } from "../../routes/types/smsRoute";
// import { productCategoryService } from "../../products/services/productCategoryService";
import { OfferCategoryType } from "../types/offerCategory";
import ProductSelector from "../../products/components/ProductSelector";
import OfferCreativeStep from "../components/OfferCreativeStep";
import OfferTrackingStep from "../components/OfferTrackingStep";
import OfferRewardStep from "../components/OfferRewardStep";
import type { OfferReward } from "../types/offerReward";
import MultiCategorySelector from "../../../shared/components/MultiCategorySelector";
import TypeSelector from "../../../shared/components/TypeSelector";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, components } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { getSettingsCommunicationChannel } from "../../../shared/utils/settingsHelper";
import { useBackendOfferTypeData } from "../../../shared/hooks/useBackendOfferTypeData";
import { Step } from "../../../shared/components/ui/ProgressStepper";
import CategoryModal from "../../../shared/components/CategoryModal";
import CreateOfferTypeModal from "../components/CreateOfferTypeModal";
import {
  requiresHtmlBody,
  ensureEmailHtmlBody,
} from "../utils/channelUtils";
import {
  CHANNEL_ROUTE_FIELD_META,
  channelKindToRouteType,
  clearedOfferRouteFields,
  collectOfferRouteValidationErrors,
  getEffectiveRouteIdForChannel,
  hydrateOfferRouteFields,
  resolveCommunicationChannelKind,
  TRANSACTIONAL_ROUTE_FIELD_META,
  type OfferChannelRouteKind,
} from "../utils/offerChannelRoute";
import {
  buildOfferCreatePayload,
  buildOfferUpdatePayload,
  parseOfferWizardMetadata,
  withChannelRouteSelected,
} from "../utils/offerWizardPersistence";
import { normalizeOfferRewardsWithTracking } from "../utils/normalizeOfferWizardBindings";
import type { OfferTrackingSource } from "../types/offerTrackingSource";
import {
  offerRequiresTrackingAndRewardMapping,
  offerUsesDefaultReward,
  resolveOfferTypeName,
} from "../utils/offerTypeTrackingPolicy";
import {
  demoteImmediateDefaultRewards,
  ensureImmediateDefaultReward,
  isDefaultImmediateRewardConfigured,
} from "../utils/seedingRewardDefaults";
import { validateOfferRewardTrackingMapping } from "../utils/validateOfferRewardTracking";
import {
  findRewardsWithInvalidPriorities,
  findTrackingSourcesWithInvalidPriorities,
} from "../utils/trackingRulePriority";
import {
  formatRouteSelectLabel,
  routeSelectOptionsForOfferChannel,
} from "../../routes/utils/routeSelect";

// Import the types from offerCreative instead of defining locally
import { OfferCreative, collectPlaceholderVariables } from "../types/offerCreative";

// Local creative for form (uses string ID until saved)
type LocalOfferCreative = Omit<OfferCreative, "id" | "offer_id"> & {
  id: string;
  offer_id?: number;
};

// Default product link quantity when linking products to offers
const DEFAULT_PRODUCT_LINK_QUANTITY = 1;

interface ApiErrorDetail {
  field?: string;
  message?: string;
}

interface ApiErrorResponseData {
  message?: string;
  error?: string;
  details?: ApiErrorDetail[] | Record<string, string>;
}

const hasResponseData = (
  error: unknown,
): error is { response?: { data?: ApiErrorResponseData } } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  );
};

const hasErrorString = (error: unknown): error is { error: string } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as { error?: unknown }).error === "string"
  );
};

const hasMessageString = (error: unknown): error is { message: string } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  );
};

const isRecordOfString = (value: unknown): value is Record<string, string> => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.values(value).every((v) => typeof v === "string");
};

type LinkedProduct = Product & { link_id?: number; is_primary?: boolean };

interface StepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  formData: CreateOfferRequest;
  setFormData: Dispatch<SetStateAction<CreateOfferRequest>>;
  creatives: LocalOfferCreative[];
  setCreatives: (creatives: LocalOfferCreative[]) => void;
  trackingSources: OfferTrackingSource[];
  setTrackingSources: (sources: OfferTrackingSource[]) => void;
  rewards: OfferReward[];
  setRewards: (rewards: OfferReward[]) => void;
  requiresTrackingRewardMapping?: boolean;
  /** Seeding reward (is_seeding_reward): tracking optional; default reward always required */
  usesDefaultReward?: boolean;
  /** Selected offer type display name for seeding-reward CTAs */
  offerTypeName?: string | null;
  isLoading?: boolean;
  validationErrors?: Record<string, string>;
  clearValidationErrors?: () => void;
  offerCategories?: OfferCategoryType[];
  categoriesLoading?: boolean;
  communicationChannels?: CommunicationChannel[];
  channelsLoading?: boolean;
  deliveryRoutes?: SMSRoute[];
  routesLoading?: boolean;
  onSaveDraft?: () => void;
  onCancel?: () => void;
  offerTypes?: OfferTypeEnum[];
  offerTypesLoading?: boolean;
  categoryRefreshTrigger?: number;
  refreshOfferTypes?: () => Promise<void>;
}

// Step definitions for offer creation
const steps: Step[] = [
  {
    id: 1,
    name: "Basic Info",
    description: "Offer details & type",
    icon: Target,
  },
  {
    id: 2,
    name: "Products",
    description: "Product selection",
    icon: Gift,
  },
  {
    id: 3,
    name: "Creative",
    description: "Content & messaging",
    icon: Palette,
  },
  {
    id: 4,
    name: "Tracking",
    description: "Performance monitoring",
    icon: BarChart,
  },
  {
    id: 5,
    name: "Rewards",
    description: "Reward configuration",
    icon: DollarSign,
  },
  {
    id: 6,
    name: "Review",
    description: "Review & create",
    icon: Eye,
  },
];

function BasicInfoStep({
  formData,
  setFormData,
  validationErrors,
  clearValidationErrors,
  offerCategories: _offerCategories,
  categoriesLoading,
  communicationChannels,
  channelsLoading,
  deliveryRoutes,
  routesLoading,
  offerTypes,
  offerTypesLoading,
  categoryRefreshTrigger,
  refreshOfferTypes,
}: Omit<
  StepProps,
  | "currentStep"
  | "totalSteps"
  | "onNext"
  | "onPrev"
  | "onSubmit"
  | "creatives"
  | "setCreatives"
  | "trackingSources"
  | "setTrackingSources"
  | "rewards"
  | "setRewards"
  | "isLoading"
  | "onSaveDraft"
  | "onCancel"
>) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<(string | number)[]>([]);
  const [showCreateCatalogModal, setShowCreateCatalogModal] = useState(false);
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [categoryRefreshTriggerState, setCategoryRefreshTriggerState] = useState(0);
  const userInitiatedUpdateRef = useRef(false);

  // Use form validation hook for auto-scroll and error management
  const { registerFieldRef, hasError, clearValidationError } = useFormValidation();

  // Initialize selectedCategoryIds from formData.category_id (only on mount or when formData changes externally)
  useEffect(() => {
    // Skip if this update was triggered by user selecting categories
    if (userInitiatedUpdateRef.current) {
      userInitiatedUpdateRef.current = false;
      return;
    }

    if (
      formData.category_id &&
      !selectedCategoryIds.includes(formData.category_id)
    ) {
      setSelectedCategoryIds([formData.category_id]);
    } else if (!formData.category_id && selectedCategoryIds.length > 0) {
      setSelectedCategoryIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.category_id]); // Only depend on formData.category_id to avoid circular updates

  // Update formData.category_id when selectedCategoryIds changes (use first one)
  useEffect(() => {
    const firstCategoryId =
      selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : undefined;
    if (formData.category_id !== firstCategoryId) {
      userInitiatedUpdateRef.current = true;
      setFormData((prev) => ({
        ...prev,
        category_id: firstCategoryId, // Send only first to backend
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryIds]); // Only depend on selectedCategoryIds to avoid circular updates

  const selectedChannel = communicationChannels?.find(
    (ch) => String(ch.id) === String(formData.communication_channel_id),
  );
  const channelKind = resolveCommunicationChannelKind(selectedChannel?.name);
  const channelRouteMeta = channelKind
    ? CHANNEL_ROUTE_FIELD_META[channelKind]
    : null;

  const campaignRouteId = channelKind
    ? getEffectiveRouteIdForChannel(formData, channelKind)
    : undefined;
  const catalog = deliveryRoutes || [];
  const routeSelectByKind: Record<
    OfferChannelRouteKind,
    {
      options: { value: string; label: string }[];
      loading: boolean;
    }
  > = {
    sms: {
      options: routeSelectOptionsForOfferChannel(catalog, {
        channelType: "SMS",
        channel: selectedChannel,
        selectedRouteId: campaignRouteId,
      }),
      loading: !!routesLoading,
    },
    email: {
      options: routeSelectOptionsForOfferChannel(catalog, {
        channelType: "EMAIL",
        channel: selectedChannel,
        selectedRouteId: campaignRouteId,
      }),
      loading: !!routesLoading,
    },
    whatsapp: {
      options: routeSelectOptionsForOfferChannel(catalog, {
        channelType: "WHATSAPP",
        channel: selectedChannel,
        selectedRouteId: campaignRouteId,
      }),
      loading: !!routesLoading,
    },
    ussd: {
      options: routeSelectOptionsForOfferChannel(catalog, {
        channelType: "USSD",
        channel: selectedChannel,
        selectedRouteId: campaignRouteId,
      }),
      loading: !!routesLoading,
    },
    push: {
      options: routeSelectOptionsForOfferChannel(catalog, {
        channelType: "PUSH",
        channel: selectedChannel,
        selectedRouteId: campaignRouteId,
      }),
      loading: !!routesLoading,
    },
  };
  const activeRouteSelect = channelKind ? routeSelectByKind[channelKind] : null;
  const transactionalRouteOptions = routeSelectOptionsForOfferChannel(
    catalog,
    {
      channelType: channelKindToRouteType(channelKind),
      channel: selectedChannel,
      selectedRouteId: formData.transactional_route_id,
    },
  );

  return (
    <div className="space-y-6">
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Basic Information
        </h2>
        <p className="text-sm text-gray-600">
          Let's start with the essential details of your offer
        </p>
      </div>
      <div className="space-y-8">
        <FormField error={validationErrors?.name} ref={registerFieldRef('name')}>
          <Input
            label="Offer Name"
            value={formData.name}
            onChange={(value) => {
              setFormData({ ...formData, name: value });
              if (validationErrors?.name && clearValidationErrors) {
                clearValidationErrors();
              }
            }}
            hasError={hasError('name')}
            required
          />
        </FormField>

        <div>
          <Input
            label="Offer Code"
            value={formData.code || ""}
            onChange={(value) => {
              setFormData({ ...formData, code: value });
              if (validationErrors?.code && clearValidationErrors) {
                clearValidationErrors();
              }
            }}
            hasError={!!validationErrors?.code}
            required
          />
          {validationErrors?.code && (
            <p className="mt-1 text-xs text-red-600">{validationErrors.code}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            A unique, descriptive code to identify this offer in your business
            operations
          </p>
        </div>

        <Textarea
          label="Description"
          value={formData.description || ""}
          onChange={(value) =>
            setFormData({ ...formData, description: value })
          }
          rows={3}
        />

        <FormField error={validationErrors?.offer_type} ref={registerFieldRef('offer_type')}>
          <TypeSelector
            label="Offer Type"
            options={(offerTypes || [])
              .filter((type) => type.is_active !== false)
              .map((type) => ({
                value: String(type.id),
                label: type.name,
              }))}
            disabled={offerTypesLoading}
            value={
              formData.offer_type_id
                ? String(formData.offer_type_id)
                : ""
            }
            onChange={(value) => {
              if (!value) return;
              setFormData({
                ...formData,
                offer_type_id: Number(value),
              });
              if (validationErrors?.offer_type && clearValidationErrors) {
                clearValidationErrors();
              }
            }}
            placeholder={offerTypesLoading ? "Loading..." : "Select offer type"}
            allowCreate={true}
            onCreate={() => setShowCreateTypeModal(true)}
          />
        </FormField>

        <FormField error={validationErrors?.category_id} ref={registerFieldRef('category_id')}>
          <MultiCategorySelector
            label="Catalog"
            value={selectedCategoryIds}
            onChange={(ids) => {
              userInitiatedUpdateRef.current = true;
              setSelectedCategoryIds(ids);
            }}
            placeholder="Select catalog(s)"
            entityType="offer"
            disabled={categoriesLoading}
            refreshTrigger={categoryRefreshTriggerState}
            className="w-full"
            allowCreate={true}
            onCreateCategory={() => setShowCreateCatalogModal(true)}
            onCategoryCreated={(categoryId) => {
              userInitiatedUpdateRef.current = true;
              setSelectedCategoryIds([categoryId]);
              setCategoryRefreshTriggerState((prev) => prev + 1);
              setShowCreateCatalogModal(false);
            }}
          />
        </FormField>

        <div className="space-y-4">
          <FormField
            error={validationErrors?.communication_channel}
            ref={registerFieldRef("communication_channel")}
          >
            <HeadlessSelect
              label="Communication Channel"
              options={
                communicationChannels?.map((channel) => ({
                  value: String(channel.id),
                  label: channel.name,
                })) || []
              }
              disabled={channelsLoading}
              value={
                formData.communication_channel_id
                  ? String(formData.communication_channel_id)
                  : ""
              }
              onChange={(value) => {
                if (!value) return;
                const nextChannelId = Number(value);
                if (
                  Number(formData.communication_channel_id) === nextChannelId
                ) {
                  return;
                }
                setFormData((prev) => ({
                  ...prev,
                  communication_channel_id: nextChannelId,
                  ...clearedOfferRouteFields(),
                }));
                if (validationErrors?.communication_channel && clearValidationErrors) {
                  clearValidationErrors();
                }
              }}
              placeholder={
                channelsLoading ? "Loading..." : "Select communication channel"
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              Channel used to deliver this offer to customers.
            </p>
          </FormField>

          {channelKind && channelRouteMeta && activeRouteSelect && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                error={validationErrors?.[channelRouteMeta.errorKey]}
                ref={registerFieldRef(channelRouteMeta.errorKey)}
              >
                <HeadlessSelect
                  label={channelRouteMeta.label}
                  options={activeRouteSelect.options}
                  disabled={activeRouteSelect.loading}
                  searchable
                  value={campaignRouteId ? String(campaignRouteId) : ""}
                  onChange={(value) => {
                    if (!value) return;
                    const routeId = Number(value);
                    const next = withChannelRouteSelected(
                      formData,
                      routeId,
                      channelKind,
                    );
                    if (next.transactional_route_id == null) {
                      next.transactional_route_id = routeId;
                    }
                    setFormData(next);
                  }}
                  placeholder={
                    activeRouteSelect.loading
                      ? "Loading..."
                      : `Select ${channelRouteMeta.label.toLowerCase()}`
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  {channelRouteMeta.description}
                </p>
              </FormField>

              <FormField
                error={validationErrors?.[TRANSACTIONAL_ROUTE_FIELD_META.errorKey]}
                ref={registerFieldRef(TRANSACTIONAL_ROUTE_FIELD_META.errorKey)}
              >
                <HeadlessSelect
                  label={TRANSACTIONAL_ROUTE_FIELD_META.label}
                  options={transactionalRouteOptions}
                  disabled={activeRouteSelect.loading}
                  searchable
                  value={
                    formData.transactional_route_id
                      ? String(formData.transactional_route_id)
                      : ""
                  }
                  onChange={(value) => {
                    if (!value) return;
                    setFormData({
                      ...formData,
                      transactional_route_id: Number(value),
                    });
                  }}
                  placeholder={
                    activeRouteSelect.loading
                      ? "Loading..."
                      : "Select transactional route"
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  {TRANSACTIONAL_ROUTE_FIELD_META.description}
                </p>
              </FormField>
            </div>
          )}
        </div>

        <div>
          <Input
            type="number"
            label="Max Usage Per Customer"
            min="0"
            value={(formData.max_usage_per_customer || "").toString()}
            onChange={(value) => {
              setFormData({
                ...formData,
                max_usage_per_customer: value
                  ? Number(value)
                  : 0,
              });
              if (
                validationErrors?.max_usage_per_customer &&
                clearValidationErrors
              ) {
                clearValidationErrors();
              }
            }}
            hasError={!!validationErrors?.max_usage_per_customer}
          />
          {validationErrors?.max_usage_per_customer && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.max_usage_per_customer}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Maximum times a customer can use this offer (minimum: 0)
          </p>
        </div>
      </div>

      {/* Create Catalog Modal */}
      <CategoryModal
        isOpen={showCreateCatalogModal}
        onClose={() => setShowCreateCatalogModal(false)}
        entityType="offer"
        onCategoryCreated={(categoryId) => {
          userInitiatedUpdateRef.current = true;
          setSelectedCategoryIds([categoryId]);
          setCategoryRefreshTriggerState((prev) => prev + 1);
          setShowCreateCatalogModal(false);
        }}
      />

      {/* Create Offer Type Modal */}
      <CreateOfferTypeModal
        isOpen={showCreateTypeModal}
        onClose={() => setShowCreateTypeModal(false)}
        onTypeCreated={async (typeId, typeData) => {
          setFormData({
            ...formData,
            offer_type_id: typeId,
            offer_type: typeData?.name || formData.offer_type,
          });
          await refreshOfferTypes?.();
          setShowCreateTypeModal(false);
        }}
      />
    </div>
  );
}

// Step 2: Offer Products
function ProductStepWrapper({
  // formData,
  formData,
  setFormData,
  selectedProducts,
  onProductsChange,
  creatives,
  trackingSources,
  rewards,
}: Omit<
  StepProps,
  | "currentStep"
  | "totalSteps"
  | "onNext"
  | "onPrev"
  | "onSubmit"
  | "setCreatives"
  | "setTrackingSources"
  | "setRewards"
  | "isLoading"
  | "validationErrors"
  | "clearValidationErrors"
  | "offerCategories"
  | "categoriesLoading"
  | "onSaveDraft"
  | "onCancel"
> & {
  selectedProducts: LinkedProduct[];
  onProductsChange: (products: LinkedProduct[]) => void;
  creatives?: any[];
  trackingSources?: any[];
  rewards?: any[];
}) {
  // Track previous products to prevent unnecessary updates
  const prevProductsRef = useRef<LinkedProduct[]>(selectedProducts);

  const handleProductsChange = useCallback(
    (products: LinkedProduct[]) => {
      // Check if products actually changed (by reference and length)
      const productsChanged =
        prevProductsRef.current.length !== products.length ||
        prevProductsRef.current.some((p, i) => p.id !== products[i]?.id);

      if (!productsChanged) {
        // Products haven't changed, don't update anything
        return;
      }

      prevProductsRef.current = products;

      // Update selected products
      onProductsChange(products);

      // Update primary product ID only if it changed
      const firstProductId = products[0]?.id;
      const newPrimaryId = firstProductId ? Number(firstProductId) : undefined;

      setFormData((prev) => {
        // Only update if primary_product_id actually changed
        if (prev.primary_product_id === newPrimaryId) {
          return prev; // Return same object reference to prevent unnecessary re-render
        }
        return {
          ...prev,
          primary_product_id: newPrimaryId,
        };
      });
    },
    [onProductsChange, setFormData],
  );

  // Update ref when selectedProducts prop changes
  useEffect(() => {
    prevProductsRef.current = selectedProducts;
  }, [selectedProducts]);

  return (
    <div className="space-y-6">
      <div className="mt-8 mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Offer Products
          </h2>
          <p className="text-sm text-gray-600">
            Select the products that will be included in this offer
          </p>
        </div>
      </div>
      <div className="space-y-6">
        <ProductSelector
          selectedProducts={selectedProducts}
          onProductsChange={(products) =>
            handleProductsChange(products as LinkedProduct[])
          }
          multiSelect={true}
          showAddButtonInline={true}
        />
      </div>
    </div>
  );
}

// Step 3: Offer Creative
function OfferCreativeStepWrapper({
  creatives,
  setCreatives,
  validationErrors,
  communicationChannelId,
  communicationChannels,
}: Omit<
  StepProps,
  | "currentStep"
  | "totalSteps"
  | "onNext"
  | "onPrev"
  | "onSubmit"
  | "formData"
  | "setFormData"
  | "trackingSources"
  | "setTrackingSources"
  | "rewards"
  | "setRewards"
  | "isLoading"
  | "clearValidationErrors"
  | "offerCategories"
  | "categoriesLoading"
  | "onSaveDraft"
  | "onCancel"
> & { communicationChannelId?: number; communicationChannels?: CommunicationChannel[] }) {
  return (
    <div className="space-y-6">
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Offer Creative
        </h2>
        <p className="text-sm text-gray-600">
          Design the creative content for your offer
        </p>
      </div>
      <OfferCreativeStep
        creatives={creatives}
        onCreativesChange={setCreatives}
        validationError={validationErrors?.creatives}
        communicationChannelId={communicationChannelId}
        communicationChannels={communicationChannels?.map((ch) => ({ id: ch.id, name: ch.name }))}
      />
    </div>
  );
}

// Step 4: Offer Tracking
function OfferTrackingStepWrapper({
  trackingSources,
  setTrackingSources,
  requiresTrackingRewardMapping = false,
  usesDefaultReward = false,
  validationErrors,
  initialOpenSourceModal = false,
  onInitialOpenSourceModalConsumed,
}: Omit<
  StepProps,
  | "currentStep"
  | "totalSteps"
  | "onNext"
  | "onPrev"
  | "onSubmit"
  | "formData"
  | "setFormData"
  | "creatives"
  | "setCreatives"
  | "rewards"
  | "setRewards"
  | "isLoading"
  | "clearValidationErrors"
  | "offerCategories"
  | "categoriesLoading"
  | "onSaveDraft"
  | "onCancel"
> &
  Pick<StepProps, "validationErrors"> & {
    initialOpenSourceModal?: boolean;
    onInitialOpenSourceModalConsumed?: () => void;
  }) {
  return (
    <div className="space-y-6">
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Offer Tracking
        </h2>
        <p className="text-sm text-gray-600">
          Configure tracking and analytics for your offer
        </p>
        {requiresTrackingRewardMapping ? (
          <p className="text-sm text-amber-800 mt-2">
            
          </p>
        ) : usesDefaultReward ? (
          <p className="text-sm text-amber-800 mt-2">
            
          </p>
        ) : null}
        {validationErrors?.tracking ? (
          <p className="text-sm text-red-600 mt-2">{validationErrors.tracking}</p>
        ) : null}
      </div>
      <OfferTrackingStep
        trackingSources={trackingSources}
        onTrackingSourcesChange={setTrackingSources}
        initialOpenSourceModal={initialOpenSourceModal}
        onInitialOpenSourceModalConsumed={onInitialOpenSourceModalConsumed}
      />
    </div>
  );
}

// Step 5: Offer Reward
function OfferRewardStepWrapper({
  rewards,
  setRewards,
  trackingSources,
  requiresTrackingRewardMapping = false,
  usesDefaultReward = false,
  offerTypeName = null,
  validationErrors,
}: Omit<
  StepProps,
  | "currentStep"
  | "totalSteps"
  | "onNext"
  | "onPrev"
  | "onSubmit"
  | "formData"
  | "setFormData"
  | "creatives"
  | "setCreatives"
  | "trackingSources"
  | "setTrackingSources"
  | "isLoading"
  | "clearValidationErrors"
  | "offerCategories"
  | "categoriesLoading"
  | "onSaveDraft"
  | "onCancel"
> &
  Pick<StepProps, "validationErrors">) {
  const typeLabel = offerTypeName?.trim() || "Seeding-reward";

  return (
    <div className="space-y-6">
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Offer Rewards
        </h2>
        <p className="text-sm text-gray-600">
          Configure rewards and incentives for your offer
        </p>
        {usesDefaultReward ? (
          <p className="text-sm text-amber-800 mt-2">
            
          </p>
        ) : requiresTrackingRewardMapping ? (
          <p className="text-sm text-amber-800 mt-2">
            
          </p>
        ) : null}
        {validationErrors?.rewards ? (
          <p className="text-sm text-red-600 mt-2">{validationErrors.rewards}</p>
        ) : null}
      </div>
      <OfferRewardStep
        rewards={rewards}
        onRewardsChange={setRewards}
        trackingSources={trackingSources}
        requiresRewardTrackingMapping={requiresTrackingRewardMapping}
        usesDefaultReward={usesDefaultReward}
        offerTypeName={offerTypeName}
      />
    </div>
  );
}

// Legacy Step 2: Eligibility Rules (kept for reference)

// Step 6: Review
function ReviewStep({
  formData,
  creatives,
  setCreatives,
  trackingSources,
  rewards,
  offerCategories,
  validationErrors,
  selectedProducts = [],
  offerTypes,
  communicationChannels,
  deliveryRoutes,
  requiresTrackingRewardMapping = false,
  usesDefaultReward = false,
  offerTypeName = null,
}: Omit<
  StepProps,
  | "currentStep"
  | "totalSteps"
  | "onNext"
  | "onPrev"
  | "onSubmit"
  | "setFormData"
  | "setTrackingSources"
  | "setRewards"
  | "isLoading"
  | "clearValidationErrors"
  | "categoriesLoading"
  | "onSaveDraft"
  | "onCancel"
  | "offerTypesLoading"
> & {
  selectedProducts?: LinkedProduct[];
}) {
  const [editingCreativeId, setEditingCreativeId] = useState<string | null>(
    null,
  );
  const [editingCreative, setEditingCreative] =
    useState<LocalOfferCreative | null>(null);

  // Helper to replace variables in text
  const replaceVariables = (
    text: string,
    variables: Record<string, string | number | boolean> = {},
  ): string => {
    if (!text) return "";
    let result = text;
    Object.keys(variables).forEach((key) => {
      const value = String(variables[key]);
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value);
    });
    return result;
  };

  // Helper to parse variables safely - tries to extract partial values even from invalid JSON
  const parseVariables = (
    vars: string | Record<string, string | number | boolean> | undefined,
  ): Record<string, string | number | boolean> => {
    try {
      if (typeof vars === "string") {
        const trimmed = vars.trim();
        if (!trimmed) return {};
        return JSON.parse(trimmed);
      } else if (vars) {
        return vars;
      }
    } catch {
      // If parsing fails, try to extract partial values from string
      if (typeof vars === "string" && vars.trim()) {
        const cleaned = vars.trim();
        const pairs: Record<string, string> = {};

        // Try to extract key-value pairs using regex
        // Matches: "key": "value" or "key": value
        const patterns = [
          /"([^"]+)":\s*"([^"]*)"/g, // String values
          /"([^"]+)":\s*(\d+\.?\d*)/g, // Number values
          /"([^"]+)":\s*(true|false)/g, // Boolean values
        ];

        patterns.forEach((pattern) => {
          let match;
          while ((match = pattern.exec(cleaned)) !== null) {
            const key = match[1];
            let value: string | number | boolean = match[2];

            // Convert to appropriate type
            if (value === "true") value = true;
            else if (value === "false") value = false;
            else if (!isNaN(Number(value)) && value !== "") {
              value = Number(value);
            }

            pairs[key] = value;
          }
        });

        if (Object.keys(pairs).length > 0) {
          return pairs;
        }
      }
    }
    return {};
  };

  const handleEditCreative = (creative: LocalOfferCreative) => {
    setEditingCreativeId(creative.id);
    setEditingCreative({ ...creative });
  };

  const handleSaveCreative = () => {
    if (editingCreative && editingCreativeId) {
      setCreatives(
        creatives.map((c) =>
          c.id === editingCreativeId ? editingCreative : c,
        ),
      );
      setEditingCreativeId(null);
      setEditingCreative(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingCreativeId(null);
    setEditingCreative(null);
  };
  const reviewChannel = communicationChannels?.find(
    (ch) => String(ch.id) === String(formData.communication_channel_id),
  );
  const reviewChannelKind = resolveCommunicationChannelKind(reviewChannel?.name);
  const reviewCampaignRouteId = reviewChannelKind
    ? getEffectiveRouteIdForChannel(formData, reviewChannelKind)
    : undefined;
  const allReviewRoutes = deliveryRoutes || [];
  const resolveReviewRouteName = (routeId?: number) => {
    if (routeId == null) return undefined;
    const match = allReviewRoutes.find(
      (route) => Number(route.id) === Number(routeId),
    );
    return match ? formatRouteSelectLabel(match) : undefined;
  };
  const reviewCampaignRouteName = resolveReviewRouteName(reviewCampaignRouteId);
  const reviewTransactionalRouteName = resolveReviewRouteName(
    formData.transactional_route_id,
  );

  const hasValidationErrors =
    validationErrors && Object.keys(validationErrors).length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Review & Create
        </h2>
        <p className="text-sm text-gray-600">
          Review your offer details before creating
        </p>
      </div>

      {/* Validation Error Display */}
      {hasValidationErrors && (
        <div className={`bg-red-50 border border-red-200 ${tw.rounded} p-4`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Please fix the following errors before submitting:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                {validationErrors.name && <li>{validationErrors.name}</li>}
                {validationErrors.code && <li>{validationErrors.code}</li>}
                {validationErrors.offer_type && (
                  <li>{validationErrors.offer_type}</li>
                )}
                {validationErrors.category_id && (
                  <li>{validationErrors.category_id}</li>
                )}
                {validationErrors.communication_channel && (
                  <li>{validationErrors.communication_channel}</li>
                )}
                {validationErrors.sms_route && (
                  <li>{validationErrors.sms_route}</li>
                )}
                {validationErrors.email_route && (
                  <li>{validationErrors.email_route}</li>
                )}
                {validationErrors.whatsapp_route && (
                  <li>{validationErrors.whatsapp_route}</li>
                )}
                {validationErrors.ussd_route && (
                  <li>{validationErrors.ussd_route}</li>
                )}
                {validationErrors.push_route && (
                  <li>{validationErrors.push_route}</li>
                )}
                {validationErrors.transactional_route && (
                  <li>{validationErrors.transactional_route}</li>
                )}
                {validationErrors.creatives && (
                  <li>{validationErrors.creatives}</li>
                )}
                {validationErrors.tracking && (
                  <li>{validationErrors.tracking}</li>
                )}
                {validationErrors.rewards && (
                  <li>{validationErrors.rewards}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Palette,
            label: "Creatives",
            value: creatives.length.toString(),
          },
          {
            icon: Package,
            label: "Products",
            value: formData.primary_product_id ? "1" : "0",
          },
          {
            icon: BarChart,
            label: "Tracking Sources",
            value: trackingSources.length.toString(),
          },
          {
            icon: DollarSign,
            label: "Rewards",
            value: rewards.length.toString(),
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className={`${tw.rounded} bg-white shadow-sm border border-gray-100 p-4 flex items-center gap-3`}
          >
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <Icon
                className="w-5 h-5"
                style={{ color: color.primary.accent }}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                {label}
              </p>
              <p className="text-sm font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          {/* Offer Details */}
          <div className={components.card.surface}>
            <h3 className={`text-sm font-bold ${tw.textPrimary} mb-4`}>
              Offer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Name
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formData.name || "Untitled offer"}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Offer Type
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formData.offer_type_id
                    ? offerTypes?.find(
                        (type) => type.id === formData.offer_type_id,
                      )?.name || `Type ${formData.offer_type_id}`
                    : "Not selected"}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Catalog
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formData.category_id
                    ? offerCategories?.find(
                        (cat: OfferCategoryType) =>
                          cat.id === formData.category_id ||
                          String(cat.id) === String(formData.category_id),
                      )?.name || `Catalog ${formData.category_id}`
                    : "Not selected"}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Max Usage Per Customer
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formData.max_usage_per_customer || "Unlimited"}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Communication Channel
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {communicationChannels?.find(
                    (ch) =>
                      String(ch.id) === String(formData.communication_channel_id),
                  )?.name || "Not selected"}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Campaign Route
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {reviewCampaignRouteName || "Not selected"}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Transactional Route
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {reviewTransactionalRouteName || "Not selected"}
                </div>
              </div>
              {formData.description && (
                <div className="md:col-span-2">
                  <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                    Description
                  </div>
                  <div className="text-sm font-medium text-gray-600 whitespace-pre-wrap">
                    {formData.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Offer Creatives */}
          <div className={components.card.surface}>
            <h3 className={`text-sm font-bold ${tw.textPrimary} mb-3`}>
              Offer Creatives
            </h3>
            {creatives.length === 0 ? (
              <div className="text-sm text-gray-500">
                No creatives have been configured.
              </div>
            ) : (
              <div className="space-y-6">
                {creatives.map((creative) => {
                  const isEditing = editingCreativeId === creative.id;
                  const displayCreative = isEditing
                    ? editingCreative!
                    : creative;

                  // Parse variables - this will recompute on every render
                  const variables = parseVariables(displayCreative.variables);

                  // Compute rendered values - these update in real-time
                  const renderedTitle = replaceVariables(
                    displayCreative.title || "",
                    variables,
                  );
                  const renderedTextBody = replaceVariables(
                    displayCreative.text_body || "",
                    variables,
                  );
                  const renderedHtmlBody = replaceVariables(
                    displayCreative.html_body || "",
                    variables,
                  );

                  return (
                    <div
                      key={creative.id}
                      className={`flex items-start justify-between p-4 ${tw.rounded} border border-gray-100 bg-white mb-3`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Palette
                          className="w-5 h-5"
                          style={{ color: color.primary.accent }}
                        />
                        <div className="flex-1">
                          <div
                            className={`text-sm font-semibold ${tw.textPrimary}`}
                          >
                            {displayCreative.channel} ({displayCreative.locale})
                          </div>
                          {renderedTitle && (
                            <div className={`text-sm ${tw.textSecondary} mt-1`}>
                              {renderedTitle}
                            </div>
                          )}
                        </div>
                      </div>
                      {!isEditing ? null : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveCreative}
                            className={`text-sm px-3 py-1 bg-blue-600 text-white ${tw.rounded} hover:bg-blue-700 transition-colors`}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className={`text-sm px-3 py-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 ${tw.rounded} transition-colors`}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Products */}
          <div className={components.card.surface}>
            <h3 className={`text-sm font-bold ${tw.textPrimary} mb-3`}>
              Products
            </h3>
            {formData.primary_product_id && selectedProducts.length > 0 ? (
              <div
                className={`flex items-center justify-between p-3 ${tw.rounded} border border-gray-100 bg-white`}
              >
                <div className="flex items-center gap-3">
                  <Package
                    className="w-5 h-5"
                    style={{ color: color.primary.accent }}
                  />
                  <div className="text-sm font-medium text-gray-900">
                    {selectedProducts.find((p) => Number(p.id) === formData.primary_product_id)?.name ||
                     selectedProducts[0]?.name ||
                     `Product ${formData.primary_product_id}`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No products have been selected.
              </div>
            )}
          </div>

          {/* Tracking Configuration */}
          <div className={components.card.surface}>
            <h3 className={`text-sm font-bold ${tw.textPrimary} mb-3`}>
              Tracking Configuration
            </h3>
            {trackingSources.length === 0 ? (
              <div className="text-sm text-gray-500">
                No tracking sources have been configured.
              </div>
            ) : (
              <div className="space-y-3">
                {trackingSources.map((source) => (
                  <div
                    key={source.id}
                    className={`flex items-center justify-between p-3 ${tw.rounded} border border-gray-100 bg-white`}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart
                        className="w-5 h-5"
                        style={{ color: color.primary.accent }}
                      />
                      <div>
                        <div
                          className={`text-sm font-semibold ${tw.textPrimary}`}
                        >
                          {source.name}
                        </div>
                        <div className={`text-sm ${tw.textSecondary}`}>
                          {source.type} • {source.rules.length} rules
                          {source.rules.length > 0
                            ? ` • params: ${Array.from(
                                new Set(
                                  source.rules
                                    .map((r: { parameter?: string }) => r.parameter)
                                    .filter(Boolean),
                                ),
                              )
                                .slice(0, 4)
                                .join(", ")}${
                                new Set(
                                  source.rules.map(
                                    (r: { parameter?: string }) => r.parameter,
                                  ),
                                ).size > 4
                                  ? "…"
                                  : ""
                              }`
                            : ""}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-sm font-medium"
                        style={{
                          color: source.enabled
                            ? color.primary.accent
                            : "#9CA3AF",
                        }}
                      >
                        {source.enabled ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rewards */}
          <div className={components.card.surface}>
            <h3 className={`text-sm font-bold ${tw.textPrimary} mb-3`}>
              Offer Rewards
            </h3>
            {rewards.length === 0 ? (
              <div className="text-sm text-gray-500">
                No rewards have been configured.
              </div>
            ) : (
              <div className="space-y-3">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={`flex items-center justify-between p-3 ${tw.rounded} border border-gray-100 bg-white`}
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign
                        className="w-5 h-5"
                        style={{ color: color.primary.accent }}
                      />
                      <div>
                        <div
                          className={`text-sm font-semibold ${tw.textPrimary}`}
                        >
                          {reward.is_default
                            ? reward.name || "Default Reward"
                            : reward.tracking_source_id
                              ? trackingSources.find(
                                  (s) => s.id === reward.tracking_source_id,
                                )?.name || reward.name
                              : reward.name || "Unassigned reward"}
                          {reward.is_default ? " (default)" : ""}
                        </div>
                        <div className={`text-sm ${tw.textSecondary}`}>
                          {reward.is_default
                            ? "No tracking required"
                            : `Tracking source${
                                reward.tracking_source_id
                                  ? " linked"
                                  : " not set"
                              }`}{" "}
                          • {reward.rules.length} configuration
                          {reward.rules.length === 1 ? "" : "s"}
                          {!reward.is_default &&
                          reward.rules.filter(
                            (r) => r.enabled !== false && r.tracking_rule_id,
                          ).length > 0
                            ? ` • ${
                                reward.rules.filter(
                                  (r) =>
                                    r.enabled !== false && r.tracking_rule_id,
                                ).length
                              } rule-bound`
                            : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div
            className={`${tw.rounded} border border-gray-200 bg-white shadow-sm p-5 space-y-3`}
          >
            <h3 className="text-sm font-semibold text-gray-900">
              Offer Settings
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Draft
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Reusable</span>
              <span className="font-medium text-gray-900">
                {formData.is_reusable ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Multi-language</span>
              <span className="font-medium text-gray-900">
                {formData.supports_multi_language ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Max Usage</span>
              <span className="font-medium text-gray-900">
                {formData.max_usage_per_customer || "Unlimited"}
              </span>
            </div>
          </div>

          <div
            className={`${tw.rounded} border border-gray-200 bg-white shadow-sm p-5 space-y-3`}
          >
            <h3 className="text-sm font-semibold text-gray-900">
              Readiness Checklist
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                {
                  label: "Basic information completed",
                  complete: Boolean(
                    formData.name &&
                    formData.offer_type_id &&
                    formData.category_id,
                  ),
                },
                {
                  label: "Creatives configured",
                  complete: creatives.length > 0,
                },
                {
                  label: "Products selected",
                  complete: Boolean(formData.primary_product_id),
                },
                {
                  label: usesDefaultReward
                    ? `Tracking (optional for ${offerTypeName?.trim() || "seeding reward"})`
                    : "Tracking configured",
                  complete: usesDefaultReward
                    ? true
                    : trackingSources.length > 0,
                },
                ...(usesDefaultReward
                  ? [
                      {
                        label: "Default reward configured",
                        complete: isDefaultImmediateRewardConfigured(rewards),
                      },
                    ]
                  : requiresTrackingRewardMapping
                    ? [
                        {
                          label: "Rewards mapped to tracking sources",
                          complete: !validateOfferRewardTrackingMapping(
                            rewards,
                            trackingSources,
                            true,
                          ).rewards,
                        },
                      ]
                    : []),
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      item.complete
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.complete ? "✓" : "•"}
                  </span>
                  <span
                    className={
                      item.complete ? "text-gray-900" : "text-gray-500"
                    }
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

interface CreateOfferPageProps {
  onSuccess?: (offerId: number) => void;
  offerId?: number; // For modal-based editing
}

export default function CreateOfferPage({
  onSuccess,
  offerId: propOfferId,
}: CreateOfferPageProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: urlId } = useParams<{ id: string }>();
  const id = propOfferId ? String(propOfferId) : urlId; // Use prop ID if provided, otherwise use URL param
  const [searchParams] = useSearchParams();
  const { success: showToast, error: showError } = useToast();

  // Get return URL if coming from campaign flow
  const returnToCampaign = searchParams.get("returnToCampaign") === "true";
  const returnUrlParam = searchParams.get("returnUrl");
  const returnUrl = returnUrlParam ? decodeURIComponent(returnUrlParam) : null;
  const duplicateIdParam = searchParams.get("duplicateId");

  // Extract the path to return to (with step parameter preserved)
  const getBackButtonFallback = (): string => {
    if (returnUrl) {
      try {
        const url = new URL(returnUrl);
        return url.pathname + url.search;
      } catch (e) {
        return "/dashboard/offers";
      }
    }
    return "/dashboard/offers";
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Re-open Select Tracking Sources after Create Tracking Source round-trip. */
  const [openSelectTrackingSources, setOpenSelectTrackingSources] =
    useState(false);
  const [isEditMode, setIsEditMode] = useState(
    () => Boolean(id || duplicateIdParam),
  );
  const [isDuplicateMode, setIsDuplicateMode] = useState(
    () => Boolean(duplicateIdParam),
  );
  const [isLoadingOffer, setIsLoadingOffer] = useState(false);
  const totalSteps = 6;

  const [formData, setFormData] = useState<CreateOfferRequest>({
    name: "",
    code: "",
    description: "",
    offer_type_id: undefined,
    category_id: undefined,
    communication_channel_id: undefined,
    sms_route_id: undefined,
    email_route_id: undefined,
    whatsapp_route_id: undefined,
    ussd_route_id: undefined,
    push_notification_route_id: undefined,
    transactional_route_id: undefined,
    max_usage_per_customer: 1,
    eligibility_rules: {},
  });

  const [creatives, setCreatives] = useState<LocalOfferCreative[]>([]);
  const [trackingSources, setTrackingSources] = useState<OfferTrackingSource[]>([]);
  const [rewards, setRewards] = useState<OfferReward[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<LinkedProduct[]>([]);
  const [initialProducts, setInitialProducts] = useState<LinkedProduct[]>([]); // Track initial products for edit mode
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1])); // Track visited steps
  const [createdOfferId, setCreatedOfferId] = useState<number | null>(null);
  const [categoryRefreshTrigger, setCategoryRefreshTrigger] = useState(0);

  // Resume Offer Tracking after creating an engine tracking source.
  useEffect(() => {
    const resume = (
      location.state as {
        resumeOfferWizard?: {
          step?: number;
          openSelectTrackingSources?: boolean;
        };
      } | null
    )?.resumeOfferWizard;
    if (!resume) return;

    const step =
      typeof resume.step === "number" && resume.step >= 1 && resume.step <= 6
        ? resume.step
        : 4;
    setCurrentStep(step);
    setVisitedSteps((prev) => {
      const next = new Set(prev);
      for (let i = 1; i <= step; i += 1) next.add(i);
      return next;
    });
    if (resume.openSelectTrackingSources) {
      setOpenSelectTrackingSources(true);
    }
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: {},
    });
  }, [location.pathname, location.search, location.state, navigate]);

  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: offerTypes, loading: offerTypesLoading, refresh: refreshOfferTypes } = useBackendOfferTypeData();
  const requiresTrackingRewardMapping = useMemo(
    () =>
      offerRequiresTrackingAndRewardMapping(
        formData.offer_type_id,
        offerTypes,
        formData.offer_type,
      ),
    [formData.offer_type_id, formData.offer_type, offerTypes],
  );
  const usesDefaultReward = useMemo(
    () =>
      offerUsesDefaultReward(
        formData.offer_type_id,
        offerTypes,
        formData.offer_type,
      ),
    [formData.offer_type_id, formData.offer_type, offerTypes],
  );
  const offerTypeName = useMemo(
    () =>
      resolveOfferTypeName(
        formData.offer_type_id,
        offerTypes,
        formData.offer_type,
      ) || null,
    [formData.offer_type_id, formData.offer_type, offerTypes],
  );
  const hasRestoredDataRef = useRef(false);

  // Seeding-reward ↔ other offer types: keep default reward lifecycle consistent.
  useEffect(() => {
    if (usesDefaultReward) {
      setRewards((prev) => {
        const { rewards: next, changed } = ensureImmediateDefaultReward(prev);
        return changed ? next : prev;
      });
      return;
    }
    setRewards((prev) => {
      const { rewards: next, changed } = demoteImmediateDefaultRewards(prev);
      return changed ? next : prev;
    });
  }, [usesDefaultReward]);

  // Persist form data to localStorage
  useFormDataPersistence("offer_form_data", formData, setFormData, isEditMode);
  useFormDataPersistence(
    "offer_creatives",
    creatives,
    setCreatives,
    isEditMode,
  );
  useFormDataPersistence(
    "offer_tracking_sources",
    trackingSources,
    setTrackingSources,
    isEditMode,
  );
  useFormDataPersistence("offer_rewards", rewards, setRewards, isEditMode);
  useFormDataPersistence(
    "offer_products",
    selectedProducts,
    setSelectedProducts,
    isEditMode,
  );

  // Keep create/edit reward bindings aligned when tracking rules change.
  useEffect(() => {
    setRewards((prev) => {
      if (prev.length === 0) return prev;
      const { rewards: normalized, changed } = normalizeOfferRewardsWithTracking(
        prev,
        trackingSources,
      );
      return changed ? normalized : prev;
    });
  }, [trackingSources]);

  // Clear persisted form data when user exits the creation flow
  useFormCleanupOnExit("offer_form_data");
  useFormCleanupOnExit("offer_creatives");
  useFormCleanupOnExit("offer_tracking_sources");
  useFormCleanupOnExit("offer_rewards");
  useFormCleanupOnExit("offer_products");

  // Restore offer data when returning from product creation
  useEffect(() => {
    // Prevent multiple restorations
    if (hasRestoredDataRef.current) {
      return;
    }

    const returnFromProductCreate = searchParams.get("returnFromProductCreate");
    if (returnFromProductCreate === "true" && !id) {
      hasRestoredDataRef.current = true;

      const savedData = sessionStorage.getItem("offerFormData");
      if (savedData) {
        try {
          const offerData = JSON.parse(savedData);

          // Restore all data
          if (offerData.formData) {
            setFormData(offerData.formData);
            localStorage.setItem(
              "offer_form_data",
              JSON.stringify(offerData.formData),
            );
          }
          if (
            offerData.selectedProducts &&
            Array.isArray(offerData.selectedProducts)
          ) {
            setSelectedProducts(offerData.selectedProducts);
            localStorage.setItem(
              "offer_products",
              JSON.stringify(offerData.selectedProducts),
            );
          }
          if (offerData.creatives && Array.isArray(offerData.creatives)) {
            setCreatives(offerData.creatives);
            localStorage.setItem(
              "offer_creatives",
              JSON.stringify(offerData.creatives),
            );
          }
          const restoredTrackingSources = Array.isArray(
            offerData.trackingSources,
          )
            ? (offerData.trackingSources as OfferTrackingSource[])
            : [];
          if (restoredTrackingSources.length > 0) {
            setTrackingSources(restoredTrackingSources);
            localStorage.setItem(
              "offer_tracking_sources",
              JSON.stringify(restoredTrackingSources),
            );
          }
          if (offerData.rewards && Array.isArray(offerData.rewards)) {
            const { rewards: normalizedRewards } =
              normalizeOfferRewardsWithTracking(
                offerData.rewards,
                restoredTrackingSources,
              );
            setRewards(normalizedRewards);
            localStorage.setItem(
              "offer_rewards",
              JSON.stringify(normalizedRewards),
            );
          }

          // Set current step to 2 (product step)
          setCurrentStep(2);

          // Clean up sessionStorage
          sessionStorage.removeItem("offerFormData");
        } catch (error) {
          console.error("Failed to restore offer data:", error);
          sessionStorage.removeItem("offerFormData");
          setCurrentStep(2);
        }
      } else {
        // No saved data, just set step to 2
        setCurrentStep(2);
      }
    }
  }, [searchParams, id]);

  // Helper to replace variables in text
  const replaceVariables = (
    text: string,
    variables: Record<string, string | number | boolean> = {},
  ): string => {
    if (!text) return "";
    let result = text;
    Object.keys(variables).forEach((key) => {
      const value = String(variables[key]);
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value);
    });
    return result;
  };

  // Helper to parse variables safely - tries to extract partial values even from invalid JSON
  const parseVariables = (
    vars: string | Record<string, string | number | boolean> | undefined,
  ): Record<string, string | number | boolean> => {
    try {
      if (typeof vars === "string") {
        const trimmed = vars.trim();
        if (!trimmed) return {};
        return JSON.parse(trimmed);
      } else if (vars) {
        return vars;
      }
    } catch {
      // If parsing fails, try to extract partial values from string
      if (typeof vars === "string" && vars.trim()) {
        const cleaned = vars.trim();
        const pairs: Record<string, string | number | boolean> = {};

        // Try to extract key-value pairs using regex
        // Matches: "key": "value" or "key": value
        const patterns = [
          /"([^"]+)":\s*"([^"]*)"/g, // String values
          /"([^"]+)":\s*(\d+\.?\d*)/g, // Number values
          /"([^"]+)":\s*(true|false)/g, // Boolean values
        ];

        patterns.forEach((pattern) => {
          let match;
          while ((match = pattern.exec(cleaned)) !== null) {
            const key = match[1];
            let value: string | number | boolean = match[2];

            // Convert to appropriate type
            if (value === "true") value = true;
            else if (value === "false") value = false;
            else if (!isNaN(Number(value)) && value !== "") {
              value = Number(value);
            }

            pairs[key] = value;
          }
        });

        if (Object.keys(pairs).length > 0) {
          return pairs;
        }
      }
    }
    return {};
  };

  // Preselect category from URL parameter
  useEffect(() => {
    const categoryIdParam = searchParams.get("categoryId");
    if (categoryIdParam && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        category_id: parseInt(categoryIdParam),
      }));
    }
  }, [searchParams, isEditMode]);

  // Load offer data for edit mode
  const loadOfferData = useCallback(async (offerId?: string | number, isDuplicate: boolean = false) => {
    const idToLoad = offerId || id;
    if (!idToLoad) return;

    setIsLoadingOffer(true);
    try {
      const [offerResponse, productsData, creativesData] = await Promise.all([
        offerService.getOfferById(parseInt(String(idToLoad)), true),
        offerService.getOfferProducts(parseInt(String(idToLoad))).catch(() => []), // Load existing products, ignore errors
        offerCreativeService
          .getByOffer(parseInt(String(idToLoad)), { limit: 100, skipCache: true })
          .catch(() => ({
            data: [],
            pagination: { total: 0, limit: 100, offset: 0, hasMore: false },
          })), // Load existing creatives, ignore errors
      ]);

      const response = offerResponse as { data?: Offer; success?: boolean };
      const offer = response.data || (response as Offer);

      // Extract products from response.data if wrapped
      const products = (productsData as { data?: unknown } | unknown[])?.data || productsData || [];

      // Determine offer_type_id from backend response
      let offerTypeId: number | undefined;
      if (offer.offer_type_id) {
        offerTypeId = offer.offer_type_id;
      } else if (offerTypes?.length > 0) {
        // Try to find the type ID by looking up the name (case-insensitive)
        const foundType = offerTypes.find(
          (type) =>
            type.name.toLowerCase() === offer.offer_type?.toLowerCase() ||
            type.name.toLowerCase() === offer.offer_type_label?.toLowerCase()
        );
        offerTypeId = foundType?.id;
      }

      const newFormData: CreateOfferRequest = {
        name: isDuplicate ? `Copy of ${offer.name}` : offer.name || "",
        code: offer.code || "",
        description: offer.description || "",
        offer_type_id: offerTypeId || offer.offer_type_id,
        offer_type: offer.offer_type || offer.offer_type_label,
        category_id: offer.category_id ? String(offer.category_id) : undefined,
        communication_channel_id: offer.communication_channel_id,
        route: offer.route,
        sms_route_id: offer.sms_route_id,
        email_route_id: offer.email_route_id,
        whatsapp_route_id: offer.whatsapp_route_id,
        ussd_route_id: offer.ussd_route_id,
        push_notification_route_id: offer.push_notification_route_id,
        transactional_route_id: offer.transactional_route_id,
        primary_product_id: offer.primary_product_id
          ? Number(offer.primary_product_id)
          : undefined,
        max_usage_per_customer: offer.max_usage_per_customer || 1,
        eligibility_rules: offer.eligibility_rules || {},
        is_reusable: offer.is_reusable || false,
        supports_multi_language: offer.supports_multi_language || false,
        metadata: offer.metadata || {},
      };

      const wizardData = parseOfferWizardMetadata(offer.metadata, {
        trackingSources: offer.tracking_sources,
        rewardConfiguration: offer.reward_configuration,
      });
      let formForUi = newFormData;
      if (
        wizardData.channelRouteId != null &&
        wizardData.channelRouteKind
      ) {
        formForUi = withChannelRouteSelected(
          newFormData,
          wizardData.channelRouteId,
          wizardData.channelRouteKind,
        );
      }
      const restoredTransactionalId =
        wizardData.transactionalRouteId ??
        offer.transactional_route_id ??
        formForUi.transactional_route_id;
      if (restoredTransactionalId != null) {
        formForUi = {
          ...formForUi,
          transactional_route_id: restoredTransactionalId,
        };
      }
      setFormData(formForUi);

      const loadedTrackingSources = Array.isArray(wizardData.trackingSources)
        ? (wizardData.trackingSources as OfferTrackingSource[])
        : [];
      setTrackingSources(loadedTrackingSources);

      const loadedRewards =
        wizardData.rewards.length > 0
          ? normalizeOfferRewardsWithTracking(
              wizardData.rewards,
              loadedTrackingSources,
            ).rewards
          : [];
      const offerIsImmediate = offerUsesDefaultReward(
        offerTypeId || offer.offer_type_id,
        offerTypes,
        offer.offer_type || offer.offer_type_label,
      );
      const nextRewards = offerIsImmediate
        ? ensureImmediateDefaultReward(loadedRewards).rewards
        : loadedRewards;
      setRewards(nextRewards);
      // Trigger category refresh to ensure categories are loaded and can be selected
      setCategoryRefreshTrigger((prev) => prev + 1);

      // Fetch full product details for each product_id
      if (Array.isArray(products) && products.length > 0) {
        const productDetailsPromises = products.map(
          async (link: OfferProductLink) => {
            try {
              const productResponse = await productService.getProductById(
                link.product_id,
              );
              const productData = productResponse.data || productResponse;
              return {
                ...productData,
                is_primary: link.is_primary,
                link_id: link.id || link.link_id,
              } as LinkedProduct;
            } catch {
              const fallbackProduct: LinkedProduct = {
                id: Number(link.product_id),
                product_uuid: "", // fallback values when details are unavailable
                product_code: "",
                name: `Product ${link.product_id}`,
                price: 0,
                currency: "KES",
                requires_inventory: false,
                is_active: false,
                created_at: new Date(0).toISOString(),
                updated_at: new Date(0).toISOString(),
                description: undefined,
                category_id: undefined,
                da_id: undefined,
                validity_days: undefined,
                validity_hours: undefined,
                available_quantity: undefined,
                effective_from: undefined,
                effective_to: undefined,
                created_by: undefined,
                updated_by: undefined,
                metadata: undefined,
                is_primary: link.is_primary,
                link_id: link.id || link.link_id,
              };
              return fallbackProduct;
            }
          },
        );

        const fullProducts = await Promise.all(productDetailsPromises);
        setSelectedProducts(fullProducts);
        // Store initial products for comparison in edit mode
        setInitialProducts(fullProducts.map((p) => ({ ...p })));
      } else {
        // If no products, reset initial products
        setInitialProducts([]);
      }

      // Load existing creatives and prefill the creatives state
      const creativesResponse = creativesData as
        | { data?: OfferCreative[] }
        | OfferCreative[];
      const creativesList = Array.isArray(creativesResponse)
        ? creativesResponse
        : creativesResponse?.data || [];

      if (Array.isArray(creativesList) && creativesList.length > 0) {
        const mappedCreatives: LocalOfferCreative[] = creativesList.map(
          (creative: OfferCreative) => ({
            id: String(creative.id ?? Math.random().toString(36).slice(2)),
            offer_id: creative.offer_id,
            channel: creative.channel,
            locale: creative.locale,
            title: creative.title,
            text_body: creative.text_body,
            html_body: creative.html_body,
            variables: creative.variables ?? {},
            default_values: creative.default_values,
            required_variables: creative.required_variables,
            version: creative.version,
            is_active: creative.is_active ?? true,
            is_latest: creative.is_latest,
            template_type_id: creative.template_type_id,
            created_at: creative.created_at,
            updated_at: creative.updated_at,
            created_by: creative.created_by,
            updated_by: creative.updated_by,
          }),
        );
        setCreatives(mappedCreatives);
      }
    } catch (error) {
      console.error("Failed to load offer data", error);
      // Failed to load offer data
      navigate("/dashboard/offers");
    } finally {
      setIsLoadingOffer(false);
    }
  }, [id, navigate, setFormData, setCreatives, offerTypes, setRewards, setTrackingSources]);

  // Offer categories state
  const [offerCategories, setOfferCategories] = useState<OfferCategoryType[]>(
    [],
  );
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Communication channels state
  const [communicationChannels, setCommunicationChannels] = useState<CommunicationChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);

  // Load offer categories on component mount
  useEffect(() => {
    const loadOfferCategories = async () => {
      try {
        setCategoriesLoading(true);
        // Only load active offer categories
        const response = await offerCategoryService.getActiveCategories({
          limit: 50, // Get all active categories
          skipCache: true,
        });
        setOfferCategories(response.data || []);
      } catch {
        // Failed to load offer categories
        // Keep empty array on error, user can still proceed
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadOfferCategories();
  }, []);

  // Load delivery routes once. Channel switches filter this catalog locally —
  // they must not refetch, and they must not keep the previous channel's route.
  const [deliveryRoutes, setDeliveryRoutes] = useState<SMSRoute[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const offerRouteHydrationDoneRef = useRef(false);

  // Load routes and communication channels on component mount
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setRoutesLoading(true);
        const allRoutes = await routeService.getAllRoutesEnriched();
        setDeliveryRoutes(
          Array.isArray(allRoutes)
            ? allRoutes.filter((route) => route.is_active !== false)
            : [],
        );
      } catch {
        setDeliveryRoutes([]);
      } finally {
        setRoutesLoading(false);
      }
    };

    const loadCommunicationChannels = async () => {
      try {
        setChannelsLoading(true);
        const channels = await communicationChannelService.getAll();
        // Filter for active channels only - prevents users from selecting inactive/unavailable channels
        const activeChannels = Array.isArray(channels) ? channels.filter((ch) => ch.is_active) : [];
        setCommunicationChannels(activeChannels);

        // Set default channel from settings if not already set
        if (!formData.communication_channel_id && activeChannels.length > 0) {
          const defaultChannelName = getSettingsCommunicationChannel();
          const defaultChannel = activeChannels.find(
            (ch) => ch.name?.toUpperCase() === defaultChannelName.toUpperCase()
          );
          if (defaultChannel) {
            setFormData((prev) => ({
              ...prev,
              communication_channel_id: defaultChannel.id,
            }));
          }
        }
      } catch {
        // Failed to load communication channels
        // Keep empty array on error, user can still proceed
      } finally {
        setChannelsLoading(false);
      }
    };

    loadRoutes();
    loadCommunicationChannels();
  }, []);

  // Detect edit mode and load data
  useEffect(() => {
    // Skip loading if in modal mode AND creating new offer (no ID provided)
    if (onSuccess && !id && !duplicateIdParam) {
      return;
    }

    if (id) {
      setIsEditMode(true);
      loadOfferData(id, false);
    } else if (duplicateIdParam) {
      setIsDuplicateMode(true);
      loadOfferData(duplicateIdParam, true);
    }
  }, [id, duplicateIdParam, loadOfferData, onSuccess]);

  // When offerTypes load and we're in edit mode without a type ID, try to find it by name
  useEffect(() => {
    if (isEditMode && formData.offer_type && !formData.offer_type_id && offerTypes?.length > 0) {
      const normalizedType = formData.offer_type.toLowerCase();
      const foundType = offerTypes.find(
        (type) => type.name.toLowerCase() === normalizedType,
      );
      if (foundType) {
        setFormData((prev) => ({ ...prev, offer_type_id: foundType.id }));
      }
    }
  }, [offerTypes, isEditMode, formData.offer_type, formData.offer_type_id, setFormData]);

  useEffect(() => {
    offerRouteHydrationDoneRef.current = false;
  }, [id, duplicateIdParam]);

  // After channels load, map legacy `route` → typed *_route_id (edit/duplicate offers from API).
  // Run once per offer load — not on every communication-channel change, or the old
  // route is copied onto the newly selected channel.
  useEffect(() => {
    if (!isEditMode && !isDuplicateMode) return;
    if (isLoadingOffer) return;
    if (offerRouteHydrationDoneRef.current) return;
    if (!formData.communication_channel_id || communicationChannels.length === 0) {
      return;
    }

    const channel = communicationChannels.find(
      (ch) => String(ch.id) === String(formData.communication_channel_id),
    );
    const channelKind = resolveCommunicationChannelKind(channel?.name);
    if (!channelKind) {
      offerRouteHydrationDoneRef.current = true;
      return;
    }

    offerRouteHydrationDoneRef.current = true;
    setFormData((prev) => {
      const hydrated = hydrateOfferRouteFields(prev, channelKind);
      const unchanged =
        hydrated.sms_route_id === prev.sms_route_id &&
        hydrated.email_route_id === prev.email_route_id &&
        hydrated.whatsapp_route_id === prev.whatsapp_route_id &&
        hydrated.ussd_route_id === prev.ussd_route_id &&
        hydrated.push_notification_route_id ===
          prev.push_notification_route_id;
      const campaignRouteId = getEffectiveRouteIdForChannel(
        { ...prev, ...hydrated },
        channelKind,
      );
      const nextTransactional =
        prev.transactional_route_id ?? campaignRouteId;
      const next = {
        ...prev,
        ...hydrated,
        transactional_route_id: nextTransactional,
      };
      if (
        unchanged &&
        next.transactional_route_id === prev.transactional_route_id
      ) {
        return prev;
      }
      return next;
    });
  }, [
    isEditMode,
    isDuplicateMode,
    isLoadingOffer,
    communicationChannels,
    formData.communication_channel_id,
    setFormData,
  ]);

  // Validation functions
  const buildOfferValidationErrors = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = "Offer name is required";
    }

    if (!formData.code?.trim()) {
      errors.code = "Offer code is required";
    }

    if (!formData.offer_type_id) {
      errors.offer_type = "Offer type is required";
    }

    if (!formData.category_id) {
      errors.category_id = "Catalog is required";
    }

    if (!formData.communication_channel_id) {
      errors.communication_channel = "Communication channel is required";
    }

    const selectedChannel = communicationChannels?.find(
      (ch) => String(ch.id) === String(formData.communication_channel_id),
    );
    Object.assign(
      errors,
      collectOfferRouteValidationErrors(formData, selectedChannel?.name),
    );

    Object.assign(
      errors,
      validateOfferRewardTrackingMapping(
        rewards,
        trackingSources,
        requiresTrackingRewardMapping,
        { usesDefaultReward },
      ),
    );

    return errors;
  }, [
    formData,
    communicationChannels,
    rewards,
    trackingSources,
    requiresTrackingRewardMapping,
    usesDefaultReward,
  ]);

  const validateForm = useCallback(() => {
    const errors = buildOfferValidationErrors();
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [buildOfferValidationErrors]);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  // Validation function for each step
  const validateCurrentStep = useCallback(() => {
    switch (currentStep) {
      case 1: // Basic Info step
        const isBasicInfoValid =
          formData.name.trim() !== "" &&
          formData.offer_type_id &&
          formData.category_id !== undefined &&
          formData.communication_channel_id !== undefined;

        if (!isBasicInfoValid) return false;

        const selectedChannel = communicationChannels?.find(
          (ch) => String(ch.id) === String(formData.communication_channel_id),
        );
        const channelKind = resolveCommunicationChannelKind(
          selectedChannel?.name,
        );
        if (!channelKind) return true;

        return (
          getEffectiveRouteIdForChannel(formData, channelKind) !== undefined &&
          formData.transactional_route_id !== undefined
        );
      case 2: // Products step
        return true; // Products are optional; allow proceeding
      case 3: // Creative step
        // Creatives are required, and each must have:
        // 1. Language selected (locale)
        // 2. Text body filled
        // 3. For Email channel, HTML body must be filled
        if (creatives.length === 0) return false;

        return creatives.every((creative) => {
          const normalized = ensureEmailHtmlBody(creative);
          const hasLanguage =
            normalized.locale && normalized.locale.trim() !== "";
          const hasTextBody =
            normalized.text_body && normalized.text_body.trim() !== "";
          const isEmailWithHtml = requiresHtmlBody(normalized.channel)
            ? normalized.html_body && normalized.html_body.trim() !== ""
            : true;

          return hasLanguage && hasTextBody && isEmailWithHtml;
        });
      case 4: // Tracking step
        if (
          findTrackingSourcesWithInvalidPriorities(trackingSources).length > 0
        ) {
          return false;
        }
        if (!requiresTrackingRewardMapping) return true; // seeding reward: optional
        return trackingSources.some((s) => s.enabled !== false);
      case 5: // Rewards step
        if (findRewardsWithInvalidPriorities(rewards).length > 0) {
          return false;
        }
        if (usesDefaultReward) {
          return isDefaultImmediateRewardConfigured(rewards);
        }
        if (!requiresTrackingRewardMapping) return true;
        {
          const activeSourceIds = new Set(
            trackingSources
              .filter((s) => s.enabled !== false)
              .map((s) => s.id),
          );
          const enabledRules = rewards.flatMap((r) =>
            r.rules.filter((rule) => rule.enabled),
          );
          if (enabledRules.length === 0) return false;
          return enabledRules.every((rule) => {
            const parent = rewards.find((r) =>
              r.rules.some((rr) => rr.id === rule.id),
            );
            if (parent?.is_default) return true;
            const sourceId =
              parent?.tracking_source_id?.trim() ||
              rule.tracking_source_id?.trim();
            if (!sourceId || !activeSourceIds.has(sourceId)) return false;
            const source = trackingSources.find((s) => s.id === sourceId);
            const enabledTrackingRules = (source?.rules || []).filter(
              (r) => r.enabled !== false,
            );
            // Rules are optional: source-level OK when the source has none.
            if (enabledTrackingRules.length === 0) {
              return !rule.tracking_rule_id?.trim();
            }
            const trackingRuleId = rule.tracking_rule_id?.trim();
            if (!trackingRuleId) return false;
            return enabledTrackingRules.some((r) => r.id === trackingRuleId);
          });
        }
      case 6: // Review step
        // Validate all required fields are filled
        const isReviewValid =
          formData.name.trim() !== "" &&
          formData.code.trim() !== "" &&
          formData.offer_type_id &&
          formData.category_id !== undefined &&
          formData.communication_channel_id !== undefined;

        if (!isReviewValid) return false;

        const reviewSelectedChannel = communicationChannels?.find(
          (ch) => String(ch.id) === String(formData.communication_channel_id),
        );
        const reviewKind = resolveCommunicationChannelKind(
          reviewSelectedChannel?.name,
        );
        if (!reviewKind) return true;

        return (
          getEffectiveRouteIdForChannel(formData, reviewKind) !== undefined &&
          formData.transactional_route_id !== undefined
        );
      default:
        return false;
    }
  }, [
    currentStep,
    formData,
    creatives,
    trackingSources,
    rewards,
    communicationChannels,
    requiresTrackingRewardMapping,
    usesDefaultReward,
    // Removed validationErrors and clearValidationErrors to break circular dependency
  ]);

  const canNavigateToStep = useCallback(
    (targetStep: number) => {
      // Can always go to previously visited steps
      if (visitedSteps.has(targetStep)) return true;

      // Can go to next step only if current step is valid
      if (targetStep === currentStep + 1) return validateCurrentStep();

      // Can stay on current step
      if (targetStep === currentStep) return true;

      // Can't go to future steps beyond current + 1
      return false;
    },
    [visitedSteps, currentStep, validateCurrentStep],
  );

  const handleNext = useCallback(() => {
    if (validateCurrentStep() && currentStep < totalSteps) {
      // Persist recovered html_body before leaving the Creative step
      if (currentStep === 3 && creatives.length > 0) {
        const normalizedCreatives = creatives.map(ensureEmailHtmlBody);
        const needsSync = normalizedCreatives.some(
          (c, i) =>
            c.html_body !== creatives[i].html_body ||
            c.text_body !== creatives[i].text_body,
        );
        if (needsSync) {
          setCreatives(normalizedCreatives);
        }
      }
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVisitedSteps((prev) => new Set(prev).add(nextStep));
      // Clear validation errors when moving to next step
      setValidationErrors({});
    } else {
      // Set validation errors based on current step
      const errors: Record<string, string> = {};

      if (currentStep === 1) {
        // Step 1: Basic Info validation errors
        if (!formData.name?.trim()) errors.name = "Offer name is required";
        if (!formData.offer_type_id) errors.offer_type = "Offer type is required";
        if (!formData.category_id) errors.category_id = "Catalog is required";
        if (!formData.communication_channel_id) errors.communication_channel = "Communication channel is required";

        // Check route requirements based on selected channel
        const selectedChannel = communicationChannels?.find(
          (ch) => String(ch.id) === String(formData.communication_channel_id),
        );
        Object.assign(
          errors,
          collectOfferRouteValidationErrors(formData, selectedChannel?.name),
        );
      } else if (currentStep === 3) {
        // Step 3: Creative validation errors
        if (creatives.length === 0) {
          errors.creatives = "At least one creative is required";
        } else {
          // Persist recovered html_body for Email creatives that only had text_body
          const normalizedCreatives = creatives.map(ensureEmailHtmlBody);
          const needsSync = normalizedCreatives.some(
            (c, i) => c.html_body !== creatives[i].html_body,
          );
          if (needsSync) {
            setCreatives(normalizedCreatives);
          }

          const creativeErrors: string[] = [];
          normalizedCreatives.forEach((creative, index) => {
            const hasLanguage = creative.locale && creative.locale.trim() !== "";
            const hasTextBody =
              creative.text_body && creative.text_body.trim() !== "";
            const isEmailWithHtml = requiresHtmlBody(creative.channel)
              ? creative.html_body && creative.html_body.trim() !== ""
              : true;

            if (!hasLanguage) {
              creativeErrors.push(`Creative ${index + 1}: Language is required`);
            }
            if (!hasTextBody) {
              creativeErrors.push(
                `Creative ${index + 1}: Message body is required`,
              );
            }
            if (requiresHtmlBody(creative.channel) && !isEmailWithHtml) {
              creativeErrors.push(
                `Creative ${index + 1}: For Email channels, HTML body is required`,
              );
            }
          });
          if (creativeErrors.length > 0) {
            errors.creatives = creativeErrors.join(" • ");
          }
        }
      } else if (currentStep === 4) {
        Object.assign(
          errors,
          validateOfferRewardTrackingMapping(
            rewards,
            trackingSources,
            requiresTrackingRewardMapping,
            { usesDefaultReward },
          ),
        );
        // Rewards may still be incomplete on the Tracking step.
        delete errors.rewards;
      } else if (
        currentStep === 5 &&
        (requiresTrackingRewardMapping || usesDefaultReward)
      ) {
        Object.assign(
          errors,
          validateOfferRewardTrackingMapping(
            rewards,
            trackingSources,
            requiresTrackingRewardMapping,
            { usesDefaultReward },
          ),
        );
      } else if (currentStep === 6) {
        if (!formData.name?.trim()) errors.name = "Offer name is required";
        if (!formData.code?.trim()) errors.code = "Offer code is required";
        if (!formData.offer_type_id) errors.offer_type = "Offer type is required";
        if (!formData.category_id) errors.category_id = "Catalog is required";
        if (!formData.communication_channel_id) {
          errors.communication_channel = "Communication channel is required";
        }
        const reviewChannel = communicationChannels?.find(
          (ch) => String(ch.id) === String(formData.communication_channel_id),
        );
        Object.assign(
          errors,
          collectOfferRouteValidationErrors(formData, reviewChannel?.name),
        );
        Object.assign(
          errors,
          validateOfferRewardTrackingMapping(
            rewards,
            trackingSources,
            requiresTrackingRewardMapping,
            { usesDefaultReward },
          ),
        );
      }
      setValidationErrors(errors);
    }
  }, [
    currentStep,
    totalSteps,
    validateCurrentStep,
    creatives,
    formData,
    trackingSources,
    rewards,
    communicationChannels,
    requiresTrackingRewardMapping,
    usesDefaultReward,
  ]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleStepClick = useCallback(
    (stepId: number) => {
      if (canNavigateToStep(stepId)) {
        setCurrentStep(stepId);
        // Mark the clicked step as visited
        setVisitedSteps((prev) => new Set(prev).add(stepId));
      }
    },
    [canNavigateToStep],
  );

  const handleSubmit = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      clearValidationErrors();

      // Validate form before submission
      if (!validateForm()) {
        const submitErrors = buildOfferValidationErrors();
        setValidationErrors(submitErrors);
        setError("Please fix the validation errors before submitting");
        const needsBasicInfoStep =
          submitErrors.name ||
          submitErrors.code ||
          submitErrors.offer_type ||
          submitErrors.category_id ||
          submitErrors.communication_channel ||
          submitErrors.sms_route ||
          submitErrors.email_route ||
          submitErrors.whatsapp_route ||
          submitErrors.ussd_route ||
          submitErrors.push_route ||
          submitErrors.transactional_route;
        if (needsBasicInfoStep) {
          setCurrentStep(1);
        } else if (submitErrors.tracking) {
          setCurrentStep(4);
        } else if (submitErrors.rewards) {
          setCurrentStep(5);
        }
        setIsLoading(false);
        return;
      }

      // Prepare API payload (routes + wizard rewards/tracking in metadata)
      const selectedChannel = communicationChannels.find(
        (ch) => String(ch.id) === String(formData.communication_channel_id),
      );

      let offerId: number;

      if (isEditMode && id) {
        const apiData = buildOfferUpdatePayload(formData, {
          channelName: selectedChannel?.name,
          rewards,
          trackingSources,
          updatedBy: user?.user_id,
        });
        await offerService.updateOffer(parseInt(id), apiData);
        offerId = parseInt(id);
      } else if (createdOfferId) {
        const apiData = buildOfferUpdatePayload(formData, {
          channelName: selectedChannel?.name,
          rewards,
          trackingSources,
          updatedBy: user?.user_id,
        });
        await offerService.updateOffer(createdOfferId, apiData);
        offerId = createdOfferId;
      } else {
        const apiData = buildOfferCreatePayload(formData, {
          channelName: selectedChannel?.name,
          rewards,
          trackingSources,
        });
        const createdOfferResponse = await offerService.createOffer({
          ...apiData,
          ...(user?.user_id != null ? { created_by: user.user_id } : {}),
        });

        // Extract offer ID from response - BaseResponse wraps the Offer in .data
        // Try data.id first, then insertId as fallback
        offerId =
          createdOfferResponse.data?.id || createdOfferResponse.insertId;

        if (!offerId) {
          throw new Error("Failed to get offer ID from creation response");
        }
      }

      // Handle product linking/unlinking
      if (
        selectedProducts.length > 0 ||
        (isEditMode && initialProducts.length > 0)
      ) {
        try {
          if (!user?.user_id) {
            throw new Error("User ID not available for linking products");
          }

          if (!offerId) {
            throw new Error("Offer ID is not available for linking products");
          }

          if (isEditMode) {
            // In edit mode, compare initial products with current products
            const initialProductIds = new Set(
              initialProducts.map((p) => String(p.id)),
            );
            const currentProductIds = new Set(
              selectedProducts.map((p) => String(p.id)),
            );

            // Find products to unlink (in initial but not in current)
            const productsToUnlink = initialProducts.filter(
              (p) => !currentProductIds.has(String(p.id)),
            );

            // Find products to link (in current but not in initial)
            const productsToLink = selectedProducts.filter(
              (p) => !initialProductIds.has(String(p.id)),
            );

            // Unlink removed products
            if (productsToUnlink.length > 0) {
              for (const product of productsToUnlink) {
                const linkId = product.link_id;
                if (!linkId) {
                  continue;
                }
                await offerService.unlinkProductById(linkId);
              }
            }

            // Link newly added products
            if (productsToLink.length > 0) {
              const primaryProductId = formData.primary_product_id;
              const links = productsToLink.map((p) => {
                const productId = Number(p.id);
                return {
                  offer_id: Number(offerId),
                  product_id: productId,
                  is_primary: primaryProductId === productId,
                  quantity: DEFAULT_PRODUCT_LINK_QUANTITY,
                };
              });

              const batchRequest = {
                links: links,
                created_by: user.user_id,
              };

              await offerService.linkProductsBatch(batchRequest);
            }

            // Handle primary product change (if primary changed but product still exists)
            const currentPrimaryId = formData.primary_product_id;
            if (currentPrimaryId) {
              const primaryProduct = selectedProducts.find(
                (p) => p.id === currentPrimaryId,
              );
              const initialPrimary = initialProducts.find((p) => p.is_primary);

              // If primary changed to a different existing product
              if (
                primaryProduct &&
                initialPrimary &&
                initialPrimary.id !== currentPrimaryId
              ) {
                // Primary product changes are managed through the offer details page
              }
            }
          } else {
            // Create mode: link all selected products
            const primaryProductId = formData.primary_product_id;
            const links = selectedProducts.map((p) => {
              const productId = Number(p.id);
              return {
                offer_id: Number(offerId),
                product_id: productId,
                is_primary: primaryProductId === productId,
                quantity: DEFAULT_PRODUCT_LINK_QUANTITY,
              };
            });

            const batchRequest = {
              links: links,
              created_by: user.user_id,
            };

            await offerService.linkProductsBatch(batchRequest);
          }
        } catch {
          // Failed to manage products
          showError(
            isEditMode
              ? t.offers.updateWithProductError
              : t.offers.createWithProductError,
          );
        }
      }

      // Save creatives to the offer if any were created
      // Note: This runs regardless of product linking success/failure
      if (creatives.length > 0) {
        try {
          if (!user?.user_id) {
            throw new Error("User ID not available for saving creatives");
          }

          // Create creatives for each channel/locale combination
          const creativePromises = creatives.map(async (creativeInput) => {
            try {
              // Ensure Email creatives always send html_body (recover from text_body if needed)
              const creative = ensureEmailHtmlBody(creativeInput);

              const creativeName =
                creative.title?.trim() ||
                `${creative.channel} - ${creative.locale}`;

              const existingVars = creative.variables || {};
              const extracted = collectPlaceholderVariables(
                creative.title,
                creative.text_body,
                creative.html_body,
              );
              const variables =
                Object.keys(existingVars).length > 0
                  ? existingVars
                  : Object.keys(extracted).length > 0
                    ? extracted
                    : undefined;

              const creativePayload = {
                offer_id: offerId,
                channel: creative.channel,
                locale: creative.locale,
                name: creativeName,
                title: creative.title || undefined,
                text_body: creative.text_body || undefined,
                html_body: creative.html_body || undefined,
                variables,
                save_as_template: Boolean(creative.save_as_template),
                created_by: user.user_id,
              };

              return await offerCreativeService.create(creativePayload);
            } catch (err) {
              throw err;
            }
          });

          await Promise.all(creativePromises);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error occurred";
          showError(
            isEditMode
              ? t.offers.updateWithCreativeError
              : t.offers.createWithCreativeError,
            errorMessage,
          );
          navigate("/dashboard/offers");
          return;
        }
      }

      // Show success message
      showToast(isEditMode ? t.offers.updateSuccess : t.offers.createSuccess);

      // Call onSuccess callback if provided (modal mode) and not in edit mode
      if (offerId && onSuccess && !isEditMode) {
        onSuccess(offerId);
        return;
      }

      // Check if we should return to campaign creation flow
      if (returnToCampaign && returnUrl && !isEditMode) {
        // Store the created offer ID in sessionStorage for campaign flow tracking
        if (offerId) {
          const campaignFlowOffersStr = sessionStorage.getItem(
            "campaignFlowCreatedOffers",
          );
          const campaignFlowOfferIds: number[] = campaignFlowOffersStr
            ? JSON.parse(campaignFlowOffersStr)
            : [];
          if (!campaignFlowOfferIds.includes(offerId)) {
            campaignFlowOfferIds.push(offerId);
            sessionStorage.setItem(
              "campaignFlowCreatedOffers",
              JSON.stringify(campaignFlowOfferIds),
            );
          }
        }

        // Navigate back to campaign creation at step 3
        const url = new URL(returnUrl);
        // Ensure we're on step 3
        url.searchParams.set("step", "3");
        url.searchParams.set("returnFromOfferCreate", "true");

        // Clear localStorage form data after successful creation
        clearPersistedFormData("offer_form_data");
        clearPersistedFormData("offer_creatives");
        clearPersistedFormData("offer_tracking_sources");
        clearPersistedFormData("offer_rewards");
        clearPersistedFormData("offer_products");

        navigate(url.pathname + url.search);
      } else {
        // Clear localStorage form data after successful creation
        clearPersistedFormData("offer_form_data");
        clearPersistedFormData("offer_creatives");
        clearPersistedFormData("offer_tracking_sources");
        clearPersistedFormData("offer_rewards");
        clearPersistedFormData("offer_products");

        navigate("/dashboard/offers");
      }
    } catch (err: unknown) {
      // Create offer error

      // Parse API error response for better error messages
      let errorMessage = "Failed to create offer";

      // Handle Error objects (from service)
      if (err instanceof Error) {
        // Filter out HTTP error messages
        if (
          err.message.includes("HTTP error") ||
          err.message.includes("status:")
        ) {
          errorMessage = "Failed to create offer";
        } else {
          errorMessage = err.message;
        }
      } else if (err && typeof err === "object") {
        // Handle response objects
        if (hasResponseData(err)) {
          const errorResponse = err.response;

          if (errorResponse?.data?.message) {
            const msg = errorResponse.data.message;
            // Filter out HTTP errors
            if (msg.includes("HTTP error") || msg.includes("status:")) {
              errorMessage = "Failed to create offer";
            } else {
              errorMessage = msg;
            }
          } else if (errorResponse?.data?.error) {
            const errMsg = errorResponse.data.error;
            // Filter out HTTP errors
            if (errMsg.includes("HTTP error") || errMsg.includes("status:")) {
              errorMessage = "Failed to create offer";
            } else {
              errorMessage = errMsg;
            }
          } else if (errorResponse?.data?.details) {
            // Handle validation errors from API
            const details = errorResponse.data.details;
            if (Array.isArray(details)) {
              const fieldErrors: Record<string, string> = {};
              details.forEach((detail: ApiErrorDetail) => {
                if (detail.field) {
                  fieldErrors[detail.field] = detail.message || "Invalid value";
                }
              });
              setValidationErrors(fieldErrors);
              errorMessage = "Please fix the validation errors below";
            } else if (isRecordOfString(details)) {
              setValidationErrors(details);
              errorMessage = "Please fix the validation errors below";
            }
          }
        } else if (hasErrorString(err)) {
          // Handle direct error objects
          const errMsg = err.error;
          // Filter out HTTP errors
          if (errMsg.includes("HTTP error") || errMsg.includes("status:")) {
            errorMessage = "Failed to create offer";
          } else {
            errorMessage = errMsg;
          }
        } else if (hasMessageString(err)) {
          const msg = err.message;
          // Filter out HTTP errors
          if (msg.includes("HTTP error") || msg.includes("status:")) {
            errorMessage = "Failed to create offer";
          } else {
            errorMessage = msg;
          }
        }
      }

      // Show error to user
      console.error("Failed to create/update offer:", err);
      showError("Error", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    isEditMode,
    id,
    validateForm,
    buildOfferValidationErrors,
    clearValidationErrors,
    formData,
    selectedProducts,
    initialProducts,
    user,
    creatives,
    createdOfferId,
    navigate,
    showError,
    showToast,
    rewards,
    trackingSources,
    communicationChannels,
  ]);

  const handleSaveDraft = useCallback(async () => {
    try {
      setIsSavingDraft(true);
      if (!formData.name.trim()) {
        showError("Validation Error", t.offers.nameRequired, true);
        return;
      }

      const selectedChannel = communicationChannels.find(
        (ch) => String(ch.id) === String(formData.communication_channel_id),
      );

      const baseDraftData = buildOfferUpdatePayload(formData, {
        channelName: selectedChannel?.name,
        rewards,
        trackingSources,
        updatedBy: user?.user_id,
      });

      if (isEditMode && id) {
        await offerService.updateOffer(parseInt(id), baseDraftData);
        showToast(t.offers.draftSaveSuccess || "Draft updated successfully!");
      } else if (createdOfferId) {
        // Session draft exists: update the already-created draft
        const updateData: UpdateOfferRequest = { ...baseDraftData, updated_by: user?.user_id };
        await offerService.updateOffer(createdOfferId, updateData);
        showToast(t.offers.draftSaveSuccess || "Draft saved successfully!");
      } else {
        const createData: CreateOfferRequest = {
          ...buildOfferCreatePayload(formData, {
            channelName: selectedChannel?.name,
            rewards,
            trackingSources,
          }),
          ...(user?.user_id != null ? { created_by: user.user_id } : {}),
        };
        const createResponse = await offerService.createOffer(createData);
        const offerId = createResponse?.data?.id;
        if (!offerId) throw new Error("Offer created but ID not returned");
        setCreatedOfferId(offerId);
        showToast(t.offers.draftSaveSuccess || "Draft saved successfully!");
      }
    } catch (error) {
      // Extract backend error message (matches campaign pattern)
      let errorMessage = t.offers.draftSaveError || "Error saving draft";
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      } else if (hasErrorString(error)) {
        errorMessage = error.error;
      } else if (hasResponseData(error)) {
        const data = error.response?.data;
        if (data?.error) errorMessage = data.error;
        else if (data?.message) errorMessage = data.message;
      } else if (hasMessageString(error)) {
        errorMessage = error.message;
      }
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setIsSavingDraft(false);
    }
  }, [
    formData,
    isEditMode,
    id,
    createdOfferId,
    user,
    showError,
    showToast,
    t,
    rewards,
    trackingSources,
    communicationChannels,
  ]);

  const handleCancel = useCallback(() => {
    navigate("/dashboard/offers");
  }, [navigate]);

  const stepProps = useMemo(
    () => ({
      currentStep,
      totalSteps,
      onNext: handleNext,
      onPrev: handlePrev,
      onSubmit: handleSubmit,
      formData,
      setFormData,
      creatives,
      setCreatives,
      trackingSources,
      setTrackingSources,
      rewards,
      setRewards,
      selectedProducts,
      setSelectedProducts,
      isLoading,
      validationErrors,
      clearValidationErrors,
      offerCategories,
      categoriesLoading,
      communicationChannels,
      channelsLoading,
      deliveryRoutes,
      routesLoading,
      onSaveDraft: handleSaveDraft,
      onCancel: handleCancel,
      offerTypes,
      offerTypesLoading,
      categoryRefreshTrigger,
      refreshOfferTypes,
      requiresTrackingRewardMapping,
      usesDefaultReward,
      offerTypeName,
    }),
    [
      currentStep,
      totalSteps,
      handleNext,
      handlePrev,
      handleSubmit,
      formData,
      // setFormData, setCreatives, etc. are stable - don't need in deps
      creatives,
      trackingSources,
      rewards,
      selectedProducts,
      setSelectedProducts,
      isLoading,
      validationErrors,
      clearValidationErrors,
      offerCategories,
      categoriesLoading,
      communicationChannels,
      channelsLoading,
      deliveryRoutes,
      routesLoading,
      handleSaveDraft,
      handleCancel,
      offerTypes,
      offerTypesLoading,
      categoryRefreshTrigger,
      refreshOfferTypes,
      requiresTrackingRewardMapping,
      usesDefaultReward,
      offerTypeName,
    ],
  );

  // Render step directly in JSX instead of memoizing to avoid dependency issues

  // Show loading state while loading offer data (after all hooks)
  if (isLoadingOffer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#588157] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading offer...</p>
        </div>
      </div>
    );
  }

  const handleCancelOffer = () => {
    clearPersistedFormData("offer_form_data");
    clearPersistedFormData("offer_creatives");
    clearPersistedFormData("offer_products");
    navigate("/dashboard/offers");
  };

  const getSubmitButtonText = () => {
    if (isEditMode) return "Update";
    if (isDuplicateMode) return "Create";
    return "Create";
  };

  const renderStep = () => {
    return (
      <>
        {error && (
          <div
            className={`bg-red-50 border border-red-200 ${tw.rounded} p-4 mb-6`}
          >
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="pb-10">
          {currentStep === 1 && <BasicInfoStep {...stepProps} />}
          {currentStep === 2 && (
            <ProductStepWrapper
              {...stepProps}
              selectedProducts={selectedProducts}
              onProductsChange={setSelectedProducts}
              formData={formData}
              setFormData={setFormData}
              creatives={creatives}
              trackingSources={trackingSources}
              rewards={rewards}
            />
          )}
          {currentStep === 3 && (
            <OfferCreativeStepWrapper
              {...stepProps}
              communicationChannelId={formData.communication_channel_id}
              communicationChannels={communicationChannels}
            />
          )}
          {currentStep === 4 && (
            <OfferTrackingStepWrapper
              {...stepProps}
              initialOpenSourceModal={openSelectTrackingSources}
              onInitialOpenSourceModalConsumed={() =>
                setOpenSelectTrackingSources(false)
              }
            />
          )}
          {currentStep === 5 && <OfferRewardStepWrapper {...stepProps} />}
          {currentStep === 6 && <ReviewStep {...stepProps} />}
        </div>
      </>
    );
  };

  return (
    <MultiStepFormWrapper
      steps={steps}
      currentStep={currentStep}
      onStepClick={handleStepClick}
      canNavigateToStep={canNavigateToStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      onCancel={handleCancelOffer}
      onSaveDraft={handleSaveDraft}
      isLoading={isLoading}
      isSavingDraft={isSavingDraft}
      currentLabel={isEditMode ? "Edit Offer" : isDuplicateMode ? "Duplicate Offer" : "Create Offer"}
      submitButtonText={getSubmitButtonText()}
      saveDraftText="Save Draft"
      showSaveDraft={true}
      showCancel={true}
    >
      {renderStep()}
    </MultiStepFormWrapper>
  );
}
