import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  Server,
  Database,
  Plug,
  Download,
  Briefcase,
  PlayCircle,
  Layers,
  Link2,
  Activity,
  GitBranch,
  Users,
  UserCheck,
  Settings,
  Clock,
  TrendingUp,
  Mail,
  Grid3X3,
  List,
  BarChart3,
  Network,
  Shield,
  Send,
  MessageSquare,
  Smartphone,
  Gift,
  Tag,
} from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import SearchInput from "../../../shared/components/ui/SearchInput";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

interface AdminCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  category: string;
}

interface AdminCategory {
  name: string;
  description: string;
  cards: AdminCard[];
}

export default function AdminHubPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categories: AdminCategory[] = [
    {
      name: "Infrastructure",
      description: "Manage servers, connections, and data connectors",
      cards: [
        {
          title: t.sidebar.navigation.servers || "Servers",
          description: "Manage system servers and infrastructure",
          icon: Server,
          href: "/dashboard/servers",
          category: "Infrastructure",
        },
        {
          title: t.sidebar.navigation.connectionProfiles || "Connection Profiles",
          description: "Configure database and API connections",
          icon: Database,
          href: "/dashboard/connection-profiles",
          category: "Infrastructure",
        },
        {
          title: t.sidebar.navigation.dataConnectors || "Data Connectors",
          description: "Set up data connectors for external sources",
          icon: Plug,
          href: "/dashboard/data-connectors",
          category: "Infrastructure",
        },
        {
          title: "ETL",
          description: "Manage ETL workflows and file registry",
          icon: Download,
          href: "/dashboard/etl",
          category: "Infrastructure",
        },
      ],
    },
    {
      name: "Job Management",
      description: "Configure and monitor scheduled jobs and workflows",
      cards: [
        {
          title: t.sidebar.navigation.scheduledJobs || "Scheduled Jobs",
          description: "Create and manage scheduled jobs",
          icon: Briefcase,
          href: "/dashboard/jobs",
          category: "Job Management",
        },
        {
          title: t.sidebar.navigation.jobExecutions || "Job Executions",
          description: "Monitor job execution history and logs",
          icon: PlayCircle,
          href: "/dashboard/job-executions",
          category: "Job Management",
        },
        {
          title: t.sidebar.navigation.jobTypes || "Job Types",
          description: "Define job types and configurations",
          icon: Layers,
          href: "/dashboard/job-types",
          category: "Job Management",
        },
        {
          title: t.sidebar.navigation.jobDependencies || "Job Dependencies",
          description: "Manage job interdependencies",
          icon: Link2,
          href: "/dashboard/job-dependencies",
          category: "Job Management",
        },
        {
          title: t.sidebar.navigation.jobWorkflowSteps || "Job Workflow Steps",
          description: "Configure workflow step definitions",
          icon: Activity,
          href: "/dashboard/job-workflow-steps",
          category: "Job Management",
        },
        {
          title: t.sidebar.navigation.jobWorkflows || "Job Workflows",
          description: "Design and manage job workflows",
          icon: GitBranch,
          href: "/dashboard/workflows",
          category: "Job Management",
        },
      ],
    },
    {
      name: "User Management",
      description: "Manage users, roles, and access permissions",
      cards: [
        {
          title: t.sidebar.navigation.allUsers || "Users",
          description: "Manage system users and accounts",
          icon: Users,
          href: "/dashboard/user-management",
          category: "User Management",
        },
        {
          title: "Roles",
          description: "Create and manage user roles",
          icon: Briefcase,
          href: "/dashboard/roles",
          category: "User Management",
        },
        {
          title: t.sidebar.navigation.accessControl || "Access Control",
          description: "Configure permissions and access levels",
          icon: UserCheck,
          href: "/dashboard/access-control",
          category: "User Management",
        },
      ],
    },
    {
      name: "Monitoring",
      description: "Monitor campaigns, broadcasts, rewards, and job executions",
      cards: [
        {
          title: "Execution Monitoring",
          description: "Monitor campaigns, broadcasts, rewards, and scheduled jobs execution status",
          icon: BarChart3,
          href: "/dashboard/monitoring",
          category: "Monitoring",
        },
      ],
    },
    {
      name: "Communication & Messaging",
      description: "Configure channels, routes, and messaging gateways",
      cards: [
        {
          title: "Gateway Configurations",
          description: "Configure message delivery gateways and endpoints",
          icon: Network,
          href: "/dashboard/gateway-configurations",
          category: "Communication & Messaging",
        },
        {
          title: "Communication Channels",
          description: "Manage SMS, Email, USSD and Push delivery channels",
          icon: Mail,
          href: "/dashboard/communication-channels",
          category: "Communication & Messaging",
        },
        {
          title: "Routes Management",
          description: "Manage all communication routes (SMS, Email, WhatsApp, USSD, Push)",
          icon: Link2,
          href: "/dashboard/routes",
          category: "Communication & Messaging",
        },
        {
          title: "Email Routes",
          description: "Manage email SMTP routes for message delivery",
          icon: Mail,
          href: "/dashboard/email-routes",
          category: "Communication & Messaging",
        },
        {
          title: "SMS Routes",
          description: "Manage SMS gateway routes for message delivery",
          icon: MessageSquare,
          href: "/dashboard/sms-routes",
          category: "Communication & Messaging",
        },
        {
          title: "Push Notification Routes",
          description: "Manage push notification gateway routes for message delivery",
          icon: Smartphone,
          href: "/dashboard/push-notification-routes",
          category: "Communication & Messaging",
        },
        {
          title: "WhatsApp Routes",
          description: "Manage WhatsApp gateway routes for message delivery",
          icon: Send,
          href: "/dashboard/whatsapp-routes",
          category: "Communication & Messaging",
        },
        {
          title: "USSD Routes",
          description: "Manage USSD gateway routes for USSD message delivery",
          icon: Smartphone,
          href: "/dashboard/ussd-routes",
          category: "Communication & Messaging",
        },
        {
          title: "Sender IDs",
          description: "Manage SMS sender IDs for branding and compliance",
          icon: MessageSquare,
          href: "/dashboard/sender-ids",
          category: "Communication & Messaging",
        },
      ],
    },
    {
      name: "System Configuration",
      description: "System settings and administrative configurations",
      cards: [
        {
          title: "Universal Control Groups",
          description: "Manage universal control groups for testing and validation",
          icon: Shield,
          href: "/dashboard/control-groups",
          category: "System Configuration",
        },
        {
          title: "KPIs",
          description: "Manage Key Performance Indicators and system events",
          icon: TrendingUp,
          href: "/dashboard/kpis",
          category: "System Configuration",
        },
        {
          title: "KPI Categories",
          description: "Manage categories used to organize KPIs and profile fields",
          icon: Tag,
          href: "/dashboard/kpis/kpi-categories",
          category: "System Configuration",
        },
        {
          title: "Notification Categories",
          description: "Manage categories for organizing notification rules",
          icon: MessageSquare,
          href: "/dashboard/notification-categories",
          category: "System Configuration",
        },
        {
          title: "Timezones",
          description: "Manage available timezones for system operations",
          icon: Clock,
          href: "/dashboard/timezones",
          category: "System Configuration",
        },
        {
          title: "Notification Types",
          description: "Define and manage different types of notifications",
          icon: MessageSquare,
          href: "/dashboard/notification-types",
          category: "System Configuration",
        },
        {
          title: "Dynamic Modal Generator",
          description: "Manage customer identity fields available for dynamic variable insertion in messages and creatives",
          icon: Layers,
          href: "/dashboard/dynamic-message-variables",
          category: "System Configuration",
        },
      ],
    },
  ];

  const allCards = useMemo(
    () => categories.flatMap((cat) => cat.cards),
    [categories]
  );

  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      const matchesSearch =
        searchQuery === "" ||
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(card.category);

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategories, allCards]);

  const categoryNames = categories.map((cat) => cat.name);

  const handleCardClick = (href: string) => {
    navigate(href);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold ${tw.textPrimary}`}>
          Administration
        </h1>
        <p className={`${tw.textSecondary} mt-2 text-sm`}>
          Manage system infrastructure, jobs, users, and configurations
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <SearchInput
            placeholder="Search admin features..."
            value={searchQuery}
            onChange={setSearchQuery}
          />

          <HeadlessSelect
            options={[
              { value: "", label: "All Categories" },
              ...categoryNames.map((name) => ({
                value: name,
                label: name,
              })),
            ]}
            value={selectedCategories.length === 1 ? selectedCategories[0] : ""}
            onChange={(value) => {
              if (value === "") {
                setSelectedCategories([]);
              } else {
                setSelectedCategories([value as string]);
              }
            }}
            placeholder="All Categories"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded transition-colors ${
              viewMode === "grid" ? "" : "text-gray-500 hover:text-gray-700"
            }`}
            style={
              viewMode === "grid"
                ? {
                    backgroundColor: color.primary.accent,
                    color: "#ffffff",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                  }
                : { padding: "0.5rem" }
            }
            title="Grid View"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded transition-colors ${
              viewMode === "list" ? "" : "text-gray-500 hover:text-gray-700"
            }`}
            style={
              viewMode === "list"
                ? {
                    backgroundColor: color.primary.accent,
                    color: "#ffffff",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                  }
                : { padding: "0.5rem" }
            }
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Display */}
      {filteredCards.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.href}
                  onClick={() => handleCardClick(card.href)}
                  className={`cursor-pointer ${tw.rounded} border p-4 hover:shadow-lg transition-all duration-200`}
                  style={{
                    backgroundColor: color.surface.background,
                    borderColor: color.border.default,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color.border.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = color.border.default;
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className="w-6 h-6 flex-shrink-0 mt-1"
                      style={{ color: color.primary.action }}
                    />
                    <div className="flex-1">
                      <h3 className={`text-base font-semibold ${tw.textPrimary}`}>
                        {card.title}
                      </h3>
                      <p className={`text-xs ${tw.textSecondary} mt-1`}>
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.href}
                  onClick={() => handleCardClick(card.href)}
                  className={`cursor-pointer ${tw.rounded} border p-4 hover:shadow-lg transition-all duration-200`}
                  style={{
                    backgroundColor: color.surface.background,
                    borderColor: color.border.default,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color.border.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = color.border.default;
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: color.primary.action }}
                    />
                    <div className="flex-1">
                      <h3 className={`text-base font-semibold ${tw.textPrimary}`}>
                        {card.title}
                      </h3>
                      <p className={`text-xs ${tw.textSecondary}`}>
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className={`text-center py-12 ${tw.textSecondary}`}>
          <p className="text-base">No admin features match your search.</p>
        </div>
      )}
    </div>
  );
}
