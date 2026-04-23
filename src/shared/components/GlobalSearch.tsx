import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Clock,
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
import { InputAdornment, TextField } from "@mui/material";
import { AutoAwesome } from "@mui/icons-material";
import { color } from "../utils/utils";
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
import { tw, zIndex } from "../utils/utils";

interface SearchSuggestion {
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
}

interface GlobalSearchProps {
  onClose?: () => void;
}

const QUICK_SEARCHES = [
  {
    label: "Campaigns",
    icon: Target,
    url: "/dashboard/campaigns",
  },
  {
    label: "Offers",
    icon: Gift,
    url: "/dashboard/offers",
  },
  {
    label: "Products",
    icon: Package,
    url: "/dashboard/products",
  },
  {
    label: "Segments",
    icon: Users,
    url: "/dashboard/segments",
  },
  {
    label: "Programs",
    icon: FolderKanban,
    url: "/dashboard/programs",
  },
];

export default function GlobalSearch({ onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Load recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("recentSearches");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to parse recentSearches from localStorage:", error);
      // Clear corrupted data
      localStorage.removeItem("recentSearches");
      return [];
    }
  });

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
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
        {
          id: "control-groups-segment",
          name: "Universal Control Groups",
          description: "Configure and manage universal control groups for segments",
          type: "segment",
          category: "Segment Configuration",
          status: "active",
          navigationPath: "/dashboard/control-groups",
        },
      ];

      const queryLower = query.toLowerCase();

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
      ]);

      const allSuggestions: SearchSuggestion[] = [];

      // Process campaigns
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
              url: `/dashboard/campaigns/${campaign.id}`,
            });
          });
      }

      // Process offers
      if (offersRes.status === "fulfilled" && offersRes.value.data) {
        offersRes.value.data.slice(0, 3).forEach((offer) => {
          allSuggestions.push({
            id: offer.id,
            type: "offer",
            name: offer.name || "Unnamed Offer",
            description: offer.description || undefined,
            url: `/dashboard/offers/${offer.id}`,
          });
        });
      }

      // Process products
      if (productsRes.status === "fulfilled" && productsRes.value.data) {
        productsRes.value.data.slice(0, 3).forEach((product) => {
          allSuggestions.push({
            id: product.id,
            type: "product",
            name: product.name || "Unnamed Product",
            description: product.description || undefined,
            url: `/dashboard/products/${product.id}`,
          });
        });
      }

      // Process segments
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
              url: `/dashboard/segments/${segment.id}`,
            });
          });
      }

      // Process programs
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
              url: `/dashboard/programs/${program.id}`,
            });
          });
      }

      // Process users
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
              url: `/dashboard/user-management/${user.id}`,
            });
          });
      }

      // Process offer catalogs
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
              url: `/dashboard/offer-catalogs`,
            });
          });
      }

      // Process product catalogs
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
              url: `/dashboard/products/catalogs`,
            });
          });
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
              url: `/dashboard/segment-catalogs`,
            });
          });
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
              url: `/dashboard/campaign-catalogs`,
            });
          });
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
              url: `/dashboard/manual-communication/${quicklist.id}`,
            });
          });
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
              url: `/dashboard/control-groups/${group.id}`,
            });
          });
      }

      // Process configurations (frontend filtering)
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

      setSuggestions(allSuggestions.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch search suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchSuggestions(searchTerm);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, fetchSuggestions]);

  // Handle input focus
  const handleFocus = () => {
    setShowSuggestions(true);
  };

  // Handle input blur
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Handle search submission
  const handleSearch = (query?: string) => {
    const searchQuery = query || searchTerm.trim();
    if (!searchQuery) return;

    // Save to recent searches
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    // Navigate to search results
    navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    setShowSuggestions(false);
    onClose?.();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Always go to search results page when Enter is pressed
      // Users can click on suggestions if they want to navigate directly
      handleSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      onClose?.();
    }
  };

  // Get type label and icon
  const getTypeInfo = (type: SearchSuggestion["type"]) => {
    const types = {
      campaign: { label: "Campaign", icon: Target },
      offer: { label: "Offer", icon: Gift },
      product: { label: "Product", icon: Package },
      segment: { label: "Segment", icon: Users },
      program: { label: "Program", icon: FolderKanban },
      user: { label: "User", icon: UserCheck },
      configuration: { label: "Configuration", icon: Settings },
      "offer-catalog": { label: "Offer Catalog", icon: FolderTree },
      "product-catalog": { label: "Product Catalog", icon: FolderTree },
      "segment-catalog": { label: "Segment Catalog", icon: FolderTree },
      "campaign-catalog": { label: "Campaign Catalog", icon: FolderTree },
      quicklist: { label: "Quicklist", icon: List },
      "control-group": { label: "Control Group", icon: Shield },
    };
    return types[type];
  };

  const hasSearchResults =
    searchTerm.trim().length >= 2 && suggestions.length > 0;
  const showQuickSearches = !searchTerm.trim() || searchTerm.trim().length < 2;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 max-w-2xl mx-auto"
      style={{ zIndex: zIndex.popover }}
    >
      <TextField
        inputRef={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Global Search..."
        variant="outlined"
        size="small"
        fullWidth
        inputProps={{ autoComplete: "off" }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AutoAwesome
                fontSize="medium"
                sx={{
                  color: color.primary.accent,
                  marginLeft: "8px",
                  marginRight: "-10px",
                }}
              />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
                className={`p-1.5 text-white/70 hover:text-white ${tw.rounded} hover:bg-white/10 transition-colors border-0 bg-transparent cursor-pointer`}
              >
                <X className="h-4 w-4" />
              </button>
            </InputAdornment>
          ),
        }}
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: "0.375rem",
          "& .MuiOutlinedInput-root": {
            color: "white",
            padding: "0",
            "& fieldset": {
              borderColor: "transparent",
            },
            "&:hover fieldset": {
              borderColor: "transparent",
            },
            "&.Mui-focused fieldset": {
              borderColor: "rgb(96, 165, 250)",
              borderWidth: "2px",
            },
          },
          "& .MuiOutlinedInput-input": {
            padding: "10px 12px",
            fontSize: "0.875rem",
            "&::placeholder": {
              color: "rgba(255, 255, 255, 1)",
              opacity: 1,
            },
          },
        }}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white ${tw.rounded} shadow-lg border border-gray-200 max-h-[600px] overflow-y-auto`}
          style={{
            zIndex: zIndex.popover,
            width: "100%",
            maxWidth: "calc(100% + 0px)",
          }}
        >
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-600">Searching...</p>
            </div>
          ) : hasSearchResults ? (
            <>
              {/* Search Results */}
              <div className="py-2">
                <div className="px-4 py-2">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Results
                  </h3>
                </div>
                <div>
                  {suggestions.map((suggestion, index) => {
                    const typeInfo = getTypeInfo(suggestion.type);
                    const Icon = typeInfo.icon;
                    return (
                      <button
                        key={`${suggestion.type}-${suggestion.id}`}
                        onClick={() => {
                          navigate(suggestion.url);
                          setShowSuggestions(false);
                          onClose?.();
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          selectedIndex === index ? "bg-gray-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {suggestion.name}
                            </p>
                            {suggestion.description && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {suggestion.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {typeInfo.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* View All Results */}
              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={() => handleSearch()}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 rounded transition-colors"
                >
                  View all results for "{searchTerm}"
                </button>
              </div>
            </>
          ) : showQuickSearches ? (
            <div className="py-4">
              {/* Quick Searches Section */}
              <div className="px-4 py-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Quick Access
                </h3>
              </div>
              <div>
                {QUICK_SEARCHES.map((quickSearch) => {
                  const Icon = quickSearch.icon;
                  return (
                    <button
                      key={quickSearch.label}
                      onClick={() => {
                        navigate(quickSearch.url);
                        setShowSuggestions(false);
                        onClose?.();
                      }}
                      className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <Icon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900 text-sm">
                        {quickSearch.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="border-t border-gray-200 mt-2">
                  <div className="px-4 py-2 mt-2">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Recent Searches
                    </h3>
                  </div>
                  <div>
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchTerm(search);
                          handleSearch(search);
                        }}
                        className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <Clock className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <span className="text-gray-900 text-sm">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                No results found
              </p>
              <p className="text-xs text-gray-600 mb-4">
                Try adjusting your search terms
              </p>
              <button
                onClick={() => handleSearch()}
                className="text-sm text-gray-900 hover:text-gray-700 transition-colors"
              >
                View all results
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
