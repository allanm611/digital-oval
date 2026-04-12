import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Target,
  Gift,
  Package,
  Users,
  FolderKanban,
  UserCheck,
  Settings,
  FolderTree,
  List,
  Shield,
} from "lucide-react";
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
import { Role } from "../../features/roles/types/role";
import { color, tw } from "../utils/utils";
import LoadingSpinner from "../components/ui/LoadingSpinner";

interface SearchResult {
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
    | "control-group";
  name: string;
  description?: string;
  url: string;
  metadata?: Record<string, unknown>;
}

interface SearchResults {
  campaigns: SearchResult[];
  offers: SearchResult[];
  products: SearchResult[];
  segments: SearchResult[];
  programs: SearchResult[];
  users: SearchResult[];
  configurations: SearchResult[];
  "offer-catalogs": SearchResult[];
  "product-catalogs": SearchResult[];
  "segment-catalogs": SearchResult[];
  "campaign-catalogs": SearchResult[];
  quicklists: SearchResult[];
  "control-groups": SearchResult[];
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResults>({
    campaigns: [],
    offers: [],
    products: [],
    segments: [],
    programs: [],
    users: [],
    configurations: [],
    "offer-catalogs": [],
    "product-catalogs": [],
    "segment-catalogs": [],
    "campaign-catalogs": [],
    quicklists: [],
    "control-groups": [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    | "all"
    | "campaign"
    | "offer"
    | "product"
    | "segment"
    | "program"
    | "user"
    | "configuration"
    | "quicklist"
  >("all");

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({
        campaigns: [],
        offers: [],
        products: [],
        segments: [],
        programs: [],
        users: [],
        configurations: [],
        "offer-catalogs": [],
        "product-catalogs": [],
        "segment-catalogs": [],
        "campaign-catalogs": [],
        quicklists: [],
        "control-groups": [],
      });
      return;
    }

    const searchQueryLower = searchQuery.toLowerCase();

    setIsLoading(true);
    setError(null);

    try {
      // Fetch roles to map role IDs to role names
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
        // Continue without role lookup
      }
      // Get configurations (frontend-only)
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
          id: "routes",
          name: "Routes",
          description: "Manage routes across all communication channels",
          type: "campaign",
          category: "Campaign Configuration",
          status: "active",
          navigationPath: "/dashboard/routes",
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
      ];

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
      ] = await Promise.allSettled([
        campaignService.getCampaigns({
          limit: 50,
          offset: 0,
          skipCache: true,
        }),
        offerService.searchOffers({
          search: searchQuery,
          limit: 50,
          offset: 0,
          skipCache: true,
        }),
        productService.searchProducts({
          q: searchQuery,
          limit: 50,
          offset: 0,
          skipCache: true,
        }),
        segmentService.getSegments({
          pageSize: 50,
          skipCache: true,
        }),
        programService.getAllPrograms({
          limit: 50,
          offset: 0,
          skipCache: true,
        }),
        userService.getUsers({
          skipCache: true,
        }),
        offerCategoryService.searchCategories({
          q: searchQuery,
          limit: 50,
          offset: 0,
          skipCache: true,
        }),
        productCategoryService.searchCategories({
          q: searchQuery,
          limit: 50,
          offset: 0,
          skipCache: true,
        }),
        searchQuery.trim()
          ? segmentService.searchSegmentCategories(searchQuery, true)
          : segmentService.getSegmentCategories(undefined, true),
        campaignService.searchCampaignCategories(searchQuery, {
          limit: 50,
          offset: 0,
          skipCache: true,
        }),
        quicklistService.getAllQuickLists({
          limit: 100,
          offset: 0,
        }),
        controlGroupService.listControlGroups({
          limit: 50,
          offset: 0,
        }),
      ]);

      const searchResults: SearchResults = {
        campaigns: [],
        offers: [],
        products: [],
        segments: [],
        programs: [],
        users: [],
        configurations: [],
        "offer-catalogs": [],
        "product-catalogs": [],
        "segment-catalogs": [],
        "campaign-catalogs": [],
        quicklists: [],
        "control-groups": [],
      };

