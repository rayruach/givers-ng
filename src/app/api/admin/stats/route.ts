import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { giftsTable, claimsTable, wishesTable } from "@/lib/schema";
import { eq, count, sql } from "drizzle-orm";
import { CLAIM_FEE_NGN } from "@/lib/constants";

export async function GET() {
  // Run all counts in parallel
  const [
    giftCounts,
    claimCounts,
    wishCounts,
  ] = await Promise.all([
    // Gift status breakdown
    db
      .select({ status: giftsTable.status, count: count() })
      .from(giftsTable)
      .groupBy(giftsTable.status),

    // Claim status breakdown
    db
      .select({ status: claimsTable.status, count: count() })
      .from(claimsTable)
      .groupBy(claimsTable.status),

    // Wish granted breakdown
    db
      .select({ granted: wishesTable.granted, count: count() })
      .from(wishesTable)
      .groupBy(wishesTable.granted),
  ]);

  // Aggregate gift counts
  const giftMap = Object.fromEntries(giftCounts.map((r) => [r.status, Number(r.count)]));
  const totalGifts = Object.values(giftMap).reduce((a, b) => a + b, 0);

  // Aggregate claim counts
  const claimMap  = Object.fromEntries(claimCounts.map((r) => [r.status, Number(r.count)]));
  const totalClaims = Object.values(claimMap).reduce((a, b) => a + b, 0);
  const refunded  = claimMap["refunded"] ?? 0;
  const revenue   = (totalClaims - refunded) * CLAIM_FEE_NGN;

  // Aggregate wish counts
  const totalWishes   = wishCounts.reduce((a, r) => a + Number(r.count), 0);
  const grantedWishes = wishCounts.find((r) => r.granted)?.count ?? 0;

  return NextResponse.json({
    gifts: {
      total:     totalGifts,
      available: giftMap["available"] ?? 0,
      pending:   giftMap["pending"]   ?? 0,
      claimed:   giftMap["claimed"]   ?? 0,
      removed:   giftMap["removed"]   ?? 0,
    },
    claims: {
      total:     totalClaims,
      paid:      claimMap["paid"]       ?? 0,
      completed: claimMap["completed"]  ?? 0,
      refunded,
    },
    revenue,
    wishes: {
      total:   totalWishes,
      granted: Number(grantedWishes),
    },
  });
}
