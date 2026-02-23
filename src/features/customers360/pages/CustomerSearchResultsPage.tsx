import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  FileText,
  Activity,
  BarChart3,
  Megaphone,
  Calendar,
  X,
  List,
} from "lucide-react";
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
import { colors } from "../../../shared/utils/tokens";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Pagination from "../../../shared/components/ui/Pagination";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import { PermissionGate } from "../../auth/components/PermissionGate";
import type {
  CustomerRow,
  CustomerSearchResultsResponse,
} from "../../reports-analytics/types/ReportsAPI";
import type { CustomerWithContact } from "../../reports-analytics/types/ReportsAPI";
import type { CustomerSubscriptionRecord } from "../types/customerSubscription";
import {
  convertSubscriptionToCustomerRow,
  formatDateTime,
  formatMsisdn,
} from "../utils/customerSubscriptionHelpers";
import { customerSubscriptions } from "../utils/customerDataService";
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

// Using shared customer data from customerDataService
const excelCustomerRows: CustomerRow[] = customerSubscriptions.map(
  convertSubscriptionToCustomerRow,
);
const subscriptionLookup: Record<string, CustomerSubscriptionRecord> = {};
excelCustomerRows.forEach((row, index) => {
  subscriptionLookup[row.id] = customerSubscriptions[index];
});

