import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Zap } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { SystemEvent, SYSTEM_EVENTS, SYSTEM_EVENT_CATEGORIES } from "../types/systemEvent";
import { color, tw } from "../../../shared/utils/utils";
import { button } from "../../../shared/utils/utils";

export default function SystemEventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const parentLabel = (location.state as any)?.parentLabel;
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<SystemEvent | null>(null);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const eventId = Number(id);
      const foundEvent = SYSTEM_EVENTS.find((e) => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
      } else {
        navigate("/dashboard/kpis/system-events");
      }
    } catch (err) {
      navigate("/dashboard/kpis/system-events");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (categoryValue: string): string => {
    const category = SYSTEM_EVENT_CATEGORIES.find((cat) => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading system event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <BackButton fallbackTo="/dashboard/kpis/system-events" />
          <p className={tw.textSecondary}>Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton fallbackTo="/dashboard/kpis/system-events" showBreadcrumb={true} currentLabel="System Event Details" parentLabel={parentLabel} />
      </div>

      {/* Event Information */}
      <div className="space-y-6">
        {/* Event Overview & Details */}
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-start space-x-4 mb-6">
            <div
              className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
              style={{ backgroundColor: color.primary.accent }}
            >
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>{event.event_name}</h2>
              <p className={`text-sm ${tw.textSecondary} leading-relaxed`}>
                {event.event_description || "No description available"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Event Code
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{event.event_code}</p>
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Category
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{getCategoryLabel(event.category)}</p>
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Data Source
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{event.data_source}</p>
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Frequency
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>{event.frequency}</p>
            </div>
            <div className="space-y-1">
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}>
                Source Table
              </label>
              <p className={`text-sm ${tw.textPrimary}`}>—</p>
            </div>
          </div>
        </div>

        {/* Operators */}
        {event.time_operators && event.time_operators.length > 0 && (
          <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
            <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
              Operators
            </h3>
            <div className="space-y-2">
              {event.time_operators.map((operator) => (
                <div
                  key={operator}
                  className="text-sm text-gray-900"
                >
                  {operator
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
