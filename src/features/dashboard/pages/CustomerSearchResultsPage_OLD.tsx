import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Mail, MessageSquare, ArrowLeft } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { colors } from "../../../shared/utils/tokens";
import { CustomerRow } from "./CustomerProfileReportsPage";

import { tw } from '../../../shared/utils/utils';
// Types for customer search data
type CustomerSegment = {
  id: string;
  name: string;
  type: string;
  addedDate: string;
};

type CustomerOffer = {
  id: string;
  name: string;
  type: string;
  status: string;
  redeemedDate: string;
  value: number;
};

type CustomerEvent = {
  id: string;
  type: "sms" | "email" | "push" | "other";
  title: string;
  description: string;
  date: string;
  status: string;
};

type SubscribedList = {
  id: string;
  name: string;
  subscribedDate: string;
  status: "active" | "unsubscribed";
};

// Generate realistic related data based on customer
const generateCustomerRelatedData = (customer: CustomerRow) => {
  // Generate segments based on customer segment
  const segments: CustomerSegment[] = [
    {
      id: `SEG-${customer.id.slice(-3)}`,
      name: customer.segment,
      type:
        customer.segment === "Champions" || customer.segment === "Loyalists"
          ? "Dynamic"
          : "Static",
      addedDate: (() => {
        const date = new Date(customer.lastInteractionDate);
        return isNaN(date.getTime())
          ? new Date().toISOString().split("T")[0]
          : date.toISOString().split("T")[0];
      })(),
    },
  ];

  // Generate offers based on customer value
  const offers: CustomerOffer[] = [];
  if (customer.lifetimeValue > 2000) {
    offers.push({
      id: `OFF-${customer.id.slice(-3)}-1`,
      name: "VIP Exclusive Offer",
      type: "Discount",
      status: "Redeemed",
      redeemedDate: (() => {
        const date = new Date(customer.lastInteractionDate);
        return isNaN(date.getTime())
          ? new Date().toISOString().split("T")[0]
          : date.toISOString().split("T")[0];
      })(),
      value: Math.round(customer.aov * 0.2),
    });
  }
  if (customer.orders > 5) {
    offers.push({
      id: `OFF-${customer.id.slice(-3)}-2`,
      name: "Loyalty Reward",
      type: "Cashback",
      status: "Active",
      redeemedDate: (() => {
        const date = new Date(customer.lastInteractionDate);
        return isNaN(date.getTime())
          ? new Date().toISOString().split("T")[0]
          : date.toISOString().split("T")[0];
      })(),
      value: Math.round(customer.aov * 0.1),
    });
  }

  // Generate events based on customer activity - across MULTIPLE channels
  const events: CustomerEvent[] = [];

  // Parse lastInteractionDate (it's in YYYY-MM-DD format)
  const interactionDate = new Date(customer.lastInteractionDate);
  // Only proceed if date is valid
  if (!isNaN(interactionDate.getTime())) {
    // Generate multiple events across different channels and dates
    const baseDate = new Date(interactionDate);

    // Create events for the past 3 months across multiple channels
    for (let i = 0; i < 8; i++) {
      const eventDate = new Date(baseDate);
      eventDate.setDate(eventDate.getDate() - i * 10); // Events every ~10 days

      // Determine channel type - rotate through channels to create diversity
      const channelTypes: Array<"email" | "sms" | "push" | "other"> = [
        "email",
        "sms",
        "push",
      ];
      const channelType = channelTypes[i % channelTypes.length];

      // Create event based on channel type
      if (channelType === "email") {
        events.push({
          id: `EVT-${customer.id.slice(-3)}-E${i}`,
          type: "email",
          title:
            i === 0
              ? "Welcome Email"
              : i % 3 === 0
              ? "Newsletter"
              : "Promotional Email",
          description:
            i === 0
              ? "Welcome to our community"
              : i % 3 === 0
              ? "Monthly updates and news"
              : "Special offers just for you",
          date: eventDate.toISOString(),
          status: i % 2 === 0 ? "Opened" : "Clicked",
        });
      } else if (channelType === "sms") {
        events.push({
          id: `EVT-${customer.id.slice(-3)}-S${i}`,
          type: "sms",
          title: i % 2 === 0 ? "Order Update" : "Promotional SMS",
          description:
            i % 2 === 0
              ? "Your order has been shipped"
              : "Flash sale - 24 hours only",
          date: eventDate.toISOString(),
          status: "Delivered",
        });
      } else if (channelType === "push") {
        events.push({
          id: `EVT-${customer.id.slice(-3)}-P${i}`,
          type: "push",
          title: i % 3 === 0 ? "New Products" : "Cart Reminder",
          description:
            i % 3 === 0
              ? "Check out our latest arrivals"
              : "You have items waiting in your cart",
          date: eventDate.toISOString(),
          status: "Sent",
        });
      }
    }
  }

  // Generate subscribed lists
  const lists: SubscribedList[] = [
    {
      id: `LIST-${customer.id.slice(-3)}-1`,
      name: "Newsletter",
      subscribedDate: (() => {
        const date = new Date(customer.lastInteractionDate);
        return isNaN(date.getTime())
          ? new Date().toISOString().split("T")[0]
          : date.toISOString().split("T")[0];
      })(),
      status: "active",
    },
    {
      id: `LIST-${customer.id.slice(-3)}-2`,
      name: "Promotions",
      subscribedDate: (() => {
        const date = new Date(customer.lastInteractionDate);
        return isNaN(date.getTime())
          ? new Date().toISOString().split("T")[0]
          : date.toISOString().split("T")[0];
      })(),
      status: customer.engagementScore > 70 ? "active" : "unsubscribed",
    },
  ];

  return { segments, offers, events, lists };
};

