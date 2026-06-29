import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, ShieldCheck, MoreHorizontal } from "lucide-react";
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
  const actionMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const dropdownMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

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

  const getChannelsDisplay = (channelValues: string[]) => {
    if (!channelValues || channelValues.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-2">
        {channelValues.map((channelValue) => (
          <div
            key={channelValue}
            className={`flex items-center px-2 py-1 rounded ${tw.accent10}`}
          >
            <span className={`${tw.caption} font-medium ${tw.textPrimary}`}>
              {channelValue}
            </span>
          </div>
        ))}
      </div>
    );
  };


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
      sortable: false,
      render: (value) => getChannelsDisplay((value as string[]) || []),
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

  const filteredPolicies = Array.isArray(policies) ? policies.filter(
    (policy) => {
      if (!policy || !policy.name) return false;
      return (
        policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (policy.description &&
          policy.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  ) : [];

  // Handle pagination slicing
  const paginatedPolicies = filteredPolicies.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, tableHandlePageChange]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BackButton showBreadcrumb={true} currentLabel={t.communicationPolicy.title} />

      {/* Description and Create Button */}
      <div className="flex items-start justify-between gap-4">
        <p className={`text-sm ${tw.textSecondary}`}>
          Configure communication policies to control how and when messages are sent to customers. Define time windows, frequency limits, DND rules, and VIP list handling.
        </p>
        <button
          onClick={handleCreatePolicy}
          className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white w-auto`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="w-4 h-4" />
          {t.communicationPolicy.createPolicy}
        </button>
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

            {/* Action Menus via Portal */}
            {paginatedPolicies.map((policy) => {
              if (showActionMenu === policy.id && dropdownPosition) {
                return createPortal(
                  <div
                    ref={(el) => {
                      dropdownMenuRefs.current[policy.id] = el;
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
              }
              return null;
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
