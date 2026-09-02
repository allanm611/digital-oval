import { generateCreativeMessage } from "../lib/generateCreativeMessage.js";

export const config = {
  maxDuration: 30,
};

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function hasBearerToken(req) {
  const header = String(req.headers.authorization || "");
  return /^Bearer\s+\S+/i.test(header);
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string" && req.body.trim()) {
    return JSON.parse(req.body);
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 32 * 1024) {
      const error = new Error("Payload too large");
      error.code = "PAYLOAD_TOO_LARGE";
      throw error;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
    return;
  }

  if (!hasBearerToken(req)) {
    sendJson(res, 401, {
      error: "Sign in to generate AI message content.",
      code: "UNAUTHORIZED",
    });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await generateCreativeMessage({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      body,
    });
    sendJson(res, result.status, result.payload);
  } catch (error) {
    if (error?.code === "PAYLOAD_TOO_LARGE") {
      sendJson(res, 413, { error: "Request is too large.", code: "PAYLOAD_TOO_LARGE" });
      return;
    }
    sendJson(res, 400, { error: "Invalid JSON body.", code: "INVALID_JSON" });
  }
}
