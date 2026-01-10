import { sha256Bytes, hmacSha256Hex } from "./crypto";

export type TelegramAuthResult =
  | { ok: true; tgId: string; username?: string; firstName?: string; lastName?: string; localeHint?: string }
  | { ok: false; reason: string };

function parseInitData(initData: string): Map<string, string> {
  const params = new URLSearchParams(initData);
  const map = new Map<string,string>();
  for (const [k,v] of params.entries()) map.set(k, v);
  return map;
}

export async function verifyTelegramInitData(initData: string, botToken: string, maxAgeSec = 24 * 60 * 60): Promise<TelegramAuthResult> {
  if (!initData || !botToken) return { ok: false, reason: "missing_initData_or_token" };

  const map = parseInitData(initData);
  const hash = map.get("hash");
  if (!hash) return { ok: false, reason: "missing_hash" };

  const authDateStr = map.get("auth_date");
  if (!authDateStr) return { ok: false, reason: "missing_auth_date" };
  const authDate = Number(authDateStr);
  if (!Number.isFinite(authDate)) return { ok: false, reason: "bad_auth_date" };

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec - authDate > maxAgeSec) return { ok: false, reason: "expired" };

  const entries: Array<[string,string]> = [];
  for (const [k,v] of map.entries()) {
    if (k === "hash") continue;
    entries.push([k, v]);
  }
  entries.sort((a,b) => a[0].localeCompare(b[0]));
  const dataCheckString = entries.map(([k,v]) => `${k}=${v}`).join("\n");

  const secretKey = await sha256Bytes(botToken);
  const computed = await hmacSha256Hex(secretKey, dataCheckString);

  if (computed !== hash) return { ok: false, reason: "hash_mismatch" };

  const userRaw = map.get("user");
  if (!userRaw) return { ok: false, reason: "missing_user" };
  let user: any;
  try { user = JSON.parse(userRaw); } catch { return { ok: false, reason: "bad_user_json" }; }

  const tgId = String(user?.id ?? "");
  if (!tgId) return { ok: false, reason: "missing_user_id" };

  return { ok: true, tgId, username: user?.username, firstName: user?.first_name, lastName: user?.last_name, localeHint: user?.language_code };
}
