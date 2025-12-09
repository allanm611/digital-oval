import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  MoreVertical,
  Save,
} from "lucide-react";
import { Offer, OfferStatusEnum, OfferProductLink } from "../types/offer";
import { OfferCategoryType } from "../types/offerCategory";
import { offerService } from "../services/offerService";
import { offerCategoryService } from "../services/offerCategoryService";
import { productService } from "../../products/services/productService";
import { offerCreativeService } from "../services/offerCreativeService";
import {
  OfferCreative,
  CreativeChannel,
  COMMON_LOCALES,
  VALID_CHANNELS,
  CreateOfferCreativeRequest,
} from "../types/offerCreative";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import RegularModal from "../../../shared/components/ui/RegularModal";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { Product } from "../../products/types/product";
import { Search, Check, FileText, Eye } from "lucide-react";
import { productCategoryService } from "../../products/services/productCategoryService";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DateFormatter from "../../../shared/components/DateFormatter";
import { useConfigurationData } from "../../../shared/services/configurationDataService";
import { TypeConfigurationItem } from "../../../shared/components/TypeConfigurationPage";
import {
  SMSSmartphonePreview,
  EmailLaptopPreview,
} from "../components/CreativePreviewComponents";

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

const creativeChannelOptions = VALID_CHANNELS.map((channel) => ({
  value: channel,
  label: channel,
}));

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
    null
  );
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);
  const [offerCreatives, setOfferCreatives] = useState<OfferCreative[]>([]);
  const [creativesLoading, setCreativesLoading] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Creative edit modal state
  const [isEditCreativeModalOpen, setIsEditCreativeModalOpen] = useState(false);
  const [editingCreative, setEditingCreative] = useState<OfferCreative | null>(
    null
  );
  const [editFormData, setEditFormData] = useState({
    title: "",
    text_body: "",
    html_body: "",
    variables: {} as Record<string, string | number | boolean>,
  });
  const [variablesJson, setVariablesJson] = useState("");
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
    variables?: Record<string, string | number | boolean>;
  }>({
    channel: "SMS" as CreativeChannel, // Default to SMS instead of Email
    locale: "en",
    title: "",
    text_body: "",
    html_body: "",
    is_active: true,
    variables: {},
  });
  const [newCreativeVariables, setNewCreativeVariables] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );

  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<{
    rendered_title?: string;
    rendered_text_body?: string;
    rendered_html_body?: string;
  } | null>(null);

  // Load creative templates from configuration
  const { data: templates } = useConfigurationData("creativeTemplates");
  // Load sender IDs and SMS routes from configuration
  const { data: senderIds } = useConfigurationData("senderIds");
  const { data: smsRoutes } = useConfigurationData("smsRoutes");
  // Load languages from configuration
  const { data: languages } = useConfigurationData("languages");

  // Helper function to calculate SMS segments
  const calculateSMSSegments = (
    messageText: string,
    senderId: string = ""
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
    variables: Record<string, string | number | boolean> = {}
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
    locale: string
  ) => {
    return (templates as TypeConfigurationItem[]).filter((template) => {
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
        newCreativeForm.locale
      ),
    [newCreativeForm.channel, newCreativeForm.locale, templates]
  );

  // Add product modal state
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [selectedProductsToAdd, setSelectedProductsToAdd] = useState<Product[]>(
    []
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

  // Close More menu when clicking outside
  useClickOutside(moreMenuRef, () => setShowMoreMenu(false));

  const resetNewCreativeForm = () => {
    setNewCreativeForm({
      channel: "SMS" as CreativeChannel, // Default to SMS instead of Email
      locale: "en",
      title: "",
      text_body: "",
      html_body: "",
      is_active: true,
    });
    setNewCreativeVariables("");
    setSelectedTemplateId(null);
    setPreviewResult(null);
    setIsPreviewOpen(false);
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: number | null) => {
    if (!templateId) {
      setSelectedTemplateId(null);
      return;
    }

    const template = templates.find((t) => t.id === templateId) as
      | TypeConfigurationItem
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
        parsedVariables
      ),
      rendered_text_body: replaceVariables(
        newCreativeForm.text_body || "",
        parsedVariables
      ),
      rendered_html_body: replaceVariables(
        newCreativeForm.html_body || "",
        parsedVariables
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

        // Extract offer from response.data if wrapped, otherwise use response directly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const offerData = (response as any).data || response;
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
                String(cat.id) === String(offerData.category_id)
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
    [id]
  );

  const loadProducts = useCallback(
    async (
      skipCache: boolean = false,
      preservePrimaryProductId?: number | null
    ) => {
      if (!id) return;

      try {
        setProductsLoading(true);

        // Get products using new endpoint
        const productsResponse = await offerService.getProductsByOffer(
          Number(id),
          { skipCache }
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
              skipCache
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
          skipCache
        );

        // Extract products from response.data if wrapped, otherwise use response directly
        const productsData =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (response as any).data || productsResponse.data || response;

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
                skipCache
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
              (p: any) => p.is_primary === true
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
    [id]
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const creativesData = (response as any).data || [];
        setOfferCreatives(creativesData);
      } catch {
        setOfferCreatives([]);
      } finally {
        setCreativesLoading(false);
      }
    },
    [id]
  );

  // Handle edit creative
  const handleEditCreative = (creative: OfferCreative) => {
    setEditingCreative(creative);
    setEditFormData({
      title: creative.title || "",
      text_body: creative.text_body || "",
      html_body: creative.html_body || "",
      variables: creative.variables || {},
    });
    setVariablesJson(JSON.stringify(creative.variables || {}, null, 2));
    setIsEditCreativeModalOpen(true);
  };

  // Handle save creative
  const handleSaveCreative = async () => {
    if (!editingCreative || !user?.user_id) return;

    try {
      setIsSavingCreative(true);

      // Parse variables JSON
      let parsedVariables = {};
      if (variablesJson.trim()) {
        try {
          parsedVariables = JSON.parse(variablesJson);
        } catch {
          showError("Invalid JSON in variables field");
          return;
        }
      }

      // Build update payload - only include non-empty fields
      const updatePayload: Record<string, unknown> = {
        updated_by: user.user_id,
      };

      // Only add fields if they have content (not empty strings)
      if (editFormData.title && editFormData.title.trim()) {
        updatePayload.title = editFormData.title;
      }
      if (editFormData.text_body && editFormData.text_body.trim()) {
        updatePayload.text_body = editFormData.text_body;
      }
      if (editFormData.html_body && editFormData.html_body.trim()) {
        updatePayload.html_body = editFormData.html_body;
      }
      if (Object.keys(parsedVariables).length > 0) {
        updatePayload.variables = parsedVariables;
      }

      await offerCreativeService.update(
        editingCreative.id as number,
        updatePayload
      );

      success("Creative Updated", "Creative has been updated successfully");
      setIsEditCreativeModalOpen(false);
      loadCreatives(true); // Reload with skipCache
    } catch (err) {
      console.error("Failed to update creative:", err);
      showError("Failed to update creative", "Please try again later.");
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
      loadCreatives(true); // Reload with skipCache
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
        "Provide at least a title, text body, or HTML body before creating a creative."
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

      let response;
      if (searchQuery) {
        // Use searchProducts when there's a search term
        response = await productService.searchProducts({
          q: searchQuery,
          limit: 100,
          skipCache: true,
        });
      } else {
        // Use getAllProducts when there's no search term
        response = await productService.getAllProducts({
          limit: 100,
          skipCache: true,
        });
      }

      let products = response.data || [];

      // Apply category filter if not 'all'
      if (selectedProductCategory !== "all") {
        products = products.filter(
          (product: Product) =>
            product.category_id?.toString() === selectedProductCategory
        );
      }

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
        selectedProductsToAdd.filter((p) => p.id !== product.id)
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
        } linked successfully`
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
        `"${offer.name}" has been deleted successfully.`
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
    try {
      setIsApproveLoading(true);
      await offerService.approveOffer(Number(id), {
        approved_by: user.user_id,
      });
      success(
        "Offer Approved",
        `"${offer?.name}" has been approved successfully.`
      );
      loadOffer(true); // Skip cache to get fresh data after approval
    } catch {
      showError("Failed to approve offer");
    } finally {
      setIsApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!user?.user_id) {
      showError("Error", "User ID not available. Please log in again.");
      return;
    }
    try {
      setIsRejectLoading(true);
      await offerService.rejectOffer(Number(id), { rejected_by: user.user_id });
      success("Offer Rejected", `"${offer?.name}" has been rejected.`);
      loadOffer(true); // Skip cache to get fresh data after rejection
    } catch {
      showError("Failed to reject offer");
    } finally {
      setIsRejectLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    try {
      setIsRequestApprovalLoading(true);
      await offerService.submitForApproval(Number(id), {});
      success(
        "Approval Requested",
        "Your approval request has been submitted successfully."
      );
      loadOffer(true); // Skip cache to get fresh data after approval request
    } catch {
      showError("Failed to request approval");
    } finally {
      setIsRequestApprovalLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      setIsActivateLoading(true);
      await offerService.updateOfferStatus(Number(id), {
        status: OfferStatusEnum.ACTIVE,
      });
      success("Offer Activated", `"${offer?.name}" is now active.`);
      loadOffer(true); // Skip cache to get fresh data after activation
    } catch {
      showError("Failed to activate offer");
    } finally {
      setIsActivateLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      setIsPauseLoading(true);
      await offerService.updateOfferStatus(Number(id), {
        status: OfferStatusEnum.PAUSED,
      });
      success("Offer Paused", `"${offer?.name}" has been paused.`);
      loadOffer(true); // Skip cache to get fresh data after pausing
    } catch {
      showError("Failed to pause offer");
    } finally {
      setIsPauseLoading(false);
    }
  };

  const handleConfirmExpire = async () => {
    try {
      setIsExpireLoading(true);
      await offerService.updateOfferStatus(Number(id), {
        status: OfferStatusEnum.EXPIRED,
      });
      success("Offer Expired", `"${offer?.name}" has been expired.`);
      setShowExpireModal(false);
      loadOffer(true); // Skip cache to get fresh data after expiration
    } catch {
      showError("Failed to expire offer");
    } finally {
      setIsExpireLoading(false);
    }
  };

  const handleConfirmArchive = async () => {
    try {
      setIsArchiving(true);
      await offerService.updateOfferStatus(Number(id), {
        status: OfferStatusEnum.ARCHIVED,
      });
      success("Offer Archived", `"${offer?.name}" has been archived.`);
      setShowArchiveModal(false);
      loadOffer(true); // Skip cache to get fresh data after archiving
    } catch {
      showError("Failed to archive offer");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleConfirmUnlinkProduct = async () => {
    if (!productToUnlink) return;

    try {
      setUnlinkingProductId(productToUnlink.linkId);

      // Check if this is the primary product
      const isPrimary = productToUnlink.productId === primaryProductId;

      if (isPrimary) {
        // If it's the primary product, just set primary_product_id to null
        // This removes it as primary but keeps it linked to the offer
        await offerService.setPrimaryProduct(Number(id), null);
        success(
          "Primary Product Removed",
          `"${productToUnlink.name}" is no longer the primary product, but remains linked to this offer.`
        );
        setPrimaryProductId(null);
      } else {
        // If it's not primary, unlink it completely
        await offerService.unlinkProductById(productToUnlink.linkId);
        success(
          "Product Unlinked",
          `"${productToUnlink.name}" has been unlinked from this offer.`
        );
      }

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
        `"${productToDelete.name}" has been deleted. It will also be unlinked from this offer.`
      );
      setShowDeleteProductModal(false);
      setProductToDelete(null);
      loadProducts(true); // Skip cache to get fresh data after deletion
    } catch {
      showError("Failed to delete product");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleSetPrimaryProduct = async (
    productId: number,
    productName: string
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
        true
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
        (p: any) => p.product_id === existingPrimaryLink.product_id
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
        productId
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

      // Reload products to update is_primary flags on all products
      // Pass the primaryProductId we just set to preserve it (avoid stale data from endpoint)
      await loadProducts(true, newPrimaryProductId);

      success(
        "Primary Product Set",
        `"${productName}" is now the primary product for this offer.`
      );
    } catch (err) {
      // Failed to set primary product
      const errorMessage =
        err instanceof Error ? err.message : "Failed to set primary product";
      showError("Failed to set primary product", errorMessage);
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
            onClick={() => navigate("/dashboard/offers")}
            className="px-4 py-2 text-white rounded-md font-semibold transition-all duration-200"
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
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={tw.mainHeading}>{t.pages.offerDetails}</h1>
            <p className={`${tw.textSecondary} mt-1`}>
              View and manage offer information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Draft: Submit for Approval */}
          {isDraft && (
            <button
              onClick={handleRequestApproval}
              disabled={isRequestApprovalLoading}
              className="px-4 py-2 text-white rounded-md font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-4 py-2 text-white rounded-md font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-4 py-2 text-white rounded-md font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="px-4 py-2 text-white rounded-md font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="px-4 py-2 text-white rounded-md font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="px-4 py-2 text-white rounded-md font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
          <button
            onClick={() => navigate(`/dashboard/offers/${id}/edit`)}
            className="px-4 py-2 rounded-md font-semibold transition-all duration-200 flex items-center gap-2 text-sm text-white"
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>

          {/* More Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
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

                {/* Delete */}
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Offer Info */}
      <div
        className={`bg-white rounded-md border border-[${color.border.default}] p-6`}
      >
        <div className="flex items-start space-x-4">
          <div className="flex-1">
            <h2 className={`${tw.cardHeading} mb-2`}>{offer.name}</h2>
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
        className={`bg-white rounded-md border border-[${color.border.default}] p-6`}
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
                <DateFormatter date={offer.created_at} />
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
                <DateFormatter date={offer.updated_at} />
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
              className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
              style={{ backgroundColor: color.primary.action }}
              type="button"
            >
              Add Product
            </button>
          </div>
        </div>

        <div
          className={` rounded-md border border-[${color.border.default}] overflow-hidden`}
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
                                      productName
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
                                      "Cannot unlink: Link ID not available. Product may need to be re-linked."
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
              className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
              style={{ backgroundColor: color.primary.action }}
              type="button"
            >
              Add Creative
            </button>
          </div>
        </div>

        <div
          className={` rounded-md border border-[${color.border.default}] overflow-hidden`}
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
                                    creativeId as number
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
                              <button
                                type="button"
                                onClick={() => handleEditCreative(creative)}
                                className="text-sm font-medium hover:underline"
                                style={{ color: color.primary.accent }}
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
                    }
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

      {/* Add Creative Modal */}
      <RegularModal
        isOpen={isAddCreativeModalOpen}
        onClose={() => {
          setIsAddCreativeModalOpen(false);
          resetNewCreativeForm();
        }}
        title="Add Creative"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel
              </label>
              <HeadlessSelect
                value={newCreativeForm.channel}
                onChange={(value) => {
                  setNewCreativeForm((prev) => ({
                    ...prev,
                    channel: value as CreativeChannel,
                  }));
                  // Clear template when channel changes
                  setSelectedTemplateId(null);
                }}
                options={creativeChannelOptions}
                placeholder="Select a channel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locale / Language
              </label>
              <HeadlessSelect
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
                  ...((languages as TypeConfigurationItem[]) || [])
                    .filter((lang) => lang.isActive)
                    .map((lang) => ({
                      label: lang.name,
                      value: lang.metadataValue as string,
                    })),
                  // Fallback to COMMON_LOCALES if languages config is empty
                  ...((languages as TypeConfigurationItem[])?.length === 0
                    ? COMMON_LOCALES.map((locale) => ({
                        label: getLocaleLabel(locale),
                        value: locale,
                      }))
                    : []),
                ]}
                placeholder="Select language"
                searchable
              />
            </div>
          </div>

          {/* Template Selector */}
          {availableTemplates.length > 0 && (
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
              <div className="relative">
                <HeadlessSelect
                  value={
                    selectedTemplateId ? selectedTemplateId.toString() : ""
                  }
                  onChange={(value) =>
                    handleTemplateSelect(value ? Number(value) : null)
                  }
                  options={[
                    { value: "", label: "Select template" },
                    ...availableTemplates.map((template) => {
                      // Get language name if template has locale
                      let languageLabel = "";
                      if (template.locale && languages) {
                        const language = (
                          languages as TypeConfigurationItem[]
                        ).find(
                          (lang) => lang.metadataValue === template.locale
                        );
                        if (language) {
                          languageLabel = ` (${language.name})`;
                        }
                      }
                      return {
                        value: template.id.toString(),
                        label: `${template.name}${languageLabel}${
                          template.description
                            ? ` - ${template.description}`
                            : ""
                        }`,
                      };
                    }),
                  ]}
                  placeholder="Select a template to start with..."
                />
                {selectedTemplateId && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <FileText className="w-3 h-3" />
                    <span>
                      Template selected. You can customize the fields below.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sender ID (for SMS) or Title (for other channels) */}
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
                  ...((senderIds as TypeConfigurationItem[]) || [])
                    .filter(
                      (senderId) =>
                        senderId.isActive && senderId.metadataValue === "active"
                    )
                    .map((senderId) => ({
                      label: senderId.name,
                      value: senderId.name,
                    })),
                ]}
                placeholder="Select Sender ID..."
                className="w-full"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                maxLength={160}
                value={newCreativeForm.title}
                onChange={(e) =>
                  setNewCreativeForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Enter creative title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* SMS Route (for SMS channel only) */}
          {newCreativeForm.channel === "SMS" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMS Route
              </label>
              <HeadlessSelect
                value={(newCreativeForm.variables as any)?.sms_route || ""}
                onChange={(value) =>
                  setNewCreativeForm((prev) => ({
                    ...prev,
                    variables: {
                      ...(prev.variables || {}),
                      sms_route: value || undefined,
                    },
                  }))
                }
                options={[
                  { label: "Select Route", value: "" },
                  ...((smsRoutes as TypeConfigurationItem[]) || [])
                    .filter((route) => route.isActive)
                    .map((route) => ({
                      label: route.name,
                      value: route.name,
                    })),
                ]}
                placeholder="Select SMS Route..."
                className="w-full"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Text Body
              </label>
              {newCreativeForm.channel === "SMS" &&
                (() => {
                  const senderId = newCreativeForm.title || "";
                  const { totalChars, smsCount } = calculateSMSSegments(
                    newCreativeForm.text_body || "",
                    senderId
                  );
                  return (
                    <span
                      className={`text-xs font-medium ${
                        smsCount > 1
                          ? "text-orange-600"
                          : totalChars > 150
                          ? "text-yellow-600"
                          : "text-gray-500"
                      }`}
                    >
                      {totalChars} / {smsCount} SMS
                    </span>
                  );
                })()}
            </div>
            <textarea
              value={newCreativeForm.text_body}
              onChange={(e) =>
                setNewCreativeForm((prev) => ({
                  ...prev,
                  text_body: e.target.value,
                }))
              }
              placeholder="Enter text content..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {newCreativeForm.channel === "SMS" &&
              (() => {
                const senderId = newCreativeForm.title || "";
                const { totalChars, smsCount } = calculateSMSSegments(
                  newCreativeForm.text_body || "",
                  senderId
                );
                if (smsCount > 1) {
                  return (
                    <p className="mt-1 text-xs text-orange-600">
                      Message will be sent as {smsCount} SMS
                      {smsCount > 1 ? "es" : ""} (charged separately)
                    </p>
                  );
                }
                return null;
              })()}
            {newCreativeForm.channel !== "SMS" && (
              <p className="text-xs text-gray-500 mt-1">
                Provide at least one of Title, Text Body, or HTML Body.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTML Body (optional)
            </label>
            <textarea
              value={newCreativeForm.html_body}
              onChange={(e) =>
                setNewCreativeForm((prev) => ({
                  ...prev,
                  html_body: e.target.value,
                }))
              }
              placeholder="Enter HTML content..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variables (JSON)
            </label>
            <textarea
              value={newCreativeVariables}
              onChange={(e) => setNewCreativeVariables(e.target.value)}
              placeholder='{"variable_name": "value"}'
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              Provide key/value pairs for template variables. Example:{" "}
              {'{"firstName":"John"}'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="new-creative-active"
              type="checkbox"
              checked={newCreativeForm.is_active}
              onChange={(e) =>
                setNewCreativeForm((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-300"
              style={{ accentColor: color.primary.action }}
            />
            <label
              htmlFor="new-creative-active"
              className="text-sm text-gray-700"
            >
              Mark creative as active
            </label>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={handlePreview}
              disabled={
                !newCreativeForm.title &&
                !newCreativeForm.text_body &&
                !newCreativeForm.html_body
              }
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
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
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCreative}
                disabled={isCreatingCreative}
                className="px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
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
      </RegularModal>
      {/* Edit Creative Modal */}
      <RegularModal
        isOpen={isEditCreativeModalOpen}
        onClose={() => setIsEditCreativeModalOpen(false)}
        title={`Edit ${editingCreative?.channel} Creative`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={editFormData.title}
              onChange={(e) =>
                setEditFormData({ ...editFormData, title: e.target.value })
              }
              placeholder="Enter creative title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Text Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Body
            </label>
            <textarea
              value={editFormData.text_body}
              onChange={(e) =>
                setEditFormData({ ...editFormData, text_body: e.target.value })
              }
              placeholder="Enter text content..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* HTML Body (for Email/Web) */}
          {(editingCreative?.channel === "Email" ||
            editingCreative?.channel === "Web") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML Body
              </label>
              <textarea
                value={editFormData.html_body}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    html_body: e.target.value,
                  })
                }
                placeholder="Enter HTML content..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          )}

          {/* Variables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variables (JSON)
            </label>
            <textarea
              value={variablesJson}
              onChange={(e) => setVariablesJson(e.target.value)}
              placeholder='{"variable_name": "value"}'
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              {(() => {
                if (!variablesJson.trim()) return "Empty variables";
                try {
                  JSON.parse(variablesJson);
                  return <span className="text-green-600">✓ Valid JSON</span>;
                } catch {
                  return <span className="text-red-600">⚠ Invalid JSON</span>;
                }
              })()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setIsEditCreativeModalOpen(false)}
              disabled={isSavingCreative}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCreative}
              disabled={isSavingCreative}
              className="px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: color.primary.action }}
            >
              {isSavingCreative ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </RegularModal>

      {/* Add Product Modal - Custom Selector */}
      <RegularModal
        isOpen={isAddProductModalOpen}
        onClose={() => {
          setIsAddProductModalOpen(false);
          setSelectedProductsToAdd([]);
          setProductSearchTerm("");
          setSelectedProductCategory("all");
        }}
        title="Add Products to Offer"
        size="2xl"
      >
        <div className="space-y-4">
          {/* Search and Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <HeadlessSelect
                value={selectedProductCategory}
                onChange={(value) => setSelectedProductCategory(String(value))}
                options={productCategories}
                placeholder="Filter by category"
              />
            </div>
          </div>

          {/* Selected Products Count */}
          {selectedProductsToAdd.length > 0 && (
            <div
              className="rounded-md p-3"
              style={{ backgroundColor: color.primary.accent }}
            >
              <p className="text-sm text-black font-medium">
                {selectedProductsToAdd.length} product
                {selectedProductsToAdd.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          )}

          {/* Products List */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
            {productsSearchLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : availableProducts.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {availableProducts.map((product) => {
                  const isSelected = selectedProductsToAdd.some(
                    (p) => p.id === product.id
                  );
                  const isAlreadyLinked = linkedProducts.some(
                    (p) => p.id === product.id
                  );
                  const productInitial = (
                    product.name ||
                    product.product_code ||
                    "P"
                  )
                    .toString()
                    .charAt(0)
                    .toUpperCase();

                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (!isAlreadyLinked) {
                          toggleProductSelection(product);
                        }
                      }}
                      className={`p-4 transition-colors ${
                        isAlreadyLinked
                          ? "bg-gray-50 opacity-60 cursor-not-allowed"
                          : "hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-10 h-10 rounded-md flex items-center justify-center ${
                              isAlreadyLinked ? "bg-gray-200" : "bg-gray-100"
                            }`}
                          >
                            <span
                              className="text-sm font-semibold"
                              style={{
                                color: isAlreadyLinked
                                  ? "#6B7280"
                                  : color.primary.accent,
                              }}
                            >
                              {productInitial}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h5
                              className={`font-medium ${
                                isAlreadyLinked
                                  ? "text-gray-500"
                                  : "text-gray-900"
                              }`}
                            >
                              {product.name}
                            </h5>
                            <p
                              className={`text-sm ${
                                isAlreadyLinked
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              {product.description}
                            </p>
                            {isAlreadyLinked && (
                              <span className="text-xs text-gray-500 italic mt-1 block">
                                Already linked to this offer
                              </span>
                            )}
                          </div>
                        </div>
                        {!isAlreadyLinked && (
                          <div
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected ? "" : "border-gray-300 bg-white"
                            }`}
                            style={
                              isSelected
                                ? {
                                    borderColor: color.primary.accent,
                                    backgroundColor: color.primary.accent,
                                  }
                                : {}
                            }
                          >
                            {isSelected && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                        )}
                        {isAlreadyLinked && (
                          <div className="w-6 h-6 rounded border-2 border-gray-300 bg-gray-200 flex items-center justify-center">
                            <Check className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setIsAddProductModalOpen(false);
                setSelectedProductsToAdd([]);
                setProductSearchTerm("");
              }}
              disabled={isLinkingProducts}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAddProducts}
              disabled={isLinkingProducts || selectedProductsToAdd.length === 0}
              className="px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
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
      </RegularModal>

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
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
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
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
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
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
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
