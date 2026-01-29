import { Plug } from "lucide-react";
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
}

export default function ConnectionProfilesSection({
  connectorId,
  connectorType,
  profiles,
  onAddProfile,
  onProfileClick,
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
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr
                    key={profile.id}
                    onClick={() => onProfileClick(profile.id)}
                    className="transition-colors cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: "transparent" }}
                  >
                    <td
                      className="px-6 py-4 font-medium text-sm text-black"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      {profile.name}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {profile.type}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      {profile.is_active ? "Active" : "Inactive"}
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
