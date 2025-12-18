import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  Clock,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  CheckCircle,
  XCircle,
  Trash2,
  Play,
  Pause,
  Archive,
  Filter,
  AlertCircle,
  Package,
} from "lucide-react";
import { Offer, SearchParams, OfferStatusEnum } from "../types/offer";
import { offerService } from "../services/offerService";
import { offerCategoryService } from "../services/offerCategoryService";
import { OfferCategoryType } from "../types/offerCategory";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { color, tw, button, zIndex } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import DateFormatter from "../../../shared/components/DateFormatter";

export default function OffersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<OfferCategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOffers, setTotalOffers] = useState(0);
  const [offerStats, setOfferStats] = useState<{
    total: number;
    active: number;
    expired: number;
    pendingApproval: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filters, setFilters] = useState<SearchParams>({
    page: 1,
    limit: 10,
    sortBy: "created_at",
    sortDirection: "DESC",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OfferStatusEnum | "all">(
    "all"
  );
  const [selectedApproval, setSelectedApproval] = useState<string | "all">(
    "all"
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);

  // Dropdown menu state
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const actionMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const dropdownMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);

  // Loading states for individual offers
  const [loadingAction, setLoadingAction] = useState<{
    offerId: number;
    action: string;
  } | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadCategories = async () => {
    try {
      const response = await offerCategoryService.getAllCategories({
        limit: 100,
        skipCache: true,
      });
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch {
      // Error loading categories
    }
  };

  const loadOffers = async (skipCache = false) => {
    try {
      setLoading(true);

      // If category filter is applied, use the specific category endpoint
      if (filters.categoryId) {
        const response = await offerService.getOffersByCategory(
          filters.categoryId,
          {
            limit: filters.limit || 10,
            offset: filters.offset || 0,
            skipCache: skipCache,
          }
        );

        if (response.success && response.data) {
          // Apply additional client-side filters if needed
          let filteredOffers = response.data;

          // Filter by status if selected
          if (selectedStatus && selectedStatus !== "all") {
            filteredOffers = filteredOffers.filter(
              (offer) => offer.status === selectedStatus
            );
          } else if (selectedStatus === "all") {
            // By default, exclude archived and expired offers
            filteredOffers = filteredOffers.filter(
              (offer) =>
                offer.status !== OfferStatusEnum.ARCHIVED &&
                offer.status !== OfferStatusEnum.EXPIRED
            );
          }

          // Filter by search term if provided
          if (debouncedSearchTerm) {
            const searchLower = debouncedSearchTerm.toLowerCase();
            filteredOffers = filteredOffers.filter(
              (offer) =>
                offer.name?.toLowerCase().includes(searchLower) ||
                offer.code?.toLowerCase().includes(searchLower) ||
                offer.description?.toLowerCase().includes(searchLower)
            );
          }

          // Sort offers by created_at descending (newest first)
          filteredOffers.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA; // Descending order (newest first)
          });

          setOffers(filteredOffers);
          const total = filteredOffers.length;
          setTotalOffers(total);
          return; // Success - exit early to avoid catch block
        }
        // If response.success is false, fall through to error handling
      } else {
        // No category filter - use regular search
        // Note: Backend doesn't support status filter, so we filter client-side
        // When filtering client-side by status, we need to fetch all offers to get accurate totals
        const needsClientSideFiltering =
          (selectedStatus && selectedStatus !== "all") ||
          selectedStatus === "all";

        if (needsClientSideFiltering) {
          // Fetch all offers in batches when we need to filter client-side
          let allOffers: Offer[] = [];
          let offset = 0;
          const batchSize = 100;
          let hasMore = true;

          // Fetch all offers in batches
          while (hasMore) {
            const batchResponse = await offerService.searchOffers({
              limit: batchSize,
              offset: offset,
              search: debouncedSearchTerm || undefined,
              sortBy: filters.sortBy || "created_at",
              sortDirection: filters.sortDirection || "DESC",
              skipCache: skipCache,
            });

            if (batchResponse.success && batchResponse.data) {
              allOffers = [...allOffers, ...batchResponse.data];

              // Check if there are more offers to fetch
              const totalFromPagination = batchResponse.pagination?.total || 0;
              hasMore =
                allOffers.length < totalFromPagination &&
                batchResponse.data.length === batchSize;
              offset += batchSize;
            } else {
              hasMore = false;
            }
          }

          // Sort offers by created_at descending (newest first)
          allOffers.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA; // Descending order (newest first)
          });

          // Apply status filter client-side
          let filteredOffers = allOffers;
          if (selectedStatus && selectedStatus !== "all") {
            filteredOffers = filteredOffers.filter(
              (offer) => offer.status === selectedStatus
            );
          } else if (selectedStatus === "all") {
            // By default, exclude archived and expired offers
            filteredOffers = filteredOffers.filter(
              (offer) =>
                offer.status !== OfferStatusEnum.ARCHIVED &&
                offer.status !== OfferStatusEnum.EXPIRED
            );
          }

          // Apply client-side pagination
          const page = filters.page || 1;
          const pageSize = filters.pageSize || 10;
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          const paginatedOffers = filteredOffers.slice(startIndex, endIndex);

          setOffers(paginatedOffers);
          // Use filtered count as total to match displayed items
          setTotalOffers(filteredOffers.length);
          return; // Success - exit early to avoid catch block
        } else {
          // No client-side filtering needed - use regular paginated search
          const searchParams: SearchParams = {
            ...filters,
            skipCache: skipCache,
          };

          const response = await offerService.searchOffers(searchParams);

          if (response.success && response.data) {
            setOffers(response.data);
            // Use backend pagination total when no client-side filtering
            const total = response.pagination?.total || response.data.length;
            setTotalOffers(total);
            return; // Success - exit early to avoid catch block
          }
        }
        // If response.success is false, fall through to error handling
      }

      // If we reach here, the API call succeeded but response.success is false
      // Show a single error message
      showError(
        "Failed to load offers",
        filters.categoryId
          ? "Unable to retrieve offers for this category."
          : "Unable to retrieve offers. Please try again."
      );
    } catch (err) {
      // Only show error if it's an actual exception (network error, etc.)
      // Don't show duplicate error if response.success was false (handled above)
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while loading offers";
      showError("Failed to load offers", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get category name from category_id
  const getCategoryName = (categoryId: string | number | undefined): string => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(
      (cat) => String(cat.id) === String(categoryId)
    );
    return category?.name || "Uncategorized";
  };

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load offer stats
  const fetchOfferStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      let total = 0;
      let active = 0;
      let expired = 0;
      let pendingApproval = 0;

      // Fetch all offers to calculate stats accurately
      // Backend limit is 100, so we'll fetch in batches if needed
      try {
        let allOffers: Offer[] = [];
        let offset = 0;
        const batchSize = 100;
        let hasMore = true;

        // Fetch all offers in batches
        while (hasMore) {
          const batchResponse = await offerService.searchOffers({
            limit: batchSize,
            offset: offset,
            skipCache: true,
          });

          if (batchResponse.success && batchResponse.data) {
            allOffers = [...allOffers, ...batchResponse.data];

            // Check if there are more offers to fetch
            const totalFromPagination = batchResponse.pagination?.total || 0;
            hasMore =
              allOffers.length < totalFromPagination &&
              batchResponse.data.length === batchSize;
            offset += batchSize;
          } else {
            hasMore = false;
          }
        }

        if (allOffers.length > 0) {
          // Total offers - count all regardless of status
          total = allOffers.length;

          // Active offers = status "active" OR "approved"
          active = allOffers.filter(
            (offer) =>
              offer.status === OfferStatusEnum.ACTIVE ||
              offer.status === OfferStatusEnum.APPROVED
          ).length;

          // Expired offers
          expired = allOffers.filter(
            (offer) => offer.status === OfferStatusEnum.EXPIRED
          ).length;

          // Pending approval = pending_approval + draft
          pendingApproval = allOffers.filter(
            (offer) =>
              offer.status === OfferStatusEnum.PENDING_APPROVAL ||
              offer.status === OfferStatusEnum.DRAFT
          ).length;
        } else {
          // Fallback: try stats endpoint
          try {
            const offersResponse = await offerService.getStats();
            if (offersResponse.success && offersResponse.data) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const data = offersResponse.data as any;
              total =
                parseInt(data.total_offers as string) ||
                parseInt(data.totalOffers as string) ||
                parseInt(data.total as string) ||
                (typeof data.total === "number" ? data.total : 0) ||
                0;
            }
          } catch {
            // Error fetching offer stats
          }
        }
      } catch {
        // Error fetching offers - try stats endpoint as fallback
        try {
          const offersResponse = await offerService.getStats();
          if (offersResponse.success && offersResponse.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = offersResponse.data as any;
            total =
              parseInt(data.total_offers as string) ||
              parseInt(data.totalOffers as string) ||
              parseInt(data.total as string) ||
              (typeof data.total === "number" ? data.total : 0) ||
              0;
          }
        } catch {
          // Error fetching offer stats
        }
      }

      setOfferStats({ total, active, expired, pendingApproval });
    } catch {
      setOfferStats({ total: 0, active: 0, expired: 0, pendingApproval: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfferStats();
  }, [fetchOfferStats, location.key]);

  // Load offers on component mount, filter changes, or when navigating back to this page
  useEffect(() => {
    loadOffers(true); // Always skip cache for fresh data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters,
    selectedStatus,
    selectedApproval,
    debouncedSearchTerm,
    location.key,
  ]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status: OfferStatusEnum | "all") => {
    setSelectedStatus(status);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setShowAdvancedFilters(false);
      setIsClosingModal(false);
    }, 300); // Match the transition duration
  };

  const handleApprovalFilter = (approval: string | "all") => {
    setSelectedApproval(approval);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (
    key: keyof SearchParams,
    value: string | number | boolean | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleViewOffer = (id: number) => {
    navigate(`/dashboard/offers/${id}`);
  };

  const handleEditOffer = (id: number) => {
    navigate(`/dashboard/offers/${id}/edit`);
  };

  const handleCopyOfferId = (id: number) => {
    navigator.clipboard.writeText(id.toString());
    success("Copied", "Offer ID copied to clipboard");
  };

  // Calculate dropdown position
  const handleActionMenuToggle = (
    offerId: number,
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (showActionMenu === offerId) {
      setShowActionMenu(null);
      setDropdownPosition(null);
    } else {
      setShowActionMenu(offerId);

      // Calculate position from the clicked button - always display below
      if (event && event.currentTarget) {
        const button = event.currentTarget;
        const buttonRect = button.getBoundingClientRect();
        const dropdownWidth = 288; // w-72 = 288px
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
              document.body.scrollHeight
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
              updatedSpaceBelow + 100
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

  // Close dropdown when clicking outside
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

  const handleDeleteOffer = (id: number, name: string) => {
    setOfferToDelete({ id, name });
    setShowDeleteModal(true);
    setShowActionMenu(null);
  };

  const confirmDeleteOffer = async () => {
    if (!offerToDelete) return;

    try {
      setIsDeleting(true);
      await offerService.deleteOffer(offerToDelete.id);
      success(
        "Offer Deleted",
        `"${offerToDelete.name}" has been deleted successfully.`
      );
      await loadOffers(true); // Skip cache for immediate update
      fetchOfferStats(); // Refresh stats cards
      setShowDeleteModal(false);
      setOfferToDelete(null);
    } catch {
      showError("Error", "Failed to delete offer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivateOffer = async (id: number) => {
    try {
      setLoadingAction({ offerId: id, action: "activate" });
      const response = await offerService.activateOffer(id);

      // Optimistically update the offer in the list
      const responseData = response as unknown as {
        success: boolean;
        data?: { lifecycle_status?: string };
      };
      if (responseData.success && responseData.data?.lifecycle_status) {
        const newStatus = responseData.data.lifecycle_status;
        setOffers((prevOffers) =>
          prevOffers.map((offer) =>
            Number(offer.id) === id
              ? { ...offer, lifecycle_status: newStatus as string }
              : offer
          )
        );
      } else {
        // Fallback: reload if response doesn't include status
        await loadOffers(true);
      }

      success("Offer Activated", "Offer has been activated successfully.");
      setShowActionMenu(null);
      fetchOfferStats(); // Refresh stats cards
    } catch {
      showError("Error", "Failed to activate offer");
      // Activate offer error
    } finally {
      setLoadingAction(null);
    }
  };

  // const handleDeactivateOffer = async (id: number) => {
  //   try {
  //     setLoadingAction({ offerId: id, action: "deactivate" });
  //     const response = await offerService.deactivateOffer(id);

  //     // Optimistically update the offer in the list
  //     const responseData = response as unknown as {
  //       success: boolean;
  //       data?: { lifecycle_status?: string };
  //     };
  //     if (responseData.success && responseData.data?.lifecycle_status) {
  //       const newStatus = responseData.data.lifecycle_status;
  //       setOffers((prevOffers) =>
  //         prevOffers.map((offer) =>
  //           Number(offer.id) === id
  //             ? { ...offer, lifecycle_status: newStatus as string }
  //             : offer
  //         )
  //       );
  //     } else {
  //       // Fallback: reload if response doesn't include status
  //       await loadOffers(true);
  //     }

  //     success("Offer Deactivated", "Offer has been deactivated successfully.");
  //     setShowActionMenu(null);
  //   } catch (err) {
  //     showError("Error", "Failed to deactivate offer");
  // Deactivate offer error
  //   } finally {
  //     setLoadingAction(null);
  //   }
  // };

  const handlePauseOffer = async (id: number) => {
    try {
      setLoadingAction({ offerId: id, action: "pause" });
      const response = await offerService.pauseOffer(id);

      // Optimistically update the offer in the list
      const responseData = response as unknown as {
        success: boolean;
        data?: { lifecycle_status?: string };
      };
      if (responseData.success && responseData.data?.lifecycle_status) {
        const newStatus = responseData.data.lifecycle_status;
        setOffers((prevOffers) =>
          prevOffers.map((offer) =>
            Number(offer.id) === id
              ? { ...offer, lifecycle_status: newStatus as string }
              : offer
          )
        );
      } else {
        // Fallback: reload if response doesn't include status
        await loadOffers(true);
      }

      success("Offer Paused", "Offer has been paused successfully.");
      setShowActionMenu(null);
      fetchOfferStats(); // Refresh stats cards
    } catch {
      showError("Error", "Failed to pause offer");
      // Pause offer error
    } finally {
      setLoadingAction(null);
    }
  };

  const handleArchiveOffer = async (id: number) => {
    try {
      setLoadingAction({ offerId: id, action: "archive" });
      await offerService.archiveOffer(id);
      success("Offer Archived", "Offer has been archived successfully.");
      await loadOffers(true); // Skip cache for immediate update
      fetchOfferStats(); // Refresh stats cards
      setShowActionMenu(null);
    } catch {
      showError("Error", "Failed to archive offer");
      // Archive offer error
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExpireOffer = async (id: number) => {
    try {
      setLoadingAction({ offerId: id, action: "expire" });
      const response = await offerService.expireOffer(id);

      // Optimistically update the offer in the list
      const responseData = response as unknown as {
        success: boolean;
        data?: { lifecycle_status?: string };
      };
      if (responseData.success && responseData.data?.lifecycle_status) {
        const newStatus = responseData.data.lifecycle_status;
        setOffers((prevOffers) =>
          prevOffers.map((offer) =>
            Number(offer.id) === id
              ? { ...offer, lifecycle_status: newStatus as string }
              : offer
          )
        );
      } else {
        // Fallback: reload if response doesn't include status
        await loadOffers(true);
      }

      success("Offer Expired", "Offer has been expired successfully.");
      setShowActionMenu(null);
      fetchOfferStats(); // Refresh stats cards
    } catch {
      showError("Error", "Failed to expire offer");
      // Expire offer error
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRequestApproval = async (id: number) => {
    try {
      setLoadingAction({ offerId: id, action: "request_approval" });
      await offerService.requestApproval(id);
      success(
        "Approval Requested",
        "Approval request has been sent successfully."
      );
      await loadOffers(true); // Skip cache for immediate update
      fetchOfferStats(); // Refresh stats cards
      setShowActionMenu(null);
    } catch {
      showError("Error", "Failed to request approval");
      // Request approval error
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApproveOffer = async (id: number) => {
    if (!user?.user_id) {
      showError("Error", "User ID not available. Please log in again.");
      return;
    }
    try {
      setLoadingAction({ offerId: id, action: "approve" });
      await offerService.approveOffer(id, { approved_by: user.user_id });
      success("Offer Approved", "Offer has been approved successfully.");
      await loadOffers(true); // Skip cache for immediate update
      fetchOfferStats(); // Refresh stats cards
      setShowActionMenu(null);
    } catch {
      showError("Error", "Failed to approve offer");
      // Approve offer error
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRejectOffer = async (id: number) => {
    if (!user?.user_id) {
      showError("Error", "User ID not available. Please log in again.");
      return;
    }
    try {
      setLoadingAction({ offerId: id, action: "reject" });
      await offerService.rejectOffer(id, { rejected_by: user.user_id });
      success("Offer Rejected", "Offer has been rejected.");
      await loadOffers(true); // Skip cache for immediate update
      setShowActionMenu(null);
    } catch {
      showError("Error", "Failed to reject offer");
      // Reject offer error
    } finally {
      setLoadingAction(null);
    }
  };

  // TODO: Backend doesn't support these endpoints yet (404 Not Found)
  // const handleViewApprovalHistory = (id: number) => {
  //   navigate(`/dashboard/offers/${id}/approval-history`);
  //   setShowActionMenu(null);
  // };

  // const handleViewLifecycleHistory = (id: number) => {
  //   navigate(`/dashboard/offers/${id}/lifecycle-history`);
  //   setShowActionMenu(null);
  // };

  // Helper functions for display

  const getStatusBadge = (status: OfferStatusEnum) => {
    switch (status) {
      case OfferStatusEnum.DRAFT:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-[${color.surface.cards}] text-[${color.text.primary}]`}
          >
            Draft
          </span>
        );
      case OfferStatusEnum.ACTIVE:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-[${color.status.success}] text-[${color.status.success}]`}
          >
            Active
          </span>
        );
      case OfferStatusEnum.PAUSED:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-[${color.status.warning}] text-[${color.status.warning}]`}
          >
            Paused
          </span>
        );
      case OfferStatusEnum.EXPIRED:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-[${color.status.danger}] text-[${color.status.danger}]`}
          >
            Expired
          </span>
        );
      case OfferStatusEnum.ARCHIVED:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-[${color.surface.cards}] text-[${color.text.primary}]`}
          >
            Archived
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-[${color.surface.cards}] text-[${color.text.primary}]`}
          >
            {status}
          </span>
        );
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-[${color.status.warning}]/10 text-[${color.status.warning}]`}
          >
            Pending
          </span>
        );
      case "approved":
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-[${color.status.success}]/10 text-[${color.status.success}]`}
          >
            Approved
          </span>
        );
      case "rejected":
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-[${color.status.danger}]/10 text-[${color.status.danger}]`}
          >
            Rejected
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium bg-[${color.surface.cards}] text-[${color.text.primary}]`}
          >
            {status}
          </span>
        );
    }
  };

  // Filter offers based on search term
  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      !searchTerm ||
      offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || offer.status === selectedStatus;
    const matchesApproval =
      selectedApproval === "all" ||
      (offer.status === "approved"
        ? "approved"
        : offer.status === "rejected"
        ? "rejected"
        : "pending") === selectedApproval;

    return matchesSearch && matchesStatus && matchesApproval;
  });

  // Offer stats cards data
  const offerStatsCards = [
    {
      name: "Total Offers",
      value: offerStats?.total?.toLocaleString() || "0",
      icon: Package,
      color: color.tertiary.tag1, // Purple
    },
    {
      name: "Active Offers",
      value: offerStats?.active?.toLocaleString() || "0",
      icon: CheckCircle,
      color: color.tertiary.tag4, // Green
    },
    {
      name: "Expired Offers",
      value: offerStats?.expired?.toLocaleString() || "0",
      icon: Clock,
      color: color.tertiary.tag3, // Yellow
    },
    {
      name: "Draft",
      value: offerStats?.pendingApproval?.toLocaleString() || "0",
      icon: AlertCircle,
      color: color.tertiary.tag2, // Coral
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            {t.pages.offers}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {t.pages.offersDescription}
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/offers/create")}
          className={`inline-flex items-center px-4 py-2 text-sm font-semibold ${tw.rounded} shadow-sm transition-all duration-200 text-white`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.pages.createOffer}
        </button>
      </div>

      {/* Offer Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {offerStatsCards.map((stat) => {
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
        <div className="relative flex-1">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[${color.text.muted}]`}
          />
          <input
            type="text"
            placeholder="Search offers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(searchTerm)}
            className={`w-full pl-10 pr-4 py-3 border ${tw.borderDefault} ${tw.rounded} focus:outline-none transition-all duration-200 bg-white focus:ring-2 focus:ring-[${color.primary.accent}]/20`}
          />
        </div>

        <HeadlessSelect
          options={[
            { value: "", label: "All Categories" },
            ...categories.map((category) => ({
              value: category.id.toString(),
              label: category.name,
            })),
          ]}
          value={filters.categoryId?.toString() || ""}
          onChange={(value) =>
            handleFilterChange("categoryId", value ? Number(value) : undefined)
          }
          placeholder="All Categories"
          className=""
        />

        <HeadlessSelect
          options={[
            { value: "all", label: "All Status" },
            { value: OfferStatusEnum.DRAFT, label: "Draft" },
            { value: OfferStatusEnum.ACTIVE, label: "Active" },
            { value: OfferStatusEnum.PAUSED, label: "Paused" },
            { value: OfferStatusEnum.EXPIRED, label: "Expired" },
            { value: OfferStatusEnum.ARCHIVED, label: "Archived" },
          ]}
          value={selectedStatus}
          onChange={(value) =>
            handleStatusFilter((value as OfferStatusEnum | "all") || "all")
          }
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

      {/* Offers Table */}
      <div
        className={` ${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner
              variant="modern"
              size="xl"
              color="primary"
              className="mb-4"
            />
            <p className={`${tw.textMuted} font-medium text-sm`}>
              Loading offers...
            </p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className={`${tw.textSecondary}`}>No offers found</p>
              <button
                onClick={() => navigate("/dashboard/offers/create")}
                className={`mt-4 inline-flex items-center px-3 py-2 text-base text-white font-semibold ${tw.rounded} shadow-sm transition-all duration-200`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Offer
              </button>
            </div>
          </div>
        ) : (
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
                    Offer
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Category
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Approval
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Created
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer) => (
                  <tr key={offer.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div>
                        <div
                          className={`font-semibold text-sm sm:text-base ${tw.textPrimary} truncate`}
                          title={offer.name}
                        >
                          {offer.name}
                        </div>
                        {offer.description && (
                          <div
                            className={`text-xs sm:text-sm ${tw.textMuted} truncate mt-1`}
                            title={offer.description}
                          >
                            {offer.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span
                        className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                          getCategoryName(offer.category_id) === "Data Offers"
                            ? `bg-[${color.status.info}]/10 text-[${color.status.info}]`
                            : getCategoryName(offer.category_id) ===
                              "Voice Offers"
                            ? `bg-[${color.status.success}]/10 text-[${color.status.success}]`
                            : getCategoryName(offer.category_id) ===
                              "Combo Offers"
                            ? `bg-[${color.primary.accent}]/10 text-[${color.primary.accent}]`
                            : getCategoryName(offer.category_id) ===
                              "Loyalty Rewards"
                            ? `bg-[${color.status.warning}]/10 text-[${color.status.warning}]`
                            : getCategoryName(offer.category_id) ===
                              "Promotional"
                            ? `bg-[${color.primary.action}]/10 text-[${color.primary.action}]`
                            : `bg-[${color.surface.cards}] text-[${color.text.primary}]`
                        }`}
                      >
                        {getCategoryName(offer.category_id)}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {getStatusBadge(offer.status)}
                    </td>
                    <td
                      className="px-6 py-4 hidden lg:table-cell"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {getApprovalBadge(
                        offer.status === "approved"
                          ? "approved"
                          : offer.status === "rejected"
                          ? "rejected"
                          : "pending"
                      )}
                    </td>
                    <td
                      className={`px-6 py-4 hidden md:table-cell text-sm ${tw.textMuted}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {offer.created_at ? (
                        <DateFormatter date={offer.created_at} />
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td
                      className="px-6 py-4 text-sm font-medium"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {/* Play/Pause buttons - Only show if approved (not draft, not expired/archived) */}
                        {offer.status === OfferStatusEnum.APPROVED && (
                          <>
                            {offer.lifecycle_status === "paused" ? (
                              <button
                                onClick={() =>
                                  offer.id &&
                                  handleActivateOffer(Number(offer.id))
                                }
                                disabled={
                                  loadingAction?.offerId === Number(offer.id) &&
                                  loadingAction?.action === "activate"
                                }
                                className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-green-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                                style={{ backgroundColor: "transparent" }}
                                onMouseLeave={(e) => {
                                  (
                                    e.target as HTMLButtonElement
                                  ).style.backgroundColor = "transparent";
                                }}
                                title="Resume Offer"
                              >
                                {loadingAction?.offerId === Number(offer.id) &&
                                loadingAction?.action === "activate" ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                ) : (
                                  <Play className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                                )}
                              </button>
                            ) : offer.lifecycle_status === "active" ? (
                              <button
                                onClick={() =>
                                  offer.id && handlePauseOffer(Number(offer.id))
                                }
                                disabled={
                                  loadingAction?.offerId === Number(offer.id) &&
                                  loadingAction?.action === "pause"
                                }
                                className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                                style={{ backgroundColor: "transparent" }}
                                onMouseLeave={(e) => {
                                  (
                                    e.target as HTMLButtonElement
                                  ).style.backgroundColor = "transparent";
                                }}
                                title="Pause Offer"
                              >
                                {loadingAction?.offerId === Number(offer.id) &&
                                loadingAction?.action === "pause" ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                ) : (
                                  <Pause className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                                )}
                              </button>
                            ) : null}
                          </>
                        )}

                        <button
                          onClick={() => offer.id && handleViewOffer(offer.id)}
                          className={`text-[${color.status.info}] hover:text-[${color.status.info}] p-1 rounded`}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => offer.id && handleEditOffer(offer.id)}
                          className={`${tw.textMuted} hover:${tw.textPrimary} p-1 rounded`}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            offer.id && handleCopyOfferId(offer.id)
                          }
                          className={`${tw.textMuted} hover:${tw.textPrimary} p-1 rounded`}
                          title="Copy ID"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <div
                          className="relative"
                          ref={(el) => {
                            actionMenuRefs.current[offer.id!] = el;
                          }}
                        >
                          <button
                            onClick={(e) =>
                              offer.id && handleActionMenuToggle(offer.id, e)
                            }
                            className={`${tw.textMuted} hover:${tw.textPrimary} p-1 rounded`}
                            title="More Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Render dropdown menus via portal outside the table */}
                {filteredOffers.map((offer) => {
                  if (showActionMenu === offer.id && dropdownPosition) {
                    return createPortal(
                      <div
                        ref={(el) => {
                          dropdownMenuRefs.current[offer.id!] = el;
                        }}
                        className={`fixed bg-white border border-gray-200 ${tw.rounded} shadow-xl py-2 pb-4 w-72`}
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
                        {/* Duplicate Offer */}
                        {/* TODO: Re-enable when backend duplicate endpoint is available
                              <button
                                onClick={handleDuplicateOffer}
                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Copy className="w-4 h-4 mr-3" style={{ color: color.primary.action }} />
                                Duplicate Offer
                              </button>
                              */}

                        {/* Approved: Activate or Archive only */}
                        {offer.status === OfferStatusEnum.APPROVED && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (offer.id) {
                                  handleActivateOffer(Number(offer.id));
                                  setShowActionMenu(null);
                                }
                              }}
                              disabled={
                                loadingAction?.offerId === Number(offer.id) &&
                                loadingAction?.action === "activate"
                              }
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Play className="w-4 h-4 mr-3 text-green-600" />
                              Activate Offer
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (offer.id) {
                                  handleArchiveOffer(offer.id);
                                  setShowActionMenu(null);
                                }
                              }}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Archive
                                className="w-4 h-4 mr-3"
                                style={{ color: color.primary.action }}
                              />
                              Archive Offer
                            </button>
                          </>
                        )}

                        {/* Active: Pause, Expire, Archive */}
                        {/* Note: Deactivate (to draft) is not allowed from active status */}
                        {offer.status === OfferStatusEnum.ACTIVE && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (offer.id) {
                                  handlePauseOffer(Number(offer.id));
                                  setShowActionMenu(null);
                                }
                              }}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Pause className="w-4 h-4 mr-3 text-yellow-600" />
                              Pause Offer
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (offer.id) {
                                  handleExpireOffer(offer.id);
                                  setShowActionMenu(null);
                                }
                              }}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Clock className="w-4 h-4 mr-3 text-gray-600" />
                              Expire Offer
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (offer.id) {
                                  handleArchiveOffer(offer.id);
                                  setShowActionMenu(null);
                                }
                              }}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Archive
                                className="w-4 h-4 mr-3"
                                style={{ color: color.primary.action }}
                              />
                              Archive Offer
                            </button>
                          </>
                        )}

                        {/* Paused: Resume, Archive */}
                        {offer.status === OfferStatusEnum.PAUSED && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (offer.id) {
                                  handleActivateOffer(Number(offer.id));
                                  setShowActionMenu(null);
                                }
                              }}
                              disabled={
                                loadingAction?.offerId === Number(offer.id) &&
                                loadingAction?.action === "activate"
                              }
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Play className="w-4 h-4 mr-3 text-green-600" />
                              Resume Offer
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (offer.id) {
                                  handleArchiveOffer(offer.id);
                                  setShowActionMenu(null);
                                }
                              }}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Archive
                                className="w-4 h-4 mr-3"
                                style={{ color: color.primary.action }}
                              />
                              Archive Offer
                            </button>
                          </>
                        )}

                        {/* Draft: Submit for Approval */}
                        {offer.status === OfferStatusEnum.DRAFT && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (offer.id) {
                                handleRequestApproval(offer.id);
                                setShowActionMenu(null);
                              }
                            }}
                            className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <AlertCircle
                              className="w-4 h-4 mr-3"
                              style={{ color: color.status.info }}
                            />
                            Submit for Approval
                          </button>
                        )}

                        {/* Pending Approval: Approve/Reject */}
                        {offer.status === OfferStatusEnum.PENDING_APPROVAL && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (offer.id) {
                                  handleApproveOffer(offer.id);
                                  setShowActionMenu(null);
                                }
                              }}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 mr-3 text-green-600" />
                              Approve Offer
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (offer.id) {
                                  handleRejectOffer(offer.id);
                                  setShowActionMenu(null);
                                }
                              }}
                              className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <XCircle className="w-4 h-4 mr-3 text-red-600" />
                              Reject Offer
                            </button>
                          </>
                        )}

                        {/* Rejected: Request Approval (to resubmit) */}
                        {offer.status === OfferStatusEnum.REJECTED && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (offer.id) {
                                handleRequestApproval(offer.id);
                                setShowActionMenu(null);
                              }
                            }}
                            className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <AlertCircle
                              className="w-4 h-4 mr-3"
                              style={{ color: color.status.info }}
                            />
                            Request Approval
                          </button>
                        )}

                        {/* History Links */}
                        {/* TODO: Backend doesn't support these endpoints yet (404 Not Found) */}
                        {/* <button
                                onClick={() =>
                                  offer.id &&
                                  handleViewApprovalHistory(offer.id)
                                }
                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <CheckCircle
                                  className="w-4 h-4 mr-3"
                                  style={{ color: color.primary.action }}
                                />
                                Approval History
                              </button>

                              <button
                                onClick={() =>
                                  offer.id &&
                                  handleViewLifecycleHistory(offer.id)
                                }
                                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Clock
                                  className="w-4 h-4 mr-3"
                                  style={{ color: color.primary.action }}
                                />
                                Lifecycle History
                              </button> */}

                        {/* Delete - Dangerous Action */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (offer.id) {
                              handleDeleteOffer(offer.id, offer.name);
                              setShowActionMenu(null);
                            }
                          }}
                          className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          Delete Offer
                        </button>
                      </div>,
                      document.body
                    );
                  }
                  // Clean up ref when dropdown is closed
                  if (dropdownMenuRefs.current[offer.id!]) {
                    dropdownMenuRefs.current[offer.id!] = null;
                  }
                  return null;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredOffers.length > 0 && (
        <div
          className={`bg-white ${tw.rounded} shadow-sm border border-[${color.border.default}] px-4 sm:px-6 py-4`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div
              className={`text-base ${tw.textSecondary} text-center sm:text-left`}
            >
              Showing {((filters.page || 1) - 1) * (filters.pageSize || 10) + 1}{" "}
              to{" "}
              {Math.min(
                (filters.page || 1) * (filters.pageSize || 10),
                totalOffers
              )}{" "}
              of {totalOffers} offers
            </div>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.max(1, (prev.page || 1) - 1),
                  }))
                }
                disabled={(filters.page || 1) <= 1}
                className={`px-3 py-2 text-base border border-[${color.border.default}] ${tw.rounded} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
              >
                Previous
              </button>
              <span className={`text-base ${tw.textSecondary} px-2`}>
                Page {filters.page || 1} of{" "}
                {Math.ceil(totalOffers / (filters.pageSize || 10))}
              </span>
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: (prev.page || 1) + 1,
                  }))
                }
                disabled={
                  (filters.page || 1) >=
                  Math.ceil(totalOffers / (filters.pageSize || 10))
                }
                className={`px-3 py-2 text-base border border-[${color.border.default}] ${tw.rounded} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters Side Modal */}
      {(showAdvancedFilters || isClosingModal) &&
        createPortal(
          <div
            className={`fixed inset-0 overflow-hidden ${
              isClosingModal
                ? "animate-out fade-out duration-300"
                : "animate-in fade-in duration-300"
            }`}
            style={{ zIndex: zIndexTokens.overlay }}
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    Filter Offers
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
                {/* Status Filter */}
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-3`}
                  >
                    Status
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All Status" },
                      { value: OfferStatusEnum.DRAFT, label: "Draft" },
                      { value: OfferStatusEnum.ACTIVE, label: "Active" },
                      { value: OfferStatusEnum.PAUSED, label: "Paused" },
                      { value: OfferStatusEnum.EXPIRED, label: "Expired" },
                      { value: OfferStatusEnum.ARCHIVED, label: "Archived" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value={option.value}
                          checked={selectedStatus === option.value}
                          onChange={() =>
                            handleStatusFilter(
                              option.value as OfferStatusEnum | "all"
                            )
                          }
                          className={`mr-3 text-[${color.primary.action}] focus:ring-[${color.primary.action}]`}
                        />
                        <span className={`text-sm ${tw.textSecondary}`}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Approval Filter */}
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-3`}
                  >
                    Approval Status
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All Approval" },
                      { value: "pending", label: "Pending" },
                      { value: "approved", label: "Approved" },
                      { value: "rejected", label: "Rejected" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="approval"
                          value={option.value}
                          checked={selectedApproval === option.value}
                          onChange={() =>
                            handleApprovalFilter(option.value as string | "all")
                          }
                          className={`mr-3 text-[${color.primary.action}] focus:ring-[${color.primary.action}]`}
                        />
                        <span className={`text-sm ${tw.textSecondary}`}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedStatus("all");
                      setSelectedApproval("all");
                    }}
                    className={`flex-1 px-4 py-2 text-sm border border-gray-300 ${tw.textSecondary} ${tw.rounded} hover:bg-gray-50 transition-colors`}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => {
                      handleSearch(searchTerm);
                      handleCloseModal();
                    }}
                    className={`${tw.button} flex-1 px-4 py-2 text-sm`}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setOfferToDelete(null);
        }}
        onConfirm={confirmDeleteOffer}
        title="Delete Offer"
        description="Are you sure you want to delete this offer? This action cannot be undone."
        itemName={offerToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
