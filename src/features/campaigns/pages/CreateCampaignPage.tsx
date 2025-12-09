import { useState, useEffect, useCallback, useRef } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { ArrowLeft, Target, Users, Gift, Calendar, Eye } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ProgressStepper, {
  Step,
} from "../../../shared/components/ui/ProgressStepper";
import {
  CampaignSegment,
  CampaignOffer,
  ControlGroup,
  CampaignScheduling,
} from "../types/campaign";
import { CreateCampaignRequest } from "../types/createCampaign";

// Extended type for form data that includes all properties needed during creation
// Mapping interface for segment-offer relationships
export interface SegmentOfferMapping {
  segment_id: string;
  offer_id: number;
}

interface CampaignFormData extends CreateCampaignRequest {
  scheduling?: CampaignScheduling;
  segments?: CampaignSegment[];
  segmentOfferMappings?: SegmentOfferMapping[];
}
import { campaignService } from "../services/campaignService";
import {
  campaignSegmentOfferService,
  CampaignSegmentOfferMapping,
} from "../services/campaignSegmentOfferService";
import { segmentService } from "../../segments/services/segmentService";
import { offerService } from "../../offers/services/offerService";
import { departmentsConfig } from "../../../shared/configs/configurationPageConfigs";

// Objective options mapping
const objectiveOptions = [
  { value: "acquisition", label: "New Customer Acquisition" },
  { value: "retention", label: "Customer Retention" },
  { value: "churn_prevention", label: "Churn Prevention" },
  { value: "upsell_cross_sell", label: "Upsell/Cross-sell" },
  { value: "reactivation", label: "Dormant Customer Reactivation" },
];
import CampaignDefinitionStep from "../components/steps/CampaignDefinitionStep";
import AudienceConfigurationStep from "../components/steps/AudienceConfigurationStep";
import OfferMappingStep from "../components/steps/OfferMappingStep";
import SchedulingStep from "../components/steps/SchedulingStep";
import CampaignPreviewStep from "../components/steps/CampaignPreviewStep";

