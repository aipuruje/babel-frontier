import type { Env } from "../index";
import { json } from "../utils/http";

export async function handleLeaderboardLocal(_req: Request, _env: Env, _ctx: ExecutionContext, _userId: string): Promise<Response> {
  return json({ ok: true, scope: "local", rows: [] });
}

export async function handleLeaderboardGlobal(_req: Request, _env: Env, _ctx: ExecutionContext, _userId: string): Promise<Response> {
  return json({ ok: true, scope: "global", rows: [] });
}
