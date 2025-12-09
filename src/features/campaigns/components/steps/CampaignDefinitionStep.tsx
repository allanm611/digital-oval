import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Settings, Plus, X } from "lucide-react";
import MultiCategorySelector from "../../../../shared/components/MultiCategorySelector";
import { CreateCampaignRequest } from "../../types/campaign";
import { programService } from "../../services/programService";
import { Program } from "../../types/program";
import { useClickOutside } from "../../../../shared/hooks/useClickOutside";
import {
  lineOfBusinessConfig,
  departmentsConfig,
} from "../../../../shared/configs/configurationPageConfigs";
import { configurationDataService } from "../../../../shared/services/configurationDataService";
import { CommunicationPolicyConfiguration } from "../../types/communicationPolicyConfig";
import { tw, components, color } from "../../../../shared/utils/utils";
import { communicationPolicyService } from "../../services/communicationPolicyService";
import CommunicationPolicyModal from "../CommunicationPolicyModal";
import PolicyNameModal from "../PolicyNameModal";
import { useToast } from "../../../../contexts/ToastContext";
import { useTranslation } from "../../../../contexts/LanguageContext";
import { getCurrencySymbol } from "../../../../shared/services/currencyService";

interface CampaignDefinitionStepProps {
  formData: CreateCampaignRequest;
  setFormData: (data: CreateCampaignRequest) => void;
  validationErrors?: { [key: string]: string };
  clearValidationErrors?: () => void;
}

const objectiveOptions = [
  {
    value: "acquisition",
    label: "New Customer Acquisition",
    description: "Attract and convert new customers to your service",
    icon: "",
    color: "border-green-300 hover:border-green-400 hover:bg-green-50",
  },
  {
    value: "retention",
    label: "Customer Retention",
    description: "Keep existing customers engaged and loyal",
    icon: "",
    color: "border-green-200 hover:border-green-300 hover:bg-green-50",
  },
  {
    value: "churn_prevention",
    label: "Churn Prevention",
    description: "Prevent at-risk customers from leaving",
    icon: "",
    color: "border-red-200 hover:border-red-300 hover:bg-red-50",
  },
  {
    value: "upsell_cross_sell",
    label: "Upsell/Cross-sell",
    description: "Increase revenue from existing customers",
    icon: "",
    color: "border-purple-200 hover:border-purple-300 hover:bg-purple-50",
  },
  {
    value: "reactivation",
    label: "Dormant Customer Reactivation",
    description: "Re-engage inactive or dormant customers",
    icon: "🔄",
    color: "border-orange-200 hover:border-orange-300 hover:bg-orange-50",
  },
];

