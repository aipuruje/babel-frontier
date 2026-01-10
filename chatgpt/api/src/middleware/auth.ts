import type { Env } from "../index";
import { unauthorized } from "../utils/http";
import { verifySessionToken } from "../utils/session";

export type AuthedHandler = (req: Request, env: Env, ctx: ExecutionContext, userId: string) => Promise<Response>;

export function withAuth(handler: AuthedHandler) {
  return async (req: Request, env: Env, ctx: ExecutionContext): Promise<Response> => {
    const auth = req.headers.get("Authorization") || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return unauthorized("Missing Bearer token");

    const token = m[1];
    const session = await verifySessionToken(env, token);
    if (!session.ok) return unauthorized("Invalid session");

    return handler(req, env, ctx, session.userId);
  };
}
