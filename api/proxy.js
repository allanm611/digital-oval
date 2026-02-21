// Vercel serverless function to proxy API requests
export default async function handler(req, res) {
  // Enable CORS with more specific headers
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:5173",
process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  if (
    allowedOrigins.includes(origin) ||
    process.env.NODE_ENV === "development"
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join("/") : path || "";

    // Construct the target URL
    const API_BASE_URL =
      process.env.VITE_API_BASE_URL ||
      process.env.API_BASE_URL ||
      "http://sentra.groupngs.com:8080/api/database-service";

    // Build query string from all query parameters except 'path'
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== "path") {
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, v));
        } else {
          queryParams.append(key, value);
        }
      }
    });

    const queryString = queryParams.toString();
    const targetUrl =
      `${API_BASE_URL}/${apiPath}` + (queryString ? `?${queryString}` : "");

    // Prepare headers for the backend request
    const headers = {};

    // Forward authorization header if present
    if (req.headers.authorization) {
      headers["Authorization"] = req.headers.authorization;
    }

    // For multipart/form-data, forward Content-Type as-is (with boundary)
    const isFormData = req.headers["content-type"]?.includes("multipart/form-data");
    if (isFormData && req.headers["content-type"]) {
      headers["Content-Type"] = req.headers["content-type"];
    } else if (req.method !== "GET" && req.method !== "HEAD") {
      headers["Content-Type"] = "application/json";
    }

    // Prepare request body
    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (isFormData) {
        // For multipart, use the raw body buffer (don't parse or modify)
        body = req.body;
      } else {
        // For JSON, stringify the body
        body = JSON.stringify(req.body);
      }
    }

    // Forward the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle different response types
    let data;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Forward response status and data
    res.status(response.status);

    if (typeof data === "string") {
      res.send(data);
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({
      error: "Proxy request failed",
      message: error.message,
      apiBaseUrlConfigured: !!process.env.API_BASE_URL,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
