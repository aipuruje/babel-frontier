export function json(data: any, status = 200, headers: Record<string,string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

export function badRequest(code: string, message: string): Response {
  return json({ ok: false, error: code, message }, 400);
}

export function unauthorized(message = "Unauthorized"): Response {
  return json({ ok: false, error: "UNAUTHORIZED", message }, 401);
}

export function notFound(): Response {
  return json({ ok: false, error: "NOT_FOUND", message: "Not found" }, 404);
}
