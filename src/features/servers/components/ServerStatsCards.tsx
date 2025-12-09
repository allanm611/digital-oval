import { Activity, Globe, Layers, ShieldCheck, Signal } from "lucide-react";
import {
  ServerCountByEnvironment,
  ServerCountByProtocol,
  ServerCountByRegion,
  ServerHealthStats,
} from "../types/server";
import { color, tw } from "../../../shared/utils/utils";

type ServerStatsCardsProps = {
  healthStats?: ServerHealthStats | null;
  environmentCounts?: ServerCountByEnvironment;
  protocolCounts?: ServerCountByProtocol;
  regionCounts?: ServerCountByRegion;
  isLoading: boolean;
};

const formatPercent = (value: number, total: number) => {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
};

export default function ServerStatsCards({
  healthStats,
  environmentCounts = [],
  protocolCounts = [],
  regionCounts = [],
  isLoading,
}: ServerStatsCardsProps) {
  const totalServers = healthStats?.total_servers ?? 0;
  const healthy = healthStats?.healthy ?? 0;
  const unhealthy = healthStats?.unhealthy ?? 0;
  const healthEnabled = healthStats?.health_check_enabled ?? 0;
  const regionsCovered = regionCounts.filter((item) => !!item.region).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <div className="flex items-center gap-2">
          <Layers
            className="h-5 w-5"
            style={{ color: color.primary.accent }}
            aria-hidden
          />
          <p className="text-sm font-medium text-black">Total Servers</p>
        </div>
        <p className="mt-2 text-3xl font-bold text-black">
          {isLoading ? "..." : totalServers.toLocaleString()}
        </p>
        <p className="mt-3 text-sm text-black">
          {environmentCounts.length} environments tracked
        </p>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <div className="flex items-center gap-2">
          <ShieldCheck
            className="h-5 w-5"
            style={{ color: color.primary.accent }}
            aria-hidden
          />
          <p className="text-sm font-medium text-black">Health Coverage</p>
        </div>
        <p className="mt-2 text-3xl font-bold text-black">
          {isLoading
            ? "..."
            : `${healthEnabled.toLocaleString()}/${totalServers.toLocaleString()}`}
        </p>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="text-black">
            Healthy{" "}
            <span className="font-semibold text-black">
              {healthy.toLocaleString()}
            </span>
          </span>
          <span className="text-black">•</span>
          <span className="text-black">
            Unhealthy{" "}
            <span className="font-semibold text-black">
              {unhealthy.toLocaleString()}
            </span>
          </span>
        </div>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <div className="flex items-center gap-2">
          <Signal
            className="h-5 w-5"
            style={{ color: color.primary.accent }}
            aria-hidden
          />
          <p className="text-sm font-medium text-black">Protocol Mix</p>
        </div>
        <p className="mt-2 text-3xl font-bold text-black">
          {isLoading ? "..." : protocolCounts.length}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {protocolCounts.slice(0, 4).map((protocol) => (
            <div
              key={protocol.protocol}
              className={`flex items-center justify-between ${tw.rounded} bg-gray-50 px-3 py-2`}
            >
              <span className="font-medium text-black uppercase">
                {protocol.protocol}
              </span>
              <span className="text-black">
                {formatPercent(protocol.count, totalServers)}
              </span>
            </div>
          ))}
          {protocolCounts.length === 0 && (
            <p className="col-span-2 text-black">No protocol data</p>
          )}
        </div>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <div className="flex items-center gap-2">
          <Globe
            className="h-5 w-5"
            style={{ color: color.primary.accent }}
            aria-hidden
          />
          <p className="text-sm font-medium text-black">Region Coverage</p>
        </div>
        <p className="mt-2 text-3xl font-bold text-black">
          {isLoading ? "..." : regionsCovered}
        </p>
        <div className="mt-3 space-y-2 text-sm">
          {environmentCounts.slice(0, 3).map((env) => (
            <div
              key={`${env.environment}-stat`}
              className={`flex items-center justify-between ${tw.rounded} bg-gray-50 px-3 py-2`}
            >
              <div className="flex items-center gap-2">
                <Activity
                  size={16}
                  style={{ color: color.primary.accent }}
                  aria-hidden
                />
                <span className="font-medium capitalize text-black">
                  {env.environment || "unknown"}
                </span>
              </div>
              <span className="text-black">
                {formatPercent(env.count, totalServers)}
              </span>
            </div>
          ))}
          {environmentCounts.length === 0 && (
            <p className="text-black">No environment data</p>
          )}
        </div>
      </div>
    </div>
  );
}
