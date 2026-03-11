import { useState, useEffect, useCallback, useRef } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { Target, Users, Gift, Calendar, Eye } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  useFormDataPersistence,
  clearPersistedFormData,
  getPersistedFormData,
} from "../../../shared/hooks/useFormDataPersistence";
import { useFormCleanupOnExit } from "../../../shared/hooks/useFormCleanupOnExit";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import ProgressStepper, {
  Step,
} from "../../../shared/components/ui/ProgressStepper";
import {
  CampaignSegment,
  CampaignOffer,
  ControlGroup,
  CampaignScheduling,
  BackendCampaignType,
  CampaignFormData,
  StepProps,
  SegmentOfferMapping,
} from "../types/campaign";
import { CreateCampaignRequest } from "../types/createCampaign";
import { campaignService } from "../services/campaignService";
import { campaignFlowService } from "../services/campaignFlowService";
import { CampaignFlowConfig, CampaignFlowResponseData } from "../types/campaignFlow";
import { departmentsConfig } from "../../../shared/configs/configurationPageConfigs";

// Objective options mapping
const objectiveOptions = [
  { value: "acquisition", label: "New Customer Acquisition" },
  { value: "retention", label: "Customer Retention" },
  { value: "churn_prevention", label: "Churn Prevention" },
  { value: "upsell_cross_sell", label: "Upsell/Cross-sell" },
  { value: "reactivation", label: "Dormant Customer Reactivation" },
];

// Helper function to map objective label back to value
const mapObjectiveLabelToValue = (
  labelOrValue: string | undefined
): string => {
  if (!labelOrValue) return "acquisition";
  // Check if it's already a value
  if (["acquisition", "retention", "churn_prevention", "upsell_cross_sell", "reactivation"].includes(labelOrValue)) {
    return labelOrValue;
  }
  // Find by label
  const found = objectiveOptions.find((o) => o.label === labelOrValue);
  return found?.value || "acquisition";
};
import CampaignDefinitionStep from "../components/steps/CampaignDefinitionStep";
import AudienceConfigurationStep from "../components/steps/AudienceConfigurationStep";
import CampaignFlowsStep from "../components/steps/CampaignFlowsStep";
import SchedulingStep from "../components/steps/SchedulingStep";
import CampaignPreviewStep from "../components/steps/CampaignPreviewStep";
import ExecuteCampaignModal from "../components/ExecuteCampaignModal";

