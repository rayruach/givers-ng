/**
 * Client-side claim tracking via localStorage.
 * Limits: 1 gift per day, 3 gifts per 30 days.
 * In production this is enforced server-side via /api/claims.
 */
import { DAILY_CLAIM_LIMIT, MONTHLY_CLAIM_LIMIT } from "./constants";

const KEY_DAILY   = "giversClaimTimes";
const KEY_MONTHLY = "giversClaimTimes30";
const MS_24H      = 24 * 60 * 60 * 1000;
const MS_30D      = 30 * 24 * 60 * 60 * 1000;

function loadDaily(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_DAILY);
    const times: number[] = raw ? JSON.parse(raw) : [];
    return times.filter((t) => Date.now() - t < MS_24H);
  } catch {
    return [];
  }
}

function loadMonthly(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_MONTHLY);
    const times: number[] = raw ? JSON.parse(raw) : [];
    return times.filter((t) => Date.now() - t < MS_30D);
  } catch {
    return [];
  }
}

function save(key: string, times: number[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(times));
}

/** How many daily claims remain (max 1 per day) */
export function getDailyRemaining(): number {
  const times = loadDaily();
  save(KEY_DAILY, times);
  return Math.max(0, DAILY_CLAIM_LIMIT - times.length);
}

/** How many monthly claims remain (max 3 per 30 days) */
export function getMonthlyRemaining(): number {
  const times = loadMonthly();
  save(KEY_MONTHLY, times);
  return Math.max(0, MONTHLY_CLAIM_LIMIT - times.length);
}

/** Overall remaining claims (whichever limit hits first) */
export function getRemainingClaims(): number {
  return Math.min(getDailyRemaining(), getMonthlyRemaining());
}

/** Is the user blocked from claiming? */
export function isClaimBlocked(): boolean {
  return getRemainingClaims() === 0;
}

/** Returns ms until the current block expires (0 if not blocked). */
export function cooldownMs(): number {
  const daily = loadDaily();
  const monthly = loadMonthly();

  // If daily limit hit, wait for daily reset
  if (daily.length >= DAILY_CLAIM_LIMIT) {
    return daily[0] + MS_24H - Date.now();
  }
  // If monthly limit hit, wait for oldest monthly claim to expire
  if (monthly.length >= MONTHLY_CLAIM_LIMIT) {
    return monthly[0] + MS_30D - Date.now();
  }
  return 0;
}

/** Returns a label for which limit is blocking the user */
export function getBlockReason(): "daily" | "monthly" | null {
  if (loadDaily().length >= DAILY_CLAIM_LIMIT) return "daily";
  if (loadMonthly().length >= MONTHLY_CLAIM_LIMIT) return "monthly";
  return null;
}

export function recordClaim() {
  const daily = loadDaily();
  const monthly = loadMonthly();
  const now = Date.now();
  daily.push(now);
  monthly.push(now);
  save(KEY_DAILY, daily);
  save(KEY_MONTHLY, monthly);
}
