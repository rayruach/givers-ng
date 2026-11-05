import { NextResponse } from "next/server";
import { gifts } from "@/app/api/gifts/route";
import { claimRecords } from "@/app/api/claims/route";
import { wishes } from "@/app/api/wishes/route";
import { CLAIM_FEE_NGN } from "@/lib/constants";

export async function GET() {
  const totalGifts     = gifts.length;
  const available      = gifts.filter((g) => g.status === "available").length;
  const pending        = gifts.filter((g) => g.status === "pending").length;
  const claimed        = gifts.filter((g) => g.status === "claimed").length;
  const removed        = gifts.filter((g) => g.status === "removed").length;

  const totalClaims    = claimRecords.length;
  const paidClaims     = claimRecords.filter((c) => c.status === "paid").length;
  const completedClaims = claimRecords.filter((c) => c.status === "completed").length;
  const refundedClaims = claimRecords.filter((c) => c.status === "refunded").length;

  // Revenue = all non-refunded claims × ₦500
  const revenue = (totalClaims - refundedClaims) * CLAIM_FEE_NGN;

  const totalWishes    = wishes.length;
  const grantedWishes  = wishes.filter((w) => w.granted).length;

  return NextResponse.json({
    gifts:  { total: totalGifts, available, pending, claimed, removed },
    claims: { total: totalClaims, paid: paidClaims, completed: completedClaims, refunded: refundedClaims },
    revenue,
    wishes: { total: totalWishes, granted: grantedWishes },
  });
}
