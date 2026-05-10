import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
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
    | "control-group"
    | "customer"
    | "kpi"
    | "subscriber-profile"
    | "role";
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
  customers: SearchResult[];
  kpis: SearchResult[];
  "subscriber-profiles": SearchResult[];
  roles: SearchResult[];
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [selectedCategory, setSelectedCategory] = useState<
    | "all"
    | "campaign"
    | "offer"
    | "product"
    | "segment"
    | "program"
    | "user"
    | "configuration"
    | "customer"
  >("all");

  const { data: cachedSuggestions = [], isLoading } = useGlobalSearch(query);

  const results = useMemo(() => {
    if (!query.trim()) {
      return {
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
        customers: [],
        kpis: [],
        "subscriber-profiles": [],
        roles: [],
      };
    }

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
      customers: [],
      kpis: [],
      "subscriber-profiles": [],
      roles: [],
    };

    cachedSuggestions.forEach((suggestion) => {
      const result = {
        id: suggestion.id,
        type: suggestion.type as any,
        name: suggestion.name,
        description: suggestion.description,
        url: suggestion.url,
      };

      switch (suggestion.type) {
        case "campaign":
          searchResults.campaigns.push(result);
          break;
        case "offer":
          searchResults.offers.push(result);
          break;
        case "product":
          searchResults.products.push(result);
          break;
        case "segment":
          searchResults.segments.push(result);
          break;
        case "program":
          searchResults.programs.push(result);
          break;
        case "user":
          searchResults.users.push(result);
          break;
        case "configuration":
          searchResults.configurations.push(result);
          break;
        case "offer-catalog":
          searchResults["offer-catalogs"].push(result);
          break;
        case "product-catalog":
          searchResults["product-catalogs"].push(result);
          break;
        case "segment-catalog":
          searchResults["segment-catalogs"].push(result);
          break;
        case "campaign-catalog":
          searchResults["campaign-catalogs"].push(result);
          break;
        case "quicklist":
          searchResults.quicklists.push(result);
          break;
        case "control-group":
          searchResults["control-groups"].push(result);
          break;
        case "customer":
          searchResults.customers.push(result);
          break;
        case "kpi":
          searchResults.kpis.push(result);
          break;
        case "subscriber-profile":
          searchResults["subscriber-profiles"].push(result);
          break;
        case "role":
          searchResults.roles.push(result);
          break;
      }
    });

    return searchResults;
  }, [query, cachedSuggestions]);

  // Category filter buttons (similar to config page)
  const categories = [
    {
      id: "all" as const,
      name: "All Results",
      count:
        (results.campaigns?.length || 0) +
        (results.offers?.length || 0) +
        (results.products?.length || 0) +
        (results.segments?.length || 0) +
        (results.programs?.length || 0) +
        (results.users?.length || 0) +
        (results.configurations?.length || 0) +
        (results["offer-catalogs"]?.length || 0) +
        (results["product-catalogs"]?.length || 0) +
        (results["segment-catalogs"]?.length || 0) +
        (results["campaign-catalogs"]?.length || 0) +
        (results.quicklists?.length || 0) +
        (results["control-groups"]?.length || 0) +
        (results.customers?.length || 0) +
        (results.kpis?.length || 0) +
        (results["subscriber-profiles"]?.length || 0) +
        (results.roles?.length || 0),
    },
    {
      id: "campaign" as const,
      name: "Campaigns",
      count: (results.campaigns?.length || 0) + (results["campaign-catalogs"]?.length || 0) + (results["control-groups"]?.length || 0),
    },
    {
      id: "offer" as const,
      name: "Offers",
      count: (results.offers?.length || 0) + (results["offer-catalogs"]?.length || 0),
    },
    {
      id: "product" as const,
      name: "Products",
      count: (results.products?.length || 0) + (results["product-catalogs"]?.length || 0),
    },
    {
      id: "segment" as const,
      name: "Segments",
      count: (results.segments?.length || 0) + (results["segment-catalogs"]?.length || 0) + (results.quicklists?.length || 0),
    },
    {
      id: "program" as const,
      name: "Programs",
      count: results.programs?.length || 0,
    },
    {
      id: "user" as const,
      name: "Users",
      count: (results.users?.length || 0) + (results.roles?.length || 0),
    },
    {
      id: "configuration" as const,
      name: "Configurations",
      count: (results.configurations?.length || 0) + (results.kpis?.length || 0) + (results["subscriber-profiles"]?.length || 0),
    },
    {
      id: "customer" as const,
      name: "Customers",
      count: results.customers?.length || 0,
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
      customers: [],
      kpis: [],
      "subscriber-profiles": [],
      roles: [],
    };

    if (selectedCategory === "campaign") {
      filtered.campaigns = results.campaigns;
      filtered["campaign-catalogs"] = results["campaign-catalogs"];
      filtered["control-groups"] = results["control-groups"];
    } else if (selectedCategory === "offer") {
      filtered.offers = results.offers;
      filtered["offer-catalogs"] = results["offer-catalogs"];
    } else if (selectedCategory === "product") {
      filtered.products = results.products;
      filtered["product-catalogs"] = results["product-catalogs"];
    } else if (selectedCategory === "segment") {
      filtered.segments = results.segments;
      filtered["segment-catalogs"] = results["segment-catalogs"];
      filtered.quicklists = results.quicklists;
    } else if (selectedCategory === "program") {
      filtered.programs = results.programs;
    } else if (selectedCategory === "user") {
      filtered.users = results.users;
      filtered.roles = results.roles;
    } else if (selectedCategory === "configuration") {
      filtered.configurations = results.configurations;
      filtered.kpis = results.kpis;
      filtered["subscriber-profiles"] = results["subscriber-profiles"];
    } else if (selectedCategory === "customer") {
      filtered.customers = results.customers;
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
      customer: {
        label: "Customer",
        icon: Users,
      },
      kpi: {
        label: "KPI",
        icon: Target,
      },
      "subscriber-profile": {
        label: "Subscriber Profile",
        icon: Users,
      },
      role: {
        label: "Role",
        icon: Shield,
      },
    };
    return types[type];
  };

  const totalResults =
    (filteredResults.campaigns?.length || 0) +
    (filteredResults.offers?.length || 0) +
    (filteredResults.products?.length || 0) +
    (filteredResults.segments?.length || 0) +
    (filteredResults.programs?.length || 0) +
    (filteredResults.users?.length || 0) +
    (filteredResults.configurations?.length || 0) +
    (filteredResults["offer-catalogs"]?.length || 0) +
    (filteredResults["product-catalogs"]?.length || 0) +
    (filteredResults["segment-catalogs"]?.length || 0) +
    (filteredResults["campaign-catalogs"]?.length || 0) +
    (filteredResults.quicklists?.length || 0) +
    (filteredResults["control-groups"]?.length || 0) +
    (filteredResults.customers?.length || 0) +
    (filteredResults.kpis?.length || 0) +
    (filteredResults["subscriber-profiles"]?.length || 0) +
    (filteredResults.roles?.length || 0);

  const renderResultsSection = (
    title: string,
    items: SearchResult[],
    type: SearchResult["type"],
  ) => {
    if (!items || items.length === 0) return null;

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

      {/* Results */}
      {!isLoading && (
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
              {renderResultsSection("Roles", filteredResults.roles, "role")}
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
              {renderResultsSection(
                "Customers",
                filteredResults.customers,
                "customer",
              )}
              {renderResultsSection("KPIs", filteredResults.kpis, "kpi")}
              {renderResultsSection(
                "Subscriber Profiles",
                filteredResults["subscriber-profiles"],
                "subscriber-profile",
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