// Get date constraints for date picker
const getDateConstraints = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return {
    maxDate: `${year}-${month}-${day}`,
  };
};

export default function CustomerSearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const customer = location.state?.customer as CustomerRow | undefined;

  // Tab state
  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "engagement" | "marketing"
  >("overview");

  // Event filtering state
  const [eventSearchTerm, setEventSearchTerm] = useState<string>("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [eventDateFrom, setEventDateFrom] = useState<string>("");
  const [eventDateTo, setEventDateTo] = useState<string>("");

  // Generate related data
  const { segments, offers, events, lists } = useMemo(() => {
    if (!customer) return { segments: [], offers: [], events: [], lists: [] };
    return generateCustomerRelatedData(customer);
  }, [customer]);

  // Filtered events based on search, type, and date
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        eventSearchTerm.trim() === "" ||
        event.title.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(eventSearchTerm.toLowerCase()));

      const matchesType =
        eventTypeFilter === "all" || event.type === eventTypeFilter;

      const matchesDate =
        (!eventDateFrom || new Date(event.date) >= new Date(eventDateFrom)) &&
        (!eventDateTo ||
          new Date(event.date) <= new Date(eventDateTo + "T23:59:59"));

      return matchesSearch && matchesType && matchesDate;
    });
  }, [events, eventSearchTerm, eventTypeFilter, eventDateFrom, eventDateTo]);

  // Chart data for event distribution pie chart
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

  // Chart data for activity timeline bar chart
  const activityTimelineData = useMemo(() => {
    // Group events by month
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

  // Colors for charts
  const CHART_COLORS = [
    colors.reportCharts.palette.color1,
    colors.reportCharts.palette.color2,
    colors.reportCharts.palette.color3,
    colors.reportCharts.palette.color4,
  ];

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard/reports/customer-profiles")}
            className={`p-2 ${tw.rounded} hover:bg-gray-100 transition-colors`}
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Customer Search
            </h1>
            <p className="mt-2 text-sm text-gray-600">No customer data found</p>
          </div>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 text-center`}>
          <p className="text-gray-600">
            Please search for a customer from the Customer Profile Reports page.
          </p>
        </div>
      </div>
    );
  }

  // Generate email and phone from customer data
  const email = `${customer.name
    .toLowerCase()
    .replace(/\s+/g, ".")}@example.com`;
  const phone = `+254${Math.floor(Math.random() * 900000000 + 100000000)}`;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/reports/customer-profiles")}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customer Reports
      </button>

      {/* Hero Section - Clean & Modern */}
      <div className={`bg-white ${tw.rounded} border border-gray-200 shadow-sm overflow-hidden`}>
        {/* Header with name and status */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {customer.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">ID:</span> {customer.id}
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Segment:</span>{" "}
                  {customer.segment}
                </span>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                customer.churnRisk < 30
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : customer.churnRisk < 60
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {customer.churnRisk < 30
                ? "✓ Active Customer"
                : customer.churnRisk < 60
                ? "⚠ At Risk"
                : "⚠ High Risk"}
            </span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="px-6 py-6 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Lifetime Value
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${customer.lifetimeValue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total revenue generated</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Transactions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {customer.orders}
              </p>
              <p className="text-xs text-gray-500">Total orders placed</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Avg Transaction
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${customer.aov.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">Average order value</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Engagement Score
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {customer.engagementScore}
                <span className="text-sm text-gray-500">/100</span>
              </p>
              <p className="text-xs text-gray-500">Customer activity level</p>
            </div>
          </div>
        </div>

        {/* Contact & Additional Info */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Email:</span>{" "}
              <span className="text-gray-600">{email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>{" "}
              <span className="text-gray-600">{phone}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Location:</span>{" "}
              <span className="text-gray-600">{customer.location}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                Preferred Channel:
              </span>{" "}
              <span className="text-gray-600">{customer.preferredChannel}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                Last Transaction:
              </span>{" "}
              <span className="text-gray-600">{customer.lastPurchase}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Churn Risk:</span>{" "}
              <span className="text-gray-600">{customer.churnRisk}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={`bg-white ${tw.rounded} border border-gray-200 shadow-sm overflow-hidden`}>
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "activity"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab("engagement")}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "engagement"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Engagement
            </button>
            <button
              onClick={() => setActiveTab("marketing")}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "marketing"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Marketing
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Recent Activity Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {filteredEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-start gap-4 p-3 bg-gray-50 ${tw.rounded} hover:bg-gray-100 transition-colors`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {event.type === "email" && (
                          <Mail className="h-4 w-4 text-blue-500" />
                        )}
                        {event.type === "sms" && (
                          <MessageSquare className="h-4 w-4 text-purple-500" />
                        )}
                        {event.type === "push" && (
                          <div className="h-4 w-4 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {event.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(event.date).toLocaleString()}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xs font-medium text-gray-500">
                        {event.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Offers */}
              {offers.filter((o) => o.status === "Active").length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Active Offers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offers
                      .filter((o) => o.status === "Active")
                      .map((offer) => (
                        <div
                          key={offer.id}
                          className={`p-4 border border-blue-200 bg-blue-50 ${tw.rounded}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {offer.name}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {offer.type}
                              </p>
                            </div>
                            <span className="text-lg font-bold text-blue-600">
                              ${offer.value.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className={`p-4 bg-gray-50 ${tw.rounded}`}>
                  <p className="text-sm text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {events.length}
                  </p>
                </div>
                <div className={`p-4 bg-gray-50 ${tw.rounded}`}>
                  <p className="text-sm text-gray-600">Active Segments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {segments.length}
                  </p>
                </div>
                <div className={`p-4 bg-gray-50 ${tw.rounded}`}>
                  <p className="text-sm text-gray-600">Subscribed Lists</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {lists.filter((l) => l.status === "active").length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 pb-4 border-b border-gray-200">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={eventSearchTerm}
                    onChange={(e) => setEventSearchTerm(e.target.value)}
                    placeholder="Search events..."
                    className={`w-full pl-10 pr-4 py-2 text-sm ${tw.rounded} border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className={`px-4 py-2 text-sm ${tw.rounded} border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="all">All Types</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="date"
                  value={eventDateFrom}
                  onChange={(e) => setEventDateFrom(e.target.value)}
                  max={getDateConstraints().maxDate}
                  className={`px-4 py-2 text-sm ${tw.rounded} border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <input
                  type="date"
                  value={eventDateTo}
                  onChange={(e) => setEventDateTo(e.target.value)}
                  max={getDateConstraints().maxDate}
                  className={`px-4 py-2 text-sm ${tw.rounded} border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Timeline View */}
              <div className="space-y-4">
                {filteredEvents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No events found
                  </p>
                ) : (
                  filteredEvents.map((event, index) => {
                    const currentDate = new Date(event.date).toDateString();
                    const prevDate =
                      index > 0
                        ? new Date(
                            filteredEvents[index - 1].date
                          ).toDateString()
                        : null;
                    const showDateHeader = currentDate !== prevDate;

                    return (
                      <div key={event.id}>
                        {showDateHeader && (
                          <div className="flex items-center gap-3 mt-6 mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {new Date(event.date).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </h4>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>
                        )}
                        <div className="flex items-start gap-4 pl-4 border-l-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 p-3 rounded-r-md transition-all">
                          <div className="flex-shrink-0 mt-1">
                            {event.type === "email" && (
                              <Mail className="h-4 w-4 text-blue-500" />
                            )}
                            {event.type === "sms" && (
                              <MessageSquare className="h-4 w-4 text-purple-500" />
                            )}
                            {event.type === "push" && (
                              <div className="h-4 w-4 rounded-full bg-orange-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {event.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {event.description}
                                </p>
                              </div>
                              <span className="flex-shrink-0 ml-4 text-xs text-gray-500">
                                {new Date(event.date).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                            <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                              {event.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "engagement" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Activity Metrics
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Event Distribution Pie Chart */}
                <div className={`p-4 border border-gray-200 ${tw.rounded}`}>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Event Distribution
                  </h4>
                  {eventDistributionData.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-12">
                      No event data available
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={eventDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {eventDistributionData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Activity Timeline Bar Chart */}
                <div className={`p-4 border border-gray-200 ${tw.rounded}`}>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Activity Timeline
                  </h4>
                  {activityTimelineData.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-12">
                      No activity data available
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={activityTimelineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="events"
                          fill={colors.reportCharts.palette.color1}
                          name="Events"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "marketing" && (
            <div className="space-y-6">
              {/* Segments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Segments
                </h3>
                {segments.length === 0 ? (
                  <p className="text-sm text-gray-500">No segments found</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {segments.map((segment) => (
                      <span
                        key={segment.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium border border-indigo-200"
                      >
                        {segment.name}
                        <span className="text-xs text-indigo-600">
                          ({segment.type})
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* All Offers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Offers
                </h3>
                {offers.length === 0 ? (
                  <p className="text-sm text-gray-500">No offers found</p>
                ) : (
                  <div className="space-y-4">
                    {offers.filter((o) => o.status === "Active").length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Active (
                          {offers.filter((o) => o.status === "Active").length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {offers
                            .filter((o) => o.status === "Active")
                            .map((offer) => (
                              <div
                                key={offer.id}
                                className={`p-4 border border-green-200 bg-green-50 ${tw.rounded}`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium text-gray-900">
                                    {offer.name}
                                  </p>
                                  <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                                    {offer.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    {offer.type}
                                  </span>
                                  <span className="font-semibold text-green-700">
                                    ${offer.value.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {offers.filter((o) => o.status === "Redeemed").length >
                      0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Redeemed (
                          {offers.filter((o) => o.status === "Redeemed").length}
                          )
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {offers
                            .filter((o) => o.status === "Redeemed")
                            .map((offer) => (
                              <div
                                key={offer.id}
                                className={`p-4 border border-gray-200 bg-gray-50 ${tw.rounded}`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium text-gray-900">
                                    {offer.name}
                                  </p>
                                  <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                    ✓ {offer.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    {offer.type}
                                  </span>
                                  <span className="font-semibold text-gray-700">
                                    ${offer.value.toFixed(2)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  Used: {offer.redeemedDate}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subscribed Lists */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Subscribed Lists
                </h3>
                {lists.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No subscribed lists found
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lists.map((list) => (
                      <div
                        key={list.id}
                        className={`p-4 border border-gray-200 bg-white ${tw.rounded} hover:border-gray-300 transition-colors`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-gray-900">
                            {list.name}
                          </p>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              list.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {list.status === "active"
                              ? "✓ Active"
                              : "Unsubscribed"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Subscribed: {list.subscribedDate}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
