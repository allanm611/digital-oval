import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Grid3X3, List, Eye } from "lucide-react";
import { color, tw, components, button } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";

interface ConfigurationItem {
  id: string;
  name: string;
  description: string;
  type: "campaign" | "offer" | "product" | "segment" | "user" | "control-group";
  category: string;
  status: "active" | "inactive" | "draft";
  navigationPath: string;
  icon?: string;
}

export default function ConfigurationPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [configurations, setConfigurations] = useState<ConfigurationItem[]>([]);

  // All individual configurations - flat list
  useEffect(() => {
    const allConfigurations: ConfigurationItem[] = [
      // Campaign-related configs
      {
        id: "line-of-business",
        name: "Line of Business",
        description: "Define and manage your business lines and services",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/line-of-business",
      },
      {
        id: "campaign-communication-policy",
        name: "Campaign Communication Policy",
        description: "Configure communication policies for campaigns",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/campaign-communication-policy",
      },
      {
        id: "communication-channels",
        name: "Communication Channels",
        description: "Manage SMS, Email, USSD and Push delivery channels",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/communication-channels",
      },
      {
        id: "sms-email-routes",
        name: "SMS/Email Routes",
        description: "Configure SMS and Email routing for campaign delivery",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "", // Placeholder - doesn't navigate anywhere
      },
      {
        id: "campaign-objectives",
        name: "Campaign Objectives",
        description: "Define and manage your campaign objectives",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/campaign-objectives",
      },
      {
        id: "departments",
        name: "Departments",
        description: "Define and manage your departments",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/departments",
      },
      {
        id: "team-roles",
        name: "Team Roles",
        description: "Define and manage team roles and responsibilities",
        type: "user",
        category: "User Configuration",
        status: "active",
        navigationPath: "/dashboard/team-roles",
      },
      {
        id: "programs",
        name: "Programs",
        description: "Manage campaign programs and initiatives",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/programs",
      },
      {
        id: "campaign-catalogs",
        name: "Campaigns catalogs",
        description: "Manage Campaigns catalogs and catalogs",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/campaign-catalogs",
      },
      {
        id: "campaign-types",
        name: "Campaign Types",
        description:
          "Configure available campaign strategies like Round Robin or Champion Challenger",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/campaign-types",
      },
      // Offer-related configs
      {
        id: "offer-types",
        name: "Offer Types",
        description: "Configure different types of offers and promotions",
        type: "offer",
        category: "Offer Configuration",
        status: "active",
        navigationPath: "/dashboard/offer-types",
      },
      {
        id: "offer-catalogs",
        name: "Offer Catalogs",
        description: "Manage offer catalogs",
        type: "offer",
        category: "Offer Configuration",
        status: "active",
        navigationPath: "/dashboard/offer-catalogs",
      },
      {
        id: "offer-tracking-sources",
        name: "Offer Tracking Sources",
        description:
          "Manage tracking sources for measuring offer performance and analytics",
        type: "offer",
        category: "Offer Configuration",
        status: "active",
        navigationPath: "/dashboard/offer-tracking-sources",
      },
      {
        id: "creative-templates",
        name: "Creative Templates",
        description:
          "Manage reusable creative templates for SMS, Email, Push, and more",
        type: "offer",
        category: "Offer Configuration",
        status: "active",
        navigationPath: "/dashboard/creative-templates",
      },
      {
        id: "reward-types",
        name: "Reward Types",
        description: "Define reusable reward fulfilment types",
        type: "offer",
        category: "Offer Configuration",
        status: "active",
        navigationPath: "/dashboard/reward-types",
      },
      {
        id: "sender-ids",
        name: "Sender IDs",
        description: "Manage SMS sender IDs for branding and compliance",
        type: "offer",
        category: "Offer Configuration",
        status: "active",
        navigationPath: "/dashboard/sender-ids",
      },
      {
        id: "sms-routes",
        name: "SMS Routes",
        description: "Manage SMS gateway routes for message delivery",
        type: "offer",
        category: "Offer Configuration",
        status: "active",
        navigationPath: "/dashboard/sms-routes",
      },
      {
        id: "languages",
        name: "Languages",
        description:
          "Manage available languages and locales for offer creatives",
        type: "offer",
        category: "Offer Configuration",
        status: "active",
        navigationPath: "/dashboard/languages",
      },
      // Product-related configs
      {
        id: "product-types",
        name: "Product Types",
        description: "Manage product types and classifications",
        type: "product",
        category: "Product Configuration",
        status: "active",
        navigationPath: "/dashboard/product-types",
      },
      {
        id: "product-catalogs",
        name: "Product Categories",
        description: "Manage product categories and catalogs",
        type: "product",
        category: "Product Configuration",
        status: "active",
        navigationPath: "/dashboard/products/catalogs",
      },
      // Segment-related configs
      {
        id: "segment-catalogs",
        name: "segment catalogs",
        description: "Manage segment catalogs and classifications",
        type: "segment",
        category: "Segment Configuration",
        status: "active",
        navigationPath: "/dashboard/segment-catalogs",
      },
      {
        id: "segment-types",
        name: "Segment Types",
        description: "Manage the different segment methodologies available",
        type: "segment",
        category: "Segment Configuration",
        status: "active",
        navigationPath: "/dashboard/segment-types",
      },
      {
        id: "segment-lists",
        name: "Segment Lists",
        description:
          "Manage segment lists that feed campaigns, offers, and customer journeys",
        type: "segment",
        category: "Segment Configuration",
        status: "active",
        navigationPath: "/dashboard/segment-list",
      },
      // User-related configs
      {
        id: "user-management",
        name: "User Management",
        description: "Manage user accounts, roles, and permissions",
        type: "user",
        category: "User Configuration",
        status: "active",
        navigationPath: "/dashboard/user-management",
      },
      // Control group configs
      {
        id: "control-groups",
        name: "Universal Control Groups",
        description:
          "Configure and manage universal control groups for campaigns",
        type: "control-group",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/control-groups",
      },
      // Job-related configs
      {
        id: "job-types",
        name: "Job Types",
        description: "Configure and manage job types for scheduled jobs",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/job-types",
      },
      // Customer list management configs
      {
        id: "dnd-management",
        name: "DND Management",
        description:
          "Manage Do Not Disturb subscriptions - list, add, and remove customers from DND lists",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/dnd-management",
      },
      {
        id: "vip-list-management",
        name: "VIP List Management",
        description:
          "Manage VIP customer lists - add, remove, and organize VIP customers",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/vip-list-management",
      },
      {
        id: "seed-list-management",
        name: "Seed List Management",
        description:
          "Manage test recipients (staff) who receive campaign copies based on department and line of business",
        type: "campaign",
        category: "Campaign Configuration",
        status: "active",
        navigationPath: "/dashboard/seed-list-management",
      },
    ];

    setConfigurations(allConfigurations);
  }, []);

  const categories = [
    {
      id: "all",
      name: t.configuration.allConfigurations,
      count: configurations.length,
    },
    {
      id: "campaign",
      name: t.configuration.campaign,
      count: configurations.filter((c) => c.type === "campaign").length,
    },
    {
      id: "offer",
      name: t.configuration.offer,
      count: configurations.filter((c) => c.type === "offer").length,
    },
    {
      id: "product",
      name: t.configuration.product,
      count: configurations.filter((c) => c.type === "product").length,
    },
    {
      id: "segment",
      name: t.configuration.segment,
      count: configurations.filter((c) => c.type === "segment").length,
    },
    {
      id: "user",
      name: t.configuration.user,
      count: configurations.filter((c) => c.type === "user").length,
    },
    {
      id: "control-group",
      name: t.configuration.controlGroup,
      count: configurations.filter((c) => c.type === "control-group").length,
    },
  ];

  const filteredConfigurations = configurations.filter((config) => {
    const matchesSearch =
      config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || config.type === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleConfigurationClick = (config: ConfigurationItem) => {
    // Only navigate if navigationPath is provided and not empty
    if (config.navigationPath && config.navigationPath.trim() !== "") {
      navigate(config.navigationPath);
    }
    // Otherwise, it's a placeholder and does nothing
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div
            className="rounded-md"
            style={{ backgroundColor: color.primary.accent }}
          ></div>
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
              {t.configuration.title}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              {t.configuration.description}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={` mb-8`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${tw.textMuted}`}
            />
            <input
              type="text"
              placeholder={t.configuration.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-4 ${components.input.default} rounded-md focus:outline-none transition-all duration-200 text-sm`}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 lg:ml-6">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md transition-all duration-200 ${
                viewMode === "grid"
                  ? ""
                  : `${tw.textMuted} hover:${tw.textSecondary}`
              }`}
              style={
                viewMode === "grid"
                  ? {
                      backgroundColor: button.activeIconDisplay.background,
                      color: button.activeIconDisplay.color,
                      padding: `${button.activeIconDisplay.paddingY} ${button.activeIconDisplay.paddingX}`,
                      borderRadius: button.activeIconDisplay.borderRadius,
                    }
                  : { padding: "0.5rem" }
              }
            >
              <Grid3X3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md transition-all duration-200 ${
                viewMode === "list"
                  ? ""
                  : `${tw.textMuted} hover:${tw.textSecondary}`
              }`}
              style={
                viewMode === "list"
                  ? {
                      backgroundColor: button.activeIconDisplay.background,
                      color: button.activeIconDisplay.color,
                      padding: `${button.activeIconDisplay.paddingY} ${button.activeIconDisplay.paddingX}`,
                      borderRadius: button.activeIconDisplay.borderRadius,
                    }
                  : { padding: "0.5rem" }
              }
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? `bg-[#5F6F77] text-white`
                  : `bg-white ${tw.textSecondary} hover:bg-gray-50 border border-gray-300`
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className={`${tw.textSecondary} text-sm`}>
          {t.configuration.showing} {filteredConfigurations.length}{" "}
          {t.configuration.of} {configurations.length}{" "}
          {t.configuration.configurations}
          {configurations.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Configurations Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredConfigurations.map((config, index) => {
            return (
              <div
                key={config.id}
                onClick={() => handleConfigurationClick(config)}
                className={`group ${components.card.default} hover:shadow-xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full cursor-pointer`}
                style={{
                  animation: `fadeInUp 0.6s ease-out forwards ${index * 0.1}s`,
                  opacity: 0,
                  transform: "translateY(20px)",
                }}
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3
                        className={`text-lg font-bold ${tw.textPrimary} leading-tight mb-2`}
                      >
                        {config.name}
                      </h3>
                      <p
                        className={`text-sm ${tw.textSecondary} leading-relaxed`}
                      >
                        {config.description}
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span
                      className={`bg-neutral-100 px-3 py-1 rounded-full text-sm font-medium ${tw.textSecondary}`}
                    >
                      {config.category}
                    </span>
                    <Eye
                      className={`h-5 w-5 ${tw.textMuted} group-hover:text-[${color.primary.accent}] transition-colors duration-200`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConfigurations.map((config, index) => {
            return (
              <div
                key={config.id}
                onClick={() => handleConfigurationClick(config)}
                className="bg-white border border-gray-200 rounded-md p-4 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                style={{
                  animation: `fadeInUp 0.6s ease-out forwards ${index * 0.1}s`,
                  opacity: 0,
                  transform: "translateY(20px)",
                }}
              >
                <div className="flex items-center gap-4 flex-1 p-2">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      {config.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {config.description}
                    </p>
                    <div className="mt-2">
                      <span className="bg-neutral-100 px-2 py-1 rounded-full text-xs font-medium text-gray-600">
                        {config.category}
                      </span>
                    </div>
                  </div>
                </div>
                <Eye
                  className={`h-5 w-5 ${tw.textMuted} group-hover:text-[${color.primary.accent}] transition-colors duration-200 flex-shrink-0 mr-2`}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredConfigurations.length === 0 && (
        <div className="text-center py-12">
          <div
            className={`p-4 bg-neutral-100 rounded-full w-16 h-16 mx-auto mb-4`}
          >
            <Search className={`h-8 w-8 ${tw.textMuted}`} />
          </div>
          <h3
            className={`text-lg sm:text-xl font-semibold ${tw.textPrimary} mb-2`}
          >
            No configurations found
          </h3>
          <p className={`text-base ${tw.textSecondary} mb-6`}>
            {searchTerm
              ? "Try adjusting your search terms"
              : "No configurations match the selected category"}
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}
            className={`${tw.button} text-sm whitespace-nowrap`}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
