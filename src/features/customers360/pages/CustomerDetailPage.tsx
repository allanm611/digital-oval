import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Calendar, X, Send, Edit, Trash2, Eye, Search } from "lucide-react";
import {
  BarChart,
  Bar,
  // PieChart,
  // Pie,
  // Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  // LineChart,
  // Line,
  // Legend,
} from "recharts";
import { colors, buttons } from "../../../shared/utils/tokens";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination from "../../../shared/components/ui/Pagination";
import Radio from "../../../shared/components/ui/Radio";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useToast } from "../../../contexts/ToastContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import CreateCommunicationModal from "../../../shared/components/CreateCommunicationModal";
import EditCustomerModal from "../components/EditCustomerModal";
import type { CustomerSubscriptionRecord } from "../types/customerSubscription";
import type { CustomerDetail } from "../types/customer";
import {
  convertSubscriptionToCustomerRow,
  formatDateTime,
  formatMsisdn,
  type CustomerRow,
} from "../utils/customerSubscriptionHelpers";
import type { CustomerSearchResultsResponse } from "../../reports-analytics/types/ReportsAPI";
// Note: CustomerWithContact is not imported as it's not used in this file
import { customerService } from "../services/customerServices";

// Extract types from API response
type CustomerSegment = CustomerSearchResultsResponse["segments"][number];
type CustomerOffer = CustomerSearchResultsResponse["offers"][number];
type CustomerEvent = CustomerSearchResultsResponse["events"][number];
type SubscribedList = CustomerSearchResultsResponse["subscribedLists"][number];
type OriginSource = "customers" | "reports";

// Custom Tooltip Component
type ChartTooltipEntry = {
  color?: string;
  name?: string;
  value?: number | string;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipEntry[];
};

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}
    >
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 text-sm text-gray-600"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-semibold text-gray-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// Using shared customer data from customerDataService - will be generated in component

const generateCustomerRelatedData = (customer: CustomerRow) => {
  // Convert customer ID to string safely for use in IDs
  const customerId =
    typeof customer.id === "string"
      ? customer.id
      : (customer.id || "0").toString();

  const segmentNames = [
    customer.segment,
    "High Value Customers",
    "Frequent Buyers",
    "Email Subscribers",
    "VIP Members",
  ];

  const segments: CustomerSegment[] = segmentNames.map((name, index) => {
    const baseDate = new Date(customer.lastInteractionDate || new Date());
    const addedDate = new Date(baseDate);
    addedDate.setDate(addedDate.getDate() - index * 15);

    const customerId =
      typeof customer.id === "string"
        ? customer.id
        : (customer.id || "0").toString();
    return {
      id: `SEG-${customerId.slice(-3)}-${index + 1}`,
      name,
      type: index < 2 ? "Dynamic" : "Static",
      addedDate: isNaN(addedDate.getTime())
        ? new Date().toISOString().split("T")[0]
        : addedDate.toISOString().split("T")[0],
    };
  });

  const offerNames = [
    "VIP Exclusive Offer",
    "Loyalty Reward",
    "Welcome Bonus",
    "Seasonal Discount",
    "Referral Bonus",
  ];

  const offerTypes = [
    "Discount",
    "Cashback",
    "Voucher",
    "Discount",
    "Cashback",
  ];
  const offerStatuses: Array<CustomerOffer["status"]> = [
    "Redeemed",
    "Active",
    "Redeemed",
    "Active",
    "Redeemed",
  ];

  const offers: CustomerOffer[] = offerNames.map((name, index) => {
    const baseDate = new Date(customer.lastInteractionDate || new Date());
    const redeemedDate = new Date(baseDate);
    redeemedDate.setDate(redeemedDate.getDate() - index * 20);

    const customerId =
      typeof customer.id === "string"
        ? customer.id
        : (customer.id || "0").toString();
    return {
      id: `OFF-${customerId.slice(-3)}-${index + 1}`,
      name,
      type: offerTypes[index],
      status: offerStatuses[index],
      redeemedDate: isNaN(redeemedDate.getTime())
        ? new Date().toISOString().split("T")[0]
        : redeemedDate.toISOString().split("T")[0],
      value: (index + 1) * 50,
    };
  });

  const events: CustomerEvent[] = [];
  const interactionDate = new Date(customer.lastInteractionDate);
  if (!isNaN(interactionDate.getTime())) {
    const baseDate = new Date(interactionDate);
    for (let i = 0; i < 15; i++) {
      const eventDate = new Date(baseDate);
      eventDate.setDate(eventDate.getDate() - i * 7);
      const channelIndex = i % 3;
      const channelType =
        channelIndex === 0 ? "email" : channelIndex === 1 ? "sms" : "push";

      if (channelType === "email") {
        const emailTitles = [
          "Welcome Email",
          "Newsletter",
          "Promotional Email",
          "Order Confirmation",
          "Shipping Update",
        ];
        const emailDescriptions = [
          "Welcome to our community",
          "Monthly updates and news",
          "Special offers just for you",
          "Your order has been confirmed",
          "Your order is on the way",
        ];
        const emailStatuses = [
          "Opened",
          "Clicked",
          "Opened",
          "Delivered",
          "Opened",
        ];

        events.push({
          id: `EVT-${customerId.slice(-3)}-E${i}`,
          type: "email",
          title: emailTitles[i % emailTitles.length],
          description: emailDescriptions[i % emailDescriptions.length],
          date: eventDate.toISOString(),
          status: emailStatuses[i % emailStatuses.length],
        });
      } else if (channelType === "sms") {
        const smsTitles = [
          "Transaction Update",
          "Promotional SMS",
          "Order Alert",
          "Payment Reminder",
          "Delivery Notification",
        ];
        const smsDescriptions = [
          "Your transaction has been processed",
          "Flash sale - 24 hours only",
          "Your order is ready",
          "Payment due soon",
          "Package delivered",
        ];
        const smsStatuses = ["Delivered", "Read", "Delivered", "Sent", "Read"];

        events.push({
          id: `EVT-${customerId.slice(-3)}-S${i}`,
          type: "sms",
          title: smsTitles[i % smsTitles.length],
          description: smsDescriptions[i % smsDescriptions.length],
          date: eventDate.toISOString(),
          status: smsStatuses[i % smsStatuses.length],
        });
      } else if (channelType === "push") {
        const pushTitles = [
          "New Products",
          "Cart Reminder",
          "Price Drop Alert",
          "New Arrivals",
          "Special Offer",
        ];
        const pushDescriptions = [
          "Check out our latest arrivals",
          "Items waiting in your cart",
          "Price reduced on favorites",
          "New collection available",
          "Limited time offer",
        ];
        const pushStatuses = ["Sent", "Opened", "Sent", "Opened", "Sent"];

        events.push({
          id: `EVT-${customerId.slice(-3)}-P${i}`,
          type: "push",
          title: pushTitles[i % pushTitles.length],
          description: pushDescriptions[i % pushDescriptions.length],
          date: eventDate.toISOString(),
          status: pushStatuses[i % pushStatuses.length],
        });
      }
    }
  }

  const listNames = [
    "Newsletter",
    "Promotions",
    "Product Updates",
    "Special Offers",
  ];

  const lists: SubscribedList[] = listNames.map((name, index) => {
    const baseDate = new Date(customer.lastInteractionDate);
    const subscribedDate = new Date(baseDate);
    subscribedDate.setDate(subscribedDate.getDate() - index * 30);

    return {
      id: `LIST-${customerId.slice(-3)}-${index + 1}`,
      name,
      subscribedDate: isNaN(subscribedDate.getTime())
        ? new Date().toISOString().split("T")[0]
        : subscribedDate.toISOString().split("T")[0],
      status:
        index < 3
          ? "active"
          : customer.engagementScore > 70
            ? "active"
            : "unsubscribed",
    };
  });

  // Generate dummy campaigns data
  const campaignNames = [
    "Summer Sale Campaign",
    "Flash Deal 2024",
    "Customer Loyalty Drive",
    "New Product Launch",
    "Seasonal Promotion",
  ];

  const campaignTypes = ["Multiple Target Group", "Champion Challenger", "A/B Testing", "Round Robin", "Multiple Level"];
  const campaignStatuses = ["Active", "Completed", "Active", "Completed", "Paused"];

  const campaigns: any[] = campaignNames.map((name, index) => {
    const baseDate = new Date(customer.lastInteractionDate || new Date());
    const participationDate = new Date(baseDate);
    participationDate.setDate(participationDate.getDate() - index * 25);

    return {
      id: `CAM-${customerId.slice(-3)}-${index + 1}`,
      name,
      type: campaignTypes[index],
      participationDate: isNaN(participationDate.getTime())
        ? new Date().toISOString().split("T")[0]
        : participationDate.toISOString().split("T")[0],
      status: campaignStatuses[index],
    };
  });

  // Generate dummy quicklists data
  const quicklistNames = [
    "VIP Test Group",
    "Internal Testing",
    "Beta Testers",
    "Premium Customers",
  ];

  const quicklists: any[] = quicklistNames.map((name, index) => {
    const baseDate = new Date(customer.lastInteractionDate || new Date());
    const createdDate = new Date(baseDate);
    createdDate.setDate(createdDate.getDate() - index * 40);

    return {
      id: `QL-${customerId.slice(-3)}-${index + 1}`,
      name,
      recordCount: Math.floor(Math.random() * 500) + 50,
      createdDate: isNaN(createdDate.getTime())
        ? new Date().toISOString().split("T")[0]
        : createdDate.toISOString().split("T")[0],
      status: "Completed",
    };
  });

  return { segments, offers, events, lists, campaigns, quicklists };
};

