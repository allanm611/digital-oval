import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  Archive,
  RotateCcw,
  MoreVertical,
  Save,
  Plus,
  X,
  Zap,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import Checkbox from "../../../shared/components/ui/Checkbox";

const CreateProductModalWrapper = lazy(
  () => import("../../products/components/CreateProductModalWrapper"),
);
import OfferCreativeFormModal from "../components/OfferCreativeFormModal";
import { Offer, OfferStatusEnum, OfferProductLink } from "../types/offer";
import { OfferCategoryType } from "../types/offerCategory";
import { offerService } from "../services/offerService";
import { offerCategoryService } from "../services/offerCategoryService";
import { productService } from "../../products/services/productService";
import { offerCreativeService } from "../services/offerCreativeService";
import { campaignFlowService } from "../../campaigns/services/campaignFlowService";
import { senderIdService, SenderId } from "../../configurations/services/senderIdService";
import { smsRouteService } from "../../routes/services/smsRouteService";
import {
  OfferCreative,
  CreativeChannel,
  COMMON_LOCALES,
  VALID_CHANNELS,
  CreateOfferCreativeRequest,
} from "../types/offerCreative";
import { color, tw } from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { supportsHtmlBody, requiresHtmlBody } from "../utils/channelUtils";
import BackButton from "../../../shared/components/ui/BackButton";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import RegularModal from "../../../shared/components/ui/RegularModal";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { Product } from "../../products/types/product";
import { Search, Check, FileText, Eye, Copy } from "lucide-react";
import { productCategoryService } from "../../products/services/productCategoryService";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import TypeSelector from "../../../shared/components/TypeSelector";
import DateFormatter from "../../../shared/components/DateFormatter";
import { useConfigurationData } from "../../../shared/services/configurationDataService";
import { ConfigurationItem } from "../../configurations/components/ConfigurationManager";
import { creativeTemplateService } from "../../configurations/services/creativeTemplateService";
import {
  SMSSmartphonePreview,
  EmailLaptopPreview,
} from "../components/CreativePreviewComponents";
import PreviewPanel from "../../communications/components/PreviewPanel";
import RichTextEditor from "../../communications/components/RichTextEditor";
import CascadingVariableSelector from "../../manual-broadcast/components/CascadingVariableSelector";
import {
  insertVariableAtCursor,
  formatVariablePlaceholder,
} from "../../../shared/utils/variableInsertion";
import type { TemplateVariable } from "../../manual-broadcast/types";

const localeLabelMap: Record<string, string> = {
  en: "English",
  "en-US": "English (US)",
  "en-GB": "English (UK)",
  fr: "French",
  "fr-CA": "French (Canada)",
  "fr-FR": "French (France)",
  es: "Spanish",
  "es-ES": "Spanish (Spain)",
  "es-MX": "Spanish (Mexico)",
  de: "German",
  "de-DE": "German (Germany)",
  ar: "Arabic",
  "ar-SA": "Arabic (Saudi Arabia)",
  pt: "Portuguese",
  "pt-BR": "Portuguese (Brazil)",
  "pt-PT": "Portuguese (Portugal)",
  sw: "Swahili",
  "sw-UG": "Swahili (Uganda)",
  "sw-KE": "Swahili (Kenya)",
};

const getLocaleLabel = (locale: string): string =>
  localeLabelMap[locale] || locale;

const creativeChannelOptions = ["SMS", "Email", "Push", "WhatsApp"].map(
  (channel) => ({
    value: channel,
    label: channel,
  }),
);

// Locale options will be generated from languages config

