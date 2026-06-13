import { useState, useEffect, useRef } from "react";
import Input from "../../../../shared/components/ui/Input";
import Textarea from "../../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import { ChevronDown, Search, Settings, X, Plus } from "lucide-react";
import MultiCategorySelector from "../../../../shared/components/MultiCategorySelector";
import { CreateCampaignRequest } from "../../types/campaign";
import { programService } from "../../services/programService";
import { Program } from "../../types/program";
import { useClickOutside } from "../../../../shared/hooks/useClickOutside";
import { lineOfBusinessConfig } from "../../../configurations/configs/configurationPageConfigs";
import { configurationDataService } from "../../../../shared/services/configurationDataService";
import { CommunicationPolicyConfiguration } from "../../types/communicationPolicyConfig";
import { PRIORITY_OPTIONS, RANK_OPTIONS } from "../../types/priority";
import { tw, components, color } from "../../../../shared/utils/utils";
import { communicationPolicyService } from "../../services/communicationPolicyService";
import CommunicationPolicyModal from "../CommunicationPolicyModal";
import CreateCampaignTypeModal from "../CreateCampaignTypeModal";
import { useToast } from "../../../../contexts/ToastContext";
import { extractBackendError } from "../../../../shared/utils/errorHandler";
import { useTranslation, useLanguage } from "../../../../contexts/LanguageContext";
import { getCurrencySymbol } from "../../../../shared/services/currencyService";
import { useBackendCampaignTypeData } from "../../../../shared/hooks/useBackendCampaignTypeData";
import { useBackendConfigurationData } from "../../../../shared/hooks/useBackendConfigurationData";
import CreateCategoryModal from "../../../../shared/components/CreateCategoryModal";
import TypeSelector from "../../../../shared/components/TypeSelector";
import ProgramModal from "../ProgramModal";
import ConfigurationModal from "../../../configurations/components/ConfigurationManager/ConfigurationModal";
import {
  getCampaignObjectivesApiConfig,
  getLineOfBusinessConfig,
} from "../../../configurations/configs/configurationPageConfigs";

interface CampaignDefinitionStepProps {
  formData: CreateCampaignRequest;
  setFormData: (data: CreateCampaignRequest) => void;
  validationErrors?: { [key: string]: string };
  clearValidationErrors?: () => void;
  categoryRefreshTrigger?: number;
}

