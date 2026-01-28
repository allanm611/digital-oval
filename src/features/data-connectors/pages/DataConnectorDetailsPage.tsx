import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, Plug } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { DataConnector } from "../types";
import { fetchDataConnectorById } from "../services";
import { tw, color, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function DataConnectorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { t } = useLanguage();

  const [connector, setConnector] = useState<DataConnector | null>(null);
  const [connectionProfiles, setConnectionProfiles] = useState<
    Array<{
      id: number;
      name: string;
      type: string;
      is_active: boolean;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadConnector();
    }
  }, [id]);

  const loadConnector = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await fetchDataConnectorById(id);

      if (!data) {
        showError("Not Found", "Data connector not found");
        navigate("/dashboard/data-connectors");
        return;
      }

      setConnector(data);

      // Load mock connection profiles (placeholder)
      setConnectionProfiles([
        {
          id: 1,
          name: "CDR-Primary",
          type: "database",
          is_active: true,
        },
        {
          id: 2,
          name: "CDR-Backup",
          type: "database",
          is_active: true,
        },
        {
          id: 3,
          name: "CDR-Archive",
          type: "database",
          is_active: false,
        },
      ]);
    } catch (err) {
      console.error("Failed to load data connector:", err);
      showError(
        "Failed to load data connector",
        err instanceof Error ? err.message : "Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    showError("Not Implemented", "Edit functionality coming soon");
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    showError("Not Implemented", "Delete functionality coming soon");
  };

  const handleProfileClick = (profileId: number) => {
    navigate(`/dashboard/connection-profiles/${profileId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!connector) {
    return (
      <div className="text-center py-12">
        <p className={tw.textSecondary}>Data connector not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connector Info Card */}
      <div
        className={`${tw.rounded} border border-gray-200 shadow-sm p-6 bg-white`}
      >
        {/* Header with Back Button and Name */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BackButton fallbackTo="/dashboard/data-connectors" />
            <h1 className="text-2xl font-bold text-black">{connector.name}</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className={`inline-flex items-center gap-2 ${tw.rounded} transition-colors text-white`}
              style={{
                backgroundColor: color.primary.action,
                padding: `${button.action.paddingY} ${button.action.paddingX}`,
              }}
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className={`inline-flex items-center gap-2 ${tw.rounded} transition-colors text-white hover:opacity-90`}
              style={{
                backgroundColor: "#ef4444",
                padding: `${button.action.paddingY} ${button.action.paddingX}`,
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Description */}
        {connector.description && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Description</p>
            <p className="text-black">{connector.description}</p>
          </div>
        )}
      </div>

      {/* Connection Profiles Section */}
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
            onClick={() =>
              showError(
                "Not implemented",
                "Add connection functionality coming soon",
              )
            }
          >
            + Add Profile
          </button>
        </div>
        {connectionProfiles.length === 0 ? (
          <div
            className={`${tw.rounded} border border-gray-200 p-6 text-center `}
          >
            <Plug className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">No connection profiles yet</p>
          </div>
        ) : (
          <div className={`${tw.rounded}  overflow-hidden `}>
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
                  {connectionProfiles.map((profile) => (
                    <tr
                      key={profile.id}
                      onClick={() => handleProfileClick(profile.id)}
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
                        Database
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
    </div>
  );
}
