import { Plug, Edit, Trash2 } from "lucide-react";
import { tw, color, button } from "../../../shared/utils/utils";
import { DataConnectorType } from "../types";

interface ConnectionProfile {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
}

interface ConnectionProfilesSectionProps {
  connectorId: string;
  connectorType: DataConnectorType;
  profiles: ConnectionProfile[];
  onAddProfile: () => void;
  onProfileClick: (profileId: number) => void;
  onEditProfile?: (profileId: number) => void;
  onDeleteProfile?: (profileId: number) => void;
}

export default function ConnectionProfilesSection({
  connectorId,
  connectorType,
  profiles,
  onAddProfile,
  onProfileClick,
  onEditProfile,
  onDeleteProfile,
}: ConnectionProfilesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">
          Connection Profiles
        </h2>
        <button
          className={`inline-flex items-center gap-2 ${tw.rounded} transition-colors text-white`}
          style={{
            backgroundColor: color.primary.action,
            padding: `${button.action.paddingY} ${button.action.paddingX}`,
            fontSize: button.action.fontSize,
          }}
          onClick={onAddProfile}
        >
          + Add Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div
          className={`${tw.rounded} border border-gray-200 p-6 text-center`}
        >
          <Plug className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">No connection profiles yet</p>
        </div>
      ) : (
        <div className={`${tw.rounded} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ backgroundColor: color.surface.tableHeader }}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-black">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-black">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-black">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-black">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className="transition-colors hover:opacity-80"
                    style={{ backgroundColor: "transparent" }}
                  >
                    <td
                      className="px-6 py-4 font-medium text-sm text-black cursor-pointer"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                      onClick={() => onProfileClick(profile.id)}
                    >
                      {profile.name}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black cursor-pointer"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                      onClick={() => onProfileClick(profile.id)}
                    >
                      {profile.type}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black cursor-pointer"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                      onClick={() => onProfileClick(profile.id)}
                    >
                      {profile.is_active ? "Active" : "Inactive"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <div className="flex gap-2">
                        {onEditProfile && (
                          <button
                            onClick={() => onEditProfile(profile.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit profile"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {onDeleteProfile && (
                          <button
                            onClick={() => onDeleteProfile(profile.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete profile"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
