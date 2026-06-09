import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Loader, ChevronDown } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { color, tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import BackButton from "../../../shared/components/ui/BackButton";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { smsRouteService } from "../../routes/services/smsRouteService";
import { senderIdService, SenderId } from "../../configurations/services/senderIdService";
import { pushNotificationRouteService } from "../../routes/services/pushNotificationRouteService";
import { emailRouteService } from "../../routes/services/emailRouteService";
import { whatsappRouteService } from "../../routes/services/whatsappRouteService";
import { ussdRouteService } from "../../routes/services/ussdRouteService";
import { communicationChannelService, CommunicationChannel as CommunicationChannelType } from "../../../shared/services/communicationChannelService";
import { SMSRoute } from "../../routes/types/smsRoute";
import { PushNotificationRoute } from "../../routes/types/pushNotificationRoute";
import { EmailRoute } from "../../routes/types/emailRoute";
import { WhatsAppRoute } from "../../routes/types/whatsappRoute";

type ChannelCode = "SMS" | "EMAIL" | "WHATSAPP" | "PUSH" | "USSD";

interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface ChannelOption {
  value: ChannelCode;
  label: string;
}

const getChannelCategory = (channelCode: string): "SMS" | "EMAIL" | "WHATSAPP" | "PUSH" | "USSD" | null => {
  if (!channelCode) return null;
  const code = String(channelCode).toUpperCase();
  if (code.includes("SMS") && !code.includes("WHATSAPP")) return "SMS";
  if (code.includes("EMAIL")) return "EMAIL";
  if (code.includes("WHATSAPP") || code.includes("WHATS")) return "WHATSAPP";
  if (code.includes("PUSH")) return "PUSH";
  if (code.includes("USSD")) return "USSD";
  return null;
};

export default function ManualRewardsTestPage() {
  const { success, error: showError } = useToast();
  const [channel, setChannel] = useState<ChannelCode>("SMS");
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const channelCategory = getChannelCategory(channel);
  const [recipient, setRecipient] = useState("254764555247");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<MessageResponse | null>(null);
  const [descriptionError, setDescriptionError] = useState("");
  const [selectedSenderId, setSelectedSenderId] = useState<number | null>(null);
  const [senderIds, setSenderIds] = useState<SenderId[]>([]);
  const [isLoadingSenderIds, setIsLoadingSenderIds] = useState(true);
  const [smsRoutes, setSmsRoutes] = useState<SMSRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [senderEmail, setSenderEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [pushTitle, setPushTitle] = useState("");
  const [pushRoutes, setPushRoutes] = useState<PushNotificationRoute[]>([]);
  const [selectedPushRoute, setSelectedPushRoute] = useState<number | null>(null);
  const [isLoadingPushRoutes, setIsLoadingPushRoutes] = useState(true);
  const [emailRoutes, setEmailRoutes] = useState<EmailRoute[]>([]);
  const [selectedEmailRoute, setSelectedEmailRoute] = useState<number | null>(null);
  const [isLoadingEmailRoutes, setIsLoadingEmailRoutes] = useState(true);
  const [whatsappRoutes, setWhatsappRoutes] = useState<WhatsAppRoute[]>([]);
  const [selectedWhatsappRoute, setSelectedWhatsappRoute] = useState<number | null>(null);
  const [isLoadingWhatsappRoutes, setIsLoadingWhatsappRoutes] = useState(true);
  const [ussdRoutes, setUssdRoutes] = useState<SMSRoute[]>([]);
  const [selectedUssdRoute, setSelectedUssdRoute] = useState<number | null>(null);
  const [isLoadingUssdRoutes, setIsLoadingUssdRoutes] = useState(true);
  const [ussdCode, setUssdCode] = useState("");

  useEffect(() => {
    const loadChannels = async () => {
      try {
        setIsLoadingChannels(true);
        const backendChannels = await communicationChannelService.getAll();
        const formattedChannels = (backendChannels || [])
          .filter((ch) => ch.is_active)
          .map((ch) => ({
            value: (ch.code?.toUpperCase() || ch.name) as ChannelCode,
            label: ch.name,
          }));
        setChannels(formattedChannels);
        // Set first channel as default if available
        if (formattedChannels.length > 0) {
          setChannel(formattedChannels[0].value);
        }
      } catch (err) {
        console.error("Failed to load communication channels:", err);
        showError("Error", extractBackendError(error, "Error. Please try again."));
      } finally {
        setIsLoadingChannels(false);
      }
    };

    loadChannels();
  }, []);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setIsLoadingRoutes(true);
        const routes = await smsRouteService.getAllRoutes();
        setSmsRoutes(routes);
        // Auto-select first active route
        const activeRoute = routes.find((r) => r.is_active);
        if (activeRoute) {
          setSelectedRoute(activeRoute.id);
        }
      } catch (err) {
        console.error("Failed to load SMS routes:", err);
        showError("Error", "Failed to load SMS routes");
      } finally {
        setIsLoadingRoutes(false);
      }
    };

    loadRoutes();
  }, []);

  useEffect(() => {
    const loadSenderIds = async () => {
      try {
        setIsLoadingSenderIds(true);
        const response = await senderIdService.getSenderIds();
        const ids = response.data || [];
        setSenderIds(ids);
        // Auto-select first active sender ID
        const activeSenderId = ids.find((s) => s.is_active);
        if (activeSenderId) {
          setSelectedSenderId(activeSenderId.id);
        }
      } catch (err) {
        console.error("Failed to load Sender IDs:", err);
        showError("Error", "Failed to load Sender IDs");
      } finally {
        setIsLoadingSenderIds(false);
      }
    };

    loadSenderIds();
  }, []);

  useEffect(() => {
    const loadPushRoutes = async () => {
      try {
        setIsLoadingPushRoutes(true);
        const routes = await pushNotificationRouteService.getAllRoutes();
        setPushRoutes(routes);
        const activeRoute = routes.find((r) => r.is_active);
        if (activeRoute) {
          setSelectedPushRoute(activeRoute.id);
        }
      } catch (err) {
        console.error("Failed to load Push notification routes:", err);
        showError("Error", "Failed to load Push notification routes");
      } finally {
        setIsLoadingPushRoutes(false);
      }
    };

    loadPushRoutes();
  }, []);

  useEffect(() => {
    const loadEmailRoutes = async () => {
      try {
        setIsLoadingEmailRoutes(true);
        const routes = await emailRouteService.getAllRoutes();
        setEmailRoutes(routes);
        const activeRoute = routes.find((r) => r.is_active);
        if (activeRoute) {
          setSelectedEmailRoute(activeRoute.id);
        }
      } catch (err) {
        console.error("Failed to load Email routes:", err);
        showError("Error", "Failed to load Email routes");
      } finally {
        setIsLoadingEmailRoutes(false);
      }
    };

    loadEmailRoutes();
  }, []);

  useEffect(() => {
    const loadWhatsappRoutes = async () => {
      try {
        setIsLoadingWhatsappRoutes(true);
        const routes = await whatsappRouteService.getAllRoutes();
        setWhatsappRoutes(routes);
        const activeRoute = routes.find((r) => r.is_active);
        if (activeRoute) {
          setSelectedWhatsappRoute(activeRoute.id);
        }
      } catch (err) {
        console.error("Failed to load WhatsApp routes:", err);
        showError("Error", "Failed to load WhatsApp routes");
      } finally {
        setIsLoadingWhatsappRoutes(false);
      }
    };

    loadWhatsappRoutes();
  }, []);

  useEffect(() => {
    const loadUssdRoutes = async () => {
      try {
        setIsLoadingUssdRoutes(true);
        const routes = await ussdRouteService.getAllRoutes();
        setUssdRoutes(routes);
        const activeRoute = routes.find((r) => r.is_active);
        if (activeRoute) {
          setSelectedUssdRoute(activeRoute.id);
        }
      } catch (err) {
        console.error("Failed to load USSD routes:", err);
        showError("Error", "Failed to load USSD routes");
      } finally {
        setIsLoadingUssdRoutes(false);
      }
    };

    loadUssdRoutes();
  }, []);

  const handleSendTest = async () => {
    // Validation
    if (!recipient.trim()) {
      showError("Validation Error", "Please enter a recipient identifier");
      return;
    }

    if (channelCategory === "EMAIL") {
      if (!selectedEmailRoute) {
        showError("Validation Error", "Please select an email route");
        return;
      }
      if (!description.trim()) {
        setDescriptionError("Please enter a description");
        return;
      }
    } else if (channelCategory === "WHATSAPP") {
      if (!selectedWhatsappRoute) {
        showError("Validation Error", "Please select a WhatsApp route");
        return;
      }
      if (!description.trim()) {
        setDescriptionError("Please enter a description");
        return;
      }
    } else if (channelCategory === "PUSH") {
      if (!selectedPushRoute) {
        showError("Validation Error", "Please select a push app");
        return;
      }
      if (!description.trim()) {
        setDescriptionError("Please enter a description");
        return;
      }
    } else if (channelCategory === "USSD") {
      if (!selectedUssdRoute) {
        showError("Validation Error", "Please select a USSD route");
        return;
      }
      if (!ussdCode.trim()) {
        showError("Validation Error", "Please enter a USSD code");
        return;
      }
    } else {
      if (!selectedRoute) {
        showError("Validation Error", "Please select an SMS route");
        return;
      }
      if (!description.trim()) {
        setDescriptionError("Please enter a description");
        return;
      }
    }

    setDescriptionError("");

    setIsLoading(true);
    setResponse(null);

    try {
      const testData: any = {
        recipient: recipient.trim(),
        channel: channel,
      };

      if (channelCategory === "EMAIL") {
        testData.email_route_id = selectedEmailRoute;
        testData.description = description.trim();
      } else if (channelCategory === "WHATSAPP") {
        testData.whatsapp_route_id = selectedWhatsappRoute;
        testData.description = description.trim();
      } else if (channelCategory === "PUSH") {
        testData.push_route_id = selectedPushRoute;
        testData.description = description.trim();
      } else if (channelCategory === "USSD") {
        testData.ussd_route_id = selectedUssdRoute;
        testData.ussd_code = ussdCode.trim();
      } else {
        testData.sms_route_id = selectedRoute;
        testData.description = description.trim();
        if (selectedSenderId) {
          testData.sender_id = selectedSenderId;
        }
      }

      // TODO: Call manualRewardsTestService.sendTestReward(testData)
      // For now, just show a placeholder response
      const data = {
        success: true,
        data: testData,
      };

      setResponse({
        success: data.success,
        data,
      });

      if (data.success) {
        success("Test Sent", `Your test reward has been sent successfully`);
      } else {
        showError("Test Failed", data.error || `Failed to send test reward`);
      }
    } catch (err) {
      setResponse({
        success: false,
        error: (err as Error).message,
      });
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="space-y-4">
        {/* Header */}
        <BackButton
         
          showBreadcrumb={true}
          currentLabel="Test Reward"
        />

        <div>
          {/* Main Form */}
          <div className="max-w-2xl space-y-3">
            <div className={`border border-gray-200 ${tw.rounded} p-6`}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Send Test Reward
              </h2>

              {/* Communication Channel */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Channel *
                </label>
                {isLoadingChannels ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    Loading channels...
                  </div>
                ) : channels.length === 0 ? (
                  <p className="text-sm text-gray-500">No channels available</p>
                ) : (
                  <Listbox value={channel} onChange={setChannel}>
                    <div className="relative">
                      <Listbox.Button
                        className={`relative w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-left bg-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all duration-200`}
                      >
                        <span className="flex items-center justify-between">
                          <span>
                            {channels.find((c) => c.value === channel)?.label ||
                              "Select a channel..."}
                          </span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </span>
                      </Listbox.Button>
                      <Listbox.Options
                        className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg`}
                      >
                        {channels.map((ch) => (
                          <Listbox.Option
                            key={ch.value}
                            value={ch.value}
                            className={({ selected }) =>
                              `relative px-4 py-2 text-sm cursor-pointer text-gray-700 ${
                                selected ? "font-semibold" : ""
                              }`
                            }
                          >
                            {ch.label}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                )}
              </div>

              {/* Recipient Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {channelCategory === "EMAIL"
                    ? "Recipient Email *"
                    : channelCategory === "PUSH"
                    ? "User ID *"
                    : "Recipient *"}
                </label>
                <Input
                  placeholder={
                    channel === "EMAIL"
                      ? "e.g., user@example.com"
                      : "e.g., 254764555247"
                  }
                  value={recipient}
                  onChange={setRecipient}
                />
              </div>

              {/* Sender ID Selection - SMS/USSD only */}
              {(channelCategory === "SMS" || channelCategory === "USSD") && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender ID
                  </label>
                  {isLoadingSenderIds ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      Loading...
                    </div>
                  ) : senderIds.length === 0 ? (
                    <p className="text-sm text-gray-500">No Sender IDs available</p>
                  ) : (
                    <Listbox
                      value={selectedSenderId}
                      onChange={setSelectedSenderId}
                    >
                      <div className="relative">
                        <Listbox.Button
                          className={`relative w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-left bg-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all duration-200`}
                        >
                          <span className="flex items-center justify-between">
                            <span>
                              {selectedSenderId
                                ? senderIds.find((s) => s.id === selectedSenderId)?.name ||
                                  "Select a Sender ID..."
                                : "Select a Sender ID..."}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </span>
                        </Listbox.Button>
                        <Listbox.Options
                          className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg`}
                        >
                          {senderIds
                            .filter((sender) => sender.is_active)
                            .map((sender) => (
                              <Listbox.Option
                                key={sender.id}
                                value={sender.id}
                                className={({ selected }) =>
                                  `relative px-4 py-2 text-sm cursor-pointer text-gray-700 ${
                                    selected ? "font-semibold" : ""
                                  }`
                                }
                              >
                                {sender.name}
                              </Listbox.Option>
                            ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  )}
                </div>
              )}

              {/* Email Route Selection - EMAIL only */}
              {channelCategory === "EMAIL" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Route *
                  </label>
                  {isLoadingEmailRoutes ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      Loading...
                    </div>
                  ) : emailRoutes.length === 0 ? (
                    <p className="text-sm text-gray-500">No email routes available</p>
                  ) : (
                    <Listbox
                      value={selectedEmailRoute}
                      onChange={setSelectedEmailRoute}
                    >
                      <div className="relative">
                        <Listbox.Button
                          className={`relative w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-left bg-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all duration-200`}
                        >
                          <span className="flex items-center justify-between">
                            <span>
                              {selectedEmailRoute
                                ? emailRoutes.find((r) => r.id === selectedEmailRoute)?.name ||
                                  "Select an email route..."
                                : "Select an email route..."}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </span>
                        </Listbox.Button>
                        <Listbox.Options
                          className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg`}
                        >
                          {emailRoutes
                            .filter((route) => route.is_active)
                            .map((route) => (
                              <Listbox.Option
                                key={route.id}
                                value={route.id}
                                className={({ selected }) =>
                                  `relative px-4 py-2 text-sm cursor-pointer text-gray-700 ${
                                    selected ? "font-semibold" : ""
                                  }`
                                }
                              >
                                {route.name}
                              </Listbox.Option>
                            ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  )}
                </div>
              )}

              {/* WhatsApp Route Selection - WHATSAPP only */}
              {channelCategory === "WHATSAPP" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Route *
                  </label>
                  {isLoadingWhatsappRoutes ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      Loading...
                    </div>
                  ) : whatsappRoutes.length === 0 ? (
                    <p className="text-sm text-gray-500">No WhatsApp routes available</p>
                  ) : (
                    <Listbox
                      value={selectedWhatsappRoute}
                      onChange={setSelectedWhatsappRoute}
                    >
                      <div className="relative">
                        <Listbox.Button
                          className={`relative w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-left bg-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all duration-200`}
                        >
                          <span className="flex items-center justify-between">
                            <span>
                              {selectedWhatsappRoute
                                ? whatsappRoutes.find((r) => r.id === selectedWhatsappRoute)?.name ||
                                  "Select a WhatsApp route..."
                                : "Select a WhatsApp route..."}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </span>
                        </Listbox.Button>
                        <Listbox.Options
                          className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg`}
                        >
                          {whatsappRoutes
                            .filter((route) => route.is_active)
                            .map((route) => (
                              <Listbox.Option
                                key={route.id}
                                value={route.id}
                                className={({ selected }) =>
                                  `relative px-4 py-2 text-sm cursor-pointer text-gray-700 ${
                                    selected ? "font-semibold" : ""
                                  }`
                                }
                              >
                                {route.name}
                              </Listbox.Option>
                            ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  )}
                </div>
              )}

              {/* SMS Route Selection - SMS only */}
              {channelCategory === "SMS" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMS Route
                  </label>
                  {isLoadingRoutes ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      Loading...
                    </div>
                  ) : smsRoutes.length === 0 ? (
                    <p className="text-sm text-gray-500">No routes available</p>
                  ) : (
                    <Listbox
                      value={selectedRoute}
                      onChange={setSelectedRoute}
                    >
                      <div className="relative">
                        <Listbox.Button
                          className={`relative w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-left bg-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all duration-200`}
                        >
                          <span className="flex items-center justify-between">
                            <span>
                              {selectedRoute
                                ? smsRoutes.find((r) => r.id === selectedRoute)?.name ||
                                  "Select a route..."
                                : "Select a route..."}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </span>
                        </Listbox.Button>
                        <Listbox.Options
                          className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg`}
                        >
                          {smsRoutes
                            .filter((route) => route.is_active)
                            .map((route) => (
                              <Listbox.Option
                                key={route.id}
                                value={route.id}
                                className={({ selected }) =>
                                  `relative px-4 py-2 text-sm cursor-pointer text-gray-700 ${
                                    selected ? "font-semibold" : ""
                                  }`
                                }
                              >
                                {route.name}
                              </Listbox.Option>
                            ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  )}
                </div>
              )}

              {/* Push Notification App Selection - PUSH only */}
              {channelCategory === "PUSH" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    App Selection *
                  </label>
                  {isLoadingPushRoutes ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      Loading...
                    </div>
                  ) : pushRoutes.length === 0 ? (
                    <p className="text-sm text-gray-500">No apps available</p>
                  ) : (
                    <Listbox
                      value={selectedPushRoute}
                      onChange={setSelectedPushRoute}
                    >
                      <div className="relative">
                        <Listbox.Button
                          className={`relative w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-left bg-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all duration-200`}
                        >
                          <span className="flex items-center justify-between">
                            <span>
                              {selectedPushRoute
                                ? pushRoutes.find((r) => r.id === selectedPushRoute)?.name ||
                                  "Select an app..."
                                : "Select an app..."}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </span>
                        </Listbox.Button>
                        <Listbox.Options
                          className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg`}
                        >
                          {pushRoutes
                            .filter((route) => route.is_active)
                            .map((route) => (
                              <Listbox.Option
                                key={route.id}
                                value={route.id}
                                className={({ selected }) =>
                                  `relative px-4 py-2 text-sm cursor-pointer text-gray-700 ${
                                    selected ? "font-semibold" : ""
                                  }`
                                }
                              >
                                {route.name}
                              </Listbox.Option>
                            ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  )}
                </div>
              )}

              {/* USSD Route Selection - USSD only */}
              {channelCategory === "USSD" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    USSD Route *
                  </label>
                  {isLoadingUssdRoutes ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      Loading...
                    </div>
                  ) : ussdRoutes.length === 0 ? (
                    <p className="text-sm text-gray-500">No USSD routes available</p>
                  ) : (
                    <Listbox
                      value={selectedUssdRoute}
                      onChange={setSelectedUssdRoute}
                    >
                      <div className="relative">
                        <Listbox.Button
                          className={`relative w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-left bg-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all duration-200`}
                        >
                          <span className="flex items-center justify-between">
                            <span>
                              {selectedUssdRoute
                                ? ussdRoutes.find((r) => r.id === selectedUssdRoute)?.name ||
                                  "Select a USSD route..."
                                : "Select a USSD route..."}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </span>
                        </Listbox.Button>
                        <Listbox.Options
                          className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg`}
                        >
                          {ussdRoutes
                            .filter((route) => route.is_active)
                            .map((route) => (
                              <Listbox.Option
                                key={route.id}
                                value={route.id}
                                className={({ selected }) =>
                                  `relative px-4 py-2 text-sm cursor-pointer text-gray-700 ${
                                    selected ? "font-semibold" : ""
                                  }`
                                }
                              >
                                {route.name}
                              </Listbox.Option>
                            ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  )}
                </div>
              )}

              {/* USSD Code Input - USSD only */}
              {channelCategory === "USSD" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    USSD Code *
                  </label>
                  <Input
                    placeholder="e.g., *123#"
                    value={ussdCode}
                    onChange={setUssdCode}
                  />
                </div>
              )}

              {/* Description/Body - not shown for USSD */}
              {channelCategory !== "USSD" && (
                <div>
                  <Textarea
                    label={<>{channelCategory === "PUSH" ? "Body *" : "Description *"}</>}
                    value={description}
                    onChange={(value) => {
                      setDescription(value);
                      setDescriptionError("");
                    }}
                    placeholder={
                      channelCategory === "PUSH"
                        ? "Enter notification body..."
                        : "Enter reward description..."
                    }
                    rows={5}
                    hasError={!!descriptionError}
                  />
                  {descriptionError ? (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      {descriptionError}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Description length: {description.length} characters
                    </p>
                  )}
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendTest}
                disabled={isLoading}
                className="text-sm inline-flex items-center justify-center px-4 py-2 text-white font-medium rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: color.primary.action,
                }}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  `Send Test Reward`
                )}
              </button>
            </div>

            {/* Response */}
            {response && (
              <div className="pl-4">
                <div
                  className={`bg-white border ${tw.rounded} p-6  ${
                    response.success ? "border-green-300" : "border-red-300"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    {response.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : null}
                    <div className="flex-1">
                      <h3
                        className={`font-semibold ${
                          response.success ? "text-green-900" : "text-red-700"
                        }`}
                      >
                        {response.success ? "Success" : "Failed"}
                      </h3>
                    </div>
                  </div>

                  {/* Response Data */}
                  <div className="border border-gray-200 rounded p-4">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(response.data || response.error, null, 2)}
                    </pre>
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(response.data || response.error, null, 2)
                      );
                      success("Copied", "Response copied to clipboard");
                    }}
                    className="mt-3 text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Copy Response
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
