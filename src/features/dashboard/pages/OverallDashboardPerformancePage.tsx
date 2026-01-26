import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  // LineChart,
  Line,
  ComposedChart,
} from "recharts";
import {
  Activity,
  CheckCircle2,
  Eye,
  Inbox,
  MailCheck,
  MousePointerClick,
  PackageCheck,
  Percent,
  Send,
  Target,
  TrendingUp,
} from "lucide-react";
import { colors } from "../../../shared/utils/tokens";
import { formatCurrency as formatCurrencyAmount } from "../../../shared/services/currencyService";
import type {
  RangeOption,
  OverallDashboardPerformanceResponse,
} from "../types/ReportsAPI";
import { useLanguage } from "../../../contexts/LanguageContext";

import { tw } from '../../../shared/utils/utils';
// Extract types from API response type
type PerformanceSnapshot = OverallDashboardPerformanceResponse;
type SMSDeliveryPoint = {
  date: string;
  sent: number;
  delivered: number;
  converted: number;
};

// Local UI types
type ChannelFilter = "All Channels" | "SMS" | "Email" | "Push" | "Social";

const timeRangeOptions: RangeOption[] = ["7d", "30d", "90d"];
const rangeDays: Record<RangeOption, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const getDaysBetween = (start: string, end: string) => {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (
    !startDate ||
    !endDate ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return null;
  }
  const diff = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const mapDaysToRange = (days: number | null): RangeOption => {
  if (days === null) return "7d";
  if (days <= 7) return "7d";
  if (days <= 30) return "30d";
  return "90d";
};

const getRangeLabel = (option: RangeOption): string => {
  const labels: Record<RangeOption, string> = {
    "7d": "Daily",
    "30d": "Weekly",
    "90d": "Monthly",
  };
  return labels[option];
};

// Scale data based on actual number of days vs base range
const getScaleFactor = (
  customDays: number | null,
  baseRange: RangeOption
): number => {
  if (!customDays) return 1;
  const baseDays = rangeDays[baseRange];
  return customDays / baseDays;
};

// Get date constraints for date inputs
const getDateConstraints = () => {
  const today = new Date();
  // Use local date to avoid timezone issues
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const maxDate = `${year}-${month}-${day}`; // Today (no future dates)

  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - 2); // 2 years ago max
  const minYear = minDate.getFullYear();
  const minMonth = String(minDate.getMonth() + 1).padStart(2, "0");
  const minDay = String(minDate.getDate()).padStart(2, "0");
  const minDateStr = `${minYear}-${minMonth}-${minDay}`;

  return { minDate: minDateStr, maxDate };
};

const channelOptions: ChannelFilter[] = [
  "All Channels",
  "SMS",
  "Email",
  "Push",
  "Social",
];

