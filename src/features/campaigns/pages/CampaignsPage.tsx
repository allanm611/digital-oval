import { useNavigate, useLocation } from "react-router-dom";
import Input from '../../../shared/components/ui/Input';
import SearchInput from '../../../shared/components/ui/SearchInput';
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Filter,
  // Calendar,
  MoreHorizontal,
  Eye,
  Play,
  Pause,
  Edit,
  Archive,
  RotateCcw,
  Trash2,
  CheckCircle,
  Send,
  Target,
  Clock,
  AlertCircle,
  BarChart3,
  Copy,
} from "lucide-react";
import { color, tw, button, zIndex } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import CreateButton from "../../../shared/components/ui/CreateButton";
import Pagination from "../../../shared/components/ui/Pagination";
import { useLanguage } from "../../../contexts/LanguageContext";
import { campaignService } from "../services/campaignService";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import {
  canShowCampaignButton,
  handleCampaignAction,
  type CampaignActionParams,
} from "../utils/campaignActions";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import RunCampaignModal from "../components/RunCampaignModal";
import ApproveCampaignModal from "../components/ApproveCampaignModal";
import RejectCampaignModal from "../components/RejectCampaignModal";
import CampaignOffersModal from "../components/CampaignOffersModal";
import CampaignSegmentsModal from "../components/CampaignSegmentsModal";
import { PermissionGate } from "../../auth/components/PermissionGate";
import {
  CampaignApprovalStatus,
  CampaignCollection,
  CampaignDisplay,
  CampaignStatsSummary,
  CampaignStatus,
  CampaignSuperSearchQuery,
  GetCampaignsResponse,
} from "../types/campaign";
import { CampaignCategory } from "../types/campaignCategory";
type CampaignListResponse = CampaignCollection | GetCampaignsResponse;

