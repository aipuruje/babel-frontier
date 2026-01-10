// Mock auth route for local development (bypass Telegram)
import type { Env } from "../index";
import { json } from "../utils/http";
import { ensureUser } from "../utils/db";
import { createSessionToken } from "../utils/session";

export async function handleMockAuth(req: Request, env: Env): Promise<Response> {
    const body: unknown = await req.json().catch(() => ({}));
    const isBodyObject = (val: unknown): val is Record<string, unknown> =>
        typeof val === 'object' && val !== null;

    const userId = (isBodyObject(body) && typeof body.userId === 'string') ? body.userId : 'demo_player';
    const locale = (isBodyObject(body) && typeof body.locale === 'string') ? body.locale : 'uz';

    // Create/ensure user exists in database
    const dbUserId = await ensureUser(env, userId, locale);

    // Create session token
    const token = await createSessionToken(env, dbUserId);

    return json({
        ok: true,
        userId: dbUserId,
        locale,
        sessionToken: token
    });
}
