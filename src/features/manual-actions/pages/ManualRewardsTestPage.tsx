import { useState } from "react";
import { AlertCircle, CheckCircle, Loader, RefreshCw } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import BackButton from "../../../shared/components/ui/BackButton";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import {
  micaService,
  createMicaTransactionId,
  type MicaAction,
  type MicaDurationType,
  type MicaResponse,
} from "../services/micaService";
import {
  MICA_UNIT_TYPE_CATALOG,
  MICA_UNIT_TYPE_CUSTOM_VALUE,
} from "../config/micaUnitTypeCatalog";

type RewardKind = "bonus-units" | "bonus-airtime";

/**
 * Manual Rewards Test — MICA provisioning harness.
 *
 * Aligns with database-service `communication/mica`:
 *   POST /mica/bonus-units
 *   POST /mica/bonus-airtime
 *
 * This is NOT a messaging test (SMS/email/push). Use SMS Test / manual-email
 * for channel connectivity. MICA awards telecom bonuses (units / airtime).
 */
export default function ManualRewardsTestPage() {
  const { success, error: showError } = useToast();

  const [rewardKind, setRewardKind] = useState<RewardKind>("bonus-units");
  const [msisdn, setMsisdn] = useState("254764555247");
  const [micaChannel, setMicaChannel] = useState("CVM");
  const [action, setAction] = useState<MicaAction>("add");
  const [transactionId, setTransactionId] = useState(createMicaTransactionId());
  const [externalRef, setExternalRef] = useState("");

  // Bonus units fields — catalog is empty until ops confirms IDs
  const hasUnitTypeCatalog = MICA_UNIT_TYPE_CATALOG.length > 0;
  const [unitTypeSelection, setUnitTypeSelection] = useState(
    hasUnitTypeCatalog
      ? String(MICA_UNIT_TYPE_CATALOG[0].id)
      : MICA_UNIT_TYPE_CUSTOM_VALUE,
  );
  const [customUnitTypeId, setCustomUnitTypeId] = useState("1");
  const resolvedUnitTypeId =
    unitTypeSelection === MICA_UNIT_TYPE_CUSTOM_VALUE
      ? customUnitTypeId
      : unitTypeSelection;
  const [unitAmount, setUnitAmount] = useState("100");
  const [unitDurationType, setUnitDurationType] =
    useState<MicaDurationType>("days");
  const [unitDurationPeriod, setUnitDurationPeriod] = useState("7");

  // Airtime fields
  const [airtimeAmount, setAirtimeAmount] = useState("10");
  const [airtimeDurationType, setAirtimeDurationType] =
    useState<MicaDurationType>("days");
  const [airtimeDurationPeriod, setAirtimeDurationPeriod] = useState("7");

  const [fieldError, setFieldError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<MicaResponse | null>(null);

  const durationOptions = [
    { value: "days", label: "Days" },
    { value: "hours", label: "Hours" },
    { value: "minutes", label: "Minutes" },
  ];

  const regenerateTransactionId = () => {
    setTransactionId(createMicaTransactionId());
  };

  const validate = (): boolean => {
    if (!msisdn.trim()) {
      setFieldError("MSISDN is required (e.g. 2547XXXXXXXX)");
      return false;
    }
    if (!/^\d{10,15}$/.test(msisdn.trim())) {
      setFieldError("MSISDN must be digits only, 10–15 characters");
      return false;
    }
    if (!micaChannel.trim()) {
      setFieldError("MICA channel is required (typically CVM)");
      return false;
    }
    if (!transactionId.trim()) {
      setFieldError("Transaction ID is required and should be unique");
      return false;
    }

    if (rewardKind === "bonus-units") {
      if (
        !resolvedUnitTypeId.trim() ||
        Number.isNaN(Number(resolvedUnitTypeId))
      ) {
        setFieldError("Unit Type ID must be a valid number");
        return false;
      }
      if (!unitAmount.trim() || Number(unitAmount) <= 0) {
        setFieldError("Unit amount must be greater than 0");
        return false;
      }
      if (!unitDurationPeriod.trim() || Number(unitDurationPeriod) <= 0) {
        setFieldError("Duration period must be greater than 0");
        return false;
      }
    } else {
      if (!airtimeAmount.trim() || Number(airtimeAmount) <= 0) {
        setFieldError("Airtime amount must be greater than 0");
        return false;
      }
      if (
        !airtimeDurationPeriod.trim() ||
        Number(airtimeDurationPeriod) <= 0
      ) {
        setFieldError("Duration period must be greater than 0");
        return false;
      }
    }

    setFieldError("");
    return true;
  };

  const handleSendTest = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      let data: MicaResponse;

      if (rewardKind === "bonus-units") {
        data = await micaService.sendBonusUnits({
          channel: micaChannel.trim(),
          subscriber: [
            {
              msisdn: msisdn.trim(),
              action,
              transactionID: transactionId.trim(),
              bonusUnits: [
                {
                  unitTypeID: Number(resolvedUnitTypeId),
                  unitAmount: Number(unitAmount),
                  unitDurationType: unitDurationType,
                  unitDurationPeriod: Number(unitDurationPeriod),
                },
              ],
            },
          ],
        });
      } else {
        data = await micaService.sendBonusAirtime({
          channel: micaChannel.trim(),
          subscriber: [
            {
              msisdn: msisdn.trim(),
              action,
              transactionID: transactionId.trim(),
              ...(externalRef.trim()
                ? { externalRef: externalRef.trim() }
                : {}),
              amount: Number(airtimeAmount),
              durationType: airtimeDurationType,
              durationPeriod: Number(airtimeDurationPeriod),
            },
          ],
        });
      }

      setResponse(data);

      if (data.success) {
        success(
          "Reward provisioned",
          rewardKind === "bonus-units"
            ? "Bonus units sent via MICA"
            : "Airtime credit sent via MICA",
        );
        // New unique txn for the next attempt
        regenerateTransactionId();
      } else {
        showError(
          "MICA request failed",
          data.error || "Upstream gateway returned an error",
        );
      }
    } catch (err) {
      const message = extractBackendError(err, "Error. Please try again.");
      setResponse({
        success: false,
        error: message,
      });
      showError("Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="space-y-4">
        <BackButton showBreadcrumb={true} currentLabel="Test Reward" />

        <div>
          <div className="max-w-2xl space-y-3">
            <div className={`border border-gray-200 ${tw.rounded} p-6`}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Send Test Reward
              </h2>

              {/* Reward kind */}
              <div className="mb-6">
                <HeadlessSelect
                  label="Reward Type *"
                  value={rewardKind}
                  onChange={(value) => setRewardKind(value as RewardKind)}
                  options={[
                    { value: "bonus-units", label: "Bonus Units" },
                    { value: "bonus-airtime", label: "Bonus Airtime" },
                  ]}
                  placeholder="Select reward type..."
                  labelBgColor="var(--c-primary-background)"
                />
              </div>

              {/* Shared subscriber fields */}
              <div className="mb-6">
                <Input
                  label="MSISDN *"
                  placeholder="e.g., 254764555247"
                  value={msisdn}
                  onChange={setMsisdn}
                  labelBgColor="var(--c-primary-background)"
                  style={{ borderColor: "#cbd5e1" }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Input
                  label="MICA Channel *"
                  placeholder="CVM"
                  value={micaChannel}
                  onChange={setMicaChannel}
                  labelBgColor="var(--c-primary-background)"
                  style={{ borderColor: "#cbd5e1" }}
                />
                <HeadlessSelect
                  label="Action *"
                  value={action}
                  onChange={(value) => setAction(value as MicaAction)}
                  options={[
                    { value: "add", label: "Add" },
                    { value: "remove", label: "Remove" },
                  ]}
                  labelBgColor="var(--c-primary-background)"
                />
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label="Transaction ID *"
                      placeholder="Unique reference"
                      value={transactionId}
                      onChange={setTransactionId}
                      labelBgColor="var(--c-primary-background)"
                      style={{ borderColor: "#cbd5e1" }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={regenerateTransactionId}
                    title="Generate new transaction ID"
                    className="mb-0.5 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bonus units fields */}
              {rewardKind === "bonus-units" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      {hasUnitTypeCatalog ? (
                        <>
                          <HeadlessSelect
                            label="Unit Type *"
                            value={unitTypeSelection}
                            onChange={setUnitTypeSelection}
                            options={[
                              ...MICA_UNIT_TYPE_CATALOG.map((item) => ({
                                value: String(item.id),
                                label: `${item.label} (ID ${item.id})`,
                              })),
                              {
                                value: MICA_UNIT_TYPE_CUSTOM_VALUE,
                                label: "Custom Unit Type ID…",
                              },
                            ]}
                            labelBgColor="var(--c-primary-background)"
                          />
                          {unitTypeSelection === MICA_UNIT_TYPE_CUSTOM_VALUE && (
                            <div className="mt-3">
                              <Input
                                label="Custom Unit Type ID *"
                                placeholder="e.g., 1"
                                value={customUnitTypeId}
                                onChange={setCustomUnitTypeId}
                                labelBgColor="var(--c-primary-background)"
                                style={{ borderColor: "#cbd5e1" }}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <Input
                          label="Unit Type ID *"
                          placeholder="e.g., 1"
                          value={customUnitTypeId}
                          onChange={setCustomUnitTypeId}
                          labelBgColor="var(--c-primary-background)"
                          style={{ borderColor: "#cbd5e1" }}
                        />
                      )}
                    </div>
                    <Input
                      label="Unit Amount *"
                      placeholder="e.g., 100"
                      value={unitAmount}
                      onChange={setUnitAmount}
                      labelBgColor="var(--c-primary-background)"
                      style={{ borderColor: "#cbd5e1" }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <HeadlessSelect
                      label="Duration Type *"
                      value={unitDurationType}
                      onChange={(value) =>
                        setUnitDurationType(value as MicaDurationType)
                      }
                      options={durationOptions}
                      labelBgColor="var(--c-primary-background)"
                    />
                    <Input
                      label="Duration Period *"
                      placeholder="e.g., 7"
                      value={unitDurationPeriod}
                      onChange={setUnitDurationPeriod}
                      labelBgColor="var(--c-primary-background)"
                      style={{ borderColor: "#cbd5e1" }}
                    />
                  </div>
                </>
              )}

              {/* Airtime fields */}
              {rewardKind === "bonus-airtime" && (
                <>
                  <div className="mb-6">
                    <Input
                      label="Airtime Amount *"
                      placeholder="e.g., 10.00"
                      value={airtimeAmount}
                      onChange={setAirtimeAmount}
                      labelBgColor="var(--c-primary-background)"
                      style={{ borderColor: "#cbd5e1" }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <HeadlessSelect
                      label="Duration Type *"
                      value={airtimeDurationType}
                      onChange={(value) =>
                        setAirtimeDurationType(value as MicaDurationType)
                      }
                      options={durationOptions}
                      labelBgColor="var(--c-primary-background)"
                    />
                    <Input
                      label="Duration Period *"
                      placeholder="e.g., 7"
                      value={airtimeDurationPeriod}
                      onChange={setAirtimeDurationPeriod}
                      labelBgColor="var(--c-primary-background)"
                      style={{ borderColor: "#cbd5e1" }}
                    />
                  </div>
                  <div className="mb-6">
                    <Input
                      label="External Ref"
                      placeholder="e.g., Campaign_001"
                      value={externalRef}
                      onChange={setExternalRef}
                      labelBgColor="var(--c-primary-background)"
                      style={{ borderColor: "#cbd5e1" }}
                    />
                  </div>
                </>
              )}

              {fieldError && (
                <p className="mb-4 flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {fieldError}
                </p>
              )}

              <button
                onClick={handleSendTest}
                disabled={isLoading}
                className="text-sm inline-flex items-center justify-center px-4 py-2 text-white font-medium rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: color.primary.action }}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Sending to MICA...
                  </>
                ) : (
                  `Send ${rewardKind === "bonus-units" ? "Bonus Units" : "Airtime"}`
                )}
              </button>
            </div>

            {response && (
              <div className="pl-4">
                <div
                  className={`bg-white border ${tw.rounded} p-6 ${
                    response.success ? "border-green-300" : "border-red-300"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    {response.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
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

                  <div className="border border-gray-200 rounded p-4">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(
                        response.data ?? response.error ?? response,
                        null,
                        2,
                      )}
                    </pre>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(
                          response.data ?? response.error ?? response,
                          null,
                          2,
                        ),
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