const steps: Step[] = [
  {
    id: 1,
    name: "Definition",
    description: "Campaign goals & objectives",
    icon: Target,
  },
  {
    id: 2,
    name: "Audience",
    description: "Segment configuration",
    icon: Users,
  },
  {
    id: 3,
    name: "Map Segments to Offers",
    description: "Configure segment-offer mappings",
    icon: Gift,
  },
  {
    id: 4,
    name: "Scheduling",
    description: "Broadcast schedule",
    icon: Calendar,
  },
  {
    id: 5,
    name: "Preview",
    description: "Review & launch",
    icon: Eye,
  },
];

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  // isEditMode: true only when accessing via /campaigns/:id/edit route (editing existing campaign from list)
  const isEditMode = Boolean(id);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<number | null>(
    null,
  );
  const [createdCampaignName, setCreatedCampaignName] = useState<string>("");
  const hasRestoredDataRef = useRef(false);

  // Scroll to top when step changes
  useEffect(() => {
    // Function to perform scroll
    const performScroll = () => {
      // Scroll window
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      // Scroll document elements
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
      // Scroll any scrollable containers
      const scrollableContainers = document.querySelectorAll(
        '[style*="overflow"], [class*="overflow"]',
      );
      scrollableContainers.forEach((container) => {
        if (container instanceof HTMLElement && container.scrollTop > 0) {
          container.scrollTop = 0;
        }
      });
    };

    // Immediate scroll
    performScroll();

    // Scroll after render (using requestAnimationFrame)
    requestAnimationFrame(() => {
      performScroll();
    });

    // Also scroll after delays to catch any delayed renders
    const timeoutId1 = setTimeout(performScroll, 50);
    const timeoutId2 = setTimeout(performScroll, 150);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [currentStep]);

  // Get params from URL
  const categoryIdParam = searchParams.get("categoryId");
  const duplicateIdParam = searchParams.get("duplicateId");
  const preselectedCategoryId = categoryIdParam
    ? Number(categoryIdParam)
    : undefined;

  const [formData, setFormData] = useState<CampaignFormData>({
    name: "",
    description: "",
    objective: "acquisition",
    category_id: preselectedCategoryId,
    start_date: undefined,
    end_date: undefined,
    budget_allocated: undefined,
  });

  const [selectedSegments, setSelectedSegments] = useState<CampaignSegment[]>(
    [],
  );
  const [selectedOffers, setSelectedOffers] = useState<CampaignOffer[]>([]);
  const [segmentOfferMappings, setSegmentOfferMappings] = useState<
    SegmentOfferMapping[]
  >([]);
  const [campaignFlows, setCampaignFlows] = useState<CampaignFlowResponseData[]>([]);
  const [originalFlows, setOriginalFlows] = useState<CampaignFlowResponseData[]>([]); // Track original flows for edit mode
  const [controlGroup, setControlGroup] = useState<ControlGroup>({
    enabled: false,
    percentage: 5,
    type: "standard",
  });

  // Seed list state
  const [seedListMode, setSeedListMode] = useState<"all" | "per-segment">("all");
  const [segmentSeedLists, setSegmentSeedLists] = useState<Record<string, string[]>>({});

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Persist form data to localStorage - ONLY in create mode
  // In edit mode, pass true as 4th parameter to skip loading from localStorage
  useFormDataPersistence(
    "campaign_form_data",
    formData,
    setFormData,
    isEditMode, // Skip localStorage in edit mode
  );
  useFormDataPersistence(
    "campaign_segments",
    selectedSegments,
    setSelectedSegments,
    isEditMode,
  );
  useFormDataPersistence(
    "campaign_offers",
    selectedOffers,
    setSelectedOffers,
    isEditMode,
  );
  useFormDataPersistence(
    "campaign_mappings",
    segmentOfferMappings,
    setSegmentOfferMappings,
    isEditMode,
  );
  useFormDataPersistence(
    "campaign_seed_list_mode",
    seedListMode,
    setSeedListMode,
    isEditMode,
  );
  useFormDataPersistence(
    "campaign_segment_seed_lists",
    segmentSeedLists,
    setSegmentSeedLists,
    isEditMode,
  );

  // Handle campaign flows persistence - only in create mode
  useEffect(() => {
    if (isEditMode) {
      // In edit mode: clear persisted flows to ensure fresh API data
      clearPersistedFormData("campaign_flows");
    } else {
      // In create mode: load from localStorage if exists
      const savedFlows = getPersistedFormData<CampaignFlowConfig[]>("campaign_flows");
      if (savedFlows) {
        setCampaignFlows(savedFlows);
      }
    }
  }, [isEditMode]);

  // Auto-save flows to localStorage during create (but not edit)
  useEffect(() => {
    if (!isEditMode && campaignFlows.length > 0) {
      localStorage.setItem("campaign_flows", JSON.stringify(campaignFlows));
    }
  }, [campaignFlows, isEditMode]);

  // Clear persisted form data when user exits the creation flow
  useFormCleanupOnExit("campaign_form_data");
  useFormCleanupOnExit("campaign_segments");
  useFormCleanupOnExit("campaign_offers");
  useFormCleanupOnExit("campaign_mappings");
  useFormCleanupOnExit("campaign_flows");
  useFormCleanupOnExit("campaign_seed_list_mode");
  useFormCleanupOnExit("campaign_segment_seed_lists");

  const loadCampaignData = useCallback(
    async (
      campaignId: string,
      isDuplicate: boolean = false,
      skipFormData: boolean = false,
      silent: boolean = false,
    ) => {
      if (!campaignId) return;

      if (!silent) {
        setIsLoadingCampaign(true);
      }
      try {
        const response = await campaignService.getCampaignById(campaignId, true);
        const campaign =
          (response as { data?: BackendCampaignType } | BackendCampaignType)
            .data || response;

        // Only set form data if not already populated from state
        if (!skipFormData) {
          // Set form data with all available fields
          // If duplicating, prefix name with "Copy of "
          const newFormData: CampaignFormData = {
            name: isDuplicate
              ? `Copy of ${campaign?.name}`
              : campaign?.name || "",
            description: campaign?.description || "",
            objective: mapObjectiveLabelToValue(campaign?.objective),
            category_id: campaign?.category_id || undefined,
            program_id: campaign?.program_id || undefined,
            start_date: campaign?.start_date || undefined,
            end_date: campaign?.end_date || undefined,
            campaign_type: campaign?.campaign_type || "multiple_target_group",
            // Load tags as array
            tags: (campaign?.tags || []).map((tag: any) =>
              typeof tag === "string" ? tag : (tag?.name || String(tag))
            ),
            // Load department_id if owner_team matches a department name
            department_id: campaign?.owner_team ? undefined : undefined, // Will be set in UI selection
            // Load budget_allocated - convert string to number for the form
            budget_allocated: campaign?.budget_allocated
              ? parseFloat(campaign.budget_allocated)
              : undefined,
            // Load priority fields
            priority: campaign?.priority || undefined,
            priority_rank: campaign?.priority_rank || undefined,
          };
          setFormData(newFormData);
        }

        // Load segments and offers via campaign flows service
        try {
          // Use campaignFlowService to get segments and offers for this campaign
          const [segmentsResponse, offersResponse] = await Promise.all([
            campaignFlowService.getCampaignSegments(parseInt(campaignId), true),
            campaignFlowService.getCampaignOffers(parseInt(campaignId), true),
          ]);

          // Process segments from campaign flows
          if (segmentsResponse.success && segmentsResponse.data?.length > 0) {
            const validSegments: CampaignSegment[] = segmentsResponse.data
              .map((segment) => {
                if (!segment || !segment.segment_id) {
                  console.warn("Segment data invalid:", segment);
                  return null;
                }
                return {
                  id: String(segment.segment_id),
                  name: segment.segment_name,
                  description: segment.description || "",
                  customer_count: segment.customer_count || segment.size_estimate || 0,
                  criteria: {},
                  created_at: segment.created_at,
                } as CampaignSegment;
              })
              .filter((s): s is CampaignSegment => s !== null);

            setSelectedSegments(validSegments);
          }

          // Process offers from campaign flows
          if (offersResponse.success && offersResponse.data?.length > 0) {
            const validOffers: CampaignOffer[] = offersResponse.data
              .map((offer: any) => {
                if (!offer || !offer.offer_id) {
                  console.warn("Offer data invalid:", offer);
                  return null;
                }

                // Calculate validity period from valid_from and valid_to
                let validityPeriod = 30;
                if (offer.valid_from && offer.valid_to) {
                  const from = new Date(offer.valid_from);
                  const to = new Date(offer.valid_to);
                  validityPeriod = Math.ceil(
                    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
                  );
                }

                // Determine reward type and value based on available fields
                let rewardType:
                  | "bundle"
                  | "points"
                  | "discount"
                  | "cashback"
                  | "free_service" = "discount";
                let rewardValue = "0";
                if (offer.discount_percentage) {
                  rewardType = "discount";
                  rewardValue = String(offer.discount_percentage);
                } else if (offer.discount_amount) {
                  rewardType = "cashback";
                  rewardValue = String(offer.discount_amount);
                } else if (offer.bonus_value) {
                  rewardType = "points";
                  rewardValue = String(offer.bonus_value);
                }

                return {
                  id: String(offer.offer_id),
                  name: offer.offer_name,
                  description: offer.description || "",
                  offer_type: offer.offer_type || "General",
                  reward_type: rewardType,
                  reward_value: rewardValue,
                  validity_period: validityPeriod,
                  terms_conditions: JSON.stringify(
                    offer.eligibility_rules || {},
                  ),
                } as CampaignOffer;
              })
              .filter((o): o is CampaignOffer => o !== null);

            setSelectedOffers(validOffers);
          }
        } catch (campaignFlowsError) {
          console.error("Failed to load segments/offers from campaign flows:", campaignFlowsError);
        }

        // Load campaign flows if they exist
        try {
          const flowsResponse = await campaignFlowService.getCampaignFlows(
            parseInt(campaignId),
          );

          if (flowsResponse.success && flowsResponse.data.length > 0) {
            // Convert API response to CampaignFlowResponseData format (includes id)
            const flows: CampaignFlowResponseData[] = flowsResponse.data
              .map((flow) => {
                // Null checks for critical fields
                if (!flow || !flow.id || !flow.campaign_id || !flow.offer_id) {
                  console.warn("Flow data invalid:", flow);
                  return null;
                }
                return {
                  id: flow.id,
                  campaign_id: flow.campaign_id,
                  segment_id:
                    typeof flow.segment_id === "string" && flow.segment_id
                      ? parseInt(flow.segment_id)
                      : flow.segment_id || 0,
                  offer_id: flow.offer_id,
                  offer_creative_id: flow.offer_creative_id || undefined,
                  template_id: flow.template_id || undefined,
                  flow_type: flow.flow_type || "",
                  step_order: flow.step_order || 0,
                  wait_interval_hours: flow.wait_interval_hours || 0,
                  bucket_allocation: flow.bucket_allocation || undefined,
                  condition_rule: flow.condition_rule || undefined,
                  is_active: flow.is_active ?? true,
                  created_at: flow.created_at || "",
                  updated_at: flow.updated_at || "",
                  created_by: flow.created_by || null,
                  updated_by: flow.updated_by || null,
                };
              })
              .filter((f): f is CampaignFlowResponseData => f !== null);

            setCampaignFlows(flows);
            // Store original flows for edit mode comparison
            setOriginalFlows(JSON.parse(JSON.stringify(flows)));
          }
        } catch (flowError) {
          console.error("Failed to load campaign flows:", flowError);
          // Non-critical error - continue anyway
        }
      } catch {
        if (!silent) {
          showToast("error", t.campaigns.failedToLoadCampaign);
          navigate("/dashboard/campaigns");
        }
      } finally {
        if (!silent) {
          setIsLoadingCampaign(false);
        }
      }
    },
    [showToast, navigate, t],
  );

  // Restore campaign data when returning from offer creation
  useEffect(() => {
    // Prevent multiple restorations - check both ref and sessionStorage flag
    const alreadyRestored =
      sessionStorage.getItem("campaignDataRestored") === "true";
    if (hasRestoredDataRef.current || alreadyRestored) {
      return;
    }

    // First check if returning from offer creation - restore saved campaign data
    const returnFromOfferCreate = searchParams.get("returnFromOfferCreate");
    const stepParam = searchParams.get("step");

    if (
      (returnFromOfferCreate === "true" || stepParam === "3") &&
      !id &&
      !duplicateIdParam
    ) {
      // Mark as restored immediately to prevent loops (both ref and sessionStorage)
      hasRestoredDataRef.current = true;
      sessionStorage.setItem("campaignDataRestored", "true");

      const savedData = sessionStorage.getItem("campaignFormData");

      if (savedData) {
        try {
          const campaignData = JSON.parse(savedData);

          // REMOVE saved data IMMEDIATELY to prevent loops
          sessionStorage.removeItem("campaignFormData");

          // Restore all data
          if (campaignData.formData) {
            setFormData(campaignData.formData);
            // Also restore to localStorage to persist the data
            localStorage.setItem(
              "campaign_form_data",
              JSON.stringify(campaignData.formData),
            );
          }
          if (
            campaignData.selectedSegments &&
            Array.isArray(campaignData.selectedSegments)
          ) {
            setSelectedSegments(campaignData.selectedSegments);
            // Also restore to localStorage to persist the data
            localStorage.setItem(
              "campaign_segments",
              JSON.stringify(campaignData.selectedSegments),
            );
          }
          if (
            campaignData.selectedOffers &&
            Array.isArray(campaignData.selectedOffers)
          ) {
            setSelectedOffers(campaignData.selectedOffers);
            // Also restore to localStorage to persist the data
            localStorage.setItem(
              "campaign_offers",
              JSON.stringify(campaignData.selectedOffers),
            );
          }
          if (
            campaignData.segmentOfferMappings &&
            Array.isArray(campaignData.segmentOfferMappings)
          ) {
            setSegmentOfferMappings(campaignData.segmentOfferMappings);
            // Also restore to localStorage to persist the data
            localStorage.setItem(
              "campaign_mappings",
              JSON.stringify(campaignData.segmentOfferMappings),
            );
          }
          if (campaignData.controlGroup) {
            setControlGroup(campaignData.controlGroup);
          }

          setCurrentStep(3);

          // Clean up URL parameters
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("returnFromOfferCreate");
          newParams.delete("step");
          setSearchParams(newParams, { replace: true });
          return; // Exit early to prevent loading campaign data
        } catch (error) {
          console.error("Failed to restore campaign data:", error);
          // Remove saved data even on error to prevent loops
          sessionStorage.removeItem("campaignFormData");
          setCurrentStep(3);

          // Clean up URL parameters even on error
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("returnFromOfferCreate");
          newParams.delete("step");
          setSearchParams(newParams, { replace: true });
          return;
        }
      } else {
        // No saved data, just clean up URL and set step
        hasRestoredDataRef.current = true;
        sessionStorage.setItem("campaignDataRestored", "true");
        setCurrentStep(3);
        // Clean up URL parameters
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("returnFromOfferCreate");
        newParams.delete("step");
        setSearchParams(newParams, { replace: true });
        return;
      }
    }

    // Then handle edit/duplicate mode (only if not returning from offer creation)
    if (id && !hasRestoredDataRef.current) {
      // Edit mode - modifying existing campaign
      // isEditMode already set in state initialization
      setIsDuplicateMode(false);

      // Always load from API in edit mode to get COMPLETE data
      // Don't rely on location.state as it may have incomplete campaign data
      loadCampaignData(id, false, false, false);
    } else if (duplicateIdParam && !hasRestoredDataRef.current) {
      // Duplicate mode - creating new campaign from existing one
      // No need to set isEditMode - state init handles it
      setIsDuplicateMode(true);
      loadCampaignData(duplicateIdParam, true);
    }
  }, [
    id,
    duplicateIdParam,
    loadCampaignData,
    searchParams,
    setSearchParams,
    location.state,
  ]);

  // Validation function for each step - returns validation errors
  const validateCurrentStep = (): {
    isValid: boolean;
    errors: { [key: string]: string };
  } => {
    const errors: { [key: string]: string } = {};

    switch (currentStep) {
      case 1: // Definition step
        if (!formData.name.trim()) {
          errors.name = "Campaign name is required";
        }
        if (!formData.objective) {
          errors.objective = "Primary objective is required";
        }
        if (!formData.category_id) {
          errors.category_id = "Campaign catalog is required";
        }
        // Budget is optional - only validate if provided and must be > 0
        if (
          formData.budget_allocated &&
          Number(formData.budget_allocated) <= 0
        ) {
          errors.budget_allocated = "Budget allocated must be greater than 0";
        }
        // Validate date range if both dates are provided
        if (formData.start_date && formData.end_date) {
          const startDate = new Date(formData.start_date);
          const endDate = new Date(formData.end_date);
          if (endDate < startDate) {
            errors.end_date = "End date must be after start date";
          }
        }
        return { isValid: Object.keys(errors).length === 0, errors };

      case 2: // Audience step
        if (selectedSegments.length === 0) {
          errors.segments = "At least one segment must be selected";
        }
        // Validate campaign type specific requirements
        if (
          formData.campaign_type === "ab_test" &&
          selectedSegments.length !== 2
        ) {
          errors.segments = "A/B Test campaigns require exactly 2 segments";
        }
        if (
          (formData.campaign_type === "round_robin" ||
            formData.campaign_type === "multiple_level") &&
          selectedSegments.length !== 1
        ) {
          errors.segments = "This campaign type requires exactly 1 segment";
        }
        return { isValid: Object.keys(errors).length === 0, errors };

      case 3: // Campaign Flows step
        // Validate that at least one flow is configured
        if (campaignFlows.length === 0) {
          errors.flows = "At least one delivery flow must be configured";
        }

        // Validate each flow has required fields
        for (const flow of campaignFlows) {
          if (!flow.segment_id) {
            errors.flows = "All flows must have a segment selected";
            break;
          }
          if (!flow.offer_id) {
            errors.flows = "All flows must have an offer selected";
            break;
          }
        }

        return { isValid: Object.keys(errors).length === 0, errors };

      case 4: // Scheduling step
        // Scheduling step has default values, no validation needed
        return { isValid: true, errors: {} };

      case 5: // Preview step
        // Preview step doesn't need validation
        return { isValid: true, errors: {} };

      default:
        return { isValid: false, errors: {} };
    }
  };

  const canNavigateToStep = (targetStep: number) => {
    // Can always go to previous steps
    if (targetStep < currentStep) return true;

    // Can't go to future steps beyond current + 1
    if (targetStep > currentStep + 1) return false;

    // Can go to next step only if current step is valid
    if (targetStep === currentStep + 1) return validateCurrentStep().isValid;

    // Can stay on current step
    if (targetStep === currentStep) return true;

    return false;
  };

  const handleNext = () => {
    const validation = validateCurrentStep();
    setValidationErrors(validation.errors);

    if (validation.isValid && currentStep < steps.length) {
      // Save campaign data before moving to next step
      saveCampaignDataToSession();

      setCurrentStep(currentStep + 1);
      // Clear errors when moving to next step
      setValidationErrors({});
    }
  };

  // Function to save campaign data to sessionStorage
  const saveCampaignDataToSession = useCallback(() => {
    // Don't save if we're in edit or duplicate mode
    if (id || duplicateIdParam) {
      return;
    }

    try {
      const campaignData = {
        formData: JSON.parse(JSON.stringify(formData)),
        selectedSegments: JSON.parse(JSON.stringify(selectedSegments)),
        selectedOffers: JSON.parse(JSON.stringify(selectedOffers)),
        segmentOfferMappings: JSON.parse(JSON.stringify(segmentOfferMappings)),
        campaignFlows: JSON.parse(JSON.stringify(campaignFlows)),
        controlGroup: JSON.parse(JSON.stringify(controlGroup)),
        currentStep: currentStep,
      };
      sessionStorage.setItem("campaignFormData", JSON.stringify(campaignData));
    } catch (error) {
      console.error("Error saving campaign data to session:", error);
    }
  }, [
    formData,
    selectedSegments,
    selectedOffers,
    segmentOfferMappings,
    campaignFlows,
    controlGroup,
    currentStep,
    id,
    duplicateIdParam,
  ]);

  // Continuously save campaign data to sessionStorage whenever it changes
  useEffect(() => {
    // Only save if we're not in edit/duplicate mode and we have some data
    if (
      !id &&
      !duplicateIdParam &&
      (formData.name || selectedSegments.length > 0)
    ) {
      saveCampaignDataToSession();
    }
  }, [
    formData,
    selectedSegments,
    selectedOffers,
    segmentOfferMappings,
    campaignFlows,
    controlGroup,
    currentStep,
    id,
    duplicateIdParam,
    saveCampaignDataToSession,
  ]);

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    if (canNavigateToStep(stepId)) {
      setCurrentStep(stepId);
    }
  };

  // Generate unique campaign code from name
  const generateCampaignCode = (name: string): string => {
    // Remove special characters and convert to uppercase
    const sanitized = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    // Get current year
    const year = new Date().getFullYear();

    // Generate random suffix for uniqueness (4 characters)
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

    // Create code: First 3 words of name + year + random suffix
    const words = sanitized.split("_").filter((w) => w.length > 0);
    const prefix = words.slice(0, 3).join("_");

    return `${prefix}_${year}_${randomSuffix}`;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!formData.name.trim()) {
        showToast("error", t.campaigns.campaignDefinition.nameRequired);
        setIsLoading(false);
        return;
      }

      if (selectedSegments.length === 0) {
        showToast("error", t.campaigns.audienceConfiguration.requiresSegment);
        setIsLoading(false);
        return;
      }

      // Get objective label from value (used in both update and create paths)
      const objectiveOption = objectiveOptions.find(
        (o: { value: string; label: string }) =>
          o.value === formData.objective,
      );
      const objectiveLabel = objectiveOption
        ? objectiveOption.label
        : formData.objective;

      // Get tags array directly from formData
      const tagsArray = formData.tags || [];

      // Get department name from formData.department_id
      const departmentId = (formData as { department_id?: number })
        .department_id;
      const department = departmentId
        ? departmentsConfig.initialData.find(
            (d: { id: number | string; name: string }) =>
              Number(d.id) === Number(departmentId),
          )
        : undefined;
      const ownerTeam = department?.name || undefined;

      if (isEditMode && id) {
        // Editing existing campaign from list - UPDATE endpoint
        const updateData: Partial<CreateCampaignRequest> = {
          name: formData.name,
          objective: objectiveLabel, // Send label text, not value
          updated_by: user?.user_id || 1,
          ...(formData.description && { description: formData.description }),
          ...(formData.category_id && { category_id: formData.category_id }),
          ...(formData.program_id && { program_id: formData.program_id }),
          ...(formData.start_date && { start_date: formData.start_date }),
          ...(formData.end_date && { end_date: formData.end_date }),
          ...(tagsArray.length > 0 && { tags: tagsArray }),
          ...(ownerTeam && { owner_team: ownerTeam }),
          ...(formData.budget_allocated && {
            budget_allocated: String(formData.budget_allocated),
          }),
        };

        await campaignService.updateCampaign(parseInt(id), updateData);

        // Handle campaign flows updates (create, update, delete)
        if (campaignFlows && campaignFlows.length > 0) {
          try {
            if (originalFlows.length > 0) {
              // EDIT MODE: Compare and sync flows (delete/update/create)

              // 1. DELETE flows that are no longer in the list
              for (const originalFlow of originalFlows) {
                const stillExists = campaignFlows.some(
                  (f) =>
                    f.segment_id === originalFlow.segment_id &&
                    f.offer_id === originalFlow.offer_id,
                );
                if (!stillExists && originalFlow.id) {
                  try {
                    await campaignFlowService.deleteCampaignFlow(
                      originalFlow.id,
                    );
                  } catch (deleteError) {
                    console.error("Error deleting flow:", deleteError);
                  }
                }
              }

              // 2. UPDATE existing flows that changed
              for (const updatedFlow of campaignFlows) {
                const originalFlow = originalFlows.find(
                  (f) =>
                    f.segment_id === updatedFlow.segment_id &&
                    f.offer_id === updatedFlow.offer_id,
                );
                if (
                  originalFlow &&
                  originalFlow.id &&
                  JSON.stringify(originalFlow) !== JSON.stringify(updatedFlow)
                ) {
                  try {
                    await campaignFlowService.updateCampaignFlow(
                      originalFlow.id,
                      updatedFlow,
                    );
                  } catch (updateError) {
                    console.error("Error updating flow:", updateError);
                  }
                }
              }

              // 3. CREATE new flows
              const newFlows = campaignFlows.filter(
                (f) =>
                  !originalFlows.some(
                    (of) =>
                      of.segment_id === f.segment_id &&
                      of.offer_id === f.offer_id,
                  ),
              );
              if (newFlows.length > 0) {
                const flowsToCreate: CampaignFlowConfig[] = newFlows.map(
                  (flow, index) => ({
                    ...flow,
                    campaign_id: parseInt(id),
                    step_order: index + 1,
                    created_by: user?.user_id || 1,
                  }),
                );
                await campaignFlowService.createBatchCampaignFlows(
                  flowsToCreate,
                );
              }
            } else {
              // No existing flows - create all new flows
              const flowsToCreate: CampaignFlowConfig[] = campaignFlows.map(
                (flow, index) => ({
                  ...flow,
                  campaign_id: parseInt(id),
                  step_order: index + 1,
                  created_by: user?.user_id || 1,
                }),
              );
              await campaignFlowService.createBatchCampaignFlows(
                flowsToCreate,
              );
            }
          } catch (flowError) {
            console.error("Error updating campaign flows:", flowError);
          }
        }

        showToast(
          "success",
          `"${formData.name}" ${t.campaigns.campaignDefinition.updateSuccess}`,
        );
      } else if (createdCampaignId) {
        // Create session with saved draft - UPDATE endpoint
        const updateData: Partial<CreateCampaignRequest> = {
          name: formData.name,
          objective: objectiveLabel,
          ...(formData.description && { description: formData.description }),
          ...(formData.category_id && { category_id: formData.category_id }),
          ...(formData.program_id && { program_id: formData.program_id }),
          ...(formData.start_date && { start_date: formData.start_date }),
          ...(formData.end_date && { end_date: formData.end_date }),
          ...(tagsArray.length > 0 && { tags: tagsArray }),
          ...(ownerTeam && { owner_team: ownerTeam }),
          ...(formData.budget_allocated && {
            budget_allocated: String(formData.budget_allocated),
          }),
        };

        await campaignService.updateCampaign(createdCampaignId, updateData);

        // Handle campaign flows for create session (similar to edit mode)
        if (campaignFlows && campaignFlows.length > 0) {
          try {
            if (originalFlows.length > 0) {
              // Compare and sync flows (delete/update/create)
              // 1. DELETE flows that are no longer in the list
              for (const originalFlow of originalFlows) {
                const stillExists = campaignFlows.some(
                  (f) =>
                    f.segment_id === originalFlow.segment_id &&
                    f.offer_id === originalFlow.offer_id,
                );
                if (!stillExists && originalFlow.id) {
                  try {
                    await campaignFlowService.deleteCampaignFlow(
                      originalFlow.id,
                    );
                  } catch (deleteError) {
                    console.error("Error deleting flow:", deleteError);
                  }
                }
              }

              // 2. UPDATE existing flows that changed
              for (const updatedFlow of campaignFlows) {
                const originalFlow = originalFlows.find(
                  (f) =>
                    f.segment_id === updatedFlow.segment_id &&
                    f.offer_id === updatedFlow.offer_id,
                );
                if (
                  originalFlow &&
                  originalFlow.id &&
                  JSON.stringify(originalFlow) !== JSON.stringify(updatedFlow)
                ) {
                  try {
                    await campaignFlowService.updateCampaignFlow(
                      originalFlow.id,
                      updatedFlow,
                    );
                  } catch (updateError) {
                    console.error("Error updating flow:", updateError);
                  }
                }
              }

              // 3. CREATE new flows
              const newFlows = campaignFlows.filter(
                (f) =>
                  !originalFlows.some(
                    (of) =>
                      of.segment_id === f.segment_id &&
                      of.offer_id === f.offer_id,
                  ),
              );
              if (newFlows.length > 0) {
                const flowsToCreate: CampaignFlowConfig[] = newFlows.map(
                  (flow, index) => ({
                    ...flow,
                    campaign_id: createdCampaignId,
                    step_order: index + 1,
                    created_by: user?.user_id || 1,
                  }),
                );
                await campaignFlowService.createBatchCampaignFlows(
                  flowsToCreate,
                );
              }
            } else {
              // No existing flows - create all new flows
              const flowsToCreate: CampaignFlowConfig[] = campaignFlows.map(
                (flow, index) => ({
                  ...flow,
                  campaign_id: createdCampaignId,
                  step_order: index + 1,
                  created_by: user?.user_id || 1,
                }),
              );
              await campaignFlowService.createBatchCampaignFlows(
                flowsToCreate,
              );
            }
          } catch (flowError) {
            console.error("Error updating campaign flows:", flowError);
          }
        }

        showToast("success", `"${formData.name}" campaign created successfully!`);
      } else {
        // Create new campaign first time - POST endpoint
        const campaignCode = generateCampaignCode(formData.name);

        // Get objective label from value
        const objectiveOption = objectiveOptions.find(
          (o: { value: string; label: string }) =>
            o.value === formData.objective,
        );
        const objectiveLabel = objectiveOption
          ? objectiveOption.label
          : formData.objective;

        // Get tags array directly from formData
        const tagsArray = formData.tags || [];

        // Get department name from formData.department_id
        const departmentId = (formData as { department_id?: number })
          .department_id;
        const department = departmentId
          ? departmentsConfig.initialData.find(
              (d: { id: number | string; name: string }) =>
                Number(d.id) === Number(departmentId),
            )
          : undefined;
        const ownerTeam = department?.name || undefined;

        const campaignData: CreateCampaignRequest = {
          name: formData.name,
          code: campaignCode,
          objective: objectiveLabel, // Send label text, not value
          status: "draft", // New campaigns start as draft
          created_by: user?.user_id || 1,
          ...(formData.description && { description: formData.description }),
          ...(formData.category_id && { category_id: formData.category_id }),
          ...(formData.program_id && { program_id: formData.program_id }),
          ...(formData.start_date && { start_date: formData.start_date }),
          ...(formData.end_date && { end_date: formData.end_date }),
          ...(tagsArray.length > 0 && { tags: tagsArray }),
          ...(ownerTeam && { owner_team: ownerTeam }),
          budget_allocated: String(formData.budget_allocated || 0),
        };
        // New campaigns are created with status: 'draft' and approval_status: 'pending'
        const createResponse =
          await campaignService.createCampaign(campaignData);

        // Check if backend returned an error
        if (
          createResponse &&
          typeof createResponse === "object" &&
          "success" in createResponse &&
          !createResponse.success
        ) {
          const errorMessage =
            (createResponse as { error?: string }).error ||
            "Failed to create campaign";
          throw new Error(errorMessage);
        }

        // Extract campaign ID from response
        const createdCampaignIdValue = createResponse?.data?.id;

        if (!createdCampaignIdValue) {
          throw new Error("Campaign created but ID not returned");
        }

        // Store for execution modal
        setCreatedCampaignId(createdCampaignIdValue);
        setCreatedCampaignName(formData.name);

        // Save segments (Step 2) for all campaign types
        if (selectedSegments.length > 0) {
          try {
            // Add each segment to the campaign
            for (const segment of selectedSegments) {
              await campaignService.addCampaignSegment(createdCampaignIdValue, {
                segment_id: parseInt(segment.id),
                is_primary: segment.priority === 1,
                include_exclude: segment.include_exclude || "include",
                created_by: user?.user_id || 1,
              });
            }
          } catch (segmentError) {
            console.error("Error saving segments:", segmentError);
            showToast("warning", t.messages.warning || "Warning");
          }
        }

        // Handle campaign flows (create, update, delete)
        if (campaignFlows && campaignFlows.length > 0) {
          try {
            if (isEditMode && originalFlows.length > 0) {
              // EDIT MODE: Compare and sync flows (delete/update/create)

              // 1. DELETE flows that are no longer in the list
              for (const originalFlow of originalFlows) {
                const stillExists = campaignFlows.some(
                  (f) =>
                    f.segment_id === originalFlow.segment_id &&
                    f.offer_id === originalFlow.offer_id,
                );
                if (!stillExists && originalFlow.id) {
                  try {
                    await campaignFlowService.deleteCampaignFlow(
                      originalFlow.id,
                    );
                  } catch (deleteError) {
                    console.error("Error deleting flow:", deleteError);
                  }
                }
              }

              // 2. UPDATE existing flows that changed
              for (const updatedFlow of campaignFlows) {
                const originalFlow = originalFlows.find(
                  (f) =>
                    f.segment_id === updatedFlow.segment_id &&
                    f.offer_id === updatedFlow.offer_id,
                );
                if (
                  originalFlow &&
                  originalFlow.id &&
                  JSON.stringify(originalFlow) !== JSON.stringify(updatedFlow)
                ) {
                  try {
                    await campaignFlowService.updateCampaignFlow(
                      originalFlow.id,
                      updatedFlow,
                    );
                  } catch (updateError) {
                    console.error("Error updating flow:", updateError);
                  }
                }
              }

              // 3. CREATE new flows
              const newFlows = campaignFlows.filter(
                (f) =>
                  !originalFlows.some(
                    (of) =>
                      of.segment_id === f.segment_id &&
                      of.offer_id === f.offer_id,
                  ),
              );
              if (newFlows.length > 0) {
                const flowsToCreate: CampaignFlowConfig[] = newFlows.map(
                  (flow, index) => ({
                    ...flow,
                    campaign_id: createdCampaignIdValue,
                    step_order: index + 1,
                    created_by: user?.user_id || 1,
                  }),
                );
                await campaignFlowService.createBatchCampaignFlows(
                  flowsToCreate,
                );
              }

              showToast("success", "Campaign updated successfully");
            } else {
              // CREATE MODE: Create all flows as new
              const flowsToCreate: CampaignFlowConfig[] = campaignFlows.map(
                (flow, index) => ({
                  ...flow,
                  campaign_id: createdCampaignIdValue,
                  step_order: index + 1,
                  created_by: user?.user_id || 1,
                }),
              );

              await campaignFlowService.createBatchCampaignFlows(flowsToCreate);
              showToast("success", t.messages.success || "Success");
            }
          } catch (flowError) {
            console.error("Error saving campaign flows:", flowError);
            showToast("warning", t.messages.warning || "Warning");
          }
        } else {
          showToast(
            "success",
            `"${formData.name}" ${t.campaigns.campaignDefinition.createSuccess}`,
          );
        }

        // Clear campaign flow tracking and saved data
        sessionStorage.removeItem("campaignFlowCreatedOffers");
        sessionStorage.removeItem("campaignFormData");
        sessionStorage.removeItem("offerModalAutoOpened");
        sessionStorage.removeItem("campaignDataRestored");

        // Clear localStorage form data
        clearPersistedFormData("campaign_form_data");
        clearPersistedFormData("campaign_segments");
        clearPersistedFormData("campaign_offers");
        clearPersistedFormData("campaign_mappings");
        clearPersistedFormData("campaign_flows");

        // Navigate to campaigns list
        navigate("/dashboard/campaigns");
      }

      // Clear campaign flow tracking and saved data when campaign is created/updated
      sessionStorage.removeItem("campaignFlowCreatedOffers");
      sessionStorage.removeItem("campaignFormData");
      sessionStorage.removeItem("offerModalAutoOpened");
      sessionStorage.removeItem("campaignDataRestored");

      // Clear localStorage form data after successful submission
      clearPersistedFormData("campaign_form_data");
      clearPersistedFormData("campaign_segments");
      clearPersistedFormData("campaign_offers");
      clearPersistedFormData("campaign_mappings");

      // If editing, just navigate back
      navigate("/dashboard/campaigns");
    } catch (error) {
      console.error("Failed to create/update campaign:", error);

      // Extract error message from backend response
      let errorMessage = isEditMode
        ? t.campaigns.campaignDefinition.saveFailed
        : t.campaigns.campaignDefinition.saveFailed;

      if (error instanceof Error) {
        // Check if the error message contains backend error details
        errorMessage = error.message;

        // If the error message looks like a backend error format, use it directly
        if (
          error.message &&
          error.message !== "HTTP error! status: undefined"
        ) {
          errorMessage = error.message;
        }
      } else if (error && typeof error === "object") {
        // Check for backend error response structure
        const backendError = error as {
          error?: string;
          data?: { error?: string; success?: boolean };
          response?: { error?: string };
          message?: string;
        };

        if (backendError.error) {
          errorMessage = backendError.error;
        } else if (backendError.data?.error) {
          errorMessage = backendError.data.error;
        } else if (backendError.response?.error) {
          errorMessage = backendError.response.error;
        } else if (backendError.message) {
          errorMessage = backendError.message;
        }
      }

      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      if (!formData.name.trim()) {
        showToast("error", t.campaigns.campaignDefinition.nameRequired);
        return;
      }

      // Generate unique code from campaign name
      const campaignCode = generateCampaignCode(formData.name);

      // Get objective label from value
      const objectiveOption = objectiveOptions.find(
        (o: { value: string; label: string }) => o.value === formData.objective,
      );
      const objectiveLabel = objectiveOption
        ? objectiveOption.label
        : formData.objective;

      // Get tags array directly from formData
      const tagsArray = formData.tags || [];

      // Get department name from formData.department_id
      const departmentId = (formData as { department_id?: number })
        .department_id;
      const department = departmentId
        ? departmentsConfig.initialData.find(
            (d: { id: number | string; name: string }) =>
              Number(d.id) === Number(departmentId),
          )
        : undefined;
      const ownerTeam = department?.name || undefined;

      const baseDraftData: CreateCampaignRequest = {
        name: formData.name,
        code: campaignCode,
        objective: objectiveLabel,
        status: "draft", // Explicitly set as draft
        ...(formData.description && { description: formData.description }),
        ...(formData.category_id && { category_id: formData.category_id }),
        ...(formData.program_id && { program_id: formData.program_id }),
        ...(formData.start_date && { start_date: formData.start_date }),
        ...(formData.end_date && { end_date: formData.end_date }),
        ...(tagsArray.length > 0 && { tags: tagsArray }),
        ...(ownerTeam && { owner_team: ownerTeam }),
        budget_allocated: String(formData.budget_allocated || 0),
        ...(formData.priority && { priority: formData.priority }),
        ...(formData.priority_rank && {
          priority_rank: formData.priority_rank,
        }),
      };

      let campaignId: number;

      if (isEditMode && id) {
        // Editing existing campaign from list - use update endpoint
        await campaignService.updateCampaign(parseInt(id), baseDraftData);
        campaignId = parseInt(id);
        showToast("success", "Draft updated successfully!");
      } else if (createdCampaignId) {
        // Create session with existing draft - update the saved draft
        await campaignService.updateCampaign(createdCampaignId, baseDraftData);
        campaignId = createdCampaignId;
        showToast("success", "Draft saved successfully!");
      } else {
        // Create session without existing draft - create new campaign
        const draftData: CreateCampaignRequest = {
          ...baseDraftData,
          created_by: user?.user_id || 1,
        };
        const createResponse = await campaignService.createCampaign(draftData);
        campaignId = createResponse?.data?.id;

        if (!campaignId) {
          throw new Error("Campaign created but ID not returned");
        }
        // Store campaign ID for subsequent saves in this session
        setCreatedCampaignId(campaignId);
        showToast("success", "Draft saved successfully!");
      }
    } catch (error) {
      console.error("Error saving draft:", error);

      // Extract error message from backend response
      let errorMessage = t.messages.error || "Error";

      if (error instanceof Error) {
        // Check if the error message contains backend error details
        errorMessage = error.message;

        // If the error message looks like a backend error format, use it directly
        if (
          error.message &&
          error.message !== "HTTP error! status: undefined"
        ) {
          errorMessage = error.message;
        }
      } else if (error && typeof error === "object") {
        // Check for backend error response structure
        const backendError = error as {
          error?: string;
          data?: { error?: string; success?: boolean };
          response?: { error?: string };
          message?: string;
        };

        if (backendError.error) {
          errorMessage = backendError.error;
        } else if (backendError.data?.error) {
          errorMessage = backendError.data.error;
        } else if (backendError.response?.error) {
          errorMessage = backendError.response.error;
        } else if (backendError.message) {
          errorMessage = backendError.message;
        }
      }

      showToast("error", errorMessage);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleCancel = () => {
    // Clear campaign flow tracking and saved data when cancelling
    sessionStorage.removeItem("campaignFlowCreatedOffers");
    sessionStorage.removeItem("campaignFormData");
    sessionStorage.removeItem("offerModalAutoOpened");
    sessionStorage.removeItem("campaignDataRestored");
    navigate("/dashboard/campaigns");
  };

  // const handleReset = () => {
  //   setFormData({
  //     name: '',
  //     description: '',
  //     campaign_type: 'multiple_target_group',
  //     objective: 'acquisition',
  //     category: '',
  //     segments: [],
  //     offers: [],
  //     scheduling: {
  //       type: 'scheduled',
  //       time_zone: 'UTC',
  //       delivery_times: ['09:00'],
  //       frequency_capping: {
  //         max_per_day: 1,
  //         max_per_week: 3,
  //         max_per_month: 10
  //       },
  //       throttling: {
  //         max_per_hour: 1000,
  //         max_per_day: 10000
  //       }
  //     }
  //   });
  //   setSelectedSegments([]);
  //   setSelectedOffers([]);
  //   setControlGroup({
  //     enabled: false,
  //     percentage: 5,
  //     type: 'standard'
  //   });
  //   setCurrentStep(1);
  //   showToast('success', 'Form reset successfully');
  // };

  const stepProps: StepProps = {
    currentStep,
    totalSteps: steps.length,
    onNext: handleNext,
    onPrev: handlePrev,
    onSubmit: handleSubmit,
    formData,
    setFormData,
    selectedSegments,
    setSelectedSegments,
    selectedOffers,
    setSelectedOffers,
    segmentOfferMappings,
    setSegmentOfferMappings,
    campaignFlows,
    setCampaignFlows,
    controlGroup,
    setControlGroup,
    seedListMode,
    setSeedListMode,
    segmentSeedLists,
    setSegmentSeedLists,
    isLoading,
    onSaveDraft: handleSaveDraft,
    onCancel: handleCancel,
    validationErrors,
    clearValidationErrors: () => setValidationErrors({}),
    setValidationErrors,
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CampaignDefinitionStep {...stepProps} />;
      case 2:
        return <AudienceConfigurationStep {...stepProps} />;
      case 3:
        // Use new CampaignFlowsStep for flows-first approach
        return <CampaignFlowsStep {...stepProps} stepOrder={formData.step_order} />;
      case 4:
        return <SchedulingStep {...stepProps} />;
      case 5:
        return <CampaignPreviewStep {...stepProps} />;
      default:
        return <CampaignDefinitionStep {...stepProps} />;
    }
  };

  if (isLoadingCampaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        className={`bg-white ${tw.rounded} border p-4`}
        style={{ borderColor: color.border.default }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center space-x-3">
              <BackButton
                fallbackTo="/dashboard/campaigns"
                className="text-gray-400 hover:text-gray-600"
              />
              <h1 className={`text-lg font-semibold ${tw.textPrimary}`}>
                {isEditMode
                  ? "Edit Campaign"
                  : isDuplicateMode
                    ? "Duplicate Campaign"
                    : "Create Campaign"}
              </h1>
            </div>
            {currentStep !== 5 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:justify-end">
                <button
                  onClick={handleCancel}
                  className={`inline-flex w-full items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-all duration-200 sm:w-auto`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className={`inline-flex w-full items-center justify-center px-4 py-2 text-sm font-medium ${tw.rounded} text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  {isSavingDraft ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Draft"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sticky Progress Navigation */}
          <ProgressStepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            canNavigateToStep={canNavigateToStep}
            primaryColor={color.primary.action}
            textPrimary={tw.textPrimary}
            textMuted={tw.textMuted}
          />

          <div className="py-4">{renderStep()}</div>

          {/* Bottom Navigation */}
          <div className="sticky bottom-12 bg-white py-4 shadow-sm">
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Previous
              </button>
              <button
                onClick={currentStep === 5 ? handleSubmit : handleNext}
                disabled={isLoading || !validateCurrentStep().isValid}
                className={`inline-flex items-center px-5 py-2 text-sm font-medium ${tw.rounded} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: color.primary.action }}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {currentStep === 5
                      ? isEditMode
                        ? "Updating..."
                        : "Creating..."
                      : "Loading..."}
                  </>
                ) : currentStep === 5 ? (
                  isEditMode ? (
                    "Update Campaign"
                  ) : (
                    "Create Campaign"
                  )
                ) : (
                  "Next Step"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Execute Campaign Modal */}
      {createdCampaignId && createdCampaignName && (
        <ExecuteCampaignModal
          isOpen={showExecuteModal}
          onClose={() => {
            setShowExecuteModal(false);
            navigate("/dashboard/campaigns");
          }}
          campaignId={createdCampaignId}
          campaignName={createdCampaignName}
          onSuccess={() => {
            navigate("/dashboard/campaigns");
          }}
        />
      )}
    </div>
  );
}
