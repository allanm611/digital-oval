import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Ban,
  CheckCircle,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Users,
  Eye,
  UserPlus,
  BarChart3,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userService } from "../../users/services/userService";
import { accountService } from "../../account/services/accountService";
import { userOnboardingService } from "../../users/services/userOnboardingService";
import { UserType, PaginatedResponse } from "../../users/types/user";
import { useToast } from "../../../contexts/ToastContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import UserModal from "../components/UserModal";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ErrorState from "../../../shared/components/ui/ErrorState";
import { color, tw, components, zIndex, button } from "../../../shared/utils/utils";
import { useAuth } from "../../../contexts/AuthContext";
import { roleService } from "../../roles/services/roleService";
import { Role } from "../../roles/types/role";
import DateFormatter from "../../../shared/components/DateFormatter";
import { formatDate } from "../../../shared/services/dateService";
import { useLanguage } from "../../../contexts/LanguageContext";
import CsvDownloadButton from "../../../shared/components/CsvDownloadButton";
import { PermissionGate } from "../../auth/components/PermissionGate";
import Pagination from "../../../shared/components/ui/Pagination";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

// Helper function to extract error messages from various error types
const extractErrorMessage = (error: unknown): string => {
  // Check for 401 Unauthorized / authentication errors
  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;

    // Check for status code 401
    if (errorObj.status === 401 || errorObj.statusCode === 401) {
      return "Your session has expired. Please refresh the page and log in again.";
    }

    // Check for 403 Forbidden
    if (errorObj.status === 403 || errorObj.statusCode === 403) {
      return "You don't have permission to perform this action.";
    }

    // Check for network errors
    if (
      errorObj.message === "Failed to fetch" ||
      (typeof errorObj.message === "string" &&
        errorObj.message.includes("network"))
    ) {
      return "Network connection error. Please check your internet connection and try again.";
    }
  }

  // Standard Error instance
  if (error instanceof Error) {
    // Filter out unhelpful backend error messages
    if (error.message.toLowerCase().includes("unauthorized")) {
      return "Your session has expired. Please refresh the page and log in again.";
    }
    if (error.message.toLowerCase().includes("forbidden")) {
      return "You don't have permission to perform this action.";
    }
    // Return the error message if it's somewhat helpful
    if (error.message && error.message.trim().length > 0) {
      return error.message;
    }
  }

  // String error
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  // Try to extract from object properties
  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;
    if (
      errorObj.message &&
      typeof errorObj.message === "string" &&
      errorObj.message.trim().length > 0
    ) {
      return errorObj.message;
    }
    if (
      errorObj.reason &&
      typeof errorObj.reason === "string" &&
      errorObj.reason.trim().length > 0
    ) {
      return errorObj.reason;
    }
    if (
      errorObj.error &&
      typeof errorObj.error === "string" &&
      errorObj.error.trim().length > 0
    ) {
      return errorObj.error;
    }
    if (
      errorObj.detail &&
      typeof errorObj.detail === "string" &&
      errorObj.detail.trim().length > 0
    ) {
      return errorObj.detail;
    }
  }

  // Fallback to generic user-friendly message
  // Ensure we never return "[object Object]" by not rendering the error object directly
  return "Unable to load data. Please try again.";
};

