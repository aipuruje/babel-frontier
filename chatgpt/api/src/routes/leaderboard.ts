import { json } from "../utils/http";

export async function handleLeaderboardLocal(): Promise<Response> {
  return json({ ok: true, scope: "local", rows: [] });
}

export async function handleLeaderboardGlobal(): Promise<Response> {
  return json({ ok: true, scope: "global", rows: [] });
}