      // Process campaigns
      if (campaignsRes.status === "fulfilled" && campaignsRes.value.data) {
        searchResults.campaigns = campaignsRes.value.data
          .filter((c) =>
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((campaign) => ({
            id: campaign.id,
            type: "campaign" as const,
            name: campaign.name || "Unnamed Campaign",
            description: campaign.description || undefined,
            url: `/dashboard/campaigns/${campaign.id}`,
            metadata: {
              status: campaign.status,
              approval_status: campaign.approval_status,
            },
          }));
      }

      // Process offers
      if (offersRes.status === "fulfilled" && offersRes.value.data) {
        searchResults.offers = offersRes.value.data.map((offer) => ({
          id: offer.id,
          type: "offer" as const,
          name: offer.name || "Unnamed Offer",
          description: offer.description || undefined,
          url: `/dashboard/offers/${offer.id}`,
          metadata: {
            status: offer.status,
            offer_type: offer.offer_type,
          },
        }));
      }

      // Process products
      if (productsRes.status === "fulfilled" && productsRes.value.data) {
        searchResults.products = productsRes.value.data.map((product) => ({
          id: product.id,
          type: "product" as const,
          name: product.name || "Unnamed Product",
          description: product.description || undefined,
          url: `/dashboard/products/${product.id}`,
          metadata: {
            is_active: product.is_active,
          },
        }));
      }

      // Process segments
      if (segmentsRes.status === "fulfilled" && segmentsRes.value.data) {
        searchResults.segments = segmentsRes.value.data
          .filter(
            (segment) =>
              segment.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              segment.description
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()),
          )
          .map((segment) => ({
            id: segment.id,
            type: "segment" as const,
            name: segment.name || "Unnamed Segment",
            description: segment.description || undefined,
            url: `/dashboard/segments/${segment.id}`,
            metadata: {
              type: segment.type,
              customer_count: segment.customer_count,
            },
          }));
      }

