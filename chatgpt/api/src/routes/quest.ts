import type { Env } from "../index";
import { badRequest, json } from "../utils/http";
import { pickNextQuest, submitQuest } from "../game/game";

export async function handleQuestNext(_req: Request, env: Env, _ctx: ExecutionContext, userId: string): Promise<Response> {
  const next = await pickNextQuest(env, userId);
  return json({ ok: true, quest: next.quest });
}

export async function handleQuestSubmit(req: Request, env: Env, _ctx: ExecutionContext, userId: string): Promise<Response> {
  const body = await req.json().catch(() => null);
  if (!body?.questId) return badRequest("BAD_REQUEST", "questId required");

  const result = await submitQuest(env, userId, {
    questId: String(body.questId),
    answers: body.answers || {},
    timeSpentMs: Number(body.timeSpentMs || 0)
  });

  return json(result);
}
