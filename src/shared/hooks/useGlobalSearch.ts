import { useQuery } from "@tanstack/react-query";
import { campaignService } from "../../features/campaigns/services/campaignService";
import { offerService } from "../../features/offers/services/offerService";
import { productService } from "../../features/products/services/productService";
import { segmentService } from "../../features/segments/services/segmentService";
import { programService } from "../../features/campaigns/services/programService";
import { userService } from "../../features/users/services/userService";
import { roleService } from "../../features/roles/services/roleService";
import { offerCategoryService } from "../../features/offers/services/offerCategoryService";
import { productCategoryService } from "../../features/products/services/productCategoryService";
import { quicklistService } from "../../features/quicklists/services/quicklistService";
import { controlGroupService } from "../../features/control-groups/services/controlGroupService";
import { customerService } from "../../features/customers360/services/customerServices";
import { usageMetricService } from "../../features/kpis/services/usageMetricService";
import { revenueMetricService } from "../../features/kpis/services/revenueMetricService";
import { systemEventService } from "../../features/kpis/services/systemEventService";
import { subscriberProfileService } from "../../features/kpis/services/subscriberProfileService";
import { getEntityUrl } from "../utils/navigation";
import { Role } from "../../features/roles/types/role";

export interface SearchSuggestion {
  id: string | number;
  type:
    | "campaign"
    | "offer"
    | "product"
    | "segment"
    | "program"
    | "user"
    | "configuration"
    | "offer-catalog"
    | "product-catalog"
    | "segment-catalog"
    | "campaign-catalog"
    | "quicklist"
    | "control-group"
    | "customer"
    | "kpi";
  name: string;
  description?: string;
  url: string;
}

const allConfigurations = [
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
  {
    id: "character-sets",
    name: "Character Sets",
    description:
      "Manage character encoding sets for language support and text display",
    type: "offer",
    category: "Offer Configuration",
    status: "active",
    navigationPath: "/dashboard/character-sets",
  },
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
    id: "combo-types",
    name: "Combo Types",
    description: "Manage combo types and combinations",
    type: "product",
    category: "Product Configuration",
    status: "active",
    navigationPath: "/dashboard/combo-types",
  },
  {
    id: "resource-types",
    name: "Resource Types",
    description: "Manage resource types and their units",
    type: "product",
    category: "Product Configuration",
    status: "active",
    navigationPath: "/dashboard/resource-types",
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
    id: "user-management",
    name: "User Management",
    description: "Manage user accounts, roles, and permissions",
    type: "user",
    category: "User Configuration",
    status: "active",
    navigationPath: "/dashboard/user-management",
  },
  {
    id: "control-groups-campaign",
    name: "Universal Control Groups",
    description:
      "Configure and manage universal control groups for campaigns",
    type: "campaign",
    category: "Campaign Configuration",
    status: "active",
    navigationPath: "/dashboard/control-groups",
  },
  {
    id: "control-groups-segment",
    name: "Universal Control Groups",
    description:
      "Configure and manage universal control groups for segments",
    type: "segment",
    category: "Segment Configuration",
    status: "active",
    navigationPath: "/dashboard/control-groups",
  },
  {
    id: "job-types",
    name: "Job Types",
    description: "Configure and manage job types for scheduled jobs",
    type: "campaign",
    category: "Campaign Configuration",
    status: "active",
    navigationPath: "/dashboard/job-types",
  },
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
  {
    id: "notification-types",
    name: "Notification Types",
    description: "Manage notification types and their templates",
    type: "notification",
    category: "Notification Configuration",
    status: "active",
    navigationPath: "/dashboard/notification-types",
  },
  {
    id: "dnd-types",
    name: "DND Types",
    description: "Manage Do Not Disturb types for customer preferences",
    type: "campaign",
    category: "Campaign Configuration",
    status: "active",
    navigationPath: "/dashboard/dnd-types",
  },
  {
    id: "offer-creatives",
    name: "Offer Creatives",
    description: "Manage reusable offer creatives across different channels and locales",
    type: "offer",
    category: "Offer Configuration",
    status: "active",
    navigationPath: "/dashboard/offer-creatives",
  },
  {
    id: "email-routes",
    name: "Email Routes",
    description: "Manage email SMTP routes for message delivery",
    type: "offer",
    category: "Offer Configuration",
    status: "active",
    navigationPath: "/dashboard/email-routes",
  },
  {
    id: "dynamic-message-variables",
    name: "Dynamic Modal Generator",
    description: "Manage customer identity fields available for dynamic variable insertion in messages and creatives",
    type: "offer",
    category: "Offer Configuration",
    status: "active",
    navigationPath: "/dashboard/dynamic-message-variables",
  },
  {
    id: "utilities",
    name: "Utilities",
    description: "Manage utility types like water, electricity, and food",
    type: "product",
    category: "Product Configuration",
    status: "active",
    navigationPath: "/dashboard/utilities",
  },
  {
    id: "timezones",
    name: "Timezones",
    description: "Manage available timezones for campaign scheduling and system operations",
    type: "campaign",
    category: "System Configuration",
    status: "active",
    navigationPath: "/dashboard/timezones",
  },
];