const mockPerformanceSnapshots: Record<RangeOption, PerformanceSnapshot> = {
  "7d": {
    reach: {
      reach: 125_000,
    },
    engagement: {
      clicks: 12_500,
      ctr: 10.0,
      openRate: 68.5,
      engagementRate: 12.3,
    },
    conversion: {
      conversions: 925,
      cvr: 7.4,
      cpc: 0.45,
      cpl: 6.2,
      cpa: 18.5,
      roas: 4.2,
      revenue: 74_000,
      spend: 17_625,
    },
    channels: [
      {
        channel: "SMS",
        reach: 450_000,
        clicks: 45_000,
        opens: 315_000,
        conversions: 36_000,
        revenue: 288_000,
        spend: 67_500,
        ctr: 10.0,
        openRate: 70.0,
        cvr: 8.0,
        cpc: 0.5,
        cpl: 6.25,
        cpa: 18.75,
        roas: 4.3,
        engagementRate: 0,
      },
      {
        channel: "Email",
        reach: 350_000,
        clicks: 35_000,
        opens: 231_000,
        conversions: 26_250,
        revenue: 210_000,
        spend: 52_500,
        ctr: 10.0,
        openRate: 66.0,
        cvr: 7.5,
        cpc: 0.4,
        cpl: 6.0,
        cpa: 20.0,
        roas: 4.0,
        engagementRate: 0,
      },
      {
        channel: "Push",
        reach: 250_000,
        clicks: 25_000,
        opens: 175_000,
        conversions: 18_000,
        revenue: 144_000,
        spend: 37_500,
        ctr: 10.0,
        openRate: 70.0,
        cvr: 7.2,
        cpc: 0.5,
        cpl: 6.5,
        cpa: 20.83,
        roas: 3.8,
        engagementRate: 0,
      },
      {
        channel: "Social",
        reach: 200_000,
        clicks: 20_000,
        opens: 0,
        conversions: 11_400,
        revenue: 91_200,
        spend: 16_000,
        ctr: 10.0,
        openRate: 0,
        cvr: 5.7,
        cpc: 0.8,
        cpl: 7.0,
        cpa: 13.95,
        roas: 5.7,
        engagementRate: 15.0,
      },
    ],
    smsDelivery: [
      {
        date: "Day 1",
        sent: 12_500,
        delivered: 11_800,
        converted: 945,
      },
      {
        date: "Day 2",
        sent: 12_200,
        delivered: 11_500,
        converted: 920,
      },
      {
        date: "Day 3",
        sent: 12_800,
        delivered: 12_100,
        converted: 968,
      },
      {
        date: "Day 4",
        sent: 12_400,
        delivered: 11_700,
        converted: 936,
      },
      {
        date: "Day 5",
        sent: 12_600,
        delivered: 11_900,
        converted: 952,
      },
      {
        date: "Day 6",
        sent: 12_100,
        delivered: 11_400,
        converted: 912,
      },
      {
        date: "Day 7",
        sent: 12_300,
        delivered: 11_600,
        converted: 928,
      },
    ],
    timeSeries: [
      {
        date: "Day 1",
        reach: 18_000,
        clicks: 1_800,
        conversions: 1_330,
        revenue: 10_640,
      },
      {
        date: "Day 2",
        reach: 17_500,
        clicks: 1_750,
        conversions: 1_300,
        revenue: 10_400,
      },
      {
        date: "Day 3",
        reach: 18_500,
        clicks: 1_850,
        conversions: 1_370,
        revenue: 10_960,
      },
      {
        date: "Day 4",
        reach: 18_200,
        clicks: 1_820,
        conversions: 1_350,
        revenue: 10_800,
      },
      {
        date: "Day 5",
        reach: 18_800,
        clicks: 1_880,
        conversions: 1_390,
        revenue: 11_120,
      },
      {
        date: "Day 6",
        reach: 17_800,
        clicks: 1_780,
        conversions: 1_320,
        revenue: 10_560,
      },
      {
        date: "Day 7",
        reach: 18_000,
        clicks: 1_800,
        conversions: 1_330,
        revenue: 10_640,
      },
    ],
  },
  "30d": {
    reach: {
      reach: 540_000,
    },
    engagement: {
      clicks: 54_000,
      ctr: 10.0,
      openRate: 68.2,
      engagementRate: 12.5,
    },
    conversion: {
      conversions: 3_996,
      cvr: 7.4,
      cpc: 0.44,
      cpl: 6.15,
      cpa: 18.3,
      roas: 4.3,
      revenue: 319_680,
      spend: 74_250,
    },
    channels: [
      {
        channel: "SMS",
        reach: 1_950_000,
        clicks: 195_000,
        opens: 1_365_000,
        conversions: 156_000,
        revenue: 1_248_000,
        spend: 292_500,
        ctr: 10.0,
        openRate: 70.0,
        cvr: 8.0,
        cpc: 0.5,
        cpl: 6.25,
        cpa: 18.75,
        roas: 4.3,
        engagementRate: 0,
      },
      {
        channel: "Email",
        reach: 1_500_000,
        clicks: 150_000,
        opens: 990_000,
        conversions: 112_500,
        revenue: 900_000,
        spend: 225_000,
        ctr: 10.0,
        openRate: 66.0,
        cvr: 7.5,
        cpc: 0.4,
        cpl: 6.0,
        cpa: 20.0,
        roas: 4.0,
        engagementRate: 0,
      },
      {
        channel: "Push",
        reach: 1_050_000,
        clicks: 105_000,
        opens: 735_000,
        conversions: 75_600,
        revenue: 604_800,
        spend: 157_500,
        ctr: 10.0,
        openRate: 70.0,
        cvr: 7.2,
        cpc: 0.5,
        cpl: 6.5,
        cpa: 20.83,
        roas: 3.8,
        engagementRate: 0,
      },
      {
        channel: "Social",
        reach: 900_000,
        clicks: 90_000,
        opens: 0,
        conversions: 51_300,
        revenue: 410_400,
        spend: 72_000,
        ctr: 10.0,
        openRate: 0,
        cvr: 5.7,
        cpc: 0.8,
        cpl: 7.0,
        cpa: 13.95,
        roas: 5.7,
        engagementRate: 15.2,
      },
    ],
    smsDelivery: [
      {
        date: "Oct 1-7",
        sent: 52_000,
        delivered: 49_000,
        converted: 3_920,
      },
      {
        date: "Oct 8-14",
        sent: 54_000,
        delivered: 51_000,
        converted: 4_080,
      },
      {
        date: "Oct 15-21",
        sent: 53_000,
        delivered: 50_000,
        converted: 4_000,
      },
      {
        date: "Oct 22-28",
        sent: 55_000,
        delivered: 52_000,
        converted: 4_160,
      },
    ],
    timeSeries: [
      {
        date: "Oct 1-7",
        reach: 135_000,
        clicks: 13_500,
        conversions: 9_990,
        revenue: 79_920,
      },
      {
        date: "Oct 8-14",
        reach: 135_000,
        clicks: 13_500,
        conversions: 9_990,
        revenue: 79_920,
      },
      {
        date: "Oct 15-21",
        reach: 135_000,
        clicks: 13_500,
        conversions: 9_990,
        revenue: 79_920,
      },
      {
        date: "Oct 22-28",
        reach: 135_000,
        clicks: 13_500,
        conversions: 9_990,
        revenue: 79_920,
      },
    ],
  },
  "90d": {
    reach: {
      reach: 1_620_000,
    },
    engagement: {
      clicks: 162_000,
      ctr: 10.0,
      openRate: 68.0,
      engagementRate: 12.7,
    },
    conversion: {
      conversions: 11_988,
      cvr: 7.4,
      cpc: 0.43,
      cpl: 6.1,
      cpa: 18.0,
      roas: 4.4,
      revenue: 959_040,
      spend: 222_750,
    },
    channels: [
      {
        channel: "SMS",
        reach: 5_850_000,
        clicks: 585_000,
        opens: 4_095_000,
        conversions: 468_000,
        revenue: 3_744_000,
        spend: 877_500,
        ctr: 10.0,
        openRate: 70.0,
        cvr: 8.0,
        cpc: 0.5,
        cpl: 6.25,
        cpa: 18.75,
        roas: 4.3,
        engagementRate: 0,
      },
      {
        channel: "Email",
        reach: 4_500_000,
        clicks: 450_000,
        opens: 2_970_000,
        conversions: 337_500,
        revenue: 2_700_000,
        spend: 675_000,
        ctr: 10.0,
        openRate: 66.0,
        cvr: 7.5,
        cpc: 0.4,
        cpl: 6.0,
        cpa: 20.0,
        roas: 4.0,
        engagementRate: 0,
      },
      {
        channel: "Push",
        reach: 3_150_000,
        clicks: 315_000,
        opens: 2_205_000,
        conversions: 226_800,
        revenue: 1_814_400,
        spend: 472_500,
        ctr: 10.0,
        openRate: 70.0,
        cvr: 7.2,
        cpc: 0.5,
        cpl: 6.5,
        cpa: 20.83,
        roas: 3.8,
        engagementRate: 0,
      },
      {
        channel: "Social",
        reach: 2_700_000,
        clicks: 270_000,
        opens: 0,
        conversions: 153_900,
        revenue: 1_231_200,
        spend: 216_000,
        ctr: 10.0,
        openRate: 0,
        cvr: 5.7,
        cpc: 0.8,
        cpl: 7.0,
        cpa: 13.95,
        roas: 5.7,
        engagementRate: 15.5,
      },
    ],
    smsDelivery: [
      {
        date: "September",
        sent: 156_000,
        delivered: 147_000,
        converted: 11_760,
      },
      {
        date: "October",
        sent: 162_000,
        delivered: 153_000,
        converted: 12_240,
      },
      {
        date: "November",
        sent: 159_000,
        delivered: 150_000,
        converted: 12_000,
      },
    ],
    timeSeries: [
      {
        date: "September",
        reach: 405_000,
        clicks: 40_500,
        conversions: 29_970,
        revenue: 239_760,
      },
      {
        date: "October",
        reach: 405_000,
        clicks: 40_500,
        conversions: 29_970,
        revenue: 239_760,
      },
      {
        date: "November",
        reach: 405_000,
        clicks: 40_500,
        conversions: 29_970,
        revenue: 239_760,
      },
    ],
  },
};

