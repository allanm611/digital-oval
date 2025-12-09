import { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userService } from "../../users/services/userService";
import { accountService } from "../../account/services/accountService";
import { UserType, PaginatedResponse } from "../../users/types/user";
import { useToast } from "../../../contexts/ToastContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import UserModal from "./UserModal";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ErrorState from "../../../shared/components/ui/ErrorState";
import { color, tw, components } from "../../../shared/utils/utils";
import { useAuth } from "../../../contexts/AuthContext";
import { roleService } from "../../roles/services/roleService";
import { Role } from "../../roles/types/role";
import DateFormatter from "../../../shared/components/DateFormatter";
import { formatDate } from "../../../shared/services/dateService";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

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
};

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  type UserWithResolvedRole = UserType & { resolvedRoleName?: string };

  const [users, setUsers] = useState<UserWithResolvedRole[]>([]);
  const [accountRequests, setAccountRequests] = useState<
    AccountRequestListItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "users" | "requests" | "analytics"
  >("users");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
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

  const activateColor = color.tertiary.tag4;
  const deactivateColor = color.configStatus.inactive;

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

      if (skipCache) {
        query.skipCache = true;
      }

      return query;
    },
    [searchTerm]
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
      if (term) {
        return userService.searchUsers(
          buildSearchQuery({ skipCache, searchTermOverride: term })
        );
      }

      const baseQuery: Record<string, unknown> = {};
      if (skipCache) {
        baseQuery.skipCache = true;
      }

      return userService.getUsers(baseQuery);
    },
    [buildSearchQuery, searchTerm]
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

        const usersResponse = await fetchUsers({
          skipCache,
          searchTermOverride,
        });

        if (usersResponse.success) {
          const pendingActivationUsers = usersResponse.data.filter(
            (candidate) => {
              const candidateStatus = (
                candidate as unknown as { account_status?: string }
              )?.account_status;
              return (
                typeof candidateStatus === "string" &&
                candidateStatus.toLowerCase() === "pending_activation"
              );
            }
          );

          const activeUsers = usersResponse.data.filter((candidate) => {
            const candidateStatus = (
              candidate as unknown as { account_status?: string }
            )?.account_status;
            return !(
              typeof candidateStatus === "string" &&
              candidateStatus.toLowerCase() === "pending_activation"
            );
          });

          const currentRoleLookup = roleLookupRef.current;
          const usersWithResolvedRoles = activeUsers.map((user) => {
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
          setAccountRequests(
            pendingActivationUsers.map((pending) => {
              const primaryRoleId = (
                pending as unknown as {
                  primary_role_id?: number;
                }
              )?.primary_role_id;
              const fallbackRoleName = (
                pending as unknown as {
                  role_name?: string;
                }
              )?.role_name;
              const resolvedRoleName =
                (primaryRoleId != null
                  ? currentRoleLookup[primaryRoleId]?.name
                  : undefined) ?? fallbackRoleName;

              return {
                id: pending.id,
                requestId: (
                  pending as unknown as { onboarding_request_id?: number }
                )?.onboarding_request_id,
                first_name: pending.first_name,
                last_name: pending.last_name,
                email_address:
                  pending.email_address ||
                  (pending as { email?: string }).email,
                department: pending.department || undefined,
                roleId: primaryRoleId ?? undefined,
                roleName: resolvedRoleName,
                created_at: pending.created_at,
              };
            })
          );
          const totalFromResponse =
            (usersResponse.meta?.total as number | undefined) ??
            usersResponse.data.length;

          setUserSummary({
            total: totalFromResponse,
            cached: Boolean(usersResponse.meta?.isCachedResponse),
          });
        }

        // Account requests derived from pending activation users above
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load data";
        setErrorState(message);
        showError("Error loading users", message);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchUsers, showError]
  );

  // Load both users and roles in parallel on initial mount
  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setErrorState("");

        // Fetch both users and roles in parallel
        const [usersResponse, rolesResponse] = await Promise.allSettled([
          fetchUsers({ skipCache: false }),
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

        // Process users
        if (
          usersResponse.status === "fulfilled" &&
          usersResponse.value.success
        ) {
          const usersData = usersResponse.value.data;
          const pendingActivationUsers = usersData.filter((candidate) => {
            const candidateStatus = (
              candidate as unknown as { account_status?: string }
            )?.account_status;
            return (
              typeof candidateStatus === "string" &&
              candidateStatus.toLowerCase() === "pending_activation"
            );
          });

          const activeUsers = usersData.filter((candidate) => {
            const candidateStatus = (
              candidate as unknown as { account_status?: string }
            )?.account_status;
            return !(
              typeof candidateStatus === "string" &&
              candidateStatus.toLowerCase() === "pending_activation"
            );
          });

          const currentRoleLookup = roleLookupRef.current;
          const usersWithResolvedRoles = activeUsers.map((user) => {
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
          setAccountRequests(
            pendingActivationUsers.map((pending) => {
              const primaryRoleId = (
                pending as unknown as {
                  primary_role_id?: number;
                }
              )?.primary_role_id;
              const fallbackRoleName = (
                pending as unknown as {
                  role_name?: string;
                }
              )?.role_name;
              const resolvedRoleName =
                (primaryRoleId != null
                  ? currentRoleLookup[primaryRoleId]?.name
                  : undefined) ?? fallbackRoleName;

              return {
                id: pending.id,
                requestId: (
                  pending as unknown as { onboarding_request_id?: number }
                )?.onboarding_request_id,
                first_name: pending.first_name,
                last_name: pending.last_name,
                email_address:
                  pending.email_address ||
                  (pending as { email?: string }).email,
                department: pending.department || undefined,
                roleId: primaryRoleId ?? undefined,
                roleName: resolvedRoleName,
                created_at: pending.created_at,
              };
            })
          );
          const totalFromResponse =
            (usersResponse.value.meta?.total as number | undefined) ??
            usersData.length;

          setUserSummary({
            total: totalFromResponse,
            cached: Boolean(usersResponse.value.meta?.isCachedResponse),
          });
        } else if (usersResponse.status === "rejected") {
          const message =
            usersResponse.reason instanceof Error
              ? usersResponse.reason.message
              : "Failed to load users";
          setErrorState(message);
          showError("Error loading users", message);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load data";
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
        isRoleCount = false
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
                  (typeof item[k] === "string" || typeof item[k] === "number")
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
        const pendingActivationUsers = searchResponse.data.filter(
          (candidate) => {
            const candidateStatus = (
              candidate as unknown as { account_status?: string }
            )?.account_status;
            return (
              typeof candidateStatus === "string" &&
              candidateStatus.toLowerCase() === "pending_activation"
            );
          }
        );

        const activeUsers = searchResponse.data.filter((candidate) => {
          const candidateStatus = (
            candidate as unknown as { account_status?: string }
          )?.account_status;
          return !(
            typeof candidateStatus === "string" &&
            candidateStatus.toLowerCase() === "pending_activation"
          );
        });

        setUsers(activeUsers);
        setAccountRequests(
          pendingActivationUsers.map((pending) => ({
            id: pending.id,
            requestId: (
              pending as unknown as { onboarding_request_id?: number }
            )?.onboarding_request_id,
            first_name: pending.first_name,
            last_name: pending.last_name,
            email_address:
              pending.email_address || (pending as { email?: string }).email,
            department: pending.department || undefined,
            role: (pending as unknown as { role_name?: string }).role_name,
            created_at: pending.created_at,
          }))
        );

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
        err instanceof Error ? err.message : "Failed to search users"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUser = (user: UserType) => {
    navigate(`/dashboard/user-management/${user.id}`);
  };

  const resolveAccountRequestId = (
    request: AccountRequestListItem
  ): number | null => {
    const identifier = request.id ?? request.requestId;
    return typeof identifier === "number" ? identifier : null;
  };

  const handleApproveRequest = async (request: AccountRequestListItem) => {
    const requestId = resolveAccountRequestId(request);
    if (!requestId) {
      showError(
        "Unable to approve request",
        "Missing identifier for the selected request."
      );
      return;
    }

    const onboardingRequestId =
      typeof request.requestId === "number" ? request.requestId : null;
    const userId = request.id ?? request.user_id ?? null;

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
      if (onboardingRequestId) {
        await accountService.approveAccountRequest(onboardingRequestId);
      } else if (userId) {
        await userService.activateUser(userId, {
          updated_by: authUser?.user_id ?? undefined,
        });
      }

      await loadData({ skipCache: true }); // Skip cache to get fresh data
      success(
        t.userManagement.requestApproved,
        `${t.userManagement.requestApproved} - ${request.first_name} ${request.last_name}`
      );
    } catch (err) {
      showError(
        "Error approving request",
        err instanceof Error ? err.message : "Error approving request"
      );
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({
        ...prev,
        approving: new Set(
          [...prev.approving].filter((id) => id !== requestId)
        ),
      }));
    }
  };

  const handleRejectRequest = async (request: AccountRequestListItem) => {
    const requestId = resolveAccountRequestId(request);
    if (!requestId) {
      showError(
        "Unable to reject request",
        "Missing identifier for the selected request."
      );
      return;
    }

    const onboardingRequestId =
      typeof request.requestId === "number" ? request.requestId : null;
    const userId = request.id ?? request.user_id ?? null;

    const confirmed = await confirm({
      title: "Reject Request",
      message: `Are you sure you want to reject ${request.first_name} ${request.last_name}'s request?`,
      type: "danger",
      confirmText: "Reject",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    // Set loading state
    setLoadingActions((prev) => ({
      ...prev,
      rejecting: new Set([...prev.rejecting, requestId]),
    }));

    try {
      if (onboardingRequestId) {
        await accountService.rejectAccountRequest(onboardingRequestId);
      } else if (userId) {
        await userService.deactivateUser(userId, {
          updated_by: authUser?.user_id ?? undefined,
        });
      }

      await loadData({ skipCache: true }); // Skip cache to get fresh data
      success(
        t.userManagement.requestRejected,
        `${t.userManagement.requestRejected} - ${request.first_name} ${request.last_name}`
      );
    } catch (err) {
      showError(
        "Error rejecting request",
        err instanceof Error ? err.message : "Error rejecting request"
      );
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({
        ...prev,
        rejecting: new Set(
          [...prev.rejecting].filter((id) => id !== requestId)
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
          `User ${user.first_name} ${user.last_name} deactivated successfully`
        );
      } else {
        await userService.activateUser(user.id);
        success(
          t.userManagement.userActivated,
          `User ${user.first_name} ${user.last_name} activated successfully`
        );
      }
      await loadData({ skipCache: true }); // Skip cache to get fresh data
    } catch (err) {
      showError(
        "Error updating status",
        err instanceof Error ? err.message : "Error toggling user status"
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
      await loadData({ skipCache: true }); // Skip cache to get fresh data
      success(
        t.userManagement.userDeleted,
        `${userToDelete.first_name} ${userToDelete.last_name} deleted successfully`
      );
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      showError(
        "Error deleting user",
        err instanceof Error ? err.message : "Error deleting user"
      );
    } finally {
      // Clear loading state
      setLoadingActions((prev) => ({
        ...prev,
        deleting: new Set(
          [...prev.deleting].filter((id) => id !== userToDelete.id)
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
      (user as unknown as { is_suspended?: boolean })?.is_suspended
    );
    if (isSuspended) return "suspended";
    const isActive = Boolean(
      (user as unknown as { is_active?: boolean })?.is_active ??
        (user as unknown as { is_activated?: boolean })?.is_activated
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
        (user as unknown as { is_activated?: boolean })?.is_activated
    );
  };

  // Get unique departments from users
  const uniqueDepartments = Array.from(
    new Set(
      users
        .map((user) => user.department)
        .filter((dept): dept is string => Boolean(dept && dept.trim() !== ""))
    )
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
    [roleLookup]
  );

  const uniqueRoles = Array.from(
    new Set(
      users
        .map((user) => getUserRoleName(user))
        .filter((role): role is string => Boolean(role && role !== "N/A"))
    )
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
    { active: 0, inactive: 0, locked: 0 }
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
    [roleLookup]
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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {userStatsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="rounded-md border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"
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
          onClick={() => setActiveTab("analytics")}
          className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 relative flex-shrink-0 ${
            activeTab === "analytics"
              ? "text-black"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <BarChart3 className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">
            {t.userManagement.analytics}
          </span>
          {activeTab === "analytics" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: color.primary.accent }}
            />
          )}
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
                { value: "all", label: t.userManagement.allDepartments },
                ...uniqueDepartments.map((dept) => ({
                  value: dept.toLowerCase(),
                  label: dept,
                })),
              ]}
              value={filterDepartment}
              onChange={(value) => setFilterDepartment(value as string)}
              placeholder={t.userManagement.selectDepartment}
              className="w-full sm:min-w-[160px] sm:w-auto"
            />

            <HeadlessSelect
              options={[
                { value: "all", label: t.userManagement.allRoles },
                ...uniqueRoles.map((role) => ({
                  value: role.toLowerCase(),
                  label: role,
                })),
              ]}
              value={filterRole}
              onChange={(value) => setFilterRole(value as string)}
              placeholder={t.userManagement.selectRole}
              className="w-full sm:min-w-[160px] sm:w-auto"
            />

            <HeadlessSelect
              options={[
                { value: "all", label: t.userManagement.allStatus },
                { value: "active", label: t.userManagement.active },
                { value: "inactive", label: t.userManagement.inactive },
              ]}
              value={filterStatus}
              onChange={(value) =>
                setFilterStatus(value as "all" | "active" | "inactive")
              }
              placeholder={t.userManagement.selectStatus}
              className="w-full sm:min-w-[140px] sm:w-auto"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={` rounded-md border border-[${color.border.default}] overflow-hidden`}
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
              message={errorState}
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
                  className="px-4 py-2 rounded-md font-semibold transition-all duration-200 flex items-center gap-2 mx-auto text-sm text-white"
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
                    {filteredUsers.map((user) => {
                      const normalizedStatus = normalizeStatus(user);
                      const userIsActive = normalizedStatus === "active";
                      const statusLabel = formatStatusLabel(normalizedStatus);
                      const statusColor = getStatusColorToken(normalizedStatus);

                      return (
                        <tr key={user.id} className="transition-colors">
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
                              <div
                                className={`text-sm ${tw.textMuted} truncate mt-1`}
                                title={user.email_address || user.email}
                              >
                                {user.email_address || user.email}
                              </div>
                            </div>
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <span
                              className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 whitespace-nowrap`}
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
                              className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 whitespace-nowrap`}
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
                                className="p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className="p-2 rounded-md transition-colors"
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
                                className="p-2 rounded-md transition-colors"
                                style={{
                                  color: color.primary.action,
                                  backgroundColor: "transparent",
                                }}
                                title={t.userManagement.editUser}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={loadingActions.deleting.has(user.id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700`}
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
                            className="p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="p-2 rounded-md transition-colors"
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
                            className="p-2 rounded-md transition-colors"
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
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        Requested Role
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
                            <div>
                              <div
                                className={`font-semibold text-sm sm:text-base ${tw.textPrimary} truncate`}
                                title={fullName}
                              >
                                {fullName}
                              </div>
                              <div
                                className={`text-sm ${tw.textMuted} truncate mt-1`}
                                title={requestEmail}
                              >
                                {requestEmail}
                              </div>
                            </div>
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <span
                              className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 whitespace-nowrap`}
                            >
                              {requestRole}
                            </span>
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
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleApproveRequest(request)}
                                disabled={actionDisabled || approvingLoading}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  actionDisabled
                                    ? "Missing request identifier"
                                    : approvingLoading
                                    ? t.profile.saving
                                    : t.userManagement.approveRequest
                                }
                              >
                                {approvingLoading ? (
                                  <LoadingSpinner
                                    variant="modern"
                                    size="sm"
                                    color="primary"
                                  />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request)}
                                disabled={actionDisabled || rejectingLoading}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  actionDisabled
                                    ? "Missing request identifier"
                                    : rejectingLoading
                                    ? t.profile.saving
                                    : t.userManagement.rejectRequest
                                }
                              >
                                {rejectingLoading ? (
                                  <LoadingSpinner
                                    variant="modern"
                                    size="sm"
                                    color="primary"
                                  />
                                ) : (
                                  <UserX className="w-4 h-4" />
                                )}
                              </button>
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
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="bg-white rounded-md border border-gray-200 p-5 sm:p-6 min-w-0">
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
                        0
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
                <div className="bg-white rounded-md border border-gray-200 p-5 sm:p-6 min-w-0">
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
                        0
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
                <div className="bg-white rounded-md border border-gray-200 p-5 sm:p-6 min-w-0">
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
                        0
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
        onUserSaved={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
          loadData({ skipCache: true }); // Skip cache to get fresh data
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
    </div>
  );
}
