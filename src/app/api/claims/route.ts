import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { claimsTable, giftsTable, usersTable, applicationsTable, notificationsTable } from "@/lib/schema";
import { eq, and, gte } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/auth";
import type { ClaimRecord } from "@/lib/types";

const DAILY_LIMIT = 1;
const MONTHLY_LIMIT = 3;
const MS_24H = 24 * 60 * 60 * 1000;
const MS_30D = 30 * 24 * 60 * 60 * 1000;

/** Verify a Paystack payment reference server-side */
async function verifyPaystackPayment(reference: string): Promise<{ verified: boolean; email?: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("PAYSTACK_SECRET_KEY not configured");
    return { verified: false };
  }
  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await res.json();
    if (data.status === true && data.data.status === "success") {
      return { verified: true, email: data.data.customer.email };
    }
    return { verified: false };
  } catch (err) {
    console.error("Paystack verification failed:", err);
    return { verified: false };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email     = searchParams.get("email")?.toLowerCase().trim();
  const adminMode = searchParams.get("admin") === "1";

  if (adminMode) {
    const claims = await db
      .select()
      .from(claimsTable)
      .orderBy(claimsTable.createdAt);
    return NextResponse.json({ claims });
  }

  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const since = new Date(Date.now() - MS_24H);
  const recent = await db
    .select()
    .from(claimsTable)
    .where(and(eq(claimsTable.claimerEmail, email), gte(claimsTable.createdAt, since)));

  const remaining = Math.max(0, DAILY_LIMIT - recent.length);
  const blocked   = remaining === 0;
  const resetAt   = blocked ? recent[0].createdAt.getTime() + MS_24H : null;

  return NextResponse.json({ remaining, blocked, resetAt });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { paystackRef, giftId, appId, delivery } = body;

  if (!paystackRef || !giftId) {
    return NextResponse.json(
      { error: "paystackRef and giftId are required" },
      { status: 400 }
    );
  }

  // ── 1. Verify the user from JWT cookie (don't trust client-sent email) ──
  const authUser = await getUserFromRequest(req);
  if (!authUser) {
    return NextResponse.json(
      { error: "You must be logged in to claim a gift." },
      { status: 401 }
    );
  }

  // ── 2. Check if user is blocked ──
  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, authUser.email));

  if (dbUser?.blocked) {
    return NextResponse.json(
      { error: "Your account has been blocked. Please contact support." },
      { status: 403 }
    );
  }

  const key   = authUser.email;
  const since = new Date(Date.now() - MS_24H);
  const since30 = new Date(Date.now() - MS_30D);

  // ── 3. Check daily limit (1 per day) ──
  const recent = await db
    .select()
    .from(claimsTable)
    .where(and(eq(claimsTable.claimerEmail, key), gte(claimsTable.createdAt, since)));

  if (recent.length >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: "You can only claim 1 gift per day. Please come back tomorrow.", resetAt: recent[0].createdAt.getTime() + MS_24H },
      { status: 429 }
    );
  }

  // ── 4. Check monthly limit (3 per 30 days) ──
  const recent30 = await db
    .select()
    .from(claimsTable)
    .where(and(eq(claimsTable.claimerEmail, key), gte(claimsTable.createdAt, since30)));

  if (recent30.length >= MONTHLY_LIMIT) {
    return NextResponse.json(
      { error: "You have reached your monthly limit of 3 gifts.", resetAt: recent30[0].createdAt.getTime() + MS_30D },
      { status: 429 }
    );
  }

  // ── 5. Verify the Paystack payment server-side ──
  const payment = await verifyPaystackPayment(paystackRef);
  if (!payment.verified) {
    return NextResponse.json(
      { error: "Payment could not be verified. If you were charged, please contact support." },
      { status: 402 }
    );
  }

  // ── 6. Verify user has a selected application for this gift ──
  if (appId) {
    const [app] = await db
      .select()
      .from(applicationsTable)
      .where(and(
        eq(applicationsTable.id, Number(appId)),
        eq(applicationsTable.userId, dbUser!.id),
        eq(applicationsTable.status, "selected")
      ));

    if (!app) {
      return NextResponse.json(
        { error: "You do not have a selected application for this gift." },
        { status: 403 }
      );
    }
  }

  // ── 7. Lock the gift (pending → claimed path starts here) ──
  const locked = await db
    .update(giftsTable)
    .set({ status: "pending" })
    .where(and(eq(giftsTable.id, Number(giftId)), eq(giftsTable.status, "pending")))
    .returning();

  // Also allow locking from available (legacy / no appId path)
  const lockedFallback = locked.length === 0 ? await db
    .update(giftsTable)
    .set({ status: "pending" })
    .where(and(eq(giftsTable.id, Number(giftId)), eq(giftsTable.status, "available")))
    .returning() : locked;

  if (lockedFallback.length === 0) {
    return NextResponse.json(
      { error: "This gift is no longer available." },
      { status: 409 }
    );
  }

  const gift = lockedFallback[0];

  // ── 8. Record the claim with verified user data ──
  const [record] = await db
    .insert(claimsTable)
    .values({
      giftId:       Number(giftId),
      giftTitle:    gift.title,
      claimerName:  authUser.name,
      claimerEmail: key,
      claimerPhone: authUser.phone,
      paystackRef,
      delivery:     delivery ?? "pickup",
      status:       "paid",
    })
    .returning();

  // ── 9. Update application to "paid" and notify the giver ──
  if (appId) {
    await db.update(applicationsTable)
      .set({ status: "paid", paystackRef })
      .where(eq(applicationsTable.id, Number(appId)));

    // Mark gift as claimed
    await db.update(giftsTable)
      .set({ status: "claimed" })
      .where(eq(giftsTable.id, Number(giftId)));

    // Notify the giver
    if (gift.userId) {
      await db.insert(notificationsTable).values({
        userId:  gift.userId,
        type:    "paid",
        title:   "Gift Claimed!",
        message: `${authUser.name} has paid and confirmed their claim for "${gift.title}". Arrange handoff now.`,
        giftId:  gift.id,
        appId:   Number(appId),
      });
    }
  }

  return NextResponse.json({
    success: true,
    remaining: Math.max(0, DAILY_LIMIT - (recent.length + 1)),
    claimId: record.id,
  });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, status } = body as { id: number; status: ClaimRecord["status"] };

  const [updated] = await db
    .update(claimsTable)
    .set({ status })
    .where(eq(claimsTable.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  // Cascade gift status changes
  if (status === "completed") {
    await db.update(giftsTable).set({ status: "claimed" }).where(eq(giftsTable.id, updated.giftId));
  }
  if (status === "refunded") {
    await db.update(giftsTable).set({ status: "available" }).where(eq(giftsTable.id, updated.giftId));
  }

  return NextResponse.json({ claim: updated });
}
