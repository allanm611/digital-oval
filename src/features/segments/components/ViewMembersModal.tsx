import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { segmentService } from "../services/segmentService";
import Pagination from "../../../shared/components/ui/Pagination";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import { tw } from "../../../shared/utils/utils";

interface Member {
  id?: string | number;
  subscriber_msisdn?: string;
  subscriber_email?: string;
  membership_score?: number;
  created_at?: string;
}

interface ViewMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  segmentId: string;
  segmentName: string;
  segmentType?: string;
  onAddMembers?: (memberIds: string[]) => void;
  onRemoveMembers?: (memberIds: string[]) => void;
}

export default function ViewMembersModal({
  isOpen,
  onClose,
  segmentId,
  segmentName,
  segmentType,
  onAddMembers,
  onRemoveMembers,
}: ViewMembersModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembersList, setIsLoadingMembersList] = useState(false);
  const [membersSearchTerm, setMembersSearchTerm] = useState("");
  const [membersPage, setMembersPage] = useState(1);
  const [membersTotalPages, setMembersTotalPages] = useState(1);
  const [membersCount, setMembersCount] = useState(0);
  const [customerIdsInput, setCustomerIdsInput] = useState("");

  const loadMembers = async (searchTerm = "", page = 1) => {
    try {
      setIsLoadingMembersList(true);
      let response;

      if (searchTerm.trim()) {
        response = await segmentService.searchSegmentMembers(
          segmentId,
          searchTerm,
          { skipCache: true }
        );
      } else {
        response = await segmentService.getSegmentMembers(segmentId, {
          limit: 10,
          offset: (page - 1) * 10,
          skipCache: true,
        });
      }

      const membersList = response.data || [];
      setMembers(membersList);
      setMembersCount(response.pagination?.total || membersList.length);
      setMembersTotalPages(
        Math.ceil((response.pagination?.total || 0) / (response.pagination?.limit || 10))
      );
    } catch (error) {
      console.error("Failed to load segment members:", error);
      setMembers([]);
    } finally {
      setIsLoadingMembersList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, segmentId]);

  const handleAddMembers = async () => {
    if (!customerIdsInput.trim() || !onAddMembers) return;

    const ids = customerIdsInput
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);

    onAddMembers(ids);
    setCustomerIdsInput("");
    loadMembers();
  };

  const handleRemoveMembers = async (memberIds: string[]) => {
    if (!onRemoveMembers) return;

    onRemoveMembers(memberIds);
    loadMembers();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-bold text-black">
              Segment Members
            </h2>
            <p className="text-sm text-black mt-1">
              {(membersCount || 0).toLocaleString()} total member
              {membersCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Add Members Form */}
        {segmentType === "static" && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-black mb-2">
                  Add Customer IDs (comma-separated)
                </label>
                <Input
                  placeholder="e.g., 12345, 67890, 11111"
                  value={customerIdsInput}
                  onChange={setCustomerIdsInput}
                />
              </div>
              <button
                onClick={handleAddMembers}
                className={`text-sm font-medium text-white ${tw.rounded} px-4 py-2`}
                style={{
                  backgroundColor: "#3B82F6",
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Members Search */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <SearchInput
            placeholder="Search members by name, email, or ID..."
            value={membersSearchTerm}
            onChange={(value) => {
              setMembersSearchTerm(value);
              setMembersPage(1);
              loadMembers(value, 1);
            }}
          />
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingMembersList ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner
                variant="modern"
                size="lg"
                color="primary"
              />
              <p className="text-sm text-black mt-4">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-black">No members in this segment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Msisdn
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Joined Date
                    </th>
                    {segmentType === "static" && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member, index) => (
                    <tr key={index} className="cursor-pointer transition-colors hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-black">
                          {String(member.subscriber_msisdn || "-")}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-black">
                          {String(member.subscriber_email || "-")}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-black">
                          {member.membership_score ? String(member.membership_score) : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-black">
                          {member.created_at ? (
                            <DateFormatter date={member.created_at} />
                          ) : (
                            "-"
                          )}
                        </span>
                      </td>
                      {segmentType === "static" && (
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              const memberId = String(member.id);
                              if (memberId) {
                                handleRemoveMembers([memberId]);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Remove member"
                          >
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {members.length > 0 && membersCount > 10 && (
          <div className="p-6 border-t border-gray-200">
            <Pagination
              currentPage={membersPage}
              pageSize={10}
              totalItems={membersCount}
              onPageChange={(newPage) => {
                setMembersPage(newPage);
                loadMembers(membersSearchTerm, newPage);
              }}
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
