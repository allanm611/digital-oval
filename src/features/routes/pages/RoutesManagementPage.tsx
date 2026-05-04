import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Edit } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DateFormatter from "../../../shared/components/DateFormatter";
import { smsRouteService } from "../services/smsRouteService";
import { emailRouteService } from "../services/emailRouteService";
import { pushNotificationRouteService } from "../services/pushNotificationRouteService";
import { whatsappRouteService } from "../services/whatsappRouteService";
import { ussdRouteService } from "../services/ussdRouteService";
import { SMSRoute } from "../types/smsRoute";
import { EmailRoute } from "../types/emailRoute";
import { PushNotificationRoute } from "../types/pushNotificationRoute";
import { WhatsAppRoute } from "../types/whatsappRoute";

type CommunicationChannel = "SMS" | "EMAIL" | "WHATSAPP" | "PUSH" | "USSD";

interface UnifiedRoute {
  id: number;
  name: string;
  description?: string;
  channel: CommunicationChannel;
  gateway_provider?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  originalRoute: SMSRoute | EmailRoute | PushNotificationRoute | WhatsAppRoute;
}

export default function RoutesManagementPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { t } = useLanguage();
  const [routes, setRoutes] = useState<UnifiedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<{
    id: number;
    channel: CommunicationChannel;
  } | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    loadAllRoutes();
  }, [filterChannel]);

  const loadAllRoutes = async () => {
    try {
      setLoading(true);
      const [smsRoutes, emailRoutes, pushRoutes, whatsappRoutes, ussdRoutes] =
        await Promise.all([
          smsRouteService.getAllRoutes(),
          emailRouteService.getAllRoutes(),
          pushNotificationRouteService.getAllRoutes(),
          whatsappRouteService.getAllRoutes(),
          ussdRouteService.getAllRoutes(),
        ]);

      const unifiedRoutes: UnifiedRoute[] = [];

      if (
        filterChannel === "all" ||
        filterChannel === "SMS"
      ) {
        smsRoutes.forEach((route) => {
          unifiedRoutes.push({
            id: route.id,
            name: route.name,
            description: route.description,
            channel: "SMS",
            gateway_provider: route.gateway_provider,
            is_active: route.is_active,
            created_at: route.created_at,
            updated_at: route.updated_at,
            originalRoute: route,
          });
        });
      }

      if (
        filterChannel === "all" ||
        filterChannel === "EMAIL"
      ) {
        emailRoutes.forEach((route) => {
          unifiedRoutes.push({
            id: route.id,
            name: route.name,
            description: route.description,
            channel: "EMAIL",
            gateway_provider: route.gateway_provider,
            is_active: route.is_active,
            created_at: route.created_at,
            updated_at: route.updated_at,
            originalRoute: route,
          });
        });
      }

      if (
        filterChannel === "all" ||
        filterChannel === "PUSH"
      ) {
        pushRoutes.forEach((route) => {
          unifiedRoutes.push({
            id: route.id,
            name: route.name,
            description: route.description,
            channel: "PUSH",
            gateway_provider: route.gateway_provider,
            is_active: route.is_active,
            created_at: route.created_at,
            updated_at: route.updated_at,
            originalRoute: route,
          });
        });
      }

      if (
        filterChannel === "all" ||
        filterChannel === "WHATSAPP"
      ) {
        whatsappRoutes.forEach((route) => {
          unifiedRoutes.push({
            id: route.id,
            name: route.name,
            description: route.description,
            channel: "WHATSAPP",
            gateway_provider: route.gateway_provider,
            is_active: route.is_active,
            created_at: route.created_at,
            updated_at: route.updated_at,
            originalRoute: route,
          });
        });
      }

      if (
        filterChannel === "all" ||
        filterChannel === "USSD"
      ) {
        ussdRoutes.forEach((route) => {
          unifiedRoutes.push({
            id: route.id,
            name: route.name,
            description: route.description,
            channel: "USSD",
            gateway_provider: route.gateway_provider,
            is_active: route.is_active,
            created_at: route.created_at,
            updated_at: route.updated_at,
            originalRoute: route,
          });
        });
      }

      setRoutes(unifiedRoutes);
    } catch (err) {
      showError("Error", "Failed to load routes");
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch = route.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteRoute = (route: UnifiedRoute) => {
    setDeleteConfirmId({ id: route.id, channel: route.channel });
    setDeleteConfirmName(route.name);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    const oldRoutes = routes;
    try {
      setIsRemoving(true);
      setRoutes(
        routes.filter(
          (r) => !(r.id === deleteConfirmId.id && r.channel === deleteConfirmId.channel)
        )
      );

      if (deleteConfirmId.channel === "SMS") {
        await smsRouteService.deleteRoute(deleteConfirmId.id);
      } else if (deleteConfirmId.channel === "EMAIL") {
        await emailRouteService.deleteRoute(deleteConfirmId.id);
      } else if (deleteConfirmId.channel === "PUSH") {
        await pushNotificationRouteService.deleteRoute(deleteConfirmId.id);
      } else if (deleteConfirmId.channel === "WHATSAPP") {
        await whatsappRouteService.deleteRoute(deleteConfirmId.id);
      } else if (deleteConfirmId.channel === "USSD") {
        await ussdRouteService.deleteRoute(deleteConfirmId.id);
      }

      showSuccess("Success", `${deleteConfirmName} route deleted`);
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
    } catch (err) {
      setRoutes(oldRoutes);
      showError("Error", "Failed to delete route");
    } finally {
      setIsRemoving(false);
    }
  };

  const navigateToEdit = (route: UnifiedRoute) => {
    if (route.channel === "SMS") {
      navigate(`/dashboard/sms-routes/edit/${route.id}`);
    } else if (route.channel === "EMAIL") {
      navigate(`/dashboard/email-routes/edit/${route.id}`);
    } else if (route.channel === "PUSH") {
      navigate(`/dashboard/push-notification-routes/edit/${route.id}`);
    } else if (route.channel === "WHATSAPP") {
      navigate(`/dashboard/whatsapp-routes/edit/${route.id}`);
    } else if (route.channel === "USSD") {
      navigate(`/dashboard/ussd-routes/edit/${route.id}`);
    }
  };

  const channelOptions = [
    { value: "all", label: "All Channels" },
    { value: "SMS", label: "SMS" },
    { value: "EMAIL", label: "Email" },
    { value: "WHATSAPP", label: "WhatsApp" },
    { value: "PUSH", label: "Push Notification" },
    { value: "USSD", label: "USSD" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BackButton
        fallbackTo="/dashboard/configuration"
        showBreadcrumb={true}
        currentLabel="Routes Management"
      />

      {/* Description */}
      <p className={`text-sm ${tw.textSecondary}`}>
        Manage all communication routes across channels
      </p>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by route name..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <div className="w-full md:w-48">
          <HeadlessSelect
            value={filterChannel}
            onChange={setFilterChannel}
            options={channelOptions}
            placeholder="Filter by channel"
          />
        </div>
      </div>

      {/* Table */}
      <div className={`${tw.rounded} border border-gray-200 overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="text-center py-12">
            <p className={`${tw.textSecondary} text-sm`}>
              {searchTerm || filterChannel !== "all"
                ? "No routes found matching your filters"
                : "No routes created yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[1200px]"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopLeftRadius: "0.375rem",
                    }}
                  >
                    Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Description
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Channel
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Gateway Provider
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Updated
                  </th>
                  {/* <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Actions
                  </th> */}
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((route) => (
                  <tr key={`${route.channel}-${route.id}`} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className="text-sm text-black">
                        {route.name}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">
                        {route.description || "—"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">
                        {route.channel}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">
                        {route.gateway_provider || "—"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">
                        {route.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <span className="text-sm text-black">
                        <DateFormatter date={route.updated_at} />
                      </span>
                    </td>
                    {/* <td
                      className="px-6 py-4 text-center"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigateToEdit(route)}
                          className={`p-2 ${tw.textSecondary} hover:bg-gray-100 ${tw.rounded} transition-colors`}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(route)}
                          className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Route"
        description="Are you sure you want to delete this route? This action cannot be undone."
        itemName={deleteConfirmName}
        isLoading={isRemoving}
        confirmText="Delete"
      />
    </div>
  );
}
