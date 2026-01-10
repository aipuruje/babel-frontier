import { router } from "./router";
import { json } from "./utils/http";

export interface Env {
  DB: D1Database;
  KV?: KVNamespace;  // Brain pack version pointer + session tokens
  R2?: R2Bucket;     // Brain pack JSONs + content assets
  SESSIONS: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  SESSION_SIGNING_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await router.handle(request, env, ctx);
    } catch (err) {
      const error = err as Error;
      return json({ ok: false, error: "INTERNAL_ERROR", message: String(error?.message ?? err) }, 500);
    }
  }
};
