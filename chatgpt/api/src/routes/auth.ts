import type { Env } from "../index";
import { badRequest, json } from "../utils/http";
import { verifyTelegramInitData } from "../utils/telegram";
import { ensureUser } from "../utils/db";
import { createSessionToken } from "../utils/session";

export async function handleTelegramAuth(req: Request, env: Env): Promise<Response> {
  const body = await req.json().catch(() => null);
  const initData = body?.initData;
  const locale = (body?.locale || "uz").toLowerCase();

  if (!initData || typeof initData !== "string") return badRequest("BAD_REQUEST", "initData required");

  const v = await verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN);
  if (!v.ok) return json({ ok: false, error: "TELEGRAM_AUTH_FAILED", reason: v.reason }, 401);

  const userId = await ensureUser(env, v.tgId, locale === "ru" ? "ru" : "uz");
  const token = await createSessionToken(env, userId);

  return json({ ok: true, userId, locale: locale === "ru" ? "ru" : "uz", sessionToken: token });
}