type TabType =
  | "overview"
  | "activity"
  | "engagement"
  | "segments"
  | "offers"
  | "quicklists"
  | "subscribedLists"
  | "campaigns"
  | "communications"
  | "purchases"
  | "loyalty"
  | "preferences"
  | "interactions"
  | "device";

export default function CustomerDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { customerId: customerIdFromParams } = useParams<{
    customerId: string;
  }>();

  const stateSource = location.state?.source as OriginSource | undefined;
  const [origin, setOrigin] = useState<OriginSource | undefined>(
    stateSource ?? "customers",
  );

  useEffect(() => {
    if (stateSource && stateSource !== origin) {
      setOrigin(stateSource);
    }
  }, [stateSource, origin]);

  // Get customer from state (initial navigation) or from URL params (on refresh)
  const customerFromState = location.state?.customer as CustomerRow | undefined;
  const subscriptionFromState = location.state?.subscription as
    | CustomerSubscriptionRecord
    | undefined;
  const customerIdFromUrl = customerIdFromParams;

  const derivedCustomerFromSubscription = useMemo(() => {
    if (!subscriptionFromState) return undefined;
    return convertSubscriptionToCustomerRow(subscriptionFromState);
  }, [subscriptionFromState]);

  const [selectedCustomer, setSelectedCustomer] = useState<
    CustomerRow | undefined
  >(customerFromState || derivedCustomerFromSubscription);
  const [selectedSubscription, setSelectedSubscription] = useState<
    Record<string, any> | undefined
  >(subscriptionFromState);

  useEffect(() => {
    if (customerFromState) {
      setSelectedCustomer(customerFromState);
      if (stateSource) {
        setOrigin(stateSource);
      }
    }
  }, [customerFromState, stateSource]);

  useEffect(() => {
    if (subscriptionFromState) {
      setSelectedSubscription(subscriptionFromState);
    }
  }, [subscriptionFromState]);

  useEffect(() => {
    if (!selectedCustomer && derivedCustomerFromSubscription) {
      setSelectedCustomer(derivedCustomerFromSubscription);
    }
  }, [selectedCustomer, derivedCustomerFromSubscription]);

  useEffect(() => {
    if (!selectedSubscription && selectedCustomer) {
      // API will fetch subscription details when customer ID is available
      // No need to lookup in local array anymore
    }
  }, [selectedCustomer, selectedSubscription]);

  // Fetch full customer details from API when customerId is available
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!customerIdFromUrl || customerFromState) return;

      try {
        const customerId = parseInt(customerIdFromUrl, 10);
        if (!isNaN(customerId)) {
          const response = await customerService.getCustomerById(customerId);
          if (response.success && response.data) {
            // Convert API response to CustomerSubscriptionRecord format
            const apiData = response.data;
            const convertedSubscription: CustomerSubscriptionRecord = {
              customerId:
                typeof apiData.subscriber_id === "string"
                  ? parseInt(apiData.subscriber_id, 10)
                  : apiData.subscriber_id || customerId,
              subscriptionId: customerId,
              firstName:
                apiData.attributes?.first_name ||
                apiData.first_name ||
                "Unknown",
              lastName:
                apiData.attributes?.last_name ||
                apiData.last_name ||
                "Customer",
              msisdn: apiData.msisdn,
              email: apiData.attributes?.email || apiData.email,
              city: apiData.attributes?.city,
              customerType: apiData.attributes?.customer_tier || "prepaid",
              tariff: apiData.attributes?.preferred_channel || "NORMAL_SMS",
              status:
                (apiData.attributes as any)?.subscriber_status || "active",
              simType: (apiData.attributes as any)?.kyc_verified
                ? "KYC Verified"
                : "Not Verified",
              activationDate: apiData.created_at,
            };

            setSelectedSubscription(convertedSubscription);

            // Also derive and set the customer from the subscription
            const derivedCustomer = convertSubscriptionToCustomerRow(
              convertedSubscription,
            );
            setSelectedCustomer(derivedCustomer);
          }
        }
      } catch (error) {
        console.error("Failed to fetch customer details:", error);
      }
    };

    fetchCustomerDetails();
  }, [customerIdFromUrl, customerFromState]);

  const customer = selectedCustomer || derivedCustomerFromSubscription;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [eventSearchTerm, setEventSearchTerm] = useState<string>("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [eventDateFrom, setEventDateFrom] = useState<string>("");
  const [eventDateTo, setEventDateTo] = useState<string>("");
  const [eventStatusFilter, setEventStatusFilter] = useState<string>("all");

  const [editingCustomer, setEditingCustomer] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCommunicateModalOpen, setIsCommunicateModalOpen] = useState(false);
  const [kpiSearchTerm, setKpiSearchTerm] = useState<string>("");
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [selectedKpiForModal, setSelectedKpiForModal] = useState<KpiData | null>(null);
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToast();

  // KPI Data Structure
  type KpiData = {
    id: string;
    name: string;
    category: string;
    value: string | number;
    unit?: string;
    description: string;
    trend?: "up" | "down" | "neutral";
    trendPercent?: number;
    detailedInfo: string | React.ReactNode;
  };

  const generateKpiData = (): KpiData[] => [
    // Revenue KPIs
    {
      id: "ltv",
      name: "Lifetime Value",
      category: "Revenue",
      value: "285,450.50",
      unit: "KES",
      description: "Total revenue generated from airtime and services",
      trend: "up",
      trendPercent: 12.5,
      detailedInfo: (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Revenue Breakdown:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>Voice Services: 98,450 KES</li>
              <li>SMS Services: 125,000 KES</li>
              <li>Data Bundles: 45,500 KES</li>
              <li>Value Added Services: 16,500 KES</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Projection:</p>
            <p className="text-sm text-gray-900">Customer is on trajectory for 15% growth over next quarter based on consistent usage patterns. Recommended for premium tier upgrade.</p>
          </div>
        </div>
      ),
    },
    {
      id: "monthly-revenue",
      name: "Monthly Revenue",
      category: "Revenue",
      value: "12,450",
      unit: "KES",
      description: "Average monthly spending on telecom services",
      trend: "up",
      trendPercent: 8,
      detailedInfo: (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Monthly Spending Pattern:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>Last Month: 12,450 KES</li>
              <li>Previous Month: 11,520 KES</li>
              <li>3-Month Average: 11,850 KES</li>
            </ul>
          </div>
          <p className="text-sm text-gray-900">Customer shows consistent monthly spending with growth trend. Primary usage: voice calls (62%) and SMS (28%).</p>
        </div>
      ),
    },
    {
      id: "arpu",
      name: "ARPU (Avg. Revenue Per User)",
      category: "Revenue",
      value: "385",
      unit: "KES/day",
      description: "Daily revenue per user on average",
      trend: "neutral",
      trendPercent: 0,
      detailedInfo: (
        <div className="space-y-3">
          <p className="text-sm text-gray-900">ARPU measures daily revenue efficiency. Current ARPU of 385 KES/day is stable compared to network average of 320 KES/day, indicating above-average usage.</p>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Usage Pattern:</p>
            <p className="text-sm text-gray-900">Highest usage weekdays (6-9 PM). Peak spending: Monday through Thursday. Weekend usage drops 18%.</p>
          </div>
        </div>
      ),
    },
    {
      id: "bundle-purchases",
      name: "Bundle Purchases",
      category: "Revenue",
      value: 42,
      description: "Number of data/voice bundles purchased",
      trend: "up",
      trendPercent: 15,
      detailedInfo: (
        <div className="space-y-3">
          <p className="text-sm text-gray-900">Customer has purchased 42 bundles in total. Recent bundle activity shows strong engagement.</p>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Recent Bundle History:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>Last 7 days: 3 bundles purchased</li>
              <li>Last 30 days: 8 bundles purchased</li>
              <li>Most Popular: 5GB Data Bundle (24% of purchases)</li>
              <li>Average Bundle Value: 4,550 KES</li>
            </ul>
          </div>
        </div>
      ),
    },

    // Usage KPIs
    {
      id: "voice-minutes",
      name: "Voice Minutes (Monthly)",
      category: "Usage",
      value: "3,450",
      unit: "mins",
      description: "Average monthly voice call minutes",
      trend: "up",
      trendPercent: 6,
      detailedInfo: (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Voice Usage Breakdown:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>On-Net Calls: 2,100 mins (61%)</li>
              <li>Off-Net Calls: 980 mins (28%)</li>
              <li>International: 370 mins (11%)</li>
            </ul>
          </div>
          <p className="text-sm text-gray-900">Usage shows steady engagement. Average call duration: 4.2 minutes. Peak usage period: 7-9 PM weekdays.</p>
        </div>
      ),
    },
    {
      id: "sms-count",
      name: "SMS Volume (Monthly)",
      category: "Usage",
      value: "8,230",
      unit: "msgs",
      description: "Total SMS messages sent/received monthly",
      trend: "up",
      trendPercent: 9,
      detailedInfo: (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">SMS Breakdown:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>Outbound SMS: 6,540 msgs</li>
              <li>Inbound SMS: 1,690 msgs</li>
              <li>Business SMS: 450 msgs (via API)</li>
            </ul>
          </div>
          <p className="text-sm text-gray-900">High SMS usage indicates customer relies on text messaging. Strong candidate for SMS-based services and promotions.</p>
        </div>
      ),
    },
    {
      id: "data-usage",
      name: "Data Usage (Monthly)",
      category: "Usage",
      value: "12.5",
      unit: "GB",
      description: "Average monthly data consumption",
      trend: "up",
      trendPercent: 18,
      detailedInfo: (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Data Usage Pattern:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>2G/3G/4G: 3.2 GB</li>
              <li>WiFi: 9.3 GB</li>
              <li>Peak Time Usage: 7-11 PM</li>
            </ul>
          </div>
          <p className="text-sm text-gray-900">Data usage trending up (18% MoM). Likely streaming/social media user. Recommend promoting high-capacity bundles.</p>
        </div>
      ),
    },
    {
      id: "active-days",
      name: "Active Days (Monthly)",
      category: "Usage",
      value: 28,
      unit: "days",
      description: "Days per month with network activity",
      trend: "up",
      trendPercent: 3,
      detailedInfo: (
        <div className="space-y-3">
          <p className="text-sm text-gray-900">Customer is highly active with 28 out of 30 days showing network engagement. Only 2 inactive days in current month.</p>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Activity Consistency:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>Average Daily Transactions: 8-12</li>
              <li>Longest Gap: 1 day (April 10)</li>
              <li>Reliability Score: 93% (Very High)</li>
            </ul>
          </div>
        </div>
      ),
    },

    // Engagement KPIs
    {
      id: "engagement-score",
      name: "Engagement Score",
      category: "Engagement",
      value: 88,
      unit: "/100",
      description: "Overall service engagement level",
      trend: "up",
      trendPercent: 8,
      detailedInfo: (
        <div className="space-y-3">
          <p className="text-sm text-gray-900">Excellent engagement score indicates highly active user with consistent service usage patterns.</p>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Engagement Factors:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>Daily Active Usage: 9/10</li>
              <li>Bundle Purchase Rate: 8/10</li>
              <li>Service Utilization: 9/10</li>
              <li>Retention Likelihood: 9/10</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "promo-response",
      name: "Promo Response Rate",
      category: "Engagement",
      value: "68.5%",
      description: "Percentage of promotions customer engages with",
      trend: "up",
      trendPercent: 12,
      detailedInfo: (
        <div className="space-y-3">
          <p className="text-sm text-gray-900">Customer shows strong response to promotional campaigns. 68.5% engagement rate is significantly above network average of 32%.</p>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Campaign Performance:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>Last Campaign: 85% engagement (Bonus Minutes Offer)</li>
              <li>Data Bundle Promo: 72% engagement</li>
              <li>SMS Promo: 58% engagement</li>
              <li>Best Time for Offers: 8-10 AM</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "customer-service",
      name: "Customer Service Contacts",
      category: "Engagement",
      value: 3,
      description: "Support interactions in last 30 days",
      trend: "down",
      trendPercent: -15,
      detailedInfo: (
        <div className="space-y-3">
          <p className="text-sm text-gray-900">Low support contact rate indicates satisfied customer with minimal issues. No complaints on file.</p>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Recent Contacts:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>Apr 8: Billing Inquiry (Resolved)</li>
              <li>Mar 25: Plan Upgrade Assistance (Completed)</li>
              <li>Mar 10: General Information (Resolved)</li>
              <li>Satisfaction Score: 4.8/5</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "days-since-contact",
      name: "Days Since Last Contact",
      category: "Engagement",
      value: 4,
      unit: "days",
      description: "Days since last customer service interaction",
      trend: "down",
      trendPercent: -25,
      detailedInfo: (
        <div className="space-y-3">
          <p className="text-sm text-gray-900">Last contact was on April 8, 2026. Customer reached out for billing inquiry which was promptly resolved.</p>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Contact Summary:</p>
            <p className="text-sm text-gray-900">Recent decrease in contact frequency suggests customer satisfaction. Most interactions are informational rather than complaint-based.</p>
          </div>
        </div>
      ),
    },

    // Retention KPIs
    {
      id: "churn-risk",
      name: "Churn Risk Score",
      category: "Retention",
      value: 12,
      unit: "/100",
      description: "Likelihood of switching providers (lower is better)",
      trend: "down",
      trendPercent: -8,
      detailedInfo: (
        <div className="space-y-3">
          <p className="text-sm text-gray-900">Very low churn risk. Customer shows strong loyalty indicators and consistent high engagement.</p>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Risk Factors Analysis:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>Revenue Trend: Positive ↑</li>
              <li>Usage Consistency: Excellent</li>
              <li>Customer Satisfaction: High (4.8/5)</li>
              <li>Account Issues: None</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "customer-lifetime",
      name: "Account Tenure",
      category: "Retention",
      value: "3 years",
      description: "How long customer has been registered",
      trend: "neutral",
      trendPercent: 0,
      detailedInfo: (
        <div className="space-y-3">
          <p className="text-sm text-gray-900">Long-standing customer since April 2023. Demonstrates loyalty and stable relationship.</p>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Account History:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>Activation Date: April 12, 2023</li>
              <li>Account Age: 3 years</li>
              <li>Account Status: Active & In Good Standing</li>
              <li>Previous Plan Changes: 2 (both upgrades)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "rfm-score",
      name: "RFM Score",
      category: "Retention",
      value: "953",
      description: "Recency, Frequency, Monetary combined score",
      trend: "up",
      trendPercent: 9,
      detailedInfo: (
        <div className="space-y-3">
          <p className="text-sm text-gray-900">Excellent RFM score of 953 indicates a highly valuable customer who is active, frequent user with high spending.</p>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">RFM Breakdown:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>Recency (R): 9/10 - Active recently</li>
              <li>Frequency (F): 5/10 - Multiple transactions daily</li>
              <li>Monetary (M): 9/10 - High spending level</li>
            </ul>
          </div>
          <p className="text-sm text-gray-900">Segment: Champions - Best customers. Prioritize for VIP programs and retention.</p>
        </div>
      ),
    },
    {
      id: "winback-potential",
      name: "Win-Back Potential",
      category: "Retention",
      value: "Low",
      description: "Possibility of re-engaging inactive customer",
      trend: "neutral",
      trendPercent: 0,
      detailedInfo: (
        <div className="space-y-3">
          <p className="text-sm text-gray-900">Win-back potential is LOW because customer is already highly engaged. Not an at-risk segment.</p>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Retention Strategy:</p>
            <ul className="text-sm text-gray-900 space-y-1 list-disc list-inside">
              <li>Focus: Upgrade and Cross-sell opportunities</li>
              <li>Recommended Action: VIP loyalty program enrollment</li>
              <li>Next Offer: Premium Data Bundles or International Roaming</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const kpiList = generateKpiData();
  
  const filteredKpis = kpiList.filter((kpi) =>
    kpi.name.toLowerCase().includes(kpiSearchTerm.toLowerCase()) ||
    kpi.category.toLowerCase().includes(kpiSearchTerm.toLowerCase())
  );

  // Pagination states for the 4 tables
  const [eventPage, setEventPage] = useState(1);
  const [segmentPage, setSegmentPage] = useState(1);
  const [offerPage, setOfferPage] = useState(1);
  const [listPage, setListPage] = useState(1);
  const [quicklistPage, setQuicklistPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (customer) {
      setActiveTab("overview");
      setEventPage(1);
      setSegmentPage(1);
      setOfferPage(1);
      setListPage(1);
      setQuicklistPage(1);
    }
  }, [customer]);

  // Reset pagination when event filters change
  useEffect(() => {
    setEventPage(1);
  }, [
    eventSearchTerm,
    eventTypeFilter,
    eventStatusFilter,
    eventDateFrom,
    eventDateTo,
  ]);

  const { segments, offers, events, lists, quicklists, campaigns } = useMemo(() => {
    if (!selectedSubscription)
      return {
        segments: [],
        offers: [],
        events: [],
        lists: [],
        quicklists: [],
        campaigns: [],
      };

    // Use actual data from API, fallback to dummy data if empty
    const data = selectedSubscription as Record<string, any>;

    // Get generated dummy data if available
    let dummyData: any = {
      segments: [],
      offers: [],
      events: [],
      lists: [],
      quicklists: [],
      campaigns: [],
    };

    if (customer) {
      const result = generateCustomerRelatedData(customer);
      dummyData = {
        segments: result.segments,
        offers: result.offers,
        events: result.events,
        lists: result.lists,
        quicklists: result.quicklists,
        campaigns: result.campaigns,
      };
    }

    // Use API data if available, fallback to dummy data if empty
    const segmentsData = Array.isArray(data.segments) && data.segments.length > 0
      ? data.segments
      : dummyData.segments;

    const offersData = Array.isArray(data.offers) && data.offers.length > 0
      ? data.offers
      : dummyData.offers;

    const quicklistsData = Array.isArray(data.quicklists) && data.quicklists.length > 0
      ? data.quicklists.map((ql: Record<string, any>) => ({
          id: `QL-${ql.id}`,
          name: ql.name,
          recordCount: ql.rows_imported,
          createdDate: ql.created_at,
          status: ql.processing_status,
        }))
      : dummyData.quicklists;

    return {
      segments: segmentsData,
      offers: offersData,
      events: dummyData.events,
      lists: dummyData.lists,
      quicklists: quicklistsData,
      campaigns: dummyData.campaigns,
    };
  }, [selectedSubscription, customer]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        eventSearchTerm.trim() === "" ||
        event.title.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
        (event.description &&
          event.description
            .toLowerCase()
            .includes(eventSearchTerm.toLowerCase()));
      const matchesType =
        eventTypeFilter === "all" || event.type === eventTypeFilter;
      const matchesStatus =
        eventStatusFilter === "all" || event.status === eventStatusFilter;

      let matchesDate = true;
      if (eventDateFrom) {
        const eventDate = new Date(event.date);
        const fromDate = new Date(eventDateFrom);
        matchesDate = matchesDate && eventDate >= fromDate;
      }
      if (eventDateTo) {
        const eventDate = new Date(event.date);
        const toDate = new Date(eventDateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && eventDate <= toDate;
      }

      return matchesSearch && matchesType && matchesStatus && matchesDate;
    });
  }, [
    events,
    eventSearchTerm,
    eventTypeFilter,
    eventStatusFilter,
    eventDateFrom,
    eventDateTo,
  ]);

  // Paginated data slices for all 4 tables
  const paginatedEvents = useMemo(() => {
    const startIdx = (eventPage - 1) * pageSize;
    return filteredEvents.slice(startIdx, startIdx + pageSize);
  }, [filteredEvents, eventPage]);

  const paginatedSegments = useMemo(() => {
    const startIdx = (segmentPage - 1) * pageSize;
    return segments.slice(startIdx, startIdx + pageSize);
  }, [segments, segmentPage]);

  const paginatedOffers = useMemo(() => {
    const startIdx = (offerPage - 1) * pageSize;
    return offers.slice(startIdx, startIdx + pageSize);
  }, [offers, offerPage]);

  const paginatedLists = useMemo(() => {
    const startIdx = (listPage - 1) * pageSize;
    return lists.slice(startIdx, startIdx + pageSize);
  }, [lists, listPage]);

  const paginatedQuicklists = useMemo(() => {
    const startIdx = (quicklistPage - 1) * pageSize;
    return quicklists.slice(startIdx, startIdx + pageSize);
  }, [quicklists, quicklistPage]);

  const eventDistributionData = useMemo(() => {
    const distribution: Record<string, number> = {};
    events.forEach((event) => {
      distribution[event.type] = (distribution[event.type] || 0) + 1;
    });
    return Object.entries(distribution).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
    }));
  }, [events]);

  const activityTimelineData = useMemo(() => {
    const monthlyActivity: Record<string, number> = {};
    events.forEach((event) => {
      const date = new Date(event.date);
      const monthKey = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
    });
    return Object.entries(monthlyActivity).map(([month, count]) => ({
      month,
      events: count,
    }));
  }, [events]);

  const statusDistributionData = useMemo(() => {
    const distribution: Record<string, number> = {};
    events.forEach((event) => {
      distribution[event.status] = (distribution[event.status] || 0) + 1;
    });
    return Object.entries(distribution).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [events]);

  const engagementByChannelData = useMemo(() => {
    const channelStats: Record<string, { total: number; engaged: number }> = {
      email: { total: 0, engaged: 0 },
      sms: { total: 0, engaged: 0 },
      push: { total: 0, engaged: 0 },
    };

    events.forEach((event) => {
      const channel = (event.type || "").toLowerCase();
      if (channelStats[channel]) {
        channelStats[channel].total++;
        // Count engaged events (opened, clicked, read)
        if (
          ["opened", "clicked", "read"].includes(
            (event.status || "").toLowerCase(),
          )
        ) {
          channelStats[channel].engaged++;
        }
      }
    });

    return Object.entries(channelStats).map(([channel, stats]) => ({
      name: channel.charAt(0).toUpperCase() + channel.slice(1),
      total: stats.total,
      engaged: stats.engaged,
      engagementRate:
        stats.total > 0 ? Math.round((stats.engaged / stats.total) * 100) : 0,
    }));
  }, [events]);

  const enrichedCustomer = customer as CustomerWithContact | undefined;
  const fallbackEmail = customer
    ? `${customer.name.toLowerCase().replace(/\s+/g, ".")}@example.com`
    : "customer@example.com";
  const email =
    selectedSubscription?.email ?? enrichedCustomer?.email ?? fallbackEmail;
  const phone = formatMsisdn(
    selectedSubscription?.msisdn ?? enrichedCustomer?.phone ?? null,
  );

  const overviewSections = useMemo(() => {
    if (!customer) {
      return [];
    }

    if (selectedSubscription) {
      return [
        {
          title: "Identity",
          items: [
            { label: "Customer ID", value: customer.id },
            {
              label: "First Name",
              value: selectedSubscription.first_name ?? "—",
            },
            {
              label: "Last Name",
              value: selectedSubscription.last_name ?? "—",
            },
            {
              label: "Gender",
              value: selectedSubscription.gender ?? "—",
            },
            {
              label: "Date of Birth",
              value: selectedSubscription.birth_date
                ? new Date(selectedSubscription.birth_date).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    },
                  )
                : "—",
            },
          ],
        },
        {
          title: "Contact Information",
          items: [
            {
              label: "MSISDN",
              value: formatMsisdn(selectedSubscription.msisdn),
            },
            {
              label: "Alternate MSISDN",
              value: Array.isArray(selectedSubscription.alternate_msisdns)
                ? selectedSubscription.alternate_msisdns.join(", ")
                : (selectedSubscription.alternate_msisdns ?? "—"),
            },
            { label: "Email", value: selectedSubscription.email ?? email },
            {
              label: "Alternate Email",
              value: selectedSubscription.alternate_email ?? "—",
            },
            {
              label: "Preferred Language",
              value: selectedSubscription.language_preference ?? "—",
            },
            {
              label: "Preferred Channel",
              value: selectedSubscription.preferred_channel ?? "—",
            },
          ],
        },
        {
          title: "Address Information",
          items: [
            { label: "City", value: selectedSubscription.city ?? "—" },
            { label: "Region", value: selectedSubscription.region ?? "—" },
            {
              label: "Postal Code",
              value: selectedSubscription.postal_code ?? "—",
            },
            {
              label: "Country",
              value: selectedSubscription.country_code ?? "—",
            },
            {
              label: "Physical Address",
              value: selectedSubscription.physical_address ?? "—",
            },
          ],
        },
        {
          title: "Account Details",
          items: [
            {
              label: "Customer Tier",
              value: selectedSubscription.customer_tier ?? "—",
            },
            {
              label: "Timezone",
              value: selectedSubscription.timezone ?? "—",
            },
            {
              label: "Activation Date",
              value: formatDateTime(selectedSubscription.created_at),
            },
            { label: "ICCID", value: selectedSubscription.iccid ?? "—" },
            { label: "IMSI", value: selectedSubscription.imsi ?? "—" },
          ],
        },
      ];
    }

    return [
      {
        title: "Customer Information",
        items: [
          { label: "Customer ID", value: customer.id },
          { label: "Name", value: customer.name },
          { label: "Email", value: email },
          { label: "Phone", value: phone },
          { label: "Location", value: customer.location },
          { label: "Segment", value: customer.segment },
          { label: "Preferred Channel", value: customer.preferredChannel },
        ],
      },
    ];
  }, [selectedSubscription, customer, email, phone]);

  if (!customer) {
    return (
      <div className="space-y-4">
        <div
          className={`${tw.rounded} border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900`}
        >
          {origin === "reports"
            ? "We couldn't load that customer profile. Please return to Customer Reports and run your search again."
            : "We couldn't load that customer profile. Please return to the Customers list and select a profile to view its insights."}
        </div>
      </div>
    );
  }

  const handleDeleteCustomer = async () => {
    if (!selectedSubscription) return;

    setIsDeleting(true);
    try {
      await customerService.deleteCustomer(selectedSubscription.customer_id);
      showSuccess("Success", "Customer deleted successfully");
      setDeleteConfirmOpen(false);
      navigate("/dashboard/customers", { replace: true });
    } catch (err) {
      showError("Error", "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCustomerUpdated = (
    updatedCustomer: CustomerSubscriptionRecord,
  ) => {
    setSelectedSubscription(updatedCustomer);
    setEditingCustomer(false);
    showSuccess("Success", "Customer updated successfully");
  };

  return (
    <PermissionGate permission="customer.read">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <BackButton
            fallbackTo="/dashboard/customers"
            showBreadcrumb={true}
            currentLabel="Customer Details"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCommunicateModalOpen(true)}
              className={`${tw.rounded} inline-flex items-center gap-2 px-4 py-2 text-sm font-medium`}
              style={{
                backgroundColor: color.primary.action,
                color: "white",
              }}
            >
              <Send className="h-4 w-4" />
              Send Communication
            </button>
            <PermissionGate permission="customer.update">
              <button
                onClick={() => setEditingCustomer(true)}
                className={`text-sm font-medium inline-flex items-center gap-2 flex-shrink-0 ${tw.rounded}`}
                style={{
                  backgroundColor: color.primary.action,
                  color: "white",
                  padding: "8px 16px",
                }}
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            </PermissionGate>
            <PermissionGate permission="customer.delete">
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className={`${tw.rounded} inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white`}
                style={{ backgroundColor: "#dc2626" }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {[
            { id: "overview", label: "Customer Information" },
            { id: "activity", label: "Events" },
            { id: "subscribedLists", label: "Subscribed Lists" },
            { id: "engagement", label: "Analytics" },
            { id: "segments", label: "Segments" },
            { id: "offers", label: "Offers" },
            { id: "quicklists", label: "QuickLists" },
            { id: "campaigns", label: "Campaigns" },
            { id: "communications", label: "Communications" },
            { id: "purchases", label: "Purchase History" },
            { id: "loyalty", label: "Loyalty & Rewards" },
            { id: "preferences", label: "Preferences" },
            { id: "interactions", label: "Interactions" },
            { id: "device", label: "Account & Device" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? "text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: color.primary.accent }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Customer Information Section */}
            <div
              className={`bg-white border border-gray-200 ${tw.rounded} overflow-hidden`}
            >
              <div className="p-6 space-y-6">
                {overviewSections.map((section) => (
                  <div key={section.title} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">
                        {section.title}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {section.items.map(({ label, value }) => (
                        <div
                          key={`${section.title}-${label}`}
                          className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                        >
                          <p className="text-xs uppercase text-gray-500">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900 break-words">
                            {value ?? "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!selectedSubscription && (
                  <p className="text-sm text-gray-500">
                    Detailed subscription data is unavailable for this record.
                  </p>
                )}
              </div>
            </div>

            {/* KPIs Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Key Performance Indicators
                </h3>
                
                {/* KPI Search Bar */}
                <div className="mb-6">
                  <SearchInput
                    placeholder="Search KPIs by name or category..."
                    value={kpiSearchTerm}
                    onChange={setKpiSearchTerm}
                  />
                </div>

                {/* KPIs Table */}
                {filteredKpis.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No KPIs found matching "{kpiSearchTerm}"
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      className="w-full text-sm"
                      style={{ borderCollapse: "separate", borderSpacing: "0 12px" }}
                    >
                      <thead
                        className="text-xs uppercase tracking-wide"
                        style={{ background: color.surface.tableHeader }}
                      >
                        <tr>
                          <th
                            className="px-6 py-3 text-left text-gray-900 font-semibold"
                          >
                            KPI Name
                          </th>
                          <th
                            className="px-6 py-3 text-left text-gray-900 font-semibold"
                          >
                            Category
                          </th>
                          <th
                            className="px-6 py-3 text-left text-gray-900 font-semibold"
                          >
                            Value
                          </th>
                          <th
                            className="px-6 py-3 text-left text-gray-900 font-semibold"
                          >
                            Trend
                          </th>
                          <th
                            className="px-6 py-3 text-left text-gray-900 font-semibold"
                          >
                            Description
                          </th>
                          <th
                            className="px-6 py-3 text-center text-gray-900 font-semibold"
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {kpiList.filter((kpi) =>
                          kpi.name.toLowerCase().includes(kpiSearchTerm.toLowerCase()) ||
                          kpi.category.toLowerCase().includes(kpiSearchTerm.toLowerCase())
                        ).map((kpi) => (
                          <tr
                            key={kpi.id}
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <td
                              className="rounded-l-md px-6 py-4 text-sm text-gray-900 font-semibold"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {kpi.name}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {kpi.category}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900 font-bold"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {kpi.value}
                              {kpi.unit && (
                                <span className="text-xs text-gray-500 ml-1">
                                  {kpi.unit}
                                </span>
                              )}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {kpi.trend && (
                                <span className="text-sm font-semibold">
                                  {kpi.trend === "up" && "↑"}
                                  {kpi.trend === "down" && "↓"}
                                  {kpi.trend === "neutral" && "→"}
                                  {kpi.trendPercent &&
                                    ` ${Math.abs(kpi.trendPercent)}%`}
                                </span>
                              )}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {kpi.description}
                            </td>
                            <td
                              className="rounded-r-md px-6 py-4 text-center"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              <button
                                onClick={() => {
                                  setSelectedKpiForModal(kpi);
                                  setIsKpiModalOpen(true);
                                }}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* KPI Details Modal */}
            {isKpiModalOpen && selectedKpiForModal && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
                style={{ zIndex: 9999 }}
                onClick={() => setIsKpiModalOpen(false)}
              >
                <div
                  className={`bg-white ${tw.rounded} w-full max-w-3xl shadow-xl`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedKpiForModal.name}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedKpiForModal.description}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsKpiModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-8 space-y-8">
                    {/* Value Card */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                      <p className="text-xs uppercase text-gray-600 font-semibold mb-3 tracking-wider">
                        Current Value
                      </p>
                      <div className="flex items-baseline justify-between">
                        <p className="text-4xl font-bold text-gray-900">
                          {selectedKpiForModal.value}
                        </p>
                        {selectedKpiForModal.unit && (
                          <span className="text-lg text-gray-700 font-semibold">
                            {selectedKpiForModal.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-xs uppercase text-gray-600 font-semibold mb-2">
                          Category
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          {selectedKpiForModal.category}
                        </p>
                      </div>
                      {selectedKpiForModal.trend && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <p className="text-xs uppercase text-gray-600 font-semibold mb-2">
                            Trend
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {selectedKpiForModal.trend === "up" && (
                              <span>↑ +{selectedKpiForModal.trendPercent}%</span>
                            )}
                            {selectedKpiForModal.trend === "down" && (
                              <span>↓ {selectedKpiForModal.trendPercent}%</span>
                            )}
                            {selectedKpiForModal.trend === "neutral" && (
                              <span>→ Stable</span>
                            )}
                          </p>
                        </div>
                      )}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <p className="text-xs uppercase text-gray-600 font-semibold mb-2">
                          Status
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          {selectedKpiForModal.trend === "up" && "Improving"}
                          {selectedKpiForModal.trend === "down" && "Declining"}
                          {selectedKpiForModal.trend === "neutral" && "Stable"}
                        </p>
                      </div>
                    </div>

                    {/* Detailed Information */}
                    <div className="border-t border-gray-200 pt-6">
                      <p className="text-sm uppercase text-gray-700 font-bold mb-4 tracking-wider">
                        Detailed Breakdown
                      </p>
                      <div className="bg-gray-50 rounded-lg p-6 text-gray-900 leading-relaxed">
                        {typeof selectedKpiForModal.detailedInfo === "string" ? (
                          <p className="text-sm">{selectedKpiForModal.detailedInfo}</p>
                        ) : (
                          <div className="text-sm space-y-3">
                            {selectedKpiForModal.detailedInfo}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <button
                      onClick={() => setIsKpiModalOpen(false)}
                      className="px-6 py-2.5 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded font-medium text-sm transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Customer Events
              </h3>
              <p className="text-sm text-gray-500">
                Track all customer interactions including emails, SMS, push
                notifications, purchases, and more
              </p>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 text-sm">No events recorded yet</p>
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      value={eventSearchTerm}
                      onChange={(value) => setEventSearchTerm(String(value))}
                      placeholder="Search events..."
                      className="pl-10 pr-4"
                      variant="medium"
                    />
                  </div>
                  <HeadlessSelect
                    value={eventTypeFilter}
                    onChange={(value) => setEventTypeFilter(value as string)}
                    options={[
                      { label: "All Channels", value: "all" },
                      { label: "Email", value: "email" },
                      { label: "SMS", value: "sms" },
                      { label: "Push", value: "push" },
                    ]}
                    placeholder="All Channels"
                    className="w-auto min-w-[150px]"
                  />
                  <HeadlessSelect
                    value={eventStatusFilter}
                    onChange={(value) => setEventStatusFilter(value as string)}
                    options={[
                      { label: "All Status", value: "all" },
                      { label: "Sent", value: "Sent" },
                      { label: "Delivered", value: "Delivered" },
                      { label: "Opened", value: "Opened" },
                      { label: "Clicked", value: "Clicked" },
                      { label: "Read", value: "Read" },
                    ]}
                    placeholder="All Status"
                    className="w-auto min-w-[150px]"
                  />
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <Input
                      type="date"
                      value={eventDateFrom}
                      onChange={(value) => setEventDateFrom(String(value))}
                      placeholder="From Date"
                      className="pl-10 pr-10"
                      variant="medium"
                      onClick={(e) =>
                        (e.currentTarget as HTMLInputElement).showPicker()
                      }
                    />
                    {eventDateFrom && (
                      <button
                        onClick={() => setEventDateFrom("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <Input
                      type="date"
                      value={eventDateTo}
                      onChange={(value) => setEventDateTo(String(value))}
                      placeholder="To Date"
                      className="pl-10 pr-10"
                      variant="medium"
                      onClick={(e) =>
                        (e.currentTarget as HTMLInputElement).showPicker()
                      }
                    />
                    {eventDateTo && (
                      <button
                        onClick={() => setEventDateTo("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div
                  className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
                >
                  <div className="hidden lg:block overflow-x-auto">
                    <table
                      className="w-full"
                      style={{
                        borderCollapse: "separate",
                        borderSpacing: "0 8px",
                      }}
                    >
                      <thead style={{ background: color.surface.tableHeader }}>
                        <tr className="text-left text-sm font-medium uppercase tracking-wider">
                          {[
                            "Event Type",
                            "Description",
                            "Channel",
                            "Status",
                          ].map((header) => (
                            <th
                              key={header}
                              className="px-6 py-3"
                              style={{ color: color.surface.tableHeaderText }}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedEvents.map((event) => {
                          return (
                            <tr key={event.id} className="transition-colors">
                              <td
                                className="px-6 py-4 font-semibold text-sm text-gray-900"
                                style={{
                                  backgroundColor: color.surface.tablebodybg,
                                }}
                              >
                                {event.title}
                              </td>
                              <td
                                className="px-6 py-4 text-sm text-gray-900"
                                style={{
                                  backgroundColor: color.surface.tablebodybg,
                                }}
                              >
                                {event.description}
                              </td>
                              <td
                                className="px-6 py-4 text-sm text-gray-900"
                                style={{
                                  backgroundColor: color.surface.tablebodybg,
                                }}
                              >
                                {event.type.toUpperCase()}
                              </td>
                              <td
                                className="px-6 py-4 text-sm text-gray-900"
                                style={{
                                  backgroundColor: color.surface.tablebodybg,
                                }}
                              >
                                {event.status}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <Pagination
                  currentPage={eventPage}
                  pageSize={pageSize}
                  totalItems={filteredEvents.length}
                  onPageChange={setEventPage}
                />
              </>
            )}
          </div>
        )}

        {activeTab === "engagement" && (
          <div>
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 text-sm">
                  No engagement data available
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Event Distribution by Channel - Bar Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Event Distribution by Channel
                  </h3>
                  {eventDistributionData.length === 0 ? (
                    <p className="text-gray-400 text-sm">No data available</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={eventDistributionData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                          />
                          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "transparent" }}
                          />
                          <Bar
                            dataKey="value"
                            fill={colors.reportCharts.palette.color1}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Activity Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Activity Timeline
                  </h3>
                  {activityTimelineData.length === 0 ? (
                    <p className="text-gray-400 text-sm">No data available</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityTimelineData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "transparent" }}
                          />
                          <Bar
                            dataKey="events"
                            fill={colors.reportCharts.palette.color2}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Status Distribution */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Status Distribution
                  </h3>
                  {statusDistributionData.length === 0 ? (
                    <p className="text-gray-400 text-sm">No data available</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusDistributionData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "transparent" }}
                          />
                          <Bar
                            dataKey="value"
                            fill={colors.reportCharts.palette.color3}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Engagement Rate by Channel */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Engagement Rate by Channel
                  </h3>
                  {engagementByChannelData.length === 0 ? (
                    <p className="text-gray-400 text-sm">No data available</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={engagementByChannelData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                            label={{
                              value: "Engagement Rate (%)",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "transparent" }}
                            formatter={(value?: number) =>
                              value ? `${value}%` : ""
                            }
                          />
                          <Bar
                            dataKey="engagementRate"
                            fill={colors.reportCharts.palette.color4}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "segments" && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Segments
              </h3>
              <p className="text-sm text-gray-500">
                View all segments this customer belongs to
              </p>
            </div>
            {segments.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 text-sm">No segments assigned</p>
              </div>
            ) : (
              <>
                <div
                  className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
                >
                  <div className="hidden lg:block overflow-x-auto">
                    <table
                      className="w-full"
                      style={{
                        borderCollapse: "separate",
                        borderSpacing: "0 8px",
                      }}
                    >
                      <thead style={{ background: color.surface.tableHeader }}>
                        <tr className="text-left text-sm font-medium uppercase tracking-wider">
                          {["Segment Name", "Type", "Added Date"].map(
                            (header) => (
                              <th
                                key={header}
                                className="px-6 py-3"
                                style={{ color: color.surface.tableHeaderText }}
                              >
                                {header}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedSegments.map((segment) => (
                          <tr key={segment.id} className="transition-colors">
                            <td
                              className="px-6 py-4 font-semibold text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {segment.name}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {segment.type}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {segment.addedDate ? (
                                <DateFormatter
                                  date={segment.addedDate}
                                  useLocale
                                  year="numeric"
                                  month="short"
                                  day="numeric"
                                />
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <Pagination
                  currentPage={segmentPage}
                  pageSize={pageSize}
                  totalItems={segments.length}
                  onPageChange={setSegmentPage}
                />
              </>
            )}
          </div>
        )}

        {activeTab === "offers" && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Offers
              </h3>
              <p className="text-sm text-gray-500">
                View all offers available or redeemed by this customer
              </p>
            </div>
            {offers.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 text-sm">No offers available</p>
              </div>
            ) : (
              <>
                <div
                  className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
                >
                  <div className="hidden lg:block overflow-x-auto">
                    <table
                      className="w-full"
                      style={{
                        borderCollapse: "separate",
                        borderSpacing: "0 8px",
                      }}
                    >
                      <thead style={{ background: color.surface.tableHeader }}>
                        <tr className="text-left text-sm font-medium uppercase tracking-wider">
                          {[
                            "Offer Name",
                            "Type",
                            "Status",
                            "Value",
                            "Redeemed Date",
                          ].map((header) => (
                            <th
                              key={header}
                              className="px-6 py-3"
                              style={{ color: color.surface.tableHeaderText }}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedOffers.map((offer) => (
                          <tr key={offer.id} className="transition-colors">
                            <td
                              className="px-6 py-4 font-semibold text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {offer.name}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {offer.type}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {offer.status}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              <CurrencyFormatter amount={offer.value} />
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {offer.redeemedDate ? (
                                <DateFormatter
                                  date={offer.redeemedDate}
                                  useLocale
                                  year="numeric"
                                  month="short"
                                  day="numeric"
                                />
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <Pagination
                  currentPage={offerPage}
                  pageSize={pageSize}
                  totalItems={offers.length}
                  onPageChange={setOfferPage}
                />
              </>
            )}
          </div>
        )}

        {activeTab === "quicklists" && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                QuickLists
              </h3>
              <p className="text-sm text-gray-500">
                View all QuickLists this customer is included in
              </p>
            </div>
            {quicklists.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 text-sm">No QuickLists found</p>
              </div>
            ) : (
              <>
                <div
                  className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
                >
                  <div className="hidden lg:block overflow-x-auto">
                    <table
                      className="w-full"
                      style={{
                        borderCollapse: "separate",
                        borderSpacing: "0 8px",
                      }}
                    >
                      <thead style={{ background: color.surface.tableHeader }}>
                        <tr className="text-left text-sm font-medium uppercase tracking-wider">
                          {[
                            "QuickList Name",
                            "Total Members",
                            "Created Date",
                            "Status",
                          ].map((header) => (
                            <th
                              key={header}
                              className="px-6 py-3"
                              style={{ color: color.surface.tableHeaderText }}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedQuicklists.map((quicklist: any) => (
                          <tr key={quicklist.id} className="transition-colors">
                            <td
                              className="px-6 py-4 font-semibold text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {quicklist.name}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {quicklist.recordCount || 0}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {quicklist.createdDate ? (
                                <DateFormatter
                                  date={quicklist.createdDate}
                                  useLocale
                                  year="numeric"
                                  month="short"
                                  day="numeric"
                                />
                              ) : (
                                "—"
                              )}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {quicklist.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <Pagination
                  currentPage={quicklistPage}
                  pageSize={pageSize}
                  totalItems={quicklists.length}
                  onPageChange={setQuicklistPage}
                />
              </>
            )}
          </div>
        )}

        {activeTab === "campaigns" && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Campaigns
              </h3>
              <p className="text-sm text-gray-500">
                View all campaigns this customer has participated in
              </p>
            </div>
            {campaigns.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 text-sm">No campaigns found</p>
              </div>
            ) : (
              <>
                <div
                  className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
                >
                  <div className="hidden lg:block overflow-x-auto">
                    <table
                      className="w-full"
                      style={{
                        borderCollapse: "separate",
                        borderSpacing: "0 8px",
                      }}
                    >
                      <thead style={{ background: color.surface.tableHeader }}>
                        <tr className="text-left text-sm font-medium uppercase tracking-wider">
                          {["Campaign Name", "Type", "Participation Date", "Status"].map(
                            (header) => (
                              <th
                                key={header}
                                className="px-6 py-3"
                                style={{ color: color.surface.tableHeaderText }}
                              >
                                {header}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((campaign: any) => (
                          <tr key={campaign.id} className="transition-colors">
                            <td
                              className="px-6 py-4 font-semibold text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {campaign.name}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {campaign.type}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {campaign.participationDate ? (
                                <DateFormatter
                                  date={campaign.participationDate}
                                  useLocale
                                  year="numeric"
                                  month="short"
                                  day="numeric"
                                />
                              ) : (
                                "—"
                              )}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {campaign.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "subscribedLists" && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Subscribed Lists
              </h3>
              <p className="text-sm text-gray-500">
                View all mailing lists and subscriptions for this customer
              </p>
            </div>

            {lists.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500 text-sm">No subscriptions found</p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div
                  className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
                >
                  <div className="hidden lg:block overflow-x-auto">
                    <table
                      className="w-full"
                      style={{
                        borderCollapse: "separate",
                        borderSpacing: "0 8px",
                      }}
                    >
                      <thead style={{ background: color.surface.tableHeader }}>
                        <tr className="text-left text-sm font-medium uppercase tracking-wider">
                          {["List Name", "Subscribed Date", "Status"].map(
                            (header) => (
                              <th
                                key={header}
                                className="px-6 py-3"
                                style={{ color: color.surface.tableHeaderText }}
                              >
                                {header}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLists.map((list) => (
                          <tr key={list.id} className="transition-colors">
                            <td
                              className="px-6 py-4 font-semibold text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {list.name}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {list.subscribedDate ? (
                                <DateFormatter
                                  date={list.subscribedDate}
                                  useLocale
                                  year="numeric"
                                  month="short"
                                  day="numeric"
                                />
                              ) : (
                                "—"
                              )}
                            </td>
                            <td
                              className="px-6 py-4 text-sm text-gray-900"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              {list.status === "active"
                                ? "Active"
                                : "Unsubscribed"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <Pagination
                  currentPage={listPage}
                  pageSize={pageSize}
                  totalItems={lists.length}
                  onPageChange={setListPage}
                />
              </>
            )}
          </div>
        )}

        {/* Communications Tab */}
        {activeTab === "communications" && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Communication History
              </h3>
              <p className="text-sm text-gray-500">
                View all communications sent to this customer across all
                channels
              </p>
            </div>

            <div
              className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
            >
              <div className="hidden lg:block overflow-x-auto">
                <table
                  className="w-full"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead style={{ background: color.surface.tableHeader }}>
                    <tr className="text-left text-sm font-medium uppercase tracking-wider">
                      {["Subject", "Channel", "Sent Date", "Status"].map(
                        (header) => (
                          <th
                            key={header}
                            className="px-6 py-3"
                            style={{ color: color.surface.tableHeaderText }}
                          >
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        id: "comm-1",
                        subject: "Welcome to our service",
                        channel: "Email",
                        date: "2026-04-08",
                        status: "Delivered",
                      },
                      {
                        id: "comm-2",
                        subject: "Your account activation",
                        channel: "SMS",
                        date: "2026-04-08",
                        status: "Opened",
                      },
                      {
                        id: "comm-3",
                        subject: "Special offer just for you",
                        channel: "Push",
                        date: "2026-04-07",
                        status: "Clicked",
                      },
                      {
                        id: "comm-4",
                        subject: "Weekly newsletter",
                        channel: "Email",
                        date: "2026-04-06",
                        status: "Delivered",
                      },
                    ].map((comm) => (
                      <tr key={comm.id} className="transition-colors">
                        <td
                          className="px-6 py-4 font-semibold text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          {comm.subject}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          {comm.channel}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <DateFormatter
                            date={comm.date}
                            useLocale
                            year="numeric"
                            month="short"
                            day="numeric"
                          />
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          {comm.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Purchase History Tab */}
        {activeTab === "purchases" && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Purchase History
              </h3>
              <p className="text-sm text-gray-500">
                View all transactions and purchase records for this customer
              </p>
            </div>

            <div
              className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
            >
              <div className="hidden lg:block overflow-x-auto">
                <table
                  className="w-full"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead style={{ background: color.surface.tableHeader }}>
                    <tr className="text-left text-sm font-medium uppercase tracking-wider">
                      {[
                        "Transaction ID",
                        "Product",
                        "Amount",
                        "Date",
                        "Status",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        id: "TXN-001",
                        product: "Premium Data Bundle",
                        amount: 50.0,
                        date: "2026-04-08",
                        status: "Completed",
                      },
                      {
                        id: "TXN-002",
                        product: "Voice Minutes",
                        amount: 25.0,
                        date: "2026-04-05",
                        status: "Completed",
                      },
                      {
                        id: "TXN-003",
                        product: "International Roaming",
                        amount: 75.0,
                        date: "2026-03-28",
                        status: "Completed",
                      },
                      {
                        id: "TXN-004",
                        product: "Monthly Plan",
                        amount: 100.0,
                        date: "2026-03-09",
                        status: "Completed",
                      },
                    ].map((purchase) => (
                      <tr key={purchase.id} className="transition-colors">
                        <td
                          className="px-6 py-4 font-semibold text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          {purchase.id}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          {purchase.product}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <CurrencyFormatter amount={purchase.amount} />
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <DateFormatter
                            date={purchase.date}
                            useLocale
                            year="numeric"
                            month="short"
                            day="numeric"
                          />
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          {purchase.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Loyalty & Rewards Tab */}
        {activeTab === "loyalty" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <p className="text-sm font-medium text-gray-600">
                  Total Points
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">12,450</p>
              </div>

              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <p className="text-sm font-medium text-gray-600">
                  Current Tier
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">Gold</p>
              </div>

              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <p className="text-sm font-medium text-gray-600">
                  Points Redeemed
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">3,200</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Redemption History
              </h3>
              <div
                className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
              >
                <div className="hidden lg:block overflow-x-auto">
                  <table
                    className="w-full"
                    style={{
                      borderCollapse: "separate",
                      borderSpacing: "0 8px",
                    }}
                  >
                    <thead style={{ background: color.surface.tableHeader }}>
                      <tr className="text-left text-sm font-medium uppercase tracking-wider">
                        {["Reward Name", "Points", "Redeemed Date"].map(
                          (header) => (
                            <th
                              key={header}
                              className="px-6 py-3"
                              style={{ color: color.surface.tableHeaderText }}
                            >
                              {header}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          id: "reward-1",
                          name: "Data Bonus 5GB",
                          points: 500,
                          date: "2026-04-05",
                        },
                        {
                          id: "reward-2",
                          name: "Free Minutes 100",
                          points: 300,
                          date: "2026-03-28",
                        },
                        {
                          id: "reward-3",
                          name: "Discount Voucher",
                          points: 400,
                          date: "2026-03-15",
                        },
                        {
                          id: "reward-4",
                          name: "Cashback 2000",
                          points: 2000,
                          date: "2026-03-09",
                        },
                      ].map((reward) => (
                        <tr key={reward.id} className="transition-colors">
                          <td
                            className="px-6 py-4 font-semibold text-sm text-gray-900"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {reward.name}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-900"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            {reward.points.toLocaleString()}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-900"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <DateFormatter
                              date={reward.date}
                              useLocale
                              year="numeric"
                              month="short"
                              day="numeric"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div
            className={`bg-white border border-gray-200 ${tw.rounded} overflow-hidden`}
          >
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Channel Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Email Preference */}
                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <div className="flex items-center gap-3">
                      <Radio
                        name="email_preference"
                        value="enabled"
                        checked={true}
                        onChange={() => {}}
                      />
                      <label className="flex-1 cursor-pointer">
                        <p className="text-xs uppercase text-gray-500 mb-1">
                          Email
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          Enabled
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* SMS Preference */}
                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <div className="flex items-center gap-3">
                      <Radio
                        name="sms_preference"
                        value="enabled"
                        checked={true}
                        onChange={() => {}}
                      />
                      <label className="flex-1 cursor-pointer">
                        <p className="text-xs uppercase text-gray-500 mb-1">
                          SMS
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          Enabled
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Push Preference */}
                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <div className="flex items-center gap-3">
                      <Radio
                        name="push_preference"
                        value="enabled"
                        checked={false}
                        onChange={() => {}}
                      />
                      <label className="flex-1 cursor-pointer">
                        <p className="text-xs uppercase text-gray-500 mb-1">
                          Push
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          Disabled
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Language Preference */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Language Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md">
                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <p className="text-xs uppercase text-gray-500 mb-2">
                      Preferred Language
                    </p>
                    <HeadlessSelect
                      value="en"
                      onChange={() => {}}
                      options={[
                        { label: "English", value: "en" },
                        { label: "Spanish", value: "es" },
                        { label: "French", value: "fr" },
                      ]}
                      placeholder="Select language"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactions Tab */}
        {activeTab === "interactions" && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Interactions
              </h3>
              <p className="text-sm text-gray-500">
                View support tickets, call logs, and other customer interactions
              </p>
            </div>

            <div
              className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
            >
              <div className="hidden lg:block overflow-x-auto">
                <table
                  className="w-full"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead style={{ background: color.surface.tableHeader }}>
                    <tr className="text-left text-sm font-medium uppercase tracking-wider">
                      {["Ticket ID", "Type", "Subject", "Status", "Date"].map(
                        (header) => (
                          <th
                            key={header}
                            className="px-6 py-3"
                            style={{ color: color.surface.tableHeaderText }}
                          >
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        id: "TKT-1001",
                        type: "Support",
                        subject: "Billing inquiry",
                        status: "Resolved",
                        date: "2026-04-06",
                      },
                      {
                        id: "TKT-1002",
                        type: "Technical",
                        subject: "Network connectivity issue",
                        status: "In Progress",
                        date: "2026-04-08",
                      },
                      {
                        id: "TKT-1003",
                        type: "Complaint",
                        subject: "Service quality",
                        status: "Resolved",
                        date: "2026-03-30",
                      },
                      {
                        id: "TKT-1004",
                        type: "Support",
                        subject: "Account verification",
                        status: "Resolved",
                        date: "2026-03-25",
                      },
                    ].map((interaction) => (
                      <tr key={interaction.id} className="transition-colors">
                        <td
                          className="px-6 py-4 font-semibold text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          {interaction.id}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          {interaction.type}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          {interaction.subject}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          {interaction.status}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-900"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <DateFormatter
                            date={interaction.date}
                            useLocale
                            year="numeric"
                            month="short"
                            day="numeric"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Account & Device Tab */}
        {activeTab === "device" && (
          <div
            className={`bg-white border border-gray-200 ${tw.rounded} overflow-hidden`}
          >
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Account Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <p className="text-xs uppercase text-gray-500 mb-1">
                      Status
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      Active
                    </p>
                  </div>

                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <p className="text-xs uppercase text-gray-500 mb-1">
                      Account Created
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedSubscription &&
                      (selectedSubscription as Record<string, any>)?.created_at
                        ? new Date(
                            (selectedSubscription as Record<string, any>)
                              .created_at,
                          ).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>

                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <p className="text-xs uppercase text-gray-500 mb-1">
                      Last Login
                    </p>
                    <p className="text-sm font-semibold text-gray-900">—</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Device Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <p className="text-xs uppercase text-gray-500 mb-1">
                      Primary Device
                    </p>
                    <p className="text-sm font-semibold text-gray-900">—</p>
                  </div>

                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <p className="text-xs uppercase text-gray-500 mb-1">
                      OS Version
                    </p>
                    <p className="text-sm font-semibold text-gray-900">—</p>
                  </div>

                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <p className="text-xs uppercase text-gray-500 mb-1">
                      App Version
                    </p>
                    <p className="text-sm font-semibold text-gray-900">—</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Verification Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <p className="text-xs uppercase text-gray-500 mb-2">
                      Email Verified
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  </div>

                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <p className="text-xs uppercase text-gray-500 mb-2">
                      Phone Verified
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Not Verified
                    </span>
                  </div>

                  <div
                    className={`${tw.rounded} border border-gray-100 bg-gray-50 px-4 py-3`}
                  >
                    <p className="text-xs uppercase text-gray-500 mb-2">
                      KYC Verified
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Not Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Communication Modal */}
        {isCommunicateModalOpen && selectedSubscription && (
          <CreateCommunicationModal
            isOpen={isCommunicateModalOpen}
            onClose={() => setIsCommunicateModalOpen(false)}
            customerRecord={selectedSubscription}
            onSuccess={(result) => {
              showSuccess(
                "Success",
                `Communication sent successfully! ${result.total_messages_sent} messages sent.`,
              );
              setIsCommunicateModalOpen(false);
            }}
          />
        )}

        {/* Edit Customer Modal */}
        {editingCustomer && selectedSubscription && (
          <EditCustomerModal
            isOpen={editingCustomer}
            onClose={() => setEditingCustomer(false)}
            customer={selectedSubscription}
            onCustomerUpdated={handleCustomerUpdated}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteConfirmOpen}
          title="Delete Customer"
          description="This customer and all their data will be permanently deleted. This action cannot be undone."
          itemName={`${selectedSubscription?.first_name} ${selectedSubscription?.last_name}`}
          onConfirm={handleDeleteCustomer}
          onClose={() => setDeleteConfirmOpen(false)}
          isLoading={isDeleting}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    </PermissionGate>
  );
}
