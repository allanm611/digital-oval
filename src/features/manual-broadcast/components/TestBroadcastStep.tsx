import { useState } from "react";
import {
  Send,
  Plus,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { ManualBroadcastData } from "../pages/CreateManualBroadcastPage";
import { useLanguage } from "../../../contexts/LanguageContext";

interface TestBroadcastStepProps {
  data: ManualBroadcastData;
  onUpdate: (data: Partial<ManualBroadcastData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface TestResult {
  contact: string;
  status: "success" | "failed";
  message?: string;
}

export default function TestBroadcastStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
}: TestBroadcastStepProps) {
  const { t } = useLanguage();
  const [testContacts, setTestContacts] = useState<string[]>(
    data.testContacts || []
  );
  const [currentContact, setCurrentContact] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [error, setError] = useState("");

  const validateContact = (contact: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[0-9\s()-]{8,}$/;

    if (data.channel === "EMAIL") {
      return emailRegex.test(contact);
    } else if (data.channel === "SMS" || data.channel === "WHATSAPP") {
      return phoneRegex.test(contact);
    }
    return emailRegex.test(contact) || phoneRegex.test(contact);
  };

  const handleAddContact = () => {
    const trimmedContact = currentContact.trim();

    if (!trimmedContact) {
      setError(t.manualBroadcast.errorEnterContact);
      return;
    }

    if (!validateContact(trimmedContact)) {
      if (data.channel === "EMAIL") {
        setError(t.manualBroadcast.errorInvalidEmail);
      } else if (data.channel === "SMS" || data.channel === "WHATSAPP") {
        setError(t.manualBroadcast.errorInvalidPhone);
      } else {
        setError(t.manualBroadcast.errorInvalidContact);
      }
      return;
    }

    if (testContacts.includes(trimmedContact)) {
      setError(t.manualBroadcast.contactAlreadyAdded);
      return;
    }

    setTestContacts([...testContacts, trimmedContact]);
    setCurrentContact("");
    setError("");
  };

  const handleRemoveContact = (contact: string) => {
    setTestContacts(testContacts.filter((c) => c !== contact));
  };

  const handleSendTest = async () => {
    if (testContacts.length === 0) {
      setError(t.manualBroadcast.errorAddAtLeastOne);
      return;
    }

    setIsTesting(true);
    setError("");
    setTestResults([]);

    try {
      // Simulate test sending - validates contacts and shows preview
      // Real sending will happen at Step 4 (Schedule) via campaign execution
      const results: TestResult[] = [];

      for (const contact of testContacts) {
        // Simulate a small delay for each contact
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Validate contact format
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
        const isValidPhone = /^[+]?[0-9\s()-]{8,}$/.test(contact);
        
        const isValid = data.channel === "EMAIL" 
          ? isValidEmail 
          : (data.channel === "SMS" || data.channel === "WHATSAPP")
            ? isValidPhone
            : (isValidEmail || isValidPhone);

        if (isValid) {
          results.push({
            contact,
            status: "success",
            message: `${t.manualBroadcast.testMessageSuccess} (${data.channel})`,
          });
        } else {
          results.push({
            contact,
            status: "failed",
            message: data.channel === "EMAIL" 
              ? t.manualBroadcast.errorInvalidEmail
              : t.manualBroadcast.errorInvalidPhone,
          });
        }
      }

      setTestResults(results);
    } catch (err) {
      console.error("Failed to process test broadcasts:", err);
      setError(t.manualBroadcast.errorSendTestFailed);
    } finally {
      setIsTesting(false);
    }
  };

  const handleNext = () => {
    // Update data - convert testResults array to Record format
    const resultsRecord: Record<string, unknown> = {
      results: testResults,
      successCount: testResults.filter(r => r.status === "success").length,
      failedCount: testResults.filter(r => r.status === "failed").length,
    };
    
    onUpdate({
      testContacts: testContacts,
      testResults: resultsRecord,
    });

    // Move to next step
    onNext();
  };

  const handleSkipTest = () => {
    // Update data
    onUpdate({
      testContacts: [],
      testResults: {},
    });

    // Move to next step
    onNext();
  };

  return (
    <div
      className="bg-white rounded-md shadow-sm border"
      style={{ borderColor: color.border.default }}
    >
      <div
        className="p-4 sm:p-6 border-b"
        style={{ borderColor: color.border.default }}
      >
        <h2 className={`text-lg sm:text-xl font-semibold ${tw.textPrimary}`}>
          {t.manualBroadcast.testBroadcastTitle}
        </h2>
        <p className={`text-xs sm:text-sm ${tw.textSecondary} mt-1`}>
          {t.manualBroadcast.testBroadcastSubtitle}
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Test Contact Input */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            {data.channel === "EMAIL"
              ? t.manualBroadcast.testInputLabelEmail
              : data.channel === "SMS" || data.channel === "WHATSAPP"
              ? t.manualBroadcast.testInputLabelPhone
              : t.manualBroadcast.testInputLabelGeneric}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={currentContact}
              onChange={(e) => setCurrentContact(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddContact();
                }
              }}
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2"
              style={{
                borderColor: color.border.default,
                color: color.text.primary,
              }}
              placeholder={
                data.channel === "EMAIL"
                  ? t.manualBroadcast.testPlaceholderEmail
                  : data.channel === "SMS" || data.channel === "WHATSAPP"
                  ? t.manualBroadcast.testPlaceholderPhone
                  : t.manualBroadcast.testPlaceholderGeneric
              }
              disabled={isTesting}
            />
            <button
              onClick={handleAddContact}
              disabled={isTesting}
              className="w-full sm:w-auto px-4 py-2 text-white rounded-md transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>{t.manualBroadcast.addContact}</span>
            </button>
          </div>
          <p className={`text-xs ${tw.textSecondary} mt-1`}>
            {data.channel === "EMAIL"
              ? t.manualBroadcast.testHelperEmail
              : data.channel === "SMS" || data.channel === "WHATSAPP"
              ? t.manualBroadcast.testHelperPhone
              : t.manualBroadcast.testHelperGeneric}
          </p>
        </div>

        {/* Test Contacts List */}
        {testContacts.length > 0 && (
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
            >
              {t.manualBroadcast.testRecipientsLabel.replace(
                "{count}",
                String(testContacts.length)
              )}
            </label>
            <div className="space-y-2">
              {testContacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-md"
                  style={{ backgroundColor: color.surface.cards }}
                >
                  <span className={`text-sm ${tw.textPrimary}`}>{contact}</span>
                  <button
                    onClick={() => handleRemoveContact(contact)}
                    disabled={isTesting}
                    className="p-1 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Test Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSendTest}
            disabled={testContacts.length === 0 || isTesting}
            className="w-full sm:w-auto sm:min-w-[200px] px-6 py-3 text-white rounded-md transition-all text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ backgroundColor: color.primary.accent }}
          >
            {isTesting ? (
              <>
                <Loader className="w-5 h-5 animate-spin flex-shrink-0" />
                <span>{t.manualBroadcast.sendingTest}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 flex-shrink-0" />
                <span>{t.manualBroadcast.sendTest}</span>
              </>
            )}
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-3`}
            >
              {t.manualBroadcast.testResults}
            </label>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-md"
                  style={{
                    backgroundColor:
                      result.status === "success"
                        ? `${color.status.success}10`
                        : `${color.status.danger}10`,
                    border: `1px solid ${
                      result.status === "success"
                        ? `${color.status.success}30`
                        : `${color.status.danger}30`
                    }`,
                  }}
                >
                  {result.status === "success" ? (
                    <CheckCircle
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: color.status.success }}
                    />
                  ) : (
                    <XCircle
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: color.status.danger }}
                    />
                  )}
                  <div className="flex-1">
                    <p
                      className="text-sm font-medium"
                      style={{
                        color:
                          result.status === "success"
                            ? color.status.success
                            : color.status.danger,
                      }}
                    >
                      {result.contact}
                    </p>
                    <p className={`text-xs ${tw.textMuted} mt-0.5`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Success Summary */}
            <div
              className="mt-4 p-4 rounded-md"
              style={{ backgroundColor: `${color.primary.accent}10` }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: color.primary.accent }}
              >
                {t.manualBroadcast.testCompleted}
              </p>
              <p className={`text-xs ${tw.textSecondary} mt-1`}>
                {t.manualBroadcast.testSummary
                  .replace(
                    "{success}",
                    String(
                      testResults.filter((r) => r.status === "success").length
                    )
                  )
                  .replace("{total}", String(testResults.length))}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="p-3 rounded-md flex items-start space-x-2"
            style={{
              backgroundColor: `${color.status.danger}10`,
              border: `1px solid ${color.status.danger}30`,
            }}
          >
            <AlertCircle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: color.status.danger }}
            />
            <p className="text-sm" style={{ color: color.status.danger }}>
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="p-4 sm:p-6 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        style={{ borderColor: color.border.default }}
      >
        <button
          onClick={onPrevious}
          disabled={isTesting}
          className="w-full sm:w-auto px-6 py-2.5 rounded-md transition-all text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
          style={{
            backgroundColor: color.surface.cards,
            border: `1px solid ${color.border.default}`,
            color: color.text.primary,
          }}
        >
          {t.manualBroadcast.previous}
        </button>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleSkipTest}
            disabled={isTesting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-md transition-all text-sm font-medium disabled:opacity-50 whitespace-nowrap"
            style={{
              color: color.text.secondary,
            }}
          >
            {t.manualBroadcast.skipTest}
          </button>
          <button
            onClick={handleNext}
            disabled={isTesting}
            className="w-full sm:w-auto px-6 py-2.5 text-white rounded-md transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ backgroundColor: color.primary.action }}
          >
            {t.manualBroadcast.nextSchedule}
          </button>
        </div>
      </div>
    </div>
  );
}
