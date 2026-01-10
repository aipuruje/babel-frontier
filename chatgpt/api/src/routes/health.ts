import { json } from "../utils/http";
export async function handleHealth(): Promise<Response> {
  return json({ ok: true, service: "archive-of-tongues-mvp", ts: new Date().toISOString() });
}
