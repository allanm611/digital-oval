import { useState, useEffect } from "react";
import {  AlertCircle, CheckCircle, Loader, ChevronDown } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { color, tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import BackButton from "../../../shared/components/ui/BackButton";
import { useToast } from "../../../contexts/ToastContext";
import { smsTestService } from "../../routes/services/smsTestService";
import { smsRouteService } from "../../routes/services/smsRouteService";
import { senderIdService, SenderId } from "../../configurations/services/senderIdService";
import { SMSRoute } from "../../routes/types/smsRoute";

type CommunicationChannel = "SMS" | "EMAIL" | "WHATSAPP" | "PUSH";

interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}
export default function SMSTestPage() {
  const { success, error: showError } = useToast();
  const [channel, setChannel] = useState<CommunicationChannel>("SMS");
  const [msisdn, setMsisdn] = useState("254764555247");
  const [message, setMessage] = useState("");
  const [selectedSenderId, setSelectedSenderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<MessageResponse | null>(null);
  const [messageError, setMessageError] = useState("");
  const [smsRoutes, setSmsRoutes] = useState<SMSRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [senderIds, setSenderIds] = useState<SenderId[]>([]);
  const [isLoadingSenderIds, setIsLoadingSenderIds] = useState(true);

  const channels: Array<{
    value: CommunicationChannel;
    label: string;
  }> = [
    { value: "SMS", label: "SMS" },
    { value: "EMAIL", label: "Email" },
    { value: "WHATSAPP", label: "WhatsApp" },
    { value: "PUSH", label: "Push Notification" },
  ];

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

  const handleSendTest = async () => {
    // Validation
    if (!msisdn.trim()) {
      showError("Validation Error", "Please enter a phone number (MSISDN)");
      return;
    }
    if (!message.trim()) {
      setMessageError("Please enter a message");
      return;
    }

    setMessageError("");

    setIsLoading(true);
    setResponse(null);

    try {
      const testData: any = {
        msisdn: msisdn.trim(),
        message: message.trim(),
        channel: channel,
      };

      // Include SMS route if selected
      if (selectedRoute) {
        testData.sms_route_id = selectedRoute;
      }

      // Include sender ID if selected
      if (selectedSenderId) {
        testData.sender_id = selectedSenderId;
      }

      const data = await smsTestService.sendTestSMS(testData);

      setResponse({
        success: data.success,
        data,
      });

      if (data.success) {
        success("Test Sent", `Your test ${(channel || "").toLowerCase()} has been sent successfully`);
      } else {
        showError("Test Failed", data.error || `Failed to send test ${(channel || "").toLowerCase()}`);
      }
    } catch (err) {
      setResponse({
        success: false,
        error: (err as Error).message,
      });
      showError("Error", (err as Error).message || `Failed to send test ${(channel || "").toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="space-y-4">
        {/* Header */}
        <BackButton fallbackTo="/dashboard/manual-actions" showBreadcrumb={true} currentLabel="Test Message Tool" />

        <div>
          {/* Main Form */}
          <div className="max-w-2xl space-y-3">
            <div
              className={`border border-gray-200 ${tw.rounded} p-6`}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Send Test Message
              </h2>

              {/* Channel Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Channel *
                </label>
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
              </div>

              {/* MSISDN Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (MSISDN) *
                </label>
                <Input
                  placeholder="e.g., 254764555247"
                  value={msisdn}
                  onChange={setMsisdn}
                />
              </div>

              {/* Sender ID Selection */}
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

              {/* SMS Route Selection */}
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
                  <p className="text-sm text-gray-500">No SMS routes available</p>
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
                                "Select an SMS route..."
                              : "Select an SMS route..."}
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

              {/* Message Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setMessageError("");
                  }}
                  placeholder="Enter your test message..."
                  rows={5}
                  className={`w-full px-4 py-2 border ${
                    messageError ? "border-red-400" : "border-gray-300"
                  } ${tw.rounded} focus:ring-2 ${
                    messageError ? "focus:ring-red-400" : "focus:ring-blue-500"
                  } focus:border-transparent text-sm`}
                />
                {messageError ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {messageError}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Message length: {message.length} characters
                  </p>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendTest}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-4 py-2 text-white font-medium rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  `Send Test ${channel}`
                )}
              </button>
            </div>

            {/* Response */}
            {response && (
              <div className = "pl-4">
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
