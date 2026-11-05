/**
 * Client-side daily claim tracking via localStorage.
 * In production this is enforced server-side via /api/claims.
 */
import { DAILY_CLAIM_LIMIT } from "./constants";

const KEY = "giversClaimTimes";
const MS_24H = 24 * 60 * 60 * 1000;

function load(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const times: number[] = raw ? JSON.parse(raw) : [];
    return times.filter((t) => Date.now() - t < MS_24H);
  } catch {
    return [];
  }
}

function save(times: number[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(times));
}

export function getRemainingClaims(): number {
  const times = load();
  save(times); // prune stale
  return Math.max(0, DAILY_CLAIM_LIMIT - times.length);
}

export function isClaimBlocked(): boolean {
  return getRemainingClaims() === 0;
}

/** Returns ms until the oldest claim expires (0 if not blocked). */
export function cooldownMs(): number {
  const times = load();
  if (times.length < DAILY_CLAIM_LIMIT) return 0;
  return times[0] + MS_24H - Date.now();
}

export function recordClaim() {
  const times = load();
  times.push(Date.now());
  save(times);
}
