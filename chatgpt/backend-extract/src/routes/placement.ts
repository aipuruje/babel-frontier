import type { Env } from "../index";
import { json } from "../utils/http";
import { getQuestJson } from "../utils/db";

export async function handlePlacementStart(_req: Request, env: Env, _ctx: ExecutionContext, _userId: string): Promise<Response> {
  const quest = await getQuestJson(env, "Q001");
  return json({ ok: true, quest });
}
