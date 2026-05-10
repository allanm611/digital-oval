import { useState, useEffect, useRef } from "react";
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
import { tw, zIndex } from "../utils/utils";
import { useGlobalSearch, type SearchSuggestion } from "../hooks/useGlobalSearch";

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
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("recentSearches");
      return stored ? JSON.parse(stored) : [];
    } catch {
      localStorage.removeItem("recentSearches");
      return [];
    }
  });

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  const { data: suggestions = [], isLoading } = useGlobalSearch(debouncedTerm);

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleSearch = (query?: string) => {
    const searchQuery = query || searchTerm.trim();
    if (!searchQuery) return;

    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    setShowSuggestions(false);
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
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
      customer: { label: "Customer", icon: Users },
      kpi: { label: "KPI", icon: Target },
      role: { label: "Role", icon: Shield },
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
                  setDebouncedTerm("");
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

      {showSuggestions && (
        <div
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
