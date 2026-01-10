import type { Env } from "./index";
import { notFound } from "./utils/http";
import { withAuth } from "./middleware/auth";
import { handleTelegramAuth } from "./routes/auth";
import { handleMockAuth } from "./routes/authMock"; // For local dev
import { handleMe } from "./routes/me";
import { handlePlacementStart } from "./routes/placement";
import { handleQuestNext, handleQuestSubmit } from "./routes/quest";
import { handleClanCreate, handleClanJoin } from "./routes/clan";
import { handleLeaderboardLocal, handleLeaderboardGlobal } from "./routes/leaderboard";
import { handleHealth } from "./routes/health";
import { handleBrainStatus } from "./routes/brainStatus";

type Handler = (req: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;

class Router {
  private routes: Array<{ method: string; path: RegExp; handler: Handler }> = [];

  on(method: string, path: string, handler: Handler) {
    const re = pathToRegex(path);
    this.routes.push({ method: method.toUpperCase(), path: re, handler });
  }

  async handle(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return corsPreflight(req);

    for (const r of this.routes) {
      if (r.method !== req.method.toUpperCase()) continue;
      if (!url.pathname.match(r.path)) continue;
      const res = await r.handler(req, env, ctx);
      return withCors(res, req);
    }
    return withCors(notFound(), req);
  }
}

export const router = new Router();

// Public
router.on("GET", "/health", handleHealth);
router.on("GET", "/api/brain/status", handleBrainStatus); // Brain Pack test endpoint
router.on("POST", "/auth/telegram", handleTelegramAuth);
router.on("POST", "/auth/mock", handleMockAuth); // For local dev only

// Authenticated
router.on("GET", "/me", withAuth(handleMe));
router.on("POST", "/placement/start", withAuth(handlePlacementStart));
router.on("POST", "/quest/next", withAuth(handleQuestNext));
router.on("POST", "/quest/submit", withAuth(handleQuestSubmit));

// Social (MVP Lite)
router.on("POST", "/clan/create", withAuth(handleClanCreate));
router.on("POST", "/clan/join", withAuth(handleClanJoin));

// Leaderboards (stub)
router.on("GET", "/leaderboard/local", withAuth(handleLeaderboardLocal));
router.on("GET", "/leaderboard/global", withAuth(handleLeaderboardGlobal));

function pathToRegex(path: string): RegExp {
  return new RegExp("^" + path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$");
}

function corsPreflight(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": req.headers.get("Origin") ?? "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    }
  });
}

function withCors(res: Response, req: Request): Response {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", req.headers.get("Origin") ?? "*");
  h.set("Access-Control-Allow-Credentials", "true");
  h.set("Vary", "Origin");
  return new Response(res.body, { status: res.status, headers: h });
}