export default function CampaignsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { user } = useAuth();
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
  });
  const filterRef = useRef<HTMLDivElement>(null);
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [campaignToRun, setCampaignToRun] = useState<{
    id: number;
    name: string;
    status?: string;
    approval_status?: string;
    is_active?: boolean;
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
  const [pageSize] = useState(15);
  const [categories, setCategories] = useState<CampaignCategory[]>([]);
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
  const [loadingActionIds, setLoadingActionIds] = useState<Set<number>>(
    new Set(),
  );
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showSegmentsModal, setShowSegmentsModal] = useState(false);
  const [selectedCampaignForModal, setSelectedCampaignForModal] =
    useState<CampaignDisplay | null>(null);

  // Helper function to update a single campaign in the list
  const updateCampaignInList = (
    campaignId: number,
    updates: Partial<CampaignDisplay>,
  ) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, ...updates } : c)),
    );
    setAllCampaignsUnfiltered((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, ...updates } : c)),
    );
  };

  const handleAction = (params: CampaignActionParams) =>
    handleCampaignAction(params, {
      onSetLoading: setLoadingActionIds,
      onCloseMenu: () => setShowActionMenu(null),
      onUpdateCampaign: updateCampaignInList,
      onSuccess: (message) => showToast("success", message),
      onError: (title, message) => showToast("error", title, message),
    });

  // Use click outside hook for filter modal
  useClickOutside(filterRef, () => setShowAdvancedFilters(false), {
    enabled: showAdvancedFilters,
  });

  const handleActionMenuToggle = (
    campaignId: number,
    event?: React.MouseEvent<HTMLButtonElement>,
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
            minDropdownHeight,
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
      // Service now normalizes all categories, so we can use them directly
      const categoriesData = response?.data ?? [];
      setCategories(categoriesData as CampaignCategory[]);
    } catch (error) {
      console.error("Failed to load campaign catalogs:", error);
      showToast(
        "error",
        "Failed to load Campaigns catalogs. Please try again.",
      );
      setCategories([]);
    }
  }, [showToast]);

  // Fetch campaigns from API
  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);

      const API_LIMIT = 100; // Fetch all at once, client-side pagination for UI
      const apiOffset = 0; // Always fetch from beginning

      // Check if any filters are applied
      const hasFilters =
        searchQuery.trim() ||
        (filters.approvalStatus && filters.approvalStatus !== "all") ||
        (filters.categoryId && filters.categoryId !== "all") ||
        filters.startDateFrom ||
        filters.startDateTo ||
        (selectedStatus && selectedStatus !== "all");

      let response: CampaignListResponse;

      if (hasFilters) {
        // Use superSearch when filters are applied
        const searchParams: CampaignSuperSearchQuery = {
          limit: API_LIMIT,
          offset: apiOffset,
          skipCache: true,
        };

        if (searchQuery.trim()) {
          searchParams.name = searchQuery.trim();
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

        if (selectedStatus && selectedStatus !== "all") {
          searchParams.status = selectedStatus as CampaignStatus;
        }

        response = await campaignService.superSearchCampaigns(searchParams);
      } else {
        // Use getCampaigns for basic list (no filters)
        response = await campaignService.getCampaigns({
          limit: API_LIMIT,
          offset: apiOffset,
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

      // Service now normalizes all campaigns, so we can use them directly
      const campaignsData: CampaignDisplay[] = response.data.map((campaign) => ({
        ...campaign,
        offer_count: (campaign as any).offers_count ?? campaign.offers?.length ?? 0,
        segment_count: (campaign as any).segments_count ?? campaign.segments?.length ?? 0,
      }));

      // Filter out archived campaigns when showing "all" status
      let campaignsToDisplay = campaignsData;
      if (selectedStatus === "all") {
        campaignsToDisplay = campaignsData.filter(
          (c) => c.status !== "archived",
        );
      }

      // Client-side pagination: slice the fetched campaigns to show only current page
      const currentIndex = (currentPage - 1) * pageSize;
      const clientEndIndex = currentIndex + pageSize;
      const paginatedCampaigns = campaignsToDisplay.slice(currentIndex, clientEndIndex);

      setCampaigns(paginatedCampaigns);
      setAllCampaignsUnfiltered(campaignsData);
      setTotalCampaigns(campaignsToDisplay.length);
    } catch (error) {
      console.error("Failed to load campaigns list:", error);
      showToast(
        "error",
        "Failed to load campaigns. Please try again in a moment.",
      );
      setCampaigns([]);
      setTotalCampaigns(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, searchQuery, currentPage, pageSize, filters, showToast]);

  // Fetch campaign stats
  const fetchCampaignStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await campaignService.getCampaignStats(true);

      if (response.success && response.data) {
        const data = response.data as CampaignStatsSummary;
        const overview = data.overview ?? {};
        const statusBreakdown = data.status_breakdown ?? {};
        const activityStatus = data.activity_status ?? {};

        const total =
          Number(overview.total_campaigns) || Number(data.total_campaigns) || 0;

        const active =
          Number(statusBreakdown.active) ||
          Number(activityStatus.is_active_flag_true) ||
          Number(activityStatus.currently_running) ||
          0;

        const draft = Number(statusBreakdown.draft) || 0;

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

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch campaigns when filters change or when navigating back to this page
  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedStatus,
    searchQuery,
    filters,
    currentPage,
    pageSize,
    location.key,
  ]);

  // Fetch campaign stats when navigating to this page
  useEffect(() => {
    fetchCampaignStats();
  }, [fetchCampaignStats, location.key]);

  // Close action menus when clicking outside
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
        setDropdownPosition(null);
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
              minDropdownHeight,
            );
          } else {
            if (spaceBelow >= maxDropdownHeight) {
              calculatedMaxHeight = maxDropdownHeight;
            } else if (spaceBelow >= minDropdownHeight) {
              calculatedMaxHeight = Math.max(
                spaceBelow - 10,
                minDropdownHeight,
              );
            } else {
              calculatedMaxHeight = minDropdownHeight;
            }
          }

          const maxAllowedHeight = viewportHeight - 20;
          calculatedMaxHeight = Math.min(calculatedMaxHeight, maxAllowedHeight);
          calculatedMaxHeight = Math.max(
            calculatedMaxHeight,
            minDropdownHeight,
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
    ...categories
      .filter(
        (cat): cat is (typeof categories)[number] => cat && cat.id && cat.name,
      )
      .map((cat) => ({ value: cat.id.toString(), label: cat.name })),
  ];

  const approvalStatusOptions = [
    { value: "all", label: "All Approval Status" },
    { value: "pending", label: "Pending Approval" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const getStatusBadge = (_status: string) => {
    return `text-black`;
  };

  // Action handlers using service layer

  const handleArchiveCampaign = async (campaignId: number) => {
    try {
      const userId = user?.user_id;
      if (!userId) {
        throw new Error("User ID not available");
      }
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

  const handleUnarchiveCampaign = async (campaignId: number) => {
    try {
      const userId = user?.user_id;
      if (!userId) {
        throw new Error("User ID not available");
      }
      await campaignService.unarchiveCampaign(campaignId, userId);
      showToast("success", "Campaign unarchived successfully!");
      setShowActionMenu(null);
      fetchCampaigns();
      fetchCampaignStats();
    } catch (error) {
      console.error("Failed to unarchive campaign:", error);
      let errorMessage = "Failed to unarchive campaign";

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
      const userId = user?.user_id;
      if (!userId) {
        throw new Error("User ID not available");
      }
      await campaignService.deleteCampaign(campaignToDelete.id, userId);
      // Remove campaign from list instead of refetching
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete.id));
      setAllCampaignsUnfiltered((prev) =>
        prev.filter((c) => c.id !== campaignToDelete.id),
      );
      setTotalCampaigns((prev) => Math.max(0, prev - 1));
      showToast(
        "success",
        `Campaign "${campaignToDelete.name}" deleted successfully!`,
      );
      setShowDeleteModal(false);
      setCampaignToDelete(null);
      // Only refetch stats since total count changed
      fetchCampaignStats();
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
            className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
            style={{
              backgroundColor: "transparent",
              color: color.primary.action,
              border: `1px solid ${color.primary.action}`,
            }}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <PermissionGate permission="campaigns.create">
            <CreateButton route="/dashboard/campaigns/create" />
          </PermissionGate>
        </div>
      </div>

      {/* Campaign Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {campaignStatsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
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
        <SearchInput
          placeholder="Search campaigns..."
          value={searchQuery}
          onChange={setSearchQuery}
          onKeyDown={(e) => e.key === "Enter" && setSearchQuery(searchQuery)}
        />

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
      </div>

      <div
        className={` ${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
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
                      <div className="flex flex-col gap-2">
                        <div
                          className={`${tw.tableFirstColumn} ${tw.textPrimary} truncate`}
                          title={campaign.name}
                        >
                          {campaign.name}
                        </div>
                        {/* Status icons - to be enabled when backend provides data fields */}
                        {/* <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" style={{ color: color.primary.accent }} title="Scheduled" />
                          <Send className="w-4 h-4" style={{ color: color.primary.accent }} title="Broadcasts" />
                          <AlertCircle className="w-4 h-4" style={{ color: color.primary.accent }} title="Failed" />
                        </div> */}
                      </div>
                    </td>
                    {/* <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span
                        className={`text-sm ${tw.textPrimary} block truncate max-w-[200px] sm:max-w-none`}
                        title={campaign.objective}
                      >
                        {campaign.objective}
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
                          campaign.status,
                        )}`}
                      >
                        {campaign.status?.replace(/_/g, " ") || "Unknown"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 cursor-pointer"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                      onClick={() => {
                        // Check if offers is an array before opening modal
                        if (Array.isArray(campaign.offers) && campaign.offers.length > 0) {
                          setSelectedCampaignForModal(campaign);
                          setShowOffersModal(true);
                        }
                      }}
                    >
                      <span className={`text-sm ${tw.textPrimary} font-medium`}>
                        {campaign.offer_count ?? 0}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 cursor-pointer"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                      onClick={() => {
                        // Check if segments is an array before opening modal
                        if (Array.isArray(campaign.segments) && campaign.segments.length > 0) {
                          setSelectedCampaignForModal(campaign);
                          setShowSegmentsModal(true);
                        }
                      }}
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
                          className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.action}]/10 transition-all duration-300`}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canShowCampaignButton(campaign, "resume") ? (
                          <button
                            onClick={() =>
                              handleAction({
                                campaignId: campaign.id,
                                campaignName: campaign.name,
                                action: "resume",
                                successMessage: `Campaign "${campaign.name}" resumed successfully!`,
                                errorMessage: "Failed to resume campaign",
                                updateFields: { status: "active" },
                              })
                            }
                            className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-gray-100 transition-all duration-300 relative`}
                            title="Resume Campaign"
                            disabled={loadingActionIds.has(campaign.id)}
                          >
                            {loadingActionIds.has(campaign.id) ? (
                              <LoadingSpinner
                                variant="modern"
                                size="sm"
                                color="primary"
                              />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        ) : canShowCampaignButton(campaign, "pause") ? (
                          <button
                            onClick={() =>
                              handleAction({
                                campaignId: campaign.id,
                                campaignName: campaign.name,
                                action: "pause",
                                successMessage: `Campaign "${campaign.name}" paused successfully!`,
                                errorMessage: "Failed to pause campaign",
                                updateFields: { status: "paused" },
                              })
                            }
                            className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-orange-500 transition-all duration-300`}
                            style={{ backgroundColor: "transparent" }}
                            onMouseLeave={(e) => {
                              (
                                e.target as HTMLButtonElement
                              ).style.backgroundColor = "transparent";
                            }}
                            title="Pause Campaign"
                            disabled={loadingActionIds.has(campaign.id)}
                          >
                            {loadingActionIds.has(campaign.id) ? (
                              <LoadingSpinner
                                variant="modern"
                                size="sm"
                                color="primary"
                              />
                            ) : (
                              <Pause className="w-4 h-4" />
                            )}
                          </button>
                        ) : null}
                        <PermissionGate permission="campaigns.update">
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboard/campaigns/${campaign.id}/edit`,
                                {
                                  state: { campaign: campaign },
                                },
                              )
                            }
                            className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-gray-100 transition-all duration-300`}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </PermissionGate>
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
                            className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-[${color.primary.action}]/10 transition-all duration-300`}
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
                        className={`fixed bg-white border border-gray-200 ${tw.rounded} shadow-xl py-3`}
                        style={{
                          zIndex: zIndex.popover,
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
                        <PermissionGate permission="campaigns.run">
                          {campaign.approval_status === "approved" &&
                          campaign.is_active === true ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCampaignToRun({
                                  id: campaign.id,
                                  name: campaign.name,
                                  status: campaign.status,
                                  approval_status: campaign.approval_status,
                                  is_active: campaign.is_active,
                                });
                                setShowRunModal(true);
                                setShowActionMenu(null);
                              }}
                              className="w-full flex items-center px-4 py-3 text-sm text-black"
                            >
                              <Play className="w-4 h-4 mr-4 text-black" />
                              Run Campaign
                            </button>
                          ) : null}
                        </PermissionGate>

                        {/* Pause Campaign Button */}
                        {canShowCampaignButton(campaign, "pause") ? (
                          <PermissionGate permission="campaigns.run">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction({
                                  campaignId: campaign.id,
                                  campaignName: campaign.name,
                                  action: "pause",
                                  successMessage: `Campaign "${campaign.name}" paused successfully!`,
                                  errorMessage: "Failed to pause campaign",
                                  updateFields: { status: "paused" },
                                });
                              }}
                              className="w-full flex items-center px-4 py-3 text-sm text-black"
                              disabled={loadingActionIds.has(campaign.id)}
                            >
                              {loadingActionIds.has(campaign.id) ? (
                                <LoadingSpinner
                                  variant="modern"
                                  size="sm"
                                  color="primary"
                                  className="mr-4"
                                />
                              ) : (
                                <Pause className="w-4 h-4 mr-4 text-black" />
                              )}
                              Pause Campaign
                            </button>
                          </PermissionGate>
                        ) : null}

                        {/* Resume Campaign Button */}
                        {canShowCampaignButton(campaign, "resume") ? (
                          <PermissionGate permission="campaigns.run">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction({
                                  campaignId: campaign.id,
                                  campaignName: campaign.name,
                                  action: "resume",
                                  successMessage: `Campaign "${campaign.name}" resumed successfully!`,
                                  errorMessage: "Failed to resume campaign",
                                  updateFields: { status: "active" },
                                });
                              }}
                              className="w-full flex items-center px-4 py-3 text-sm text-black"
                              disabled={loadingActionIds.has(campaign.id)}
                            >
                              {loadingActionIds.has(campaign.id) ? (
                                <LoadingSpinner
                                  variant="modern"
                                  size="sm"
                                  color="primary"
                                  className="mr-4"
                                />
                              ) : (
                                <Play className="w-4 h-4 mr-4 text-black" />
                              )}
                              Resume Campaign
                            </button>
                          </PermissionGate>
                        ) : null}

                        {canShowCampaignButton(campaign, "activate") ? (
                          <PermissionGate permission="campaigns.activate">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction({
                                  campaignId: campaign.id,
                                  campaignName: campaign.name,
                                  action: "activate",
                                  successMessage: `Campaign "${campaign.name}" activated successfully!`,
                                  errorMessage: "Failed to activate campaign",
                                  updateFields: { is_active: true },
                                });
                              }}
                              className="w-full flex items-center px-4 py-3 text-sm text-black"
                              disabled={loadingActionIds.has(campaign.id)}
                            >
                              {loadingActionIds.has(campaign.id) ? (
                                <LoadingSpinner
                                  variant="modern"
                                  size="sm"
                                  color="primary"
                                  className="mr-4"
                                />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-4 text-black" />
                              )}
                              Activate Campaign
                            </button>
                          </PermissionGate>
                        ) : null}

                        {canShowCampaignButton(campaign, "submit") && (
                          <PermissionGate permission="campaigns.update">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction({
                                  campaignId: campaign.id,
                                  campaignName: campaign.name,
                                  action: "submit",
                                  successMessage: `Campaign "${campaign.name}" submitted for approval!`,
                                  errorMessage:
                                    "Failed to submit campaign for approval",
                                  updateFields: {
                                    status: "pending_approval",
                                    approval_status: "pending",
                                  },
                                  errorProcessor: (error) => {
                                    let errorTitle = "Submission Failed";
                                    let errorMessage =
                                      "Failed to submit campaign for approval";

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
                                          error.message.match(
                                            /details: ({.*})/,
                                          );
                                        if (match) {
                                          try {
                                            const errorData = JSON.parse(
                                              match[1],
                                            );
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
                                    return {
                                      title: errorTitle,
                                      message: errorMessage,
                                    };
                                  },
                                });
                              }}
                              className="w-full flex items-center px-4 py-3 text-sm text-black"
                              disabled={loadingActionIds.has(campaign.id)}
                            >
                              {loadingActionIds.has(campaign.id) ? (
                                <LoadingSpinner
                                  variant="modern"
                                  size="sm"
                                  color="primary"
                                  className="mr-4"
                                />
                              ) : (
                                <Send className="w-4 h-4 mr-4 text-black" />
                              )}
                              Request Approval
                            </button>
                          </PermissionGate>
                        )}

                        {campaign.status === "pending_approval" && (
                          <>
                            <PermissionGate permission="campaigns.approve">
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
                                <CheckCircle className="w-4 h-4 mr-4 text-black" />
                                Approve Campaign
                              </button>
                            </PermissionGate>
                            <PermissionGate permission="campaigns.reject">
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
                            </PermissionGate>
                          </>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/dashboard/campaigns/${campaign.id}/edit`,
                              { state: { campaign: campaign } },
                            );
                            setShowActionMenu(null);
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-black"
                        >
                          <Edit className="w-4 h-4 mr-4 text-black" />
                          Edit Campaign
                        </button>

                        {campaign.status === "archived" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnarchiveCampaign(campaign.id);
                            }}
                            className="w-full flex items-center px-4 py-3 text-sm text-black"
                          >
                            <RotateCcw className="w-4 h-4 mr-4 text-black" />
                            Unarchive Campaign
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveCampaign(campaign.id);
                            }}
                            className="w-full flex items-center px-4 py-3 text-sm text-black"
                          >
                            <Archive className="w-4 h-4 mr-4 text-black" />
                            Archive Campaign
                          </button>
                        )}

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

                        {/* Duplicate Campaign Button */}
                        <PermissionGate permission="campaigns.create">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/campaigns/create?duplicateId=${campaign.id}`);
                              setShowActionMenu(null);
                            }}
                            className="w-full flex items-center px-4 py-3 text-sm text-black"
                          >
                            <Copy
                              className="w-4 h-4 mr-4"
                              style={{ color: color.primary.action }}
                            />
                            Duplicate Campaign
                          </button>
                        </PermissionGate>

                        <PermissionGate permission="campaigns.delete">
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
                        </PermissionGate>
                      </div>,
                      document.body,
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
            <PermissionGate permission="campaign.create">
              {selectedStatus !== "completed" && (
                <div className="mt-4">
                  <CreateButton route="/dashboard/campaigns/create" />
                </div>
              )}
            </PermissionGate>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredCampaigns.length > 0 && totalCampaigns > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalCampaigns}
          onPageChange={handlePageChange}
        />
      )}

      {/* Filters Side Modal */}
      {showAdvancedFilters &&
        createPortal(
          <div
            className="fixed inset-0 overflow-hidden"
            style={{
              zIndex: zIndex.modal,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowAdvancedFilters(false)}
            ></div>
            <div
              className="absolute right-0 top-0 h-full w-full sm:w-[28rem] lg:w-96 bg-white shadow-xl"
              style={{ zIndex: zIndex.modal + 1 }}
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
                          <Input
                            type="date"
                            value={filters.startDateFrom}
                            onChange={(value) =>
                              setFilters({
                                ...filters,
                                startDateFrom: String(value),
                              })
                            }
                            className={`w-full px-4 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Start Date To
                          </label>
                          <Input
                            type="date"
                            value={filters.startDateTo}
                            onChange={(value) =>
                              setFilters({
                                ...filters,
                                startDateTo: String(value),
                              })
                            }
                            className={`w-full px-4 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent`}
                          />
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
                        });
                        setSearchQuery("");
                      }}
                      className={`flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-#f9fafb transition-colors`}
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
          document.body,
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

      {/* Run Campaign Modal */}
      {campaignToRun && (
        <RunCampaignModal
          isOpen={showRunModal}
          onClose={() => {
            setShowRunModal(false);
            setCampaignToRun(null);
          }}
          campaignId={campaignToRun.id}
          campaignName={campaignToRun.name}
          isActive={campaignToRun.is_active}
          approvalStatus={campaignToRun.approval_status}
          onSuccess={async () => {
            // Fetch fresh campaign data after running
            try {
              const response = await campaignService.getCampaignById(
                campaignToRun.id,
                true,
              );
              if (response && response.status && response.is_active !== undefined) {
                updateCampaignInList(campaignToRun.id, {
                  status: response.status,
                  is_active: response.is_active,
                });
              }
              // If response doesn't have status, don't set a fallback - let the user refresh
            } catch {
              // If execution fails, don't update status - user should refresh
            }
            fetchCampaignStats(); // Refresh stats
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
          onSuccess={async () => {
            // Fetch fresh campaign data after approval
            try {
              const response = await campaignService.getCampaignById(
                campaignToApprove.id,
                true,
              );
              if (response && response.approval_status && response.status) {
                updateCampaignInList(campaignToApprove.id, {
                  approval_status: response.approval_status,
                  status: response.status,
                });
              } else {
                updateCampaignInList(campaignToApprove.id, {
                  approval_status: "approved",
                });
              }
            } catch {
              updateCampaignInList(campaignToApprove.id, {
                approval_status: "approved",
              });
            }
            fetchCampaignStats(); // Refresh stats
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
          onSuccess={async () => {
            // Fetch fresh campaign data after rejection to ensure correct state
            try {
              const response = await campaignService.getCampaignById(
                campaignToReject.id,
                true,
              );
              if (response && response.approval_status && response.status) {
                updateCampaignInList(campaignToReject.id, {
                  approval_status: response.approval_status,
                  status: response.status,
                });
              } else {
                // Fallback: just update with rejected status
                updateCampaignInList(campaignToReject.id, {
                  approval_status: "rejected",
                });
              }
            } catch {
              // Fallback: just update with rejected status
              updateCampaignInList(campaignToReject.id, {
                approval_status: "rejected",
              });
            }
            fetchCampaignStats(); // Refresh stats
          }}
        />
      )}

      {/* Campaign Offers Modal */}
      {selectedCampaignForModal && (
        <CampaignOffersModal
          isOpen={showOffersModal}
          onClose={() => {
            setShowOffersModal(false);
            setSelectedCampaignForModal(null);
          }}
          offers={Array.isArray(selectedCampaignForModal.offers) ? selectedCampaignForModal.offers : undefined}
          campaignName={selectedCampaignForModal.name}
        />
      )}

      {/* Campaign Segments Modal */}
      {selectedCampaignForModal && (
        <CampaignSegmentsModal
          isOpen={showSegmentsModal}
          onClose={() => {
            setShowSegmentsModal(false);
            setSelectedCampaignForModal(null);
          }}
          segments={Array.isArray(selectedCampaignForModal.segments) ? selectedCampaignForModal.segments : undefined}
          campaignName={selectedCampaignForModal.name}
        />
      )}
    </div>
  );
}
