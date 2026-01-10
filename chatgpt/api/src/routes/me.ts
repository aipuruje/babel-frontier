import type { Env } from "../index";
import { json } from "../utils/http";
import { getPlayerState } from "../utils/db";

export async function handleMe(_req: Request, env: Env, _ctx: ExecutionContext, userId: string): Promise<Response> {
  const state = await getPlayerState(env, userId);
  return json({ ok: true, player: state });
}