type AccountRequestListItem = {
  id?: number;
  requestId?: number;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  email_address?: string;
  email?: string;
  private_email_address?: string;
  force_password_reset?: boolean;
  roleId?: number;
  roleName?: string;
  created_at?: string;
  created_on?: string;
  department?: string;
  status?: "pending" | "submitted" | "approved" | "rejected" | "cancelled";
  rejection_reason?: string;
};

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  type UserWithResolvedRole = UserType & { resolvedRoleName?: string };

  const PAGE_SIZE = 20;

  const [users, setUsers] = useState<UserWithResolvedRole[]>([]);
  const [accountRequests, setAccountRequests] = useState<
    AccountRequestListItem[]
  >([]);
  const [rejectedRequests, setRejectedRequests] = useState<
    AccountRequestListItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"users" | "requests">("users");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending_activation" | "active" | "suspended" | "locked" | "deactivated" | "deleted"
  >("all");
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userSummary, setUserSummary] = useState<{
    total: number;
    cached: boolean;
  }>({
    total: 0,
    cached: false,
  });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const hasInitializedDebounce = useRef(false);

  // Loading states for individual actions
  const [loadingActions, setLoadingActions] = useState<{
    approving: Set<number>;
    rejecting: Set<number>;
    deleting: Set<number>;
    toggling: Set<number>;
  }>({
    approving: new Set(),
    rejecting: new Set(),
    deleting: new Set(),
    toggling: new Set(),
  });

  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<AccountRequestListItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { user: authUser } = useAuth();
  const [roleLookup, setRoleLookup] = useState<Record<number, Role>>({});
  const roleLookupRef = useRef<Record<number, Role>>({});
  const [rolesReady, setRolesReady] = useState(false);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [departmentCounts, setDepartmentCounts] = useState<
    Record<string, number>
  >({});
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [reportsLoading, setReportsLoading] = useState(false);

  // Batch selection and batch operations
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchDepartmentValue, setBatchDepartmentValue] = useState<string>("");
  const allDepartmentsRef = useRef<string[]>([]);
  const allRolesRef = useRef<string[]>([]);

  const activateColor = color.tertiary.tag4;
  const deactivateColor = color.configStatus.inactive;

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setShowFiltersModal(false);
      setIsClosingModal(false);
    }, 300);
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((user) => user.id)));
    }
  };

  const handleBatchAction = async (
    action: "deactivate" | "update_department",
  ) => {
    if (selectedUsers.size === 0) return;

    const userIds = Array.from(selectedUsers);
    setIsBatchProcessing(true);

    try {
      let result;
      switch (action) {
        case "deactivate":
          result = await userService.batchDeactivateUsers({
            user_ids: userIds,
          });
          const deactivated = result.data?.deactivated || 0;
          const total = result.data?.total || 0;
          const failedDeactivate = total - deactivated;
          success(
            "Batch deactivate completed",
            `${deactivated} user(s) deactivated successfully${
              failedDeactivate > 0 ? `, ${failedDeactivate} failed` : ""
            }`,
          );
          break;
        case "update_department":
          if (!batchDepartmentValue) {
            showError("Department required", "Please select a department");
            setIsBatchProcessing(false);
            return;
          }
          result = await userService.batchUpdateDepartment({
            user_ids: userIds,
            department: batchDepartmentValue,
          });
          const updated = result.data?.updated || result.data?.deactivated || 0;
          const deptTotal = result.data?.total || 0;
          const failedUpdate = deptTotal - updated;
          success(
            "Batch update completed",
            `${updated} user(s) updated successfully${
              failedUpdate > 0 ? `, ${failedUpdate} failed` : ""
            }`,
          );
          setBatchDepartmentValue("");
          break;
      }

      setSelectedUsers(new Set());
      loadData({ skipCache: true });
    } catch (err) {
      showError(
        `Batch ${action} failed`,
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Helper to get role ID from role name
  const getRoleIdByName = (roleName: string): number | undefined => {
    return Object.entries(roleLookup).find(
      ([, role]) => role.name === roleName
    )?.[0] ? Number(Object.entries(roleLookup).find(
      ([, role]) => role.name === roleName
    )?.[0]) : undefined;
  };

  const buildSearchQuery = useCallback(
    ({
      skipCache = false,
      searchTermOverride,
    }: {
      skipCache?: boolean;
      searchTermOverride?: string;
    } = {}) => {
      const query: Record<string, unknown> = {};

      const term = (searchTermOverride ?? searchTerm)?.trim();
      if (term) {
        query.q = term;
      }

      // Add server-side filter parameters
      if (filterStatus !== "all") {
        query.status = filterStatus;
      }

      if (filterDepartment !== "all") {
        query.department = filterDepartment;
      }

      if (filterRole !== "all") {
        const roleId = getRoleIdByName(filterRole);
        if (roleId) {
          query.role_id = roleId;
        }
      }

      if (skipCache) {
        query.skipCache = true;
      }

      return query;
    },
    [searchTerm, filterStatus, filterDepartment, filterRole, roleLookup],
  );

  const fetchUsers = useCallback(
    async ({
      skipCache = false,
      searchTermOverride,
    }: {
      skipCache?: boolean;
      searchTermOverride?: string;
    } = {}): Promise<PaginatedResponse<UserType>> => {
      const term = (searchTermOverride ?? searchTerm)?.trim();

      // Check if any filter is active
      const hasActiveFilters =
        filterStatus !== "all" ||
        filterDepartment !== "all" ||
        filterRole !== "all";

      // If there's a search term OR active filters, use searchUsers with combined params
      if (term || hasActiveFilters) {
        return userService.searchUsers(
          buildSearchQuery({ skipCache, searchTermOverride: term }),
        );
      }

      // No search term or filters - use basic getUsers
      const baseQuery: Record<string, unknown> = {};
      if (skipCache) {
        baseQuery.skipCache = true;
      }

      return userService.getUsers(baseQuery);
    },
    [buildSearchQuery, searchTerm, filterStatus, filterDepartment, filterRole],
  );

  const loadData = useCallback(
    async ({
      skipCache = false,
      searchTermOverride,
    }: {
      skipCache?: boolean;
      searchTermOverride?: string;
    } = {}) => {
      try {
        setIsLoading(true);
        setErrorState("");

        // Fetch users and onboarding requests in parallel
        const [usersResponse, submittedResponse, underReviewResponse, pendingApprovalResponse, rejectedResponse] = await Promise.allSettled([
          fetchUsers({
            skipCache,
            searchTermOverride,
          }),
          userOnboardingService.getSubmittedRequests(skipCache, 100, 0),
          userOnboardingService.getUnderReviewRequests(skipCache, 100, 0),
          userOnboardingService.getPendingApprovalRequests(skipCache, 100, 0),
          userOnboardingService.getRejectedOnboardingRequests(skipCache, 100, 0),
        ]);

        // Process users (from users endpoint)
        if (usersResponse.status === "fulfilled" && usersResponse.value.success) {
          const allUsers = usersResponse.value.data;

          const currentRoleLookup = roleLookupRef.current;

          const usersWithResolvedRoles = allUsers.map((user) => {
            const primaryRoleId = user.primary_role_id ?? user.role_id;
            const resolvedRoleName =
              (primaryRoleId != null
                ? currentRoleLookup[primaryRoleId]?.name
                : undefined) ||
              user.role_name ||
              "N/A";

            return {
              ...user,
              resolvedRoleName,
            };
          }) as UserWithResolvedRole[];

          setUsers(usersWithResolvedRoles);

          const totalFromResponse =
            (usersResponse.value.meta?.total as number | undefined) ??
            usersResponse.value.data.length;

          setUserSummary({
            total: totalFromResponse,
            cached: Boolean(usersResponse.value.meta?.isCachedResponse),
          });
        }

        // Process onboarding requests (submitted, under_review, pending_approval)
        const allOnboardingRequests: AccountRequestListItem[] = [];
        const statusResponses = [submittedResponse, underReviewResponse, pendingApprovalResponse];

        statusResponses.forEach((response) => {
          if (response.status === "fulfilled" && response.value.success) {
            const requests = response.value.data || [];
            requests.forEach((req: any) => {
              allOnboardingRequests.push({
                requestId: req.id,
                first_name: req.first_name,
                last_name: req.last_name,
                email_address: req.email_address,
                department: req.department,
                created_at: req.created_at,
                status: req.status || "submitted",
              });
            });
          }
        });

        setAccountRequests(allOnboardingRequests);

        // Process rejected requests
        const rejectedList: AccountRequestListItem[] = [];
        if (rejectedResponse.status === "fulfilled" && rejectedResponse.value.success) {
          const rejected = rejectedResponse.value.data || [];
          rejected.forEach((req: any) => {
            rejectedList.push({
              requestId: req.id,
              first_name: req.first_name,
              last_name: req.last_name,
              email_address: req.email_address,
              department: req.department,
              created_at: req.created_at,
              status: "rejected",
              rejection_reason: req.rejection_reason,
            });
          });
        }

        setRejectedRequests(rejectedList);
      } catch (err) {
        const message = extractErrorMessage(err);
        setErrorState(message);
        showError("Error loading users", message);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchUsers, showError],
  );

  // Load both users and roles in parallel on initial mount
  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setErrorState("");

        // Fetch users, onboarding requests, and roles in parallel
        const [usersResponse, submittedResponse, underReviewResponse, pendingApprovalResponse, rejectedResponse, rolesResponse] = await Promise.allSettled([
          fetchUsers({ skipCache: false }),
          userOnboardingService.getSubmittedRequests(true, 100, 0),
          userOnboardingService.getUnderReviewRequests(true, 100, 0),
          userOnboardingService.getPendingApprovalRequests(true, 100, 0),
          userOnboardingService.getRejectedOnboardingRequests(true, 100, 0),
          roleService.listRoles({
            limit: 100,
            offset: 0,
            skipCache: true,
          }),
        ]);

        if (cancelled) return;

        // Process roles
        if (rolesResponse.status === "fulfilled") {
          try {
            const { roles } = rolesResponse.value;
            const mappedRoles: Record<number, Role> = {};
            roles.forEach((role) => {
              mappedRoles[role.id] = role;
            });
            setRoleLookup(mappedRoles);
            roleLookupRef.current = mappedRoles;
          } catch (err) {
            console.error("Failed to process roles", err);
          }
        } else {
          console.error("Failed to load roles", rolesResponse.reason);
        }
        setRolesReady(true);

        // Process users (active users only)
        if (
          usersResponse.status === "fulfilled" &&
          usersResponse.value.success
        ) {
          const allUsers = usersResponse.value.data;

          const currentRoleLookup = roleLookupRef.current;
          const usersWithResolvedRoles = allUsers.map((user) => {
            const primaryRoleId = user.primary_role_id ?? user.role_id;
            const resolvedRoleName =
              (primaryRoleId != null
                ? currentRoleLookup[primaryRoleId]?.name
                : undefined) ||
              user.role_name ||
              "N/A";

            return {
              ...user,
              resolvedRoleName,
            };
          }) as UserWithResolvedRole[];

          setUsers(usersWithResolvedRoles);

          const totalFromResponse =
            (usersResponse.value.meta?.total as number | undefined) ??
            usersResponse.value.data.length;

          setUserSummary({
            total: totalFromResponse,
            cached: Boolean(usersResponse.value.meta?.isCachedResponse),
          });
        } else if (usersResponse.status === "rejected") {
          const message = extractErrorMessage(usersResponse.reason);
          setErrorState(message);
          showError("Error loading users", message);
        }

        // Process onboarding requests (submitted, under_review, pending_approval)
        const allOnboardingRequests: AccountRequestListItem[] = [];
        const statusResponses = [submittedResponse, underReviewResponse, pendingApprovalResponse];

        statusResponses.forEach((response) => {
          if (response.status === "fulfilled" && response.value.success) {
            const requests = response.value.data || [];
            requests.forEach((req: any) => {
              allOnboardingRequests.push({
                requestId: req.id,
                first_name: req.first_name,
                last_name: req.last_name,
                email_address: req.email_address,
                department: req.department,
                created_at: req.created_at,
                status: req.status || "submitted",
              });
            });
          }
        });

        setAccountRequests(allOnboardingRequests);

        // Process rejected account requests
        const rejectedList: AccountRequestListItem[] = [];
        if (
          rejectedResponse.status === "fulfilled" &&
          rejectedResponse.value.success
        ) {
          const rejectedData = rejectedResponse.value.data || [];

          rejectedData.forEach((request: any) => {
            rejectedList.push({
              requestId: request.id,
              first_name: request.first_name,
              last_name: request.last_name,
              email_address: request.email_address,
              department: request.department,
              created_at: request.created_at,
              status: "rejected",
              rejection_reason: request.rejection_reason,
            });
          });
        }

        setRejectedRequests(rejectedList);
      } catch (err) {
        const message = extractErrorMessage(err);
        setErrorState(message);
        showError("Error loading data", message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Load reports after roles are loaded (needed for role name resolution)
    if (Object.keys(roleLookup).length > 0 || isLoading === false) {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleLookup]);

  // Load reports when analytics tab is selected to get fresh data
  useEffect(() => {
    if (activeTab === "analytics") {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadReports = async () => {
    try {
      setReportsLoading(true);
      const [status, dept, role] = await Promise.all([
        userService
          .getStatusCounts()
          .catch(() => ({ success: false, data: {} })),
        userService
          .getDepartmentCounts()
          .catch(() => ({ success: false, data: {} })),
        userService.getRoleCounts().catch(() => ({ success: false, data: {} })),
      ]);

      // Transform array format to object format if needed
      const transformToObject = (
        data:
          | Record<string, number>
          | Array<{ [key: string]: unknown; count: number }>,
        isRoleCount = false,
      ): Record<string, number> => {
        if (Array.isArray(data)) {
          const result: Record<string, number> = {};
          data.forEach((item) => {
            if (item.count === undefined) return;

            if (isRoleCount && item.role_id !== undefined) {
              // For role counts, resolve role_id to role name
              const roleId = item.role_id as number;
              const roleName = roleLookup[roleId]?.name || `Role ID: ${roleId}`;
              result[roleName] = item.count;
            } else {
              // Find the key (could be department, status, etc.)
              const key = Object.keys(item).find(
                (k) =>
                  k !== "count" &&
                  (typeof item[k] === "string" || typeof item[k] === "number"),
              );
              if (key) {
                const value = item[key];
                const displayKey =
                  typeof value === "string" ? value : String(value);
                result[displayKey] = item.count;
              }
            }
          });
          return result;
        }
        return data;
      };

      if (status.success) {
        setStatusCounts(transformToObject(status.data || {}));
      }
      if (dept.success) {
        setDepartmentCounts(transformToObject(dept.data || {}));
      }
      if (role.success) {
        setRoleCounts(transformToObject(role.data || {}, true));
      }
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    roleLookupRef.current = roleLookup;
  }, [roleLookup]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!hasInitializedDebounce.current) {
      hasInitializedDebounce.current = true;
      return;
    }

    loadData({ skipCache: true, searchTermOverride: debouncedSearchTerm });
  }, [debouncedSearchTerm, loadData]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }

    try {
      setIsLoading(true);
      const trimmedTerm = searchTerm.trim();
      const searchResponse = await fetchUsers({
        skipCache: true,
        searchTermOverride: trimmedTerm,
      });

      if (searchResponse.success) {
        setUsers(searchResponse.data);

        const totalFromResponse =
          (searchResponse.meta?.total as number | undefined) ??
          searchResponse.data.length;
        setUserSummary({
          total: totalFromResponse,
          cached: Boolean(searchResponse.meta?.isCachedResponse),
        });
      }
    } catch (err) {
      showError(
        "Search Error",
        err instanceof Error ? err.message : "Failed to search users",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUser = (user: UserType) => {
    navigate(`/dashboard/user-management/${user.id}`);
  };

  const resolveAccountRequestId = (
    request: AccountRequestListItem,
  ): number | null => {
    const identifier = request.id ?? request.requestId;
    return typeof identifier === "number" ? identifier : null;
  };

  const getStatusBadge = (request: AccountRequestListItem) => {
    const status = request.status || "submitted";
    const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
      submitted: {
        label: "Submitted",
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
      },
      under_review: {
        label: "Under Review",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-700",
      },
      pending_approval: {
        label: "Pending Approval",
        bgColor: "bg-orange-100",
        textColor: "text-orange-700",
      },
      approved: {
        label: "Approved",
        bgColor: "bg-green-100",
        textColor: "text-green-700",
      },
      rejected: {
        label: "Rejected",
        bgColor: "bg-red-100",
        textColor: "text-red-700",
      },
    };

    const config = statusConfig[status] || statusConfig.submitted;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
      >
        {config.label}
      </span>
    );
  };

  const handleApproveRequest = async (request: AccountRequestListItem) => {
    const requestId = resolveAccountRequestId(request);
    if (!requestId) {
      showError(
        "Unable to approve request",
        "Missing identifier for the selected request.",
      );
      return;
    }

    const confirmed = await confirm({
      title: "Approve Request",
      message: `Are you sure you want to approve the account request for ${request.first_name} ${request.last_name}?`,
      type: "success",
      confirmText: "Approve",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    // Set loading state
    setLoadingActions((prev) => ({
      ...prev,
      approving: new Set([...prev.approving, requestId]),
    }));

    try {
      // Approve the onboarding request
      await userOnboardingService.approveOnboardingRequest(
        requestId,
        authUser?.user_id ?? 0,
      );

      await loadData({ skipCache: true }); // Skip cache to get fresh data
      success(
        t.userManagement.requestApproved,
        `${t.userManagement.requestApproved} - ${request.first_name} ${request.last_name}`,
      );
    } catch (err) {
      showError(
        "Error approving request",
        err instanceof Error ? err.message : "Error approving request",
      );
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({
        ...prev,
        approving: new Set(
          [...prev.approving].filter((id) => id !== requestId),
        ),
      }));
    }
  };

  const handleMoveToReview = async (request: AccountRequestListItem) => {
    const requestId = resolveAccountRequestId(request);
    if (!requestId) {
      showError(
        "Unable to move request",
        "Missing identifier for the selected request.",
      );
      return;
    }

    setLoadingActions((prev) => ({
      ...prev,
      approving: new Set([...prev.approving, requestId]),
    }));

    try {
      await userOnboardingService.moveToReview(requestId);
      await loadData({ skipCache: true });
      success(
        "Request moved to review",
        `${request.first_name} ${request.last_name}'s request is now under review`,
      );
    } catch (err) {
      showError(
        "Error moving request",
        err instanceof Error ? err.message : "Error moving request",
      );
    } finally {
      setLoadingActions((prev) => ({
        ...prev,
        approving: new Set([...prev.approving].filter((id) => id !== requestId)),
      }));
    }
  };

  const handleMoveToPendingApproval = async (request: AccountRequestListItem) => {
    const requestId = resolveAccountRequestId(request);
    if (!requestId) {
      showError(
        "Unable to move request",
        "Missing identifier for the selected request.",
      );
      return;
    }

    // Using current user as approver for now
    const approverId = authUser?.user_id ?? 0;

    setLoadingActions((prev) => ({
      ...prev,
      approving: new Set([...prev.approving, requestId]),
    }));

    try {
      await userOnboardingService.moveToPendingApproval(requestId, approverId);
      await loadData({ skipCache: true });
      success(
        "Request sent to approver",
        `${request.first_name} ${request.last_name}'s request is now pending approval`,
      );
    } catch (err) {
      showError(
        "Error moving request",
        err instanceof Error ? err.message : "Error moving request",
      );
    } finally {
      setLoadingActions((prev) => ({
        ...prev,
        approving: new Set([...prev.approving].filter((id) => id !== requestId)),
      }));
    }
  };

  const handleCreateUserFromRequest = async (request: AccountRequestListItem) => {
    const requestId = resolveAccountRequestId(request);
    if (!requestId) {
      showError(
        "Unable to create user",
        "Missing identifier for the selected request.",
      );
      return;
    }

    const confirmed = await confirm({
      title: "Create User Account",
      message: `Create a system user account for ${request.first_name} ${request.last_name}?`,
      type: "success",
      confirmText: "Create User",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setLoadingActions((prev) => ({
      ...prev,
      approving: new Set([...prev.approving, requestId]),
    }));

    try {
      // Generate username from email
      const username = request.email_address
        ? request.email_address.split("@")[0].toLowerCase()
        : `${request.first_name?.toLowerCase() || "user"}`;

      // In production, backend should generate password and send via email
      // For now using a placeholder
      const tempPassword = `Temp${Date.now()}!`;

      // Hash password using the dev endpoint
      const hashResponse = await accountService.hashPassword(tempPassword);
      const hashedPassword = hashResponse.hashedPassword || hashResponse.data?.hashedPassword;
      if (!hashResponse.success || !hashedPassword) {
        throw new Error("Failed to hash password");
      }

      const response = await userService.createUser({
        username,
        email: request.email_address || "",
        first_name: request.first_name || "",
        last_name: request.last_name || "",
        password_hash: hashedPassword,
        primary_role_id: 3, // Default role - TODO: get from request
        department: request.department,
        created_by: authUser?.user_id ?? 1,
      });

      await loadData({ skipCache: true });
      success(
        "User created",
        `${request.first_name} ${request.last_name} has been added to the system`,
      );
    } catch (err) {
      showError(
        "Error creating user",
        err instanceof Error ? err.message : "Error creating user account",
      );
    } finally {
      setLoadingActions((prev) => ({
        ...prev,
        approving: new Set([...prev.approving].filter((id) => id !== requestId)),
      }));
    }
  };

  const handleRejectRequest = async (request: AccountRequestListItem) => {
    const requestId = resolveAccountRequestId(request);
    if (!requestId) {
      showError(
        "Unable to reject request",
        "Missing identifier for the selected request.",
      );
      return;
    }

    // Show reject modal to get rejection reason
    setRejectingRequest(request);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;

    const requestId = resolveAccountRequestId(rejectingRequest);
    if (!requestId) {
      showError("Unable to reject request", "Missing request identifier");
      return;
    }

    if (!rejectionReason.trim()) {
      showError("Rejection reason required", "Please provide a reason for rejecting this request");
      return;
    }

    // Set loading state
    setLoadingActions((prev) => ({
      ...prev,
      rejecting: new Set([...prev.rejecting, requestId]),
    }));

    try {
      // Ensure we have the current user's ID
      if (!authUser?.user_id) {
        showError(
          "Unable to reject request",
          "Current user information not available",
        );
        return;
      }

      // Use the reject endpoint with the request ID, approver ID, and rejection reason
      await userOnboardingService.rejectOnboardingRequest(
        requestId,
        authUser.user_id,
        rejectionReason
      );

      setShowRejectModal(false);
      setRejectionReason("");
      setRejectingRequest(null);

      await loadData({ skipCache: true }); // Skip cache to get fresh data
      success(
        t.userManagement.requestRejected,
        `${t.userManagement.requestRejected} - ${rejectingRequest.first_name} ${rejectingRequest.last_name}`,
      );
    } catch (err) {
      showError(
        "Error rejecting request",
        "Failed to reject request, please try again later",
        true
      );
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({
        ...prev,
        rejecting: new Set(
          [...prev.rejecting].filter((id) => id !== requestId),
        ),
      }));
    }
  };

  const handleToggleStatus = async (user: UserType) => {
    // Set loading state
    setLoadingActions((prev) => ({
      ...prev,
      toggling: new Set([...prev.toggling, user.id]),
    }));

    try {
      const isActive = isUserActive(user);
      if (isActive) {
        await userService.deactivateUser(user.id);
        success(
          t.userManagement.userDeactivated,
          `User ${user.first_name} ${user.last_name} deactivated successfully`,
        );
      } else {
        await userService.activateUser(user.id);
        success(
          t.userManagement.userActivated,
          `User ${user.first_name} ${user.last_name} activated successfully`,
        );
      }
      // Optimistically update user status
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                status: isActive ? "deactivated" : "active",
                is_active: !isActive,
                is_activated: !isActive,
                account_status: isActive ? "deactivated" : "active",
              }
            : u
        ),
      );
    } catch (err) {
      showError(
        "Error updating status",
        err instanceof Error ? err.message : "Error toggling user status",
      );
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({
        ...prev,
        toggling: new Set([...prev.toggling].filter((id) => id !== user.id)),
      }));
    }
  };

  const handleDeleteUser = (user: UserType) => {
    if (!authUser?.user_id) {
      showError("Unable to delete user", "Your session is missing a user id.");
      return;
    }
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || !authUser?.user_id) return;

    setIsDeleting(true);
    // Set loading state
    setLoadingActions((prev) => ({
      ...prev,
      deleting: new Set([...prev.deleting, userToDelete.id]),
    }));

    try {
      await userService.deleteUser(userToDelete.id, authUser.user_id);
      // Optimistically remove user from list
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      success(
        t.userManagement.userDeleted,
        `${userToDelete.first_name} ${userToDelete.last_name} deleted successfully`,
      );
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      showError(
        "Error deleting user",
        err instanceof Error ? err.message : "Error deleting user",
      );
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({
        ...prev,
        deleting: new Set(
          [...prev.deleting].filter((id) => id !== userToDelete.id),
        ),
      }));
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Derived analytics helpers
  const normalizeStatus = (user: UserType) => {
    const accountStatus = (user as unknown as { account_status?: string })
      ?.account_status;
    if (accountStatus && accountStatus.trim() !== "") {
      return accountStatus.toLowerCase();
    }
    if (user.status && user.status.trim() !== "") {
      return user.status.toLowerCase();
    }
    const isSuspended = Boolean(
      (user as unknown as { is_suspended?: boolean })?.is_suspended,
    );
    if (isSuspended) return "suspended";
    const isActive = Boolean(
      (user as unknown as { is_active?: boolean })?.is_active ??
      (user as unknown as { is_activated?: boolean })?.is_activated,
    );
    return isActive ? "active" : "inactive";
  };

  const formatStatusLabel = (status: string) =>
    status
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Unknown";

  const getStatusColorToken = (status: string) => {
    if (status === "active") return color.status.success;
    if (status === "suspended" || status === "locked") {
      return color.status.warning;
    }
    return color.status.danger;
  };

  const isUserActive = (user: UserType) => {
    const status = normalizeStatus(user);
    if (status === "active") return true;
    if (status === "inactive") return false;
    return Boolean(
      (user as unknown as { is_active?: boolean })?.is_active ??
      (user as unknown as { is_activated?: boolean })?.is_activated,
    );
  };

  // Get unique departments from users
  const uniqueDepartments = Array.from(
    new Set(
      users
        .map((user) => user.department)
        .filter((dept): dept is string => Boolean(dept && dept.trim() !== "")),
    ),
  ).sort((a, b) => a.localeCompare(b));

  // Get unique roles from users
  const hasResolvedRoleName = (user: UserType): user is UserWithResolvedRole =>
    "resolvedRoleName" in user &&
    typeof (user as UserWithResolvedRole).resolvedRoleName === "string" &&
    Boolean((user as UserWithResolvedRole).resolvedRoleName);

  const getUserRoleName = useCallback(
    (user: UserType): string => {
      if (hasResolvedRoleName(user)) {
        return user.resolvedRoleName as string;
      }
      const primaryRoleId = user.primary_role_id ?? user.role_id;
      if (primaryRoleId != null) {
        const resolvedRole = roleLookup[primaryRoleId];
        if (resolvedRole?.name) {
          return resolvedRole.name;
        }
      }
      return user.role_name || "N/A";
    },
    [roleLookup],
  );

  const uniqueRoles = Array.from(
    new Set(
      users
        .map((user) => getUserRoleName(user))
        .filter((role): role is string => Boolean(role && role !== "N/A")),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const aggregateCounts = users.reduce(
    (acc, user) => {
      const status = normalizeStatus(user);
      if (status === "active") {
        acc.active += 1;
      } else {
        acc.inactive += 1;
      }

      if (status.includes("lock")) {
        acc.locked += 1;
      }

      return acc;
    },
    { active: 0, inactive: 0, locked: 0 },
  );

  const totalUsersValue =
    userSummary.total > 0
      ? userSummary.total
      : aggregateCounts.active + aggregateCounts.inactive;
  const activeUsersValue = aggregateCounts.active;
  const pendingActivationValue = accountRequests.length;
  const highRiskUsersValue = aggregateCounts.locked;

  const statsLoadingIndicator = isLoading;

  const userStatsCards = [
    {
      name: t.userManagement.totalUsers,
      value: statsLoadingIndicator ? "..." : totalUsersValue.toLocaleString(),
      icon: Users,
      color: color.tertiary.tag1,
      badge: userSummary.cached ? t.userManagement.cached : undefined,
    },
    {
      name: t.userManagement.activeUsers,
      value: statsLoadingIndicator ? "..." : activeUsersValue.toLocaleString(),
      icon: UserCheck,
      color: color.tertiary.tag4,
    },
    {
      name: t.userManagement.pendingActivation,
      value: statsLoadingIndicator
        ? "..."
        : pendingActivationValue.toLocaleString(),
      icon: UserPlus,
      color: color.tertiary.tag2,
    },
    {
      name: t.userManagement.lockedUsers,
      value: statsLoadingIndicator
        ? "..."
        : highRiskUsersValue.toLocaleString(),
      icon: UserX,
      color: color.tertiary.tag3,
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email_address || user.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const normalizedStatus = normalizeStatus(user);

    const matchesDepartment =
      filterDepartment === "all" ||
      (user.department || "").toLowerCase() === filterDepartment.toLowerCase();
    const matchesRole =
      filterRole === "all" ||
      getUserRoleName(user).toLowerCase() === filterRole.toLowerCase();
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && normalizedStatus === "active") ||
      (filterStatus === "inactive" && normalizedStatus !== "active");

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, filterRole, filterStatus]);

  const filteredRequests = accountRequests.filter((request) => {
    const firstName = (request.first_name ?? "").toLowerCase();
    const lastName = (request.last_name ?? "").toLowerCase();
    const email = (request.email_address ?? request.email ?? "").toLowerCase();
    const needle = searchTerm.toLowerCase();

    return (
      firstName.includes(needle) ||
      lastName.includes(needle) ||
      email.includes(needle)
    );
  });

  const getPendingRequestRole = useCallback(
    (request: AccountRequestListItem) => {
      if (request.roleName && request.roleName.trim() !== "") {
        return request.roleName;
      }

      if (request.roleId != null) {
        const resolvedRole = roleLookup[request.roleId];
        if (resolvedRole?.name) {
          return resolvedRole.name;
        }
        return `Role ID: ${request.roleId}`;
      }

      return "N/A";
    },
    [roleLookup],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            {t.userManagement.title}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {t.userManagement.description}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {activeTab === "users" && (
            <button
              onClick={() => {
                if (!isSelectionMode) {
                  setIsSelectionMode(true);
                  setSelectedUsers(new Set(filteredUsers.map((user) => user.id)));
                } else {
                  setIsSelectionMode(false);
                  setSelectedUsers(new Set());
                }
              }}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus:outline-none transition-colors`}
              style={{
                backgroundColor: isSelectionMode
                  ? color.primary.action
                  : "transparent",
                color: isSelectionMode ? "white" : color.primary.action,
                border: `1px solid ${color.primary.action}`,
              }}
              title={isSelectionMode ? "Exit selection mode" : "Enter selection mode"}
            >
              {isSelectionMode ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {isSelectionMode ? "Exit Selection" : "Select Users"}
            </button>
          )}
          <button
            onClick={() => navigate("./analytics")}
            className={`${tw.button} flex items-center gap-2`}
            title="View user analytics"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          <PermissionGate permission="users.create">
            <button
              onClick={() => {
                setSelectedUser(null);
                setIsModalOpen(true);
              }}
              className={`${tw.button} flex items-center gap-2`}
            >
              <Plus className="w-4 h-4" />
              {t.userManagement.addUser}
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {userStatsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`${tw.rounded} border border-gray-200 bg-white p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600 truncate">
                    {stat.name}
                  </p>
                </div>
                {stat.badge && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-yellow-100 text-yellow-800 flex-shrink-0">
                    {stat.badge}
                  </span>
                )}
              </div>
              <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <style>{`
        @media (max-width: 640px) {
          .user-management-tabs::-webkit-scrollbar {
            display: none;
          }
          .user-management-tabs {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
      <div className="user-management-tabs flex gap-1 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 relative flex-shrink-0 ${
            activeTab === "users"
              ? "text-black"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">{t.userManagement.users}</span>
          <span
            className="px-2 py-0.5 rounded-full text-xs text-white flex-shrink-0"
            style={{
              backgroundColor:
                activeTab === "users" ? color.primary.accent : color.text.muted,
            }}
          >
            {users.length}
          </span>
          {activeTab === "users" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: color.primary.accent }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 relative flex-shrink-0 ${
            activeTab === "requests"
              ? "text-black"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="whitespace-nowrap">
            {t.userManagement.pendingRequests}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs text-white flex-shrink-0"
            style={{
              backgroundColor:
                activeTab === "requests"
                  ? color.primary.accent
                  : color.text.muted,
            }}
          >
            {accountRequests.length}
          </span>
          {activeTab === "requests" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: color.primary.accent }}
            />
          )}
        </button>
        <button
          onClick={() => navigate("/dashboard/user-management/analytics")}
          className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 relative flex-shrink-0 text-gray-600 hover:text-gray-900`}
        >
          <BarChart3 className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">
            {t.userManagement.analytics}
          </span>
        </button>
      </div>

      {/* Search and Filters - Only show on Users tab */}
      {activeTab === "users" && (
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${tw.textMuted}`}
            />
            <input
              type="text"
              placeholder={t.userManagement.searchUsers}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className={`w-full pl-10 pr-4 py-3 text-sm ${components.input.default}`}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <HeadlessSelect
              options={[
                { value: "all", label: t.userManagement.allStatus },
                { value: "pending_activation", label: "Pending Activation" },
                { value: "active", label: t.userManagement.active },
                { value: "suspended", label: "Suspended" },
                { value: "locked", label: "Locked" },
                { value: "deactivated", label: "Deactivated" },
                { value: "deleted", label: "Deleted" },
              ]}
              value={filterStatus}
              onChange={(value) =>
                setFilterStatus(value as "all" | "pending_activation" | "active" | "suspended" | "locked" | "deactivated" | "deleted")
              }
              placeholder={t.userManagement.selectStatus}
              className="w-full sm:min-w-[140px] sm:w-auto"
            />

            <CsvDownloadButton
              headers={[
                "Name",
                "Email",
                "Department",
                "Role",
                "Status",
                "Created",
              ]}
              rows={filteredUsers.map((u) => [
                `${u.first_name} ${u.last_name}`,
                u.email_address || u.email || "N/A",
                u.department || "N/A",
                getUserRoleName(u),
                normalizeStatus(u),
                u.created_at
                  ? new Date(u.created_at).toLocaleDateString()
                  : "N/A",
              ])}
              filename={`users-${new Date().toISOString().split("T")[0]}.csv`}
              style={{ backgroundColor: color.primary.action }}
            />

            <button
              onClick={() => setShowFiltersModal(true)}
              className={`flex items-center gap-2 rounded-md transition-colors font-medium`}
              style={{
                backgroundColor: button.secondaryAction.background,
                color: button.secondaryAction.color,
                border: button.secondaryAction.border,
                padding: `${button.secondaryAction.paddingY} ${button.secondaryAction.paddingX}`,
                fontSize: button.secondaryAction.fontSize,
              }}
              title="Open filters"
            >
              Filters
            </button>
          </div>
        </div>
      )}

      {/* Batch Action Bar */}
      {isSelectionMode && selectedUsers.size > 0 && activeTab === "users" && (
        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${tw.rounded} border border-gray-200 bg-white px-4 py-3 mb-6`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedUsers.size} user(s) selected
            </span>
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <HeadlessSelect
                options={[
                  { value: "", label: "Select department..." },
                  ...uniqueDepartments.map((dept) => ({
                    value: dept,
                    label: dept,
                  })),
                ]}
                value={batchDepartmentValue}
                onChange={(value) => setBatchDepartmentValue(value)}
                placeholder="Select department..."
                className="w-auto"
              />
              <button
                onClick={() => handleBatchAction("update_department")}
                disabled={isBatchProcessing || !batchDepartmentValue}
                className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none transition-colors`}
                style={{
                  backgroundColor: "transparent",
                  color: color.primary.action,
                  border: `1px solid ${color.primary.action}`,
                }}
              >
                Update Department
              </button>
            </div>
            <button
              onClick={() => handleBatchAction("deactivate")}
              disabled={isBatchProcessing}
              className={`inline-flex items-center gap-2 ${tw.rounded} px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              Deactivate
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={` ${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
      >
        {!rolesReady || isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner
              variant="modern"
              size="xl"
              color="primary"
              className="mb-4"
            />
            <p className={`${tw.textMuted} font-medium text-sm`}>
              {t.userManagement.loading.replace("{tab}", activeTab)}
            </p>
          </div>
        ) : errorState ? (
          <div className="p-8">
            <ErrorState
              title={t.userManagement.unableToLoad.replace("{tab}", activeTab)}
              message={
                typeof errorState === "string"
                  ? errorState
                  : extractErrorMessage(errorState)
              }
              onRetry={() => loadData({ skipCache: true })}
            />
          </div>
        ) : activeTab === "users" ? (
          filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm
                  ? t.userManagement.noUsersFound
                  : t.userManagement.noUsers}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {searchTerm
                  ? t.userManagement.tryAdjustingSearch
                  : t.userManagement.createFirstUser}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setIsModalOpen(true);
                  }}
                  className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 mx-auto text-sm text-white`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  <Plus className="w-4 h-4" />
                  {t.userManagement.addUser}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table with horizontal scroll */}
              <div className="overflow-x-auto">
                <table
                  className="w-full min-w-[800px]"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead style={{ background: color.surface.tableHeader }}>
                    <tr>
                      {isSelectionMode && (
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              filteredUsers.length > 0 &&
                              selectedUsers.size === filteredUsers.length
                            }
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                          />
                        </th>
                      )}
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        User
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Email
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Department
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Role
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Status
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Created
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => {
                      const normalizedStatus = normalizeStatus(user);
                      const userIsActive = normalizedStatus === "active";
                      const statusLabel = formatStatusLabel(normalizedStatus);
                      const statusColor = getStatusColorToken(normalizedStatus);

                      return (
                        <tr key={user.id} className="transition-colors">
                          {isSelectionMode && (
                            <td
                              className="px-4 sm:px-6 py-3 sm:py-4"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedUsers.has(user.id)}
                                onChange={() => handleSelectUser(user.id)}
                                className="rounded border-gray-300 text-[#3b8169] focus:ring-[#3b8169]"
                              />
                            </td>
                          )}
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <div>
                              <button
                                type="button"
                                onClick={() => handleViewUser(user)}
                                className="font-semibold text-sm sm:text-base text-gray-900 transition-colors truncate"
                                style={{
                                  color: "inherit",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color =
                                    color.primary.accent;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color =
                                    "rgb(17, 24, 39)"; // gray-900
                                }}
                                title={`${user.first_name} ${user.last_name}`}
                              >
                                {user.first_name} {user.last_name}
                              </button>
                            </div>
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <div
                              className={`text-sm ${tw.textMuted} truncate`}
                              title={user.email_address || user.email}
                            >
                              {user.email_address || user.email}
                            </div>
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <span
                              className={`text-sm text-gray-900 whitespace-nowrap`}
                            >
                              {user.department || "N/A"}
                            </span>
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <span
                              className={`text-sm text-gray-900 whitespace-nowrap`}
                            >
                              {getUserRoleName(user)}
                            </span>
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <span
                              className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                                userIsActive
                                  ? `bg-[${color.status.success}]/10 text-[${color.status.success}]`
                                  : `bg-[${statusColor}]/10 text-[${statusColor}]`
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td
                            className={`px-4 sm:px-6 py-3 sm:py-4 text-sm ${tw.textMuted} whitespace-nowrap`}
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <DateFormatter
                              date={user.created_at}
                              useLocale
                              year="numeric"
                              month="short"
                              day="numeric"
                            />
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleToggleStatus(user)}
                                disabled={loadingActions.toggling.has(user.id)}
                                className={`p-2 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                style={{
                                  color: userIsActive
                                    ? deactivateColor
                                    : activateColor,
                                }}
                                title={
                                  loadingActions.toggling.has(user.id)
                                    ? t.profile.saving
                                    : userIsActive
                                      ? t.userManagement.deactivateUserTitle
                                      : t.userManagement.activateUserTitle
                                }
                              >
                                {loadingActions.toggling.has(user.id) ? (
                                  <LoadingSpinner
                                    variant="modern"
                                    size="sm"
                                    color="primary"
                                  />
                                ) : userIsActive ? (
                                  <Ban className="w-4 h-4" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleViewUser(user)}
                                className={`p-2 ${tw.rounded} transition-colors`}
                                style={{
                                  color: color.primary.action,
                                  backgroundColor: "transparent",
                                }}
                                title="View user details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <PermissionGate permission="users.update">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsModalOpen(true);
                                  }}
                                  className={`p-2 ${tw.rounded} transition-colors`}
                                  style={{
                                    color: color.primary.action,
                                    backgroundColor: "transparent",
                                  }}
                                  title={t.userManagement.editUser}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="users.delete">
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={loadingActions.deleting.has(
                                    user.id,
                                  )}
                                  className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                  title={
                                    loadingActions.deleting.has(user.id)
                                      ? t.profile.saving
                                      : t.userManagement.deleteUser
                                  }
                                >
                                  {loadingActions.deleting.has(user.id) ? (
                                    <LoadingSpinner
                                      variant="modern"
                                      size="sm"
                                      color="primary"
                                    />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards - Hidden, using table with horizontal scroll instead */}
              <div className="hidden">
                {filteredUsers.map((user) => {
                  const normalizedStatus = normalizeStatus(user);
                  const userIsActive = normalizedStatus === "active";
                  const statusLabel = formatStatusLabel(normalizedStatus);
                  const statusColor = getStatusColorToken(normalizedStatus);

                  return (
                    <div
                      key={user.id}
                      className="p-4 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold mb-1">
                          <button
                            type="button"
                            onClick={() => handleViewUser(user)}
                            className="transition-colors truncate block max-w-full"
                            style={{
                              color: "rgb(17, 24, 39)", // gray-900
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "rgb(17, 24, 39)"; // gray-900
                            }}
                            title={`${user.first_name} ${user.last_name}`}
                          >
                            {user.first_name} {user.last_name}
                          </button>
                        </div>
                        <div
                          className={`text-sm ${tw.textSecondary} mb-2 truncate`}
                          title={user.email_address || user.email}
                        >
                          {user.email_address || user.email}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span
                            className={`text-xs font-medium text-gray-700`}
                          >
                            {user.department || "N/A"}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700`}
                          >
                            {getUserRoleName(user)}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              userIsActive
                                ? `bg-[${color.status.success}]/10 text-[${color.status.success}]`
                                : `bg-[${statusColor}]/10 text-[${statusColor}]`
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={loadingActions.toggling.has(user.id)}
                            className={`p-2 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                            style={{
                              color: userIsActive
                                ? deactivateColor
                                : activateColor,
                            }}
                            title={
                              loadingActions.toggling.has(user.id)
                                ? t.profile.saving
                                : userIsActive
                                  ? t.userManagement.deactivateUserTitle
                                  : t.userManagement.activateUserTitle
                            }
                          >
                            {loadingActions.toggling.has(user.id) ? (
                              <LoadingSpinner
                                variant="modern"
                                size="sm"
                                color="primary"
                              />
                            ) : userIsActive ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleViewUser(user)}
                            className={`p-2 ${tw.rounded} transition-colors`}
                            style={{
                              color: color.primary.action,
                              backgroundColor: "transparent",
                            }}
                            title="View user details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsModalOpen(true);
                            }}
                            className={`p-2 ${tw.rounded} transition-colors`}
                            style={{
                              color: color.primary.action,
                              backgroundColor: "transparent",
                            }}
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={loadingActions.deleting.has(user.id)}
                            className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={
                              loadingActions.deleting.has(user.id)
                                ? t.profile.saving
                                : t.userManagement.deleteUser
                            }
                          >
                            {loadingActions.deleting.has(user.id) ? (
                              <LoadingSpinner
                                variant="modern"
                                size="sm"
                                color="primary"
                              />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {!isLoading && filteredUsers.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  pageSize={PAGE_SIZE}
                  totalItems={filteredUsers.length}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )
        ) : activeTab === "requests" ? (
          filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Pending Requests
              </h3>
              <p className={`${tw.textMuted}`}>
                All account requests have been processed.
              </p>
            </div>
          ) : (
            <>
              {/* Table with horizontal scroll */}
              <div className="overflow-x-auto">
                <table
                  className="w-full min-w-[600px]"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead style={{ background: color.surface.tableHeader }}>
                    <tr>
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        User
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Email
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Requested Role
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Status
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Requested
                      </th>
                      <th
                        className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request, index) => {
                      const requestId = resolveAccountRequestId(request);
                      const requestKey =
                        requestId ??
                        request.user_id ??
                        `${
                          request.email ?? request.email_address ?? "request"
                        }-${index}`;
                      const approvingLoading =
                        typeof requestId === "number" &&
                        loadingActions.approving.has(requestId);
                      const rejectingLoading =
                        typeof requestId === "number" &&
                        loadingActions.rejecting.has(requestId);
                      const actionDisabled = typeof requestId !== "number";
                      const fullName =
                        [request.first_name, request.last_name]
                          .filter(Boolean)
                          .join(" ")
                          .trim() || "Unknown";
                      const requestEmail =
                        request.email_address ??
                        request.email ??
                        request.private_email_address ??
                        "N/A";
                      const requestDate =
                        request.created_at ?? request.created_on;
                      const formattedDate = requestDate
                        ? formatDate(requestDate)
                        : "N/A";
                      const requestRole = getPendingRequestRole(request);

                      return (
                        <tr key={requestKey} className="transition-colors">
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <div
                              className={`font-semibold text-sm sm:text-base ${tw.textPrimary} truncate`}
                              title={fullName}
                            >
                              {fullName}
                            </div>
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <span
                              className={`text-sm ${tw.textMuted} truncate`}
                              title={requestEmail}
                            >
                              {requestEmail}
                            </span>
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <span
                              className={`text-sm font-medium text-gray-700 whitespace-nowrap`}
                            >
                              {requestRole}
                            </span>
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {getStatusBadge(request)}
                          </td>
                          <td
                            className={`px-4 sm:px-6 py-3 sm:py-4 text-sm ${tw.textMuted} whitespace-nowrap`}
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {formattedDate}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              {request.status === "submitted" && (
                                <button
                                  onClick={() => handleMoveToReview(request)}
                                  disabled={actionDisabled || approvingLoading}
                                  className={`p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                  title="Move to review"
                                >
                                  {approvingLoading ? (
                                    <LoadingSpinner variant="modern" size="sm" color="primary" />
                                  ) : (
                                    <UserPlus className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              {request.status === "under_review" && (
                                <button
                                  onClick={() => handleMoveToPendingApproval(request)}
                                  disabled={actionDisabled || approvingLoading}
                                  className={`p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                  title="Send to approver"
                                >
                                  {approvingLoading ? (
                                    <LoadingSpinner variant="modern" size="sm" color="primary" />
                                  ) : (
                                    <UserCheck className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              {request.status === "pending_approval" && (
                                <>
                                  <button
                                    onClick={() => handleApproveRequest(request)}
                                    disabled={actionDisabled || approvingLoading}
                                    className={`p-2 text-green-600 hover:text-green-700 hover:bg-green-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title="Approve request"
                                  >
                                    {approvingLoading ? (
                                      <LoadingSpinner variant="modern" size="sm" color="primary" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(request)}
                                    disabled={actionDisabled}
                                    className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title="Reject request"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {request.status === "approved" && (
                                <button
                                  onClick={() => handleCreateUserFromRequest(request)}
                                  disabled={actionDisabled || approvingLoading}
                                  className={`p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                  title="Create user"
                                >
                                  {approvingLoading ? (
                                    <LoadingSpinner variant="modern" size="sm" color="primary" />
                                  ) : (
                                    <UserPlus className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards - Hidden, using table with horizontal scroll instead */}
              <div className="hidden">
                {filteredRequests.map((request, index) => {
                  const requestId = resolveAccountRequestId(request);
                  const requestKey =
                    requestId ??
                    request.user_id ??
                    `${
                      request.email ?? request.email_address ?? "request"
                    }-${index}`;
                  const approvingLoading =
                    typeof requestId === "number" &&
                    loadingActions.approving.has(requestId);
                  const rejectingLoading =
                    typeof requestId === "number" &&
                    loadingActions.rejecting.has(requestId);
                  const actionDisabled = typeof requestId !== "number";
                  const fullName =
                    [request.first_name, request.last_name]
                      .filter(Boolean)
                      .join(" ")
                      .trim() || "Unknown";
                  const requestEmail =
                    request.email_address ??
                    request.email ??
                    request.private_email_address ??
                    "N/A";
                  const requestRole = getPendingRequestRole(request);

                  return (
                    <div
                      key={requestKey}
                      className="p-4 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-base font-semibold ${tw.textPrimary} mb-1`}
                        >
                          {fullName}
                        </div>
                        <div className={`text-sm ${tw.textSecondary} mb-2`}>
                          {requestEmail}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700`}
                          >
                            {requestRole}
                          </span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleApproveRequest(request)}
                            disabled={actionDisabled || approvingLoading}
                            className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {approvingLoading ? (
                              <>
                                <LoadingSpinner
                                  variant="modern"
                                  size="sm"
                                  color="primary"
                                  className="mr-1"
                                />
                                Approving...
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-1" />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request)}
                            disabled={actionDisabled || rejectingLoading}
                            className={`inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {rejectingLoading ? (
                              <>
                                <LoadingSpinner
                                  variant="modern"
                                  size="sm"
                                  color="primary"
                                  className="mr-1"
                                />
                                Rejecting...
                              </>
                            ) : (
                              <>
                                <UserX className="w-4 h-4 mr-1" />
                                Reject
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )
        ) : activeTab === "analytics" ? (
          <div className="p-4 sm:p-6">
            {reportsLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner
                  variant="modern"
                  size="lg"
                  color="primary"
                  className="mr-3"
                />
                <span className={`${tw.textSecondary}`}>
                  Loading analytics...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Users by Status */}
                <div
                  className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 min-w-0`}
                >
                  {Object.keys(statusCounts).length > 0 ? (
                    (() => {
                      const statusColors: Record<string, string> = {
                        active: color.status.success,
                        inactive: color.status.danger,
                        pending_activation: color.status.warning,
                        suspended: color.text.muted,
                      };
                      const statusData = Object.entries(statusCounts)
                        .sort(([, a], [, b]) => Number(b) - Number(a))
                        .map(([status, count]) => ({
                          name: status
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase()),
                          value: Number(count) || 0,
                          color:
                            statusColors[status.toLowerCase()] ||
                            color.primary.accent,
                        }));
                      const total = statusData.reduce(
                        (sum, item) => sum + (Number(item.value) || 0),
                        0,
                      );

                      return (
                        <>
                          <h3
                            className={`text-sm sm:text-base font-semibold ${tw.textPrimary} mb-3 sm:mb-4`}
                          >
                            Users by Status
                          </h3>
                          <div className="h-56 sm:h-64 w-full mb-3 sm:mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={statusData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={(props) => {
                                    const percent = props.percent as
                                      | number
                                      | undefined;
                                    return percent && percent > 0.05
                                      ? `${(percent * 100).toFixed(0)}%`
                                      : "";
                                  }}
                                  outerRadius="70%"
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {statusData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    borderRadius: "0.375rem",
                                    border: "1px solid #e5e7eb",
                                    backgroundColor: "#ffffff",
                                    padding: "0.75rem",
                                    boxShadow:
                                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-2 pt-4">
                            {statusData.map((item) => (
                              <div
                                key={item.name}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span
                                    className={`${tw.textPrimary} capitalize`}
                                  >
                                    {item.name}
                                  </span>
                                </div>
                                <span
                                  className="font-semibold"
                                  style={{ color: item.color }}
                                >
                                  {item.value}
                                </span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between text-sm font-semibold mt-2">
                              <span className={tw.textPrimary}>Total</span>
                              <span style={{ color: color.primary.accent }}>
                                {total}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className={`text-sm ${tw.textMuted}`}>
                        No status data
                      </p>
                    </div>
                  )}
                </div>

                {/* Users by Department */}
                <div
                  className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 min-w-0`}
                >
                  {Object.keys(departmentCounts).length > 0 ? (
                    (() => {
                      const departmentColors = [
                        color.primary.accent,
                        color.primary.action,
                        color.tertiary.tag4,
                        color.status.info,
                        color.status.warning,
                        color.status.success,
                      ];
                      const departmentData = Object.entries(departmentCounts)
                        .sort(([, a], [, b]) => Number(b) - Number(a))
                        .map(([dept, count], index) => ({
                          name: dept || "Unassigned",
                          value: Number(count) || 0,
                          color:
                            departmentColors[index % departmentColors.length],
                        }));
                      const total = departmentData.reduce(
                        (sum, item) => sum + (Number(item.value) || 0),
                        0,
                      );

                      return (
                        <>
                          <h3
                            className={`text-sm sm:text-base font-semibold ${tw.textPrimary} mb-3 sm:mb-4`}
                          >
                            Users by Department
                          </h3>
                          <div className="h-56 sm:h-64 w-full mb-3 sm:mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={departmentData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={(props) => {
                                    const percent = props.percent as
                                      | number
                                      | undefined;
                                    return percent && percent > 0.05
                                      ? `${(percent * 100).toFixed(0)}%`
                                      : "";
                                  }}
                                  outerRadius="70%"
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {departmentData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    borderRadius: "0.375rem",
                                    border: "1px solid #e5e7eb",
                                    backgroundColor: "#ffffff",
                                    padding: "0.75rem",
                                    boxShadow:
                                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                  }}
                                />
                                <Legend
                                  wrapperStyle={{ fontSize: "12px" }}
                                  formatter={(value) =>
                                    value.length > 15
                                      ? value.substring(0, 15) + "..."
                                      : value
                                  }
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-2 pt-4 max-h-40 overflow-y-auto">
                            {departmentData.map((item) => (
                              <div
                                key={item.name}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className={`${tw.textPrimary}`}>
                                    {item.name}
                                  </span>
                                </div>
                                <span
                                  className="font-semibold"
                                  style={{ color: item.color }}
                                >
                                  {item.value}
                                </span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between text-sm font-semibold mt-2">
                              <span className={tw.textPrimary}>Total</span>
                              <span style={{ color: color.primary.accent }}>
                                {total}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className={`text-sm ${tw.textMuted}`}>
                        No department data
                      </p>
                    </div>
                  )}
                </div>

                {/* Users by Role */}
                <div
                  className={`bg-white ${tw.rounded} border border-gray-200 p-5 sm:p-6 min-w-0`}
                >
                  {Object.keys(roleCounts).length > 0 ? (
                    (() => {
                      const roleColors = [
                        color.primary.accent,
                        color.primary.action,
                        color.tertiary.tag4,
                        color.status.info,
                        color.status.warning,
                        color.status.success,
                      ];
                      const roleData = Object.entries(roleCounts)
                        .sort(([, a], [, b]) => Number(b) - Number(a))
                        .map(([role, count], index) => ({
                          name: role,
                          value: Number(count) || 0,
                          color: roleColors[index % roleColors.length],
                        }));
                      const total = roleData.reduce(
                        (sum, item) => sum + (Number(item.value) || 0),
                        0,
                      );

                      return (
                        <>
                          <h3
                            className={`text-sm sm:text-base font-semibold ${tw.textPrimary} mb-3 sm:mb-4`}
                          >
                            Users by Role
                          </h3>
                          <div className="h-56 sm:h-64 w-full mb-3 sm:mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={roleData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={(props) => {
                                    const percent = props.percent as
                                      | number
                                      | undefined;
                                    return percent && percent > 0.05
                                      ? `${(percent * 100).toFixed(0)}%`
                                      : "";
                                  }}
                                  outerRadius="70%"
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {roleData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    borderRadius: "0.375rem",
                                    border: "1px solid #e5e7eb",
                                    backgroundColor: "#ffffff",
                                    padding: "0.75rem",
                                    boxShadow:
                                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                  }}
                                />
                                <Legend
                                  wrapperStyle={{ fontSize: "12px" }}
                                  formatter={(value) =>
                                    value.length > 15
                                      ? value.substring(0, 15) + "..."
                                      : value
                                  }
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-2 pt-4 max-h-40 overflow-y-auto">
                            {roleData.map((item) => (
                              <div
                                key={item.name}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span className={`${tw.textPrimary}`}>
                                    {item.name}
                                  </span>
                                </div>
                                <span
                                  className="font-semibold"
                                  style={{ color: item.color }}
                                >
                                  {item.value}
                                </span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between text-sm font-semibold mt-2">
                              <span className={tw.textPrimary}>Total</span>
                              <span style={{ color: color.primary.accent }}>
                                {total}
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className={`text-sm ${tw.textMuted}`}>No role data</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onUserSaved={(savedUser: UserType) => {
          setIsModalOpen(false);
          // Optimistically update user in list
          if (savedUser && savedUser.id) {
            setUsers((prev) =>
              prev.map((u) => (u.id === savedUser.id ? savedUser : u)),
            );
          }
          setSelectedUser(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        itemName={
          userToDelete
            ? `${userToDelete.first_name} ${userToDelete.last_name}`
            : ""
        }
        isLoading={isDeleting}
        confirmText="Delete User"
        cancelText="Cancel"
      />

      {/* Reject Request Modal */}
      {showRejectModal && rejectingRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            if (!loadingActions.rejecting.size) {
              setShowRejectModal(false);
              setRejectionReason("");
              setRejectingRequest(null);
            }
          }}
        >
          <div
            className={`bg-white ${tw.rounded} p-6 max-w-md w-full mx-4 shadow-lg`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Request
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to reject{" "}
              <strong>
                {rejectingRequest.first_name} {rejectingRequest.last_name}
              </strong>
              's request?
            </p>

            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700 mb-2 block">
                Rejection Reason
              </span>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this request..."
                className={`w-full px-3 py-2 border ${tw.rounded} text-sm focus:outline-none focus:ring-2`}
                rows={4}
                style={{
                  borderColor: color.border.default,
                  "--tw-ring-color": color.primary.accent,
                } as React.CSSProperties & { "--tw-ring-color": string }}
                disabled={loadingActions.rejecting.size > 0}
              />
            </label>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setRejectingRequest(null);
                }}
                disabled={loadingActions.rejecting.size > 0}
                className={`px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 ${tw.rounded} hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={loadingActions.rejecting.size > 0 || !rejectionReason.trim()}
                className={`px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {loadingActions.rejecting.size > 0 ? (
                  <>
                    <LoadingSpinner
                      variant="modern"
                      size="sm"
                      color="primary"
                    />
                    Rejecting...
                  </>
                ) : (
                  "Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal */}
      {(showFiltersModal || isClosingModal) &&
        createPortal(
          <div
            className={`fixed inset-0 overflow-hidden transition-opacity duration-300 ${
              isClosingModal ? "opacity-0" : "opacity-100"
            }`}
            style={{ zIndex: zIndex.overlay }}
          >
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={handleCloseModal}
            />

            {/* Side Modal Panel */}
            <div
              className={`absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 overflow-y-auto ${
                isClosingModal ? "translate-x-full" : "translate-x-0"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Filter Sections */}
              <div className="px-6 py-6 space-y-8">
                {/* Department Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Department
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="department"
                        value="all"
                        checked={filterDepartment === "all"}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">All Departments</span>
                    </label>
                    {uniqueDepartments.map((dept) => (
                      <label key={dept} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="department"
                          value={dept}
                          checked={filterDepartment === dept}
                          onChange={(e) => setFilterDepartment(e.target.value)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm text-gray-700">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Role
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="all"
                        checked={filterRole === "all"}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700">All Roles</span>
                    </label>
                    {uniqueRoles.map((role) => (
                      <label key={role} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={filterRole === role}
                          onChange={(e) => setFilterRole(e.target.value)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm text-gray-700">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Status
                  </label>
                  <div className="space-y-2">
                    {["all", "active", "inactive", "pending_activation", "suspended", "locked", "deactivated", "deleted"].map(
                      (status) => (
                        <label
                          key={status}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="status"
                            value={status}
                            checked={filterStatus === status}
                            onChange={(e) =>
                              setFilterStatus(
                                e.target.value as
                                  | "all"
                                  | "pending_activation"
                                  | "active"
                                  | "suspended"
                                  | "locked"
                                  | "deactivated"
                                  | "deleted"
                              )
                            }
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-gray-700 capitalize">
                            {status === "all"
                              ? "All Statuses"
                              : status.replace(/_/g, " ")}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white px-6 py-4 flex gap-3">
                <button
                  onClick={() => {
                    setFilterDepartment("all");
                    setFilterRole("all");
                    setFilterStatus("all");
                    handleCloseModal();
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 ${tw.rounded} hover:bg-gray-200 transition-colors`}
                >
                  Clear All
                </button>
                <button
                  onClick={handleCloseModal}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors`}
                  style={{ backgroundColor: color.primary.accent }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

    </div>
  );
}
