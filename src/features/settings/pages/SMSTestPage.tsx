import { useState } from "react";
import {  AlertCircle, CheckCircle, Loader } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import { useToast } from "../../../contexts/ToastContext";
import { smsTestService } from "../../routes/services/smsTestService";

interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}
export default function SMSTestPage() {
  const { success, error: showError } = useToast();
  const [msisdn, setMsisdn] = useState("254764555247");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<MessageResponse | null>(null);
  const [messageError, setMessageError] = useState("");

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
      const data = await smsTestService.sendTestSMS({
        msisdn: msisdn.trim(),
        message: message.trim(),
      });

      setResponse({
        success: data.success,
        data,
      });

      if (data.success) {
        success("SMS Test Sent", "Your test SMS has been sent successfully");
      } else {
        showError("SMS Test Failed", data.error || "Failed to send test SMS");
      }
    } catch (err) {
      setResponse({
        success: false,
        error: (err as Error).message,
      });
      showError("Error", (err as Error).message || "Failed to send test SMS");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="space-y-4">
        {/* Header */}
        <BackButton fallbackTo="/dashboard/manual-actions" showBreadcrumb={true} currentLabel="SMS Test Tool" />

        <div>
          {/* Main Form */}
          <div className="max-w-2xl space-y-3">
            <div
              className={`border border-gray-200 ${tw.rounded} p-6`}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Send Test SMS
              </h2>

              {/* MSISDN Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (MSISDN) *
                </label>
                <input
                  type="text"
                  value={msisdn}
                  onChange={(e) => setMsisdn(e.target.value)}
                  className={`w-full px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                />
              </div>

              {/* Message Input */}
              <div className="mb-6">
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
                  "Send Test SMS"
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
