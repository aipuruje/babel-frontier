import type { Env } from "../index";
import { badRequest, json } from "../utils/http";
import { randomHex } from "../utils/crypto";
import { nowIso } from "../utils/db";

export async function handleClanCreate(req: Request, env: Env, _ctx: ExecutionContext, userId: string): Promise<Response> {
  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim();
  if (!name) return badRequest("BAD_REQUEST", "name required");

  const clanId = "c_" + await randomHex(10);
  await env.DB.prepare("INSERT INTO clans (id, name, region, created_at) VALUES (?1, ?2, 'UZ', ?3)")
    .bind(clanId, name, nowIso()).run();

  await env.DB.prepare("INSERT INTO clan_members (clan_id, user_id, role, joined_at) VALUES (?1, ?2, 'LEADER', ?3)")
    .bind(clanId, userId, nowIso()).run();

  return json({ ok: true, clanId });
}

export async function handleClanJoin(req: Request, env: Env, _ctx: ExecutionContext, userId: string): Promise<Response> {
  const body = await req.json().catch(() => null);
  const clanId = String(body?.clanId || "").trim();
  if (!clanId) return badRequest("BAD_REQUEST", "clanId required");

  const exists = await env.DB.prepare("SELECT id FROM clans WHERE id = ?1").bind(clanId).first<{ id: string }>();
  if (!exists?.id) return json({ ok: false, error: "CLAN_NOT_FOUND" }, 404);

  await env.DB.prepare("INSERT OR REPLACE INTO clan_members (clan_id, user_id, role, joined_at) VALUES (?1, ?2, 'MEMBER', ?3)")
    .bind(clanId, userId, nowIso()).run();

  return json({ ok: true });
}
