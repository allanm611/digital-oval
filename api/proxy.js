// Vercel serverless function to proxy API requests
// Critical: Disable Vercel's default body parser for multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Enable CORS with more specific headers
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://sentra-wheat.vercel.app",
    "https://sentra-uat.vercel.app",

    // Replace with your actual Vercel domain
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
    "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin",
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
    // Use environment variable or default to the backend URL
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

    // Log for debugging in production
    // console.log("Proxy request:", {
    //   method: req.method,
    //   apiPath,
    //   queryString,
    //   targetUrl,
    //   hasApiBaseUrl: !!process.env.API_BASE_URL,
    // });

    // Prepare headers for the backend request
    const headers = {};

    // Forward authorization header if present
    if (req.headers.authorization) {
      headers["Authorization"] = req.headers.authorization;
    }

    // Check if this is a multipart form data request
    const isMultipart =
      req.headers["content-type"] &&
      req.headers["content-type"].includes("multipart/form-data");

    // Prepare request body
    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const isMultipart =
        req.headers["content-type"] &&
        req.headers["content-type"].includes("multipart/form-data");

      // Read the request stream into a buffer
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      if (isMultipart) {
        // For multipart, send the raw buffer with original content-type
        body = buffer;
        headers["Content-Type"] = req.headers["content-type"];
      } else {
        // For JSON, convert to string
        body = buffer.toString();
        headers["Content-Type"] = "application/json";
      }
    }

    // Forward the request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

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
