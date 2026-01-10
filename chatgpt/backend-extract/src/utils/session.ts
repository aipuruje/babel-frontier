import type { Env } from "../index";
import { hmacSha256Hex, sha256Bytes } from "./crypto";

type SessionVerify = { ok: true; userId: string } | { ok: false };

const KV_PREFIX = "sess:";

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

export async function createSessionToken(env: Env, userId: string, ttlSeconds = 7*24*60*60): Promise<string> {
  const payload = JSON.stringify({ uid: userId, ts: Date.now() });
  const b64 = base64UrlEncode(payload);

  const keyBytes = await sha256Bytes(env.SESSION_SIGNING_KEY);
  const sig = await hmacSha256Hex(keyBytes, b64);

  const token = `${b64}.${sig}`;
  await env.SESSIONS.put(KV_PREFIX + token, userId, { expirationTtl: ttlSeconds });
  return token;
}

export async function verifySessionToken(env: Env, token: string): Promise<SessionVerify> {
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false };
  const [b64, sig] = parts;

  const keyBytes = await sha256Bytes(env.SESSION_SIGNING_KEY);
  const expected = await hmacSha256Hex(keyBytes, b64);
  if (expected !== sig) return { ok: false };

  const userId = await env.SESSIONS.get(KV_PREFIX + token);
  if (!userId) return { ok: false };

  return { ok: true, userId };
}
