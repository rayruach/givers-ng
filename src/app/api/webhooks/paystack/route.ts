import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { claimsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

/**
 * Paystack webhook endpoint.
 * Paystack calls this when a payment event occurs.
 * We verify the signature and reconcile claim records.
 *
 * Set this URL in your Paystack dashboard:
 * Settings > Webhooks > Add webhook URL
 * URL: https://yourdomain.com/api/webhooks/paystack
 */
export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";

    // ── Verify the webhook signature ──
    const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
    if (!secret) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const computedHash = crypto
      .createHmac("sha512", secret)
      .update(bodyText)
      .digest("hex");

    if (computedHash !== signature) {
      console.error("Paystack webhook signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(bodyText);

    // Only handle successful charges
    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const reference = event.data.reference;

    // Find the claim record by payment reference
    const [claim] = await db
      .select()
      .from(claimsTable)
      .where(eq(claimsTable.paystackRef, reference));

    if (!claim) {
      // Payment may have come in before the client recorded the claim
      // This is fine — the client POST to /api/claims will handle it
      console.log("Webhook: No claim found for reference", reference);
      return NextResponse.json({ received: true });
    }

    // If the claim is already marked as paid, nothing to do
    if (claim.status === "paid" || claim.status === "connected" || claim.status === "completed") {
      return NextResponse.json({ received: true });
    }

    // Update claim status to paid (confirms the payment)
    await db
      .update(claimsTable)
      .set({ status: "paid" })
      .where(eq(claimsTable.id, claim.id));

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Paystack webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
