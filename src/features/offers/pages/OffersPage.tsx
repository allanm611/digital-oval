import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
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
  RotateCcw,
  Filter,
  AlertCircle,
  Package,
  Download,
} from "lucide-react";
import { Offer, SearchParams, OfferStatusEnum } from "../types/offer";
import { offerService } from "../services/offerService";
import { offerCategoryService } from "../services/offerCategoryService";
import {
  canShowOfferButton,
  handleOfferAction,
  type OfferActionParams,
} from "../utils/offerActions";
import { OfferCategoryType } from "../types/offerCategory";
import SearchInput from "../../../shared/components/ui/SearchInput";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import CreateButton from "../../../shared/components/ui/CreateButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { color, tw, button, zIndex } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import DateFormatter from "../../../shared/components/DateFormatter";
import Pagination from "../../../shared/components/ui/Pagination";
import { PermissionGate } from "../../auth/components/PermissionGate";
import Radio from "../../../shared/components/ui/Radio";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";

interface OfferTableRow {
  id: number;
  name: string;
  category: string;
  status: string;
  approval: string;
  created: string;
}

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
    limit: 15,
    sortBy: "created_at",
    sortDirection: "DESC",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OfferStatusEnum | "all">(
    "all",
  );
  const [selectedApproval, setSelectedApproval] = useState<string | "all">(
    "all",
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

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

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete } = useDeleteConfirm({
    onDelete: async (id) => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      await offerService.deleteOffer(numId);
      setOffers((prev) => prev.filter((o) => o.id !== numId));
      fetchOfferStats();
    },
    itemLabel: "Offer",
  });

  const defaultColumns: TableColumn<OfferTableRow>[] = [
    {
      id: "name",
      label: "Offer",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
      render: (_, row) => (
        <div className={`${tw.tableFirstColumn} ${tw.textPrimary} text-sm truncate`} title={row.name}>
          {row.name}
        </div>
      ),
    },
    {
      id: "category",
      label: "Category",
      visible: true,
      sortable: true,
      filterConfig: {
        type: 'select',
        options: categories.map(c => c.name)
      },
      render: (_, row) => (
        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-sm font-medium ${
          row.category === "Data Offers"
            ? `bg-[${color.status.info}]/10 text-[${color.status.info}]`
            : row.category === "Voice Offers"
              ? `bg-[${color.status.success}]/10 text-[${color.status.success}]`
              : row.category === "Combo Offers"
                ? `bg-[${color.primary.accent}]/10 text-[${color.primary.accent}]`
                : row.category === "Loyalty Rewards"
                  ? `bg-[${color.status.warning}]/10 text-[${color.status.warning}]`
                  : row.category === "Promotional"
                    ? `bg-[${color.primary.action}]/10 text-[${color.primary.action}]`
                    : `bg-[${color.surface.cards}] text-[${color.text.primary}]`
        }`}>
          {row.category}
        </span>
      ),
    },
    {
      id: "status",
      label: "Status",
      visible: true,
      sortable: true,
      filterConfig: {
        type: 'select',
        options: ['draft', 'active', 'paused', 'expired', 'archived']
      },
      render: (value) => getStatusBadge(value),
    },
    {
      id: "approval",
      label: "Approval",
      visible: true,
      sortable: true,
      filterConfig: {
        type: 'select',
        options: ['approved', 'rejected', 'pending']
      },
      render: (value) => getApprovalBadge(value),
    },
    {
      id: "created",
      label: "Created",
      visible: true,
      sortable: true,
      filterConfig: { type: 'date' },
      render: (value) => <DateFormatter date={value} useUserTimezone />,
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handleViewOffer(row.id)}
            className={`text-[${color.status.info}] hover:text-[${color.status.info}] p-1 rounded`}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <PermissionGate permission="offers.update">
            <button
              onClick={() => handleEditOffer(row.id)}
              className={`${tw.textMuted} hover:${tw.textPrimary} p-1 rounded`}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
          </PermissionGate>
          <div
            className="relative"
            ref={(el) => {
              actionMenuRefs.current[row.id] = el;
            }}
          >
            <button
              onClick={(e) => handleActionMenuToggle(row.id, e)}
              className={`${tw.textMuted} hover:${tw.textPrimary} p-1 rounded`}
              title="More Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      ),
    },
  ];

  const {
    columns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
    expandedRowId,
    setExpandedRowId,
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    sortConfigs,
    handleSort,
  } = useTable({
    tableId: "offers-table-v2",
    defaultColumns,
    persistToLocalStorage: true,
  });

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

      // Calculate offset from page number
      const pageSize = filters.limit || 15;
      const offset = (filters.page - 1) * pageSize;

      // If category filter is applied, use the specific category endpoint
      if (filters.categoryId) {
        const response = await offerService.getOffersByCategory(
          filters.categoryId,
          {
            limit: pageSize,
            offset: offset,
            skipCache: skipCache,
          },
        );

        if (response.success && response.data) {
          // Apply additional client-side filters if needed
          let filteredOffers = response.data;

          // Filter by status if selected
          if (selectedStatus && selectedStatus !== "all") {
            filteredOffers = filteredOffers.filter(
              (offer) => offer.status === selectedStatus,
            );
          } else if (selectedStatus === "all") {
            // By default, exclude archived and expired offers
            filteredOffers = filteredOffers.filter(
              (offer) =>
                offer.status !== OfferStatusEnum.ARCHIVED &&
                offer.status !== OfferStatusEnum.EXPIRED,
            );
          }

          // Filter by search term if provided
          if (debouncedSearchTerm) {
            const searchLower = debouncedSearchTerm.toLowerCase();
            filteredOffers = filteredOffers.filter(
              (offer) =>
                offer.name?.toLowerCase().includes(searchLower) ||
                offer.code?.toLowerCase().includes(searchLower) ||
                offer.description?.toLowerCase().includes(searchLower),
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
          let batchOffset = 0;
          const batchSize = 100;
          let hasMore = true;

          // Fetch all offers in batches
          while (hasMore) {
            const batchResponse = await offerService.searchOffers({
              limit: batchSize,
              offset: batchOffset,
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
              batchOffset += batchSize;
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
              (offer) => offer.status === selectedStatus,
            );
          } else if (selectedStatus === "all") {
            // By default, exclude archived and expired offers
            filteredOffers = filteredOffers.filter(
              (offer) =>
                offer.status !== OfferStatusEnum.ARCHIVED &&
                offer.status !== OfferStatusEnum.EXPIRED,
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
            limit: pageSize,
            offset: offset,
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
        "Unable to Load Offers",
        filters.categoryId
          ? "Unable to retrieve offers for this category. Please try again."
          : "Unable to retrieve offers. Please try again later.",
      );
    } catch (err) {
      // Only show error if it's an actual exception (network error, etc.)
      // Don't show duplicate error if response.success was false (handled above)
      showError("Unable to Load Offers", extractBackendError(err, "Unable to Load Offers. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  // Helper to get category name from category_id
  const getCategoryName = (categoryId: string | number | undefined): string => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(
      (cat) => String(cat.id) === String(categoryId),
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
              offer.status === OfferStatusEnum.APPROVED,
          ).length;

          // Expired offers
          expired = allOffers.filter(
            (offer) => offer.status === OfferStatusEnum.EXPIRED,
          ).length;

          // Pending approval = pending_approval + draft
          pendingApproval = allOffers.filter(
            (offer) =>
              offer.status === OfferStatusEnum.PENDING_APPROVAL ||
              offer.status === OfferStatusEnum.DRAFT,
          ).length;
        } else {
          // Fallback: try stats endpoint
          try {
            const offersResponse = await offerService.getStats();
            if (offersResponse.success && offersResponse.data) {
               
              const data = offersResponse.data as {
                total_offers?: string | number;
                totalOffers?: string | number;
                total?: string | number;
              };
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
            const data = offersResponse.data as {
              total_offers?: string | number;
              totalOffers?: string | number;
              total?: string | number;
            };
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
    value: string | number | boolean | undefined,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleViewOffer = (id: number) => {
    navigate(`/dashboard/offers/${id}`);
  };

  const handleEditOffer = (id: number) => {
    navigate(`/dashboard/offers/${id}/edit`);
  };

  const handleExportCSV = () => {
    if (filteredOffers.length === 0) {
      showError("No offers to export", "There are no offers to export");
      return;
    }

    const headers = ["ID", "Name", "Category", "Status", "Approval", "Created"];
    const rows = filteredOffers.map((offer) => [
      offer.id || "",
      offer.name || "",
      getCategoryName(offer.category_id),
      offer.status || "",
      offer.status === "approved"
        ? "approved"
        : offer.status === "rejected"
          ? "rejected"
          : "pending",
      offer.created_at || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `offers_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate dropdown position
  const handleActionMenuToggle = (
    offerId: number,
    event?: React.MouseEvent<HTMLButtonElement>,
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

  const handleDeleteOffer = (id: number, name: string) => {
    openDeleteConfirm(id, name);
    setShowActionMenu(null);
  };

  // Consolidated offer action handler
  interface OfferActionParams {
    offerId: number;
    offerName: string;
    action:
      | "activate"
      | "pause"
      | "archive"
      | "unarchive"
      | "approve"
      | "reject";
    successMessage: string;
    updateFields: Partial<Offer>;
  }

  const handleOfferAction = async (params: OfferActionParams) => {
    const { offerId, offerName, action, successMessage, updateFields } = params;

    try {
      setLoadingAction({ offerId, action });

      switch (action) {
        case "activate":
          await offerService.activateOffer(offerId);
          break;
        case "pause":
          await offerService.pauseOffer(offerId);
          break;
        case "archive":
          await offerService.archiveOffer(offerId);
          break;
        case "unarchive":
          await offerService.unarchiveOffer(offerId);
          break;
        case "approve":
          await offerService.approveOffer(offerId);
          break;
        case "reject":
          await offerService.rejectOffer(offerId);
          break;
      }

      // Update offer in list (optimistic UI)
      setOffers((prevOffers) =>
        prevOffers.map((offer) =>
          Number(offer.id) === offerId ? { ...offer, ...updateFields } : offer,
        ),
      );

      success(successMessage.split(":")[0], successMessage);
      setShowActionMenu(null);
      fetchOfferStats(); // Refresh stats cards
    } catch (err) {
      const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
      showError(`Unable to ${actionLabel} Offer`, extractBackendError(err, `Failed to ${action} offer. Please try again later.`));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleActivateOffer = async (id: number) => {
    const offer = offers.find((o) => Number(o.id) === id);
    if (!offer) return;
    await handleOfferAction(
      {
        offerId: id,
        offerName: offer.name,
        action: "activate",
        successMessage:
          "Offer Activated: Offer has been activated successfully.",
        updateFields: { status: OfferStatusEnum.ACTIVE },
      },
      {
        onSetLoading: setLoadingAction,
        onCloseMenu: () => setShowActionMenu(null),
        onUpdateOffers: (offerId, updateFields) =>
          setOffers((prev) =>
            prev.map((o) =>
              Number(o.id) === offerId ? { ...o, ...updateFields } : o,
            ),
          ),
        onSuccess: success,
        onError: showError,
        onRefreshStats: fetchOfferStats,
      },
    );
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
    const offer = offers.find((o) => Number(o.id) === id);
    if (!offer) return;
    await handleOfferAction(
      {
        offerId: id,
        offerName: offer.name,
        action: "pause",
        successMessage: "Offer Paused: Offer has been paused successfully.",
        updateFields: { status: OfferStatusEnum.PAUSED },
      },
      {
        onSetLoading: setLoadingAction,
        onCloseMenu: () => setShowActionMenu(null),
        onUpdateOffers: (offerId, updateFields) =>
          setOffers((prev) =>
            prev.map((o) =>
              Number(o.id) === offerId ? { ...o, ...updateFields } : o,
            ),
          ),
        onSuccess: success,
        onError: showError,
        onRefreshStats: fetchOfferStats,
      },
    );
  };

  const handleArchiveOffer = async (id: number) => {
    const offer = offers.find((o) => Number(o.id) === id);
    if (!offer) return;
    await handleOfferAction(
      {
        offerId: id,
        offerName: offer.name,
        action: "archive",
        successMessage: "Offer Archived: Offer has been archived successfully.",
        updateFields: { status: OfferStatusEnum.ARCHIVED },
      },
      {
        onSetLoading: setLoadingAction,
        onCloseMenu: () => setShowActionMenu(null),
        onUpdateOffers: (offerId, updateFields) =>
          setOffers((prev) =>
            prev.map((o) =>
              Number(o.id) === offerId ? { ...o, ...updateFields } : o,
            ),
          ),
        onSuccess: success,
        onError: showError,
        onRefreshStats: fetchOfferStats,
      },
    );
  };

  const handleUnarchiveOffer = async (id: number) => {
    const offer = offers.find((o) => Number(o.id) === id);
    if (!offer) return;
    await handleOfferAction(
      {
        offerId: id,
        offerName: offer.name,
        action: "unarchive",
        successMessage:
          "Offer Unarchived: Offer has been unarchived successfully.",
        updateFields: { status: OfferStatusEnum.DRAFT },
      },
      {
        onSetLoading: setLoadingAction,
        onCloseMenu: () => setShowActionMenu(null),
        onUpdateOffers: (offerId, updateFields) =>
          setOffers((prev) =>
            prev.map((o) =>
              Number(o.id) === offerId ? { ...o, ...updateFields } : o,
            ),
          ),
        onSuccess: success,
        onError: showError,
        onRefreshStats: fetchOfferStats,
      },
    );
  };

  const handleExpireOffer = async (id: number) => {
    try {
      setLoadingAction({ offerId: id, action: "expire" });
      await offerService.expireOffer(id);
      setOffers((prevOffers) =>
        prevOffers.map((offer) =>
          Number(offer.id) === id
            ? { ...offer, status: OfferStatusEnum.EXPIRED }
            : offer,
        ),
      );
      success("Offer Expired", "Offer has been expired successfully.");
      setShowActionMenu(null);
      fetchOfferStats();
    } catch {
      showError("Error", "Failed to expire offer");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRequestApproval = async (id: number) => {
    try {
      setLoadingAction({ offerId: id, action: "request_approval" });
      await offerService.requestApproval(id);
      setOffers((prevOffers) =>
        prevOffers.map((offer) =>
          Number(offer.id) === id
            ? {
                ...offer,
                status: OfferStatusEnum.PENDING_APPROVAL,
                approval_status: "pending",
              }
            : offer,
        ),
      );
      success(
        "Approval Requested",
        "Approval request has been sent successfully.",
      );
      setShowActionMenu(null);
      fetchOfferStats();
    } catch {
      showError("Error", "Failed to request approval");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApproveOffer = async (id: number) => {
    if (!user?.user_id) {
      showError("Error", "User ID not available. Please log in again.");
      return;
    }
    const offer = offers.find((o) => Number(o.id) === id);
    if (!offer) return;
    await handleOfferAction(
      {
        offerId: id,
        offerName: offer.name,
        action: "approve",
        successMessage: "Offer Approved: Offer has been approved successfully.",
        updateFields: {
          status: OfferStatusEnum.APPROVED,
          approval_status: "approved",
        },
        userId: user.user_id,
      },
      {
        onSetLoading: setLoadingAction,
        onCloseMenu: () => setShowActionMenu(null),
        onUpdateOffers: (offerId, updateFields) =>
          setOffers((prev) =>
            prev.map((o) =>
              Number(o.id) === offerId ? { ...o, ...updateFields } : o,
            ),
          ),
        onSuccess: success,
        onError: showError,
        onRefreshStats: fetchOfferStats,
      },
    );
  };

  const handleRejectOffer = async (id: number) => {
    if (!user?.user_id) {
      showError("Error", "User ID not available. Please log in again.");
      return;
    }
    const offer = offers.find((o) => Number(o.id) === id);
    if (!offer) return;
    await handleOfferAction(
      {
        offerId: id,
        offerName: offer.name,
        action: "reject",
        successMessage: "Offer Rejected: Offer has been rejected.",
        updateFields: {
          status: OfferStatusEnum.REJECTED,
          approval_status: "rejected",
        },
        userId: user.user_id,
      },
      {
        onSetLoading: setLoadingAction,
        onCloseMenu: () => setShowActionMenu(null),
        onUpdateOffers: (offerId, updateFields) =>
          setOffers((prev) =>
            prev.map((o) =>
              Number(o.id) === offerId ? { ...o, ...updateFields } : o,
            ),
          ),
        onSuccess: success,
        onError: showError,
        onRefreshStats: fetchOfferStats,
      },
    );
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
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[${color.surface.cards}] text-[${color.text.primary}]`}
          >
            draft
          </span>
        );
      case OfferStatusEnum.ACTIVE:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[${color.status.success}] text-[${color.status.success}]`}
          >
            active
          </span>
        );
      case OfferStatusEnum.PAUSED:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[${color.status.warning}] text-[${color.status.warning}]`}
          >
            paused
          </span>
        );
      case OfferStatusEnum.EXPIRED:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[${color.status.danger}] text-[${color.status.danger}]`}
          >
            expired
          </span>
        );
      case OfferStatusEnum.ARCHIVED:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[${color.surface.cards}] text-[${color.text.primary}]`}
          >
            archived
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[${color.surface.cards}] text-[${color.text.primary}]`}
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
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[${color.status.warning}]/10 text-[${color.status.warning}]`}
          >
            pending
          </span>
        );
      case "approved":
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[${color.status.success}]/10 text-[${color.status.success}]`}
          >
            approved
          </span>
        );
      case "rejected":
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[${color.status.danger}]/10 text-[${color.status.danger}]`}
          >
            rejected
          </span>
        );
      default:
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-[${color.surface.cards}] text-[${color.text.primary}]`}
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
      (offer.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.description || "").toLowerCase().includes(searchTerm.toLowerCase());

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
        <PermissionGate permission="offers.create">
          <CreateButton route="/dashboard/offers/create" />
        </PermissionGate>
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
        <SearchInput
          placeholder="Search offers..."
          value={searchTerm}
          onChange={setSearchTerm}
          onKeyDown={(e) => e.key === "Enter" && handleSearch(searchTerm)}
        />

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

        <button
          onClick={handleExportCSV}
          className={`flex items-center gap-2 ${tw.rounded} transition-colors font-medium`}
          style={{
            backgroundColor: button.action.background,
            color: button.action.color,
            border: button.action.border,
            padding: `${button.action.paddingY} ${button.action.paddingX}`,
            borderRadius: button.action.borderRadius,
            fontSize: button.action.fontSize,
          }}
          title="Download as CSV"
        >
          <Download className="h-4 w-4" />
          <span>Download CSV</span>
        </button>
      </div>

      {/* Offers Table */}
      <div className={`${tw.rounded} overflow-hidden`}>
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
              <div className="mt-4">
                <PermissionGate permission="offers.create">
                  <CreateButton route="/dashboard/offers/create" />
                </PermissionGate>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table<OfferTableRow>
                columns={columns}
                data={filteredOffers.map((offer) => ({
                  id: offer.id || 0,
                  name: offer.name || "",
                  category: getCategoryName(offer.category_id),
                  status: offer.status,
                  approval:
                    offer.status === "approved"
                      ? "approved"
                      : offer.status === "rejected"
                        ? "rejected"
                        : "pending",
                  created: offer.created_at,
                }))}
                totalItems={filteredOffers.length}
                currentPage={tableCurrentPage}
                pageSize={tablePageSize}
                isLoading={loading}
                onPageChange={tableHandlePageChange}
                onSort={handleSort}
                sortConfigs={sortConfigs}
                onHideColumn={toggleColumn}
                onManageColumnsClick={() => setShowColumnPicker(true)}
                expandedRowId={expandedRowId}
                onExpandChange={setExpandedRowId}
                expandedContent={(row) => {
                  const offer = filteredOffers.find(o => o.id === row.id);
                  return offer ? (
                    <div className="p-4 bg-gray-50 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600">Description</p>
                          <p className="text-sm text-gray-900">{offer.description || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600">Type</p>
                          <p className="text-sm text-gray-900">{offer.offer_type || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600">Start Date</p>
                          <p className="text-sm text-gray-900">{offer.start_date ? <DateFormatter date={offer.start_date} useLocale year="numeric" month="short" day="numeric" /> : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600">End Date</p>
                          <p className="text-sm text-gray-900">{offer.end_date ? <DateFormatter date={offer.end_date} useLocale year="numeric" month="short" day="numeric" /> : "—"}</p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                }}
                style={{
                  headerBackground: color.surface.tableHeader,
                  headerTextColor: color.surface.tableHeaderText,
                  rowBackground: color.surface.tablebodybg,
                  rowSpacing: "0 8px",
                }}
              />
            </div>

            {/* Pagination */}
            {!loading && filteredOffers.length > 0 && (
              <Pagination
                currentPage={tableCurrentPage}
                pageSize={tablePageSize}
                totalItems={filteredOffers.length}
                onPageChange={tableHandlePageChange}
              />
            )}

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

                    {/* Archived: Unarchive */}
                    {offer.status === OfferStatusEnum.ARCHIVED && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (offer.id) {
                            handleUnarchiveOffer(offer.id);
                            setShowActionMenu(null);
                          }
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <RotateCcw
                          className="w-4 h-4 mr-3"
                          style={{ color: color.primary.action }}
                        />
                        Unarchive Offer
                      </button>
                    )}

                    {/* Duplicate Offer */}
                    <PermissionGate permission="offers.create">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (offer.id) {
                            navigate(
                              `/dashboard/offers/create?duplicateId=${offer.id}`
                            );
                            setShowActionMenu(null);
                          }
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Copy className="w-4 h-4 mr-3" />
                        Duplicate Offer
                      </button>
                    </PermissionGate>

                    {/* Delete - Dangerous Action */}
                    <PermissionGate permission="offers.delete">
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
                    </PermissionGate>
                  </div>,
                  document.body,
                );
              }
              if (dropdownMenuRefs.current[offer.id!]) {
                dropdownMenuRefs.current[offer.id!] = null;
              }
              return null;
            })}
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredOffers.length > 0 && (
        <Pagination
          currentPage={filters.page || 1}
          pageSize={filters.limit || 15}
          totalItems={totalOffers}
          onPageChange={(page) =>
            setFilters((prev) => ({
              ...prev,
              page,
            }))
          }
        />
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
                        <Radio
                          name="status"
                          value={option.value}
                          checked={selectedStatus === option.value}
                          onChange={() =>
                            handleStatusFilter(
                              option.value as OfferStatusEnum | "all",
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
                        <Radio
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
          document.body,
        )}

      {/* Column Picker Modal */}
      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetToDefaults={resetToDefaults}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Offer"
        description="Are you sure you want to delete this offer? This action cannot be undone."
        itemName={deleteConfirm.itemName}
        isLoading={isDeleting}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