const formatNumber = (value: number) => {
  return value.toLocaleString("en-US");
};

// Using formatCurrencyAmount from currencyService instead

// Chart colors now use standardized colors from tokens.reportCharts

type ChartTooltipEntry = {
  color?: string;
  name?: string;
  value?: number | string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}>
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 text-sm"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}</span>
          </span>
          <span className="font-semibold text-gray-900">
            {typeof entry.value === "number"
              ? formatNumber(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function OverallDashboardPerformancePage() {
  const { t } = useLanguage();
  const [selectedRange, setSelectedRange] = useState<RangeOption>("7d");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [appliedCustomRange, setAppliedCustomRange] = useState({
    start: "",
    end: "",
  });
  const [channelFilter, setChannelFilter] =
    useState<ChannelFilter>("All Channels");
  const [kpiChannel, setKpiChannel] = useState<"SMS" | "Email">("SMS");
  const [isKpiTransitioning, setIsKpiTransitioning] = useState(false);
  const kpiTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (kpiTransitionTimeoutRef.current) {
        clearTimeout(kpiTransitionTimeoutRef.current);
      }
    };
  }, []);

  const handleKpiChannelChange = (option: "SMS" | "Email") => {
    if (option === kpiChannel) return;
    if (kpiTransitionTimeoutRef.current) {
      clearTimeout(kpiTransitionTimeoutRef.current);
    }
    setIsKpiTransitioning(true);
    kpiTransitionTimeoutRef.current = setTimeout(() => {
      setKpiChannel(option);
      setIsKpiTransitioning(false);
    }, 180);
  };
  const [useDummyData, setUseDummyData] = useState(true);

  const handleRun = () => {
    setAppliedCustomRange(customRange);
  };

  const customDays = getDaysBetween(
    appliedCustomRange.start,
    appliedCustomRange.end
  );
  const activeRangeKey: RangeOption =
    appliedCustomRange.start && appliedCustomRange.end
      ? mapDaysToRange(customDays)
      : selectedRange;

  // Calculate scale factor for custom date ranges
  const scaleFactor = useMemo(() => {
    if (appliedCustomRange.start && appliedCustomRange.end && customDays) {
      return getScaleFactor(customDays, activeRangeKey);
    }
    return 1;
  }, [
    appliedCustomRange.start,
    appliedCustomRange.end,
    customDays,
    activeRangeKey,
  ]);

  // Scale snapshot data based on actual date range
  const baseSnapshot = mockPerformanceSnapshots[activeRangeKey];
  // kpiSnapshot is computed but not currently used - kept for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _kpiSnapshot = useMemo(() => {
    if (!useDummyData) {
      return {
        reach: { reach: 0 },
        engagement: { clicks: 0, ctr: 0, openRate: 0, engagementRate: 0 },
        conversion: {
          conversions: 0,
          revenue: 0,
          spend: 0,
          cvr: 0,
          cpc: 0,
          cpl: 0,
          cpa: 0,
          roas: 0,
        },
      };
    }
    if (scaleFactor === 1) return baseSnapshot;
    return {
      ...baseSnapshot,
      reach: {
        reach: Math.round(baseSnapshot.reach.reach * scaleFactor),
      },
      engagement: {
        ...baseSnapshot.engagement,
        clicks: Math.round(baseSnapshot.engagement.clicks * scaleFactor),
        // Rates stay the same
        ctr: baseSnapshot.engagement.ctr,
        openRate: baseSnapshot.engagement.openRate,
        engagementRate: baseSnapshot.engagement.engagementRate,
      },
      conversion: {
        ...baseSnapshot.conversion,
        conversions: Math.round(
          baseSnapshot.conversion.conversions * scaleFactor
        ),
        revenue: Math.round(baseSnapshot.conversion.revenue * scaleFactor),
        spend: Math.round(baseSnapshot.conversion.spend * scaleFactor),
        // Rates stay the same
        cvr: baseSnapshot.conversion.cvr,
        cpc: baseSnapshot.conversion.cpc,
        cpl: baseSnapshot.conversion.cpl,
        cpa: baseSnapshot.conversion.cpa,
        roas: baseSnapshot.conversion.roas,
      },
    };
  }, [baseSnapshot, scaleFactor, useDummyData]);

  const channelSnapshot = useMemo(() => {
    if (!useDummyData) {
      return {
        ...baseSnapshot,
        channels: baseSnapshot.channels.map((channel) => ({
          ...channel,
          reach: 0,
          clicks: 0,
          opens: 0,
          conversions: 0,
          revenue: 0,
          spend: 0,
          ctr: 0,
          openRate: 0,
          cvr: 0,
          cpc: 0,
          cpl: 0,
          cpa: 0,
          roas: 0,
          engagementRate: 0,
        })),
      };
    }
    if (scaleFactor === 1) return baseSnapshot;
    return {
      ...baseSnapshot,
      channels: baseSnapshot.channels.map((channel) => ({
        ...channel,
        reach: Math.round(channel.reach * scaleFactor),
        clicks: Math.round(channel.clicks * scaleFactor),
        opens: Math.round(channel.opens * scaleFactor),
        conversions: Math.round(channel.conversions * scaleFactor),
        revenue: Math.round(channel.revenue * scaleFactor),
        spend: Math.round(channel.spend * scaleFactor),
        // Rates stay the same
        ctr: channel.ctr,
        openRate: channel.openRate,
        cvr: channel.cvr,
        cpc: channel.cpc,
        cpl: channel.cpl,
        cpa: channel.cpa,
        roas: channel.roas,
        engagementRate: channel.engagementRate,
      })),
    };
  }, [baseSnapshot, scaleFactor, useDummyData]);

  const smsDeliveryData: SMSDeliveryPoint[] = useMemo(() => {
    if (!useDummyData) {
      return baseSnapshot.smsDelivery.map((point) => ({
        ...point,
        sent: 0,
        delivered: 0,
        converted: 0,
      }));
    }
    if (scaleFactor === 1) return baseSnapshot.smsDelivery;
    return baseSnapshot.smsDelivery.map((point) => ({
      ...point,
      sent: Math.round(point.sent * scaleFactor),
      delivered: Math.round(point.delivered * scaleFactor),
      converted: Math.round(point.converted * scaleFactor),
    }));
  }, [baseSnapshot, scaleFactor, useDummyData]);

  const smsSummary = useMemo(() => {
    const totals = smsDeliveryData.reduce(
      (acc, point) => {
        const fulfilled = Math.round(point.delivered * 0.94);
        acc.sent += point.sent;
        acc.delivered += point.delivered;
        acc.fulfilled += fulfilled;
        acc.converted += point.converted;
        return acc;
      },
      { sent: 0, delivered: 0, fulfilled: 0, converted: 0 }
    );

    const deliveryRate =
      totals.sent > 0 ? (totals.delivered / totals.sent) * 100 : 0;
    const conversionRate =
      totals.fulfilled > 0 ? (totals.converted / totals.fulfilled) * 100 : 0;

    return {
      sent: totals.sent,
      delivered: totals.delivered,
      fulfilled: totals.fulfilled,
      converted: totals.converted,
      deliveryRate,
      conversionRate,
    };
  }, [smsDeliveryData]);

  const timeSeriesSnapshot = useMemo(() => {
    if (!useDummyData) {
      return {
        ...baseSnapshot,
        timeSeries: baseSnapshot.timeSeries.map((point) => ({
          ...point,
          reach: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
        })),
      };
    }
    if (scaleFactor === 1) return baseSnapshot;
    return {
      ...baseSnapshot,
      timeSeries: baseSnapshot.timeSeries.map((point) => ({
        ...point,
        reach: Math.round(point.reach * scaleFactor),
        clicks: Math.round(point.clicks * scaleFactor),
        conversions: Math.round(point.conversions * scaleFactor),
        revenue: Math.round(point.revenue * scaleFactor),
      })),
    };
  }, [baseSnapshot, scaleFactor, useDummyData]);

  const filteredChannels = useMemo(() => {
    if (channelFilter === "All Channels") {
      return channelSnapshot.channels;
    }
    return channelSnapshot.channels.filter(
      (channel) => channel.channel === channelFilter
    );
  }, [channelFilter, channelSnapshot]);

  const emailChannelMetrics = useMemo(() => {
    const emailChannel = channelSnapshot.channels.find(
      (channel) => channel.channel === "Email"
    );
    if (emailChannel) {
      return emailChannel;
    }
    return {
      channel: "Email",
      reach: 0,
      clicks: 0,
      opens: 0,
      conversions: 0,
      revenue: 0,
      spend: 0,
      ctr: 0,
      openRate: 0,
      cvr: 0,
      cpc: 0,
      cpl: 0,
      cpa: 0,
      roas: 0,
      engagementRate: 0,
    };
  }, [channelSnapshot]);

  const kpiCards = useMemo(() => {
    if (kpiChannel === "SMS") {
      return [
        {
          label: "SMS Sent",
          value: formatNumber(smsSummary.sent),
          subtext: "Total messages sent",
          Icon: Send,
        },
        {
          label: "Delivered",
          value: formatNumber(smsSummary.delivered),
          subtext: "Messages delivered",
          Icon: Inbox,
        },
        {
          label: "Delivery Rate",
          value: `${smsSummary.deliveryRate.toFixed(1)}%`,
          subtext: "Delivered vs sent",
          Icon: Percent,
        },
        {
          label: "Fulfilled",
          value: formatNumber(smsSummary.fulfilled),
          subtext: "Rewards fulfilled",
          Icon: PackageCheck,
        },
        {
          label: "Converted",
          value: formatNumber(smsSummary.converted),
          subtext: "Conversions attributed to SMS",
          Icon: CheckCircle2,
        },
        {
          label: "Conversion Rate",
          value: `${smsSummary.conversionRate.toFixed(1)}%`,
          subtext: "Converted vs fulfilled",
          Icon: Activity,
        },
      ];
    }

    return [
      {
        label: "Reach",
        value: formatNumber(emailChannelMetrics.reach),
        subtext: "Email audience reached",
        Icon: Eye,
      },
      {
        label: "Clicks",
        value: formatNumber(emailChannelMetrics.clicks),
        subtext: "Clicked email links",
        Icon: MousePointerClick,
      },
      {
        label: "Click-Through Rate (CTR)",
        value: `${emailChannelMetrics.ctr.toFixed(1)}%`,
        subtext: "Clicks vs emails sent",
        Icon: TrendingUp,
      },
      {
        label: "Open Rate",
        value: `${emailChannelMetrics.openRate.toFixed(1)}%`,
        subtext: "Opens vs emails sent",
        Icon: MailCheck,
      },
      {
        label: "Conversions",
        value: formatNumber(emailChannelMetrics.conversions),
        subtext: "Completed actions from email",
        Icon: Target,
      },
      {
        label: "Conversion Rate (CVR)",
        value: `${emailChannelMetrics.cvr.toFixed(1)}%`,
        subtext: "Conversions vs clicks",
        Icon: TrendingUp,
      },
    ];
  }, [kpiChannel, emailChannelMetrics, smsSummary]);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Overall Dashboard Performance
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            System-wide performance metrics and analytics
          </p>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {timeRangeOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setSelectedRange(option);
                  setCustomRange({ start: "", end: "" });
                  setAppliedCustomRange({ start: "", end: "" });
                }}
                className={`${tw.rounded} border px-3 py-1.5 text-sm font-medium transition-colors ${
                  !(appliedCustomRange.start && appliedCustomRange.end) &&
                  selectedRange === option
                    ? "border-[#252829] bg-[#252829] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                {getRangeLabel(option)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className={`flex items-center gap-2 ${tw.rounded} border border-gray-200 bg-white px-3 py-1.5`}>
              <label
                htmlFor="overall-data-toggle"
                className="text-sm font-medium text-gray-700 whitespace-nowrap mr-2"
              >
                Data Mode:
              </label>
              <button
                id="overall-data-toggle"
                type="button"
                onClick={() => setUseDummyData(!useDummyData)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#252829] focus:ring-offset-2 ${
                  useDummyData ? "bg-[#252829]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useDummyData ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="ml-2 text-xs text-gray-600 whitespace-nowrap">
                {useDummyData ? "Dummy Data" : "Real Data"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="overall-date-start"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                From:
              </label>
              <input
                id="overall-date-start"
                type="date"
                value={customRange.start}
                min={getDateConstraints().minDate}
                max={getDateConstraints().maxDate}
                onChange={(event) =>
                  setCustomRange((prev) => ({
                    ...prev,
                    start: event.target.value,
                  }))
                }
                className={`cursor-pointer ${tw.rounded} border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-[#252829] focus:outline-none focus:ring-1 focus:ring-[#252829]`}
              />
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="overall-date-end"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                To:
              </label>
              <input
                id="overall-date-end"
                type="date"
                value={customRange.end}
                min={customRange.start || getDateConstraints().minDate}
                max={getDateConstraints().maxDate}
                onChange={(event) =>
                  setCustomRange((prev) => ({
                    ...prev,
                    end: event.target.value,
                  }))
                }
                className={`cursor-pointer ${tw.rounded} border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-[#252829] focus:outline-none focus:ring-1 focus:ring-[#252829]`}
              />
            </div>
            {customRange.start && customRange.end && (
              <button
                type="button"
                onClick={handleRun}
                className={`${tw.rounded} px-4 py-1.5 text-sm font-medium text-white transition-colors`}
                style={{ backgroundColor: colors.primary.accent }}
              >
                Run
              </button>
            )}
            {(customRange.start || customRange.end) && (
              <button
                type="button"
                onClick={() => {
                  setCustomRange({ start: "", end: "" });
                  setAppliedCustomRange({ start: "", end: "" });
                }}
                className={`ml-1 ${tw.rounded} px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors`}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      {/* KPI Snapshot */}
      <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Channel Performance Snapshot
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Focus on SMS metrics or switch to Email KPIs
            </p>
          </div>
          <div className="flex gap-2">
            {(["SMS", "Email"] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleKpiChannelChange(option)}
                className={`${tw.rounded} border px-4 py-1.5 text-sm font-medium transition-colors ${
                  kpiChannel === option
                    ? "border-[#252829] bg-[#252829] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div
          className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 transform transition-all duration-300 ${
            isKpiTransitioning
              ? "opacity-0 translate-y-2"
              : "opacity-100 translate-y-0"
          }`}
        >
          {kpiCards.map(({ label, value, subtext, Icon }) => (
            <div
              key={label}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="h-5 w-5"
                  style={{ color: colors.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">{label}</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
              <p className="mt-1 text-xs text-gray-500">{subtext}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Channel Performance Comparison */}
      <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Performance by Channel
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Compare metrics across SMS, Email, Push, and Social channels
            </p>
          </div>
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {channelOptions.map((option) => (
            <button
              key={option}
              onClick={() => setChannelFilter(option)}
              className={`${tw.rounded} border px-3 py-1.5 text-xs font-medium transition-colors ${
                channelFilter === option
                  ? "border-[#252829] bg-[#252829] text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredChannels}
              margin={{ top: 20, right: 30, left: 24, bottom: 0 }}
              barCategoryGap="25%"
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="channel"
                tick={{ fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                label={{
                  value: "Interactions",
                  angle: -90,
                  position: "insideLeft",
                }}
                width={90}
                tickFormatter={(value) => formatNumber(value)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                label={{
                  value: "Rate (%)",
                  angle: 90,
                  position: "insideRight",
                }}
                width={60}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "transparent" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px", gap: "20px" }}
                iconType="circle"
              />
              <Bar
                yAxisId="left"
                dataKey="clicks"
                fill={
                  colors.reportCharts.overallPerformance.channelPerformance
                    .clicks
                }
                name="Clicks"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                yAxisId="left"
                dataKey="conversions"
                fill={
                  colors.reportCharts.overallPerformance.channelPerformance
                    .conversions
                }
                name="Conversions"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ctr"
                stroke={
                  colors.reportCharts.overallPerformance.channelPerformance.ctr
                }
                strokeWidth={2.5}
                name="CTR (%)"
                dot={{
                  fill: colors.reportCharts.overallPerformance
                    .channelPerformance.ctr,
                  r: 4,
                }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cvr"
                stroke={
                  colors.reportCharts.overallPerformance.channelPerformance.cvr
                }
                strokeWidth={2.5}
                name="CVR (%)"
                dot={{
                  fill: colors.reportCharts.overallPerformance
                    .channelPerformance.cvr,
                  r: 4,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* SMS Delivery */}
      <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              SMS Delivery Performance
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Track SMS sent, delivered, and conversion metrics
            </p>
          </div>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={smsDeliveryData}
              margin={{ top: 20, right: 30, left: 24, bottom: 0 }}
              barCategoryGap="25%"
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                label={{
                  value: "Message Count",
                  angle: -90,
                  position: "insideLeft",
                }}
                width={90}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "transparent" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px", gap: "20px" }}
                iconType="circle"
              />
              <Bar
                dataKey="sent"
                fill={colors.reportCharts.overallPerformance.smsDelivery.sent}
                name="Sent"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                dataKey="delivered"
                fill={
                  colors.reportCharts.overallPerformance.smsDelivery.delivered
                }
                name="Delivered"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                dataKey="converted"
                fill={
                  colors.reportCharts.overallPerformance.smsDelivery.converted
                }
                name="Converted"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Time Series Trend */}
      <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Performance Trends Over Time
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Track key metrics across the selected time period
            </p>
          </div>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timeSeriesSnapshot.timeSeries}
              margin={{ top: 20, right: 30, left: 24, bottom: 0 }}
              barCategoryGap="25%"
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                label={{ value: "Users", angle: -90, position: "insideLeft" }}
                width={90}
                tickFormatter={(value) => formatNumber(value)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
                label={{
                  value: "Revenue",
                  angle: 90,
                  position: "insideRight",
                  offset: 10,
                }}
                width={80}
                tickFormatter={(value) => formatCurrencyAmount(value)}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "transparent" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px", gap: "20px" }}
                iconType="circle"
              />
              <Bar
                yAxisId="left"
                dataKey="reach"
                fill={
                  colors.reportCharts.overallPerformance.timeSeriesTrends.reach
                }
                name="Reach"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                yAxisId="left"
                dataKey="clicks"
                fill={
                  colors.reportCharts.overallPerformance.timeSeriesTrends.clicks
                }
                name="Clicks"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Bar
                yAxisId="left"
                dataKey="conversions"
                fill={
                  colors.reportCharts.overallPerformance.timeSeriesTrends
                    .conversions
                }
                name="Conversions"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke={
                  colors.reportCharts.overallPerformance.timeSeriesTrends
                    .revenue
                }
                strokeWidth={2.5}
                name="Revenue"
                dot={{
                  fill: colors.reportCharts.overallPerformance.timeSeriesTrends
                    .revenue,
                  r: 4,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
