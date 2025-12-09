import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../../../contexts/ToastContext";
import {
  Plus,
  Filter,
  Search,
  // Calendar,
  MoreHorizontal,
  Eye,
  Play,
  Pause,
  Edit,
  Archive,
  Trash2,
  CheckCircle,
  Send,
  ChevronLeft,
  ChevronRight,
  Target,
  Clock,
  AlertCircle,
  History,
  Copy,
  BarChart3,
} from "lucide-react";
import { color, tw, button } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useLanguage } from "../../../contexts/LanguageContext";
import { campaignService } from "../services/campaignService";
import { campaignSegmentOfferService } from "../services/campaignSegmentOfferService";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import ExecuteCampaignModal from "../components/ExecuteCampaignModal";
import ApproveCampaignModal from "../components/ApproveCampaignModal";
import RejectCampaignModal from "../components/RejectCampaignModal";
import {
  CampaignApprovalStatus,
  CampaignCollection,
  CampaignSegmentDetail,
  CampaignStatsSummary,
  CampaignStatus,
  CampaignSuperSearchQuery,
  GetCampaignsResponse,
} from "../types/campaign";

type CampaignListResponse = CampaignCollection | GetCampaignsResponse;

interface CampaignDisplay {
  id: number;
  name: string;
  description?: string;
  status: string;
  type?: string;
  category?: string;
  category_id?: number;
  segment?: string;
  offer?: string;
  objective?: string;
  startDate?: string;
  endDate?: string;
  approval_status?: string;
  code?: string;
  created_at?: string;
  offer_count?: number;
  segment_count?: number;
  performance?: {
    sent: number;
    delivered: number;
    opened?: number;
    converted: number;
    revenue: number;
  };
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: "all",
    approvalStatus: "all",
    startDateFrom: "",
    startDateTo: "",
    sortBy: "created_at",
    sortDirection: "DESC" as "ASC" | "DESC",
  });
  const filterRef = useRef<HTMLDivElement>(null);
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [campaignToExecute, setCampaignToExecute] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [campaignToApprove, setCampaignToApprove] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [campaignToReject, setCampaignToReject] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const actionMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const dropdownMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
    width?: number;
  } | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignDisplay[]>([]);
  const [allCampaignsUnfiltered, setAllCampaignsUnfiltered] = useState<
    CampaignDisplay[]
  >([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string; description?: string }>
  >([]);
  const categoryMap = useMemo(() => {
    const map: Record<number, string> = {};
    categories.forEach((category) => {
      map[category.id] = category.name;
    });
    return map;
  }, [categories]);
  const [campaignStats, setCampaignStats] = useState<{
    total: number;
    active: number;
    draft: number;
    pendingApproval: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Use click outside hook for filter modal
  useClickOutside(filterRef, () => setShowAdvancedFilters(false), {
    enabled: showAdvancedFilters,
  });

  const handleActionMenuToggle = (
    campaignId: number,
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (showActionMenu === campaignId) {
      setShowActionMenu(null);
      setDropdownPosition(null);
    } else {
      setShowActionMenu(campaignId);

      // Calculate position from the clicked button
      if (event && event.currentTarget) {
        const button = event.currentTarget;
        const buttonRect = button.getBoundingClientRect();

        // Responsive dropdown width based on screen size
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Determine device type for responsive sizing
        const isVerySmallPhone = viewportWidth < 480; // iPhone SE, small Android
        const isSmallPhone = viewportWidth >= 480 && viewportWidth < 640; // Standard phones
        const isTablet = viewportWidth >= 640 && viewportWidth < 1024; // Tablets
        const isMobile = viewportWidth < 640; // All mobile devices
        const isLargeScreen = viewportWidth >= 1920; // Large laptops/desktops

        // Calculate responsive dropdown width
        let dropdownWidth: number;
        if (isVerySmallPhone) {
          // Very small phones: use 90% of screen width with padding
          dropdownWidth = Math.min(280, viewportWidth - 32);
        } else if (isSmallPhone) {
          // Small phones: use 85% of screen width
          dropdownWidth = Math.min(300, viewportWidth - 24);
        } else if (isTablet) {
          // Tablets: standard width but can be slightly smaller
          dropdownWidth = Math.min(256, viewportWidth - 32);
        } else {
          // Desktop and larger: standard width
          dropdownWidth = 256; // w-64 = 256px
        }

        const spacing = 4;
        const padding = 8;

        // Calculate available space below and above the button
        const spaceBelow = viewportHeight - buttonRect.bottom - padding;
        const spaceAbove = buttonRect.top - padding;

        // Responsive min/max heights based on screen size
        // Very small phones need smaller heights, large screens can have more
        let minDropdownHeight: number;
        let maxDropdownHeight: number;

        if (isVerySmallPhone) {
          // Very small phones: compact sizing
          minDropdownHeight = 80;
          maxDropdownHeight = Math.min(250, viewportHeight * 0.5); // Max 50% of viewport
        } else if (isSmallPhone) {
          // Small phones: slightly larger
          minDropdownHeight = 100;
          maxDropdownHeight = Math.min(300, viewportHeight * 0.55); // Max 55% of viewport
        } else if (isTablet) {
          // Tablets: medium sizing
          minDropdownHeight = 120;
          maxDropdownHeight = Math.min(350, viewportHeight * 0.6); // Max 60% of viewport
        } else if (isLargeScreen) {
          // Large screens: can show more content
          minDropdownHeight = 120;
          maxDropdownHeight = 450; // More space on large screens
        } else {
          // Standard desktop/laptop
          minDropdownHeight = 120;
          maxDropdownHeight = 400;
        }

        // Calculate optimal maxHeight based on available space
        // Ensure it doesn't exceed viewport and allows scrolling
        let calculatedMaxHeight: number;

        // Determine if we should position above or below
        const shouldPositionAbove =
          spaceBelow < minDropdownHeight && spaceAbove > spaceBelow;

        if (shouldPositionAbove) {
          // Position above button if there's more space above
          const availableSpace = Math.min(spaceAbove, maxDropdownHeight);
          calculatedMaxHeight = Math.max(
            availableSpace - 10,
            minDropdownHeight
          );
        } else {
          // Position below button (default)
          if (spaceBelow >= maxDropdownHeight) {
            // Plenty of space below - use max height
            calculatedMaxHeight = maxDropdownHeight;
          } else if (spaceBelow >= minDropdownHeight) {
            // Some space below - use available space, but ensure scrolling works
            calculatedMaxHeight = Math.max(spaceBelow - 10, minDropdownHeight);
          } else {
            // Very little space below - use minimum height and allow scrolling
            calculatedMaxHeight = minDropdownHeight;
          }
        }

        // Ensure maxHeight never exceeds viewport height (with safety margin)
        const maxAllowedHeight = viewportHeight - 20;
        calculatedMaxHeight = Math.min(calculatedMaxHeight, maxAllowedHeight);

        // Ensure minimum height for usability
        calculatedMaxHeight = Math.max(calculatedMaxHeight, minDropdownHeight);

        // Calculate top position (above or below button)
        const top = shouldPositionAbove
          ? buttonRect.top - calculatedMaxHeight - spacing
          : buttonRect.bottom + spacing;

        // Calculate left position (right-align with button, but adjust for mobile)
        let left = buttonRect.right - dropdownWidth;
        if (left + dropdownWidth > viewportWidth - padding) {
          left = viewportWidth - dropdownWidth - padding;
        }
        if (left < padding) {
          left = padding;
        }

        // On mobile, center align if button is near edges
        if (isMobile && left < 8) {
          left = Math.max(8, (viewportWidth - dropdownWidth) / 2);
        }

        // Ensure dropdown doesn't go off-screen on very small devices
        if (left + dropdownWidth > viewportWidth - padding) {
          left = viewportWidth - dropdownWidth - padding;
        }
        if (left < padding) {
          left = padding;
        }

        // Set position with calculated maxHeight that allows scrolling
        setDropdownPosition({
          top,
          left,
          maxHeight: calculatedMaxHeight,
          width: dropdownWidth,
        });
      }
    }
  };

  // Fetch Campaigns catalogs from API
  const fetchCategories = useCallback(async () => {
    try {
      const response = await campaignService.getCampaignCategories();
      type CategoryRecord = {
        id: number;
        name: string;
        description?: string;
      };
      const categoriesData = Array.isArray(response)
        ? response
        : (response as { data?: CategoryRecord[] })?.data ?? [];
      setCategories(
        categoriesData as Array<{
          id: number;
          name: string;
          description?: string;
        }>
      );
    } catch (error) {
      console.error("Failed to load campaign catalogs:", error);
      showToast(
        "error",
        "Failed to load Campaigns catalogs. Please try again."
      );
      setCategories([]);
    }
  }, [showToast]);

  // Fetch offer and segment counts for campaigns
  const fetchCampaignCounts = useCallback(
    async (
      campaignIds: number[]
    ): Promise<Map<number, { offers: number; segments: number }>> => {
      const countsMap = new Map<number, { offers: number; segments: number }>();

      // Fetch counts in parallel for all campaigns
      const countPromises = campaignIds.map(async (campaignId) => {
        try {
          // Fetch segments count
          const segmentsResponse = await campaignService.getCampaignSegments(
            campaignId,
            true
          );

          let segmentCount = 0;
          if (
            segmentsResponse &&
            typeof segmentsResponse === "object" &&
            "data" in segmentsResponse &&
            segmentsResponse.success
          ) {
            // Handle both nested and direct array responses
            if (Array.isArray(segmentsResponse.data)) {
              // Direct array: { data: [...] }
              segmentCount = segmentsResponse.data.length;
            } else if (
              segmentsResponse.data &&
              typeof segmentsResponse.data === "object" &&
              "data" in segmentsResponse.data &&
              Array.isArray(
                (segmentsResponse.data as { data?: CampaignSegmentDetail[] })
                  .data
              )
            ) {
              // Nested: { data: { data: [...] } }
              segmentCount = (
                segmentsResponse.data as { data: CampaignSegmentDetail[] }
              ).data.length;
            } else if (
              segmentsResponse.data &&
              typeof segmentsResponse.data === "object" &&
              "total" in segmentsResponse.data
            ) {
              // If we have a total field, use that
              segmentCount =
                typeof (segmentsResponse.data as { total?: number }).total ===
                "number"
                  ? (segmentsResponse.data as { total: number }).total
                  : 0;
            }
          }

          // Fetch offer mappings count
          const offersResponse =
            await campaignSegmentOfferService.getMappingsByCampaign(campaignId);
          const offerCount =
            offersResponse.success && offersResponse.data
              ? new Set(offersResponse.data.map((m) => m.offer_id)).size
              : 0;

          return { campaignId, offers: offerCount, segments: segmentCount };
        } catch (error) {
          console.error(
            `Failed to fetch counts for campaign ${campaignId}:`,
            error
          );
          return { campaignId, offers: 0, segments: 0 };
        }
      });

      const results = await Promise.all(countPromises);
      results.forEach(({ campaignId, offers, segments }) => {
        countsMap.set(campaignId, { offers, segments });
      });

      return countsMap;
    },
    []
  );

  // Fetch campaigns from API
  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);

      let response: CampaignListResponse;
      const LIMIT = 100; // Fetch reasonable batch size
      const currentIndex = (currentPage - 1) * pageSize;
      const chunkOffset = Math.floor(currentIndex / LIMIT) * LIMIT;
      const chunkStartIndex = currentIndex % LIMIT;

      // Check if we have any filters applied
      const hasFilters =
        (filters.categoryId && filters.categoryId !== "all") ||
        (filters.approvalStatus && filters.approvalStatus !== "all") ||
        filters.startDateFrom ||
        filters.startDateTo ||
        (selectedStatus && selectedStatus !== "all") ||
        searchQuery.trim();

      if (hasFilters) {
        // Use superSearchCampaigns when filters are applied
        const searchParams: CampaignSuperSearchQuery = {
          limit: LIMIT,
          offset: chunkOffset,
          skipCache: true,
        };

        if (searchQuery.trim()) {
          searchParams.name = searchQuery.trim();
        }

        if (selectedStatus && selectedStatus !== "all") {
          searchParams.status = selectedStatus as CampaignStatus;
        } else if (selectedStatus === "all") {
          // When "all" is selected, exclude archived campaigns from default view
          // Users can still see archived campaigns by selecting "Archived" filter
          // Note: Backend doesn't support excludeStatus, so we'll filter client-side
        }

        if (filters.approvalStatus && filters.approvalStatus !== "all") {
          searchParams.approvalStatus =
            filters.approvalStatus as CampaignApprovalStatus;
        }

        if (filters.categoryId && filters.categoryId !== "all") {
          searchParams.categoryId = parseInt(filters.categoryId);
        }

        if (filters.startDateFrom) {
          searchParams.startDateFrom = filters.startDateFrom;
        }

        if (filters.startDateTo) {
          searchParams.startDateTo = filters.startDateTo;
        }

        response = await campaignService.superSearchCampaigns(searchParams);
      } else {
        // Use regular getCampaigns when no filters applied (more efficient)
        response = await campaignService.getCampaigns({
          limit: LIMIT,
          offset: chunkOffset,
          skipCache: true,
        });
      }

      if (!("data" in response) || !response.success) {
        const errorMessage =
          "error" in response && response.error
            ? response.error
            : "Failed to retrieve campaigns";
        throw new Error(errorMessage);
      }

      // Transform response data to display format
      const campaignsData: CampaignDisplay[] = response.data.map(
        (campaign) => ({
          id: campaign.id,
          name: campaign.name,
          description: campaign.description || undefined,
          status: campaign.status,
          category_id: campaign.category_id || undefined,
          objective: campaign.objective,
          startDate: campaign.start_date || undefined,
          endDate: campaign.end_date || undefined,
          approval_status: campaign.approval_status,
          code: campaign.code,
          created_at: campaign.created_at,
          offer_count: 0, // Will be updated below
          segment_count: 0, // Will be updated below
        })
      );

      // When status is "all", exclude archived campaigns from default view
      // Users can still see archived campaigns by selecting "Archived" filter
      let campaignsToDisplay = campaignsData;
      if (selectedStatus === "all") {
        campaignsToDisplay = campaignsData.filter(
          (c) => c.status !== "archived"
        );
      }

      // Apply client-side pagination for display (we fetch 100, display 10 per page)
      const startIndex = chunkStartIndex;
      const endIndex = startIndex + pageSize;
      const paginatedCampaigns = campaignsToDisplay.slice(startIndex, endIndex);

      // Fetch counts for the displayed campaigns
      const campaignIds = paginatedCampaigns.map((c) => c.id);
      const countsMap = await fetchCampaignCounts(campaignIds);

      // Update campaigns with counts
      const campaignsWithCounts = paginatedCampaigns.map((campaign) => {
        const counts = countsMap.get(campaign.id);
        return {
          ...campaign,
          offer_count: counts?.offers ?? 0,
          segment_count: counts?.segments ?? 0,
        };
      });

      setCampaigns(campaignsWithCounts);
      setAllCampaignsUnfiltered(campaignsData);

      // Get total from pagination response
      // When filtering client-side, use the filtered count to match displayed items
      // When a specific status is selected, backend should return correct total
      const total =
        selectedStatus === "all"
          ? campaignsToDisplay.length // Use filtered count when excluding archived
          : response.pagination.total || campaignsToDisplay.length; // Use backend total if available, otherwise filtered count
      setTotalCampaigns(total);
    } catch (error) {
      console.error("Failed to load campaigns list:", error);
      showToast(
        "error",
        "Failed to load campaigns. Please try again in a moment."
      );
      setCampaigns([]);
      setTotalCampaigns(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedStatus,
    searchQuery,
    currentPage,
    pageSize,
    filters,
    showToast,
    fetchCampaignCounts,
  ]);

  // Fetch campaign stats
  const fetchCampaignStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await campaignService.getCampaignStats(true);

      if (response.success && response.data) {
        const data = response.data as CampaignStatsSummary;
        const overview = data.overview ?? {};
        const statusBreakdown = data.status_breakdown ?? {};
        const approvalBreakdown = data.approval_status_breakdown ?? {};
        const activityStatus = data.activity_status ?? {};

        const total =
          Number(overview.total_campaigns) || Number(data.total_campaigns) || 0;

        const active =
          Number(statusBreakdown.active) ||
          Number(activityStatus.is_active_flag_true) ||
          Number(activityStatus.currently_running) ||
          0;

        const draft = Number(statusBreakdown.draft) || 0;

        // Only use status_breakdown.pending_approval (campaigns with status="pending_approval")
        // Don't use approval_status_breakdown.pending as it counts approval_status="pending"
        // which may not match the actual campaign status displayed
        const pendingApproval = Number(statusBreakdown.pending_approval) || 0;

        setCampaignStats({
          total: Number(total),
          active: Number(active),
          draft: Number(draft),
          pendingApproval: Number(pendingApproval),
        });
      } else {
        setCampaignStats({
          total: 0,
          active: 0,
          draft: 0,
          pendingApproval: 0,
        });
      }
    } catch (error) {
      console.error("Failed to load campaign stats:", error);
      setCampaignStats({
        total: 0,
        active: 0,
        draft: 0,
        pendingApproval: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch categories on component mount (non-blocking)
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch campaigns when filters change (deferred to ensure page renders immediately)
  useEffect(() => {
    // Defer to next event loop tick to ensure navigation and initial render complete first
    const timer = setTimeout(() => {
      fetchCampaigns();
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, searchQuery, filters, currentPage, pageSize]);

  // Fetch campaign stats (deferred to ensure page renders immediately)
  useEffect(() => {
    // Defer to next event loop tick to ensure navigation and initial render complete first
    const timer = setTimeout(() => {
      fetchCampaignStats();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchCampaignStats]);

  // Close action menus when clicking outside
  useEffect(() => {
    const handleClickOutsideActionMenus = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is inside any action menu button
      const clickedInsideButton = Object.values(actionMenuRefs.current).some(
        (ref) => ref && ref.contains(target)
      );

      // Check if click is inside any dropdown menu (portal)
      const clickedInsideDropdown = Object.values(
        dropdownMenuRefs.current
      ).some((ref) => ref && ref.contains(target));

      // Only close if clicked outside both button and dropdown
      if (!clickedInsideButton && !clickedInsideDropdown) {
        setShowActionMenu(null);
        setDropdownPosition(null);
      }
    };

    if (showActionMenu !== null) {
      document.addEventListener("mousedown", handleClickOutsideActionMenus);
      return () => {
        document.removeEventListener(
          "mousedown",
          handleClickOutsideActionMenus
        );
      };
    }
  }, [showActionMenu]);

  // Recalculate dropdown position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (showActionMenu !== null && dropdownPosition) {
        // Find the button that opened the menu
        const button = actionMenuRefs.current[showActionMenu];
        if (button) {
          // Recalculate position using the same responsive logic
          const buttonRect = button.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          // Determine device type for responsive sizing
          const isVerySmallPhone = viewportWidth < 480;
          const isSmallPhone = viewportWidth >= 480 && viewportWidth < 640;
          const isTablet = viewportWidth >= 640 && viewportWidth < 1024;
          const isMobile = viewportWidth < 640;
          const isLargeScreen = viewportWidth >= 1920;

          // Calculate responsive dropdown width
          let dropdownWidth: number;
          if (isVerySmallPhone) {
            dropdownWidth = Math.min(280, viewportWidth - 32);
          } else if (isSmallPhone) {
            dropdownWidth = Math.min(300, viewportWidth - 24);
          } else if (isTablet) {
            dropdownWidth = Math.min(256, viewportWidth - 32);
          } else {
            dropdownWidth = 256;
          }

          const spacing = 4;
          const padding = 8;

          const spaceBelow = viewportHeight - buttonRect.bottom - padding;
          const spaceAbove = buttonRect.top - padding;

          // Responsive min/max heights
          let minDropdownHeight: number;
          let maxDropdownHeight: number;

          if (isVerySmallPhone) {
            minDropdownHeight = 80;
            maxDropdownHeight = Math.min(250, viewportHeight * 0.5);
          } else if (isSmallPhone) {
            minDropdownHeight = 100;
            maxDropdownHeight = Math.min(300, viewportHeight * 0.55);
          } else if (isTablet) {
            minDropdownHeight = 120;
            maxDropdownHeight = Math.min(350, viewportHeight * 0.6);
          } else if (isLargeScreen) {
            minDropdownHeight = 120;
            maxDropdownHeight = 450;
          } else {
            minDropdownHeight = 120;
            maxDropdownHeight = 400;
          }

          let calculatedMaxHeight: number;
          const shouldPositionAbove =
            spaceBelow < minDropdownHeight && spaceAbove > spaceBelow;

          if (shouldPositionAbove) {
            const availableSpace = Math.min(spaceAbove, maxDropdownHeight);
            calculatedMaxHeight = Math.max(
              availableSpace - 10,
              minDropdownHeight
            );
          } else {
            if (spaceBelow >= maxDropdownHeight) {
              calculatedMaxHeight = maxDropdownHeight;
            } else if (spaceBelow >= minDropdownHeight) {
              calculatedMaxHeight = Math.max(
                spaceBelow - 10,
                minDropdownHeight
              );
            } else {
              calculatedMaxHeight = minDropdownHeight;
            }
          }

          const maxAllowedHeight = viewportHeight - 20;
          calculatedMaxHeight = Math.min(calculatedMaxHeight, maxAllowedHeight);
          calculatedMaxHeight = Math.max(
            calculatedMaxHeight,
            minDropdownHeight
          );

          const top = shouldPositionAbove
            ? buttonRect.top - calculatedMaxHeight - spacing
            : buttonRect.bottom + spacing;

          let left = buttonRect.right - dropdownWidth;
          if (left + dropdownWidth > viewportWidth - padding) {
            left = viewportWidth - dropdownWidth - padding;
          }
          if (left < padding) {
            left = padding;
          }
          if (isMobile && left < 8) {
            left = Math.max(8, (viewportWidth - dropdownWidth) / 2);
          }

          // Ensure dropdown doesn't go off-screen on very small devices
          if (left + dropdownWidth > viewportWidth - padding) {
            left = viewportWidth - dropdownWidth - padding;
          }
          if (left < padding) {
            left = padding;
          }

          setDropdownPosition({
            top,
            left,
            maxHeight: calculatedMaxHeight,
            width: dropdownWidth,
          });
        }
      }
    };

    if (showActionMenu !== null) {
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [showActionMenu, dropdownPosition]);

  const statusOptions = [
    { value: "all", label: "All Campaigns", count: totalCampaigns },
    {
      value: "active",
      label: "Active",
      count:
        selectedStatus === "active"
          ? totalCampaigns
          : allCampaignsUnfiltered.filter((c) => c.status === "active").length,
    },
    {
      value: "paused",
      label: "Paused",
      count:
        selectedStatus === "paused"
          ? totalCampaigns
          : allCampaignsUnfiltered.filter((c) => c.status === "paused").length,
    },
    {
      value: "completed",
      label: "Completed",
      count:
        selectedStatus === "completed"
          ? totalCampaigns
          : allCampaignsUnfiltered.filter((c) => c.status === "completed")
              .length,
    },
    {
      value: "draft",
      label: "Draft",
      count:
        selectedStatus === "draft"
          ? totalCampaigns
          : allCampaignsUnfiltered.filter((c) => c.status === "draft").length,
    },
    {
      value: "archived",
      label: "Archived",
      count:
        selectedStatus === "archived"
          ? totalCampaigns
          : allCampaignsUnfiltered.filter((c) => c.status === "archived")
              .length,
    },
  ];

  // Category options from API
  const categoryOptions = [
    { value: "all", label: "All Catalogs" },
    ...categories.map((cat) => ({ value: cat.id.toString(), label: cat.name })),
  ];

  const approvalStatusOptions = [
    { value: "all", label: "All Approval Status" },
    { value: "pending", label: "Pending Approval" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const sortOptions = [
    { value: "created_at", label: "Date Created" },
    { value: "updated_at", label: "Date Updated" },
    { value: "name", label: "Campaign Name" },
    { value: "status", label: "Status" },
    { value: "approval_status", label: "Approval Status" },
    { value: "start_date", label: "Start Date" },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      active: `bg-[${color.status.success}]/10 text-[${color.status.success}]`,
      paused: `bg-[${color.interactive.hover}] text-[${color.text.secondary}]`,
      completed: `bg-[${color.status.info}]/10 text-[${color.status.info}]`,
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  // Action handlers using service layer

  const handleArchiveCampaign = async (campaignId: number) => {
    try {
      // TODO: Get actual user ID from auth context
      const userId = 1;
      await campaignService.archiveCampaign(campaignId, userId);
      showToast("success", "Campaign archived successfully!");
      setShowActionMenu(null);
      fetchCampaigns(); // Refresh campaigns list
      fetchCampaignStats(); // Refresh stats cards
    } catch (error) {
      console.error("Failed to archive campaign:", error);
      // Extract error message from backend response
      let errorMessage = "Failed to archive campaign";

      if (error instanceof Error) {
        const match = error.message.match(/details: ({.*})/);
        if (match) {
          try {
            const errorData = JSON.parse(match[1]);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      }

      showToast("error", errorMessage);
    }
  };

  const handleDeleteCampaign = (campaignId: number, campaignName: string) => {
    setCampaignToDelete({ id: campaignId, name: campaignName });
    setShowDeleteModal(true);
    setShowActionMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!campaignToDelete) return;

    setIsDeleting(true);
    try {
      // TODO: Get actual user ID from auth context
      const userId = 1;
      await campaignService.deleteCampaign(campaignToDelete.id, userId);
      showToast(
        "success",
        `Campaign "${campaignToDelete.name}" deleted successfully!`
      );
      setShowDeleteModal(false);
      setCampaignToDelete(null);
      fetchCampaigns(); // Refresh campaigns list
      fetchCampaignStats(); // Refresh stats cards
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      // Extract error message from backend response
      let errorMessage = "Failed to delete campaign";

      if (error instanceof Error) {
        const match = error.message.match(/details: ({.*})/);
        if (match) {
          try {
            const errorData = JSON.parse(match[1]);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      }

      showToast("error", errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCampaignToDelete(null);
  };

  const handlePauseCampaign = async (campaignId: number) => {
    try {
      const pauseResponse = await campaignService.pauseCampaign(campaignId);

      // Update the campaign directly with the fresh data from API response
      const responseData = pauseResponse as unknown as {
        success: boolean;
        data?: { status?: string };
      };
      if (responseData.success && responseData.data?.status) {
        const newStatus = responseData.data.status;
        setCampaigns((prevCampaigns) =>
          prevCampaigns.map((campaign) =>
            campaign.id === campaignId
              ? { ...campaign, status: newStatus }
              : campaign
          )
        );
      }

      showToast("success", "Campaign paused successfully");
      fetchCampaignStats(); // Refresh stats cards
    } catch (error) {
      console.error("Failed to pause campaign:", error);
      showToast("error", "Failed to pause campaign");
    }
  };

  const handleResumeCampaign = async (campaignId: number) => {
    try {
      const resumeResponse = await campaignService.resumeCampaign(campaignId);

      // Update the campaign directly with the fresh data from API response
      const responseData = resumeResponse as unknown as {
        success: boolean;
        data?: { status?: string };
      };
      if (responseData.success && responseData.data?.status) {
        const newStatus = responseData.data.status;
        setCampaigns((prevCampaigns) =>
          prevCampaigns.map((campaign) =>
            campaign.id === campaignId
              ? { ...campaign, status: newStatus }
              : campaign
          )
        );
      }

      showToast("success", "Campaign resumed successfully");
      fetchCampaignStats(); // Refresh stats cards
    } catch (error) {
      console.error("Failed to resume campaign:", error);
      showToast("error", "Failed to resume campaign");
    }
  };

  const filteredCampaigns = campaigns;

  // Calculate total pages
  const totalPages = Math.ceil(totalCampaigns / pageSize);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchQuery]);

  // Campaign stats cards data
  const campaignStatsCards = [
    {
      name: "Total Campaigns",
      value: campaignStats?.total?.toLocaleString() || "0",
      icon: Target,
      color: color.tertiary.tag1, // Purple
    },
    {
      name: "Active Campaigns",
      value: campaignStats?.active?.toLocaleString() || "0",
      icon: CheckCircle,
      color: color.tertiary.tag4, // Green
    },
    {
      name: "Draft",
      value: campaignStats?.draft?.toLocaleString() || "0",
      icon: Clock,
      color: color.tertiary.tag3, // Yellow
    },
    {
      name: "Pending Approval",
      value: campaignStats?.pendingApproval?.toLocaleString() || "0",
      icon: AlertCircle,
      color: color.tertiary.tag2, // Coral
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            {t.pages.campaigns}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {t.pages.campaignsDescription}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/dashboard/campaigns/analytics")}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus:outline-none transition-colors"
            style={{
              backgroundColor: "transparent",
              color: color.primary.action,
              border: `1px solid ${color.primary.action}`,
            }}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <button
            onClick={() => navigate("/dashboard/campaigns/create")}
            className="inline-flex items-center px-4 py-2 font-semibold rounded-md shadow-sm text-sm whitespace-nowrap text-white self-start sm:self-auto"
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="h-5 w-5 mr-2" />
            {t.pages.createCampaign}
          </button>
        </div>
      </div>

      {/* Campaign Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {campaignStatsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="rounded-md border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="h-5 w-5"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {statsLoading ? "..." : stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
            style={{ color: color.text.muted }}
          />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearchQuery(searchQuery)}
            className={`w-full pl-10 pr-4 py-3 text-sm border ${tw.borderDefault} rounded-md focus:outline-none transition-all duration-200 bg-white focus:ring-2 focus:ring-[${color.primary.accent}]/20`}
          />
        </div>

        <HeadlessSelect
          options={statusOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          value={selectedStatus}
          onChange={(value) => setSelectedStatus(value as string)}
          placeholder="All Status"
          className=""
        />

        <button
          onClick={() => setShowAdvancedFilters(true)}
          className="flex items-center gap-2 rounded-md transition-colors font-medium"
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
      </div>

      <div
        className={` rounded-md border border-[${color.border.default}] overflow-hidden`}
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
              Loading campaigns...
            </p>
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Campaign name
                  </th>
                  {/* <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Objective
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Description
                  </th> */}
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Category
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Offers
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Segments
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Performance
                  </th>
                  <th
                    className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div
                        className={`font-semibold text-sm sm:text-base ${tw.textPrimary} truncate`}
                        title={campaign.name}
                      >
                        {campaign.name}
                      </div>
                    </td>
                    {/* <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span
                        className={`text-sm ${tw.textPrimary} block truncate max-w-[200px] sm:max-w-none`}
                        title={campaign.objective || "Not specified"}
                      >
                        {campaign.objective || "Not specified"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {campaign.description ? (
                        <span
                          className={`text-sm ${tw.textSecondary} truncate block`}
                          title={campaign.description}
                        >
                          {campaign.description}
                        </span>
                      ) : (
                        <span className={`text-sm ${tw.textMuted}`}>
                          No description
                        </span>
                      )}
                    </td> */}
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm ${tw.textPrimary}`}>
                        {campaign.category_id
                          ? categoryMap[campaign.category_id] || "Uncategorized"
                          : "Uncategorized"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                          campaign.status
                        )}`}
                      >
                        {campaign.status.charAt(0).toUpperCase() +
                          campaign.status.slice(1)}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm ${tw.textPrimary} font-medium`}>
                        {campaign.offer_count ?? 0}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm ${tw.textPrimary} font-medium`}>
                        {campaign.segment_count ?? 0}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex flex-col gap-1">
                        <span className={`text-sm ${tw.textPrimary}`}>
                          Conversion: <span className="font-medium">0%</span>
                        </span>
                        <span className={`text-sm ${tw.textPrimary}`}>
                          Revenue: <span className="font-medium">0</span>
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/dashboard/campaigns/${campaign.id}`)
                          }
                          className={`group p-3 rounded-md ${tw.textMuted} hover:bg-[${color.primary.action}]/10 transition-all duration-300`}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {campaign.status === "paused" ? (
                          <button
                            onClick={() => handleResumeCampaign(campaign.id)}
                            className={`group p-3 rounded-md ${tw.textMuted} hover:bg-gray-100 transition-all duration-300`}
                            title="Resume Campaign"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        ) : campaign.status === "active" ||
                          campaign.status === "running" ? (
                          <button
                            onClick={() => handlePauseCampaign(campaign.id)}
                            className={`group p-3 rounded-md ${tw.textMuted} hover:bg-orange-500 transition-all duration-300`}
                            style={{ backgroundColor: "transparent" }}
                            onMouseLeave={(e) => {
                              (
                                e.target as HTMLButtonElement
                              ).style.backgroundColor = "transparent";
                            }}
                            title="Pause Campaign"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        ) : null}
                        <button
                          onClick={() =>
                            navigate(
                              `/dashboard/campaigns/${campaign.id}/edit`,
                              {
                                state: { campaign: campaign },
                              }
                            )
                          }
                          className={`group p-3 rounded-md ${tw.textMuted} hover:bg-gray-100 transition-all duration-300`}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <div
                          className="relative"
                          ref={(el) => {
                            actionMenuRefs.current[campaign.id] = el;
                          }}
                        >
                          <button
                            onClick={(e) =>
                              handleActionMenuToggle(campaign.id, e)
                            }
                            className={`group p-3 rounded-md ${tw.textMuted} hover:bg-[${color.primary.action}]/10 transition-all duration-300`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Render dropdown menus via portal outside the table */}
                {filteredCampaigns.map((campaign) => {
                  if (showActionMenu === campaign.id && dropdownPosition) {
                    return createPortal(
                      <div
                        ref={(el) => {
                          dropdownMenuRefs.current[campaign.id] = el;
                        }}
                        className="fixed bg-white border border-gray-200 rounded-md shadow-xl py-3"
                        style={{
                          zIndex: 99999,
                          top: `${dropdownPosition.top}px`,
                          left: `${dropdownPosition.left}px`,
                          width: `${dropdownPosition.width || 256}px`,
                          maxHeight: `${dropdownPosition.maxHeight}px`,
                          overflowY: "auto",
                          overflowX: "hidden",
                          overscrollBehavior: "contain",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCampaignToExecute({
                              id: campaign.id,
                              name: campaign.name,
                            });
                            setShowExecuteModal(true);
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Play
                            className="w-4 h-4 mr-4"
                            style={{ color: color.primary.accent }}
                          />
                          Execute Campaign
                        </button>

                        {campaign.status === "draft" && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setShowActionMenu(null);
                              try {
                                await campaignService.submitForApproval(
                                  campaign.id
                                );
                                showToast(
                                  "success",
                                  `Campaign "${campaign.name}" submitted for approval!`
                                );
                                fetchCampaigns();
                              } catch (error) {
                                let errorMessage =
                                  "Failed to submit campaign for approval";
                                let errorTitle = "Submission Failed";

                                if (error instanceof Error) {
                                  // Check for budget-related errors
                                  if (
                                    error.message
                                      .toLowerCase()
                                      .includes("budget") ||
                                    error.message
                                      .toLowerCase()
                                      .includes("positive")
                                  ) {
                                    errorTitle = "Budget Required";
                                    errorMessage =
                                      "This campaign must have a positive budget allocated before it can be submitted for approval. Please set a budget in the campaign details.";
                                  } else {
                                    // Try to extract error from response
                                    const match =
                                      error.message.match(/details: ({.*})/);
                                    if (match) {
                                      try {
                                        const errorData = JSON.parse(match[1]);
                                        errorMessage =
                                          errorData.error ||
                                          errorData.message ||
                                          errorMessage;
                                      } catch {
                                        errorMessage = error.message;
                                      }
                                    } else {
                                      errorMessage = error.message;
                                    }
                                  }
                                }
                                showToast("error", errorTitle, errorMessage);
                              }
                            }}
                            className="w-full flex items-center px-4 py-3 text-sm text-black"
                          >
                            <Send
                              className="w-4 h-4 mr-4"
                              style={{ color: "#3B82F6" }}
                            />
                            Request Approval
                          </button>
                        )}

                        {campaign.status === "pending_approval" && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCampaignToApprove({
                                  id: campaign.id,
                                  name: campaign.name,
                                });
                                setShowApproveModal(true);
                                setShowActionMenu(null);
                              }}
                              className="w-full flex items-center px-4 py-3 text-sm text-black"
                            >
                              <CheckCircle
                                className="w-4 h-4 mr-4"
                                style={{ color: "#10B981" }}
                              />
                              Approve Campaign
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCampaignToReject({
                                  id: campaign.id,
                                  name: campaign.name,
                                });
                                setShowRejectModal(true);
                                setShowActionMenu(null);
                              }}
                              className="w-full flex items-center px-4 py-3 text-sm text-black"
                            >
                              <Trash2 className="w-4 h-4 mr-4 text-red-600" />
                              Reject Campaign
                            </button>
                          </>
                        )}

                        {campaign.status === "approved" && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setShowActionMenu(null);
                              try {
                                await campaignService.activateCampaign(
                                  campaign.id
                                );
                                showToast(
                                  "success",
                                  `Campaign "${campaign.name}" activated successfully!`
                                );
                                fetchCampaigns();
                              } catch (error) {
                                let errorMessage =
                                  "Failed to activate campaign";
                                if (error instanceof Error) {
                                  const match =
                                    error.message.match(/details: ({.*})/);
                                  if (match) {
                                    try {
                                      const errorData = JSON.parse(match[1]);
                                      errorMessage =
                                        errorData.error ||
                                        errorData.message ||
                                        errorMessage;
                                    } catch {
                                      errorMessage = error.message;
                                    }
                                  } else {
                                    errorMessage = error.message;
                                  }
                                }
                                showToast("error", errorMessage);
                              }
                            }}
                            className="w-full flex items-center px-4 py-3 text-sm text-black"
                          >
                            <Play
                              className="w-4 h-4 mr-4"
                              style={{ color: "#10B981" }}
                            />
                            Activate Campaign
                          </button>
                        )}

                        {(campaign.status === "active" ||
                          campaign.status === "running") && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setShowActionMenu(null);
                              try {
                                await campaignService.pauseCampaign(
                                  campaign.id
                                );
                                showToast(
                                  "success",
                                  `Campaign "${campaign.name}" paused successfully!`
                                );
                                fetchCampaigns();
                              } catch (error) {
                                let errorMessage = "Failed to pause campaign";
                                if (error instanceof Error) {
                                  errorMessage = error.message;
                                }
                                showToast("error", errorMessage);
                              }
                            }}
                            className="w-full flex items-center px-4 py-3 text-sm text-black"
                          >
                            <Pause
                              className="w-4 h-4 mr-4"
                              style={{ color: "#F59E0B" }}
                            />
                            Pause Campaign
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/dashboard/campaigns/${campaign.id}/edit`,
                              { state: { campaign: campaign } }
                            );
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Edit
                            className="w-4 h-4 mr-4"
                            style={{ color: color.primary.action }}
                          />
                          Edit Campaign
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveCampaign(campaign.id);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Archive
                            className="w-4 h-4 mr-4"
                            style={{ color: "#6B7280" }}
                          />
                          Archive Campaign
                        </button>

                        {/* <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActionMenu(null);
                            showToast(
                              "info",
                              "Can't access this functionality"
                            );
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <History
                            className="w-4 h-4 mr-4"
                            style={{ color: color.primary.action }}
                          />
                          Lifecycle History
                        </button> */}

                        {/* <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActionMenu(null);
                            showToast(
                              "info",
                              "Can't access this functionality"
                            );
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Copy
                            className="w-4 h-4 mr-4"
                            style={{ color: color.primary.action }}
                          />
                          Clone Campaign
                        </button> */}

                        {/* <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowActionMenu(null);
                            showToast(
                              "info",
                              "Can't access this functionality"
                            );
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Copy
                            className="w-4 h-4 mr-4"
                            style={{ color: color.primary.action }}
                          />
                          Duplicate Campaign
                        </button> */}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCampaign(campaign.id, campaign.name);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-4 text-red-600" />
                          Delete Campaign
                        </button>
                      </div>,
                      document.body
                    );
                  }
                  return null;
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <h3 className={`${tw.cardHeading} text-gray-900 mb-1`}>
              No campaigns found
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              {selectedStatus === "completed"
                ? "No completed campaigns yet. Campaigns will appear here once they finish running."
                : `No ${selectedStatus} campaigns found. Try creating a new campaign or check other status filters.`}
            </p>
            {selectedStatus !== "completed" && (
              <button
                onClick={() => navigate("/dashboard/campaigns/create")}
                className="mt-4 px-4 py-2 text-sm font-medium rounded-md text-white transition-all duration-200"
                style={{ backgroundColor: color.primary.action }}
              >
                Create Your First Campaign
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredCampaigns.length > 0 && totalCampaigns > 0 && (
        <div
          className={`bg-white rounded-md shadow-sm border ${tw.borderDefault} px-4 sm:px-6 py-4`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div
              className={`text-base ${tw.textSecondary} text-center sm:text-left`}
            >
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, totalCampaigns)} of{" "}
              {totalCampaigns} campaigns
            </div>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 border ${tw.borderDefault} rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-base whitespace-nowrap`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className={`text-base ${tw.textSecondary} px-2`}>
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`p-2 border ${tw.borderDefault} rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-base whitespace-nowrap`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Side Modal */}
      {showAdvancedFilters &&
        createPortal(
          <div
            className="fixed inset-0 overflow-hidden"
            style={{ zIndex: 999999, top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowAdvancedFilters(false)}
            ></div>
            <div
              className="absolute right-0 top-0 h-full w-full sm:w-[28rem] lg:w-96 bg-white shadow-xl"
              style={{ zIndex: 1000000 }}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Filter Campaigns
                  </h2>
                  <button
                    onClick={() => setShowAdvancedFilters(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Catalog
                      </label>
                      <HeadlessSelect
                        options={categoryOptions}
                        value={filters.categoryId}
                        onChange={(value) =>
                          setFilters({
                            ...filters,
                            categoryId: value as string,
                          })
                        }
                        placeholder="Select a catalog..."
                        searchable={true}
                      />
                    </div>

                    {/* Approval Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Approval Status
                      </label>
                      <HeadlessSelect
                        options={approvalStatusOptions}
                        value={filters.approvalStatus}
                        onChange={(value) =>
                          setFilters({
                            ...filters,
                            approvalStatus: value as string,
                          })
                        }
                        placeholder="Select approval status..."
                      />
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Date Range
                      </label>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Start Date From
                          </label>
                          <input
                            type="date"
                            value={filters.startDateFrom}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                startDateFrom: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Start Date To
                          </label>
                          <input
                            type="date"
                            value={filters.startDateTo}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                startDateTo: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sorting */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Sort By
                      </label>
                      <div className="space-y-3">
                        <HeadlessSelect
                          options={sortOptions}
                          value={filters.sortBy}
                          onChange={(value) =>
                            setFilters({ ...filters, sortBy: value as string })
                          }
                          placeholder="Select sort field..."
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              setFilters({ ...filters, sortDirection: "ASC" })
                            }
                            className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                              filters.sortDirection === "ASC"
                                ? `${tw.button} border-transparent`
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            ↑ Ascending
                          </button>
                          <button
                            onClick={() =>
                              setFilters({ ...filters, sortDirection: "DESC" })
                            }
                            className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                              filters.sortDirection === "DESC"
                                ? `${tw.button} border-transparent`
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            ↓ Descending
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-#f9fafb">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setFilters({
                          categoryId: "all",
                          approvalStatus: "all",
                          startDateFrom: "",
                          startDateTo: "",
                          sortBy: "created_at",
                          sortDirection: "DESC",
                        });
                        setSearchQuery("");
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-#f9fafb transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowAdvancedFilters(false)}
                      className={`${tw.button} flex-1 px-4 py-2 text-sm`}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Campaign"
        description="Are you sure you want to delete this campaign? This action cannot be undone."
        itemName={campaignToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete Campaign"
        cancelText="Cancel"
      />

      {/* Execute Campaign Modal */}
      {campaignToExecute && (
        <ExecuteCampaignModal
          isOpen={showExecuteModal}
          onClose={() => {
            setShowExecuteModal(false);
            setCampaignToExecute(null);
          }}
          campaignId={campaignToExecute.id}
          campaignName={campaignToExecute.name}
          onSuccess={() => {
            fetchCampaigns();
          }}
        />
      )}

      {/* Approve Campaign Modal */}
      {campaignToApprove && (
        <ApproveCampaignModal
          isOpen={showApproveModal}
          onClose={() => {
            setShowApproveModal(false);
            setCampaignToApprove(null);
          }}
          campaignId={campaignToApprove.id}
          campaignName={campaignToApprove.name}
          onSuccess={() => {
            fetchCampaigns();
          }}
        />
      )}

      {/* Reject Campaign Modal */}
      {campaignToReject && (
        <RejectCampaignModal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setCampaignToReject(null);
          }}
          campaignId={campaignToReject.id}
          campaignName={campaignToReject.name}
          onSuccess={() => {
            fetchCampaigns();
          }}
        />
      )}
    </div>
  );
}