      // Process programs
      if (programsRes.status === "fulfilled" && programsRes.value.data) {
        searchResults.programs = programsRes.value.data
          .filter((p) =>
            p.name?.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((program) => ({
            id: program.id,
            type: "program" as const,
            name: program.name || "Unnamed Program",
            description: program.description || undefined,
            url: `/dashboard/programs/${program.id}`,
            metadata: {
              is_active: program.is_active,
            },
          }));
      }

      // Process users
      if (usersRes.status === "fulfilled" && usersRes.value.data) {
        const users = Array.isArray(usersRes.value.data)
          ? usersRes.value.data
          : [];
        searchResults.users = users
          .filter((user) => {
            if (!searchQuery.trim()) return true;
            const searchLower = searchQuery.toLowerCase();
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
          .map((user) => {
            const roleId = user.role_id || user.primary_role_id;
            const role = roleId ? roleLookup[roleId] : null;
            const roleName =
              role?.name ||
              user.role_name ||
              (roleId ? `Role ${roleId}` : "No Role");

            return {
              id: user.id,
              type: "user" as const,
              name:
                `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                user.username ||
                user.email_address ||
                "Unnamed User",
              description: user.email_address || user.department || undefined,
              url: `/dashboard/user-management/${user.id}`,
              metadata: {
                role: roleName,
              },
            };
          });
      }

      // Process configurations (frontend filtering)
      searchResults.configurations = allConfigurations
        .filter(
          (config) =>
            (config.name || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            (config.description || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            (config.category || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase()),
        )
        .map((config) => ({
          id: config.id,
          type: "configuration" as const,
          name: config.name,
          description: config.description,
          url: config.navigationPath,
          metadata: {
            category: config.category,
            type: config.type,
            status: config.status,
          },
        }));

      // Process offer catalogs
      if (
        offerCatalogsRes.status === "fulfilled" &&
        offerCatalogsRes.value.data
      ) {
        const catalogs = Array.isArray(offerCatalogsRes.value.data)
          ? offerCatalogsRes.value.data
          : offerCatalogsRes.value.data.categories || [];
        searchResults["offer-catalogs"] = catalogs.map(
          (catalog: Record<string, unknown>) => ({
            id: catalog.id,
            type: "offer-catalog" as const,
            name: catalog.name || "Unnamed Catalog",
            description: catalog.description || undefined,
            url: `/dashboard/offer-catalogs`,
            metadata: {
              is_active: catalog.is_active,
              offer_count: catalog.offer_count,
            },
          }),
        );
      }

      // Process product catalogs
      if (
        productCatalogsRes.status === "fulfilled" &&
        productCatalogsRes.value.data
      ) {
        const catalogs = Array.isArray(productCatalogsRes.value.data)
          ? productCatalogsRes.value.data
          : [];
        searchResults["product-catalogs"] = catalogs
          .filter((catalog: Record<string, unknown>) => {
            const nameMatch = catalog.name
              ?.toLowerCase()
              .includes(searchQueryLower);
            const descMatch = catalog.description
              ?.toLowerCase()
              .includes(searchQueryLower);
            return nameMatch || descMatch;
          })
          .map((catalog: Record<string, unknown>) => ({
            id: catalog.id,
            type: "product-catalog" as const,
            name: catalog.name || "Unnamed Catalog",
            description: catalog.description || undefined,
            url: `/dashboard/products/catalogs`,
            metadata: {
              is_active: catalog.is_active,
              product_count: catalog.product_count,
            },
          }));
      }

      // Process segment catalogs
      if (
        segmentCatalogsRes.status === "fulfilled" &&
        segmentCatalogsRes.value.success &&
        segmentCatalogsRes.value.data
      ) {
        const catalogs = Array.isArray(segmentCatalogsRes.value.data)
          ? segmentCatalogsRes.value.data
          : [];
        searchResults["segment-catalogs"] = catalogs.map(
          (catalog: Record<string, unknown>) => ({
            id: catalog.id,
            type: "segment-catalog" as const,
            name: catalog.name || "Unnamed Catalog",
            description: catalog.description || undefined,
            url: `/dashboard/segment-catalogs`,
            metadata: {
              segment_count: catalog.segment_count,
            },
          }),
        );
      }

      // Process campaign catalogs
      if (
        campaignCatalogsRes.status === "fulfilled" &&
        campaignCatalogsRes.value.success &&
        campaignCatalogsRes.value.data
      ) {
        const catalogs = Array.isArray(campaignCatalogsRes.value.data)
          ? campaignCatalogsRes.value.data
          : [];
        searchResults["campaign-catalogs"] = catalogs.map(
          (catalog: Record<string, unknown>) => ({
            id: catalog.id,
            type: "campaign-catalog" as const,
            name: catalog.name || "Unnamed Catalog",
            description: catalog.description || undefined,
            url: `/dashboard/campaign-catalogs`,
            metadata: {
              campaign_count: catalog.campaign_count,
            },
          }),
        );
      }

      // Process quicklists
      if (
        quicklistsRes.status === "fulfilled" &&
        quicklistsRes.value.success &&
        quicklistsRes.value.data
      ) {
        const quicklists = Array.isArray(quicklistsRes.value.data)
          ? quicklistsRes.value.data
          : [];
        searchResults.quicklists = quicklists
          .filter((quicklist: Record<string, unknown>) => {
            const nameMatch = quicklist.name
              ?.toLowerCase()
              .includes(searchQueryLower);
            const descMatch = quicklist.description
              ?.toLowerCase()
              .includes(searchQueryLower);
            const typeMatch = quicklist.upload_type
              ?.toLowerCase()
              .includes(searchQueryLower);
            return nameMatch || descMatch || typeMatch;
          })
          .map((quicklist: Record<string, unknown>) => ({
            id: quicklist.id,
            type: "quicklist" as const,
            name: quicklist.name || "Unnamed Quicklist",
            description:
              quicklist.description || quicklist.upload_type || undefined,
            url: `/dashboard/quick-lists/${quicklist.id}`,
            metadata: {
              upload_type: quicklist.upload_type,
              rows_imported: quicklist.rows_imported,
              processing_status: quicklist.processing_status,
            },
          }));
      }

      // Process control groups
      if (
        controlGroupsRes.status === "fulfilled" &&
        controlGroupsRes.value.control_groups
      ) {
        const controlGroups = Array.isArray(
          controlGroupsRes.value.control_groups,
        )
          ? controlGroupsRes.value.control_groups
          : [];
        searchResults["control-groups"] = controlGroups
          .filter((group: Record<string, unknown>) => {
            const nameMatch = (group.name as string)
              ?.toLowerCase()
              .includes(searchQueryLower);
            const descMatch = (group.description as string)
              ?.toLowerCase()
              .includes(searchQueryLower);
            return nameMatch || descMatch;
          })
          .map((group: Record<string, unknown>) => ({
            id: group.id as string | number,
            type: "control-group" as const,
            name: (group.name as string) || "Unnamed Control Group",
            description: (group.description as string) || undefined,
            url: `/dashboard/control-groups/${group.id}`,
            metadata: {
              is_active: group.is_active,
            },
          }));
      }

      // Set all results to state
      setResults(searchResults);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to perform search. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query, performSearch]);

  // Category filter buttons (similar to config page)
  const categories = [
    {
      id: "all" as const,
      name: "All Results",
      count:
        results.campaigns.length +
        results.offers.length +
        results.products.length +
        results.segments.length +
        results.programs.length +
        results.users.length +
        results.configurations.length +
        results["offer-catalogs"].length +
        results["product-catalogs"].length +
        results["segment-catalogs"].length +
        results["campaign-catalogs"].length +
        results.quicklists.length +
        results["control-groups"].length,
    },
    {
      id: "campaign" as const,
      name: "Campaigns",
      count: results.campaigns.length + results["campaign-catalogs"].length,
    },
    {
      id: "offer" as const,
      name: "Offers",
      count: results.offers.length + results["offer-catalogs"].length,
    },
    {
      id: "product" as const,
      name: "Products",
      count: results.products.length + results["product-catalogs"].length,
    },
    {
      id: "segment" as const,
      name: "Segments",
      count: results.segments.length + results["segment-catalogs"].length,
    },
    {
      id: "program" as const,
      name: "Programs",
      count: results.programs.length,
    },
    {
      id: "user" as const,
      name: "Users",
      count: results.users.length,
    },
    {
      id: "configuration" as const,
      name: "Configurations",
      count: results.configurations.length,
    },
    {
      id: "quicklist" as const,
      name: "Quicklists",
      count: results.quicklists.length,
    },
    {
      id: "control-group" as const,
      name: "Control Groups",
      count: results["control-groups"].length,
    },
  ];

  // Filter results by selected category
  const getFilteredResults = (): SearchResults => {
    if (selectedCategory === "all") {
      return results;
    }

    const filtered: SearchResults = {
      campaigns: [],
      offers: [],
      products: [],
      segments: [],
      programs: [],
      users: [],
      configurations: [],
      "offer-catalogs": [],
      "product-catalogs": [],
      "segment-catalogs": [],
      "campaign-catalogs": [],
      quicklists: [],
      "control-groups": [],
    };

    if (selectedCategory === "campaign") {
      filtered.campaigns = results.campaigns;
      filtered["campaign-catalogs"] = results["campaign-catalogs"];
    } else if (selectedCategory === "offer") {
      filtered.offers = results.offers;
      filtered["offer-catalogs"] = results["offer-catalogs"];
    } else if (selectedCategory === "product") {
      filtered.products = results.products;
      filtered["product-catalogs"] = results["product-catalogs"];
    } else if (selectedCategory === "segment") {
      filtered.segments = results.segments;
      filtered["segment-catalogs"] = results["segment-catalogs"];
    } else if (selectedCategory === "program") {
      filtered.programs = results.programs;
    } else if (selectedCategory === "user") {
      filtered.users = results.users;
    } else if (selectedCategory === "configuration") {
      filtered.configurations = results.configurations;
    } else if (selectedCategory === "quicklist") {
      filtered.quicklists = results.quicklists;
    } else if (selectedCategory === "control-group") {
      filtered["control-groups"] = results["control-groups"];
    }

    return filtered;
  };

  const filteredResults = getFilteredResults();

  const getTypeInfo = (type: SearchResult["type"]) => {
    const types = {
      campaign: {
        label: "Campaign",
        icon: Target,
      },
      offer: {
        label: "Offer",
        icon: Gift,
      },
      product: {
        label: "Product",
        icon: Package,
      },
      segment: {
        label: "Segment",
        icon: Users,
      },
      program: {
        label: "Program",
        icon: FolderKanban,
      },
      user: {
        label: "User",
        icon: UserCheck,
      },
      configuration: {
        label: "Configuration",
        icon: Settings,
      },
      "offer-catalog": {
        label: "Offer Catalog",
        icon: FolderTree,
      },
      "product-catalog": {
        label: "Product Catalog",
        icon: FolderTree,
      },
      "segment-catalog": {
        label: "Segment Catalog",
        icon: FolderTree,
      },
      "campaign-catalog": {
        label: "Campaign Catalog",
        icon: FolderTree,
      },
      quicklist: {
        label: "Quicklist",
        icon: List,
      },
      "control-group": {
        label: "Control Group",
        icon: Shield,
      },
    };
    return types[type];
  };

  const totalResults =
    filteredResults.campaigns.length +
    filteredResults.offers.length +
    filteredResults.products.length +
    filteredResults.segments.length +
    filteredResults.programs.length +
    filteredResults.users.length +
    filteredResults.configurations.length +
    filteredResults["offer-catalogs"].length +
    filteredResults["product-catalogs"].length +
    filteredResults["segment-catalogs"].length +
    filteredResults["campaign-catalogs"].length +
    filteredResults.quicklists.length +
    filteredResults["control-groups"].length;

  const renderResultsSection = (
    title: string,
    items: SearchResult[],
    type: SearchResult["type"],
  ) => {
    if (items.length === 0) return null;

    const typeInfo = getTypeInfo(type);
    const Icon = typeInfo.icon;

    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Icon className="h-5 w-5 text-gray-600" />
          <h3 className={`text-lg font-semibold ${tw.textPrimary}`}>
            {title} ({items.length})
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => navigate(item.url)}
              className={`text-left p-4 border border-gray-200 ${tw.rounded} hover:bg-gray-50 transition-all`}
              style={{ backgroundColor: color.surface.cards }}
            >
              <div className="flex items-start gap-3 mb-2">
                <Icon className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 line-clamp-2">
                    {item.name}
                  </h4>
                  <span className="text-xs text-gray-500 mt-1 inline-block">
                    {typeInfo.label}
                  </span>
                </div>
              </div>
              {item.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2 ml-7">
                  {item.description}
                </p>
              )}
              {item.metadata && (
                <div className="flex flex-wrap gap-2 mt-2 ml-7">
                  {Object.entries(item.metadata).map(([key, value]) => (
                    <span
                      key={key}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                    >
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            Search Results
          </h1>
          {query && (
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              {isLoading
                ? "Searching..."
                : totalResults > 0
                  ? `Found ${totalResults} result${
                      totalResults !== 1 ? "s" : ""
                    } for "${query}"`
                  : `No results found for "${query}"`}
            </p>
          )}
        </div>
      </div>

      {/* Category Filters (similar to config page) */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner variant="modern" size="xl" color="primary" />
          <p className={`${tw.textMuted} mt-4`}>Searching...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}>
          <p className="text-gray-900">{error}</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && (
        <>
          {totalResults === 0 ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
                No results found
              </h3>
              <p className={`${tw.textSecondary} mb-4`}>
                Try adjusting your search terms or search for something else.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {renderResultsSection(
                "Campaigns",
                filteredResults.campaigns,
                "campaign",
              )}
              {renderResultsSection(
                "Campaign Catalogs",
                filteredResults["campaign-catalogs"],
                "campaign-catalog",
              )}
              {renderResultsSection("Offers", filteredResults.offers, "offer")}
              {renderResultsSection(
                "Offer Catalogs",
                filteredResults["offer-catalogs"],
                "offer-catalog",
              )}
              {renderResultsSection(
                "Products",
                filteredResults.products,
                "product",
              )}
              {renderResultsSection(
                "Product Catalogs",
                filteredResults["product-catalogs"],
                "product-catalog",
              )}
              {renderResultsSection(
                "Segments",
                filteredResults.segments,
                "segment",
              )}
              {renderResultsSection(
                "Segment Catalogs",
                filteredResults["segment-catalogs"],
                "segment-catalog",
              )}
              {renderResultsSection(
                "Programs",
                filteredResults.programs,
                "program",
              )}
              {renderResultsSection("Users", filteredResults.users, "user")}
              {renderResultsSection(
                "Configurations",
                filteredResults.configurations,
                "configuration",
              )}
              {renderResultsSection(
                "Quicklists",
                filteredResults.quicklists,
                "quicklist",
              )}
              {renderResultsSection(
                "Control Groups",
                filteredResults["control-groups"],
                "control-group",
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