const generateCustomerRelatedData = (customer: CustomerRow) => {
  const segmentNames = [
    customer.segment,
    "High Value Customers",
    "Frequent Buyers",
    "Email Subscribers",
    "VIP Members",
  ];

  const segments: CustomerSegment[] = segmentNames.map((name, index) => {
    const baseDate = new Date(customer.lastInteractionDate);
    const addedDate = new Date(baseDate);
    addedDate.setDate(addedDate.getDate() - index * 15);

    return {
      id: `SEG-${customer.id.slice(-3)}-${index + 1}`,
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
    const baseDate = new Date(customer.lastInteractionDate);
    const redeemedDate = new Date(baseDate);
    redeemedDate.setDate(redeemedDate.getDate() - index * 20);

    return {
      id: `OFF-${customer.id.slice(-3)}-${index + 1}`,
      name,
      type: offerTypes[index],
      status: offerStatuses[index],
      redeemedDate: isNaN(redeemedDate.getTime())
        ? new Date().toISOString().split("T")[0]
        : redeemedDate.toISOString().split("T")[0],
      value: Math.round(customer.aov * (0.1 + index * 0.05)),
    };
  });

  const events: CustomerEvent[] = [];
  const interactionDate = new Date(customer.lastInteractionDate);
  if (!isNaN(interactionDate.getTime())) {
    const baseDate = new Date(interactionDate);
    // Generate more events (15 total) to ensure all channels are well represented
    for (let i = 0; i < 15; i++) {
      const eventDate = new Date(baseDate);
      eventDate.setDate(eventDate.getDate() - i * 7);

      // Ensure we have events across all channels - distribute evenly
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
          id: `EVT-${customer.id.slice(-3)}-E${i}`,
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
          id: `EVT-${customer.id.slice(-3)}-S${i}`,
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
          id: `EVT-${customer.id.slice(-3)}-P${i}`,
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
    subscribedDate.setDate(subscribedDate.getDate() - index * 30); // Spread dates

    return {
      id: `LIST-${customer.id.slice(-3)}-${index + 1}`,
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

  return { segments, offers, events, lists };
};

type TabType =
  | "overview"
  | "activity"
  | "engagement"
  | "marketing"
  | "subscribedLists";

export default function CustomerSearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { customerId: customerIdFromParams } = useParams<{ customerId: string }>();

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

  const customerFromUrl = useMemo(() => {
    if (!customerIdFromUrl) return undefined;
    return excelCustomerRows.find(
      (customer) => customer.id === customerIdFromUrl,
    );
  }, [customerIdFromUrl]);

  const subscriptionFromDataset = useMemo(() => {
    if (subscriptionFromState) {
      return subscriptionFromState;
    }
    if (customerIdFromUrl) {
      const numericId = parseInt(customerIdFromUrl, 10);
      return customerSubscriptions.find(
        (record) =>
          record.customerId?.toString() === numericId.toString(),
      );
    }
    return undefined;
  }, [subscriptionFromState, customerIdFromUrl]);

  const derivedCustomerFromSubscription = useMemo(() => {
    if (!subscriptionFromDataset) return undefined;
    return convertSubscriptionToCustomerRow(subscriptionFromDataset);
  }, [subscriptionFromDataset]);

  const [selectedCustomer, setSelectedCustomer] = useState<
    CustomerRow | undefined
  >(customerFromState || customerFromUrl || derivedCustomerFromSubscription);
  const [selectedSubscription, setSelectedSubscription] = useState<
    CustomerSubscriptionRecord | undefined
  >(subscriptionFromState || subscriptionFromDataset);

  useEffect(() => {
    if (customerFromUrl) {
      setSelectedCustomer(customerFromUrl);
    }
  }, [customerFromUrl]);

  useEffect(() => {
    if (customerFromState) {
      setSelectedCustomer(customerFromState);
      if (stateSource) {
        setOrigin(stateSource);
      }
    }
  }, [customerFromState, stateSource]);

  useEffect(() => {
    if (subscriptionFromDataset) {
      setSelectedSubscription(subscriptionFromDataset);
    }
  }, [subscriptionFromDataset]);

  useEffect(() => {
    if (!selectedCustomer && derivedCustomerFromSubscription) {
      setSelectedCustomer(derivedCustomerFromSubscription);
    }
  }, [selectedCustomer, derivedCustomerFromSubscription]);

  useEffect(() => {
    if (!selectedSubscription && selectedCustomer) {
      const inferred = subscriptionLookup[selectedCustomer.id];
      if (inferred) {
        setSelectedSubscription(inferred);
      }
    }
  }, [selectedCustomer, selectedSubscription]);

  // Fetch full customer details from API when customerId is available
  useEffect(() => {
    if (customerIdFromUrl && !selectedSubscription) {
      const fetchCustomerDetails = async () => {
        try {
          const customerId = parseInt(customerIdFromUrl, 10);
          if (!isNaN(customerId)) {
            const response = await customerService.getCustomerById(customerId);
            if (response.success && response.data) {
              // Convert API response to subscription format
              const apiCustomer = response.data;
              const convertedSubscription: CustomerSubscriptionRecord = {
                customerId: customerId,
                subscriptionId: (apiCustomer as any).subscriber_id || customerId,
                firstName: apiCustomer.first_name || "Unknown",
                lastName: apiCustomer.last_name || "Customer",
                msisdn: apiCustomer.msisdn,
                email: apiCustomer.email,
                alternateEmail: (apiCustomer as any).alternate_email,
                gender: apiCustomer.gender,
                birthDate: apiCustomer.date_of_birth,
                city: apiCustomer.city,
                region: (apiCustomer as any).region,
                postalCode: (apiCustomer as any).postal_code,
                countryCode: (apiCustomer as any).country_code,
                physicalAddress: (apiCustomer as any).physical_address,
                customerType: apiCustomer.subscriber_type || "prepaid",
                preferredChannel: apiCustomer.preferred_channel,
                preferredLanguage: (apiCustomer as any).language_preference,
                customerTier: (apiCustomer as any).customer_tier,
                timezone: (apiCustomer as any).timezone,
                status: apiCustomer.subscriber_status || "active",
                activationDate: apiCustomer.created_at,
                alternatemsisdns: (apiCustomer as any).alternate_msisdns?.join(", "),
                iccid: (apiCustomer as any).iccid,
                imsi: (apiCustomer as any).imsi,
              };
              setSelectedSubscription(convertedSubscription);
            }
          }
        } catch (error) {
          console.error("Failed to fetch customer details:", error);
        }
      };
      fetchCustomerDetails();
    }
  }, [customerIdFromUrl, selectedSubscription]);

  const customer = selectedCustomer || derivedCustomerFromSubscription;

  const handleBackNavigation = () => {
    navigate(-1);
  };

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [eventSearchTerm, setEventSearchTerm] = useState<string>("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [eventDateFrom, setEventDateFrom] = useState<string>("");
  const [eventDateTo, setEventDateTo] = useState<string>("");
  const [eventStatusFilter, setEventStatusFilter] = useState<string>("all");

  // Pagination states for the 4 tables
  const [eventPage, setEventPage] = useState(1);
  const [segmentPage, setSegmentPage] = useState(1);
  const [offerPage, setOfferPage] = useState(1);
  const [listPage, setListPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (customer) {
      setActiveTab("overview");
      setEventPage(1);
      setSegmentPage(1);
      setOfferPage(1);
      setListPage(1);
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

  const { segments, offers, events, lists } = useMemo(() => {
    if (!customer) return { segments: [], offers: [], events: [], lists: [] };
    return generateCustomerRelatedData(customer);
  }, [customer]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        eventSearchTerm.trim() === "" ||
        event.title.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(eventSearchTerm.toLowerCase());
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
      const channel = event.type.toLowerCase();
      if (channelStats[channel]) {
        channelStats[channel].total++;
        // Count engaged events (opened, clicked, read)
        if (
          ["opened", "clicked", "read"].includes(event.status.toLowerCase())
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
              value: selectedSubscription.firstName ?? "—",
            },
            { label: "Last Name", value: selectedSubscription.lastName ?? "—" },
            {
              label: "Gender",
              value: selectedSubscription.gender ?? "—",
            },
            {
              label: "Date of Birth",
              value: selectedSubscription.birthDate
                ? selectedSubscription.birthDate.split(" ")[0]
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
              value: selectedSubscription.alternatemsisdns ?? "—",
            },
            { label: "Email", value: selectedSubscription.email ?? email },
            {
              label: "Alternate Email",
              value: selectedSubscription.alternateEmail ?? "—",
            },
            {
              label: "Preferred Language",
              value: selectedSubscription.preferredLanguage ?? "—",
            },
            {
              label: "Preferred Channel",
              value: selectedSubscription.preferredChannel ?? "—",
            },
          ],
        },
        {
          title: "Address Information",
          items: [
            { label: "City", value: selectedSubscription.city ?? "—" },
            { label: "Region", value: selectedSubscription.region ?? "—" },
            { label: "Postal Code", value: selectedSubscription.postalCode ?? "—" },
            { label: "Country", value: selectedSubscription.countryCode ?? "—" },
            {
              label: "Physical Address",
              value: selectedSubscription.physicalAddress ?? "—",
            },
          ],
        },
        {
          title: "Account Details",
          items: [
            {
              label: "Customer Tier",
              value: selectedSubscription.customerTier ?? "—",
            },
            {
              label: "Timezone",
              value: selectedSubscription.timezone ?? "—",
            },
            {
              label: "Activation Date",
              value: formatDateTime(selectedSubscription.activationDate),
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
        {origin && (
          <button
            onClick={handleBackNavigation}
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            <ArrowLeft className="w-4 h-4" />
            {origin === "reports"
              ? "Go to Customer Reports"
              : "Go to Customers"}
          </button>
        )}
      </div>
    );
  }

  return (
    <PermissionGate permission="customer.read">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          {origin && (
            <button
              onClick={handleBackNavigation}
              className={`inline-flex items-center justify-center ${tw.rounded} border border-gray-200 p-2 text-gray-600 hover:text-gray-900 transition-colors`}
              aria-label={
                origin === "customers"
                  ? "Back to customers"
                  : "Back to customer reports"
              }
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
              {customer.name}
            </h1>
            <p className={`${tw.textSecondary} text-sm mt-1 font-mono`}>
              {customer.id}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { id: "overview", label: "Customer Information", icon: FileText },
            { id: "activity", label: "Events", icon: Activity },
            { id: "subscribedLists", label: "Subscribed Lists", icon: List },
            { id: "engagement", label: "Analytics", icon: BarChart3 },
            { id: "marketing", label: "Segments & Offers", icon: Megaphone },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 relative ${
                activeTab === tab.id
                  ? "text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="w-4 h-4" />
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

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={eventSearchTerm}
                  onChange={(e) => setEventSearchTerm(e.target.value)}
                  placeholder="Search events..."
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent`}
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
                <input
                  type="date"
                  value={eventDateFrom}
                  onChange={(e) => setEventDateFrom(e.target.value)}
                  placeholder="From Date"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer`}
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
                <input
                  type="date"
                  value={eventDateTo}
                  onChange={(e) => setEventDateTo(e.target.value)}
                  placeholder="To Date"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer`}
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
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead style={{ background: color.surface.tableHeader }}>
                    <tr className="text-left text-sm font-medium uppercase tracking-wider">
                      {["Event Type", "Description", "Channel", "Status"].map(
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
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          No events found
                        </td>
                      </tr>
                    ) : (
                      paginatedEvents.map((event) => {
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
                      })
                    )}
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
          </div>
        )}

        {activeTab === "engagement" && (
          <div>
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
          </div>
        )}

        {activeTab === "marketing" && (
          <div className="space-y-6">
            {/* Segments Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Segments
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
                      {segments.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-6 py-10 text-center text-sm text-gray-500"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            No segments assigned
                          </td>
                        </tr>
                      ) : (
                        paginatedSegments.map((segment) => (
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
                        ))
                      )}
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
            </div>

            {/* Offers Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Offers
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
                      {offers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-10 text-center text-sm text-gray-500"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            No offers available
                          </td>
                        </tr>
                      ) : (
                        paginatedOffers.map((offer) => (
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
                        ))
                      )}
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
            </div>
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

            {/* Table */}
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
                    {lists.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          No subscriptions found
                        </td>
                      </tr>
                    ) : (
                      paginatedLists.map((list) => (
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
                      ))
                    )}
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
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
