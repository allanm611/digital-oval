import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Users, Percent, Calendar, Edit, Trash2, Loader2, Plus } from "lucide-react";
import { color, tw, button } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { controlGroupService } from "../services/controlGroupService";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import type { ControlGroupApiModel, ControlGroupMember } from "../types/controlGroup";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import Pagination from "../../../shared/components/ui/Pagination";
import AddMembersModal from "../components/AddMembersModal";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function ControlGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();
  const [group, setGroup] = useState<ControlGroupApiModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Get returnTo from location state
  const returnTo = (
    location.state as {
      returnTo?: {
        pathname: string;
      };
    }
  )?.returnTo;

  const handleBack = () => {
    if (returnTo?.pathname) {
      navigate(returnTo.pathname, { replace: true });
      return;
    }
    navigateBackOrFallback(navigate, "/dashboard/control-groups");
  };

  // Members management
  const [members, setMembers] = useState<ControlGroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersPage, setMembersPage] = useState(1);
  const [membersTotalCount, setMembersTotalCount] = useState(0);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: number; subscriberId: number; name: string } | null>(null);
  const [existingMemberIds, setExistingMemberIds] = useState<number[]>([]);

  useEffect(() => {
    const loadGroup = async () => {
      if (!id) return;
      try {
        const data = await controlGroupService.getControlGroupById(Number(id));
        setGroup(data);
      } catch (error) {
        showError(t.controlGroups.failedToSaveGroup, extractBackendError(err, t.controlGroups.failedToSaveGroup));
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroup();
  }, [id, showError, t]);

  useEffect(() => {
    if (!group?.id) return;

    const loadMembers = async () => {
      setMembersLoading(true);
      try {
        const response = await controlGroupService.getControlGroupMembers(group.id, {
          limit: 10,
          offset: (membersPage - 1) * 10,
        });
        setMembers(response.members);
        setMembersTotalCount(response.total_count);

        // Load ALL existing members for the modal (not paginated)
        const allMembersResponse = await controlGroupService.getControlGroupMembers(group.id, {
          limit: 9999,
          offset: 0,
        });
        setExistingMemberIds(allMembersResponse.members.map((m) => m.subscriber_id));
      } catch (error) {
        showError(t.controlGroups.failedToRemoveMember, extractBackendError(err, t.controlGroups.failedToRemoveMember));
        console.error(error);
      } finally {
        setMembersLoading(false);
      }
    };

    loadMembers();
  }, [group?.id, membersPage, showError, t]);

  const getCustomerBaseLabel = (base: string) => {
    switch (base) {
      case "active_subscribers":
        return t.controlGroups.activeSubscribers;
      case "all_customers":
        return t.controlGroups.allCustomers;
      case "saved_segment":
        return t.controlGroups.customConditions;
      default:
        return base;
    }
  };

  const getRecurrenceLabel = (recurrence: string | null) => {
    switch (recurrence) {
      case "one_time":
        return t.controlGroups.oneTime;
      case "daily":
        return t.controlGroups.daily;
      case "weekly":
        return t.controlGroups.weekly;
      case "monthly":
        return t.controlGroups.monthly;
      default:
        return recurrence || "-";
    }
  };

  const getGenerationMethodLabel = (method: string | null) => {
    switch (method) {
      case "random":
        return t.controlGroups.randomSelection;
      case "stratified":
        return t.controlGroups.stratifiedSampling;
      default:
        return method || "-";
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await controlGroupService.deleteControlGroup(Number(id));
      showSuccess(t.controlGroups.groupDeletedSuccessfully);
      navigate("/dashboard/control-groups");
    } catch (error) {
      showError(extractBackendError(err, t.controlGroups.failedToDeleteGroup));
      console.error(error);
    } finally {
      setIsDeleting(false);
      closeDeleteConfirm();
    }
  };

  const handleAddMembers = async (customers: any[]) => {
    if (!group?.id || customers.length === 0) return;

    setAddingMembers(true);
    try {
      // Extract subscriber IDs from customer objects
      const subscriberIds = customers.map((customer) => {
        const id = customer.customerId || customer.id;
        return typeof id === "string" ? parseInt(id, 10) : id;
      });

      // Bulk add members
      await controlGroupService.bulkAddMembers({
        control_group_id: group.id,
        subscriber_ids: subscriberIds,
      });

      showSuccess(t.controlGroups.membersAddedSuccessfully);
      setMembersPage(1);

      // Refresh both members list and group stats
      const updatedGroup = await controlGroupService.getControlGroupById(group.id);
      setGroup(updatedGroup);

      // Reload members (this will also be called when useEffect triggers)
      const response = await controlGroupService.getControlGroupMembers(group.id, {
        limit: 10,
        offset: 0,
      });
      setMembers(response.members);
      setMembersTotalCount(response.total_count);

      // Load ALL existing members for modal
      const allMembersResponse = await controlGroupService.getControlGroupMembers(group.id, {
        limit: 9999,
        offset: 0,
      });
      setExistingMemberIds(allMembersResponse.members.map((m) => m.subscriber_id));
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to add members");
      console.error(error);
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveClick = (memberId: number, subscriberId: number, memberName: string) => {
    setMemberToRemove({ id: memberId, subscriberId, name: memberName });
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!group?.id || !memberToRemove) return;

    setRemovingMemberId(memberToRemove.id);
    try {
      await controlGroupService.removeMember({
        control_group_id: group.id,
        subscriber_id: memberToRemove.subscriberId,
      });

      showSuccess(t.controlGroups.memberRemovedSuccessfully);
      setMembers(members.filter((m) => m.id !== memberToRemove.id));
      setMembersTotalCount(Math.max(0, membersTotalCount - 1));
      setShowRemoveModal(false);
      setMemberToRemove(null);
    } catch (error) {
      showError(extractBackendError(err, t.controlGroups.failedToRemoveMember));
      console.error(error);
    } finally {
      setRemovingMemberId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner variant="modern" size="lg" color="primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t.controlGroups.controlGroupNotFound || t.common.noData}
          </h3>
          <button
            onClick={() => navigate("/dashboard/control-groups")}
            className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors hover:opacity-90 text-white`}
            style={{ backgroundColor: color.primary.action }}
          >
            {t.controlGroups.title}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton
          onBack={handleBack}
          showBreadcrumb={true}
          currentLabel={t.controlGroups.controlGroupDetails}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              navigate(`/dashboard/control-groups/${group.id}/edit`, {
                state: { returnTo: { pathname: location.pathname } }
              })
            }
            className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="w-4 h-4" />
            {t.common.edit}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              backgroundColor: button.delete.background,
              color: button.delete.color,
              borderRadius: button.delete.borderRadius,
            }}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2
                className="w-4 h-4"
                style={{ color: "#FFFFFF" }}
              />
            )}
            {t.common.delete}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Members Card */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Users
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">{t.controlGroups.totalMembers}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {(group.member_count || 0).toLocaleString()}
          </p>
        </div>

        {/* Percentage Card */}
        {group.percentage && (
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Percent
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">{t.controlGroups.percentage}</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {group.percentage}%
            </p>
          </div>
        )}

        {/* Status Card */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Calendar
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">{t.common.status}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {group.is_active ? t.common.active : t.common.inactive}
          </p>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            {t.controlGroups.basicInformation}
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t.common.name}
              </p>
              <p className="text-sm text-gray-900 font-medium">{group.name}</p>
            </div>
            {group.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  {t.common.description}
                </p>
                <p className="text-sm text-gray-900">{group.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t.common.type}
              </p>
              <p className="text-sm text-gray-900 font-medium">{t.controlGroups.universal}</p>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            {t.controlGroups.configuration}
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t.controlGroups.customerBase}
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {getCustomerBaseLabel(group.customer_source_type || "manual")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t.controlGroups.generationMethod}
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {getGenerationMethodLabel(group.generation_method)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t.controlGroups.recurrencePattern}
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {getRecurrenceLabel(group.recurrence_pattern)}
              </p>
            </div>
          </div>
        </div>

        {/* Schedule */}
        {group.start_date && (
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {t.controlGroups.schedule}
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  {t.controlGroups.startDate}
                </p>
                <p className="text-sm text-gray-900 font-medium">
                  {new Date(group.start_date).toLocaleString()}
                </p>
              </div>
              {group.end_date && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {t.controlGroups.endDate}
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {new Date(group.end_date).toLocaleString()}
                  </p>
                </div>
              )}
              {!group.end_date && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {t.controlGroups.endDate}
                  </p>
                  <p className="text-sm text-gray-900">-</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            {t.controlGroups.timeline}
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t.controlGroups.created}
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {new Date(group.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t.controlGroups.lastUpdated}
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {new Date(group.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div
        className={`${tw.rounded} px-6 py-6`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {t.controlGroups.groupMembers}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t.controlGroups.totalLabel}: {membersTotalCount} {t.controlGroups.members}
            </p>
          </div>
          <button
            onClick={() => setShowAddMemberModal(true)}
            disabled={addingMembers}
            className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ backgroundColor: color.primary.action }}
          >
            {addingMembers ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {t.controlGroups.addMembers}
          </button>
        </div>

        {membersLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner variant="modern" size="md" color="primary" />
          </div>
        ) : members.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table
                className="w-full min-w-[600px]"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
                <thead style={{ background: color.surface.tableHeader }}>
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.controlGroups.subscriberId}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.controlGroups.addedDate}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.controlGroups.reason}
                    </th>
                    <th
                      className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      {t.common.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="transition-colors">
                      <td
                        className="px-6 py-4 text-sm font-medium text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {member.subscriber_id}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {new Date(member.added_at).toLocaleDateString()}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-black"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {member.reason || "-"}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-right"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <button
                          onClick={() => handleRemoveClick(member.id, member.subscriber_id, String(member.subscriber_id))}
                          disabled={removingMemberId === member.id}
                          className={`p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80`}
                          title="Remove member"
                        >
                          {removingMemberId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {membersTotalCount > 10 && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <Pagination
                  currentPage={membersPage}
                  pageSize={10}
                  totalItems={membersTotalCount}
                  onPageChange={setMembersPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t.controlGroups.noMembersYet}</p>
          </div>
        )}
      </div>

      {/* Add Members Modal */}
      <AddMembersModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        groupName={group?.name || t.controlGroups.title}
        onAdd={handleAddMembers}
        existingMemberIds={existingMemberIds}
        isAdding={addingMembers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t.controlGroups.deleteControlGroup}
        description={t.controlGroups.deleteControlGroupDescription}
        itemName={group?.name || t.controlGroups.title}
        isLoading={isDeleting}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
      />

      {/* Remove Member Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setMemberToRemove(null);
        }}
        onConfirm={handleConfirmRemove}
        title={t.controlGroups.removeMember}
        description={t.controlGroups.removeMemberDescription}
        itemName={memberToRemove?.name || ""}
        isLoading={removingMemberId === memberToRemove?.id}
        confirmText={t.controlGroups.remove}
        cancelText={t.common.cancel}
        variant="warning"
      />
    </div>
  );
}