interface StepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  formData: CreateCampaignRequest;
  setFormData: (data: CreateCampaignRequest) => void;
  selectedSegments: CampaignSegment[];
  setSelectedSegments: (segments: CampaignSegment[]) => void;
  selectedOffers: CampaignOffer[];
  setSelectedOffers: (offers: CampaignOffer[]) => void;
  segmentOfferMappings?: SegmentOfferMapping[];
  setSegmentOfferMappings?: (mappings: SegmentOfferMapping[]) => void;
  controlGroup: ControlGroup;
  setControlGroup: (group: ControlGroup) => void;
  isLoading?: boolean;
  onSaveDraft?: () => void;
  onCancel?: () => void;
  validationErrors?: { [key: string]: string };
  clearValidationErrors?: () => void;
  setValidationErrors?: (errors: { [key: string]: string }) => void;
}

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
    name: "Offers",
    description: "Offer selection & mapping",
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);
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
        '[style*="overflow"], [class*="overflow"]'
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
  });

  const [selectedSegments, setSelectedSegments] = useState<CampaignSegment[]>(
    []
  );
  const [selectedOffers, setSelectedOffers] = useState<CampaignOffer[]>([]);
  const [segmentOfferMappings, setSegmentOfferMappings] = useState<
    SegmentOfferMapping[]
  >([]);
  const [controlGroup, setControlGroup] = useState<ControlGroup>({
    enabled: false,
    percentage: 5,
    type: "standard",
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  const loadCampaignData = useCallback(
    async (
      campaignId: string,
      isDuplicate: boolean = false,
      skipFormData: boolean = false,
      silent: boolean = false
    ) => {
      if (!campaignId) return;

      if (!silent) {
        setIsLoadingCampaign(true);
      }
      try {
        const response = await campaignService.getCampaignById(campaignId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const campaign = (response as { data?: any } | any).data || response;

        // Only set form data if not already populated from state
        if (!skipFormData) {
          // Set form data with all available fields
          // If duplicating, prefix name with "Copy of "
          const newFormData: CampaignFormData = {
            name: isDuplicate
              ? `Copy of ${campaign?.name}`
              : campaign?.name || "",
            description: campaign?.description || "",
            objective: campaign?.objective || "acquisition",
            category_id: campaign?.category_id || undefined,
            program_id: campaign?.program_id || undefined,
            start_date: campaign?.start_date || undefined,
            end_date: campaign?.end_date || undefined,
            campaign_type: campaign?.campaign_type || "multiple_target_group",
            // Load tags as array
            tags: campaign?.tags || [],
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

        // Load segments and offers via mappings
        try {
          const mappingsResponse =
            await campaignSegmentOfferService.getMappingsByCampaign(campaignId);

          if (mappingsResponse.success && mappingsResponse.data.length > 0) {
            // Extract unique segment IDs and offer IDs
            const uniqueSegmentIds = [
              ...new Set(mappingsResponse.data.map((m) => m.segment_id)),
            ];
            const uniqueOfferIds = [
              ...new Set(mappingsResponse.data.map((m) => m.offer_id)),
            ];

            // Load full segment details
            const segmentPromises = uniqueSegmentIds.map(async (segmentId) => {
              try {
                const response = await segmentService.getSegmentById(
                  parseInt(segmentId),
                  true
                );
                const segment = response.data;
                return {
                  id: String(segment.id),
                  name: segment.name,
                  description: segment.description || "",
                  customer_count: segment.size_estimate || 0,
                  criteria: {},
                  created_at: segment.created_at,
                } as CampaignSegment;
              } catch {
                return null;
              }
            });

            // Load full offer details
            const offerPromises = uniqueOfferIds.map(async (offerId) => {
              try {
                const response = await offerService.getOfferById(offerId, true);
                const offer = response.data;
                // Calculate validity period from valid_from and valid_to
                let validityPeriod = 30;
                if (offer.valid_from && offer.valid_to) {
                  const from = new Date(offer.valid_from);
                  const to = new Date(offer.valid_to);
                  validityPeriod = Math.ceil(
                    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
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
                  id: String(offer.id),
                  name: offer.name,
                  description: offer.description || "",
                  offer_type: offer.offer_type,
                  reward_type: rewardType,
                  reward_value: rewardValue,
                  validity_period: validityPeriod,
                  terms_conditions: JSON.stringify(
                    offer.eligibility_rules || {}
                  ),
                } as CampaignOffer;
              } catch {
                return null;
              }
            });

            // Wait for all loads to complete
            const [loadedSegments, loadedOffers] = await Promise.all([
              Promise.all(segmentPromises),
              Promise.all(offerPromises),
            ]);

            // Filter out failed loads and set state
            const validSegments = loadedSegments.filter(
              (s): s is CampaignSegment => s !== null
            );
            const validOffers = loadedOffers.filter(
              (o): o is CampaignOffer => o !== null
            );

            setSelectedSegments(validSegments);
            setSelectedOffers(validOffers);

            // Set segment-offer mappings
            const mappings = mappingsResponse.data.map((m) => ({
              segment_id: m.segment_id,
              offer_id: m.offer_id,
            }));
            setSegmentOfferMappings(mappings);
          }
        } catch (mappingError) {
          console.error("Failed to load segment-offer mappings:", mappingError);
        }
      } catch {
        if (!silent) {
          showToast("error", "Failed to load campaign data");
          navigate("/dashboard/campaigns");
        }
      } finally {
        if (!silent) {
          setIsLoadingCampaign(false);
        }
      }
    },
    [showToast, navigate]
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

          console.log("Restoring campaign data:", {
            formData: campaignData.formData,
            segmentsCount: campaignData.selectedSegments?.length || 0,
            offersCount: campaignData.selectedOffers?.length || 0,
            mappingsCount: campaignData.segmentOfferMappings?.length || 0,
          });

          // Restore all data
          if (campaignData.formData) {
            setFormData(campaignData.formData);
          }
          if (
            campaignData.selectedSegments &&
            Array.isArray(campaignData.selectedSegments)
          ) {
            console.log("Restoring segments:", campaignData.selectedSegments);
            setSelectedSegments(campaignData.selectedSegments);
          }
          if (
            campaignData.selectedOffers &&
            Array.isArray(campaignData.selectedOffers)
          ) {
            setSelectedOffers(campaignData.selectedOffers);
          }
          if (
            campaignData.segmentOfferMappings &&
            Array.isArray(campaignData.segmentOfferMappings)
          ) {
            setSegmentOfferMappings(campaignData.segmentOfferMappings);
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
      setIsEditMode(true);
      setIsDuplicateMode(false);

      // Check if campaign data is passed via location.state (from details page)
      const campaignFromState = (location.state as { campaign?: any })
        ?.campaign;
      if (campaignFromState) {
        // Use passed data to populate form immediately
        hasRestoredDataRef.current = true;
        const campaign = campaignFromState;

        const newFormData: CampaignFormData = {
          name: campaign?.name || "",
          description: campaign?.description || "",
          objective: campaign?.objective || "acquisition",
          category_id: campaign?.category_id || undefined,
          program_id: campaign?.program_id || undefined,
          start_date: campaign?.start_date || undefined,
          end_date: campaign?.end_date || undefined,
          campaign_type: campaign?.campaign_type || "multiple_target_group",
          tags: campaign?.tags || [],
          department_id: campaign?.owner_team ? undefined : undefined,
          budget_allocated: campaign?.budget_allocated
            ? parseFloat(campaign.budget_allocated)
            : undefined,
          priority: campaign?.priority || undefined,
          priority_rank: campaign?.priority_rank || undefined,
        };
        setFormData(newFormData);

        // Load segments and offers in background silently (don't show loading spinner)
        // Skip form data since we already populated it from state
        loadCampaignData(id, false, true, true).catch(() => {
          // Silently fail - segments/offers will just be empty
        });
      } else {
        // No data passed, load from API
        loadCampaignData(id, false);
      }
    } else if (duplicateIdParam && !hasRestoredDataRef.current) {
      // Duplicate mode - creating new campaign from existing one
      setIsEditMode(false);
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
        if (
          !formData.budget_allocated ||
          formData.budget_allocated === null ||
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

      case 3: // Offers step
        if (formData.campaign_type === "multiple_target_group") {
          // For multiple_target_group, verify all segments have at least one offer mapped
          if (selectedSegments.length === 0) {
            errors.offers = "Segments must be configured first";
          } else {
            const segmentsWithoutOffers = selectedSegments.filter(
              (segment) =>
                !segmentOfferMappings.some(
                  (mapping) => mapping.segment_id === segment.id
                )
            );
            if (segmentsWithoutOffers.length > 0) {
              errors.offers = `All segments must have at least one offer mapped. Missing offers for: ${segmentsWithoutOffers
                .map((s) => s.name)
                .join(", ")}`;
            }
          }
        } else if (selectedOffers.length === 0) {
          errors.offers = "At least one offer must be selected";
        }

        // Check for offer status validation errors (set by OfferMappingStep component)
        // This prevents proceeding if any offers are not Active or Approved
        if (validationErrors.offers) {
          errors.offers = validationErrors.offers;
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
        showToast("error", "Campaign name is required");
        setIsLoading(false);
        return;
      }

      if (selectedSegments.length === 0) {
        showToast("error", "Please add at least one segment before continuing");
        setIsLoading(false);
        return;
      }

      if (isEditMode && id) {
        // Update campaign - Don't regenerate code, add updated_by
        // Get objective label from value
        const objectiveOption = objectiveOptions.find(
          (o: { value: string; label: string }) =>
            o.value === formData.objective
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
                Number(d.id) === Number(departmentId)
            )
          : undefined;
        const ownerTeam = department?.name || undefined;

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
        showToast("success", "Campaign updated successfully!");
      } else {
        // Generate unique code from campaign name for NEW campaigns
        const campaignCode = generateCampaignCode(formData.name);

        // Get objective label from value
        const objectiveOption = objectiveOptions.find(
          (o: { value: string; label: string }) =>
            o.value === formData.objective
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
                Number(d.id) === Number(departmentId)
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
          ...(formData.budget_allocated && {
            budget_allocated: String(formData.budget_allocated),
          }),
        };
        // New campaigns are created with status: 'draft' and approval_status: 'pending'
        const createResponse = await campaignService.createCampaign(
          campaignData
        );

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
        const createdCampaignId = createResponse?.data?.id;

        if (!createdCampaignId) {
          throw new Error("Campaign created but ID not returned");
        }

        // Save segments (Step 2) for all campaign types
        if (selectedSegments.length > 0) {
          try {
            // Add each segment to the campaign
            for (const segment of selectedSegments) {
              await campaignService.addCampaignSegment(createdCampaignId, {
                segment_id: parseInt(segment.id),
                is_primary: segment.priority === 1,
                include_exclude: segment.include_exclude || "include",
                created_by: user?.user_id || 1,
              });
            }
          } catch (segmentError) {
            console.error("Error saving segments:", segmentError);
            showToast(
              "warning",
              "Campaign created but some segments failed to save. Please check the campaign details."
            );
          }
        }

        // Create Campaign-Segment-Offer mappings for all campaign types if mappings exist
        if (segmentOfferMappings && segmentOfferMappings.length > 0) {
          try {
            const mappingsToCreate: CampaignSegmentOfferMapping[] =
              segmentOfferMappings.map((mapping) => ({
                campaign_id: createdCampaignId,
                segment_id: mapping.segment_id,
                offer_id: mapping.offer_id,
                created_by: user?.user_id || 1,
              }));

            await campaignSegmentOfferService.createBatchMappings(
              mappingsToCreate
            );

            showToast(
              "success",
              "Campaign created and mappings configured successfully!"
            );
          } catch (mappingError) {
            console.error("Error saving mappings:", mappingError);
            showToast(
              "warning",
              "Campaign created but some mappings failed. Please check the campaign details."
            );
          }
        } else {
          showToast("success", "Campaign created and submitted for approval!");
        }
      }

      // Clear campaign flow tracking and saved data when campaign is created/updated
      sessionStorage.removeItem("campaignFlowCreatedOffers");
      sessionStorage.removeItem("campaignFormData");
      sessionStorage.removeItem("offerModalAutoOpened");
      sessionStorage.removeItem("campaignDataRestored");

      navigate("/dashboard/campaigns");
    } catch (error) {
      console.error("Failed to create/update campaign:", error);

      // Extract error message from backend response
      let errorMessage = `Failed to ${
        isEditMode ? "update" : "create"
      } campaign. Please try again.`;

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
        showToast("error", "Campaign name is required to save draft");
        return;
      }

      if (selectedSegments.length === 0) {
        showToast("error", "Please add at least one segment before saving");
        setIsSavingDraft(false);
        return;
      }

      // Generate unique code from campaign name
      const campaignCode = generateCampaignCode(formData.name);

      // Get objective label from value
      const objectiveOption = objectiveOptions.find(
        (o: { value: string; label: string }) => o.value === formData.objective
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
              Number(d.id) === Number(departmentId)
          )
        : undefined;
      const ownerTeam = department?.name || undefined;

      const draftData: CreateCampaignRequest = {
        name: formData.name,
        code: campaignCode,
        objective: objectiveLabel,
        status: "draft", // Explicitly set as draft
        created_by: user?.user_id || 1,
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
        ...(formData.campaign_type && {
          campaign_type: formData.campaign_type,
        }),
        ...(formData.priority && { priority: formData.priority }),
        ...(formData.priority_rank && {
          priority_rank: formData.priority_rank,
        }),
      };

      let campaignId: number;

      if (isEditMode && id) {
        // Update existing campaign
        await campaignService.updateCampaign(parseInt(id), draftData);
        campaignId = parseInt(id);
        showToast("success", "Draft updated successfully!");
      } else {
        // Create new campaign
        const createResponse = await campaignService.createCampaign(draftData);
        campaignId = createResponse?.data?.id;

        if (!campaignId) {
          throw new Error("Campaign created but ID not returned");
        }
        showToast("success", "Draft saved successfully!");
      }

      // Save segments (Step 2) if they exist
      if (selectedSegments.length > 0 && campaignId) {
        try {
          // Add each segment to the campaign
          for (const segment of selectedSegments) {
            await campaignService.addCampaignSegment(campaignId, {
              segment_id: parseInt(segment.id),
              is_primary: segment.priority === 1,
              include_exclude: segment.include_exclude || "include",
              created_by: user?.user_id || 1,
            });
          }
        } catch (segmentError) {
          console.error("Error saving segments:", segmentError);
          showToast(
            "warning",
            "Campaign saved but some segments failed to save. Please check the campaign details."
          );
        }
      }

      // Save segment-offer mappings (Step 3) if they exist
      if (
        segmentOfferMappings &&
        segmentOfferMappings.length > 0 &&
        campaignId
      ) {
        try {
          const mappingsToCreate: CampaignSegmentOfferMapping[] =
            segmentOfferMappings.map((mapping) => ({
              campaign_id: campaignId,
              segment_id: mapping.segment_id,
              offer_id: mapping.offer_id,
              created_by: user?.user_id || 1,
            }));

          await campaignSegmentOfferService.createBatchMappings(
            mappingsToCreate
          );
        } catch (mappingError) {
          console.error("Error saving mappings:", mappingError);
          showToast(
            "warning",
            "Campaign saved but some offer mappings failed to save. Please check the campaign details."
          );
        }
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      showToast("error", "Failed to save draft. Please try again.");
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
    controlGroup,
    setControlGroup,
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
        return <OfferMappingStep {...stepProps} />;
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
        className={`bg-white rounded-md border border-[${color.border.default}] p-4`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/dashboard/campaigns")}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
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
                  className="inline-flex w-full items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-all duration-200 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="inline-flex w-full items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
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

          {/* Sticky Bottom Navigation */}
          <div className="sticky bottom-0 z-30 bg-white py-3 border-t border-gray-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                Previous
              </button>
              <button
                onClick={currentStep === 5 ? handleSubmit : handleNext}
                disabled={isLoading || !validateCurrentStep().isValid}
                className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-md text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
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
    </div>
  );
}
