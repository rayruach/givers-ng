import { NextResponse } from "next/server";
import { ClaimRecord } from "@/lib/types";
import { gifts } from "@/app/api/gifts/route";

const DAILY_LIMIT = 2;
const MS_24H = 24 * 60 * 60 * 1000;

// Map<email, timestamp[]> for rate limiting
const claimLog = new Map<string, number[]>();

// Full claim records for admin view
export let claimRecords: ClaimRecord[] = [];

function getActiveClaims(email: string): number[] {
  const times = claimLog.get(email) ?? [];
  return times.filter((t) => Date.now() - t < MS_24H);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email     = searchParams.get("email")?.toLowerCase().trim();
  const adminMode = searchParams.get("admin") === "1";

  // Admin: return all records
  if (adminMode) {
    return NextResponse.json({ claims: claimRecords });
  }

  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const active    = getActiveClaims(email);
  const remaining = Math.max(0, DAILY_LIMIT - active.length);
  const blocked   = remaining === 0;
  const resetAt   = blocked ? active[0] + MS_24H : null;

  return NextResponse.json({ remaining, blocked, resetAt });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { email, paystackRef, giftId, claimerName, claimerPhone, delivery } = body;

  if (!email || !paystackRef || !giftId) {
    return NextResponse.json(
      { error: "email, paystackRef and giftId are required" },
      { status: 400 }
    );
  }

  const key    = email.toLowerCase().trim();
  const active = getActiveClaims(key);

  if (active.length >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: "Daily claim limit reached", resetAt: active[0] + MS_24H },
      { status: 429 }
    );
  }

  // Check gift is still available
  const gift = gifts.find((g) => g.id === Number(giftId));
  if (!gift) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }
  if (gift.status !== "available") {
    return NextResponse.json(
      { error: "This gift has already been claimed by someone else." },
      { status: 409 }
    );
  }

  // Lock the gift immediately so no one else can claim it
  const giftIdx = gifts.findIndex((g) => g.id === Number(giftId));
  if (giftIdx !== -1) gifts[giftIdx] = { ...gifts[giftIdx], status: "pending" };

  // Record the claim
  active.push(Date.now());
  claimLog.set(key, active);

  const record: ClaimRecord = {
    id: Date.now(),
    giftId: Number(giftId),
    giftTitle: gift.title,
    claimerName: claimerName ?? "Unknown",
    claimerEmail: key,
    claimerPhone: claimerPhone ?? "",
    paystackRef,
    delivery: delivery ?? "pickup",
    status: "paid",
    createdAt: Date.now(),
  };
  claimRecords = [record, ...claimRecords];

  return NextResponse.json({
    success: true,
    remaining: DAILY_LIMIT - active.length,
    claimId: record.id,
  });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, status } = body as { id: number; status: ClaimRecord["status"] };

  const idx = claimRecords.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  claimRecords[idx] = { ...claimRecords[idx], status };

  // If admin marks as completed, also mark the gift as claimed
  if (status === "completed") {
    const giftIdx = gifts.findIndex((g) => g.id === claimRecords[idx].giftId);
    if (giftIdx !== -1) gifts[giftIdx] = { ...gifts[giftIdx], status: "claimed" };
  }
  // If refunded, free the gift back to available
  if (status === "refunded") {
    const giftIdx = gifts.findIndex((g) => g.id === claimRecords[idx].giftId);
    if (giftIdx !== -1) gifts[giftIdx] = { ...gifts[giftIdx], status: "available" };
  }

  return NextResponse.json({ claim: claimRecords[idx] });
}