async function performSearch(query: string): Promise<SearchSuggestion[]> {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  const queryLower = query.toLowerCase();

  try {
    const roleLookup: Record<number, Role> = {};
    try {
      const rolesResponse = await roleService.listRoles({
        limit: 100,
        offset: 0,
        skipCache: true,
      });
      rolesResponse.roles.forEach((role) => {
        if (role.id != null) {
          roleLookup[role.id] = role;
        }
      });
    } catch (err) {
      console.error("Failed to load roles:", err);
    }

    const [
      campaignsRes,
      offersRes,
      productsRes,
      segmentsRes,
      programsRes,
      usersRes,
      offerCatalogsRes,
      productCatalogsRes,
      segmentCatalogsRes,
      campaignCatalogsRes,
      quicklistsRes,
      controlGroupsRes,
      customersRes,
      kpisRes,
    ] = await Promise.allSettled([
      campaignService.getCampaigns({
        limit: 20,
        offset: 0,
        skipCache: true,
      }),
      offerService.searchOffers({
        search: query,
        limit: 5,
        offset: 0,
        skipCache: true,
      }),
      productService.searchProducts({
        q: query,
        limit: 5,
        offset: 0,
        skipCache: true,
      }),
      segmentService.getSegments({
        pageSize: 20,
        skipCache: true,
      }),
      programService.getAllPrograms({
        limit: 20,
        offset: 0,
        skipCache: true,
      }),
      userService.getUsers({
        skipCache: true,
      }),
      offerCategoryService.searchCategories({
        q: query,
        limit: 5,
        offset: 0,
        skipCache: true,
      }),
      productCategoryService.searchCategories({
        q: query,
        limit: 5,
        offset: 0,
        skipCache: true,
      }),
      query.trim()
        ? segmentService.searchSegmentCategories(query, true)
        : segmentService.getSegmentCategories(undefined, true),
      campaignService.searchCampaignCategories(query, {
        limit: 5,
        offset: 0,
        skipCache: true,
      }),
      quicklistService.getAllQuickLists({
        limit: 50,
        offset: 0,
      }),
      controlGroupService.listControlGroups({
        limit: 10,
        offset: 0,
      }),
      customerService.searchCustomers({
        msisdn: query,
        limit: 5,
        offset: 0,
      }),
      Promise.all([
        usageMetricService.getAllMetrics(),
        revenueMetricService.getAllMetrics(),
        systemEventService.getAllEvents(),
        subscriberProfileService.getAllProfiles(),
      ]),
    ]);

    const allSuggestions: SearchSuggestion[] = [];

    if (campaignsRes.status === "fulfilled" && campaignsRes.value.data) {
      campaignsRes.value.data
        .filter((c) => c.name?.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .forEach((campaign) => {
          allSuggestions.push({
            id: campaign.id,
            type: "campaign",
            name: campaign.name || "Unnamed Campaign",
            description: campaign.description || undefined,
            url: getEntityUrl("campaign", campaign.id),
          });
        });
    }

    if (offersRes.status === "fulfilled" && offersRes.value.data) {
      offersRes.value.data.slice(0, 3).forEach((offer) => {
        allSuggestions.push({
          id: offer.id,
          type: "offer",
          name: offer.name || "Unnamed Offer",
          description: offer.description || undefined,
          url: getEntityUrl("offer", offer.id),
        });
      });
    }

    if (productsRes.status === "fulfilled" && productsRes.value.data) {
      productsRes.value.data.slice(0, 3).forEach((product) => {
        allSuggestions.push({
          id: product.id,
          type: "product",
          name: product.name || "Unnamed Product",
          description: product.description || undefined,
          url: getEntityUrl("product", product.id),
        });
      });
    }

    if (segmentsRes.status === "fulfilled" && segmentsRes.value.data) {
      segmentsRes.value.data
        .filter(
          (s) =>
            s.name?.toLowerCase().includes(query.toLowerCase()) ||
            s.description?.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 3)
        .forEach((segment) => {
          allSuggestions.push({
            id: segment.id,
            type: "segment",
            name: segment.name || "Unnamed Segment",
            description: segment.description || undefined,
            url: getEntityUrl("segment", segment.id),
          });
        });
    }

    if (programsRes.status === "fulfilled" && programsRes.value.data) {
      programsRes.value.data
        .filter((p) => p.name?.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .forEach((program) => {
          allSuggestions.push({
            id: program.id,
            type: "program",
            name: program.name || "Unnamed Program",
            description: program.description || undefined,
            url: getEntityUrl("program", program.id),
          });
        });
    }

    if (usersRes.status === "fulfilled" && usersRes.value.data) {
      const users = Array.isArray(usersRes.value.data)
        ? usersRes.value.data
        : [];
      users
        .filter((user) => {
          if (!query.trim()) return true;
          const searchLower = query.toLowerCase();
          const fullName = `${user.first_name || ""} ${
            user.last_name || ""
          }`.trim();
          return (
            fullName.toLowerCase().includes(searchLower) ||
            user.username?.toLowerCase().includes(searchLower) ||
            user.email_address?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.department?.toLowerCase().includes(searchLower)
          );
        })
        .slice(0, 3)
        .forEach((user) => {
          allSuggestions.push({
            id: user.id,
            type: "user",
            name:
              `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
              user.username ||
              user.email_address ||
              "Unnamed User",
            description: user.email_address || user.department || undefined,
            url: getEntityUrl("user", user.id),
          });
        });
    }

    if (
      offerCatalogsRes.status === "fulfilled" &&
      offerCatalogsRes.value.data
    ) {
      const catalogs = Array.isArray(offerCatalogsRes.value.data)
        ? offerCatalogsRes.value.data
        : (offerCatalogsRes.value.data as unknown as Record<string, unknown>)
            ?.categories || [];
      (catalogs as unknown[] as Record<string, unknown>[])
        .slice(0, 3)
        .forEach((catalog: Record<string, unknown>) => {
          allSuggestions.push({
            id: catalog.id as string | number,
            type: "offer-catalog",
            name: (catalog.name as string) || "Unnamed Catalog",
            description: (catalog.description as string) || undefined,
            url: getEntityUrl("offer-catalog", catalog.id as string | number),
          });
        });
    }

    if (
      productCatalogsRes.status === "fulfilled" &&
      productCatalogsRes.value.data
    ) {
      const catalogs = Array.isArray(productCatalogsRes.value.data)
        ? productCatalogsRes.value.data
        : [];
      (catalogs as unknown[] as Record<string, unknown>[])
        .filter((catalog: Record<string, unknown>) => {
          const nameMatch = (catalog.name as string)
            ?.toLowerCase()
            .includes(queryLower);
          const descMatch = (catalog.description as string)
            ?.toLowerCase()
            .includes(queryLower);
          return nameMatch || descMatch;
        })
        .slice(0, 3)
        .forEach((catalog: Record<string, unknown>) => {
          allSuggestions.push({
            id: catalog.id as string | number,
            type: "product-catalog",
            name: (catalog.name as string) || "Unnamed Catalog",
            description: (catalog.description as string) || undefined,
            url: getEntityUrl("product-catalog", catalog.id as string | number),
          });
        });
    }

    if (
      segmentCatalogsRes.status === "fulfilled" &&
      segmentCatalogsRes.value.success &&
      segmentCatalogsRes.value.data
    ) {
      const catalogs = Array.isArray(segmentCatalogsRes.value.data)
        ? segmentCatalogsRes.value.data
        : [];
      (catalogs as unknown[] as Record<string, unknown>[])
        .filter((catalog: Record<string, unknown>) => {
          const nameMatch = (catalog.name as string)
            ?.toLowerCase()
            .includes(queryLower);
          const descMatch = (catalog.description as string)
            ?.toLowerCase()
            .includes(queryLower);
          return nameMatch || descMatch;
        })
        .slice(0, 3)
        .forEach((catalog: Record<string, unknown>) => {
          allSuggestions.push({
            id: catalog.id as string | number,
            type: "segment-catalog",
            name: (catalog.name as string) || "Unnamed Catalog",
            description: (catalog.description as string) || undefined,
            url: getEntityUrl("segment-catalog", catalog.id as string | number),
          });
        });
    }

    if (
      campaignCatalogsRes.status === "fulfilled" &&
      campaignCatalogsRes.value.success &&
      campaignCatalogsRes.value.data
    ) {
      const catalogs = Array.isArray(campaignCatalogsRes.value.data)
        ? campaignCatalogsRes.value.data
        : [];
      (catalogs as unknown[] as Record<string, unknown>[])
        .filter((catalog: Record<string, unknown>) => {
          const nameMatch = (catalog.name as string)
            ?.toLowerCase()
            .includes(queryLower);
          const descMatch = (catalog.description as string)
            ?.toLowerCase()
            .includes(queryLower);
          return nameMatch || descMatch;
        })
        .slice(0, 3)
        .forEach((catalog: Record<string, unknown>) => {
          allSuggestions.push({
            id: catalog.id as string | number,
            type: "campaign-catalog",
            name: (catalog.name as string) || "Unnamed Catalog",
            description: (catalog.description as string) || undefined,
            url: getEntityUrl("campaign-catalog", catalog.id as string | number),
          });
        });
    }

    if (
      quicklistsRes.status === "fulfilled" &&
      quicklistsRes.value.success &&
      quicklistsRes.value.data
    ) {
      const quicklists = Array.isArray(quicklistsRes.value.data)
        ? quicklistsRes.value.data
        : [];
      (quicklists as unknown[] as Record<string, unknown>[])
        .filter((quicklist: Record<string, unknown>) => {
          const nameMatch = (quicklist.name as string)
            ?.toLowerCase()
            .includes(queryLower);
          const descMatch = (quicklist.description as string)
            ?.toLowerCase()
            .includes(queryLower);
          const typeMatch = (quicklist.upload_type as string)
            ?.toLowerCase()
            .includes(queryLower);
          return nameMatch || descMatch || typeMatch;
        })
        .slice(0, 3)
        .forEach((quicklist: Record<string, unknown>) => {
          allSuggestions.push({
            id: quicklist.id as string | number,
            type: "quicklist",
            name: (quicklist.name as string) || "Unnamed Quicklist",
            description:
              (quicklist.description as string) ||
              (quicklist.upload_type as string) ||
              undefined,
            url: getEntityUrl("quicklist", quicklist.id),
          });
        });
    }

    if (
      controlGroupsRes.status === "fulfilled" &&
      controlGroupsRes.value.control_groups
    ) {
      const controlGroups = Array.isArray(
        controlGroupsRes.value.control_groups,
      )
        ? controlGroupsRes.value.control_groups
        : [];
      (controlGroups as unknown[] as Record<string, unknown>[])
        .filter((group: Record<string, unknown>) => {
          const nameMatch = (group.name as string)
            ?.toLowerCase()
            .includes(queryLower);
          const descMatch = (group.description as string)
            ?.toLowerCase()
            .includes(queryLower);
          return nameMatch || descMatch;
        })
        .slice(0, 3)
        .forEach((group: Record<string, unknown>) => {
          allSuggestions.push({
            id: group.id as string | number,
            type: "control-group",
            name: (group.name as string) || "Unnamed Control Group",
            description: (group.description as string) || undefined,
            url: getEntityUrl("control-group", group.id),
          });
        });
    }

    if (customersRes.status === "fulfilled" && customersRes.value.data) {
      const customers = Array.isArray(customersRes.value.data)
        ? customersRes.value.data
        : [];
      (customers as unknown[] as Record<string, unknown>[])
        .slice(0, 3)
        .forEach((customer: Record<string, unknown>) => {
          allSuggestions.push({
            id: customer.id as string | number,
            type: "customer",
            name: (customer.msisdn as string) || "Unnamed Customer",
            description: (customer.phone as string) || undefined,
            url: getEntityUrl("customer", customer.id),
          });
        });
    }

    if (kpisRes.status === "fulfilled") {
      const [usageMetrics, revenueMetrics, systemEvents, subscriberProfiles] = kpisRes.value;
      const allKpis = [
        ...usageMetrics.map((m: any) => ({
          id: `um-${m.id}`,
          name: m.name,
          description: m.description,
          category: "Usage Metric",
          url: `/dashboard/kpis/usage-metrics/${m.id}`,
        })),
        ...revenueMetrics.map((m: any) => ({
          id: `rm-${m.id}`,
          name: m.name,
          description: m.description,
          category: "Revenue Metric",
          url: `/dashboard/kpis/revenue-metrics/${m.id}`,
        })),
        ...systemEvents.map((e: any) => ({
          id: `se-${e.id}`,
          name: e.name || e.event_name,
          description: e.description || e.event_description,
          category: "System Event",
          url: `/dashboard/kpis/system-events/${e.id}`,
        })),
        ...subscriberProfiles.map((p: any) => ({
          id: `sp-${p.id}`,
          name: p.name,
          description: p.description,
          category: "Subscriber Profile",
          url: `/dashboard/kpis/subscriber-profiles/${p.id}`,
        })),
      ];

      const matchingKpis = allKpis.filter(
        (kpi: any) =>
          (kpi.name || "").toLowerCase().includes(queryLower) ||
          (kpi.description || "").toLowerCase().includes(queryLower),
      );

      // Add up to 1 from each KPI type to show variety
      const kpisByCategory: Record<string, any[]> = {};
      matchingKpis.forEach((kpi: any) => {
        if (!kpisByCategory[kpi.category]) {
          kpisByCategory[kpi.category] = [];
        }
        kpisByCategory[kpi.category].push(kpi);
      });

      Object.values(kpisByCategory).forEach((categoryKpis: any[]) => {
        categoryKpis.slice(0, 1).forEach((kpi: any) => {
          allSuggestions.push({
            id: kpi.id,
            type: "kpi",
            name: kpi.name || "Unnamed KPI",
            description: `${kpi.category} - ${kpi.description || ""}`,
            url: kpi.url,
          });
        });
      });
    }

    allConfigurations
      .filter(
        (config) =>
          (config.name || "").toLowerCase().includes(query.toLowerCase()) ||
          (config.description || "")
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          (config.category || "").toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, 3)
      .forEach((config) => {
        allSuggestions.push({
          id: config.id,
          type: "configuration",
          name: config.name,
          description: config.description,
          url: config.navigationPath,
        });
      });

    return allSuggestions.slice(0, 10);
  } catch (error) {
    console.error("Failed to fetch search suggestions:", error);
    return [];
  }
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["globalSearch", query],
    queryFn: () => performSearch(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
