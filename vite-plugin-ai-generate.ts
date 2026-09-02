import { generateCreativeMessage } from "./api/lib/generateCreativeMessage.js";

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function hasBearerToken(req) {
  const header = String(req.headers.authorization || "");
  return /^Bearer\s+\S+/i.test(header);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 32 * 1024) {
        reject(Object.assign(new Error("Payload too large"), { code: "PAYLOAD_TOO_LARGE" }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(Object.assign(new Error("Invalid JSON body"), { code: "INVALID_JSON" }));
      }
    });
    req.on("error", reject);
  });
}

export function aiGeneratePlugin({ apiKey, model }) {
  return {
    name: "ai-generate-creative",
    configureServer(server) {
      server.middlewares.use("/api/ai/generate-creative", async (req, res, next) => {
        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== "POST") {
          return next();
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
            apiKey,
            model: model || "gemini-2.5-flash",
            body,
          });
          sendJson(res, result.status, result.payload);
        } catch (error) {
          if (error?.code === "PAYLOAD_TOO_LARGE") {
            sendJson(res, 413, {
              error: "Request is too large.",
              code: "PAYLOAD_TOO_LARGE",
            });
            return;
          }
          sendJson(res, 400, { error: "Invalid JSON body.", code: "INVALID_JSON" });
        }
      });
    },
  };
}