export default function OfferDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError, info } = useToast();
  const { confirm } = useConfirm();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteCreativeModal, setShowDeleteCreativeModal] = useState(false);
  const [creativeToDelete, setCreativeToDelete] =
    useState<OfferCreative | null>(null);
  const [isDeletingCreative, setIsDeletingCreative] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [showExpireModal, setShowExpireModal] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [productToUnlink, setProductToUnlink] = useState<{
    linkId: number;
    productId?: number;
    name: string;
  } | null>(null);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Check if we came from a catalog modal
  const returnTo = (
    location.state as {
      returnTo?: {
        pathname: string;
        fromModal?: boolean;
        catalogId?: number | string;
      };
    }
  )?.returnTo;

  const handleBack = () => {
    if (returnTo?.pathname) {
      navigate(returnTo.pathname, { replace: true });
      return;
    }

    navigateBackOrFallback(navigate, "/dashboard/offers");
  };

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isApproveLoading, setIsApproveLoading] = useState(false);
  const [isRejectLoading, setIsRejectLoading] = useState(false);
  const [isRequestApprovalLoading, setIsRequestApprovalLoading] =
    useState(false);
  const [isActivateLoading, setIsActivateLoading] = useState(false);
  const [isPauseLoading, setIsPauseLoading] = useState(false);
  const [isExpireLoading, setIsExpireLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [linkedProducts, setLinkedProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categoryName, setCategoryName] = useState<string>("Uncategorized");
  const [primaryProductId, setPrimaryProductId] = useState<number | null>(null);
  const [unlinkingProductId, setUnlinkingProductId] = useState<number | null>(
    null,
  );
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);
  const [offerCreatives, setOfferCreatives] = useState<OfferCreative[]>([]);
  const [creativesLoading, setCreativesLoading] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Creative edit modal state
  const [isEditCreativeModalOpen, setIsEditCreativeModalOpen] = useState(false);
  const [editingCreative, setEditingCreative] = useState<OfferCreative | null>(
    null,
  );
  const [isSavingCreative, setIsSavingCreative] = useState(false);
  const [isAddCreativeModalOpen, setIsAddCreativeModalOpen] = useState(false);
  const [isCreatingCreative, setIsCreatingCreative] = useState(false);
  const [newCreativeForm, setNewCreativeForm] = useState<{
    channel: CreativeChannel;
    locale: string;
    title: string;
    text_body: string;
    html_body: string;
    is_active: boolean;
    sms_route?: string;
    variables?: Record<string, string | number | boolean>;
  }>({
    channel: "SMS" as CreativeChannel,
    locale: "en",
    title: "",
    text_body: "",
    html_body: "",
    is_active: true,
    sms_route: "",
    variables: {},
  });
  const [showVariableSelectorAdd, setShowVariableSelectorAdd] = useState(false);
  const [activeFieldAdd, setActiveFieldAdd] = useState<"title" | "body">(
    "body",
  );
  const [cursorPositionAdd, setCursorPositionAdd] = useState<number>(0);
  const [selectedVariablesAdd, setSelectedVariablesAdd] = useState<
    TemplateVariable[]
  >([]);
  const titleInputRefAdd = useRef<HTMLInputElement>(null);
  const bodyTextareaRefAdd = useRef<HTMLTextAreaElement>(null);
  const [isRichTextAdd, setIsRichTextAdd] = useState(false);
  const [newCreativeVariables, setNewCreativeVariables] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );

  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<{
    rendered_title?: string;
    rendered_text_body?: string;
    rendered_html_body?: string;
  } | null>(null);

  // Campaign Flows state
  const [campaignFlows, setCampaignFlows] = useState<
    Array<{
      campaign_id: number;
      campaign_name: string;
      segment_id: number;
      segment_name: string;
      flow_type: string;
      wait_interval_hours: number;
    }>
  >([]);
  const [isLoadingCampaignFlows, setIsLoadingCampaignFlows] = useState(false);

  // Flow type mapping (same as CampaignDetailsPage)
  const flowTypeOptions = [
    {
      value: "STANDARD",
      label: "Multiple Target Group",
      backendType: "STANDARD",
    },
    {
      value: "AB_TEST",
      label: "A/B Test",
      backendType: "AB_TEST",
    },
    {
      value: "CHAMPION_CHALLENGER",
      label: "Champion-Challenger",
      backendType: "CHAMPION_CHALLENGER",
    },
    {
      value: "ROUND_ROBIN",
      label: "Round Robin",
      backendType: "ROUND_ROBIN",
    },
    {
      value: "MULTIPLE_LEVEL",
      label: "Multiple Level",
      backendType: "MULTIPLE_LEVEL",
    },
  ];

  const getFlowTypeLabel = (flowType: string): string => {
    const option = flowTypeOptions.find((opt) => opt.backendType === flowType);
    return option?.label || flowType;
  };

  // Load creative templates from API
  const [apiTemplates, setApiTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setTemplatesLoading(true);
        const response = await creativeTemplateService.getCreativeTemplates();
        const templatesData = response?.data || response || [];
        setApiTemplates(Array.isArray(templatesData) ? templatesData : []);
      } catch (err) {
        console.error("Failed to load creative templates:", err);
        setApiTemplates([]);
      } finally {
        setTemplatesLoading(false);
      }
    };
    loadTemplates();
  }, []);

  const templates = apiTemplates;

  // Load languages from configuration
  const { data: languages } = useConfigurationData("languages");

  // Load sender IDs and SMS routes from API
  const [senderIds, setSenderIds] = useState<SenderId[]>([]);
  const [senderIdsLoading, setSenderIdsLoading] = useState(true);
  const [smsRoutes, setSmsRoutes] = useState<any[]>([]);
  const [smsRoutesLoading, setSmsRoutesLoading] = useState(true);

  // Fetch sender IDs on component mount
  useEffect(() => {
    const fetchSenderIds = async () => {
      try {
        setSenderIdsLoading(true);
        const response = await senderIdService.getSenderIds();
        const senderIdData = response.data || [];
        setSenderIds(Array.isArray(senderIdData) ? senderIdData : []);
      } catch (error) {
        console.error("Failed to fetch sender IDs:", error);
        setSenderIds([]);
      } finally {
        setSenderIdsLoading(false);
      }
    };
    fetchSenderIds();
  }, []);

  // Fetch SMS routes on component mount
  useEffect(() => {
    const fetchSmsRoutes = async () => {
      try {
        setSmsRoutesLoading(true);
        const routesData = await smsRouteService.getAllRoutes();
        setSmsRoutes(Array.isArray(routesData) ? routesData : []);
      } catch (error) {
        console.error("Failed to fetch SMS routes:", error);
        setSmsRoutes([]);
      } finally {
        setSmsRoutesLoading(false);
      }
    };
    fetchSmsRoutes();
  }, []);

  // Helper function to calculate SMS segments
  const calculateSMSSegments = (
    messageText: string,
    senderId: string = "",
  ): { totalChars: number; smsCount: number } => {
    if (!messageText && !senderId) {
      return { totalChars: 0, smsCount: 0 };
    }

    // Sender ID is prepended with ": " (2 chars) if message exists
    const senderIdPrefix = senderId ? `${senderId}: ` : "";
    const fullMessage = senderIdPrefix + messageText;
    const totalChars = fullMessage.length;

    if (totalChars === 0) {
      return { totalChars: 0, smsCount: 0 };
    }

    // Calculate SMS segments
    // First segment: 160 characters
    // Subsequent segments: 153 characters each
    if (totalChars <= 160) {
      return { totalChars, smsCount: 1 };
    }

    // More than 160 chars - calculate segments
    const remainingChars = totalChars - 160;
    const additionalSegments = Math.ceil(remainingChars / 153);
    return { totalChars, smsCount: 1 + additionalSegments };
  };

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

  // Filter templates by channel and locale
  const getTemplatesForChannelAndLocale = (
    channel: CreativeChannel,
    locale: string,
  ) => {
    return (templates as ConfigurationItem[]).filter((template) => {
      if (!template.isActive) return false;

      // Check if template matches channel
      const matchesChannel =
        template.metadataValue?.toLowerCase() === channel.toLowerCase();

      // Check if template has locale field
      // If template doesn't have locale specified, show it for all locales (backward compatibility)
      // If template has locale, it must match the creative's locale
      const templateLocale = template.locale;
      const matchesLocale = !templateLocale || templateLocale === locale;

      return matchesChannel && matchesLocale;
    });
  };

  // Get available templates for current channel and locale
  const availableTemplates = useMemo(
    () =>
      getTemplatesForChannelAndLocale(
        newCreativeForm.channel,
        newCreativeForm.locale,
      ),
    [newCreativeForm.channel, newCreativeForm.locale, templates],
  );

  // Add product modal state
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [selectedProductsToAdd, setSelectedProductsToAdd] = useState<Product[]>(
    [],
  );
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [productsSearchLoading, setProductsSearchLoading] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProductCategory, setSelectedProductCategory] =
    useState<string>("all");
  const [productCategories, setProductCategories] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [isLinkingProducts, setIsLinkingProducts] = useState(false);
  const [createProductModalOpen, setCreateProductModalOpen] = useState(false);

  // Close More menu when clicking outside
  useClickOutside(moreMenuRef, () => setShowMoreMenu(false));

  // Map communication channel ID to creative channel
  const getChannelFromOfferId = (channelId?: number): CreativeChannel => {
    switch (channelId) {
      case 2:
        return "SMS";
      case 3:
        return "USSD";
      case 4:
        return "Email";
      case 5:
        return "Push";
      case 6:
        return "WhatsApp";
      default:
        return "SMS";
    }
  };

  const resetNewCreativeForm = () => {
    const offerChannel = getChannelFromOfferId(offer?.communication_channel_id);
    setNewCreativeForm({
      channel: offerChannel,
      locale: "en",
      title: "",
      text_body: "",
      html_body: "",
      is_active: true,
      sms_route: "",
      variables: {},
    });
    setNewCreativeVariables("");
    setSelectedTemplateId(null);
    setPreviewResult(null);
    setIsPreviewOpen(false);
    setSelectedVariablesAdd([]);
    setShowVariableSelectorAdd(false);
  };

  const handleVariableSelectAdd = (variable: TemplateVariable) => {
    if (!selectedVariablesAdd.find((v) => v.id === variable.id)) {
      setSelectedVariablesAdd((prev) => [...prev, variable]);
    }

    if (activeFieldAdd === "title") {
      const result = insertVariableAtCursor(
        newCreativeForm.title || "",
        cursorPositionAdd,
        variable,
      );
      setNewCreativeForm((prev) => ({ ...prev, title: result.newText }));
      setTimeout(() => {
        if (titleInputRefAdd.current) {
          titleInputRefAdd.current.setSelectionRange(
            result.newCursorPosition,
            result.newCursorPosition,
          );
          titleInputRefAdd.current.focus();
        }
      }, 0);
    } else {
      if (newCreativeForm.channel === "Email" && isRichTextAdd) {
        const placeholder = formatVariablePlaceholder(variable);
        const newBody = `${newCreativeForm.text_body || ""} ${placeholder} `;
        setNewCreativeForm((prev) => ({ ...prev, text_body: newBody }));
      } else {
        const result = insertVariableAtCursor(
          newCreativeForm.text_body || "",
          cursorPositionAdd,
          variable,
        );
        setNewCreativeForm((prev) => ({ ...prev, text_body: result.newText }));
        setTimeout(() => {
          if (bodyTextareaRefAdd.current) {
            bodyTextareaRefAdd.current.setSelectionRange(
              result.newCursorPosition,
              result.newCursorPosition,
            );
            bodyTextareaRefAdd.current.focus();
          }
        }, 0);
      }
    }

    setShowVariableSelectorAdd(false);
  };

  const getCharacterInfoAdd = (text: string) => {
    const charCount = text.length;
    const isUnicode = /[^\x00-\x7F]/.test(text);
    const singleSegmentLimit = isUnicode ? 70 : 160;
    const multiSegmentLimit = isUnicode ? 67 : 153;
    let segments = 1;
    if (charCount > singleSegmentLimit) {
      segments = Math.ceil(charCount / multiSegmentLimit);
    }
    return { charCount, segments, isUnicode };
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: number | null) => {
    if (!templateId) {
      setSelectedTemplateId(null);
      return;
    }

    const template = templates.find((t) => t.id === templateId) as
      | ConfigurationItem
      | undefined;
    if (!template) return;

    setSelectedTemplateId(templateId);

    // Get template variables (default values)
    const templateVariables = template.variables || {};

    // Update form with template content (replace placeholders with actual values)
    setNewCreativeForm((prev) => ({
      ...prev,
      // Set channel if template has a specific channel
      channel: (template.metadataValue as CreativeChannel) || prev.channel,
      // Populate title, text_body, html_body if template has them
      title: template.title
        ? replaceVariables(template.title, templateVariables)
        : prev.title,
      text_body: template.text_body
        ? replaceVariables(template.text_body, templateVariables)
        : prev.text_body,
      html_body: template.html_body
        ? replaceVariables(template.html_body, templateVariables)
        : prev.html_body,
    }));

    // Update variables JSON
    if (template.variables) {
      setNewCreativeVariables(JSON.stringify(template.variables, null, 2));
    }
  };

  // Handle preview button click
  const handlePreview = () => {
    // Parse variables from JSON
    let parsedVariables: Record<string, string | number | boolean> = {};
    if (newCreativeVariables.trim()) {
      try {
        parsedVariables = JSON.parse(newCreativeVariables);
      } catch {
        // Invalid JSON, use empty object
      }
    }

    // Create client-side preview (creative not saved yet)
    const clientPreview = {
      rendered_title: replaceVariables(
        newCreativeForm.title || "",
        parsedVariables,
      ),
      rendered_text_body: replaceVariables(
        newCreativeForm.text_body || "",
        parsedVariables,
      ),
      rendered_html_body: replaceVariables(
        newCreativeForm.html_body || "",
        parsedVariables,
      ),
    };

    setPreviewResult(clientPreview);
    setIsPreviewOpen(true);
  };

  const loadOffer = useCallback(
    async (skipCache: boolean = true) => {
      try {
        setLoading(true);
        setError(null);

        const response = await offerService.getOfferById(Number(id), skipCache);

        // Extract offer from response.data
        const offerData = response.data;
        setOffer(offerData);

        // Fetch category name if category_id exists
        if (offerData.category_id) {
          try {
            const categoriesResponse =
              await offerCategoryService.getAllCategories({
                limit: 100,
                skipCache: true,
              });
            const categories =
              (categoriesResponse as { data?: OfferCategoryType[] }).data ||
              (categoriesResponse as unknown as OfferCategoryType[]);
            const category = categories.find(
              (cat: OfferCategoryType) =>
                String(cat.id) === String(offerData.category_id),
            );
            if (category) {
              setCategoryName(category.name);
            }
          } catch {
            // Failed to fetch category name
          }
        }
      } catch (err) {
        console.error("Failed to load offer:", err);
        showError("Failed to load offer", "Please try again later.");
        setError(""); // Clear error state
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  const loadProducts = useCallback(
    async (
      skipCache: boolean = false,
      preservePrimaryProductId?: number | null,
    ) => {
      if (!id) return;

      try {
        setProductsLoading(true);

        // Get products using new endpoint
        const productsResponse = await offerService.getProductsByOffer(
          Number(id),
          { skipCache },
        );

        // Try to get primary product from dedicated endpoint first (more efficient)
        // If endpoint doesn't exist (404), we'll get it from products list below
        // BUT: If preservePrimaryProductId is provided, use that instead (to avoid stale data)
        let primaryProductIdFromEndpoint: number | null = null;

        if (preservePrimaryProductId !== undefined) {
          // We have a primaryProductId to preserve (e.g., just set via API)
          primaryProductIdFromEndpoint = preservePrimaryProductId;
          if (preservePrimaryProductId !== null) {
            setPrimaryProductId(preservePrimaryProductId);
          }
        } else {
          // Normal flow: fetch from endpoint
          try {
            const primaryResponse = await offerService.getPrimaryProductByOffer(
              Number(id),
              skipCache,
            );
            if (primaryResponse.data && primaryResponse.data.product_id) {
              primaryProductIdFromEndpoint = primaryResponse.data.product_id;
              const primaryId = Number(primaryResponse.data.product_id);
              setPrimaryProductId(primaryId);
            }
          } catch (err: any) {
            // 404 is expected if endpoint doesn't exist - we'll get it from products list instead
            // Silently ignore 404 errors
            const errorMessage = err?.message || String(err) || "";
            if (
              !errorMessage.includes("404") &&
              !errorMessage.includes("Not Found")
            ) {
              // Non-404 error, but we'll continue with products list fallback
            }
          }
        }

        // Use legacy method for compatibility
        const response = await offerService.getOfferProducts(
          Number(id),
          skipCache,
        );

        // Extract products from response.data
        const productsData = response.data;

        if (Array.isArray(productsData) && productsData.length > 0) {
          // Deduplicate links by product_id - if multiple links exist for same product,
          // keep the primary one, or the first one if none is primary
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const uniqueLinksMap = new Map<number, any>();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          productsData.forEach((link: any) => {
            const productId = link.product_id;
            if (!uniqueLinksMap.has(productId)) {
              uniqueLinksMap.set(productId, link);
            } else {
              // If we already have this product, prefer the primary one
              const existingLink = uniqueLinksMap.get(productId);
              if (link.is_primary && !existingLink.is_primary) {
                uniqueLinksMap.set(productId, link);
              }
            }
          });
          const uniqueLinks = Array.from(uniqueLinksMap.values());

          // Backend returns product links with only product_id, so we need to fetch full product details
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const productDetailsPromises = uniqueLinks.map(async (link: any) => {
            try {
              const productResponse = await productService.getProductById(
                link.product_id,
                skipCache,
              );
              const productData =
                (productResponse as { data?: unknown }).data || productResponse;

              return {
                ...productData,
                is_primary: link.is_primary,
                link_id: link.id,
                product_id: link.product_id,
              };
            } catch {
              // Failed to fetch product details
              return {
                id: link.product_id,
                name: `Product ${link.product_id}`,
                is_primary: link.is_primary,
                link_id: link.id,
                product_id: link.product_id,
              };
            }
          });

          const fullProducts = await Promise.all(productDetailsPromises);
          setLinkedProducts(fullProducts);

          // Update primaryProductId from products list
          // Only if we didn't get it from the endpoint (fallback for when endpoint doesn't exist)
          if (!primaryProductIdFromEndpoint) {
            const primaryProduct = fullProducts.find(
              (p: any) => p.is_primary === true,
            );
            if (primaryProduct && primaryProduct.product_id) {
              const primaryId = Number(primaryProduct.product_id);
              setPrimaryProductId(primaryId);
            } else {
              setPrimaryProductId(null);
            }
          }
        } else {
          setLinkedProducts([]);
        }
      } catch {
        setLinkedProducts([]);
      } finally {
        setProductsLoading(false);
      }
    },
    [id],
  );

  const loadCreatives = useCallback(
    async (skipCache: boolean = false) => {
      if (!id) return;

      try {
        setCreativesLoading(true);
        const response = await offerCreativeService.getByOffer(Number(id), {
          limit: 100,
          skipCache,
        });
        const creativesData = response.data || [];
        setOfferCreatives(creativesData);
      } catch {
        setOfferCreatives([]);
      } finally {
        setCreativesLoading(false);
      }
    },
    [id],
  );

  const loadCampaignFlows = useCallback(
    async (skipCache: boolean = false) => {
      if (!id) return;

      try {
        setIsLoadingCampaignFlows(true);
        const response = await campaignFlowService.getCampaignFlowsByOffer(
          Number(id),
        );
        if (response && response.success && Array.isArray(response.data)) {
          // Transform API response to display format
          const flows = response.data.map((flow: any) => ({
            campaign_id: flow.campaign_id,
            campaign_name: flow.campaign_name || `Campaign${flow.campaign_id}`,
            segment_id: flow.segment_id,
            segment_name: flow.segment_name || `Segment${flow.segment_id}`,
            flow_type: flow.flow_type,
            wait_interval_hours: flow.wait_interval_hours,
          }));
          setCampaignFlows(flows);
        } else {
          setCampaignFlows([]);
        }
      } catch (err) {
        console.warn("Failed to load campaign flows:", err);
        setCampaignFlows([]);
      } finally {
        setIsLoadingCampaignFlows(false);
      }
    },
    [id],
  );

  // Handle edit creative
  const handleEditCreative = async (creative: OfferCreative) => {
    if (!creative.id) return;

    try {
      setIsSavingCreative(true);
      const response = await offerCreativeService.getById(Number(creative.id), true);
      const fullCreativeData = response.data;
      setEditingCreative(fullCreativeData);
      setIsEditCreativeModalOpen(true);
    } catch (err) {
      console.error("Failed to load creative details:", err);
      showError("Failed to load creative", "Please try again later.");
    } finally {
      setIsSavingCreative(false);
    }
  };

  // Handle delete creative
  const handleDeleteCreative = (creative: OfferCreative) => {
    setCreativeToDelete(creative);
    setShowDeleteCreativeModal(true);
  };

  const handleConfirmDeleteCreative = async () => {
    if (!creativeToDelete) return;

    setIsDeletingCreative(true);
    try {
      await offerCreativeService.delete(creativeToDelete.id as number);
      success("Creative Deleted", "Creative has been deleted successfully");
      setShowDeleteCreativeModal(false);
      setCreativeToDelete(null);

      // Optimistically remove from state instead of reloading
      setOfferCreatives((prev) =>
        prev.filter((c) => c.id !== creativeToDelete.id)
      );
    } catch (err) {
      console.error("Failed to delete creative:", err);
      showError("Failed to delete creative", "Please try again later.");
    } finally {
      setIsDeletingCreative(false);
    }
  };

  const handleCancelDeleteCreative = () => {
    setShowDeleteCreativeModal(false);
    setCreativeToDelete(null);
  };

  const handleCreateCreative = async () => {
    if (!id) {
      showError("Offer ID is missing. Please refresh and try again.");
      return;
    }

    if (!user?.user_id) {
      showError("User information not available. Please log in again.");
      return;
    }

    if (
      !newCreativeForm.title.trim() &&
      !newCreativeForm.text_body.trim() &&
      !newCreativeForm.html_body.trim()
    ) {
      showError(
        "Provide at least a title, text body, or HTML body before creating a creative.",
      );
      return;
    }

    let parsedVariables: Record<string, string | number | boolean> | undefined;

    // Start with variables from form (e.g., SMS route)
    if (
      newCreativeForm.variables &&
      Object.keys(newCreativeForm.variables).length > 0
    ) {
      parsedVariables = { ...newCreativeForm.variables };
    }

    // Merge with variables from JSON textarea
    if (newCreativeVariables.trim()) {
      try {
        const parsed = JSON.parse(newCreativeVariables);
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          showError("Variables JSON must be an object with key/value pairs.");
          return;
        }
        parsedVariables = {
          ...(parsedVariables || {}),
          ...parsed,
        };
      } catch {
        showError("Invalid JSON in variables field");
        return;
      }
    }

    try {
      setIsCreatingCreative(true);

      // Generate a name for the creative (use title if available, otherwise channel + locale)
      const creativeName = newCreativeForm.title.trim()
        ? newCreativeForm.title.trim()
        : `${newCreativeForm.channel} - ${newCreativeForm.locale}`;

      const payload: CreateOfferCreativeRequest = {
        offer_id: Number(id),
        channel: newCreativeForm.channel,
        locale: newCreativeForm.locale,
        name: creativeName,
        is_active: newCreativeForm.is_active,
        created_by: user.user_id,
      };

      if (newCreativeForm.title.trim()) {
        payload.title = newCreativeForm.title.trim();
      }
      if (newCreativeForm.text_body.trim()) {
        payload.text_body = newCreativeForm.text_body.trim();
      }
      if (newCreativeForm.html_body.trim()) {
        payload.html_body = newCreativeForm.html_body.trim();
      }
      if (parsedVariables && Object.keys(parsedVariables).length > 0) {
        payload.variables = parsedVariables;
      }

      await offerCreativeService.create(payload);
      success("Creative Created", "Creative has been created successfully.");
      setIsAddCreativeModalOpen(false);
      resetNewCreativeForm();
      loadCreatives(true);
    } catch (err) {
      console.error("Failed to create creative:", err);
      showError("Failed to create creative", "Please try again later.");
    } finally {
      setIsCreatingCreative(false);
    }
  };

  // Load product categories for filter
  const loadProductCategories = useCallback(async () => {
    try {
      const response = await productCategoryService.getAllCategories({
        limit: 100,
        skipCache: true,
      });
      const categoryOptions = [
        { value: "all", label: "All Categories" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(response.data || []).map((category: any) => ({
          value: category.id.toString(),
          label: category.name,
        })),
      ];
      setProductCategories(categoryOptions);
    } catch {
      // Error loading categories
      setProductCategories([{ value: "all", label: "All Categories" }]);
    }
  }, []);

  // Load available products for selection
  const loadAvailableProducts = useCallback(async () => {
    try {
      setProductsSearchLoading(true);
      const searchQuery = productSearchTerm.trim();

      let products: Product[] = [];
      const limit = 100;
      let offset = 0;
      let hasMore = true;

      if (searchQuery) {
        // Use searchProducts when there's a search term (no pagination needed for search)
        const response = await productService.searchProducts({
          q: searchQuery,
          limit: 100,
          skipCache: true,
        });
        products = response.data || [];
      } else {
        // Use getActiveProducts with pagination for non-search (all active products)
        while (hasMore) {
          const response = await productService.getActiveProducts({
            limit: limit,
            offset: offset,
            skipCache: true,
          });

          const responseProducts = response.data || [];
          products.push(...responseProducts);

          const total = response.pagination?.total || 0;
          hasMore =
            products.length < total && responseProducts.length === limit;
          offset += limit;
        }
      }

      // Filter to only show active products (for search results)
      products = products.filter((product: Product) => product.is_active);

      // Apply category filter if not 'all'
      if (selectedProductCategory !== "all") {
        products = products.filter(
          (product: Product) =>
            product.category_id?.toString() === selectedProductCategory,
        );
      }

      // Sort by created_at descending (recently created first)
      products = products.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      setAvailableProducts(products);
    } catch {
      // Failed to load products
      setAvailableProducts([]);
    } finally {
      setProductsSearchLoading(false);
    }
  }, [productSearchTerm, selectedProductCategory]);

  // Load categories when modal opens
  useEffect(() => {
    if (isAddProductModalOpen) {
      loadProductCategories();
    }
  }, [isAddProductModalOpen, loadProductCategories]);

  // Load products when modal opens, search changes, or category changes
  useEffect(() => {
    if (isAddProductModalOpen) {
      loadAvailableProducts();
    }
  }, [isAddProductModalOpen, loadAvailableProducts]);

  // Toggle product selection
  const toggleProductSelection = (product: Product) => {
    const isSelected = selectedProductsToAdd.some((p) => p.id === product.id);
    if (isSelected) {
      setSelectedProductsToAdd(
        selectedProductsToAdd.filter((p) => p.id !== product.id),
      );
    } else {
      setSelectedProductsToAdd([...selectedProductsToAdd, product]);
    }
  };

  // Handle adding products after selection
  const handleConfirmAddProducts = async () => {
    if (!id || !user?.user_id || selectedProductsToAdd.length === 0) return;

    try {
      setIsLinkingProducts(true);

      // Check if offer currently has a primary product
      const currentPrimaryExists = linkedProducts.some((p) => p.is_primary);

      // Prepare links for batch linking
      const links = selectedProductsToAdd.map((product, index) => ({
        offer_id: Number(id),
        product_id:
          typeof product.id === "string" ? parseInt(product.id) : product.id!,
        is_primary: !currentPrimaryExists && index === 0, // First product is primary if no primary exists
        quantity: 1,
      }));

      const batchRequest = {
        links: links,
        created_by: user.user_id,
      };

      await offerService.linkProductsBatch(batchRequest);

      success(
        "Products Linked",
        `${selectedProductsToAdd.length} product${
          selectedProductsToAdd.length > 1 ? "s" : ""
        } linked successfully`,
      );

      // Reset state and close modal
      setIsAddProductModalOpen(false);
      setSelectedProductsToAdd([]);
      setProductSearchTerm("");

      // Refresh products list
      loadProducts(true);
    } catch (err) {
      console.error("Failed to link products:", err);
      showError("Failed to link products", "Please try again later.");
    } finally {
      setIsLinkingProducts(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadOffer(true); // Skip cache for fresh data
      loadProducts(true); // Skip cache for fresh data
      loadCreatives(true); // Skip cache for fresh data
      loadCampaignFlows(true); // Skip cache for fresh data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Consolidated offer action handler for details page
  interface OfferDetailActionParams {
    action:
      | "approve"
      | "reject"
      | "request_approval"
      | "activate"
      | "pause"
      | "expire"
      | "archive"
      | "unarchive";
    successMessage: string;
    updateFields: Partial<Offer>;
    onSuccess?: () => void;
  }

  const handleOfferDetailAction = async (params: OfferDetailActionParams) => {
    if (!offer || !user?.user_id) return;
    const { action, successMessage, updateFields, onSuccess } = params;

    try {
      switch (action) {
        case "approve":
          await offerService.approveOffer(Number(id), {
            approved_by: user.user_id,
          });
          break;
        case "reject":
          await offerService.rejectOffer(Number(id), {
            rejected_by: user.user_id,
          });
          break;
        case "request_approval":
          await offerService.submitForApproval(Number(id), {});
          break;
        case "activate":
          await offerService.updateOfferStatus(Number(id), {
            status: OfferStatusEnum.ACTIVE,
          });
          break;
        case "pause":
          await offerService.updateOfferStatus(Number(id), {
            status: OfferStatusEnum.PAUSED,
          });
          break;
        case "expire":
          await offerService.updateOfferStatus(Number(id), {
            status: OfferStatusEnum.EXPIRED,
          });
          break;
        case "archive":
          await offerService.updateOfferStatus(Number(id), {
            status: OfferStatusEnum.ARCHIVED,
          });
          break;
        case "unarchive":
          await offerService.unarchiveOffer(Number(id));
          break;
      }

      // Update offer state (optimistic UI)
      setOffer((prev) => (prev ? { ...prev, ...updateFields } : prev));
      success(successMessage.split(":")[0], successMessage);

      // Execute success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      showError(`Failed to ${action} offer`);
    }
  };

  const handleDelete = () => {
    if (!offer) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!offer) return;

    setIsDeleting(true);
    try {
      await offerService.deleteOffer(Number(id));
      success(
        "Offer Deleted",
        `"${offer.name}" has been deleted successfully.`,
      );
      setShowDeleteModal(false);
      navigate("/dashboard/offers");
    } catch {
      showError("Failed to delete offer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleApprove = async () => {
    if (!user?.user_id) {
      showError("Error", "User ID not available. Please log in again.");
      return;
    }
    setIsApproveLoading(true);
    try {
      await handleOfferDetailAction({
        action: "approve",
        successMessage: `Offer Approved: "${offer?.name}" has been approved successfully.`,
        updateFields: {
          status: OfferStatusEnum.APPROVED,
          approval_status: "approved",
        },
      });
    } finally {
      setIsApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!user?.user_id) {
      showError("Error", "User ID not available. Please log in again.");
      return;
    }
    setIsRejectLoading(true);
    try {
      await handleOfferDetailAction({
        action: "reject",
        successMessage: `Offer Rejected: "${offer?.name}" has been rejected.`,
        updateFields: {
          status: OfferStatusEnum.REJECTED,
          approval_status: "rejected",
        },
      });
    } finally {
      setIsRejectLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    setIsRequestApprovalLoading(true);
    try {
      await handleOfferDetailAction({
        action: "request_approval",
        successMessage:
          "Approval Requested: Your approval request has been submitted successfully.",
        updateFields: {
          status: OfferStatusEnum.PENDING_APPROVAL,
          approval_status: "pending",
        },
      });
    } finally {
      setIsRequestApprovalLoading(false);
    }
  };

  const handleActivate = async () => {
    setIsActivateLoading(true);
    try {
      await handleOfferDetailAction({
        action: "activate",
        successMessage: `Offer Activated: "${offer?.name}" is now active.`,
        updateFields: { status: OfferStatusEnum.ACTIVE },
      });
    } finally {
      setIsActivateLoading(false);
    }
  };

  const handlePause = async () => {
    setIsPauseLoading(true);
    try {
      await handleOfferDetailAction({
        action: "pause",
        successMessage: `Offer Paused: "${offer?.name}" has been paused.`,
        updateFields: { status: OfferStatusEnum.PAUSED },
      });
    } finally {
      setIsPauseLoading(false);
    }
  };

  const handleConfirmExpire = async () => {
    setIsExpireLoading(true);
    try {
      await handleOfferDetailAction({
        action: "expire",
        successMessage: `Offer Expired: "${offer?.name}" has been expired.`,
        updateFields: { status: OfferStatusEnum.EXPIRED },
        onSuccess: () => setShowExpireModal(false),
      });
    } finally {
      setIsExpireLoading(false);
    }
  };

  const handleConfirmArchive = async () => {
    setIsArchiving(true);
    try {
      await handleOfferDetailAction({
        action: "archive",
        successMessage: `Offer Archived: "${offer?.name}" has been archived.`,
        updateFields: { status: OfferStatusEnum.ARCHIVED },
        onSuccess: () => setShowArchiveModal(false),
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    setIsUnarchiving(true);
    try {
      await handleOfferDetailAction({
        action: "unarchive",
        successMessage: `Offer Unarchived: "${offer?.name}" has been unarchived.`,
        updateFields: { status: OfferStatusEnum.DRAFT },
      });
    } finally {
      setIsUnarchiving(false);
    }
  };

  const handleConfirmUnlinkProduct = async () => {
    if (!productToUnlink) return;

    try {
      setUnlinkingProductId(productToUnlink.linkId);

      // Check if this is the primary product
      const isPrimary = productToUnlink.productId === primaryProductId;

      // Unlink the product completely (whether it was primary or not)
      // The backend will automatically remove primary status if this is the primary product
      await offerService.unlinkProductById(productToUnlink.linkId);

      // Clear primary product from state if it was the primary
      if (isPrimary) {
        setPrimaryProductId(null);
      }

      success(
        "Product Unlinked",
        `"${productToUnlink.name}" has been unlinked from this offer.`,
      );

      setShowUnlinkModal(false);
      setProductToUnlink(null);
      loadProducts(true); // Skip cache to get fresh data after unlinking
    } catch {
      showError("Failed to unlink product");
    } finally {
      setUnlinkingProductId(null);
    }
  };

  const handleEditProduct = (productId: number) => {
    navigate(`/dashboard/products/${productId}/edit`, {
      state: {
        returnTo: buildOfferReturnState("products"),
      },
    });
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setIsDeletingProduct(true);
      await productService.deleteProduct(productToDelete.id);
      success(
        "Product Deleted",
        `"${productToDelete.name}" has been deleted. It will also be unlinked from this offer.`,
      );
      setShowDeleteProductModal(false);
      setProductToDelete(null);
      loadProducts(true); // Skip cache to get fresh data after deletion
    } catch (err) {
      // Extract backend error message
      const errorMessage =
        (err instanceof Error ? err.message : null) ||
        (typeof err === "object" && err !== null && "error" in err
          ? String((err as Record<string, unknown>).error)
          : null) ||
        "Failed to delete product. Please try again.";
      // Bypass silent mode for delete operations to always show error
      showError("Cannot Delete Product", errorMessage, true);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleSetPrimaryProduct = async (
    productId: number,
    productName: string,
  ) => {
    if (!user?.user_id) {
      showError("Error", "User ID not available. Please log in again.");
      return;
    }

    // Check if there's already a primary product
    let existingPrimaryLink: OfferProductLink | null = null;
    try {
      const primaryResponse = await offerService.getPrimaryProductByOffer(
        Number(id),
        true,
      );
      if (primaryResponse.success && primaryResponse.data) {
        existingPrimaryLink = primaryResponse.data;
      }
    } catch (err) {
      // No primary product exists (expected if none set)
    }

    let confirmed = true;
    if (existingPrimaryLink && existingPrimaryLink.product_id !== productId) {
      // Get the name of the current primary product
      const currentPrimaryProduct = linkedProducts.find(
        (p: any) => p.product_id === existingPrimaryLink.product_id,
      );
      const currentPrimaryName =
        currentPrimaryProduct?.name ||
        `Product ${existingPrimaryLink.product_id}`;

      confirmed = await confirm({
        title: "Set Primary Product",
        message: `Setting "${productName}" as the primary product will replace the current primary product (${currentPrimaryName}). The previous primary product will remain linked but will no longer be primary. Do you want to continue?`,
        confirmText: "Set as Primary",
        cancelText: "Cancel",
        type: "info",
      });
    }

    if (!confirmed) return;

    try {
      setSettingPrimaryId(productId);

      // Use the new endpoint to set primary product
      // This will automatically handle setting the old primary to null
      const response = await offerService.setPrimaryProduct(
        Number(id),
        productId,
      );

      // Update primaryProductId state immediately from response
      let newPrimaryProductId: number | null = null;
      if (response.data?.primary_product_id) {
        newPrimaryProductId = Number(response.data.primary_product_id);
        setPrimaryProductId(newPrimaryProductId);
      } else if (productId === null) {
        newPrimaryProductId = null;
        setPrimaryProductId(null);
      } else {
        newPrimaryProductId = productId;
        setPrimaryProductId(productId);
      }

      // Update offer state with the new primary_product_id (no need to refetch offer)
      if (response.data) {
        setOffer((prev) => ({
          ...prev,
          ...response.data,
        }));
      }

      // Optimistically update linkedProducts state instead of reloading
      // This avoids reloading the entire products table
      setLinkedProducts((prevProducts) =>
        prevProducts.map((p) => ({
          ...p,
          is_primary: p.product_id === newPrimaryProductId ? true : false,
        }))
      );

      success(
        "Primary Product Set",
        `"${productName}" is now the primary product for this offer.`,
      );
    } catch (err) {
      // Failed to set primary product - show generic message only
      showError(
        "Failed to set primary",
        "Unable to set this product as primary. Please try again.",
        true,
      );
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const offerDetailsPath = id ? `/dashboard/offers/${id}` : "/dashboard/offers";

  const buildOfferReturnState = (section: "products" | "creatives") => ({
    pathname: offerDetailsPath,
    section,
  });

  const navigateToProductDetails = (productId: number) => {
    navigate(`/dashboard/products/${productId}`, {
      state: {
        returnTo: buildOfferReturnState("products"),
      },
    });
  };

  const navigateToCreativeDetails = (creativeId: number) => {
    navigate(`/dashboard/offer-creatives/${creativeId}`, {
      state: {
        returnTo: buildOfferReturnState("creatives"),
      },
    });
  };

  // Generate dummy offer type based on offer characteristics
  // Using the same types as in CreateOfferPage dropdown
  const getOfferType = (offer: Offer) => {
    const offerTypes = [
      "STV",
      "Short Text (SMS/USSD)",
      "Email",
      "Voice Push",
      "WAP Push",
      "Rich Media",
    ];

    // Use offer ID to consistently assign the same type
    const typeIndex = Number(offer.id) % offerTypes.length;
    return offerTypes[typeIndex];
  };

  const getLifecycleStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "bg-green-100", text: "text-green-800", icon: Play };
      case "paused":
        return { bg: "bg-yellow-100", text: "text-yellow-800", icon: Pause };
      case "draft":
        return { bg: "bg-gray-100", text: "text-gray-800", icon: AlertCircle };
      case "archived":
        return { bg: "bg-red-100", text: "text-red-800", icon: Archive };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", icon: AlertCircle };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className={`text-xl font-semibold ${tw.textPrimary} mb-2`}>
            Offer Not Found
          </h2>
          <p className={`${tw.textSecondary} mb-4`}>
            The offer you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() =>
              navigateBackOrFallback(navigate, "/dashboard/offers")
            }
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200`}
            style={{ backgroundColor: color.primary.action }}
          >
            Back to Offers
          </button>
        </div>
      </div>
    );
  }

  // Helper function to determine if offer is approved
  const isApproved =
    offer.status === "approved" ||
    offer.status === "active" ||
    offer.status === "paused" ||
    offer.status === "expired";
  const isPending = offer.status === "pending_approval";
  const isRejected = offer.status === "rejected";
  const isActive = offer.status === "active";
  const isPaused = offer.status === "paused";
  const isDraft = offer.status === "draft";
  const isExpired = offer.status === "expired";
  const isArchived = offer.status === "archived";

  const statusColor = getLifecycleStatusColor(offer.status);
  const StatusIcon = statusColor.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton
          fallbackTo="/dashboard/offers"
          onClick={handleBack}
          showBreadcrumb={true}
          currentLabel="Offer Details"
        />
        <div className="flex flex-wrap items-center gap-2">
          {/* Draft: Submit for Approval */}
          {isDraft && (
            <button
              onClick={handleRequestApproval}
              disabled={isRequestApprovalLoading}
              className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isRequestApprovalLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {isRequestApprovalLoading
                ? "Submitting..."
                : "Submit for Approval"}
            </button>
          )}

          {/* Pending Approval: Approve/Reject */}
          {isPending && (
            <>
              <button
                onClick={handleApprove}
                disabled={isApproveLoading}
                className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: color.primary.action }}
              >
                {isApproveLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {isApproveLoading ? "Approving..." : "Approve"}
              </button>
            </>
          )}

          {/* Approved: Activate */}
          {offer.status === OfferStatusEnum.APPROVED &&
            !isExpired &&
            !isArchived && (
              <button
                onClick={handleActivate}
                disabled={isActivateLoading}
                className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: color.primary.action }}
              >
                {isActivateLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isActivateLoading ? "Activating..." : "Activate"}
              </button>
            )}

          {/* Rejected: Request Approval (to resubmit) */}
          {isRejected && (
            <button
              onClick={handleRequestApproval}
              disabled={isRequestApprovalLoading}
              className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isRequestApprovalLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {isRequestApprovalLoading ? "Requesting..." : "Request Approval"}
            </button>
          )}

          {/* Lifecycle Actions - Only show if active/paused AND not expired/archived */}
          {(isActive || isPaused) && !isExpired && !isArchived && (
            <>
              {/* Activate/Resume for paused offers */}
              {isPaused && (
                <button
                  onClick={handleActivate}
                  disabled={isActivateLoading}
                  className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  {isActivateLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isActivateLoading ? "Resuming..." : "Resume"}
                </button>
              )}

              {/* Pause, Expire, Archive for active offers */}
              {/* Note: Deactivate (to draft) is not allowed from active status */}
              {isActive && (
                <>
                  <button
                    onClick={handlePause}
                    disabled={isPauseLoading}
                    className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{ backgroundColor: color.primary.action }}
                  >
                    {isPauseLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                    {isPauseLoading ? "Pausing..." : "Pause"}
                  </button>
                </>
              )}
            </>
          )}

          {/* Edit Button */}
          <PermissionGate permission="offers.update">
            <button
              onClick={() => navigate(`/dashboard/offers/${id}/edit`)}
              className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm text-white`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </PermissionGate>

          {/* More Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-colors`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMoreMenu && (
              <div
                className={`absolute right-0 top-full mt-1 w-56 bg-white ${tw.rounded} shadow-lg border border-gray-200 py-1 z-10`}
              >
                {/* Reject - Only for pending offers */}
                {isPending && (
                  <button
                    onClick={() => {
                      handleReject();
                      setShowMoreMenu(false);
                    }}
                    disabled={isRejectLoading}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-4 h-4" />
                    {isRejectLoading ? "Rejecting..." : "Reject"}
                  </button>
                )}

                {/* Expire - Only for active offers that are approved */}
                {isApproved && isActive && (
                  <button
                    onClick={() => {
                      setShowExpireModal(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    Expire Offer
                  </button>
                )}

                {/* Archive - Available for any non-archived offer */}
                {!isArchived && (
                  <button
                    onClick={() => {
                      setShowArchiveModal(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Archive Offer
                  </button>
                )}

                {/* Unarchive - Only for archived offers */}
                {isArchived && (
                  <button
                    onClick={() => {
                      handleUnarchive();
                      setShowMoreMenu(false);
                    }}
                    disabled={isUnarchiving}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {isUnarchiving ? "Unarchiving..." : "Unarchive Offer"}
                  </button>
                )}

                {/* View Offer Report */}
                <button
                  onClick={() => {
                    navigate(`/dashboard/reports/offers/${id}`, {
                      state: { returnTo: { pathname: location.pathname } },
                    });
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Offer Report
                </button>

                {/* Duplicate Offer */}
                <PermissionGate permission="offers.create">
                  <button
                    onClick={() => {
                      navigate(`/dashboard/offers/create?duplicateId=${id}`);
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate Offer
                  </button>
                </PermissionGate>

                {/* Delete */}
                <PermissionGate permission="offers.delete">
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Offer
                  </button>
                </PermissionGate>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Offer Info */}
      <div
        className={`bg-white ${tw.rounded} border p-6`}
        style={{ borderColor: color.border.default }}
      >
        <div className="flex items-start space-x-4">
          <div className="flex-1">
            <h2 className={`${tw.tableFirstColumn} ${tw.textPrimary} mb-2`}>
              {offer.name}
            </h2>
            <p className={`${tw.textSecondary} mb-4`}>
              {offer.description || "No description available"}
            </p>
            <div className="flex items-center flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor.bg} ${statusColor.text}`}
              >
                <StatusIcon className="w-4 h-4 mr-1" />
                {offer.status}
              </span>
              {offer.is_reusable && (
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: color.primary.accent }}
                >
                  Reusable
                </span>
              )}
              {offer.supports_multi_language && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[${color.primary.accent}]/10 text-[${color.primary.accent}]`}
                >
                  Multi-language
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Offer Details */}
      <div
        className={`bg-white ${tw.rounded} border p-6`}
        style={{ borderColor: color.border.default }}
      >
        <h3 className={`${tw.cardHeading} mb-4`}>Offer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`text-sm font-medium ${tw.textMuted} block mb-1`}>
              Offer ID
            </label>
            <p className={`text-base ${tw.textPrimary} font-mono`}>
              {offer.id}
            </p>
          </div>
          <div>
            <label className={`text-sm font-medium ${tw.textMuted} block mb-1`}>
              Catalog
            </label>
            <p className={`text-base ${tw.textPrimary}`}>{categoryName}</p>
          </div>
          <div>
            <label className={`text-sm font-medium ${tw.textMuted} block mb-1`}>
              Offer Type
            </label>
            <p className={`text-base ${tw.textPrimary}`}>
              {getOfferType(offer)}
            </p>
          </div>
          <div>
            <label className={`text-sm font-medium ${tw.textMuted} block mb-1`}>
              Created Date
            </label>
            <p className={`text-base ${tw.textPrimary} flex items-center`}>
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              {offer.created_at ? (
                <DateFormatter date={offer.created_at} useUserTimezone includeTime />
              ) : (
                "N/A"
              )}
            </p>
          </div>
          <div>
            <label className={`text-sm font-medium ${tw.textMuted} block mb-1`}>
              Last Updated
            </label>
            <p className={`text-base ${tw.textPrimary}`}>
              {offer.updated_at ? (
                <DateFormatter date={offer.updated_at} useUserTimezone includeTime />
              ) : (
                "N/A"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Linked Products Section */}
      <section className="mt-12 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${tw.cardHeading}`}>Linked Products</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className={`px-4 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors`}
              style={{ backgroundColor: color.primary.action }}
              type="button"
            >
              Add Product
            </button>
          </div>
        </div>

        <div
          className={` ${tw.rounded} border overflow-hidden`}
          style={{ borderColor: color.border.default }}
        >
          {productsLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LoadingSpinner
                variant="modern"
                size="xl"
                color="primary"
                className="mb-4"
              />
              <p className={`${tw.textMuted} font-medium text-sm`}>
                Loading products...
              </p>
            </div>
          ) : linkedProducts.length > 0 ? (
            <div className="hidden lg:block overflow-x-auto">
              <table
                className="w-full"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
                <thead style={{ background: color.surface.tableHeader }}>
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Product
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Description
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Primary
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {linkedProducts.map((product: any, index: number) => {
                    const rawProductId = product.product_id ?? product.id;
                    const productId =
                      rawProductId !== undefined && rawProductId !== null
                        ? Number(rawProductId)
                        : null;
                    const hasValidProductId =
                      productId !== null && !Number.isNaN(productId);
                    const productName =
                      product.name ||
                      product.product_code ||
                      `Product ${hasValidProductId ? productId : index + 1}`;
                    // Prioritize primaryProductId from state (fetched with skipCache) over product.is_primary
                    // This ensures we show the correct primary product even if backend returns stale is_primary flags
                    const productIdForComparison =
                      product.product_id ?? product.id;
                    const normalizedProductId =
                      productIdForComparison != null
                        ? Number(productIdForComparison)
                        : null;
                    const normalizedPrimaryId =
                      primaryProductId != null
                        ? Number(primaryProductId)
                        : null;
                    const isPrimary =
                      (normalizedProductId !== null &&
                        normalizedPrimaryId !== null &&
                        normalizedProductId === normalizedPrimaryId) ||
                      (product.is_primary && normalizedPrimaryId === null);
                    const isUnlinking =
                      product.link_id && unlinkingProductId === product.link_id;
                    const isSettingPrimary = settingPrimaryId === productId;

                    return (
                      <tr
                        key={
                          product.link_id ||
                          `product-${hasValidProductId ? productId : index}`
                        }
                        className="transition-colors"
                      >
                        <td
                          className="px-6 py-4"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          {hasValidProductId ? (
                            <button
                              type="button"
                              onClick={() =>
                                navigateToProductDetails(productId as number)
                              }
                              className={`font-semibold text-sm sm:text-base ${tw.textPrimary} truncate`}
                              title={productName}
                              style={{ color: color.primary.accent }}
                            >
                              {productName}
                            </button>
                          ) : (
                            <span
                              className={`font-semibold text-sm sm:text-base ${tw.textPrimary} truncate`}
                            >
                              {productName}
                            </span>
                          )}
                        </td>
                        <td
                          className="px-6 py-4"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          {product.description ? (
                            <div
                              className={`text-xs sm:text-sm ${tw.textMuted} truncate`}
                              title={product.description}
                            >
                              {product.description}
                            </div>
                          ) : (
                            <span
                              className={`text-xs sm:text-sm ${tw.textMuted}`}
                            >
                              No description provided
                            </span>
                          )}
                        </td>
                        <td
                          className="px-6 py-4"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          {isPrimary ? (
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                              Primary
                            </span>
                          ) : (
                            <span
                              className={`text-xs sm:text-sm ${tw.textMuted}`}
                            >
                              —
                            </span>
                          )}
                        </td>
                        <td
                          className="px-6 py-4 text-sm font-medium"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            {hasValidProductId && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditProduct(productId as number)
                                  }
                                  className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                  title="Edit product"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProductToDelete({
                                      id: productId as number,
                                      name: productName,
                                    });
                                    setShowDeleteProductModal(true);
                                  }}
                                  disabled={isDeletingProduct}
                                  className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                  title="Delete product"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </>
                            )}
                            {!isPrimary &&
                              (product.link_id || hasValidProductId) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetPrimaryProduct(
                                      productId as number,
                                      productName,
                                    )
                                  }
                                  disabled={isSettingPrimary || isUnlinking}
                                  className="text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                                  style={{ color: color.primary.accent }}
                                  title="Set this product as the primary product"
                                >
                                  {isSettingPrimary
                                    ? "Setting..."
                                    : "Set Primary"}
                                </button>
                              )}
                            {(product.link_id || hasValidProductId) && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!product.link_id) {
                                    showError(
                                      "Cannot unlink: Link ID not available. Product may need to be re-linked.",
                                    );
                                    return;
                                  }
                                  setProductToUnlink({
                                    linkId: product.link_id,
                                    productId: productId as number,
                                    name: productName,
                                  });
                                  setShowUnlinkModal(true);
                                }}
                                disabled={
                                  isUnlinking ||
                                  isSettingPrimary ||
                                  !product.link_id
                                }
                                className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isUnlinking ? "Unlinking..." : "Unlink"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className={`text-sm ${tw.textMuted} mb-1`}>
                No products linked to this offer.
              </p>
              <p className={`text-xs ${tw.textMuted}`}>
                Click "Add Product" above to link products to this offer.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Offer Creatives Section */}
      <section className="mt-12 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${tw.cardHeading}`}>Offer Creatives</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetNewCreativeForm();
                setIsAddCreativeModalOpen(true);
              }}
              className={`px-4 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors`}
              style={{ backgroundColor: color.primary.action }}
              type="button"
            >
              Add Creative
            </button>
          </div>
        </div>

        <div
          className={` ${tw.rounded} border overflow-hidden`}
          style={{ borderColor: color.border.default }}
        >
          {creativesLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LoadingSpinner
                variant="modern"
                size="xl"
                color="primary"
                className="mb-4"
              />
              <p className={`${tw.textMuted} font-medium text-sm`}>
                Loading creatives...
              </p>
            </div>
          ) : offerCreatives.length > 0 ? (
            <div className="hidden lg:block overflow-x-auto">
              <table
                className="w-full"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
                <thead style={{ background: color.surface.tableHeader }}>
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Name
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Channel
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Locale
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Status
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Updated
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offerCreatives.map(
                    (creative: OfferCreative, index: number) => {
                      const creativeId =
                        creative.id !== undefined && creative.id !== null
                          ? Number(creative.id)
                          : null;
                      const hasCreativeId =
                        creativeId !== null && !Number.isNaN(creativeId);
                      const creativeLabel =
                        creative.title ||
                        `Creative ${creative.channel}${
                          creative.locale ? ` (${creative.locale})` : ""
                        }`;

                      return (
                        <tr
                          key={`creative-${creative.id || creative.channel}-${
                            creative.locale
                          }-${index}`}
                          className="transition-colors"
                        >
                          <td
                            className="px-6 py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {hasCreativeId ? (
                              <button
                                type="button"
                                onClick={() =>
                                  navigateToCreativeDetails(
                                    creativeId as number,
                                  )
                                }
                                className={`font-semibold text-sm sm:text-base ${tw.textPrimary} truncate`}
                                title={creativeLabel}
                                style={{ color: color.primary.accent }}
                              >
                                {creativeLabel}
                              </button>
                            ) : (
                              <span
                                className={`font-semibold text-sm sm:text-base ${tw.textPrimary} truncate`}
                              >
                                {creativeLabel}
                              </span>
                            )}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm ${tw.textPrimary}`}
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {creative.channel}
                          </td>
                          <td
                            className={`px-6 py-4 hidden md:table-cell text-sm ${tw.textMuted}`}
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {creative.locale || "—"}
                          </td>
                          <td
                            className="px-6 py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {creative.is_active ? (
                              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-600">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td
                            className={`px-6 py-4 hidden md:table-cell text-sm ${tw.textMuted}`}
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {creative.updated_at ? (
                              <DateFormatter
                                date={creative.updated_at}
                                includeTime
                              />
                            ) : creative.created_at ? (
                              <DateFormatter
                                date={creative.created_at}
                                includeTime
                              />
                            ) : (
                              "—"
                            )}
                          </td>
                          <td
                            className="px-6 py-4 text-sm font-medium"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {hasCreativeId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigateToCreativeDetails(
                                      creativeId as number,
                                    )
                                  }
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  title="View details"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleEditCreative(creative)}
                                className="text-sm font-medium hover:underline text-gray-600"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCreative(creative)}
                                className="text-sm font-medium text-red-600 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className={`text-sm ${tw.textMuted}`}>
                No creatives created for this offer. Click "Add Creative" above
                to create one.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Used in Campaigns Section */}
      <section className={`${tw.rounded} border-gray-200 py-6`}>
        <div className="px-6 mb-6">
          <h3 className={`${tw.cardHeading}`}>
            Used in Campaigns ({campaignFlows.length})
          </h3>
          <p className={`${tw.textSecondary} text-sm mt-1`}>
            Campaigns that have mappings with this offer
          </p>
        </div>

        {isLoadingCampaignFlows ? (
          <div className="px-6 flex justify-center py-8">
            <LoadingSpinner variant="modern" size="md" color="primary" />
          </div>
        ) : campaignFlows.length === 0 ? (
          <div className="px-6 text-center py-8">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className={`text-sm ${tw.textSecondary}`}>
              This offer is not used in any campaigns yet
            </p>
          </div>
        ) : (
          <div
            className={`overflow-x-auto ${tw.rounded} border`}
            style={{ borderColor: color.border.default }}
          >
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Step
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Campaign
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Segment
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Campaign Type
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Wait (hours)
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Allocation
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaignFlows.map((flow, idx) => (
                  <tr key={idx} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold"
                        style={{ color: "#000000" }}
                      >
                        {flow.step_order || idx + 1}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <button
                        onClick={() =>
                          navigate(`/dashboard/campaigns/${flow.campaign_id}`)
                        }
                        className="text-sm font-medium hover:underline"
                        style={{ color: color.primary.accent }}
                      >
                        {flow.campaign_name}
                      </button>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <button
                        onClick={() =>
                          navigate(`/dashboard/segments/${flow.segment_id}`)
                        }
                        className="text-sm font-medium hover:underline"
                        style={{ color: color.primary.accent }}
                      >
                        {flow.segment_name}
                      </button>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm font-medium ${tw.textPrimary}`}>
                        {getFlowTypeLabel(flow.flow_type)}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textPrimary}`}>
                        {flow.wait_interval_hours}h
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 hidden md:table-cell"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textMuted}`}>
                        {flow.bucket_allocation || "—"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add Creative Modal */}
      <RegularModal
        isOpen={isAddCreativeModalOpen}
        onClose={() => {
          setIsAddCreativeModalOpen(false);
          resetNewCreativeForm();
        }}
        title="Add Creative"
        size="2xl"
      >
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Form Fields (1/2) */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm">
                  {newCreativeForm.channel || "—"}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Determined by offer channel (read-only)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Locale / Language
                </label>
                <TypeSelector
                  value={newCreativeForm.locale}
                  onChange={(value) => {
                    setNewCreativeForm((prev) => ({
                      ...prev,
                      locale: String(value),
                    }));
                    // Clear template selection when locale changes
                    setSelectedTemplateId(null);
                  }}
                  options={[
                    ...((languages as ConfigurationItem[]) || [])
                      .filter((lang) => lang.isActive)
                      .map((lang) => ({
                        label: lang.name,
                        value: lang.metadataValue as string,
                      })),
                    // Fallback to COMMON_LOCALES if languages config is empty
                    ...((languages as ConfigurationItem[])?.length === 0
                      ? COMMON_LOCALES.map((locale) => ({
                          label: getLocaleLabel(locale),
                          value: locale,
                        }))
                      : []),
                  ]}
                  placeholder="Select language"
                  allowCreate={true}
                  onCreate={() => window.open("/dashboard/languages", "_blank")}
                />
              </div>
            </div>

            {/* Template Selector */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Creative Template (Optional)
                </label>
                {selectedTemplateId && (
                  <button
                    onClick={() => handleTemplateSelect(null)}
                    className="text-xs text-gray-500 underline"
                  >
                    Clear Template
                  </button>
                )}
              </div>
              {(templates || []).filter((t) =>
                t.is_active &&
                t.channel?.toLowerCase() === newCreativeForm.channel.toLowerCase()
              ).length > 0 ? (
                <TypeSelector
                  value={
                    selectedTemplateId ? selectedTemplateId.toString() : ""
                  }
                  onChange={(value) =>
                    handleTemplateSelect(value ? Number(value) : null)
                  }
                  options={[
                    { value: "", label: "Select template" },
                    ...(templates || [])
                      .filter((t) =>
                        t.is_active &&
                        t.channel?.toLowerCase() === newCreativeForm.channel.toLowerCase()
                      )
                      .map((template) => {
                      let languageLabel = "";
                      if (template.locale && languages) {
                        const language = (
                          languages as ConfigurationItem[]
                        ).find(
                          (lang) => lang.metadataValue === template.locale
                        );
                        if (language) {
                          languageLabel = " (" + language.name + ")";
                        }
                      }
                      return {
                        value: template.id.toString(),
                        label: template.name + languageLabel + (template.description ? " - " + template.description : ""),
                      };
                    }),
                  ]}
                  placeholder="Select a template to start with..."
                  allowCreate={true}
                  onCreate={() => window.open("/dashboard/creative-templates", "_blank")}
                />
              ) : (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600">
                  {templatesLoading ? "Loading templates..." : "No templates available for " + newCreativeForm.channel + " channel"}
                </div>
              )}
              {selectedTemplateId && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                  <FileText className="w-3 h-3" />
                  <span>
                    Template selected. You can customize the fields below.
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Sender ID (SMS) or Subject (Email/Web) */}
              {newCreativeForm.channel === "SMS" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender ID
                  </label>
                  <HeadlessSelect
                    value={newCreativeForm.title || ""}
                    onChange={(value) =>
                      setNewCreativeForm((prev) => ({
                        ...prev,
                        title: value || "",
                      }))
                    }
                    options={[
                      { label: "Select Sender ID", value: "" },
                      ...((senderIds as SenderId[]) || [])
                        .filter((senderId) => senderId.is_active)
                        .map((senderId) => ({
                          label: senderId.name,
                          value: senderId.name,
                        })),
                    ]}
                    placeholder="Select Sender ID..."
                    className="w-full"
                    zIndex={zIndex.popover}
                    disabled={senderIdsLoading}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Line
                  </label>
                  <Input
                    ref={titleInputRefAdd}
                    placeholder="Enter email subject..."
                    maxLength={160}
                    value={newCreativeForm.title}
                    onChange={(value) => {
                      setActiveFieldAdd("title");
                      setNewCreativeForm((prev) => ({
                        ...prev,
                        title: value,
                      }));
                    }}
                    onClick={(e) => {
                      setActiveFieldAdd("title");
                      setCursorPositionAdd(e.currentTarget.selectionStart || 0);
                    }}
                    onFocus={(e) => {
                      setActiveFieldAdd("title");
                      setCursorPositionAdd(e.currentTarget.selectionStart || 0);
                    }}
                    variant="medium"
                  />
                </div>
              )}

              {/* SMS Route (for SMS variants) */}
              {newCreativeForm.channel && newCreativeForm.channel.toUpperCase().includes("SMS") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMS Route
                  </label>
                  <HeadlessSelect
                    value={newCreativeForm.sms_route || ""}
                    onChange={(value) => {
                      setNewCreativeForm((prev) => ({
                        ...prev,
                        sms_route: value,
                      }));
                    }}
                    options={
                      smsRoutes
                        ?.filter((route) => route.is_active)
                        .map((route) => ({
                          value: route.id?.toString() || "",
                          label: route.name,
                        })) || []
                    }
                    placeholder="Select SMS Route"
                    zIndex={zIndex.popover}
                    disabled={smsRoutesLoading}
                  />
                </div>
              )}

              {/* Message content toolbar */}
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: color.surface.cards }}
              >
                <span className={`text-sm font-medium ${tw.textPrimary}`}>
                  Message Content
                </span>
                <div className="flex items-center gap-2">
                  {(newCreativeForm.channel === "Email" ||
                    newCreativeForm.channel === "SMS" ||
                    newCreativeForm.channel === "Push" ||
                    newCreativeForm.channel === "WhatsApp") && (
                    <button
                      type="button"
                      onClick={() => setIsRichTextAdd((prev) => !prev)}
                      className="px-3 py-1.5 text-sm rounded-md border transition-colors"
                      style={{
                        backgroundColor: isRichTextAdd
                          ? `${color.primary.accent}10`
                          : "white",
                        borderColor: isRichTextAdd
                          ? color.primary.accent
                          : color.border.default,
                        color: isRichTextAdd
                          ? color.primary.accent
                          : color.text.secondary,
                      }}
                    >
                      {isRichTextAdd ? "Rich Text" : "Plain Text"}
                    </button>
                  )}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setShowVariableSelectorAdd(!showVariableSelectorAdd)
                      }
                      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors"
                      style={{
                        backgroundColor: color.primary.accent,
                        color: "white",
                      }}
                    >
                      Insert Variable
                    </button>
                    <div
                      className="absolute left-0 mt-1"
                      style={{ zIndex: zIndex.popover }}
                    >
                      <CascadingVariableSelector
                        isOpen={showVariableSelectorAdd}
                        onClose={() => setShowVariableSelectorAdd(false)}
                        onVariableSelect={handleVariableSelectAdd}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Body
                </label>
                {isRichTextAdd ? (
                  <div
                    onClick={() => setActiveFieldAdd("body")}
                    onFocus={() => setActiveFieldAdd("body")}
                  >
                    <RichTextEditor
                      value={newCreativeForm.text_body || ""}
                      onChange={(value) =>
                        setNewCreativeForm((prev) => ({
                          ...prev,
                          text_body: value,
                        }))
                      }
                      placeholder="Enter your message... Click 'Insert Variable' to add dynamic content"
                      minHeight="250px"
                    />
                  </div>
                ) : (
                  <textarea
                    ref={bodyTextareaRefAdd}
                    value={newCreativeForm.text_body || ""}
                    onChange={(e) => {
                      setActiveFieldAdd("body");
                      setCursorPositionAdd(e.target.selectionStart || 0);
                      setNewCreativeForm((prev) => ({
                        ...prev,
                        text_body: e.target.value,
                      }));
                    }}
                    onClick={(e) => {
                      setActiveFieldAdd("body");
                      setCursorPositionAdd(e.currentTarget.selectionStart || 0);
                    }}
                    onFocus={(e) => {
                      setActiveFieldAdd("body");
                      setCursorPositionAdd(e.currentTarget.selectionStart || 0);
                    }}
                    placeholder="Enter your message... Click 'Insert Variable' to add dynamic content"
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                )}

                {/* Info bar */}
                <div className="mt-2 flex items-center justify-between">
                  {newCreativeForm.channel === "SMS" ||
                  newCreativeForm.channel === "WhatsApp" ? (
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        {
                          getCharacterInfoAdd(newCreativeForm.text_body || "")
                            .charCount
                        }{" "}
                        characters
                      </span>
                      {getCharacterInfoAdd(newCreativeForm.text_body || "")
                        .segments > 1 && (
                        <span>
                          {
                            getCharacterInfoAdd(newCreativeForm.text_body || "")
                              .segments
                          }{" "}
                          segments
                        </span>
                      )}
                      {getCharacterInfoAdd(newCreativeForm.text_body || "")
                        .isUnicode && (
                        <span className="text-amber-600">Unicode</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">
                      Variables like {"{{field}}"} will be replaced with
                      customer data
                    </span>
                  )}

                  {selectedVariablesAdd.length > 0 && (
                    <div className="flex items-center gap-1">
                      {selectedVariablesAdd.slice(0, 3).map((v) => (
                        <span
                          key={v.id}
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: `${color.primary.accent}10`,
                            color: color.primary.accent,
                          }}
                        >
                          {v.name}
                        </span>
                      ))}
                      {selectedVariablesAdd.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{selectedVariablesAdd.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* HTML Body removed per request; message body covers content */}
            </div>

            <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
              setNewCreativeForm((prev) => ({
                ...prev,
                is_active: !prev.is_active,
              }))
            }>
              <Checkbox
                id="new-creative-active"
                checked={newCreativeForm.is_active}
                onChange={() =>
                  setNewCreativeForm((prev) => ({
                    ...prev,
                    is_active: !prev.is_active,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
                style={{ accentColor: color.primary.accent }}
              />
              <span className="text-sm text-gray-700">
                Mark creative as active
              </span>
            </div>

            {/* Button Bar */}
            <div className="flex items-center justify-between gap-4 pt-4">
              <button
                onClick={handlePreview}
                disabled={
                  !newCreativeForm.title &&
                  !newCreativeForm.text_body &&
                  !newCreativeForm.html_body
                }
                className={`px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsAddCreativeModalOpen(false);
                    resetNewCreativeForm();
                  }}
                  disabled={isCreatingCreative}
                  className={`px-4 py-2 text-gray-700 bg-gray-100 ${tw.rounded} hover:bg-gray-200 transition-colors disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCreative}
                  disabled={isCreatingCreative}
                  className={`px-4 py-2 text-white ${tw.rounded} transition-colors disabled:opacity-50 flex items-center gap-2`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  {isCreatingCreative ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Creative...</span>
                    </>
                  ) : (
                    <span>Create Creative</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Preview Panel (1/2) */}
          <div>
            <div>
              <PreviewPanel
                channel={
                  newCreativeForm.channel === "SMS"
                    ? "SMS"
                    : newCreativeForm.channel === "Email"
                      ? "EMAIL"
                      : newCreativeForm.channel === "WhatsApp"
                        ? "WHATSAPP"
                        : "PUSH"
                }
                title={newCreativeForm.title}
                body={newCreativeForm.text_body || ""}
              />
            </div>
          </div>
        </div>
      </RegularModal>
      {/* Edit Creative Modal */}
      <OfferCreativeFormModal
        isOpen={isEditCreativeModalOpen}
        onClose={() => setIsEditCreativeModalOpen(false)}
        onSave={async (creativeData) => {
          if (!editingCreative || !user?.user_id) return;

          try {
            setIsSavingCreative(true);
            const updatePayload: Record<string, unknown> = {
              updated_by: user.user_id,
              channel: creativeData.channel,
              locale: creativeData.locale,
              title: creativeData.title,
              text_body: creativeData.text_body,
              html_body: creativeData.html_body,
              is_active: creativeData.is_active,
            };

            if (creativeData.sms_route) {
              updatePayload.sms_route = creativeData.sms_route;
            }

            await offerCreativeService.update(
              editingCreative.id as number,
              updatePayload,
            );

            setIsEditCreativeModalOpen(false);
            loadCreatives(true);
          } catch (err) {
            console.error("Failed to update creative:", err);
            throw err;
          } finally {
            setIsSavingCreative(false);
          }
        }}
        initialCreative={editingCreative}
        mode="edit"
      />

      {/* Add Product Modal - Custom Selector */}
      {isAddProductModalOpen && (
        <div
          className="fixed bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            zIndex: zIndex.modal,
          }}
          onClick={() => {
            setIsAddProductModalOpen(false);
            setSelectedProductsToAdd([]);
            setProductSearchTerm("");
            setSelectedProductCategory("all");
          }}
        >
          <div
            className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Create Product Button */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Add Products to Offer
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Select products to link to this offer
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCreateProductModalOpen(true)}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium text-white ${tw.rounded} hover:opacity-90 transition-all`}
                  style={{ backgroundColor: color.primary.action }}
                  title="Create a new product"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Product
                </button>
                <button
                  onClick={() => {
                    setIsAddProductModalOpen(false);
                    setSelectedProductsToAdd([]);
                    setProductSearchTerm("");
                    setSelectedProductCategory("all");
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="px-6 pt-4 space-y-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Search Bar */}
                <SearchInput
                  value={productSearchTerm}
                  onChange={setProductSearchTerm}
                  placeholder="Search products..."
                />

                {/* Category Filter */}
                <div className="w-48">
                  <div className="[&_button]:py-2 [&_li]:py-1.5">
                    <HeadlessSelect
                      value={selectedProductCategory}
                      onChange={(value) =>
                        setSelectedProductCategory(String(value))
                      }
                      options={productCategories}
                      placeholder="Filter by catalog"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Selection Summary */}
            {selectedProductsToAdd.length > 0 && (
              <div className="px-6 flex-shrink-0 my-3">
                <div
                  className={`${tw.rounded} p-4 border text-sm`}
                  style={{
                    backgroundColor: `${color.primary.accent}15`,
                    borderColor: `${color.primary.accent}40`,
                    color: color.primary.accent,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {selectedProductsToAdd.length} product
                      {selectedProductsToAdd.length !== 1 ? "s" : ""} selected
                    </span>
                    <button
                      onClick={() => setSelectedProductsToAdd([])}
                      className="font-medium hover:opacity-80 transition-opacity"
                      style={{ color: color.primary.accent }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Products List */}
            <div className="flex-1 overflow-y-auto">
              {productsSearchLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading products...</p>
                  </div>
                </div>
              ) : availableProducts.length > 0 ? (
                <div className="border border-gray-200 rounded overflow-hidden m-6">
                  <table className="w-full divide-y divide-gray-200">
                    <thead style={{ backgroundColor: color.surface.cards }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          Select
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {availableProducts.map((product) => {
                        const isSelected = selectedProductsToAdd.some(
                          (p) => p.id === product.id,
                        );
                        const isAlreadyLinked = linkedProducts.some(
                          (p) => p.id === product.id,
                        );

                        return (
                          <tr
                            key={product.id}
                            onClick={() => {
                              if (!isAlreadyLinked) {
                                toggleProductSelection(product);
                              }
                            }}
                            className={`transition-colors ${
                              isAlreadyLinked
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:bg-gray-50 cursor-pointer"
                            }`}
                          >
                            <td className="px-4 py-3">
                              {!isAlreadyLinked && (
                                <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProductSelection(product);
                                }}>
                                  <Checkbox
                                    id={`row-product-${product.id}`}
                                    checked={isSelected}
                                    onChange={() =>
                                      toggleProductSelection(product)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 border-gray-400 rounded"
                                    style={{ accentColor: "#111827" }}
                                  />
                                </div>
                              )}
                              {isAlreadyLinked && (
                                <Check className="w-4 h-4 text-gray-400" />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {product.description || "No description"}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-600">
                                {productCategories.find(
                                  (cat) =>
                                    cat.value ===
                                    product.category_id?.toString(),
                                )?.label || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-mono text-gray-600">
                                {product.product_code || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {product.price ? (
                                <CurrencyFormatter
                                  amount={product.price}
                                  className="text-sm font-medium text-gray-900"
                                />
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block text-xs px-2 py-1 rounded-full ${
                                  product.is_active
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {product.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">
                    {productSearchTerm
                      ? "No products found matching your search"
                      : "No products available"}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => {
                  setIsAddProductModalOpen(false);
                  setSelectedProductsToAdd([]);
                  setProductSearchTerm("");
                  setSelectedProductCategory("all");
                }}
                disabled={isLinkingProducts}
                className={`px-4 py-2 text-gray-700 bg-gray-100 ${tw.rounded} hover:bg-gray-200 transition-colors disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddProducts}
                disabled={
                  isLinkingProducts || selectedProductsToAdd.length === 0
                }
                className={`px-4 py-2 text-white ${tw.rounded} transition-colors disabled:opacity-50 flex items-center gap-2`}
                style={{ backgroundColor: color.primary.action }}
              >
                {isLinkingProducts ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Linking Products...</span>
                  </>
                ) : (
                  <span>
                    Link{" "}
                    {selectedProductsToAdd.length > 0
                      ? `${selectedProductsToAdd.length} `
                      : ""}
                    Product{selectedProductsToAdd.length !== 1 ? "s" : ""}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Product Modal - Higher z-index to appear on top */}
      {createProductModalOpen && (
        <div style={{ position: "relative", zIndex: zIndex.popover }}>
          <Suspense fallback={null}>
            <CreateProductModalWrapper
              isOpen={createProductModalOpen}
              onClose={() => setCreateProductModalOpen(false)}
              onProductCreated={async (productId) => {
                try {
                  // Reload all products with pagination
                  const limit = 100;
                  let offset = 0;
                  let reloadedProducts: Product[] = [];
                  let hasMore = true;

                  while (hasMore) {
                    const response = await productService.getAllProducts({
                      limit: limit,
                      offset: offset,
                      skipCache: true,
                    });

                    const products = response.data || [];
                    reloadedProducts.push(...products);

                    const total = response.pagination?.total || 0;
                    hasMore =
                      reloadedProducts.length < total &&
                      products.length === limit;
                    offset += limit;
                  }

                  // Sort by created_at descending (recently created first)
                  reloadedProducts = reloadedProducts.sort((a, b) => {
                    const dateA = new Date(a.created_at || 0).getTime();
                    const dateB = new Date(b.created_at || 0).getTime();
                    return dateB - dateA;
                  });

                  setAvailableProducts(reloadedProducts);

                  // Find and auto-select the newly created product
                  const newProduct = reloadedProducts.find(
                    (p) => p.id === productId,
                  );
                  if (newProduct) {
                    // Add to selected products
                    setSelectedProductsToAdd((prev) => {
                      const isAlreadySelected = prev.some(
                        (p) => p.id === newProduct.id,
                      );
                      if (isAlreadySelected) return prev;
                      return [...prev, newProduct];
                    });
                  }

                  // Close create modal
                  setCreateProductModalOpen(false);
                } catch (error) {
                  console.error("Error handling product creation:", error);
                }
              }}
            />
          </Suspense>
        </div>
      )}

      {/* Delete Offer Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Offer"
        description="Are you sure you want to delete this offer? This action cannot be undone."
        itemName={offer?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete Offer"
        cancelText="Cancel"
      />

      {/* Delete Creative Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteCreativeModal}
        onClose={handleCancelDeleteCreative}
        onConfirm={handleConfirmDeleteCreative}
        title="Delete Creative"
        description={`Are you sure you want to delete this ${
          creativeToDelete?.channel || ""
        } creative? This action cannot be undone.`}
        itemName={
          creativeToDelete ? `${creativeToDelete.channel} creative` : ""
        }
        isLoading={isDeletingCreative}
        confirmText="Delete Creative"
        cancelText="Cancel"
      />

      {/* Expire Offer Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showExpireModal}
        onClose={() => setShowExpireModal(false)}
        onConfirm={handleConfirmExpire}
        title="Expire Offer"
        description="Are you sure you want to expire this offer? This action cannot be undone."
        itemName={offer?.name || ""}
        isLoading={isExpireLoading}
        confirmText="Expire Offer"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Archive Offer Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleConfirmArchive}
        title="Archive Offer"
        description="Are you sure you want to archive this offer?"
        itemName={offer?.name || ""}
        isLoading={isArchiving}
        confirmText="Archive Offer"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Unlink Product Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showUnlinkModal}
        onClose={() => {
          setShowUnlinkModal(false);
          setProductToUnlink(null);
        }}
        onConfirm={handleConfirmUnlinkProduct}
        title="Unlink Product"
        description="Are you sure you want to unlink this product from this offer? This action cannot be undone."
        itemName={productToUnlink?.name || ""}
        isLoading={!!unlinkingProductId}
        confirmText="Unlink"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Delete Product Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteProductModal}
        onClose={() => {
          setShowDeleteProductModal(false);
          setProductToDelete(null);
        }}
        onConfirm={handleConfirmDeleteProduct}
        title="Delete Product"
        description="Are you sure you want to delete this product? This will permanently delete the product and it will be unlinked from this offer. This action cannot be undone."
        itemName={productToDelete?.name || ""}
        isLoading={isDeletingProduct}
        confirmText="Delete Product"
        cancelText="Cancel"
        variant="delete"
      />

      {/* Preview Creative Modal */}
      <RegularModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewResult(null);
        }}
        title="Creative Preview"
        size="2xl"
      >
        <div className="space-y-6">
          {previewResult ? (
            <div className="space-y-6">
              {/* Device-Specific Previews */}
              {newCreativeForm.channel === "SMS" ||
              newCreativeForm.channel === "SMS Flash" ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    SMS Preview
                  </h3>
                  <SMSSmartphonePreview
                    message={
                      previewResult.rendered_text_body ||
                      previewResult.rendered_title ||
                      ""
                    }
                    title={previewResult.rendered_title}
                  />
                </div>
              ) : newCreativeForm.channel === "Email" ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Email Preview
                  </h3>
                  <EmailLaptopPreview
                    title={previewResult.rendered_title}
                    htmlBody={previewResult.rendered_html_body}
                    textBody={previewResult.rendered_text_body}
                  />
                </div>
              ) : (
                // Fallback for other channels (Web, USSD, etc.)
                <div className="space-y-4">
                  {previewResult.rendered_title && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rendered Title
                      </label>
                      <div
                        className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}
                      >
                        <p className="text-gray-900">
                          {previewResult.rendered_title}
                        </p>
                      </div>
                    </div>
                  )}

                  {previewResult.rendered_text_body && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rendered Text Body
                      </label>
                      <div
                        className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}
                      >
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {previewResult.rendered_text_body}
                        </p>
                      </div>
                    </div>
                  )}

                  {previewResult.rendered_html_body && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rendered HTML Body
                      </label>
                      <div
                        className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}
                      >
                        <div
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: previewResult.rendered_html_body,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {!previewResult.rendered_title &&
                    !previewResult.rendered_text_body &&
                    !previewResult.rendered_html_body && (
                      <div className="text-center py-8 text-gray-500">
                        <p>
                          No content to preview. Add title, text body, or HTML
                          body.
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No preview available.</p>
            </div>
          )}
        </div>
      </RegularModal>
    </div>
  );
}
