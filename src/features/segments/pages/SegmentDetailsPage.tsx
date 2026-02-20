import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Popover } from "@headlessui/react";
import {
  ArrowLeft,
  Users,
  Tag,
  Activity,
  Download,
  Edit,
  Trash2,
  Eye,
  Plus,
  X,
  Search,
  Layers,
  Zap,
  MoreVertical,
} from "lucide-react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Segment } from "../types/segment";
import { segmentService } from "../services/segmentService";
import { customerService } from "../../customers360/services/customerServices";
import { campaignFlowService } from "../../campaigns/services/campaignFlowService";
import { useToast } from "../../../contexts/ToastContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw, button, zIndex } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import BackButton from "../../../shared/components/ui/BackButton";
import SegmentModal from "../components/SegmentModal";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import ViewMembersModal from "../components/ViewMembersModal";
import AddMembersModal from "../components/AddMembersModal";
import { PermissionGate } from "../../auth/components/PermissionGate";
import DateFormatter from "../../../shared/components/DateFormatter";
import type { Customer } from "../../customers360/types/customer";

export default function SegmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError, info: showInfo } = useToast();
  const confirm = useConfirm();
  const { t } = useLanguage();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

    navigateBackOrFallback(navigate, "/dashboard/segments");
  };

  const [segment, setSegment] = useState<Segment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [membersCount, setMembersCount] = useState<number>(0);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "xml">("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [categoryName, setCategoryName] = useState<string>("Uncategorized");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Members state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [membersSearchTerm, setMembersSearchTerm] = useState("");
  const [debouncedMembersSearchTerm, setDebouncedMembersSearchTerm] = useState("");
  const [membersPage, setMembersPage] = useState(1);
  const [isLoadingMembersList, setIsLoadingMembersList] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [membersTotalPages, setMembersTotalPages] = useState(1);

  // Customer selection state
  const [showCustomerSelection, setShowCustomerSelection] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerStatusFilter, setCustomerStatusFilter] = useState<string>("all");
  const [allCustomersForSelection, setAllCustomersForSelection] = useState<
    Customer[]
  >([]);
  const [isLoadingCustomersForSelection, setIsLoadingCustomersForSelection] =
    useState(false);
  const [customerIdsInput, setCustomerIdsInput] = useState("");

  // Action button states
  const [isRecomputingMembers, setIsRecomputingMembers] = useState(false);
  const [isComputingSize, setIsComputingSize] = useState(false);
  const [isValidatingQuery, setIsValidatingQuery] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showAddTagInput, setShowAddTagInput] = useState(false);

  // Phase 3 - New sections
  const [segmentHierarchy, setSegmentHierarchy] = useState<{ parent_id?: number; parent_name?: string } | null>(null);
  const [childSegments, setChildSegments] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
  const [growthTrend, setGrowthTrend] = useState<Array<{ date: string; member_count: number }>>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<{ conversion_rate?: number; campaign_count?: number; avg_engagement?: number } | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Phase 4 - Preview & Export
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewMembers, setPreviewMembers] = useState<Array<{ [key: string]: unknown }>>([]);
  const [previewCount, setPreviewCount] = useState<number>(0);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExportJobRunning, setIsExportJobRunning] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportFields, setExportFields] = useState<string[]>(["msisdn", "email", "score"]);

  // Phase 4 - Advanced Edit
  const [showAdvancedEdit, setShowAdvancedEdit] = useState(false);
  const [editQuery, setEditQuery] = useState<string>("");
  const [editParentId, setEditParentId] = useState<number | null>(null);
  const [parentSegments, setParentSegments] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [isUpdatingQuery, setIsUpdatingQuery] = useState(false);
  const [isUpdatingParent, setIsUpdatingParent] = useState(false);

  // Campaign Flows tab
  const [campaignFlows, setCampaignFlows] = useState<Array<{ campaign_id: number; campaign_name: string; segment_id: number; offer_id: number; offer_name: string; flow_type: string; wait_interval_hours: number }>>([]);
  const [isLoadingCampaignFlows, setIsLoadingCampaignFlows] = useState(false);

  // Filter customers based on search term and status
  const filteredCustomersForSelection = useMemo(() => {
    let filtered = allCustomersForSelection;

    // Apply status filter
    if (customerStatusFilter !== "all") {
      filtered = filtered.filter(
        (customer) =>
          (customer.subscriber_status || "unknown").toLowerCase() ===
          customerStatusFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (customerSearchTerm.trim()) {
      const term = customerSearchTerm.toLowerCase();
      filtered = filtered.filter((customer) => {
        const firstName = customer.first_name || "";
        const lastName = customer.last_name || "";
        const email = customer.email || "";
        const msisdn = customer.msisdn || "";
        const subscriberId = String(customer.subscriber_id || customer.id || "");

        return (
          firstName.toLowerCase().includes(term) ||
          lastName.toLowerCase().includes(term) ||
          email.toLowerCase().includes(term) ||
          msisdn.toLowerCase().includes(term) ||
          subscriberId.includes(term)
        );
      });
    }

    return filtered.slice(0, 50); // Limit to 50 for performance
  }, [customerSearchTerm, customerStatusFilter, allCustomersForSelection]);

  const loadCustomersForSelection = useCallback(async () => {
    setIsLoadingCustomersForSelection(true);
    try {
      const response = await customerService.getAllCustomers({
        limit: 100,
        offset: 0,
        skipCache: true,
      });
      const customers = response.data || [];
      setAllCustomersForSelection(customers);
    } catch (err) {
      console.error("Failed to load customers:", err);
      showError("Error loading customers", "Please try again later.");
      setAllCustomersForSelection([]);
    } finally {
      setIsLoadingCustomersForSelection(false);
    }
  }, [showError]);

  // Map flow types to user-friendly labels
  const getFlowTypeLabel = (flowType: string): string => {
    const flowTypeMap: { [key: string]: string } = {
      STANDARD: "Standard",
      AB_TEST: "A/B Test",
      CHAMPION_CHALLENGER: "Champion-Challenger",
      ROUND_ROBIN: "Round Robin",
      MULTIPLE_LEVEL: "Multiple Level",
    };
    return flowTypeMap[flowType] || flowType;
  };

  const loadCategoryName = useCallback(
    async (categoryId: number | string) => {
      try {
        const response = await segmentService.getSegmentCategories();
        const categories = response.data || [];

        // Handle both string and number IDs
        const category = categories.find(
          (cat: { id: number | string; name: string }) =>
            String(cat.id) === String(categoryId),
        );

        const name = category?.name || "Uncategorized";
        setCategoryName(name);
      } catch {
        setCategoryName("Uncategorized");
      }
    },
    [t],
  );

  const loadSegment = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await segmentService.getSegmentById(Number(id));

      // Extract data from response (backend wraps it in data object)
      const segmentData =
        (response as { data?: Segment }).data || (response as Segment);
      setSegment(segmentData as Segment);

      // Load category name if category exists
      if ((segmentData as Segment).category) {
        loadCategoryName((segmentData as Segment).category!);
      } else {
        setCategoryName("Uncategorized");
      }
    } catch (err) {
      console.error("Failed to load segment details:", err);
      showError("Error loading segment", "Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [id, showError, loadCategoryName, t]);

  const loadMembersCount = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoadingMembers(true);

      const response = await segmentService.getSegmentMembersCount(Number(id), true);
      // API returns { success: true, data: { count: number } }
      const count = response.data?.count || 0;
      setMembersCount(count);
    } catch (err) {
      // Silently fail for members count - don't show error to avoid loops
      console.warn("Failed to load members count:", err);
      setMembersCount(0);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [id, t]);

  // Debounce members search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMembersSearchTerm(membersSearchTerm);
      setMembersPage(1); // Reset to first page when searching
    }, 300);
    return () => clearTimeout(timer);
  }, [membersSearchTerm]);

  const loadMembers = useCallback(async () => {
    if (!id) return;

    setIsLoadingMembersList(true);
    try {
      // Use search endpoint if there's a search term, otherwise use getSegmentMembers
      let response;
      if (debouncedMembersSearchTerm) {
        response = await segmentService.searchSegmentMembers(Number(id), {
          query: debouncedMembersSearchTerm,
          page: membersPage,
          pageSize: 10,
          skipCache: true,
        });
      } else {
        response = await segmentService.getSegmentMembers(Number(id), {
          page: membersPage,
          pageSize: 10,
          skipCache: true,
        });
      }

      const membersData = response.data || [];
      setMembers(membersData);
      if (response.pagination) {
        const total = response.pagination.total || membersData.length;
        setMembersCount(total);
        setMembersTotalPages(Math.ceil(total / (response.pagination.limit || 10)));
      } else if (response.meta) {
        const total = response.meta.total || membersData.length;
        setMembersCount(total);
        setMembersTotalPages(response.meta.totalPages || 1);
      } else {
        setMembersCount(membersData.length);
        setMembersTotalPages(1);
      }
    } catch (err) {
      // Only show error if it's not a 404 (endpoint might not exist)
      const error = err as Error & { status?: number };
      if (error.status !== 404) {
        console.error("Failed to load segment members:", err);
      }
      setMembers([]);
      setMembersTotalPages(1);
    } finally {
      setIsLoadingMembersList(false);
    }
  }, [id, membersPage, debouncedMembersSearchTerm, t]);

  // Load Phase 3 sections - Define before useEffect that depends on them
  const loadHierarchy = useCallback(async () => {
    if (!id) return;
    setIsLoadingHierarchy(true);
    try {
      const [hierarchyRes, childrenRes] = await Promise.all([
        segmentService.getSegmentHierarchy(Number(id)),
        segmentService.getSegmentChildren(Number(id)),
      ]);
      setSegmentHierarchy(hierarchyRes.data || null);
      const children = Array.isArray(childrenRes.data) ? childrenRes.data : childrenRes.data ? [childrenRes.data] : [];
      setChildSegments(children);
    } catch (err) {
      console.warn("Failed to load hierarchy:", err);
      setSegmentHierarchy(null);
      setChildSegments([]);
    } finally {
      setIsLoadingHierarchy(false);
    }
  }, [id]);

  const loadAnalyticsData = useCallback(async () => {
    if (!id) return;
    setIsLoadingAnalytics(true);
    try {
      const [trendRes, metricsRes] = await Promise.all([
        segmentService.getSegmentGrowthTrend(Number(id)),
        segmentService.getSegmentPerformanceMetrics(Number(id)),
      ]);
      const trend = Array.isArray(trendRes.data) ? trendRes.data : trendRes.data ? [trendRes.data] : [];
      setGrowthTrend(trend.map((item: any) => ({
        date: item.date || item.name || "Unknown",
        member_count: parseInt(item.member_count) || parseInt(item.count) || 0,
      })));
      setPerformanceMetrics(metricsRes.data || null);
    } catch (err) {
      console.warn("Failed to load analytics:", err);
      setGrowthTrend([]);
      setPerformanceMetrics(null);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadSegment();
      loadMembersCount();
    }
  }, [id, loadSegment, loadMembersCount]);

  // Separate effect for members to avoid loops
  useEffect(() => {
    if (id) {
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, membersPage, debouncedMembersSearchTerm]);

  // Load Phase 3 data
  useEffect(() => {
    if (id) {
      loadHierarchy();
    }
  }, [id, loadHierarchy]);

  useEffect(() => {
    if (id) {
      loadAnalyticsData();
    }
  }, [id, loadAnalyticsData]);

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleSegmentSaved = (updatedSegment: Segment) => {
    setSegment(updatedSegment);
    setIsEditModalOpen(false);
    success(
      "Segment updated",
      `"${updatedSegment.name || 'Unnamed'}" has been updated successfully`
    );
    // Reload segment data to ensure we have the latest
    loadSegment();
  };

  const handleDelete = () => {
    if (!segment) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!segment) return;

    setIsDeleting(true);
    try {
      await segmentService.deleteSegment(Number(id));
      success(
        "Segment deleted",
        `Segment "${segment.name}" has been deleted successfully`,
      );
      setShowDeleteModal(false);
      navigate("/dashboard/segments");
    } catch (err) {
      console.error("Failed to delete segment:", err);
      showError("Error deleting segment", "Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleAddMembers = async () => {
    // Use selectedCustomers if from modal, otherwise use customerIdsInput
    const customerIds = showCustomerSelection ? selectedCustomers :
      customerIdsInput
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id));

    if (customerIds.length === 0) {
      const errorMsg = showCustomerSelection
        ? "Please select at least one customer"
        : "Please enter at least one customer ID";
      showError("Validation error", errorMsg);
      return;
    }

    try {
      await segmentService.addSegmentMembers(Number(id), {
        segmentId: Number(id),
        subscriberIds: customerIds,
      });
      success(
        "Members added",
        `${customerIds.length} member(s) added successfully`,
      );
      setCustomerIdsInput("");
      setShowMembersModal(false);
      await loadMembersCount();
      await loadMembers();
    } catch (err) {
      console.error("Failed to add members:", err);
      showError("Error adding members", "Please try again later.");
    }
  };

  const handleRemoveMembers = async (customerIds: Array<string | number>) => {
    const confirmed = await confirm({
      title: "Remove Members",
      message: `Remove ${customerIds.length} member(s) from this segment?`,
      type: "warning",
      confirmText: "Remove",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      // Convert to numbers
      const numericIds = customerIds
        .map((id) => (typeof id === "string" ? parseInt(id, 10) : id))
        .filter((id) => !isNaN(id));

      await segmentService.deleteSegmentMembers(Number(id), {
        customer_ids: numericIds,
      });
      success(
        "Members removed",
        `${customerIds.length} member(s) removed successfully`,
      );
      await loadMembersCount();
      await loadMembers();
    } catch (err) {
      console.error("Failed to remove members:", err);
      showError("Error removing members", "Please try again later.");
    }
  };

  const handleAddCustomers = async (customers: any[]) => {
    if (!customers || customers.length === 0) {
      showError("Validation error", "Please select at least one customer");
      return;
    }

    const customerIds = customers.map((c) => Number(c.customerId || c.id)).filter((id) => !isNaN(id));

    if (customerIds.length === 0) {
      showError("Validation error", "No valid customer IDs selected");
      return;
    }

    try {
      await segmentService.addSegmentMembers(Number(id), {
        segmentId: Number(id),
        subscriberIds: customerIds,
      });
      success(
        "Members added",
        `${customerIds.length} member(s) added successfully`,
      );
      setShowCustomerSelection(false);
      await loadMembersCount();
      await loadMembers();
    } catch (err) {
      console.error("Failed to add members:", err);
      showError("Error adding members", "Please try again later.");
    }
  };

  // Action button handlers
  const handleRecomputeMembers = async () => {
    if (!id) return;
    setIsRecomputingMembers(true);
    try {
      const result = await segmentService.recomputeSegmentMembers({
        segment_id: Number(id),
      });
      if (result.success) {
        success("Recompute started", "Segment members are being recomputed");
        await loadMembersCount();
      } else {
        const errorMsg = Array.isArray(result.errors) ? result.errors[0] : result.errors || "Recomputation failed";
        showError("Error recomputing members", errorMsg);
      }
    } catch (err) {
      console.error("Failed to recompute members:", err);
      showError("Error recomputing members", (err as Error).message || "Please try again later.");
    } finally {
      setIsRecomputingMembers(false);
    }
  };

  const handleComputeSize = async () => {
    if (!id) return;
    setIsComputingSize(true);
    try {
      await segmentService.computeSegmentSize(Number(id));
      success("Size computation started", "Segment size is being computed");
      await loadSegment();
    } catch (err) {
      console.error("Failed to compute size:", err);
      showError("Error computing size", (err as Error).message || "Please try again later.");
    } finally {
      setIsComputingSize(false);
    }
  };

  const handleValidateQuery = async () => {
    if (!id) return;
    setIsValidatingQuery(true);
    try {
      const result = await segmentService.validateSegmentQuery(Number(id));
      if (result.success && result.data?.isValid) {
        success("Query validation successful", "The segment query is valid");
      } else {
        showError("Query validation failed", result.data?.error || "Query contains errors");
      }
    } catch (err) {
      console.error("Failed to validate query:", err);
      showError("Error validating query", (err as Error).message || "Please try again later.");
    } finally {
      setIsValidatingQuery(false);
    }
  };

  const handleAddTag = async () => {
    if (!segment || !newTag.trim()) return;

    setIsAddingTag(true);
    try {
      await segmentService.updateSegmentTags(segment.id, {
        tags: [...(segment.tags || []), newTag.trim()],
      });
      success("Tag added", `Tag "${newTag}" has been added`);
      setNewTag("");
      setShowAddTagInput(false);
      await loadSegment();
    } catch (err) {
      console.error("Failed to add tag:", err);
      showError("Error adding tag", (err as Error).message || "Please try again later.");
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!segment) return;

    setIsAddingTag(true);
    try {
      await segmentService.deleteSegmentTag(segment.id, tag);
      success("Tag removed", `Tag "${tag}" has been removed`);
      await loadSegment();
    } catch (err) {
      console.error("Failed to remove tag:", err);
      showError("Error removing tag", (err as Error).message || "Please try again later.");
    } finally {
      setIsAddingTag(false);
    }
  };

  // Phase 4 - Preview
  const handlePreview = async () => {
    if (!segment) return;

    setIsLoadingPreview(true);
    try {
      const [countRes, previewRes] = await Promise.all([
        segmentService.getPreviewCount(Number(id)),
        segmentService.previewSegment(Number(id)),
      ]);

      setPreviewCount(countRes.data?.count || 0);
      const members = Array.isArray(previewRes.data) ? previewRes.data : previewRes.data ? [previewRes.data] : [];
      setPreviewMembers(members);
      setShowPreviewModal(true);
      success("Preview loaded", "Member preview has been generated");
    } catch (err) {
      console.error("Failed to load preview:", err);
      showError("Error loading preview", (err as Error).message || "Please try again later.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Phase 4 - Export
  const handleExport = async () => {
    if (!segment) return;

    setIsExporting(true);
    try {
      const response = await segmentService.customExport(Number(id), {
        format: exportFormat,
        fields: exportFields,
      });

      const jobId = response.data?.job_id || response.data?.jobId;
      if (jobId) {
        setExportJobId(jobId);
        setIsExportJobRunning(true);
        success("Export started", `Export job ${jobId} has been queued`);

        // Poll export status
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await segmentService.getExportStatus(Number(id), jobId);
            const status = statusRes.data?.status;

            if (status === "completed" || status === "failed") {
              clearInterval(pollInterval);
              setIsExportJobRunning(false);

              if (status === "completed") {
                const downloadUrl = statusRes.data?.download_url || statusRes.data?.downloadUrl;
                if (downloadUrl) {
                  window.location.href = downloadUrl;
                }
                success("Export completed", "Your export file is ready");
              } else {
                showError("Export failed", statusRes.data?.error || "Export job failed");
              }
            }
          } catch (err) {
            console.warn("Failed to check export status:", err);
          }
        }, 2000);

        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsExportJobRunning(false);
        }, 300000);
      }
    } catch (err) {
      console.error("Failed to start export:", err);
      showError("Error starting export", (err as Error).message || "Please try again later.");
      setIsExporting(false);
    }
  };

  // Phase 4 - Load parent segments for advanced edit
  const loadParentSegments = useCallback(async () => {
    if (!id) return;

    setIsLoadingParents(true);
    try {
      const response = await segmentService.getParentSegments();
      const parents = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];
      // Filter out current segment from parent list
      const filteredParents = parents.filter((p: { id: number }) => p.id !== Number(id));
      setParentSegments(filteredParents);
    } catch (err) {
      console.warn("Failed to load parent segments:", err);
      setParentSegments([]);
    } finally {
      setIsLoadingParents(false);
    }
  }, [id]);

  // Phase 4 - Update Query
  const handleUpdateQuery = async () => {
    if (!segment || !editQuery.trim()) return;

    setIsUpdatingQuery(true);
    try {
      await segmentService.updateSegmentQuery(Number(id), {
        query: editQuery.trim(),
      });
      success("Query updated", "Segment query has been updated successfully");
      setShowAdvancedEdit(false);
      setEditQuery("");
      await loadSegment();
    } catch (err) {
      console.error("Failed to update query:", err);
      showError("Error updating query", (err as Error).message || "Please try again later.");
    } finally {
      setIsUpdatingQuery(false);
    }
  };

  // Phase 4 - Update Parent
  const handleUpdateParent = async () => {
    if (!segment || editParentId === null) return;

    setIsUpdatingParent(true);
    try {
      await segmentService.updateSegmentParent(Number(id), editParentId);
      success("Parent updated", "Segment parent has been updated successfully");
      setShowAdvancedEdit(false);
      setEditParentId(null);
      await loadSegment();
      await loadHierarchy();
    } catch (err) {
      console.error("Failed to update parent:", err);
      showError("Error updating parent", (err as Error).message || "Please try again later.");
    } finally {
      setIsUpdatingParent(false);
    }
  };

  const loadCampaignFlows = useCallback(async () => {
    if (!id) return;
    setIsLoadingCampaignFlows(true);
    try {
      const response = await campaignFlowService.getCampaignFlowsBySegment(Number(id));
      if (response && response.success && Array.isArray(response.data)) {
        // Transform API response to display format
        const flows = response.data.map((flow: any) => ({
          campaign_id: flow.campaign_id,
          campaign_name: flow.campaign_name || `Campaign #${flow.campaign_id}`,
          segment_id: flow.segment_id,
          offer_id: flow.offer_id,
          offer_name: flow.offer_name || `Offer${flow.offer_id}`,
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
  }, [id]);

  // Load campaign flows on mount
  useEffect(() => {
    if (id) {
      loadCampaignFlows();
    }
  }, [id, loadCampaignFlows]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner
          variant="modern"
          size="xl"
          color="primary"
          className="mb-4"
        />
        <p className={`${tw.textMuted} font-medium text-sm`}>
          Loading segment details...
        </p>
      </div>
    );
  }

  if (!segment) {
    return (
      <div className="text-center py-16">
        <h2 className={`text-xl font-semibold ${tw.textPrimary} mb-2`}>
          Segment not found
        </h2>
        <p className={`${tw.textSecondary} mb-4`}>
          The segment you're looking for doesn't exist.
        </p>
        <button
          onClick={() =>
            navigateBackOrFallback(navigate, "/dashboard/segments")
          }
          className={`${tw.button} inline-flex items-center px-4 py-2`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Segments
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton fallbackTo="/dashboard/segments" onClick={handleBack} />
          <div>
            <h1 className={`${tw.tableFirstColumn} ${tw.textPrimary}`}>
              {segment.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <PermissionGate permission="segments.update">
            <button
              onClick={handleEdit}
              className={`text-sm font-medium text-white ${tw.rounded} flex items-center gap-2`}
              style={{
                backgroundColor: button.action.background,
                color: button.action.color,
                borderRadius: button.action.borderRadius,
                padding: `${button.action.paddingY} ${button.action.paddingX}`,
              }}
            >
              <Edit className="w-4 h-4" />
              Edit Segment
            </button>
          </PermissionGate>

          <PermissionGate permission="segments.delete">
            <button
              onClick={handleDelete}
              className={`${tw.rounded} font-medium transition-all duration-200 flex items-center gap-2 text-sm`}
              style={{
                backgroundColor: button.delete.background,
                color: button.delete.color,
                border: button.delete.border,
                padding: `${button.delete.paddingY} ${button.delete.paddingX}`,
                borderRadius: button.delete.borderRadius,
                fontSize: button.delete.fontSize,
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.opacity = "1";
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </PermissionGate>

          {/* More Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="text-sm font-medium flex items-center gap-1 transition-all hover:opacity-80"
              style={{
                backgroundColor: button.bordered.background,
                color: button.bordered.color,
                border: button.bordered.border,
                borderRadius: button.bordered.borderRadius,
                padding: `${button.bordered.paddingY} ${button.bordered.paddingX}`,
              }}
            >
              <MoreVertical className="w-4 h-4" />
              More
            </button>

            {/* Dropdown Menu */}
            {showMoreMenu && (
              <div className={`absolute right-0 mt-2 w-48 ${tw.rounded} border border-gray-200 bg-white shadow-lg z-10`}>
                <PermissionGate permission="segments.update">
                  <button
                    onClick={() => {
                      handleRecomputeMembers();
                      setShowMoreMenu(false);
                    }}
                    disabled={isRecomputingMembers}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isRecomputingMembers ? "Recomputing..." : "Recompute Members"}
                  </button>
                </PermissionGate>
                <PermissionGate permission="segments.update">
                  <button
                    onClick={() => {
                      handleComputeSize();
                      setShowMoreMenu(false);
                    }}
                    disabled={isComputingSize}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isComputingSize ? "Computing..." : "Compute Size"}
                  </button>
                </PermissionGate>
                <PermissionGate permission="segments.update">
                  <button
                    onClick={() => {
                      handleValidateQuery();
                      setShowMoreMenu(false);
                    }}
                    disabled={isValidatingQuery}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isValidatingQuery ? "Validating..." : "Validate Query"}
                  </button>
                </PermissionGate>
                <PermissionGate permission="segments.read">
                  <button
                    onClick={() => {
                      handlePreview();
                      setShowMoreMenu(false);
                    }}
                    disabled={isLoadingPreview}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoadingPreview ? "Loading..." : "Preview"}
                  </button>
                </PermissionGate>
                <PermissionGate permission="segments.read">
                  <button
                    onClick={() => {
                      setShowExportModal(true);
                      setShowMoreMenu(false);
                    }}
                    disabled={isExporting || isExportJobRunning}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  >
                    {isExporting || isExportJobRunning ? "Exporting..." : "Export"}
                  </button>
                </PermissionGate>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards and Overview Content */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Users
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Total Members
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {isLoadingMembers
              ? "..."
              : (membersCount || 0).toLocaleString()}
          </p>
          {segment.refresh_frequency && (
            <p className="mt-1 text-sm text-gray-500">
              Updated {segment.refresh_frequency}
            </p>
          )}
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Activity
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Segment Type
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900 capitalize">
            {segment.type || "dynamic"}
          </p>
        </div>

        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Eye
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Visibility
            </p>
          </div>
          <p
            className={`mt-2 text-3xl font-bold ${
              segment.visibility === "public"
                ? "text-green-600"
                : "text-gray-900"
            }`}
          >
            {segment.visibility === "public" ? "Public" : "Private"}
          </p>
        </div>
      </div>

      {/* Tag Management Section */}
      {segment && (
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-4 shadow-sm`}>
          <h4 className="font-medium text-sm text-gray-900 mb-3">Tags</h4>
          <div className="space-y-3">
            {segment.tags && segment.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {segment.tags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                    style={{ backgroundColor: color.primary.accent, color: "white" }}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      disabled={isAddingTag}
                      className="hover:opacity-80 disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {showAddTagInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag name"
                  className={`px-3 py-1.5 border ${tw.borderDefault} ${tw.rounded} text-sm focus:outline-none focus:ring-1`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddTag();
                    if (e.key === "Escape") setShowAddTagInput(false);
                  }}
                  autoFocus
                />
                <button
                  onClick={handleAddTag}
                  disabled={isAddingTag || !newTag.trim()}
                  className={`${tw.rounded} px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddTagInput(false)}
                  className={`${tw.rounded} px-3 py-1.5 text-sm border border-gray-200 hover:bg-gray-50`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {!segment.tags || segment.tags.length === 0 ? (
                  <p className="text-sm text-gray-500">No tags yet</p>
                ) : null}
                <button
                  onClick={() => setShowAddTagInput(true)}
                  className={`${tw.rounded} px-3 py-1.5 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1`}
                >
                  <Plus className="w-3 h-3" />
                  Add Tag
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}
        >
          <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
            Basic Information
          </h3>
          <div className="space-y-4">
            <div>
              <label
                className={`text-sm font-medium ${tw.textMuted} block mb-1`}
              >
                Segment Name
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{segment.name}</p>
            </div>
            <div>
              <label
                className={`text-sm font-medium ${tw.textMuted} block mb-1`}
              >
                Description
              </label>
              <p className={`text-sm ${tw.textSecondary}`}>
                {segment.description || "No description"}
              </p>
            </div>
            <div>
              <label
                className={`text-sm font-medium ${tw.textMuted} block mb-1`}
              >
                Type
              </label>
              {(() => {
                const typeValue = segment.type || "dynamic";
                const getTypeStyles = () => {
                  return {
                    backgroundColor: color.primary.accent,
                    color: "white",
                  };
                };
                return (
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    style={getTypeStyles()}
                  >
                    {typeValue.charAt(0).toUpperCase() + typeValue.slice(1)}
                  </span>
                );
              })()}
            </div>
            <div>
              <label
                className={`text-sm font-medium ${tw.textMuted} block mb-1`}
              >
                Segment Catalog
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{categoryName}</p>
            </div>
            {segment.tags && segment.tags.length > 0 && (
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {segment.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700`}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-6 mt-6 border-t border-gray-200">
              <h4 className={`text-sm font-semibold ${tw.textPrimary} mb-5`}>
                Metadata
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Created */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className={`text-xs font-medium ${tw.textMuted} block mb-2`}>
                    Created
                  </label>
                  <p className={`text-sm ${tw.textPrimary} font-medium`}>
                    <DateFormatter
                      date={segment.created_on || segment.created_at}
                      useLocale
                      year="numeric"
                      month="long"
                      day="numeric"
                      includeTime
                    />
                  </p>
                </div>

                {/* Last Updated */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className={`text-xs font-medium ${tw.textMuted} block mb-2`}>
                    Last Updated
                  </label>
                  <p className={`text-sm ${tw.textPrimary} font-medium`}>
                    <DateFormatter
                      date={segment.updated_on || segment.updated_at}
                      useLocale
                      year="numeric"
                      month="long"
                      day="numeric"
                      includeTime
                    />
                  </p>
                </div>

                {/* Refresh Frequency */}
                {segment.refresh_frequency && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${color.primary.accent}15` }}
                      >
                        <Layers
                          className="w-4 h-4"
                          style={{ color: color.primary.accent }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className={`text-xs font-medium ${tw.textMuted} block mb-2`}>
                          Refresh Frequency
                        </label>
                        <p className={`text-sm ${tw.textPrimary} font-medium capitalize`}>
                          {segment.refresh_frequency}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Version */}
                {segment.version && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${color.primary.accent}15` }}
                      >
                        <Zap
                          className="w-4 h-4"
                          style={{ color: color.primary.accent }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className={`text-xs font-medium ${tw.textMuted} block mb-2`}>
                          Version
                        </label>
                        <p className={`text-sm ${tw.textPrimary} font-medium`}>
                          {segment.version}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Query Information */}
        {segment.query || segment.count_query ? (
          <div
            className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Query Information
            </h3>
            <div className="space-y-5">
              {segment.query && (
                <div>
                  <label
                    className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                  >
                    Query
                  </label>
                  <div
                    className={`bg-gray-50 ${tw.rounded} p-4 border border-gray-200 overflow-x-auto`}
                  >
                    <code className="text-xs text-gray-800 font-mono whitespace-pre-wrap break-words">
                      {segment.query}
                    </code>
                  </div>
                </div>
              )}
              {segment.count_query && (
                <div>
                  <label
                    className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                  >
                    Count Query
                  </label>
                  <div
                    className={`bg-gray-50 ${tw.rounded} p-4 border border-gray-200 overflow-x-auto`}
                  >
                    <code className="text-xs text-gray-800 font-mono whitespace-pre-wrap break-words">
                      {segment.count_query}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Query Information
            </h3>
            <div className="flex flex-col items-center justify-center py-12">
              <p className={`text-sm font-medium ${tw.textMuted} mb-1`}>
                No queries available
              </p>
              <p className={`text-xs ${tw.textMuted} text-center`}>
                This segment does not have any query information.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Criteria/Definition Section */}
      {(segment.criteria || segment.definition) && (
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}
        >
          <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
            Segment Criteria
          </h3>

          {/* Display criteria conditions in a user-friendly way */}
          {segment.criteria &&
          "conditions" in segment.criteria &&
          Array.isArray(
            (segment.criteria as Record<string, unknown>).conditions,
          ) ? (
            <div className="space-y-2">
              {(
                (segment.criteria as Record<string, unknown>)
                  .conditions as Array<Record<string, unknown>>
              ).map((condition: Record<string, unknown>, index: number) => {
                const operatorMap: Record<string, string> = {
                  ">": "is greater than",
                  ">=": "is greater than or equal to",
                  "<": "is less than",
                  "<=": "is less than or equal to",
                  "=": "equals",
                  "!=": "does not equal",
                  contains: "contains",
                  in: "is in",
                };

                const fieldName = (condition.field as string) || "Field";
                const operator =
                  operatorMap[condition.operator as string] ||
                  (condition.operator as string);
                const value =
                  typeof condition.value === "string"
                    ? `"${condition.value}"`
                    : String(condition.value);

                return (
                  <div key={index} className="relative">
                    <div
                      className={`flex items-start space-x-3 p-4 bg-gray-50 ${tw.rounded} border border-gray-200`}
                    >
                      <div
                        className={`mt-1 w-6 h-6 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                        style={{ backgroundColor: `${color.primary.accent}20` }}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{ color: color.primary.accent }}
                        >
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${tw.textPrimary}`}>
                          <span className="font-semibold">
                            {fieldName
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>{" "}
                          <span className={`${tw.textMuted}`}>{operator}</span>{" "}
                          <span
                            className="font-semibold"
                            style={{ color: color.primary.action }}
                          >
                            {value}
                          </span>
                        </p>
                      </div>
                    </div>
                    {index <
                      (
                        (segment.criteria as Record<string, unknown>)
                          .conditions as Array<Record<string, unknown>>
                      ).length -
                        1 && (
                      <div className="flex items-center justify-center py-2">
                        <span
                          className={`px-3 py-1 text-xs font-semibold ${tw.rounded}`}
                          style={{
                            backgroundColor: `${color.primary.accent}15`,
                            color: color.primary.accent,
                          }}
                        >
                          AND
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`bg-gray-50 ${tw.rounded} p-4`}>
              <p className={`text-sm ${tw.textMuted}`}>
                No conditions defined or criteria format not supported for
                display
              </p>
            </div>
          )}
        </div>
      )}

      {/* Segment Members Section */}
      <div
        className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-lg font-semibold ${tw.textPrimary}`}>
              Segment Members
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {(membersCount || 0).toLocaleString()} total member
              {membersCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowMembersModal(true);
                loadMembers();
              }}
              className={`px-4 py-2 bg-white border border-gray-300 text-gray-700 ${tw.rounded} transition-all text-sm font-medium hover:bg-gray-50`}
            >
              View Members
            </button>
            <button
              onClick={async () => {
                setShowCustomerSelection(true);
                setSelectedCustomers([]);
                setCustomerSearchTerm("");
                setCustomerStatusFilter("all");
                await loadCustomersForSelection();
              }}
              className={`text-sm font-medium text-white ${tw.rounded}`}
              style={{
                backgroundColor: button.action.background,
                color: button.action.color,
                borderRadius: button.action.borderRadius,
                padding: `${button.action.paddingY} ${button.action.paddingX}`,
              }}
            >
              Add Members
            </button>
          </div>
        </div>

        <p className={`text-sm ${tw.textSecondary}`}>
          View and manage members in this segment.{" "}
          {segment?.type === "static"
            ? "Add or remove members manually."
            : "Members are automatically computed based on segment rules."}
        </p>
      </div>

      {/* Hierarchy Section */}
      {(segmentHierarchy || childSegments.length > 0) && !isLoadingHierarchy && (
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}>
          <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
            Segment Hierarchy
          </h3>
          <div className="space-y-4">
            {segmentHierarchy?.parent_id && (
              <div>
                <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                  Parent Segment
                </label>
                <p className={`text-sm ${tw.textPrimary} px-4 py-2 bg-gray-50 ${tw.rounded}`}>
                  {segmentHierarchy.parent_name || `ID: ${segmentHierarchy.parent_id}`}
                </p>
              </div>
            )}
            {childSegments.length > 0 && (
              <div>
                <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                  Child Segments ({childSegments.length})
                </label>
                <div className="space-y-2">
                  {childSegments.map((child) => (
                    <div
                      key={child.id}
                      className={`text-sm ${tw.textPrimary} px-4 py-2 bg-gray-50 ${tw.rounded} border border-gray-200`}
                    >
                      {child.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!segmentHierarchy?.parent_id && childSegments.length === 0 && (
              <p className={`text-sm ${tw.textSecondary}`}>
                No parent or child segments
              </p>
            )}
          </div>
        </div>
      )}

      {/* Advanced Edit Section */}
      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${tw.textPrimary}`}>Advanced Settings</h3>
          {!showAdvancedEdit && (
            <button
              onClick={() => {
                setShowAdvancedEdit(true);
                setEditQuery(segment?.query || "");
                setEditParentId(segment?.parent_id || null);
                loadParentSegments();
              }}
              className={`text-sm font-medium px-3 py-1.5 ${tw.rounded} border border-gray-200 hover:bg-gray-50 transition-colors`}
            >
              <Edit className="w-4 h-4 inline mr-1" />
              Edit
            </button>
          )}
        </div>

        {showAdvancedEdit ? (
          <div className="space-y-4">
            {/* Update Query Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Segment Query
              </label>
              <textarea
                value={editQuery}
                onChange={(e) => setEditQuery(e.target.value)}
                placeholder="Enter SQL query..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={5}
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowAdvancedEdit(false)}
                  className={`px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 ${tw.rounded} hover:bg-gray-50`}
                >
                  Cancel
                </button>
                <PermissionGate permission="segments.update">
                  <button
                    onClick={handleUpdateQuery}
                    disabled={isUpdatingQuery || !editQuery.trim()}
                    className={`px-3 py-1.5 text-sm font-medium text-white ${tw.rounded} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
                    style={{ backgroundColor: isUpdatingQuery ? "#ccc" : color.primary.action }}
                  >
                    {isUpdatingQuery ? "Updating..." : "Update Query"}
                  </button>
                </PermissionGate>
              </div>
            </div>

            {/* Update Parent Section */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Segment
              </label>
              {isLoadingParents ? (
                <div className="text-sm text-gray-500">Loading parent segments...</div>
              ) : (
                <div className="relative z-40">
                  <HeadlessSelect
                    value={editParentId ? String(editParentId) : ""}
                    onChange={(value) => {
                      setEditParentId(value ? Number(value) : null);
                    }}
                    options={[
                      { label: "No parent segment", value: "" },
                      ...parentSegments.map((parent) => ({
                        label: parent.name,
                        value: String(parent.id),
                      })),
                    ]}
                    placeholder="Select parent segment"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowAdvancedEdit(false)}
                  className={`px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 ${tw.rounded} hover:bg-gray-50`}
                >
                  Cancel
                </button>
                <PermissionGate permission="segments.update">
                  <button
                    onClick={handleUpdateParent}
                    disabled={isUpdatingParent}
                    className={`px-3 py-1.5 text-sm font-medium text-white ${tw.rounded} disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{ backgroundColor: isUpdatingParent ? "#ccc" : color.primary.action }}
                  >
                    {isUpdatingParent ? "Updating..." : "Update Parent"}
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Query:</span>
              {segment?.query ? (
                <code className="block bg-gray-50 p-2 rounded mt-1 text-xs text-gray-600 font-mono overflow-x-auto max-h-20 overflow-y-auto">
                  {segment.query}
                </code>
              ) : (
                <p className="text-gray-500 mt-1">No query defined</p>
              )}
            </div>
            <div>
              <span className="font-medium text-gray-700">Parent Segment:</span>
              <p className="text-gray-600 mt-1">
                {segment?.parent_id
                  ? `ID: ${segment.parent_id}`
                  : "No parent segment assigned"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Section */}
      {(growthTrend.length > 0 || performanceMetrics || isLoadingAnalytics) && (
        <div className="space-y-6">
          {/* Growth Trend Chart */}
          {growthTrend.length > 0 && !isLoadingAnalytics && (
            <div className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}>
              <div className="mb-4">
                <h3 className={`font-semibold ${tw.textPrimary}`}>
                  Member Growth Trend
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="member_count"
                    stroke={color.primary.accent}
                    strokeWidth={2}
                    dot={{ fill: color.primary.accent, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Performance Metrics Cards */}
          {performanceMetrics && !isLoadingAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {performanceMetrics.conversion_rate !== undefined && (
                <div className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}>
                  <p className={`text-sm font-medium ${tw.textMuted} mb-2`}>
                    Conversion Rate
                  </p>
                  <p className={`text-3xl font-bold ${tw.textPrimary}`}>
                    {typeof performanceMetrics.conversion_rate === "number"
                      ? `${(performanceMetrics.conversion_rate * 100).toFixed(2)}%`
                      : "N/A"}
                  </p>
                </div>
              )}
              {performanceMetrics.campaign_count !== undefined && (
                <div className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}>
                  <p className={`text-sm font-medium ${tw.textMuted} mb-2`}>
                    Campaigns Used In
                  </p>
                  <p className={`text-3xl font-bold ${tw.textPrimary}`}>
                    {performanceMetrics.campaign_count}
                  </p>
                </div>
              )}
              {performanceMetrics.avg_engagement !== undefined && (
                <div className={`bg-white ${tw.rounded} border border-gray-200 p-6 shadow-sm`}>
                  <p className={`text-sm font-medium ${tw.textMuted} mb-2`}>
                    Avg. Engagement
                  </p>
                  <p className={`text-3xl font-bold ${tw.textPrimary}`}>
                    {typeof performanceMetrics.avg_engagement === "number"
                      ? `${(performanceMetrics.avg_engagement * 100).toFixed(1)}%`
                      : "N/A"}
                  </p>
                </div>
              )}
            </div>
          )}

          {isLoadingAnalytics && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}
        </div>
      )}

      {/* Campaign Flows Section */}
      {campaignFlows.length > 0 || isLoadingCampaignFlows ? (
        <div className={`${tw.rounded} border border-gray-200 p-6 shadow-sm`}>
          <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
            Campaign Flows ({campaignFlows.length})
          </h3>
          <p className={`text-sm ${tw.textSecondary} mb-4`}>
            Campaigns that use this segment
          </p>
          {isLoadingCampaignFlows ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : campaignFlows.length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-sm ${tw.textSecondary}`}>
                This segment is not used in any campaign flows
              </p>
            </div>
          ) : (
            <div className={`overflow-x-auto ${tw.rounded}`}>
              <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
                <thead style={{ background: color.surface.tableHeader }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                      Step
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                      Campaign
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                      Offer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                      Flow Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                      Wait (hours)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell" style={{ color: color.surface.tableHeaderText }}>
                      Allocation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaignFlows.map((flow, idx) => (
                    <tr key={idx} className="transition-colors">
                      <td className="px-6 py-4" style={{ backgroundColor: color.surface.tablebodybg }}>
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold"
                          style={{ color: "#000000" }}
                        >
                          {(flow as any).step_order || idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{ backgroundColor: color.surface.tablebodybg }}>
                        <button
                          onClick={() => navigate(`/dashboard/campaigns/${flow.campaign_id}`)}
                          className="text-sm font-medium hover:underline"
                          style={{ color: color.primary.accent }}
                        >
                          {flow.campaign_name}
                        </button>
                      </td>
                      <td className="px-6 py-4" style={{ backgroundColor: color.surface.tablebodybg }}>
                        <button
                          onClick={() => navigate(`/dashboard/offers/${flow.offer_id}`)}
                          className="text-sm font-medium hover:underline"
                          style={{ color: color.primary.accent }}
                        >
                          {flow.offer_name}
                        </button>
                      </td>
                      <td className="px-6 py-4" style={{ backgroundColor: color.surface.tablebodybg }}>
                        <span className={`text-sm font-medium ${tw.textPrimary}`}>
                          {getFlowTypeLabel(flow.flow_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4" style={{ backgroundColor: color.surface.tablebodybg }}>
                        <div className={`text-sm ${tw.textPrimary}`}>
                          {flow.wait_interval_hours}h
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell" style={{ backgroundColor: color.surface.tablebodybg }}>
                        <div className={`text-sm ${tw.textMuted}`}>
                          {(flow as any).bucket_allocation || "—"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* View Members Modal */}
      <ViewMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        segmentId={id || ""}
        segmentName={segment?.name || ""}
        segmentType={segment?.type}
        onAddMembers={handleAddMembers}
        onRemoveMembers={handleRemoveMembers}
      />

      {/* Add Members Modal */}
      <AddMembersModal
        isOpen={showCustomerSelection}
        onClose={() => setShowCustomerSelection(false)}
        segmentName={segment?.name || ""}
        onAdd={handleAddCustomers}
      />

      {/* Customer Selection Modal - Add Members (DEPRECATED - USE AddMembersModal) */}
      {false &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <div className={`bg-white ${tw.rounded} w-full max-w-4xl max-h-[90vh] flex flex-col`}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Add Members to Segment</h2>
                  <p className="text-sm text-gray-500 mt-1">Select customers to add to "{segment?.name}"</p>
                </div>
                <button
                  onClick={() => setShowCustomerSelection(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search and Filter */}
              <div className="px-6 pt-6 pb-4 flex-shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, phone..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    />
                  </div>
                  <Popover className="relative w-48">
                    <Popover.Button className={`w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left flex items-center justify-between`}>
                      {customerStatusFilter === "all" ? "All Statuses" : customerStatusFilter.charAt(0).toUpperCase() + customerStatusFilter.slice(1)}
                      <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
                    </Popover.Button>
                    <Popover.Panel className={`absolute right-0 mt-2 w-48 ${tw.rounded} border border-gray-200 bg-white shadow-lg`} style={{ zIndex: zIndex.modal }}>
                      <div className="py-1">
                        {["all", "active", "inactive", "suspended"].map((status) => (
                          <button
                            key={status}
                            onClick={() => setCustomerStatusFilter(status)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                              customerStatusFilter === status ? "bg-gray-50 font-medium" : ""
                            }`}
                          >
                            {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </Popover.Panel>
                  </Popover>
                </div>
              </div>

              {/* Customers List */}
              <div className="flex-1 overflow-y-auto px-6">
                {isLoadingCustomersForSelection ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <LoadingSpinner variant="modern" size="lg" color="primary" />
                    <p className="text-gray-500 mt-4 text-sm">Loading customers...</p>
                  </div>
                ) : filteredCustomersForSelection.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                    <p className="text-gray-500 text-sm">
                      {customerSearchTerm || customerStatusFilter !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "No customers available"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                            <input type="checkbox" className="w-4 h-4" />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            MSISDN
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomersForSelection.map((customer) => {
                          const customerId = Number(customer.subscriber_id || customer.id);
                          const isSelected = selectedCustomers.includes(customerId);
                          return (
                            <tr
                              key={`${customerId}-${customer.email}`}
                              onClick={() => {
                                setSelectedCustomers((prev) =>
                                  prev.includes(customerId)
                                    ? prev.filter((cid) => cid !== customerId)
                                    : [...prev, customerId]
                                );
                              }}
                              className="cursor-pointer transition-colors"
                              style={{
                                backgroundColor: isSelected ? `${color.primary.accent}15` : "white",
                                borderColor: "#e5e7eb",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#f9fafb";
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "white";
                              }}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedCustomers((prev) =>
                                      prev.includes(customerId)
                                        ? prev.filter((cid) => cid !== customerId)
                                        : [...prev, customerId]
                                    );
                                  }}
                                  className="w-4 h-4 cursor-pointer"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-900">
                                  {customer.msisdn || "—"}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.first_name && customer.last_name
                                    ? `${customer.first_name} ${customer.last_name}`
                                    : customer.first_name || "—"}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-900">
                                  {customer.email || "—"}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-900">
                                  {customer.subscriber_status || "—"}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
                <p className="text-sm text-gray-600">
                  {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? "s" : ""} selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCustomerSelection(false)}
                    className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleAddMembers();
                      setShowCustomerSelection(false);
                    }}
                    disabled={selectedCustomers.length === 0 || isAddingMembers}
                    className={`px-4 py-2 text-sm font-medium text-white ${tw.rounded} disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={{
                      backgroundColor: button.action.background,
                      color: button.action.color,
                      borderRadius: button.action.borderRadius,
                      padding: `${button.action.paddingY} ${button.action.paddingX}`,
                    }}
                  >
                    {isAddingMembers ? "Adding..." : `Add Selected`}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Preview Modal */}
      {showPreviewModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div
              className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Segment Preview
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {previewCount.toLocaleString()} matching members
                  </p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {previewMembers.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 font-medium">
                      Sample of first {previewMembers.length} members:
                    </p>
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                      {previewMembers.map((member, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            {Object.entries(member).map(([key, value]) => (
                              <div key={key}>
                                <div className="font-medium text-gray-700 capitalize">
                                  {key.replace(/_/g, " ")}:
                                </div>
                                <div className="text-gray-600">
                                  {String(value || "—")}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No members to preview</p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className={`w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 ${tw.rounded} transition-colors text-sm font-medium`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Export Modal */}
      {showExportModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div
              className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-md`}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Export Segment
                </h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Export Format
                    </label>
                    <div className="space-y-2">
                      <label
                        className={`flex items-center p-3 ${tw.rounded} cursor-pointer hover:bg-gray-50 transition-colors`}
                      >
                        <input
                          type="radio"
                          value="csv"
                          checked={exportFormat === "csv"}
                          onChange={(e) =>
                            setExportFormat(
                              e.target.value as "csv" | "json" | "xml",
                            )
                          }
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">CSV</div>
                          <div className="text-xs text-gray-500">
                            Comma-separated values (Excel compatible)
                          </div>
                        </div>
                      </label>
                      <label
                        className={`flex items-center p-3 ${tw.rounded} cursor-pointer hover:bg-gray-50 transition-colors`}
                      >
                        <input
                          type="radio"
                          value="json"
                          checked={exportFormat === "json"}
                          onChange={(e) =>
                            setExportFormat(
                              e.target.value as "csv" | "json" | "xml",
                            )
                          }
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">JSON</div>
                          <div className="text-xs text-gray-500">
                            JavaScript Object Notation (API friendly)
                          </div>
                        </div>
                      </label>
                      <label
                        className={`flex items-center p-3 ${tw.rounded} cursor-pointer hover:bg-gray-50 transition-colors`}
                      >
                        <input
                          type="radio"
                          value="xml"
                          checked={exportFormat === "xml"}
                          onChange={(e) =>
                            setExportFormat(
                              e.target.value as "csv" | "json" | "xml",
                            )
                          }
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">XML</div>
                          <div className="text-xs text-gray-500">
                            Extensible Markup Language (legacy systems)
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Exporting {(membersCount || 0).toLocaleString()} member
                      {membersCount !== 1 ? "s" : ""} from "{segment?.name}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowExportModal(false)}
                    disabled={isExporting}
                    className={`px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 ${tw.rounded} transition-colors disabled:opacity-50 text-sm font-medium`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isExporting || isExportJobRunning}
                    className={`text-sm font-medium text-white ${tw.rounded} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                    style={{
                      backgroundColor: button.action.background,
                      color: button.action.color,
                      borderRadius: button.action.borderRadius,
                      padding: `${button.action.paddingY} ${button.action.paddingX}`,
                    }}
                  >
                    {isExporting || isExportJobRunning ? (
                      <>
                        <LoadingSpinner size="sm" className="inline" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export as {exportFormat.toUpperCase()}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Edit Segment Modal */}
      <SegmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSegmentSaved}
        segment={segment}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Segment"
        description="Are you sure you want to delete this segment? This action cannot be undone."
        itemName={segment?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete Segment"
        cancelText="Cancel"
      />
    </div>
  );
}