export default function CampaignDefinitionStep({
  formData,
  setFormData,
  validationErrors = {},
  clearValidationErrors,
}: CampaignDefinitionStepProps) {
  const t = useTranslation();
  const { success: showToast, error: showError } = useToast();
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
  const [departmentsData, setDepartmentsData] = useState(
    departmentsConfig.initialData
  );

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
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [pendingPolicyData, setPendingPolicyData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

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

  // S'abonner aux changements des données Departments
  useEffect(() => {
    const unsubscribe = configurationDataService.subscribe(
      "departments",
      setDepartmentsData
    );
    return unsubscribe;
  }, []);

  // Charger les Communication Policies depuis le service
  useEffect(() => {
    // Load initial policies
    setCommunicationPolicies(communicationPolicyService.getAllPolicies());

    // Subscribe to policy changes
    const unsubscribe = communicationPolicyService.subscribe(
      (updatedPolicies) => {
        setCommunicationPolicies(updatedPolicies);
      }
    );

    return unsubscribe;
  }, []);

  // Handle opening customization modal
  const handleCustomizePolicy = (policy: CommunicationPolicyConfiguration) => {
    // Create a copy of the policy with a temporary name for the modal
    const policyWithTempName = {
      ...policy,
      name: `${policy.name} - Customizing...`,
    };
    setPolicyToCustomize(policyWithTempName);
    setIsCustomizationModalOpen(true);
  };

  // Handle saving customized policy
  const handleSaveCustomizedPolicy = async (
    policyData: Record<string, unknown>
  ) => {
    // Store the policy data and open name modal
    // First close the customization modal
    setIsCustomizationModalOpen(false);

    // Then store data and open name modal
    setPendingPolicyData(policyData);
    setIsNameModalOpen(true);
  };

  // Handle confirming policy name
  const handleConfirmPolicyName = async (policyName: string) => {
    if (!pendingPolicyData || !policyToCustomize) return;

    try {
      // Get the original policy name (remove the temporary suffix)
      const originalPolicyName = policyToCustomize.name.replace(
        " - Customizing...",
        ""
      );

      // Create new policy with customized configuration
      const newPolicy = communicationPolicyService.createPolicy({
        name: policyName,
        description:
          pendingPolicyData.description ||
          `Custom policy based on ${originalPolicyName}`,
        channels: pendingPolicyData.channels || ["EMAIL"],
        type: pendingPolicyData.type,
        config: pendingPolicyData.config,
        isActive: pendingPolicyData.isActive ?? true,
      });

      // Apply the new policy to the campaign
      setSelectedPolicy(newPolicy);

      // Close modals and cleanup
      setIsCustomizationModalOpen(false);
      setPolicyToCustomize(null);
      setPendingPolicyData(null);

      showToast("Custom policy created and applied to campaign!");
    } catch (error) {
      console.error("Failed to save custom policy:", error);
      showError("Failed to save custom policy. Please try again.");
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

  return (
    <div className=" space-y-6">
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Campaign Definition & Objectives
        </h2>
        <p className="text-sm text-gray-600">
          Define your campaign goals and choose how you want to create your
          campaign
        </p>
      </div>
      <div
        className={`bg-white border border-gray-200 ${tw.rounded} p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6`}
      >
        <h3 className="text-base font-medium text-gray-900 mb-4 md:mb-6 px-0">
          Campaign Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (validationErrors.name && clearValidationErrors) {
                  clearValidationErrors();
                }
              }}
              className={`w-full px-3 py-2 border ${
                tw.rounded
              } focus:ring-1 text-sm ${
                validationErrors.name
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-[#588157] focus:border-[#588157]"
              }`}
              placeholder="Enter campaign name"
              required
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.name}
              </p>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Catalog *
            </label>
            <div
              className={
                validationErrors.category_id
                  ? `border border-red-300 ${tw.rounded}`
                  : ""
              }
            >
              <MultiCategorySelector
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
              />
            </div>
            {validationErrors.category_id && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.category_id}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Line of Business
            </label>
            <div className="relative" ref={lineOfBusinessDropdownRef}>
              <button
                type="button"
                onClick={() =>
                  setIsLineOfBusinessDropdownOpen(!isLineOfBusinessDropdownOpen)
                }
                className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-1 focus:ring-[#588157] focus:border-[#588157] bg-white text-sm text-left flex items-center justify-between`}
              >
                <span
                  className={`text-sm ${
                    (formData as { line_of_business_id?: number })
                      .line_of_business_id
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {(formData as { line_of_business_id?: number })
                    .line_of_business_id
                    ? lineOfBusinessData.find(
                        (lob) =>
                          Number(lob.id) ===
                          Number(
                            (formData as { line_of_business_id?: number })
                              .line_of_business_id
                          )
                      )?.name
                    : "Select line of business (optional)"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isLineOfBusinessDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isLineOfBusinessDropdownOpen && (
                <div
                  className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg max-h-60 overflow-auto`}
                >
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={lineOfBusinessSearchTerm}
                        onChange={(e) =>
                          setLineOfBusinessSearchTerm(e.target.value)
                        }
                        className={`w-full pl-10 pr-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:ring-1 focus:ring-[#588157] focus:border-[#588157]`}
                        placeholder="Search line of business..."
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    {lineOfBusinessData.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No line of business available
                      </div>
                    ) : (
                      lineOfBusinessData
                        .filter(
                          (lob) =>
                            lob.name
                              .toLowerCase()
                              .includes(
                                lineOfBusinessSearchTerm.toLowerCase()
                              ) ||
                            (lob.description &&
                              lob.description
                                .toLowerCase()
                                .includes(
                                  lineOfBusinessSearchTerm.toLowerCase()
                                ))
                        )
                        .map((lob) => (
                          <button
                            key={lob.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                line_of_business_id: Number(lob.id),
                              } as CreateCampaignRequest);
                              setIsLineOfBusinessDropdownOpen(false);
                              setLineOfBusinessSearchTerm("");
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            <div className="font-medium">{lob.name}</div>
                            {lob.description && (
                              <div className="text-gray-500 text-xs">
                                {lob.description}
                              </div>
                            )}
                          </button>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <div className="relative" ref={departmentDropdownRef}>
              <button
                type="button"
                onClick={() =>
                  setIsDepartmentDropdownOpen(!isDepartmentDropdownOpen)
                }
                className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-1 focus:ring-[#588157] focus:border-[#588157] bg-white text-sm text-left flex items-center justify-between`}
              >
                <span
                  className={`text-sm ${
                    (formData as { department_id?: number }).department_id
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {(formData as { department_id?: number }).department_id
                    ? departmentsData.find(
                        (dept) =>
                          Number(dept.id) ===
                          Number(
                            (formData as { department_id?: number })
                              .department_id
                          )
                      )?.name
                    : "Select department (optional)"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isDepartmentDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDepartmentDropdownOpen && (
                <div
                  className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg max-h-60 overflow-auto`}
                >
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={departmentSearchTerm}
                        onChange={(e) =>
                          setDepartmentSearchTerm(e.target.value)
                        }
                        className={`w-full pl-10 pr-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:ring-1 focus:ring-[#588157] focus:border-[#588157]`}
                        placeholder="Search departments..."
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    {departmentsData.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No departments available
                      </div>
                    ) : (
                      departmentsData
                        .filter(
                          (dept) =>
                            dept.name
                              .toLowerCase()
                              .includes(departmentSearchTerm.toLowerCase()) ||
                            (dept.description &&
                              dept.description
                                .toLowerCase()
                                .includes(departmentSearchTerm.toLowerCase()))
                        )
                        .map((dept) => (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                department_id: Number(dept.id),
                              } as CreateCampaignRequest);
                              setIsDepartmentDropdownOpen(false);
                              setDepartmentSearchTerm("");
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            <div className="font-medium">{dept.name}</div>
                            {dept.description && (
                              <div className="text-gray-500 text-xs">
                                {dept.description}
                              </div>
                            )}
                          </button>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Tags
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Enter a tag and press Enter"
                  className={`flex-1 px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-1 focus:ring-[#588157] focus:border-[#588157] text-sm`}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className={`px-3 py-2 text-sm font-medium text-white ${tw.rounded} disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 border text-sm font-medium rounded-full"
                      style={{
                        borderColor: color.primary.accent,
                        color: color.primary.accent,
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:opacity-70 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Press Enter or click the + button to add tags
            </p>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program
            </label>
            <div className="relative" ref={programDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProgramDropdownOpen(!isProgramDropdownOpen)}
                className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-1 focus:ring-[#588157] focus:border-[#588157] bg-white text-sm text-left flex items-center justify-between`}
              >
                <span
                  className={`text-sm ${
                    (formData as { program_id?: number }).program_id
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {(formData as { program_id?: number }).program_id
                    ? programs.find(
                        (p) =>
                          Number(p.id) ===
                          Number(
                            (formData as { program_id?: number }).program_id
                          )
                      )?.name
                    : "Select program (optional)"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isProgramDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isProgramDropdownOpen && (
                <div
                  className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg max-h-60 overflow-auto`}
                >
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={programSearchTerm}
                        onChange={(e) => setProgramSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:ring-1 focus:ring-[#588157] focus:border-[#588157]`}
                        placeholder="Search programs..."
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    {isLoadingPrograms ? (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Loading programs...
                      </div>
                    ) : programs.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No programs available
                      </div>
                    ) : (
                      programs
                        .filter(
                          (program) =>
                            program.name
                              .toLowerCase()
                              .includes(programSearchTerm.toLowerCase()) ||
                            (program.description &&
                              program.description
                                .toLowerCase()
                                .includes(programSearchTerm.toLowerCase()))
                        )
                        .map((program) => (
                          <button
                            key={program.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                program_id: Number(program.id),
                              } as CreateCampaignRequest);
                              setIsProgramDropdownOpen(false);
                              setProgramSearchTerm("");
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            <div className="font-medium">{program.name}</div>
                            {program.description && (
                              <div className="text-gray-500 text-xs">
                                {program.description}
                              </div>
                            )}
                          </button>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Objective *
            </label>
            <div className="relative" ref={objectiveDropdownRef}>
              <button
                type="button"
                onClick={() =>
                  setIsObjectiveDropdownOpen(!isObjectiveDropdownOpen)
                }
                className={`w-full px-3 py-2 border ${
                  tw.rounded
                } focus:ring-1 bg-white text-sm text-left flex items-center justify-between ${
                  validationErrors.objective
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-[#588157] focus:border-[#588157]"
                }`}
              >
                <span
                  className={`text-sm ${
                    formData.objective ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {formData.objective
                    ? objectiveOptions.find(
                        (o) => o.value === formData.objective
                      )?.label
                    : "Select objective"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isObjectiveDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isObjectiveDropdownOpen && (
                <div
                  className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg max-h-60 overflow-auto`}
                >
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={objectiveSearchTerm}
                        onChange={(e) => setObjectiveSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:ring-1 focus:ring-[#588157] focus:border-[#588157]`}
                        placeholder="Search objectives..."
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    {objectiveOptions
                      .filter(
                        (objective) =>
                          objective.label
                            .toLowerCase()
                            .includes(objectiveSearchTerm.toLowerCase()) ||
                          objective.description
                            .toLowerCase()
                            .includes(objectiveSearchTerm.toLowerCase())
                      )
                      .map((objective) => (
                        <button
                          key={objective.value}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              objective: objective.value as
                                | "acquisition"
                                | "retention"
                                | "churn_prevention"
                                | "upsell_cross_sell"
                                | "reactivation",
                            });
                            setIsObjectiveDropdownOpen(false);
                            setObjectiveSearchTerm("");
                            if (
                              validationErrors.objective &&
                              clearValidationErrors
                            ) {
                              clearValidationErrors();
                            }
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{objective.icon}</span>
                            <div>
                              <div className="font-medium">
                                {objective.label}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {objective.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
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
              {[
                {
                  value: "low",
                  label: "Low",
                  bars: 1,
                  color: "text-blue-600",
                },
                {
                  value: "medium",
                  label: "Medium",
                  bars: 2,
                  color: "text-yellow-600",
                },
                {
                  value: "high",
                  label: "High",
                  bars: 3,
                  color: "text-orange-600",
                },
                {
                  value: "critical",
                  label: "Critical",
                  bars: 4,
                  color: "text-red-600",
                },
              ].map((priority) => {
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
                    <span className="hidden sm:inline">{priority.label}</span>
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
                  Rank within{" "}
                  {formData.priority.charAt(0).toUpperCase() +
                    formData.priority.slice(1)}{" "}
                  Priority
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rank) => (
                    <button
                      key={rank}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, priority_rank: rank })
                      }
                      className={`w-8 h-8 ${
                        tw.rounded
                      } text-xs font-medium transition-all duration-200 flex items-center justify-center border ${
                        formData.priority_rank === rank
                          ? "bg-black text-white border-black shadow-sm"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {rank}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Communication Policy
          </label>
          <div className="relative" ref={policyDropdownRef}>
            <button
              type="button"
              onClick={() => setIsPolicyDropdownOpen(!isPolicyDropdownOpen)}
              className={`${
                components.input.default
              } w-full px-3 py-2 text-left flex items-center justify-between ${
                selectedPolicy ? "" : "text-gray-500"
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedPolicy && (
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedPolicy.isActive ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></div>
                )}
                <span className="text-sm">
                  {selectedPolicy
                    ? selectedPolicy.name
                    : "Choose a communication policy (optional)"}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isPolicyDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isPolicyDropdownOpen && (
              <div
                className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-xl max-h-64 overflow-hidden`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPolicy(null);
                    setIsPolicyDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-200"
                >
                  <div className="text-sm font-medium text-gray-700">
                    No Policy
                  </div>
                  <div className="text-xs text-gray-500">
                    Campaign will use default communication settings
                  </div>
                </button>

                <div className="max-h-48 overflow-y-auto">
                  {communicationPolicies.map((policy) => (
                    <button
                      key={policy.id}
                      type="button"
                      onClick={() => {
                        setSelectedPolicy(policy);
                        setIsPolicyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                        selectedPolicy?.id === policy.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            policy.isActive ? "bg-green-500" : "bg-gray-400"
                          }`}
                        ></div>
                        <div className="text-sm font-medium text-gray-900">
                          {policy.name}
                        </div>
                      </div>
                      {policy.description && (
                        <div className="text-xs text-gray-500 ml-4">
                          {policy.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-1 focus:ring-[#588157] focus:border-[#588157] text-sm`}
            placeholder="Describe your campaign goals and objectives"
            rows={3}
          />
        </div>

        {/* Budget Allocation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.campaigns.budgetAllocated} *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {getCurrencySymbol()}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.budget_allocated || ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({
                  ...formData,
                  budget_allocated: value ? parseFloat(value) : undefined,
                });
                if (
                  validationErrors.budget_allocated &&
                  clearValidationErrors
                ) {
                  clearValidationErrors();
                }
              }}
              className={`w-full pl-12 pr-3 py-2 border ${
                tw.rounded
              } focus:ring-1 text-sm ${
                validationErrors.budget_allocated
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-[#588157] focus:border-[#588157]"
              }`}
              placeholder="0.00"
              required
            />
          </div>
          {validationErrors.budget_allocated && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.budget_allocated}
            </p>
          )}
        </div>

        {/* Campaign Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
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
              onClick={(e) => {
                // Trigger date picker on click
                (e.target as HTMLInputElement).showPicker?.();
              }}
              onFocus={(e) => {
                // Show picker when focused
                (e.target as HTMLInputElement).showPicker?.();
              }}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-1 focus:ring-[#588157] focus:border-[#588157] text-sm cursor-pointer`}
            />
            <p className="text-xs text-gray-500 mt-1">
              When should this campaign start?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
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
              onClick={(e) => {
                // Trigger date picker on click
                (e.target as HTMLInputElement).showPicker?.();
              }}
              onFocus={(e) => {
                // Show picker when focused
                (e.target as HTMLInputElement).showPicker?.();
              }}
              className={`w-full px-3 py-2 border ${
                tw.rounded
              } focus:ring-1 text-sm cursor-pointer ${
                validationErrors.end_date
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-[#588157] focus:border-[#588157]"
              }`}
              min={
                formData.start_date
                  ? new Date(formData.start_date).toISOString().slice(0, 16)
                  : undefined
              }
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
          setPendingPolicyData(null);
        }}
        policy={policyToCustomize || undefined}
        onSave={handleSaveCustomizedPolicy}
        isSaving={false}
      />

      {/* Policy Name Modal */}
      <PolicyNameModal
        isOpen={isNameModalOpen}
        onClose={() => {
          setIsNameModalOpen(false);
          setPendingPolicyData(null);
        }}
        onConfirm={handleConfirmPolicyName}
        defaultName={
          policyToCustomize
            ? `${policyToCustomize.name.replace(
                " - Customizing...",
                ""
              )} - Custom`
            : ""
        }
        title="Save Custom Policy"
      />
    </div>
  );
}
