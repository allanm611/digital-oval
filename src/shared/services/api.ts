// API Configuration
// Base URL is dynamically constructed based on the current host
// Can be overridden via environment variable VITE_API_BASE_URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.host}/api/database-service`;

// Detect if we're on Vercel (use proxy) or on other deployments (direct connection)
const isVercel =
  window.location.hostname.includes("vercel.app") ||
  window.location.hostname.includes(".vercel.app");

export const API_CONFIG = {
  // On Vercel: use proxy (serverless function)
  // On other deployments (UAT, production): use direct connection to backend on same host
  BASE_URL: isVercel ? "/api/proxy" : API_BASE_URL,
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
      "⚠️ WARNING: No auth token found in localStorage. Request will be sent without Authorization header."
    );
    console.warn("⚠️ Checked keys: 'authToken' and 'auth_token'");
    console.warn("⚠️ Please ensure you are logged in.");
  }

  return headers;
};
