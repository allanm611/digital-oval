import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Filter,
  Users,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
  Download,
  Activity,
  TrendingUp,
  Layers,
  Play,
  Pause,
  CheckSquare,
  Square,
  Plus,
  BarChart3,
  Send,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { Segment, SegmentFilters, SortDirection } from "../types/segment";
import { segmentService } from "../services/segmentService";
import { segmentTypeService } from "../services/segmentTypeService";
import { useToast } from "../../../contexts/ToastContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";

import SegmentModal from "../components/SegmentModal";
import SegmentDetailsExpandedRow from "../components/SegmentDetailsExpandedRow";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, button, zIndex, getButtonStyles } from "../../../shared/utils/utils";
import DateFormatter from "../../../shared/components/DateFormatter";
import { useLanguage } from "../../../contexts/LanguageContext";
import { PermissionGate } from "../../auth/components/PermissionGate";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../shared/components/ui/Pagination";
import ErrorState from "../../../shared/components/ui/ErrorState";
import Checkbox from "../../../shared/components/ui/Checkbox";
import CreateCommunicationModal from "../../../shared/components/CreateCommunicationModal";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";

export default function SegmentManagementPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { confirm } = useConfirm();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [computingSegmentId, setComputingSegmentId] = useState<number | null>(
    null,
  );
  const [computeLocation, setComputeLocation] = useState<
    "frontend" | "background" | null
  >(null);
  const [showComputeDialog, setShowComputeDialog] = useState(false);
  const [computeProgress, setComputeProgress] = useState(0);
  const [allSegments, setAllSegments] = useState<Segment[]>([]); // Store all segments for tag calculation
  // COMMENTED OUT: Mock customer counts and localStorage persistence — testing real backend data
  // const [mockCustomerCounts, setMockCustomerCounts] = useState<Record<number, number>>(() => {
  //   const saved = localStorage.getItem("segmentMockCounts");
  //   return saved ? JSON.parse(saved) : {};
  // });
  const [isLoading, setIsLoading] = useState(true);
  const [duplicatingSegment, setDuplicatingSegment] = useState<number | null>(
    null,
  );
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [segmentTypes, setSegmentTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [filterTab, setFilterTab] = useState<
    "all" | "active" | "empty" | "needs-refresh" | "parents" | "most-used"
  >("all");
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | "public" | "private"
  >("all");
  const [clearFiltersKey, setClearFiltersKey] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getInitialPageSize());
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfigs, setSortConfigs] = useState<Array<{ columnId: string; direction: "asc" | "desc"; priority: number }>>([]);

  const getSortBy = (): "id" | "name" | "type" | "category" | "created_at" | "updated_at" => {
    if (sortConfigs.length === 0) return "created_at";
    const columnId = sortConfigs[0].columnId;
    return (columnId as any) || "created_at";
  };

  const getSortDirection = (): SortDirection => {
    if (sortConfigs.length === 0) return "DESC";
    return sortConfigs[0].direction === "asc" ? "ASC" : "DESC";
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);
  const actionMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const dropdownMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Bulk selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<Set<number>>(
    () => new Set(),
  );
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);

  // Phase 4 - Batch Compute & Overlap
  const [isBatchComputing, setIsBatchComputing] = useState(false);
  const [showOverlapModal, setShowOverlapModal] = useState(false);
  const [overlapData, setOverlapData] = useState<{
    overlap_percentage?: number;
    segment1_id?: number;
    segment2_id?: number;
  } | null>(null);
  const [isCalculatingOverlap, setIsCalculatingOverlap] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<{
    healthSummary: {
      total_segments?: number;
      active_segments?: number;
      inactive_segments?: number;
      dynamic_segments?: number;
      static_segments?: number;
      trigger_segments?: number;
      last_24h_created?: number;
      last_7d_created?: number;
      last_30d_created?: number;
      health_score?: number;
      issues?: string[];
    } | null;
    typeDistribution: {
      dynamic?: number;
      static?: number;
      trigger?: number;
      total?: number;
    } | null;
    categoryDistribution: Array<{
      category_id: number;
      category_name: string;
      segment_count: number;
      percentage: number;
    }>;
    largestSegments: Array<{
      segment_id: number;
      name: string;
      member_count: number;
      type: string;
      last_computed: string;
    }>;
    staleSegments: Array<{
      segment_id: number;
      name: string;
      last_computed: string;
      days_since_computed: number;
      refresh_frequency: string;
    }>;
    generalStats: Record<string, unknown> | null;
  } | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const { success, error: showError, info: showInfo } = useToast();
  const [segmentToDelete, setSegmentToDelete] = useState<Segment | null>(null);
  const [isCommunicateModalOpen, setIsCommunicateModalOpen] = useState(false);
  const [showSegmentColumnPicker, setShowSegmentColumnPicker] = useState(false);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteSegment } = useDeleteConfirm({
    onDelete: async (id) => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      setSegments((prev) => prev.filter((s) => s.id !== numId));
      await segmentService.deleteSegment(numId);
    },
    itemLabel: "Segment",
  });
  const [segmentToCommunicate, setSegmentToCommunicate] =
    useState<Segment | null>(null);

  const handleActionMenuToggle = (
    segmentId: number,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (showActionMenu === segmentId) {
      setShowActionMenu(null);
      setDropdownPosition(null);
    } else {
      setShowActionMenu(segmentId);

      // Calculate position from the clicked button - always display below
      if (event && event.currentTarget) {
        const button = event.currentTarget;
        const buttonRect = button.getBoundingClientRect();
        const dropdownWidth = 256; // w-64 = 256px
        const spacing = 4;
        const padding = 8;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Estimate dropdown content height (approximate max height needed)
        const estimatedDropdownHeight = 450;
        const requiredSpaceBelow = estimatedDropdownHeight + spacing + padding;

        // Check if we need to scroll to show dropdown fully
        const spaceBelow = viewportHeight - buttonRect.bottom - padding;

        // Find the table row containing this button
        const tableRow = button.closest("tr");

        if (spaceBelow < requiredSpaceBelow && tableRow) {
          // Calculate target position: we want the row positioned so dropdown fits below
          // Add extra buffer to ensure dropdown is fully visible
          const buffer = 50; // Extra pixels for safety
          const targetButtonBottom =
            viewportHeight - requiredSpaceBelow - buffer;
          const currentButtonBottom = buttonRect.bottom;
          const scrollOffset = currentButtonBottom - targetButtonBottom;

          // Scroll the window/page to position row correctly
          if (scrollOffset > 0) {
            // Get current scroll position
            const currentScrollY = window.scrollY || window.pageYOffset || 0;
            const newScrollY = currentScrollY + scrollOffset;

            // Get max scroll position
            const documentHeight = Math.max(
              document.documentElement.scrollHeight,
              document.body.scrollHeight,
            );
            const maxScrollY = Math.max(0, documentHeight - window.innerHeight);
            const finalScrollY = Math.min(newScrollY, maxScrollY);

            // Scroll to the calculated position
            window.scrollTo({
              top: finalScrollY,
              behavior: "smooth",
            });
          }

          // After scroll completes, recalculate position
          // Use longer timeout to ensure scroll animation completes
          setTimeout(() => {
            const updatedButtonRect = button.getBoundingClientRect();
            const updatedSpaceBelow =
              window.innerHeight - updatedButtonRect.bottom - padding;

            // Position dropdown below button
            const top = updatedButtonRect.bottom + spacing;

            // Calculate left position (right-align with button)
            let left = updatedButtonRect.right - dropdownWidth;
            if (left + dropdownWidth > window.innerWidth - padding) {
              left = window.innerWidth - dropdownWidth - padding;
            }
            if (left < padding) {
              left = padding;
            }

            // Use large maxHeight to show all options
            // After scrolling, we should have enough space
            const maxHeight = Math.max(
              estimatedDropdownHeight,
              updatedSpaceBelow + 100,
            );

            setDropdownPosition({ top, left, maxHeight });
          }, 400); // Wait longer for smooth scroll animation to complete
        } else {
          // Enough space - position normally without scrolling
          const top = buttonRect.bottom + spacing;

          // Calculate left position (right-align with button)
          let left = buttonRect.right - dropdownWidth;
          if (left + dropdownWidth > viewportWidth - padding) {
            left = viewportWidth - dropdownWidth - padding;
          }
          if (left < padding) {
            left = padding;
          }

          // Use full estimated height since we have enough space (no scrolling needed)
          setDropdownPosition({
            top,
            left,
            maxHeight: estimatedDropdownHeight,
          });
        }
      }
    }
  };

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setShowAdvancedFilters(false);
      setIsClosingModal(false);
    }, 300); // Match the transition duration
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideActionMenus = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is inside any action menu button
      const clickedInsideButton = Object.values(actionMenuRefs.current).some(
        (ref) => ref && ref.contains(target),
      );

      // Check if click is inside any dropdown menu (portal)
      const clickedInsideDropdown = Object.values(
        dropdownMenuRefs.current,
      ).some((ref) => ref && ref.contains(target));

      // Only close if clicked outside both button and dropdown
      if (!clickedInsideButton && !clickedInsideDropdown) {
        setShowActionMenu(null);
      }
    };

    if (showActionMenu !== null) {
      document.addEventListener("mousedown", handleClickOutsideActionMenus);
      return () => {
        document.removeEventListener(
          "mousedown",
          handleClickOutsideActionMenus,
        );
      };
    }
  }, [showActionMenu]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load segment types
  useEffect(() => {
    const loadSegmentTypes = async () => {
      try {
        const response = await segmentTypeService.getAllSegmentTypes();
        if (response.data) {
          setSegmentTypes(response.data);
        }
      } catch (error) {
        // Silent fail - keep segmentTypes empty if load fails
        setSegmentTypes([]);
      }
    };

    loadSegmentTypes();
  }, []);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoadingAnalytics(true);

      // Load all analytics endpoints in parallel
      const [
        healthSummaryResponse,
        typeDistributionResponse,
        categoryDistributionResponse,
        largestSegmentsResponse,
        staleSegmentsResponse,
        generalStatsResponse,
      ] = await Promise.allSettled([
        segmentService.getHealthSummary(),
        segmentService.getTypeDistribution(),
        segmentService.getCategoryDistribution(),
        segmentService.getLargestSegments(5),
        segmentService.getStaleSegments(),
        segmentService.getSegmentStats(true),
      ]);

      const analytics = {
        healthSummary:
          healthSummaryResponse.status === "fulfilled"
            ? healthSummaryResponse.value.data || healthSummaryResponse.value
            : null,
        typeDistribution:
          typeDistributionResponse.status === "fulfilled"
            ? typeDistributionResponse.value.data ||
              typeDistributionResponse.value
            : null,
        categoryDistribution:
          categoryDistributionResponse.status === "fulfilled"
            ? (
                categoryDistributionResponse.value.data ||
                categoryDistributionResponse.value ||
                []
              ).map((item) => ({
                category_id: item.category_id ?? 0,
                category_name: item.category_name ?? "",
                segment_count:
                  typeof item.segment_count === "number"
                    ? item.segment_count
                    : typeof item.count === "number"
                      ? item.count
                      : typeof item.segment_count === "string"
                        ? parseInt(item.segment_count, 10) || 0
                        : typeof item.count === "string"
                          ? parseInt(item.count, 10) || 0
                          : 0,
                percentage: item.percentage ?? 0,
              }))
            : [],
        largestSegments:
          largestSegmentsResponse.status === "fulfilled"
            ? largestSegmentsResponse.value.data ||
              largestSegmentsResponse.value ||
              []
            : [],
        staleSegments:
          staleSegmentsResponse.status === "fulfilled"
            ? staleSegmentsResponse.value.data ||
              staleSegmentsResponse.value ||
              []
            : [],
        generalStats:
          generalStatsResponse.status === "fulfilled"
            ? generalStatsResponse.value.data || generalStatsResponse.value
            : null,
      };

      setAnalyticsData(analytics);
    } catch {
      // Don't show error to user, just use fallback data
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  const loadSegments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      let segmentData: Segment[] = [];
      let totalCount = 0;

      // Use getSegments with offset-based pagination (limit + offset)
      const apiOffset = (page - 1) * pageSize;
      const response = await segmentService.getSegments({
        search: debouncedSearchTerm || undefined,
        type: typeFilter !== "all" ? (typeFilter as "static" | "dynamic" | "trigger") : undefined,
        limit: pageSize,
        offset: apiOffset,
        skipCache: true,
      });

      segmentData = response.data || [];
      totalCount = response.pagination?.total || segmentData.length;

      setSegments(segmentData);
      // Update allSegments for tag calculation - fetch all for this
      const allSegmentsResponse = await segmentService.getSegments({ skipCache: true });
      setAllSegments(allSegmentsResponse.data || []);

      // Update pagination info
      setTotalCount(totalCount);
      setTotalPages(Math.ceil(totalCount / pageSize));
    } catch (err: unknown) {
      const message =
        (err as Error).message || "Failed to load segments. Please try again.";
      showError("Failed to load segments", message);
      setError(message);
      setSegments([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, typeFilter, visibilityFilter, selectedTags, page, pageSize, showError]);

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  // Load analytics on mount
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // COMMENTED OUT: Restore computing state from localStorage — testing real backend data
  // useEffect(() => {
  //   const savedComputeState = localStorage.getItem("segmentComputeState");
  //   if (savedComputeState) {
  //     try {
  //       const state = JSON.parse(savedComputeState);
  //       const now = Date.now();
  //       const elapsedTime = now - state.startTime;
  //       const COMPUTE_DURATION = 120000;
  //       if (elapsedTime < COMPUTE_DURATION) {
  //         setComputingSegmentId(state.segmentId);
  //         setComputeLocation(state.location);
  //         setComputeProgress(Math.min((elapsedTime / COMPUTE_DURATION) * 100, 100));
  //         const progressInterval = setInterval(() => {
  //           const elapsed = Date.now() - state.startTime;
  //           const progress = Math.min((elapsed / COMPUTE_DURATION) * 100, 100);
  //           setComputeProgress(progress);
  //           if (elapsed >= COMPUTE_DURATION) {
  //             clearInterval(progressInterval);
  //             const mockCustomerCount = Math.floor(Math.random() * 7) + 4;
  //             setSegments((prev) =>
  //               prev.map((s) =>
  //                 s.id === state.segmentId
  //                   ? { ...s, size_estimate: mockCustomerCount, last_computed_at: new Date().toISOString() }
  //                   : s,
  //               ),
  //             );
  //             setComputingSegmentId(null);
  //             setComputeLocation(null);
  //             setComputeProgress(0);
  //             setShowComputeDialog(false);
  //             localStorage.removeItem("segmentComputeState");
  //             success("Segment computed", "Segment computation completed successfully");
  //           }
  //         }, 1000);
  //         return () => clearInterval(progressInterval);
  //       } else {
  //         localStorage.removeItem("segmentComputeState");
  //       }
  //     } catch (err) {
  //       localStorage.removeItem("segmentComputeState");
  //     }
  //   }
  // }, []);

  const handleSearch = () => {
    loadSegments();
  };

  const handleSort = (columnId: string) => {
    setSortConfigs((prev) => {
      const existing = prev.find((s) => s.columnId === columnId);
      if (existing) {
        if (existing.direction === "asc") {
          return [{ columnId, direction: "desc", priority: 0 }];
        } else {
          return [];
        }
      } else {
        return [{ columnId, direction: "asc", priority: 0 }];
      }
    });
  };

  const handleFilteredCountChange = (count: number) => {
    setDisplayedCount(count);
  };

  const handleCreateSegment = () => {
    setSelectedSegment(null);
    setIsModalOpen(true);
  };

  const handleViewSegment = (segmentId: number) => {
    navigate(`/dashboard/segments/${segmentId}`);
    setShowActionMenu(null);
  };

  const handleEditSegment = (segment: Segment) => {
    setSelectedSegment(segment);
    setIsModalOpen(true);
    setShowActionMenu(null);
  };

  const handleDeleteSegment = (segment: Segment) => {
    setShowActionMenu(null);
    setSegmentToDelete(segment);
    openDeleteConfirm(segment.id, segment.name);
  };

  const handleDuplicateSegment = async (segment: Segment) => {
    setShowActionMenu(null);
    showInfo(
      "Duplicate unavailable",
      "Cannot access this functionality right now.",
    );
    return;
  };

  const handleSaveSegment = async (segment: Segment) => {
    // Show success message with segment name if available, otherwise generic message
    const isCreate = !selectedSegment;
    if (segment?.name) {
      success(
        isCreate ? "Segment created" : "Segment updated",
        `Segment "${segment.name}" has been ${
          isCreate ? "created" : "updated"
        } successfully`,
      );
    } else {
      success(
        isCreate ? "Segment created" : "Segment updated",
        isCreate
          ? "Segment has been created successfully"
          : "Segment has been updated successfully",
      );
    }

    // Optimistic update: add/update segment in local state (no reload)
    if (isCreate) {
      // Prepend new segment to list
      setSegments((prev) => [segment, ...prev]);
    } else {
      // Update existing segment
      setSegments((prev) =>
        prev.map((s) => (s.id === segment.id ? segment : s)),
      );
    }
  };

  // COMMENTED OUT: Mock customer count generation — testing real backend data
  // const getMockCustomerCount = (segment: Segment): number => {
  //   if (segment.size_estimate && segment.size_estimate > 0) {
  //     return segment.size_estimate;
  //   }
  //   if (mockCustomerCounts[segment.id]) {
  //     return mockCustomerCounts[segment.id];
  //   }
  //   const newMockCount = Math.floor(Math.random() * 7) + 4;
  //   const updatedCounts = { ...mockCustomerCounts, [segment.id]: newMockCount };
  //   setMockCustomerCounts(updatedCounts);
  //   localStorage.setItem("segmentMockCounts", JSON.stringify(updatedCounts));
  //   return newMockCount;
  // };
  // Replacement: just show real size_estimate from backend
  const getMockCustomerCount = (segment: Segment): number => {
    return segment.size_estimate ?? 0;
  };

  const [computeDialogSegmentId, setComputeDialogSegmentId] = useState<
    number | null
  >(null);

  const handleComputeSegment = async (segment: Segment) => {
    setShowActionMenu(null);
    setComputeDialogSegmentId(segment.id);
    setShowComputeDialog(true);
    setComputeLocation(null);
    setComputeProgress(0);
  };

  const closeComputeDialog = () => {
    setShowComputeDialog(false);
    setComputeDialogSegmentId(null);
    setComputeLocation(null);
    setComputeProgress(0);
  };

  const executeCompute = async (location: "frontend" | "background") => {
    const targetId = computeDialogSegmentId;
    if (!targetId) return;

    const segmentName =
      segments.find((s) => s.id === targetId)?.name || "Segment";

    // Now actually mark the row as computing
    setComputingSegmentId(targetId);
    setComputeLocation(location);

    // If background, close dialog immediately and run in background
    if (location === "background") {
      setShowComputeDialog(false);
      setComputeDialogSegmentId(null);
      showInfo("Computing", `"${segmentName}" is computing in the background.`);
    }

    try {
      const response = await segmentService.refreshSegment(Number(targetId), {
        force: true,
      });
      const data = (response as any)?.data || {};
      const total = data.total ?? 0;
      // Update just this one row instead of reloading the whole table
      setSegments((prev) =>
        prev.map((s) =>
          s.id === targetId
            ? {
                ...s,
                size_estimate: total,
                last_computed_at: new Date().toISOString(),
              }
            : s,
        ),
      );
      success(
        "Segment computed",
        `"${segmentName}" — ${total} customers found.`,
      );
    } catch (err: unknown) {
      const message = (err as Error).message || "Failed to compute segment";
      showError("Compute failed", extractBackendError(err, "Compute failed. Please try again."));
    } finally {
      setComputingSegmentId(null);
      setComputeLocation(null);
      setComputeProgress(0);
      setShowComputeDialog(false);
      setComputeDialogSegmentId(null);
    }
  };

  // Bulk selection handlers
  const toggleSegmentSelection = (segmentId: number) => {
    setSelectedSegmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(segmentId)) {
        next.delete(segmentId);
      } else {
        next.add(segmentId);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = segments.map((s) => s.id);
    if (visibleIds.length === 0) return;

    setSelectedSegmentIds((prev) => {
      const next = new Set(prev);
      const everyVisibleSelected = visibleIds.every((id) => next.has(id));
      if (everyVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleBulkRefresh = async () => {
    if (selectedSegmentIds.size === 0) return;

    const segmentIdsArray = Array.from(selectedSegmentIds);

    // Validate: bulk refresh supports 1-50 segments
    if (segmentIdsArray.length > 50) {
      showError(
        "Too many segments",
        "Bulk refresh supports a maximum of 50 segments. Please select fewer segments.",
      );
      return;
    }

    try {
      await segmentService.batchRefreshSegments({
        segmentIds: segmentIdsArray,
      });

      // Update segments to reflect refresh (optimistic UI)
      setSegments((prev) =>
        prev.map((s) =>
          segmentIdsArray.includes(s.id)
            ? { ...s, last_refresh: new Date().toISOString() }
            : s,
        ),
      );

      success(
        "Segments refreshed",
        `${segmentIdsArray.length} segment(s) have been refreshed successfully`,
      );

      // Clear selection
      setSelectedSegmentIds(new Set());
      setIsSelectionMode(false);
    } catch (err: unknown) {
      showError(
        "Bulk refresh failed",
        (err as Error).message || "Failed to refresh segments",
      );
    }
  };

  // Phase 4 - Batch Compute
  const handleBatchCompute = async () => {
    if (selectedSegmentIds.size < 2) return;

    const segmentIdsArray = Array.from(selectedSegmentIds);
    setIsBatchComputing(true);
    try {
      await segmentService.batchCompute({
        segment_ids: segmentIdsArray,
      });

      success(
        "Batch compute started",
        `Computation started for ${segmentIdsArray.length} segment(s)`,
      );

      // Clear selection (no need to reload - compute happens in background)
      setSelectedSegmentIds(new Set());
      setIsSelectionMode(false);
    } catch (err: unknown) {
      showError(
        "Batch compute failed",
        (err as Error).message || "Failed to compute segments",
      );
    } finally {
      setIsBatchComputing(false);
    }
  };

  // Phase 4 - Overlap Comparison
  const handleCompareOverlap = async () => {
    if (selectedSegmentIds.size !== 2) return;

    const [id1, id2] = Array.from(selectedSegmentIds);
    const seg1 = segments.find((s) => s.id === id1);
    const seg2 = segments.find((s) => s.id === id2);

    if (!seg1 || !seg2) {
      showError("Error", "Could not find selected segments");
      return;
    }

    setIsCalculatingOverlap(true);
    try {
      const response = await segmentService.getSegmentOverlap(id1, id2);
      setOverlapData(response.data || { overlap_percentage: 0 });
      setShowOverlapModal(true);
      success("Overlap calculated", "Comparison result is ready");
    } catch (err: unknown) {
      showError(
        "Comparison failed",
        (err as Error).message || "Failed to calculate overlap",
      );
    } finally {
      setIsCalculatingOverlap(false);
    }
  };

  const handleExportSegment = async (segment: Segment) => {
    setShowActionMenu(null);
    showInfo(
      "Export unavailable",
      "Cannot access this functionality right now.",
    );
    return;

    setShowActionMenu(null);
    try {
      const segmentId = segment.id;
      const blob = await segmentService.exportSegment(segmentId, {
        format: "json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${segment.name
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_segment.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success("Export successful", `Segment data has been exported as JSON`);
    } catch (err: unknown) {
      showError(
        "Export failed",
        (err as Error).message || "Failed to export segment",
      );
    }
  };

  // COMMENTED OUT: Activate/Deactivate functionality temporarily disabled
  // const handleToggleStatus = async (segment: Segment) => {
  //   try {
  //     const segmentId = segment.id;
  //     if (segment.is_active) {
  //       await segmentService.deactivateSegment(segmentId);
  //       success(
  //         "Segment Deactivated",
  //         `"${segment.name}" has been deactivated successfully.`
  //       );
  //     } else {
  //       await segmentService.activateSegment(segmentId);
  //       success(
  //         "Segment Activated",
  //         `"${segment.name}" has been activated successfully.`
  //       );
  //     }
  //     await loadSegments();
  //   } catch (err: unknown) {
  //     console.error("Failed to update segment status:", err);
  //     showError("Failed to update segment status", "Please try again later.");
  //   }
  // };

  // Get all unique tags from all segments (not just filtered ones)
  const allTags = Array.from(
    new Set(allSegments?.flatMap((s) => s.tags || []) || []),
  );

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, typeFilter, visibilityFilter, selectedTags]);

  const visibleIds = useMemo(
    () => segments.map((segment) => segment.id),
    [segments],
  );

  // Define table columns
  const segmentColumns: TableColumn<Segment>[] = useMemo(
    () => [
      {
        id: "name",
        label: "Segment",
        visible: true,
        sortable: true,
        filterConfig: { type: 'text' },
        render: (value, segment) => (
          <div>
            <div className={`font-semibold text-sm ${tw.textPrimary} truncate`} title={segment.name}>
              {segment.name}
            </div>
          </div>
        ),
      },
      {
        id: "type",
        label: "Type",
        visible: true,
        sortable: true,
        filterConfig: {
          type: 'select',
          options: segmentTypes.map(t => t.name.toLowerCase())
        },
        render: (value) => (
          <span className="text-sm text-black">
            {value ? value.charAt(0).toUpperCase() + value.slice(1) : "-"}
          </span>
        ),
      },
      {
        id: "last_computed_at",
        label: "Last Computed",
        visible: true,
        filterConfig: { type: 'date' },
        render: (value) => (
          <span className="text-sm text-black">
            {value ? <DateFormatter date={new Date(value as string)} useUserTimezone /> : "—"}
          </span>
        ),
      },
      {
        id: "size_estimate",
        label: "Target",
        visible: true,
        filterConfig: { type: 'number' },
        render: (value, segment) => (
          <>
            {computingSegmentId === segment.id ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 border-2 border-gray-300 rounded-full animate-spin"
                  style={{ borderTopColor: color.primary.accent }}
                />
                <span className="text-xs text-gray-500">Computing...</span>
              </div>
            ) : (
              <span className={`text-sm ${tw.textPrimary}`}>
                {getMockCustomerCount(segment).toLocaleString()}
              </span>
            )}
          </>
        ),
      },
      {
        id: "visibility",
        label: "Visibility",
        visible: true,
        filterConfig: {
          type: 'select',
          options: ['public', 'private']
        },
        render: (value) => (
          <span
            className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
              value === "public"
                ? `bg-[${color.status.success}]/10 text-[${color.status.success}]`
                : `bg-[${color.status.info}]/10 text-[${color.status.info}]`
            }`}
          >
            {value === "public" ? "Public" : "Private"}
          </span>
        ),
      },
      {
        id: "created_at",
        label: "Created",
        visible: true,
        filterConfig: { type: 'date' },
        render: (value) => (
          <span className="text-sm text-black">
            <DateFormatter
              date={value}
              useLocale
              year="numeric"
              month="short"
              day="numeric"
            />
          </span>
        ),
      },
      {
        id: "actions",
        label: "Actions",
        visible: true,
        sortable: false,
      isActionColumn: true,
        render: (value, segment) => (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => handleViewSegment(segment.id)}
              className={`group p-0 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.accent}]/10 transition-all duration-300`}
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEditSegment(segment);
              }}
              className={`group p-0 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.accent}]/10 transition-all duration-300`}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <div
              className="relative"
              ref={(el) => {
                actionMenuRefs.current[String(segment.id)] = el;
              }}
            >
              <button
                onClick={(e) => handleActionMenuToggle(segment.id, e)}
                className={`group p-0 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.accent}]/10 transition-all duration-300`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ),
      },
    ],
    [computingSegmentId, color, tw, segmentTypes, allTags],
  );

  const {
    columns: segmentTableColumns,
    toggleColumn: toggleSegmentColumn,
    reorderColumns: reorderSegmentColumns,
    resetToDefaults: resetSegmentDefaults,
  } = useTable({
    tableId: "segment-management-table",
    defaultColumns: segmentColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedSegmentIds.has(id));

  const someVisibleSelected = visibleIds.some((id) =>
    selectedSegmentIds.has(id),
  );

  const hasSelection = selectedSegmentIds.size > 0;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  // Calculate statistics - use analytics data if available, otherwise fallback to client-side calculation
  const stats = {
    totalSegments:
      analyticsData?.healthSummary?.total_segments ?? allSegments.length,
    activeSegments:
      analyticsData?.healthSummary?.active_segments ??
      allSegments.filter((s) => s.is_active).length,
    totalCustomers: (() => {
      // Try to get total subscribers from generalStats
      if (analyticsData?.generalStats) {
        const stats = analyticsData.generalStats;
        if (typeof stats.total_subscribers === "number") {
          return stats.total_subscribers;
        }
        if (typeof stats.total_subscribers === "string") {
          return parseInt(stats.total_subscribers, 10) || 0;
        }
        if (typeof stats.total_customers === "number") {
          return stats.total_customers;
        }
        if (typeof stats.total_customers === "string") {
          return parseInt(stats.total_customers, 10) || 0;
        }
        if (typeof stats.total_members === "number") {
          return stats.total_members;
        }
        if (typeof stats.total_members === "string") {
          return parseInt(stats.total_members, 10) || 0;
        }
      }
      // Fallback: sum up size_estimate from all segments
      // Only count segments that have a valid size_estimate (not null/undefined)
      return allSegments.reduce((sum, s) => {
        const count = s.size_estimate;
        // Only add if size_estimate is a valid number (not null, undefined, or 0)
        if (typeof count === "number" && count > 0) {
          return sum + count;
        }
        return sum;
      }, 0);
    })(),
    // Build type counts dynamically from segment types
    typeCounts: (() => {
      const counts: Record<string, number> = {};
      segmentTypes.forEach((type) => {
        const typeName = type.name.toLowerCase();
        counts[typeName] = allSegments.filter(
          (s) => s.type?.toLowerCase() === typeName
        ).length;
      });
      return counts;
    })(),
    healthScore: analyticsData?.healthSummary?.health_score ?? null,
    staleSegmentsCount: analyticsData?.staleSegments?.length ?? 0,
    largestSegments: analyticsData?.largestSegments || [],
  };

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className={``}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
              {t.pages.segments}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              {t.pages.segmentsDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/dashboard/segments/analytics")}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
              style={{
                backgroundColor: "transparent",
                color: "var(--c-text-primary)",
                border: "1px solid var(--c-text-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
            <PermissionGate permission="segments.select">
              <button
                onClick={() => {
                  if (!isSelectionMode) {
                    // Entering selection mode - select all visible segments
                    setIsSelectionMode(true);
                    setSelectedSegmentIds(new Set(visibleIds));
                  } else {
                    // Exiting selection mode - clear selection
                    setIsSelectionMode(false);
                    setSelectedSegmentIds(new Set());
                  }
                }}
                className="inline-flex items-center gap-2 transition-colors w-auto"
                style={getButtonStyles(button.bordered)}
              >
                {isSelectionMode ? (
                  <CheckSquare size={16} />
                ) : (
                  <Square size={16} />
                )}
                {isSelectionMode ? "Exit Selection" : "Select"}
              </button>
            </PermissionGate>
            <PermissionGate permission="segments.create">
              <button
                onClick={handleCreateSegment}
                className={`inline-flex items-center gap-2 px-6 py-2 text-sm font-medium ${tw.rounded} transition-colors`}
                style={{
                  backgroundColor: color.primary.action,
                  color: "white",
                }}
              >
                + Create
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Segments */}
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Layers
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className={`p-0 icon-edit ${tw.rounded} text-sm font-medium `}>
                Total Segments
              </p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {isLoadingAnalytics ? (
                <span className="text-gray-400">...</span>
              ) : (
                stats.totalSegments.toLocaleString()
              )}
            </p>
            {analyticsData?.healthSummary?.last_7d_created &&
              analyticsData.healthSummary.last_7d_created > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  +{analyticsData.healthSummary.last_7d_created} this week
                </p>
              )}
          </div>

          {/* Active Segments */}
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Activity
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">
                Active Segments
              </p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {isLoadingAnalytics ? (
                <span className="text-gray-400">...</span>
              ) : (
                stats.activeSegments.toLocaleString()
              )}
            </p>
          </div>

          {/* Stale Segments */}
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Activity
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">
                Stale Segments
              </p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {isLoadingAnalytics ? (
                <span className="text-gray-400">...</span>
              ) : (
                (() => {
                  const staleCount =
                    analyticsData?.healthSummary?.stale_segments;
                  if (!staleCount && staleCount !== 0) {
                    return "0";
                  }
                  const numValue =
                    typeof staleCount === "number"
                      ? staleCount
                      : parseInt(String(staleCount), 10);
                  return String(numValue);
                })()
              )}
            </p>
            <p className="mt-1 text-sm text-gray-500">need refresh</p>
          </div>

          {/* Top Segment */}
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">Top Segment</p>
            </div>
            <p
              className="mt-2 text-lg font-bold text-gray-900 truncate"
              title={stats.largestSegments[0]?.name || "No segments available"}
            >
              {isLoadingAnalytics ? (
                <span className="text-gray-400">...</span>
              ) : stats.largestSegments.length > 0 ? (
                stats.largestSegments[0]?.name || "No name"
              ) : (
                "No segments"
              )}
            </p>
            {stats.largestSegments.length > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {(
                  stats.largestSegments[0]?.size_estimate || 0
                ).toLocaleString()}{" "}
                members
              </p>
            )}
          </div>
        </div>

      {/* Search and Filters */}
      <div className={``}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search segments..."
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className={`flex items-center gap-2 ${tw.rounded} transition-colors font-medium`}
              style={{
                backgroundColor: button.secondaryAction.background,
                color: button.secondaryAction.color,
                border: button.secondaryAction.border,
                padding: `${button.secondaryAction.paddingY} ${button.secondaryAction.paddingX}`,
                borderRadius: button.secondaryAction.borderRadius,
                fontSize: button.secondaryAction.fontSize,
              }}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>

            <button
              onClick={() => {
                // Export filtered segments as CSV
                const csvContent = [
                  ['Name', 'Type', 'Target', 'Visibility', 'Created At'].join(','),
                  ...segments.map((segment) =>
                    [
                      segment.name,
                      segment.type,
                      getMockCustomerCount(segment),
                      segment.visibility,
                      new Date(segment.created_at).toLocaleDateString(),
                    ].join(',')
                  ),
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `segments-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors`}
              style={{
                backgroundColor: color.primary.action,
                color: "white",
              }}
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
            <span className={`text-sm font-medium ${tw.textPrimary} py-2`}>
              Active filters:
            </span>
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center px-3 py-1.5 text-sm  rounded-full`}
                style={{ backgroundColor: color.primary.accent }}
              >
                {tag}
                <button
                  onClick={() =>
                    setSelectedTags((prev) => prev.filter((t) => t !== tag))
                  }
                  className="ml-2 "
                >
                  <X className={`w-3 h-3 `} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {isSelectionMode && selectedSegmentIds.size > 0 && (
        <div
          className={`flex items-center justify-between ${tw.rounded} border border-gray-200 bg-white px-4 py-3`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedSegmentIds.size} segment(s) selected
            </span>
            <button
              onClick={() => setSelectedSegmentIds(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBulkRefresh}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              <RefreshCw size={14} />
              Refresh All
            </button>

            {/* Batch Compute Button - Disabled
            {selectedSegmentIds.size >= 2 && (
              <button
                onClick={handleBatchCompute}
                disabled={isBatchComputing}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: color.primary.accent }}
              >
                <BarChart3 size={14} />
                {isBatchComputing ? "Computing..." : "Batch Compute"}
              </button>
            )}
            */}

            {selectedSegmentIds.size === 2 && (
              <button
                onClick={handleCompareOverlap}
                disabled={isCalculatingOverlap}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: "#6B7280" }}
              >
                <Activity size={14} />
                {isCalculatingOverlap ? "Comparing..." : "Compare"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={`${tw.rounded}`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner
              variant="modern"
              size="xl"
              color="primary"
              className="mb-4"
            />
            <p className={`${tw.textMuted} font-medium text-sm`}>
              Loading segments...
            </p>
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState
              title="Unable to load segments"
              message="Please check your connection or try again."
              onRetry={loadSegments}
            />
          </div>
        ) : segments.length === 0 || totalCount === 0 ? (
          <div className="p-8 md:p-16 text-center">
            <div
              className={`bg-gradient-to-br from-[${color.primary.accent}]/5 to-[${color.primary.accent}]/10 ${tw.rounded} p-6 md:p-12`}
            >
              <h3 className={`${tw.cardHeading} ${tw.textPrimary} mb-1`}>
                No segments found
              </h3>
              <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto">
                {totalCount === 0 && segments.length > 0
                  ? "No results match your filters."
                  : searchTerm || selectedTags.length > 0
                    ? "No segments match your search criteria."
                    : "No segments have been created yet."}
              </p>
              <div className="flex gap-3 justify-center">
                {totalCount === 0 && segments.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedTags([]);
                      setClearFiltersKey(clearFiltersKey + 1);
                    }}
                    className={`${tw.button} inline-flex items-center px-6 py-3`}
                  >
                    Clear Filters
                  </button>
                )}
                {!searchTerm && selectedTags.length === 0 && segments.length === 0 && (
                  <button
                    onClick={handleCreateSegment}
                    className={`${tw.button} inline-flex items-center px-6 py-3`}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Segment
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Table Component */}
            <Table<Segment>
              columns={segmentTableColumns}
              data={(() => {
                if (sortConfigs.length === 0) {
                  return [...segments].sort((a, b) => {
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return dateB - dateA;
                  });
                }
                const sortConfig = sortConfigs[0];
                const sorted = [...segments].sort((a, b) => {
                  const aValue = a[sortConfig.columnId as keyof Segment];
                  const bValue = b[sortConfig.columnId as keyof Segment];
                  if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
                  if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
                  return 0;
                });
                return sorted;
              })()}
              totalItems={segments.length}
              currentPage={page}
              pageSize={pageSize}
              isLoading={isLoading}
              enableRowSelection={isSelectionMode}
              selectedRows={Array.from(selectedSegmentIds)}
              onRowSelectChange={(selected) => {
                setSelectedSegmentIds(new Set(selected as number[]));
              }}
              getRowId={(segment) => segment.id}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              onFilteredCountChange={handleFilteredCountChange}
              clearFiltersKey={clearFiltersKey}
              expandedRowId={expandedRowId}
              onExpandChange={setExpandedRowId}
              expandedContent={(row) => {
                const segment = segments.find(s => s.id === row.id);
                return segment ? (
                  <SegmentDetailsExpandedRow segment={segment} colSpan={segmentTableColumns.filter((c) => c.visible).length} />
                ) : null;
              }}
              onHideColumn={toggleSegmentColumn}
              onManageColumnsClick={() => setShowSegmentColumnPicker(true)}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {/* Render dropdown menus via portal outside the table */}
            {segments.map((segment) => {
              if (showActionMenu === segment.id && dropdownPosition) {
                return createPortal(
                  <div
                    ref={(el) => {
                      dropdownMenuRefs.current[segment.id] = el;
                    }}
                    className={`fixed bg-white border border-gray-200 ${tw.rounded} shadow-xl py-3 w-64`}
                    style={{
                      zIndex: zIndex.popover,
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      maxHeight: `${dropdownPosition.maxHeight}px`,
                      overflowY: "auto",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {/* TODO: Enable when duplicate endpoint is implemented on backend */}
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateSegment(segment);
                        setShowActionMenu(null);
                      }}
                      disabled={duplicatingSegment === segment.id}
                      className="w-full flex items-center px-4 py-3 text-sm text-black hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {duplicatingSegment === segment.id ? (
                        <>
                          <div className="w-4 h-4 mr-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                          Duplicating...
                        </>
                      ) : (
                        <>
                          <Copy
                            className="w-4 h-4 mr-4"
                            style={{ color: color.primary.action }}
                          />
                          Duplicate Segment
                        </>
                      )}
                    </button> */}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSegmentToCommunicate(segment);
                        setIsCommunicateModalOpen(true);
                        setShowActionMenu(null);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm text-black hover:bg-gray-50 transition-colors"
                    >
                      <Send className="w-4 h-4 mr-4" />
                      Send Communication
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComputeSegment(segment);
                        setShowActionMenu(null);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm text-black hover:bg-gray-50 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 mr-4" />
                      Compute Segment
                    </button>

                    {/* TODO: Enable export after confirming implementation approach */}
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportSegment(segment);
                        setShowActionMenu(null);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm text-black hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-4" />
                      Export Segment
                    </button> */}

                    <PermissionGate permission="segments.delete">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSegment(segment);
                          setShowActionMenu(null);
                        }}
                        className="w-full flex items-center px-4 py-3 text-sm text-black hover:bg-gray-50 transition-colors"
                      >
                        <Trash2
                          className="w-4 h-4 mr-4"
                          style={{ color: color.status.danger }}
                        />
                        Delete Segment
                      </button>
                    </PermissionGate>
                  </div>,
                  document.body,
                );
              }
              // Clean up ref when dropdown is closed
              if (dropdownMenuRefs.current[segment.id]) {
                dropdownMenuRefs.current[segment.id] = null;
              }
              return null;
            })}

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className={`bg-white border ${tw.borderDefault} ${tw.rounded} p-4 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-3">
                    {isSelectionMode && (
                      <div className="mr-3 pt-1">
                        <Checkbox
                          checked={selectedSegmentIds.has(segment.id)}
                          onChange={(event) => {
                            event.stopPropagation();
                            toggleSegmentSelection(segment.id);
                          }}
                          aria-label={`Select ${segment.name}`}
                          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div
                        className={`${tw.tableFirstColumn} text-gray-900 mb-1`}
                      >
                        {segment.name}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        {segment.description}
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center space-x-1">
                      {/* COMMENTED OUT: Activate/Deactivate button temporarily disabled */}
                      {/* <button
                        onClick={() => handleToggleStatus(segment)}
                        className={`p-2 ${tw.rounded} text-gray-500 hover:bg-gray-100`}
                        title={segment.is_active ? "Deactivate" : "Activate"}
                      >
                        {segment.is_active ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button> */}
                      <button
                        onClick={() => handleViewSegment(segment.id)}
                        className={`p-0 icon-edit ${tw.rounded} text-gray-500 hover:bg-gray-100`}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditSegment(segment.id)}
                        className={`p-2 ${tw.rounded} text-gray-500 hover:bg-gray-100`}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <div
                        className="relative"
                        ref={(el) => {
                          actionMenuRefs.current[`mobile-${segment.id}`] = el;
                        }}
                      >
                        <button
                          onClick={(e) => handleActionMenuToggle(segment.id, e)}
                          className={`p-2 ${tw.rounded} text-gray-500 hover:bg-gray-100`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        segment.type === "dynamic"
                          ? "bg-purple-100 text-purple-700"
                          : segment.type === "static"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {segment.type
                        ? segment.type.charAt(0).toUpperCase() +
                          segment.type.slice(1)
                        : "N/A"}
                    </span>
                    {segment.tags?.map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center px-2 py-1 bg-green-100 text-black text-xs font-medium rounded-full`}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        segment.visibility === "public"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {segment.visibility === "public" ? "Public" : "Private"}
                    </span>
                  </div>

                  <div
                    className={`flex justify-between items-center text-sm ${tw.textSecondary}`}
                  >
                    <div className="flex items-center">
                      {/* Icon removed */}
                      {(segment.size_estimate || 0).toLocaleString()} customers
                    </div>
                    <div>
                      Created:{" "}
                      <DateFormatter
                        date={segment.created_at}
                        useLocale
                        year="numeric"
                        month="short"
                        day="numeric"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !error && segments.length > 0 && totalCount > 0 && (
        <Pagination
          currentPage={page}
          pageSize={pageSize}
          totalItems={totalCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Segment Modal */}
      <SegmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSegment(null);
        }}
        onSave={handleSaveSegment}
        segment={selectedSegment}
      />

      {/* Advanced Filters Side Modal */}
      {(showAdvancedFilters || isClosingModal) &&
        createPortal(
          <div
            className={`fixed inset-0 overflow-hidden ${
              isClosingModal
                ? "animate-out fade-out duration-300"
                : "animate-in fade-in duration-300"
            }`}
            style={{ zIndex: zIndex.overlay }}
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={handleCloseModal}
            ></div>
            <div
              className={`absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
                isClosingModal ? "translate-x-full" : "translate-x-0"
              }`}
            >
              <div className={`p-6 border-b ${tw.borderDefault}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Filter Segments
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className={`p-2 ${tw.textMuted} hover:bg-gray-50 ${tw.rounded} transition-colors`}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                {/* Filter Tabs */}
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-3`}
                  >
                    Quick Filters
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "all", label: "All" },
                      { value: "active", label: "Active" },
                      { value: "empty", label: "Empty" },
                      { value: "needs-refresh", label: "Needs Refresh" },
                      { value: "parents", label: "Parents" },
                      { value: "most-used", label: "Most Used" },
                    ].map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() =>
                          setFilterTab(
                            tab.value as
                              | "all"
                              | "active"
                              | "empty"
                              | "needs-refresh"
                              | "parents"
                              | "most-used",
                          )
                        }
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          filterTab === tab.value
                            ? `text-white`
                            : `border border-gray-200 text-gray-700 hover:bg-gray-50`
                        }`}
                        style={
                          filterTab === tab.value
                            ? { backgroundColor: button.action.background }
                            : {}
                        }
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility Filter */}
                <div>
                  <HeadlessSelect
                    label="Visibility"
                    options={[
                      { value: "all", label: "All Visibility" },
                      { value: "public", label: "Public" },
                      { value: "private", label: "Private" },
                    ]}
                    value={visibilityFilter}
                    onChange={(value) =>
                      setVisibilityFilter(
                        (value as "all" | "public" | "private") || "all",
                      )
                    }
                    placeholder="Select visibility"
                  />
                </div>

                {/* Type Filter */}
                <div>
                  <HeadlessSelect
                    label="Segment Type"
                    options={[
                      { value: "all", label: "All Types" },
                      ...segmentTypes.map((type) => ({
                        value: type.name.toLowerCase(),
                        label: type.name,
                      })),
                    ]}
                    value={typeFilter}
                    onChange={(value) => setTypeFilter(value as string)}
                    placeholder="Select segment type"
                  />
                </div>

                {/* Tags Filter */}
                {allTags.length > 0 && (
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-3`}
                    >
                      Tags
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {allTags.map((tag) => (
                        <label key={tag} className="flex items-center">
                          <Checkbox
                            checked={selectedTags.includes(tag)}
                            onChange={(e) => {
                              e.stopPropagation(); // Prevent event bubbling
                              if (e.target.checked) {
                                setSelectedTags((prev) => [...prev, tag]);
                              } else {
                                setSelectedTags((prev) =>
                                  prev.filter((t) => t !== tag),
                                );
                              }
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent event bubbling
                            className={`mr-3 text-[${color.primary.action}] focus:ring-[${color.primary.action}]`}
                          />
                          <span className={`text-sm ${tw.textSecondary}`}>
                            {tag}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setFilterTab("all");
                      setTypeFilter("all");
                      setVisibilityFilter("all");
                      setSelectedTags([]);
                    }}
                    className={`flex-1 px-4 py-2 text-sm border border-gray-300 ${tw.textSecondary} ${tw.rounded} hover:bg-gray-50 transition-colors`}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => {
                      handleSearch();
                      handleCloseModal();
                    }}
                    className={`${button.action} flex-1 px-4 py-2 text-sm`}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Overlap Comparison Modal */}
      {showOverlapModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div
              className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-md`}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Segment Overlap Analysis
                </h2>
                <button
                  onClick={() => setShowOverlapModal(false)}
                  className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600 mb-2">
                      {overlapData?.overlap_percentage?.toFixed(1)}%
                    </div>
                    <p className="text-gray-600">
                      Members in common between selected segments
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Segment 1
                      </div>
                      <div className="text-gray-600 text-xs">
                        ID: {overlapData?.segment1_id}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Segment 2
                      </div>
                      <div className="text-gray-600 text-xs">
                        ID: {overlapData?.segment2_id}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      This percentage indicates how many members from Segment 1
                      also belong to Segment 2.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowOverlapModal(false)}
                    className={`px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 ${tw.rounded} transition-colors text-sm font-medium`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Compute Segment Dialog */}
      {showComputeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
            {/* Close Button */}
            <button
              onClick={closeComputeDialog}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Compute Segment
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              How would you like to track the computation progress?
            </p>

            {computeLocation ? (
              <div className="space-y-4">
                {/* Computing in progress */}
                <div className="flex items-center gap-3 py-4">
                  <div
                    className="w-5 h-5 border-2 border-gray-300 rounded-full animate-spin"
                    style={{ borderTopColor: color.primary.accent }}
                  />
                  <span className="text-sm text-gray-600">
                    Computing segment size...
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => executeCompute("frontend")}
                  className={`flex-1 px-4 py-2.5 ${tw.button} text-white rounded-lg font-medium transition-colors`}
                >
                  Compute
                </button>
                <button
                  onClick={() => executeCompute("background")}
                  className={`flex-1 px-4 py-2.5 ${tw.borderedButton}`}
                  style={{
                    borderColor: color.primary.action,
                    color: color.primary.action,
                  }}
                >
                  Compute & Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Communication Modal */}
      {isCommunicateModalOpen && segmentToCommunicate && (
        <CreateCommunicationModal
          isOpen={isCommunicateModalOpen}
          onClose={() => {
            setIsCommunicateModalOpen(false);
            setSegmentToCommunicate(null);
          }}
          segment={segmentToCommunicate}
          onSuccess={(result) => {
            showToast(
              "Success",
              `Communication sent successfully! ${result.total_messages_sent} messages sent.`,
            );
            setSegmentToCommunicate(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => {
          closeDeleteConfirm();
          setSegmentToDelete(null);
        }}
        onConfirm={confirmDeleteSegment}
        title="Delete Segment"
        description="Are you sure you want to delete this segment? This action cannot be undone."
        itemName={deleteConfirm.itemName}
        isLoading={isDeleting}
        confirmText="Delete Segment"
        cancelText="Cancel"
      />

      <ColumnPickerModal
        isOpen={showSegmentColumnPicker}
        columns={segmentTableColumns.map((col) => ({ id: col.id, label: col.label, visible: col.visible }))}
        onClose={() => setShowSegmentColumnPicker(false)}
        onToggleColumn={toggleSegmentColumn}
        onReorderColumns={(reorderedCols) => {
          const updatedColumns = segmentTableColumns.map((col) => {
            const reordered = reorderedCols.find((c) => c.id === col.id);
            return reordered ? { ...col, visible: reordered.visible } : col;
          });
          reorderSegmentColumns(updatedColumns);
        }}
        onResetToDefaults={resetSegmentDefaults}
      />
    </div>
  );
}
