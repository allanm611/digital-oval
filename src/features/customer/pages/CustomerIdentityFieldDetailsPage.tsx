import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Database,
  FileText,
  Settings as SettingsIcon,
  ListChecks,
} from "lucide-react";
import { tw, color } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { CustomerIdentityField } from "../types/customerIdentity";
import { customerIdentityService } from "../services/customerIdentityService";
import { useLanguage } from "../../../contexts/LanguageContext";

type LocationState = {
  field?: CustomerIdentityField;
};

export default function CustomerIdentityFieldDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const initialField = (location.state as LocationState | undefined)?.field;

  const [field, setField] = useState<CustomerIdentityField | null>(
    initialField ?? null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialField);
  const [error, setError] = useState<string | null>(null);

  const fieldId = useMemo(() => {
    const parsed = Number(id);
    return Number.isNaN(parsed) ? null : parsed;
  }, [id]);

  const loadField = useCallback(async () => {
    if (fieldId == null) {
      setError(t.customerIdentity.invalidFieldIdentifier);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const fields = await customerIdentityService.getCustomerIdentityFields();
      const matchedField = fields.find((candidate) => candidate.id === fieldId);

      if (!matchedField) {
        setError(t.customerIdentity.fieldNotFound);
        setField(null);
        return;
      }

      setField(matchedField);
    } catch (err) {
      console.error("Failed to load customer identity field", err);
      const message =
        err instanceof Error
          ? err.message
          : t.customerIdentity.unableToLoadFieldDetails;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fieldId]);

  useEffect(() => {
    if (!initialField) {
      loadField();
    }
  }, [initialField, loadField]);

  const handleBack = () => {
    navigate("/dashboard/customer-identity");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="p-2 rounded-md transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div>
          <h1 className={`${tw.mainHeading} text-gray-900`}>
            {field ? field.field_name : t.customerIdentity.fieldDetails}
          </h1>
        </div>
      </div>

      {isLoading ? (
        <div
          className="bg-white border rounded-md p-12 flex items-center justify-center"
          style={{ borderColor: color.border.default }}
        >
          <LoadingSpinner variant="modern" size="lg" color="primary" />
        </div>
      ) : error ? (
        <div
          className="bg-white border rounded-md p-8 text-center space-y-3"
          style={{ borderColor: color.border.default }}
        >
          <h3 className="text-lg font-semibold text-gray-900">
            {t.customerIdentity.unableToLoadField}
          </h3>
          <p className={`${tw.textSecondary}`}>{error}</p>
          <button
            type="button"
            onClick={loadField}
            className="px-4 py-2 text-sm font-semibold text-white rounded-md hover:opacity-95 transition-colors"
            style={{ backgroundColor: color.primary.action }}
          >
            {t.customerIdentity.retry}
          </button>
        </div>
      ) : field ? (
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t.customerIdentity.fieldOverview}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <InfoCard
                icon={<Database className="h-5 w-5 text-white" />}
                title={t.customerIdentity.coreMetadata}
                items={[
                  {
                    label: t.customerIdentity.fieldName,
                    value: field.field_name,
                  },
                  {
                    label: t.customerIdentity.fieldValue,
                    value: field.field_value,
                  },
                  {
                    label: t.customerIdentity.description,
                    value: field.description || "—",
                  },
                ]}
              />
              <InfoCard
                icon={<FileText className="h-5 w-5 text-white" />}
                title={t.customerIdentity.typeInformation}
                items={[
                  {
                    label: t.customerIdentity.fieldType,
                    value: field.field_type,
                  },
                  { label: "Postgres Type", value: field.field_pg_type || "—" },
                  {
                    label: "Type Precision",
                    value:
                      field.field_type_precision != null
                        ? String(field.field_type_precision)
                        : "—",
                  },
                ]}
              />
              <InfoCard
                icon={<SettingsIcon className="h-5 w-5 text-white" />}
                title={t.customerIdentity.sourceValidation}
                items={[
                  {
                    label: t.customerIdentity.sourceTable,
                    value: field.source_table,
                  },
                  {
                    label: "Validation Strategy",
                    value: field.validation?.strategy || "none",
                  },
                  {
                    label: "Value Length",
                    value:
                      field.validation?.value_length != null
                        ? String(field.validation.value_length)
                        : "—",
                  },
                ]}
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-md"
                style={{ backgroundColor: color.primary.accent }}
              >
                <ListChecks className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t.customerIdentity.operatorSupport}
              </h2>
            </div>
            {field.operators.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-md p-6">
                <p className={`${tw.textSecondary} text-sm`}>
                  {t.customerIdentity.noOperatorsConfigured}
                </p>
              </div>
            ) : (
              <div
                className={`rounded-md border border-[${color.border.default}] overflow-hidden`}
              >
                <div className="hidden lg:block overflow-x-auto">
                  <table
                    className="min-w-full"
                    style={{
                      borderCollapse: "separate",
                      borderSpacing: "0 8px",
                    }}
                  >
                    <thead style={{ background: color.surface.tableHeader }}>
                      <tr>
                        {[
                          t.customerIdentity.label,
                          t.customerIdentity.symbol,
                          t.customerIdentity.requiresValue,
                          t.customerIdentity.requiresTwoValues,
                          t.customerIdentity.applicableTypes,
                        ].map((header) => (
                          <th
                            key={header}
                            className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                            style={{ color: color.surface.tableHeaderText }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {field.operators.map((operator) => (
                        <tr key={operator.id}>
                          <td
                            className="px-6 py-4 text-sm text-gray-900 font-medium"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {operator.label}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-700"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {operator.symbol}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-700"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {operator.requires_value
                              ? t.customerIdentity.yes
                              : t.customerIdentity.no}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-700"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {operator.requires_two_values
                              ? t.customerIdentity.yes
                              : t.customerIdentity.no}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-700"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {operator.applicable_field_types.join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

type InfoCardItem = {
  label: string;
  value: string;
};

type InfoCardProps = {
  icon: React.ReactNode;
  title: string;
  items: InfoCardItem[];
};

function InfoCard({ icon, title, items }: InfoCardProps) {
  return (
    <div
      className="bg-white border rounded-md p-5 space-y-4"
      style={{ borderColor: color.border.default }}
    >
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-md"
          style={{ backgroundColor: color.primary.accent }}
        >
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <dl className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt
              className={`text-xs font-medium uppercase tracking-wide ${tw.textMuted}`}
            >
              {item.label}
            </dt>
            <dd className="text-sm text-gray-900 mt-1 font-medium">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
