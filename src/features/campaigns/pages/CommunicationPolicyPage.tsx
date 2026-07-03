import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, ShieldCheck, MoreHorizontal, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import SearchInput from "../../../shared/components/ui/SearchInput";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { color, tw, components, helpers, zIndex } from "../../../shared/utils/utils";
import {
  CommunicationPolicyConfiguration,
  CreateCommunicationPolicyRequest,
  TimeWindowConfig,
  MaximumCommunicationConfig,
  DNDConfig,
  VIPListConfig,
} from "../types/communicationPolicyConfig";
import CommunicationPolicyModal from "../components/CommunicationPolicyModal";
import CommunicationPolicyDetailsExpandedRow from "../components/CommunicationPolicyDetailsExpandedRow";
import { communicationPolicyService } from "../services/communicationPolicyService";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";

export default function CommunicationPolicyPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const [policies, setPolicies] = useState<CommunicationPolicyConfiguration[]>(
    []
  );

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteItem } = useDeleteConfirm({
    onDelete: async (id) => {
      const numericId = typeof id === "string" ? parseInt(id) : id;
      await communicationPolicyService.deletePolicy(numericId);
      setPolicies((prev) => prev.filter((p) => p.id !== numericId));
      showToast(t.communicationPolicy.deleteSuccess);
    },
    itemLabel: "Communication Policy",
  });
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<
    CommunicationPolicyConfiguration | undefined
  >();
  const [isSaving, setIsSaving] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [clearFiltersKey, setClearFiltersKey] = useState(0);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [channelsHoverModal, setChannelsHoverModal] = useState<{ policyId: number; channels: string[]; position: { top: number; left: number } } | null>(null);
  const actionMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const dropdownMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const channelRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Load policies from service and subscribe to changes
  useEffect(() => {
    const loadPolicies = async () => {
      setLoading(true);
      try {
        const data = await communicationPolicyService.getAllPolicies();
        if (Array.isArray(data)) setPolicies(data);
      } finally {
        setLoading(false);
      }
    };

    loadPolicies();

    // Subscribe to policy changes
    const unsubscribe = communicationPolicyService.subscribe(
      (updatedPolicies) => {
        if (Array.isArray(updatedPolicies)) {
          setPolicies(updatedPolicies);
        }
      }
    );

    return unsubscribe;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      let isOutside = true;

      Object.values(actionMenuRefs.current).forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          isOutside = false;
        }
      });

      Object.values(dropdownMenuRefs.current).forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          isOutside = false;
        }
      });

      if (isOutside) {
        setShowActionMenu(null);
        setDropdownPosition(null);
      }
    };

    if (showActionMenu !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showActionMenu]);

  const handleToggleActive = async (policy: CommunicationPolicyConfiguration) => {
    const newActive = !policy.is_active;
    setTogglingId(policy.id);
    setPolicies((prev) =>
      prev.map((p) => (p.id === policy.id ? { ...p, is_active: newActive } : p))
    );
    try {
      await communicationPolicyService.updatePolicy(policy.id, { is_active: newActive } as any);
      showToast(newActive ? "Activated" : "Deactivated", `${policy.name} has been ${newActive ? "activated" : "deactivated"}`);
    } catch (err) {
      showError("Unable to Update Policy", extractBackendError(err, "Failed to update policy status. Please try again later."));
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? { ...p, is_active: !newActive } : p))
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreatePolicy = () => {
    setEditingPolicy(undefined);
    setIsModalOpen(true);
  };

  const handleEditPolicy = (policy: CommunicationPolicyConfiguration) => {
    setEditingPolicy(policy);
    setIsModalOpen(true);
  };

  const handleDeletePolicy = (policy: CommunicationPolicyConfiguration) => {
    openDeleteConfirm(policy.id, policy.name);
    setShowActionMenu(null);
  };

  const handleActionMenuToggle = (
    policyId: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (showActionMenu === policyId) {
      setShowActionMenu(null);
      setDropdownPosition(null);
    } else {
      setShowActionMenu(policyId);

      if (event && event.currentTarget) {
        const button = event.currentTarget;
        const buttonRect = button.getBoundingClientRect();
        const dropdownWidth = 256;
        const spacing = 4;
        const padding = 8;

        const top = buttonRect.bottom + spacing;
        let left = buttonRect.right - dropdownWidth;

        if (left + dropdownWidth > window.innerWidth - padding) {
          left = window.innerWidth - dropdownWidth - padding;
        }
        if (left < padding) {
          left = padding;
        }

        setDropdownPosition({
          top,
          left,
          maxHeight: window.innerHeight - buttonRect.bottom - 16,
        });
      }
    }
  };

  const handlePolicySaved = async (
    policyData: CreateCommunicationPolicyRequest
  ) => {
    try {
      setIsSaving(true);
      if (editingPolicy) {
        await communicationPolicyService.updatePolicy(editingPolicy.id, policyData);
        showToast(t.communicationPolicy.updateSuccess);
      } else {
        await communicationPolicyService.createPolicy(policyData);
        showToast(t.communicationPolicy.createSuccess);
      }
      // Re-fetch from server to ensure list is up to date
      const fresh = await communicationPolicyService.getAllPolicies();
      if (Array.isArray(fresh)) setPolicies(fresh);
      setIsModalOpen(false);
      setEditingPolicy(undefined);
    } catch (err) {
      console.error("Failed to save policy:", err);
      const action = editingPolicy ? "Update" : "Create";
      showError(`Unable to ${action} Policy`, extractBackendError(err, `Failed to ${action.toLowerCase()} policy. Please try again later.`));
    } finally {
      setIsSaving(false);
    }
  };

  const getChannelsDisplay = (channelValues: string[] | null | undefined, policyId: number) => {
    if (!channelValues || !Array.isArray(channelValues) || channelValues.length === 0) {
      return null;
    }

    const visibleChannels = channelValues.slice(0, 2);
    const moreCount = Math.max(0, channelValues.length - 2);

    const handleMoreHover = (e: React.MouseEvent<HTMLDivElement>) => {
      if (moreCount <= 0) return;
      if (!e.currentTarget) return;

      const rect = e.currentTarget.getBoundingClientRect();
      if (!rect) return;

      setChannelsHoverModal({
        policyId,
        channels: channelValues,
        position: {
          top: rect.bottom + 4,
          left: rect.left,
        },
      });
    };

    const handleMoreLeave = () => {
      setTimeout(() => {
        if (channelsHoverModal && channelsHoverModal.policyId === policyId) {
          setChannelsHoverModal(null);
        }
      }, 100);
    };

    return (
      <div
        ref={(el) => {
          if (el && policyId) {
            channelRefs.current[policyId] = el;
          }
        }}
        className="flex items-center gap-2"
      >
        {visibleChannels && visibleChannels.map((channelValue) => {
          if (!channelValue) return null;
          return (
            <div
              key={channelValue}
              className={`flex items-center px-2 py-1 rounded whitespace-nowrap ${tw.accent10}`}
            >
              <span className={`${tw.caption} font-medium ${tw.textPrimary}`}>
                {channelValue}
              </span>
            </div>
          );
        })}
        {moreCount > 0 && (
          <div
            onMouseEnter={handleMoreHover}
            onMouseLeave={handleMoreLeave}
            className={`flex items-center px-2 py-1 rounded cursor-pointer ${tw.accent10} hover:opacity-80 transition-opacity`}
          >
            <span className={`${tw.caption} font-medium ${tw.textPrimary}`}>
              +{moreCount} more
            </span>
          </div>
        )}
      </div>
    );
  };

  // Extract unique channels for filter options
  const uniqueChannels = Array.isArray(policies) && policies.length > 0
    ? Array.from(new Set(
        policies.flatMap((policy) => {
          if (policy && Array.isArray(policy.channels)) {
            return policy.channels.filter((ch) => ch && typeof ch === "string");
          }
          return [];
        })
      )).sort()
    : [];

  // Table columns definition
  const defaultColumns: TableColumn<CommunicationPolicyConfiguration>[] = [
    {
      id: "name",
      label: t.communicationPolicy.policy,
      visible: true,
      filterConfig: { type: "text" },
      render: (value) => (
        <div className="truncate" title={value as string}>
          {value}
        </div>
      ),
    },
    {
      id: "description",
      label: "Description",
      visible: true,
      filterConfig: { type: "text" },
      render: (value) => (
        <span
          className="truncate"
          title={value ? String(value) : t.communicationPolicy.noDescription}
        >
          {value || t.communicationPolicy.noDescription}
        </span>
      ),
    },
    {
      id: "channels",
      label: t.communicationPolicy.channels,
      visible: true,
      sortable: true,
      filterConfig: { type: "select", options: uniqueChannels },
      render: (value, policy) => {
        if (!policy || !policy.id) return null;
        return getChannelsDisplay((value as string[]) || [], policy.id);
      },
    },
    {
      id: "type_code",
      label: t.communicationPolicy.type,
      visible: true,
      filterConfig: { type: "select", options: ["EMAIL", "SMS", "PUSH", "INAPP"] },
      render: (value, policy) => (policy as any).type_name || value,
    },
    {
      id: "is_active",
      label: t.communicationPolicy.status,
      visible: true,
      filterConfig: { type: "select", options: ["true", "false"] },
      render: (value) => (
        <span
          className={
            value
              ? helpers.badge("success")
              : helpers.badge("info")
          }
        >
          {value
            ? t.communicationPolicy.active
            : t.communicationPolicy.inactive}
        </span>
      ),
    },
    {
      id: "actions",
      label: t.communicationPolicy.actions,
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (value, policy) => (
        <div className="flex items-center justify-end gap-2">
          <ActivateDeactivateButton
            isActive={policy.is_active}
            onToggle={() => handleToggleActive(policy)}
            isLoading={togglingId === policy.id}
            disabled={togglingId === policy.id}
            title={policy.is_active ? `Deactivate ${policy.name}` : `Activate ${policy.name}`}
          />
          <button
            onClick={() => navigate(`/dashboard/campaign-communication-policy/${policy.id}`)}
            className={`p-0 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
            title="View details"
          >
            <Eye className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => handleEditPolicy(policy)}
            className={`p-0 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
            title={t.communicationPolicy.edit}
          >
            <Edit className="w-4 h-4" style={{ color: color.primary.action }} />
          </button>
          <div className="relative" ref={(el) => {
            actionMenuRefs.current[policy.id] = el;
          }}>
            <button
              onClick={(e) => handleActionMenuToggle(policy.id, e)}
              className={`p-0 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      ),
    },
  ];

  const {
    columns,
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useTable({
    tableId: "communication-policies-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const handleFilteredCountChange = (count: number) => {
    // Updates when filters applied in the Table component
  };

  const filteredPolicies = Array.isArray(policies) && policies.length > 0
    ? policies.filter((policy) => {
        if (!policy || typeof policy !== "object") return false;
        if (!policy.name || typeof policy.name !== "string") return false;

        const nameMatch = policy.name.toLowerCase().includes(searchTerm.toLowerCase());
        const descriptionMatch = policy.description && typeof policy.description === "string"
          ? policy.description.toLowerCase().includes(searchTerm.toLowerCase())
          : false;

        return nameMatch || descriptionMatch;
      })
    : [];

  // Handle pagination slicing
  const paginatedPolicies = Array.isArray(filteredPolicies) && filteredPolicies.length > 0
    ? filteredPolicies.slice(
        (tableCurrentPage - 1) * tablePageSize,
        tableCurrentPage * tablePageSize
      )
    : [];

  // Reset to page 1 when search changes
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, tableHandlePageChange]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb with Create Button and Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <BackButton showBreadcrumb={true} currentLabel={t.communicationPolicy.title} />
          <button
            onClick={handleCreatePolicy}
            className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white w-auto`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4" />
            {t.communicationPolicy.createPolicy}
          </button>
        </div>
        <p className={`text-sm ${tw.textSecondary}`}>
          Configure communication policies to control how and when messages are sent to customers. Define time windows, frequency limits, DND rules, and VIP list handling.
        </p>
      </div>

      <div className={tw.surfaceBackground}>
        <SearchInput
          placeholder={t.communicationPolicy.searchPlaceholder}
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
        />
      </div>

      <div
        className={`${tw.rounded} overflow-hidden`}
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
              {t.communicationPolicy.loadingPolicies}
            </p>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? t.communicationPolicy.noPoliciesFound : "No policies yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm
                ? "Try adjusting your search term"
                : t.communicationPolicy.createFirstPolicy}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreatePolicy}
                className={`${tw.button} flex items-center gap-2 mx-auto`}
              >
                <Plus className="w-4 h-4" />
                {t.communicationPolicy.createPolicy}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <Table<CommunicationPolicyConfiguration>
              columns={columns}
              data={paginatedPolicies}
              totalItems={filteredPolicies.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={loading}
              onPageChange={tableHandlePageChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              expandedRowId={expandedRowId}
              onExpandChange={setExpandedRowId}
              onFilteredCountChange={handleFilteredCountChange}
              clearFiltersKey={clearFiltersKey}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              expandedContent={(policy) => (
                <CommunicationPolicyDetailsExpandedRow policy={policy} colSpan={columns.filter((c) => c.visible).length} />
              )}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {/* Pagination */}
            {!loading && paginatedPolicies.length > 0 && filteredPolicies.length > 0 && (
              <Pagination
                currentPage={tableCurrentPage}
                pageSize={tablePageSize}
                totalItems={filteredPolicies.length}
                onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              />
            )}

            {/* Channels Hover Modal via Portal */}
            {channelsHoverModal && channelsHoverModal.channels && Array.isArray(channelsHoverModal.channels) && createPortal(
              <div
                className={`fixed bg-white border border-gray-200 ${tw.rounded} shadow-xl p-4 z-50`}
                style={{
                  top: `${channelsHoverModal.position?.top ?? 0}px`,
                  left: `${channelsHoverModal.position?.left ?? 0}px`,
                  minWidth: "200px",
                }}
                onMouseEnter={() => {
                  // Keep modal open on hover
                }}
                onMouseLeave={() => setChannelsHoverModal(null)}
              >
                <div className="space-y-2">
                  {channelsHoverModal.channels && channelsHoverModal.channels.map((channel) => {
                    if (!channel) return null;
                    return (
                      <div
                        key={channel}
                        className={`flex items-center px-3 py-2 rounded ${tw.accent10}`}
                      >
                        <span className={`${tw.caption} font-medium ${tw.textPrimary}`}>
                          {channel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>,
              document.body,
            )}

            {/* Action Menus via Portal */}
            {Array.isArray(paginatedPolicies) && paginatedPolicies.map((policy) => {
              if (!policy || !policy.id) return null;
              if (showActionMenu !== policy.id || !dropdownPosition) return null;

              return createPortal(
                <div
                  ref={(el) => {
                    if (el && policy.id) {
                      dropdownMenuRefs.current[policy.id] = el;
                    }
                  }}
                  className={`fixed bg-white border border-gray-200 ${tw.rounded} shadow-xl py-3 w-64`}
                  style={{
                    zIndex: zIndex.popover,
                    top: `${dropdownPosition?.top ?? 0}px`,
                    left: `${dropdownPosition?.left ?? 0}px`,
                    maxHeight: `${dropdownPosition?.maxHeight ?? "auto"}px`,
                    overflowY: "auto",
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePolicy(policy);
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-4" />
                    Delete
                  </button>
                </div>,
                document.body,
              );
            })}
          </>
        )}
      </div>

      <CommunicationPolicyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPolicy(undefined);
        }}
        policy={editingPolicy}
        onSave={handlePolicySaved}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDeleteItem}
        title={t.communicationPolicy.deleteConfirmTitle}
        description={t.communicationPolicy.deleteConfirmMessage}
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
        confirmText={t.communicationPolicy.deletePolicy}
        cancelText={t.common.cancel}
      />

      {/* Column Picker Modal */}
      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns.map((col) => ({ id: col.id, label: col.label, visible: col.visible }))}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={(reorderedCols) => {
          const updatedColumns = reorderedCols.map((reordered) => {
            const original = columns.find((c) => c.id === reordered.id);
            return original ? { ...original, visible: reordered.visible } : reordered as any;
          });
          reorderColumns(updatedColumns);
        }}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  );
}