export default function CampaignDefinitionStep({
  formData,
  setFormData,
  validationErrors = {},
  clearValidationErrors,
  categoryRefreshTrigger,
}: CampaignDefinitionStepProps) {
  const t = useTranslation();
  const { t: tLanguage } = useLanguage();
  const { success: showToast, error: showError } = useToast();

  const { data: campaignTypes, loading: campaignTypesLoading, refresh: refreshCampaignTypes } =
    useBackendCampaignTypeData();

  const { data: objectives, loading: objectivesLoading, refresh: refreshObjectives, create: createObjective } =
    useBackendConfigurationData("campaignObjectives") || { data: [], loading: false, refresh: () => {}, create: async () => {} };

  const { data: departmentsData, loading: departmentsLoading, refresh: refreshDepartments, create: createDepartment } =
    useBackendConfigurationData("departments") || { data: [], loading: false, refresh: () => {}, create: async () => {} };

  const { data: linesOfBusiness, loading: lobLoading, refresh: refreshLob, create: createLob } =
    useBackendConfigurationData("lineOfBusiness") || { data: [], loading: false, refresh: () => {}, create: async () => {} };

  const { data: policiesData, loading: policiesLoading, refresh: refreshPolicies, create: createPolicy } =
    useBackendConfigurationData("communicationPolicies") || { data: [], loading: false, refresh: () => {}, create: async () => {} };

  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);
  const [objectiveSearchTerm, setObjectiveSearchTerm] = useState("");
  const [isObjectiveDropdownOpen, setIsObjectiveDropdownOpen] = useState(false);
  const [lineOfBusinessSearchTerm, setLineOfBusinessSearchTerm] = useState("");
  const [isLineOfBusinessDropdownOpen, setIsLineOfBusinessDropdownOpen] =
    useState(false);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState("");
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] =
    useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [lineOfBusinessData, setLineOfBusinessData] = useState(
    lineOfBusinessConfig.initialData
  );
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [showCreateCatalogModal, setShowCreateCatalogModal] = useState(false);
  const [showCreateProgramModal, setShowCreateProgramModal] = useState(false);
  const [showCreateObjectiveModal, setShowCreateObjectiveModal] = useState(false);
  const [showCreateDepartmentModal, setShowCreateDepartmentModal] = useState(false);
  const [showCreatePolicyModal, setShowCreatePolicyModal] = useState(false);
  const [categoryRefreshTriggerState, setCategoryRefreshTriggerState] = useState(0);
  const [isCreatingProgram, setIsCreatingProgram] = useState(false);
  const [isCreatingObjective, setIsCreatingObjective] = useState(false);
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [isCreatingLineOfBusiness, setIsCreatingLineOfBusiness] = useState(false);
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [showCreateLineOfBusinessModal, setShowCreateLineOfBusinessModal] = useState(false);

  // Communication Policy states
  const [communicationPolicies, setCommunicationPolicies] = useState<
    CommunicationPolicyConfiguration[]
  >([]);
  const [selectedPolicy, setSelectedPolicy] =
    useState<CommunicationPolicyConfiguration | null>(null);
  const [isPolicyDropdownOpen, setIsPolicyDropdownOpen] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] =
    useState(false);
  const [policyToCustomize, setPolicyToCustomize] =
    useState<CommunicationPolicyConfiguration | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [budgetFocused, setBudgetFocused] = useState(false);

  const programDropdownRef = useRef<HTMLDivElement>(null);
  const objectiveDropdownRef = useRef<HTMLDivElement>(null);
  const lineOfBusinessDropdownRef = useRef<HTMLDivElement>(null);
  const departmentDropdownRef = useRef<HTMLDivElement>(null);
  const policyDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(programDropdownRef, () => setIsProgramDropdownOpen(false));
  useClickOutside(objectiveDropdownRef, () =>
    setIsObjectiveDropdownOpen(false)
  );
  useClickOutside(lineOfBusinessDropdownRef, () =>
    setIsLineOfBusinessDropdownOpen(false)
  );
  useClickOutside(departmentDropdownRef, () =>
    setIsDepartmentDropdownOpen(false)
  );
  useClickOutside(policyDropdownRef, () => setIsPolicyDropdownOpen(false));

  // Track if update is from user action to prevent infinite loops
  const isUserUpdateRef = useRef(false);

  // Initialize selectedCategoryIds from formData.category_id (only on mount or external changes)
  useEffect(() => {
    // Skip if this update came from user action
    if (isUserUpdateRef.current) {
      isUserUpdateRef.current = false;
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
  }, [formData.category_id]);

  // Update formData.category_id when selectedCategoryIds changes (use first one)
  useEffect(() => {
    const firstCategoryId =
      selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : undefined;
    if (formData.category_id !== firstCategoryId) {
      isUserUpdateRef.current = true; // Mark as user update
      setFormData((prev) => ({
        ...prev,
        category_id: firstCategoryId, // Send only first to backend
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryIds]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setIsLoadingPrograms(true);
        const response = await programService.getAllPrograms({
          pageSize: 100,
          skipCache: true,
        });
        // Filter out inactive programs
        const activePrograms = (response.data || []).filter(
          (program) => program.is_active === true
        );
        setPrograms(activePrograms);
      } catch (error) {
        console.error("Failed to fetch programs:", error);
        setPrograms([]);
      } finally {
        setIsLoadingPrograms(false);
      }
    };

    fetchPrograms();
  }, []);

  // S'abonner aux changements des données Line of Business
  useEffect(() => {
    const unsubscribe = configurationDataService.subscribe(
      "lineOfBusiness",
      setLineOfBusinessData
    );
    return unsubscribe;
  }, []);

  // Load Communication Policies from service
  useEffect(() => {
    // Load initial policies
    const policiesResponse = communicationPolicyService.getAllPolicies();
    if (policiesResponse && typeof policiesResponse === "object") {
      if ("data" in policiesResponse && Array.isArray(policiesResponse.data)) {
        setCommunicationPolicies(policiesResponse.data);
      } else if (Array.isArray(policiesResponse)) {
        setCommunicationPolicies(policiesResponse);
      }
    }

    // Subscribe to policy changes
    const unsubscribe = communicationPolicyService.subscribe(
      (updatedPolicies) => {
        if (updatedPolicies && typeof updatedPolicies === "object") {
          if ("data" in updatedPolicies && Array.isArray(updatedPolicies.data)) {
            setCommunicationPolicies(updatedPolicies.data);
          } else if (Array.isArray(updatedPolicies)) {
            setCommunicationPolicies(updatedPolicies);
          }
        }
      }
    );

    return unsubscribe;
  }, []);

  // Sync selectedPolicy with formData.communication_policy (for edit mode)
  useEffect(() => {
    if (formData.communication_policy && communicationPolicies.length > 0) {
      const policy = communicationPolicies.find(
        (p) => p.name === formData.communication_policy
      );
      if (policy && !selectedPolicy) {
        setSelectedPolicy(policy);
      }
    }
  }, [formData.communication_policy, communicationPolicies, selectedPolicy]);

  // Sync line_of_business_id when loading from API response
  useEffect(() => {
    const formDataAny = formData as any;
    if (formDataAny?.line_of_business_id && !formDataAny.line_of_business && linesOfBusiness.length > 0) {
      const found = linesOfBusiness.find(
        (lob) => Number(lob.id) === Number(formDataAny.line_of_business_id)
      );
      if (found) {
        setFormData({
          ...formData,
          line_of_business: found.name,
        } as any);
      }
    }
  }, [formData.line_of_business_id, linesOfBusiness]);

  // Sync department_id when loading from API response
  useEffect(() => {
    const formDataAny = formData as any;
    if (formDataAny?.department_id && !formDataAny.department && departmentsData.length > 0) {
      const found = departmentsData.find(
        (dept) => Number(dept.id) === Number(formDataAny.department_id)
      );
      if (found) {
        setFormData({
          ...formData,
          department: found.name,
        } as any);
      }
    }
  }, [formData.department_id, departmentsData]);

  // Handle opening customization modal
  const handleCustomizePolicy = (policy: CommunicationPolicyConfiguration) => {
    setPolicyToCustomize(policy);
    setIsCustomizationModalOpen(true);
  };

  // Handle saving customized policy (with optimistic updates)
  const handleSaveCustomizedPolicy = async (
    policyData: Record<string, unknown>
  ) => {
    if (!policyToCustomize) return;

    // Build updated policy object
    const updatedPolicyWithNewData: CommunicationPolicyConfiguration = {
      ...policyToCustomize,
      name: (policyData.name as string) || policyToCustomize.name,
      description: (policyData.description as string) || policyToCustomize.description,
      channels: (policyData.channels as string[]) || policyToCustomize.channels,
      type_code: (policyData.type_code as string) || policyToCustomize.type_code,
      config: policyData.config || policyToCustomize.config,
      is_active: (policyData.is_active as boolean) ?? policyToCustomize.is_active,
    };

    // Save previous state for rollback
    const previousPolicy = selectedPolicy;
    const previousFormData = formData;

    try {
      // Optimistic update - update UI immediately
      setSelectedPolicy(updatedPolicyWithNewData);
      setFormData({
        ...formData,
        communication_policy: updatedPolicyWithNewData.name,
      } as any);
      setIsCustomizationModalOpen(false);
      setPolicyToCustomize(null);
      showToast("Updating policy...");

      // Send update to backend
      await communicationPolicyService.updatePolicy(
        policyToCustomize.id,
        {
          name: updatedPolicyWithNewData.name,
          description: updatedPolicyWithNewData.description,
          channels: updatedPolicyWithNewData.channels,
          type_code: updatedPolicyWithNewData.type_code,
          config: updatedPolicyWithNewData.config,
          is_active: updatedPolicyWithNewData.is_active,
        }
      );

      // Success - confirm the update
      showToast("Policy updated successfully!");
    } catch (error) {
      console.error("Failed to update policy:", error);

      // Rollback on error
      setSelectedPolicy(previousPolicy);
      setFormData(previousFormData);
      setIsCustomizationModalOpen(false);
      setPolicyToCustomize(null);

      showError(extractBackendError(error, "Failed to update policy. Changes reverted.. Please try again."));
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag) {
      const currentTags = formData.tags || [];
      if (!currentTags.includes(trimmedTag)) {
        setFormData({
          ...formData,
          tags: [...currentTags, trimmedTag],
        });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = formData.tags || [];
    setFormData({
      ...formData,
      tags: currentTags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleSaveProgram = async (programData: {
    name: string;
    code: string;
    description?: string;
    budget_total?: number;
    start_date?: string | null;
    end_date?: string | null;
  }) => {
    try {
      setIsCreatingProgram(true);
      const response = await programService.createProgram(programData);
      const newProgram = response.data || response;

      // Add new program to the list
      setPrograms((prevPrograms) => [...prevPrograms, newProgram as Program]);

      // Select the newly created program
      setFormData((prevFormData) => ({
        ...prevFormData,
        program_id: Number(newProgram.id),
      }) as CreateCampaignRequest);

      setShowCreateProgramModal(false);
      showToast("Program created and selected!");
    } catch (error) {
      console.error("Failed to create program:", error);
      showError(extractBackendError(error, "Failed to create program. Please try again.. Please try again."));
    } finally {
      setIsCreatingProgram(false);
    }
  };

  const handleSaveObjective = async (formData: Record<string, any>) => {
    try {
      setIsCreatingObjective(true);
      const newObjective = await createObjective(formData);

      // Select the newly created objective
      setFormData((prevFormData) => ({
        ...prevFormData,
        objective: String(newObjective.id || formData.name),
      }) as CreateCampaignRequest);

      // Refresh objectives list
      await refreshObjectives();
      setShowCreateObjectiveModal(false);
    } catch (error) {
      console.error("Failed to create objective:", error);
    } finally {
      setIsCreatingObjective(false);
    }
  };

  const handleSaveDepartment = async (formData: Record<string, any>) => {
    try {
      setIsCreatingDepartment(true);
      const newDepartment = await createDepartment(formData);

      // Select the newly created department
      setFormData((prevFormData) => ({
        ...prevFormData,
        department_id: Number(newDepartment.id || formData.name),
      }) as CreateCampaignRequest);

      // Refresh departments list
      await refreshDepartments();
      setShowCreateDepartmentModal(false);
    } catch (error) {
      console.error("Failed to create department:", error);
    } finally {
      setIsCreatingDepartment(false);
    }
  };

  const handleSaveLineOfBusiness = async (formData: Record<string, any>) => {
    try {
      setIsCreatingLineOfBusiness(true);
      const newLob = await createLob(formData);

      // Select the newly created line of business
      setFormData((prevFormData) => ({
        ...prevFormData,
        line_of_business_id: Number(newLob.id || formData.name),
      }) as CreateCampaignRequest);

      // Refresh lines of business list
      await refreshLob();
      setShowCreateLineOfBusinessModal(false);
    } catch (error) {
      console.error("Failed to create line of business:", error);
    } finally {
      setIsCreatingLineOfBusiness(false);
    }
  };

  const handleSavePolicy = async (policyData: any) => {
    try {
      setIsCreatingPolicy(true);
      const newPolicy = await communicationPolicyService.createPolicy(policyData);

      // Select the newly created policy
      setSelectedPolicy(newPolicy as CommunicationPolicyConfiguration);

      // Refresh policies list
      await refreshPolicies();
      setShowCreatePolicyModal(false);
      showToast("Communication policy created successfully");
    } catch (error) {
      console.error("Failed to create policy:", error);
      showError(extractBackendError(error, "Failed to create communication policy. Please try again."));
    } finally {
      setIsCreatingPolicy(false);
    }
  };

  return (
    <div className=" space-y-6">
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {tLanguage.campaigns.campaignDefinition.campaignDefinition}
        </h2>
        <p className="text-sm text-gray-600">
          Define your campaign goals and choose how you want to create your
          campaign
        </p>
      </div>
      <div
        className={`bg-white border border-gray-200 ${tw.rounded} p-4 md:p-6 lg:p-8 space-y-5 md:space-y-7`}
      >
        <h3 className="text-base font-medium text-gray-900 mb-4 md:mb-6 px-0">
          {tLanguage.campaigns.campaignDefinition.basicDetails}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 px-0">
          <div>
            <Input
              type="text"
              label={tLanguage.campaigns.campaignDefinition.campaignName}
              value={formData.name}
              onChange={(value) => {
                setFormData({ ...formData, name: String(value) });
                if (validationErrors.name && clearValidationErrors) {
                  clearValidationErrors();
                }
              }}
              hasError={!!validationErrors.name}
              placeholder={tLanguage.campaigns.campaignDefinition.enterCampaignName}
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.name}
              </p>
            )}
          </div>

          <div>
            <MultiCategorySelector
              label="Campaign Catalog *"
              value={selectedCategoryIds}
              onChange={(ids) => {
                setSelectedCategoryIds(ids);
                if (validationErrors.category_id && clearValidationErrors) {
                  clearValidationErrors();
                }
              }}
              placeholder="Select catalog(s)"
              entityType="campaign"
              className="w-full"
              allowCreate={true}
              onCreateCategory={() => setShowCreateCatalogModal(true)}
              onCategoryCreated={(categoryId) => {
                setSelectedCategoryIds([categoryId]);
                setCategoryRefreshTriggerState((prev) => prev + 1);
              }}
              refreshTrigger={categoryRefreshTriggerState}
              hasError={!!validationErrors.category_id}
            />
            {validationErrors.category_id && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.category_id}
              </p>
            )}
          </div>

          {/* Campaign Type - Commented out
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Type
            </label>
            <TypeSelector
              options={[
                { value: "", label: "Select campaign type (optional)" },
                ...campaignTypes
                  .filter((type) => type.is_active !== false)
                  .map((type) => ({
                    value: String(type.id),
                    label: type.name,
                  })),
              ]}
              disabled={campaignTypesLoading}
              value={
                (formData as any).campaign_type_id
                  ? String((formData as any).campaign_type_id)
                  : ""
              }
              onChange={(value) => {
                if (!value) {
                  setFormData({
                    ...formData,
                    campaign_type_id: undefined,
                  } as any);
                } else {
                  setFormData({
                    ...formData,
                    campaign_type_id: Number(value),
                  } as any);
                }
              }}
              placeholder={campaignTypesLoading ? "Loading..." : "Select campaign type"}
              allowCreate={true}
              onCreate={() => setShowCreateTypeModal(true)}
              className="w-full"
            />
          </div>
          */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <HeadlessSelect
              label="Line of Business *"
              options={[
                { value: "", label: "Select line of business", id: "empty" },
                ...linesOfBusiness
                  .filter((lob) => lob.is_active !== false)
                  .map((lob) => ({
                    value: String(lob.id),
                    label: lob.name,
                    id: lob.id,
                  })),
              ]}
              value={String((formData as { line_of_business_id?: number }).line_of_business_id || "")}
              onChange={(value) => {
                const selected = linesOfBusiness.find((lob) => String(lob.id) === value);
                setFormData({
                  ...formData,
                  line_of_business_id: value ? Number(value) : undefined,
                  line_of_business: selected?.name,
                } as any);
              }}
              searchable={true}
              disabled={lobLoading}
              error={!!validationErrors?.line_of_business}
            />
            {validationErrors?.line_of_business && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.line_of_business}
              </p>
            )}
          </div>

          <div>
            <HeadlessSelect
              label="Department"
              options={[
                { value: "", label: "Select department (optional)", id: "empty" },
                ...departmentsData
                  .filter((dept) => dept.is_active !== false)
                  .map((dept) => ({
                    value: String(dept.id),
                    label: dept.name,
                    id: dept.id,
                  })),
              ]}
              value={String((formData as { department_id?: number }).department_id || "")}
              onChange={(value) => {
                const selected = departmentsData.find((dept) => String(dept.id) === value);
                setFormData({
                  ...formData,
                  department_id: value ? Number(value) : undefined,
                  department: selected?.name,
                } as any);
              }}
              searchable={true}
              disabled={departmentsLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
          <div>
            <div className="space-y-2">
              <div className="flex">
                <div className="flex-1">
                  <Input type="text"
                    label="Campaign Tags"
                    value={tagInput}
                    onChange={(value) => setTagInput(String(value))}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Enter a tag and press Enter"
                    className="w-full"
                    style={{
                      borderTopRightRadius: "0",
                      borderBottomRightRadius: "0",
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="px-3 py-2 text-white rounded-r-md flex items-center justify-center text-sm border-l-0 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  style={{ backgroundColor: color.primary.action, borderColor: color.primary.action }}
                >
                  Add
                </button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => {
                    const tagName = typeof tag === "object" && tag !== null ? (tag as any).name || String(tag) : String(tag);
                    const tagKey = typeof tag === "object" && tag !== null ? (tag as any).id || index : `${tag}-${index}`;
                    return (
                      <span
                        key={tagKey}
                        className="inline-flex items-center px-3 py-1 border text-sm font-medium rounded-full"
                        style={{
                          borderColor: color.primary.accent,
                          color: color.primary.accent,
                        }}
                      >
                        {tagName}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:opacity-70 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Press Enter or click the + button to add tags
            </p>
          </div>

          <div>
            <HeadlessSelect
              label="Program"
              options={[
                { value: "", label: "Select program (optional)", id: "empty" },
                ...programs.map((program) => ({
                  value: String(program.id),
                  label: program.name,
                  id: program.id,
                })),
              ]}
              value={String((formData as { program_id?: number }).program_id || "")}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  program_id: value ? Number(value) : undefined,
                } as CreateCampaignRequest);
              }}
              searchable={true}
              disabled={isLoadingPrograms}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
          <div>
            <HeadlessSelect
              label="Primary Objective *"
              options={[
                { value: "", label: "Select objective", id: "empty" },
                ...objectives
                  .filter((objective) => objective.is_active !== false)
                  .map((objective) => ({
                    value: String(objective.id),
                    label: objective.name,
                    id: objective.id,
                  })),
              ]}
              value={String(formData.objective || "")}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  objective: value,
                });
                if (validationErrors.objective && clearValidationErrors) {
                  clearValidationErrors();
                }
              }}
              searchable={true}
              disabled={objectivesLoading}
              error={!!validationErrors.objective}
            />
            {validationErrors.objective && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.objective}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Priority
            </label>
            <div className="flex items-center gap-2">
              {PRIORITY_OPTIONS.map((priority) => {
                const isSelected = formData.priority === priority.value;
                return (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        priority: priority.value as
                          | "low"
                          | "medium"
                          | "high"
                          | "critical",
                        priority_rank: 1,
                      })
                    }
                    className={`flex-1 px-3 py-2.5 ${
                      tw.rounded
                    } text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 min-h-[42px] border ${
                      isSelected
                        ? "border-transparent text-white shadow-sm"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: color.primary.accent }
                        : undefined
                    }
                  >
                    <div className="flex items-end gap-0.5 h-4">
                      {[1, 2, 3, 4].map((barNum) => (
                        <div
                          key={barNum}
                          className={`transition-all ${
                            barNum <= priority.bars
                              ? isSelected
                                ? "text-white"
                                : priority.color
                              : isSelected
                              ? "opacity-40 text-white"
                              : "opacity-20 " + priority.color
                          }`}
                          style={{
                            width: "3px",
                            height: `${barNum * 3}px`,
                            backgroundColor: "currentColor",
                            borderRadius: "1px",
                          }}
                        />
                      ))}
                    </div>
                    <span className="hidden sm:inline">{priority.label} {priority.bars}</span>
                  </button>
                );
              })}
            </div>
            {/* Priority Rank - Only shows when priority is selected */}
            {formData.priority && (
              <div
                className={`mt-3 p-3 bg-gray-50 border border-gray-200 ${tw.rounded}`}
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rank within {formData.priority} Priority
                </label>
                <div className="flex items-center gap-2">
                  {RANK_OPTIONS.map((rankOption) => (
                    <button
                      key={rankOption.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, priority_rank: rankOption.value })
                      }
                      className={`w-8 h-8 ${
                        tw.rounded
                      } text-xs font-medium transition-all duration-200 flex items-center justify-center border ${
                        formData.priority_rank === rankOption.value
                          ? "bg-black text-white border-black shadow-sm"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {rankOption.value}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Rank 1 is highest priority within {formData.priority} level
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Communication Policy */}
        <div>
          <HeadlessSelect
            label="Communication Policy *"
            options={[
              { value: "", label: "No Policy - Use system defaults", id: "empty" },
              ...communicationPolicies
                .filter((policy) => policy.is_active !== false)
                .map((policy) => ({
                  value: policy.name,
                  label: policy.name,
                  id: policy.id,
                })),
            ]}
            value={selectedPolicy?.name || ""}
            onChange={(value) => {
              if (!value) {
                setSelectedPolicy(null);
                setFormData({
                  ...formData,
                  communication_policy: undefined,
                } as any);
              } else {
                const policy = communicationPolicies.find((p) => p.name === value);
                if (policy) {
                  setSelectedPolicy(policy);
                  setFormData({
                    ...formData,
                    communication_policy: policy.name,
                  } as any);
                }
              }
            }}
            searchable={true}
            disabled={policiesLoading}
            error={!!validationErrors?.communication_policy}
          />
          {/* Customization Toggle */}
          {selectedPolicy && (
            <div
              className={`flex items-center justify-between px-3 py-2 mt-2 ${tw.surfaceCards} ${tw.rounded} border ${tw.borderMuted}`}
            >
              <span
                className={`${tw.caption} ${tw.textSecondary} flex items-center gap-2`}
              >
                <Settings className="w-3 h-3" />
                Want to modify this policy?
              </span>
              <button
                type="button"
                onClick={() => handleCustomizePolicy(selectedPolicy)}
                className={`px-3 py-1 text-xs flex items-center gap-1 ${tw.rounded} ${tw.primaryAction} hover:opacity-90`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Settings className="w-3 h-3" />
                Customize
              </button>
            </div>
          )}
          {validationErrors?.communication_policy && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.communication_policy}
            </p>
          )}
        </div>

        <div>
          <Textarea
            label={tLanguage.campaigns.campaignDefinition.campaignDescription}
            value={formData.description}
            onChange={(value) => {
              setFormData({ ...formData, description: value });
              if (validationErrors?.description && clearValidationErrors) {
                clearValidationErrors();
              }
            }}
            hasError={!!validationErrors?.description}
            placeholder="Describe your campaign goals and objectives"
            rows={3}
          />
          {validationErrors?.description && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.description}
            </p>
          )}
        </div>

        {/* Budget Allocation */}
        <div className="relative" onFocus={() => setBudgetFocused(true)} onBlur={() => setBudgetFocused(false)}>
          {(budgetFocused || formData.budget_allocated) && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm z-10 text-gray-500"
            >
              {getCurrencySymbol()}
            </span>
          )}
          <Input
            label={t.campaigns.budgetAllocated}
            type="number"
            min="0"
            step="0.01"
            value={formData.budget_allocated || ""}
            onChange={(value) => {
              const budgetValue = String(value);
              setFormData({
                ...formData,
                budget_allocated: budgetValue ? parseFloat(budgetValue) : undefined,
              });
              if (
                validationErrors.budget_allocated &&
                clearValidationErrors
              ) {
                clearValidationErrors();
              }
            }}
            hasError={!!validationErrors.budget_allocated}
            className="w-full pl-12 pr-3 py-2"
            placeholder="0.00"
          />
          {validationErrors.budget_allocated && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.budget_allocated}
            </p>
          )}
        </div>

        {/* Campaign Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tLanguage.campaigns.campaignDefinition.startDate}
            </label>
            <input
              type="datetime-local"
              value={
                formData.start_date
                  ? new Date(formData.start_date).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => {
                const dateValue = e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined;
                setFormData({ ...formData, start_date: dateValue });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              When should this campaign start?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tLanguage.campaigns.campaignDefinition.endDate}
            </label>
            <input
              type="datetime-local"
              value={
                formData.end_date
                  ? new Date(formData.end_date).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => {
                const dateValue = e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined;
                setFormData({ ...formData, end_date: dateValue });
                if (validationErrors.end_date && clearValidationErrors) {
                  clearValidationErrors();
                }
              }}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 ${
                validationErrors.end_date
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {validationErrors.end_date ? (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.end_date}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                When should this campaign end?
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      <CommunicationPolicyModal
        isOpen={isCustomizationModalOpen}
        onClose={() => {
          setIsCustomizationModalOpen(false);
          setPolicyToCustomize(null);
        }}
        policy={policyToCustomize || undefined}
        onSave={handleSaveCustomizedPolicy}
        isSaving={false}
      />

      {/* Create Catalog Modal */}
      <CreateCategoryModal
        isOpen={showCreateCatalogModal}
        onClose={() => setShowCreateCatalogModal(false)}
        entityType="campaign"
        onCategoryCreated={(categoryId) => {
          setSelectedCategoryIds([categoryId]);
          setCategoryRefreshTriggerState((prev) => prev + 1);
          setShowCreateCatalogModal(false);
        }}
      />

      {/* Create Campaign Type Modal */}
      <CreateCampaignTypeModal
        isOpen={showCreateTypeModal}
        onClose={() => setShowCreateTypeModal(false)}
        onTypeCreated={(typeId) => {
          setFormData({
            ...formData,
            campaign_type_id: typeId,
          } as any);
          refreshCampaignTypes();
          setShowCreateTypeModal(false);
        }}
      />

      {/* Create Program Modal */}
      <ProgramModal
        isOpen={showCreateProgramModal}
        onClose={() => setShowCreateProgramModal(false)}
        onSave={handleSaveProgram}
        isSaving={isCreatingProgram}
      />

      <ConfigurationModal
        isOpen={showCreateObjectiveModal}
        onClose={() => setShowCreateObjectiveModal(false)}
        config={getCampaignObjectivesApiConfig(tLanguage)}
        onSave={handleSaveObjective}
        isSaving={isCreatingObjective}
      />

      <ConfigurationModal
        isOpen={showCreateDepartmentModal}
        onClose={() => setShowCreateDepartmentModal(false)}
        config={{
          ...getCampaignObjectivesApiConfig(tLanguage),
          title: "Create Department",
          entityName: "department",
          entityNamePlural: "departments",
          configType: "departments",
          modalTitle: {
            create: "Create Department",
            edit: "Edit Department",
          },
        }}
        onSave={handleSaveDepartment}
        isSaving={isCreatingDepartment}
      />

      <ConfigurationModal
        isOpen={showCreateLineOfBusinessModal}
        onClose={() => setShowCreateLineOfBusinessModal(false)}
        config={getLineOfBusinessConfig(tLanguage)}
        onSave={handleSaveLineOfBusiness}
        isSaving={isCreatingLineOfBusiness}
      />

      <CommunicationPolicyModal
        isOpen={showCreatePolicyModal}
        onClose={() => setShowCreatePolicyModal(false)}
        onSave={handleSavePolicy}
        isSaving={isCreatingPolicy}
      />
    </div>
  );
}
