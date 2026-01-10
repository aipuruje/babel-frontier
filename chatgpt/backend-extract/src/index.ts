import { router } from "./router";
import { json } from "./utils/http";

export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  SESSION_SIGNING_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await router.handle(request, env, ctx);
    } catch (err: any) {
      return json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500);
    }
  }
};
