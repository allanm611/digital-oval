import React, { useState, useEffect } from "react";
import { X, Loader2, Database } from "lucide-react";
import { ConnectionProfileType } from "../../connection-profiles/types/connectionProfile";
import { connectionProfileService } from "../../connection-profiles/services/connectionProfileService";
import { DataConnectorType } from "../types/dataConnector";
import { color, tw, button, getButtonStyles, zIndex } from "../../../shared/utils/utils";
import SearchInput from "../../../shared/components/ui/SearchInput";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;
import DateFormatter from "../../../shared/components/DateFormatter";

interface SelectConnectionProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (profile: ConnectionProfileType) => void;
  dataConnectorType: DataConnectorType;
  attachedProfileIds?: number[];
}

export default function SelectConnectionProfileModal({
  isOpen,
  onClose,
  onSelect,
  dataConnectorType,
  attachedProfileIds = [],
}: SelectConnectionProfileModalProps) {
  const { error: showError } = useToast();
  const [profiles, setProfiles] = useState<ConnectionProfileType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<ConnectionProfileType[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen, dataConnectorType]);

  useEffect(() => {
    if (isOpen && profiles.length > 0) {
      const attachedProfiles = profiles.filter(p => attachedProfileIds?.includes(p.id));
      setSelectedProfiles(attachedProfiles);
    }
  }, [isOpen, profiles, attachedProfileIds]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      // Fetch profiles by exact type match
      const data = await connectionProfileService.getProfilesByConnectionType(
        dataConnectorType,
        { limit: 100, skipCache: true }
      );
      setProfiles(data || []);
    } catch (err) {
      showError("Failed to load connection profiles", extractBackendError(err, "Failed to load connection profiles. Please try again."));
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.profile_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.profile_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      style={{ zIndex: zIndex.modal }}
      onClick={onClose}
    >
      <div
        className={`${tw.rounded} w-full max-w-4xl max-h-[90vh] flex flex-col`}
        style={{ backgroundColor: "var(--c-surface-background)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b flex-shrink-0"
          style={{ borderColor: color.border.default }}
        >
          <div>
            <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
              Select Connection Profile
            </h2>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              Choose a connection profile with type <strong>{dataConnectorType}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 transition-colors disabled:opacity-50"
            style={{ color: color.text.secondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = color.interactive.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <SearchInput
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2
                className="w-12 h-12 mx-auto mb-4 animate-spin"
                strokeWidth={1.5}
                style={{ color: color.text.primary }}
              />
              <p className={tw.textSecondary}>Loading profiles...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-12">
              <Database
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: color.text.muted }}
              />
              <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
                No profiles found
              </h3>
              <p className={tw.textSecondary}>
                {profiles.length === 0
                  ? `No connection profiles available with type "${dataConnectorType}"`
                  : "Try adjusting your search terms"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead
                  className="sticky top-0 z-10"
                  style={{ backgroundColor: color.surface.tableHeader }}
                >
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20"
                      style={{ color: color.text.secondary }}
                    >
                      Select
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: color.text.secondary }}
                    >
                      Name
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: color.text.secondary }}
                    >
                      Code
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32"
                      style={{ color: color.text.secondary }}
                    >
                      Environment
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32"
                      style={{ color: color.text.secondary }}
                    >
                      Load Strategy
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32"
                      style={{ color: color.text.secondary }}
                    >
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ borderColor: color.border.muted }}
                >
                  {filteredProfiles.map((profile) => {
                    const isSelected = selectedProfiles.some(p => p && p.id === profile.id);

                    return (
                      <tr
                        key={profile.id}
                        onClick={() => {
                          if (!profile) return;

                          const isCurrentlySelected = selectedProfiles.some(p => p && p.id === profile.id);
                          if (isCurrentlySelected) {
                            setSelectedProfiles(selectedProfiles.filter(p => p && p.id !== profile.id));
                          } else {
                            setSelectedProfiles([...selectedProfiles, profile]);
                          }
                        }}
                        className="cursor-pointer"
                        style={{
                          backgroundColor: isSelected
                            ? `${color.primary.accent}15`
                            : "var(--c-surface-background)",
                        }}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            {profile && (
                              <Checkbox
                                id={`profile-${profile.id}`}
                                checked={isSelected}
                                onChange={() => {
                                  if (!profile) return;

                                  const isCurrentlySelected = selectedProfiles.some(p => p && p.id === profile.id);
                                  if (isCurrentlySelected) {
                                    setSelectedProfiles(selectedProfiles.filter(p => p && p.id !== profile.id));
                                  } else {
                                    setSelectedProfiles([...selectedProfiles, profile]);
                                  }
                                }}
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`text-sm font-medium ${tw.textPrimary}`}>
                            {profile.profile_name}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`text-sm font-mono ${tw.textSecondary}`}>
                            {profile.profile_code}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`text-sm ${tw.textSecondary}`}>
                            {profile.environment || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`text-sm ${tw.textSecondary}`}>
                            {profile.load_strategy || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`text-sm ${tw.textSecondary}`}>
                            <DateFormatter
                              date={profile.created_at}
                              useLocale
                              year="numeric"
                              month="short"
                              day="numeric"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: color.border.default }}
        >
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
              style={getButtonStyles(button.bordered)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!selectedProfiles || selectedProfiles.length === 0) {
                  return;
                }

                const validProfiles = selectedProfiles.filter(p => p && p.id);
                if (validProfiles.length === 0) {
                  return;
                }

                setIsProcessing(true);

                try {
                  await Promise.all(
                    validProfiles.map(profile => {
                      if (profile) {
                        return Promise.resolve(onSelect(profile));
                      }
                      return Promise.resolve();
                    })
                  );

                  onClose();
                } catch (err) {
                  console.error("Error processing profiles:", err);
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={loading || isProcessing || !selectedProfiles || selectedProfiles.length === 0}
              className="text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 px-4 py-2 rounded font-medium flex items-center gap-2"
              style={{ backgroundColor: color.primary.action }}
            >
              {isProcessing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isProcessing ? "Processing..." : `Confirm (${selectedProfiles?.length || 0})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
