// this file setsup how sentra frontend communicates with the backend .
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const isVercel =
  window.location.hostname.includes("vercel.app") ||
  window.location.hostname.includes(".vercel.app");

// Determine API base URL based on environment:
// - Vercel: use proxy (serverless function)
// - Localhost: use .env value (http://sentra.groupngs.com:8080/api/database-service)
// - UAT/Production: use dynamic URL (same host)
const getApiBaseUrl = () => {
  if (isVercel) {
    return "/api/proxy";
  }
  if (isLocalhost) {
    // Local development: use .env value
    return (
      import.meta.env.VITE_API_BASE_URL ||
      "http://sentra.groupngs.com:8080/api/database-service"
    );
  }
  // UAT/Production: use dynamic URL (server will proxy to backend)
  return `${window.location.protocol}//${window.location.host}/api/database-service`;
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  ENDPOINTS: {
    OFFERS: "/offers",
    PRODUCTS: "/products",
    CATEGORIES: "/categories",
    OFFER_CATEGORIES: "/offer-categories",
    CAMPAIGNS: "/campaigns",
    SEGMENTS: "/segments",
    OFFER_PRODUCTS: "/offer-products",
    OFFER_CREATIVES: "/offer-creatives",
    NOTIFICATIONS: "/notifications",
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to build URLs for file uploads
// Uses the regular API endpoint (which routes through proxy on Vercel)
// The proxy has been optimized to handle multipart/form-data correctly
export const buildDirectBackendUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (includeContentType: boolean = true) => {
  // Check both possible token keys (authToken and auth_token for compatibility)
  const token =
    localStorage.getItem("authToken") || localStorage.getItem("auth_token");

  const headers: Record<string, string> = {};

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn(
      " WARNING: No auth token found in localStorage. Request will be sent without Authorization header."
    );
    console.warn(" Checked keys: 'authToken' and 'auth_token'");
    console.warn(" Please ensure you are logged in.");
  }

  return headers;
};
