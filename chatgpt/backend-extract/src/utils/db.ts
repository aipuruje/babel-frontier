import type { Env } from "../index";
import { randomHex } from "./crypto";

export function nowIso(): string {
  return new Date().toISOString();
}

export async function ensureUser(env: Env, tgId: string, locale: string): Promise<string> {
  const existing = await env.DB.prepare("SELECT id FROM users WHERE tg_id = ?1").bind(tgId).first<{ id: string }>();
  if (existing?.id) return existing.id;

  const id = "u_" + await randomHex(12);
  await env.DB.prepare("INSERT INTO users (id, tg_id, locale, created_at) VALUES (?1, ?2, ?3, ?4)")
    .bind(id, tgId, locale || "uz", nowIso()).run();

  const mastery = JSON.stringify({ reading:0, listening:0, grammar:0, writing:0, speaking:0 });
  const fingerprint = JSON.stringify([]);
  await env.DB.prepare(
    "INSERT INTO player_state (user_id, rank, xp, streak, fatigue, mastery_json, error_fingerprint_json, updated_at) VALUES (?1, 0, 0, 0, 0, ?2, ?3, ?4)"
  ).bind(id, mastery, fingerprint, nowIso()).run();

  return id;
}

export async function getPlayerState(env: Env, userId: string): Promise<any> {
  const row = await env.DB.prepare(
    "SELECT u.id, u.tg_id, u.locale, ps.rank, ps.xp, ps.streak, ps.fatigue, ps.mastery_json, ps.error_fingerprint_json, ps.updated_at FROM users u JOIN player_state ps ON ps.user_id = u.id WHERE u.id = ?1"
  ).bind(userId).first<any>();

  if (!row) return null;
  return {
    userId: row.id,
    tgId: row.tg_id,
    locale: row.locale,
    rank: row.rank,
    xp: row.xp,
    streak: row.streak,
    fatigue: row.fatigue,
    mastery: JSON.parse(row.mastery_json),
    errorFingerprint: JSON.parse(row.error_fingerprint_json),
    updatedAt: row.updated_at
  };
}

export async function getQuestJson(env: Env, questId: string): Promise<any | null> {
  const row = await env.DB.prepare("SELECT json FROM quests WHERE id = ?1").bind(questId).first<{ json: string }>();
  return row?.json ? JSON.parse(row.json) : null;
}

export async function listCanonQuestIds(env: Env): Promise<string[]> {
  const res = await env.DB.prepare("SELECT id FROM quests WHERE canon = 1 ORDER BY id ASC").all<{ id: string }>();
  return (res.results || []).map(r => r.id);
}

export async function markCompleted(env: Env, userId: string, questId: string): Promise<void> {
  await env.DB.prepare(
    "INSERT OR REPLACE INTO user_quest_progress (user_id, quest_id, status, completed_at) VALUES (?1, ?2, 'COMPLETED', ?3)"
  ).bind(userId, questId, nowIso()).run();
}

export async function hasCompleted(env: Env, userId: string, questId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    "SELECT status FROM user_quest_progress WHERE user_id = ?1 AND quest_id = ?2 AND status = 'COMPLETED'"
  ).bind(userId, questId).first<{ status: string }>();
  return !!row?.status;
}

export async function recordAttempt(env: Env, userId: string, questId: string, score: number, maxScore: number, errors: any, timeSpentMs: number): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO quest_attempts (user_id, quest_id, ts, score, max_score, errors_json, time_spent_ms) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
  ).bind(userId, questId, nowIso(), score, maxScore, JSON.stringify(errors ?? []), timeSpentMs ?? 0).run();
}

export async function applyRewards(env: Env, userId: string, xpGain: number, items: Array<{itemId: string, qty: number}>): Promise<void> {
  const ps = await env.DB.prepare("SELECT xp, rank FROM player_state WHERE user_id = ?1").bind(userId).first<{ xp: number; rank: number }>();
  const newXp = (ps?.xp ?? 0) + (xpGain ?? 0);

  const thresholds = [0,120,280,520,820,1180,1600,2080,2620,3220,3900];
  let newRank = 0;
  for (let r = 0; r < thresholds.length; r++) if (newXp >= thresholds[r]) newRank = r;

  await env.DB.prepare("UPDATE player_state SET xp = ?1, rank = ?2, updated_at = ?3 WHERE user_id = ?4")
    .bind(newXp, newRank, nowIso(), userId).run();

  for (const it of (items ?? [])) {
    await env.DB.prepare(
      "INSERT INTO user_items (user_id, item_id, qty) VALUES (?1, ?2, ?3) ON CONFLICT(user_id, item_id) DO UPDATE SET qty = qty + excluded.qty"
    ).bind(userId, it.itemId, it.qty).run();
  }
}
