import { useEffect, useState, ReactNode } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { offerCreativeService } from "../services/offerCreativeService";
import { OfferCreative } from "../types/offerCreative";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";

const DetailItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="space-y-1">
    <p
      className={`text-sm font-semibold uppercase tracking-wide ${tw.textMuted}`}
    >
      {label}
    </p>
    <div className={`text-sm ${tw.textPrimary}`}>{value}</div>
  </div>
);

export default function OfferCreativeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError } = useToast();
  const [creative, setCreative] = useState<OfferCreative | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const returnTo = (
    location.state as {
      returnTo?: { pathname: string; section?: string; state?: unknown };
    }
  )?.returnTo;

  useEffect(() => {
    if (!id) {
      setError("Creative ID is missing.");
      setLoading(false);
      return;
    }

    const loadCreative = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await offerCreativeService.getById(Number(id), true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const creativeData = (response as any).data || response;
        setCreative(creativeData);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load offer creative details.";
        setError(message);
        showError("Failed to load creative", message);
      } finally {
        setLoading(false);
      }
    };

    loadCreative();
  }, [id, showError]);

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo.pathname, {
        replace: true,
        state: returnTo.state ?? { focusSection: returnTo.section },
      });
    } else {
      navigate(-1);
    }
  };

  const handleViewOffer = () => {
    if (returnTo) {
      navigate(returnTo.pathname, {
        replace: true,
        state: returnTo.state ?? { focusSection: returnTo.section },
      });
      return;
    }
    if (creative?.offer_id) {
      navigate(`/dashboard/offers/${creative.offer_id}`, {
        state: { focusSection: "creatives" },
      });
    }
  };

  const handleViewUser = (userId?: number) => {
    if (!userId) return;
    const currentReturnState = {
      pathname: location.pathname + location.search,
      state: { returnTo },
    };
    navigate(`/dashboard/user-management/${userId}`, {
      state: {
        returnTo: currentReturnState,
      },
    });
  };

  const renderStatusBadge = (isActive?: boolean) =>
    isActive ? (
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">
        Inactive
      </span>
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className={`text-sm ${tw.textMuted}`}>{error}</p>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium"
          style={{ color: color.primary.accent }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    );
  }

  if (!creative) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className={`text-sm ${tw.textMuted}`}>
          This creative could not be found.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium"
          style={{ color: color.primary.accent }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {creative.title || "Creative"}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
              {creative.channel}
            </span>
            {creative.locale && (
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-white"
                style={{
                  backgroundColor: color.primary.accent,
                }}
              >
                {creative.locale}
              </span>
            )}
            {renderStatusBadge(creative.is_active)}
            {creative.version && (
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-white"
                style={{
                  backgroundColor: color.primary.accent,
                }}
              >
                Version {creative.version}
              </span>
            )}
          </div>
        </div>
        {creative.offer_id && (
          <button
            type="button"
            onClick={handleViewOffer}
            className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors"
            style={{ backgroundColor: color.primary.action }}
          >
            View Offer
          </button>
        )}
      </div>

      <div
        className={`bg-white rounded-md border border-[${color.border.default}] p-6 space-y-6`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <DetailItem label="Creative ID" value={creative.id ?? "—"} />
            <DetailItem
              label="Offer"
              value={
                creative.offer_id ? (
                  <button
                    type="button"
                    onClick={handleViewOffer}
                    className="font-semibold hover:underline"
                    style={{ color: color.primary.accent }}
                  >
                    {creative.offer_id}
                  </button>
                ) : (
                  <span className={`text-sm ${tw.textMuted}`}>—</span>
                )
              }
            />
            <DetailItem
              label="Created"
              value={
                creative.created_at ? (
                  new Date(creative.created_at).toLocaleString()
                ) : (
                  <span className={`text-sm ${tw.textMuted}`}>—</span>
                )
              }
            />
            <DetailItem
              label="Updated"
              value={
                creative.updated_at ? (
                  new Date(creative.updated_at).toLocaleString()
                ) : (
                  <span className={`text-sm ${tw.textMuted}`}>—</span>
                )
              }
            />
          </div>

          <div className="space-y-4">
            <DetailItem
              label="Created By"
              value={
                creative.created_by ? (
                  <button
                    type="button"
                    onClick={() => handleViewUser(creative.created_by)}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: color.primary.accent }}
                  >
                    {creative.created_by}
                  </button>
                ) : (
                  <span className={`text-sm ${tw.textMuted}`}>—</span>
                )
              }
            />
            <DetailItem
              label="Updated By"
              value={
                creative.updated_by ? (
                  <button
                    type="button"
                    onClick={() => handleViewUser(creative.updated_by)}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: color.primary.accent }}
                  >
                    {creative.updated_by}
                  </button>
                ) : (
                  <span className={`text-sm ${tw.textMuted}`}>—</span>
                )
              }
            />
            <DetailItem
              label="Template Type"
              value={
                creative.template_type_id ? (
                  <div className="space-y-1">
                    <span className="font-medium text-gray-900">
                      Template #{creative.template_type_id}
                    </span>
                    <p className={`text-sm ${tw.textMuted}`}>
                      Determines the layout and content structure used when this
                      creative is rendered.
                    </p>
                  </div>
                ) : (
                  <span className={`text-sm ${tw.textMuted}`}>
                    Not specified
                  </span>
                )
              }
            />
            <DetailItem
              label="Latest Version"
              value={creative.is_latest ? "Yes" : "No"}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Content</h2>
          <DetailItem
            label="Title"
            value={
              creative.title || (
                <span className={`text-sm ${tw.textMuted}`}>
                  No title provided
                </span>
              )
            }
          />
          <div className="space-y-2">
            <p
              className={`text-sm font-semibold uppercase tracking-wide ${tw.textMuted}`}
            >
              Text Body
            </p>
            {creative.text_body ? (
              <div
                className={`rounded-md border border-[${color.border.default}] bg-gray-50 p-4 text-sm ${tw.textPrimary}`}
              >
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {creative.text_body}
                </pre>
              </div>
            ) : (
              <span className={`text-sm ${tw.textMuted}`}>
                No text content provided
              </span>
            )}
          </div>

          {(creative.channel === "Email" || creative.channel === "Web") && (
            <div className="space-y-2 w-full">
              <p
                className={`text-sm font-semibold uppercase tracking-wide ${tw.textMuted}`}
              >
                HTML Body
              </p>
              {creative.html_body ? (
                <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm overflow-x-auto w-full">
                  {creative.html_body}
                </pre>
              ) : (
                <span className={`text-sm ${tw.textMuted}`}>
                  No HTML content provided
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 w-full">
          <p
            className={`text-sm font-semibold uppercase tracking-wide ${tw.textMuted}`}
          >
            Variables
          </p>
          {creative.variables &&
          Object.keys(creative.variables || {}).length > 0 ? (
            <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm overflow-x-auto w-full">
              {JSON.stringify(creative.variables, null, 2)}
            </pre>
          ) : (
            <span className={`text-sm ${tw.textMuted}`}>
              No variables defined
            </span>
          )}
        </div>

        <div className="space-y-2">
          <p
            className={`text-sm font-semibold uppercase tracking-wide ${tw.textMuted}`}
          >
            Default Values
          </p>
          {creative.default_values &&
          Object.keys(creative.default_values || {}).length > 0 ? (
            <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm overflow-x-auto">
              {JSON.stringify(creative.default_values, null, 2)}
            </pre>
          ) : (
            <span className={`text-sm ${tw.textMuted}`}>
              No default values defined
            </span>
          )}
        </div>

        <div className="space-y-2">
          <p
            className={`text-sm font-semibold uppercase tracking-wide ${tw.textMuted}`}
          >
            Required Variables
          </p>
          {creative.required_variables &&
          creative.required_variables.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {creative.required_variables.map((variable) => (
                <span
                  key={variable}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold"
                >
                  {variable}
                </span>
              ))}
            </div>
          ) : (
            <span className={`text-sm ${tw.textMuted}`}>
              No required variables
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
