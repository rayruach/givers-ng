import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refundRequestsTable, claimsTable, applicationsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/auth";

/* ── GET: admin lists all refund requests ── */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adminMode = searchParams.get("admin") === "1";

  if (adminMode) {
    const requests = await db
      .select()
      .from(refundRequestsTable)
      .orderBy(refundRequestsTable.createdAt);

    return NextResponse.json({
      refunds: requests.map(r => ({ ...r, createdAt: r.createdAt.getTime() })),
    });
  }

  // User: get their own refund requests
  const authUser = await getUserFromRequest(req);
  if (!authUser) return NextResponse.json({ refunds: [] });

  const requests = await db
    .select()
    .from(refundRequestsTable)
    .where(eq(refundRequestsTable.userId, authUser.id))
    .orderBy(refundRequestsTable.createdAt);

  return NextResponse.json({
    refunds: requests.map(r => ({ ...r, createdAt: r.createdAt.getTime() })),
  });
}

/* ── POST: receiver submits a refund request ── */
export async function POST(req: Request) {
  const authUser = await getUserFromRequest(req);
  if (!authUser) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json();
  const { appId, reason } = body;

  if (!appId || !reason?.trim()) {
    return NextResponse.json({ error: "appId and reason are required" }, { status: 400 });
  }

  // Verify application belongs to this user and is in paid status
  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, Number(appId)));

  if (!app || app.userId !== authUser.id) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (app.status !== "paid") {
    return NextResponse.json(
      { error: "You can only request a refund for a paid application." },
      { status: 409 }
    );
  }

  // Check no existing refund request for this application
  const existing = await db
    .select()
    .from(refundRequestsTable)
    .where(eq(refundRequestsTable.appId, Number(appId)));

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "A refund request already exists for this application." },
      { status: 409 }
    );
  }

  // Find related claim by paystack ref
  let claimId = null;
  if (app.paystackRef) {
    const [claim] = await db
      .select()
      .from(claimsTable)
      .where(eq(claimsTable.paystackRef, app.paystackRef));
    if (claim) claimId = claim.id;
  }

  const [request] = await db
    .insert(refundRequestsTable)
    .values({
      userId:      authUser.id,
      claimId,
      appId:       Number(appId),
      giftTitle:   (app as any).giftTitle ?? "Unknown Gift",
      reason:      reason.trim(),
      paystackRef: app.paystackRef,
      amount:      1000,
      status:      "pending",
    })
    .returning();

  return NextResponse.json(
    { refund: { ...request, createdAt: request.createdAt.getTime() } },
    { status: 201 }
  );
}

/* ── PATCH: admin updates refund status ── */
export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, status, adminNote } = body as {
    id: number;
    status: "approved" | "rejected" | "completed";
    adminNote?: string;
  };

  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { status };
  if (adminNote) updates.adminNote = adminNote;

  const [updated] = await db
    .update(refundRequestsTable)
    .set(updates)
    .where(eq(refundRequestsTable.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Refund request not found" }, { status: 404 });

  return NextResponse.json({ refund: { ...updated, createdAt: updated.createdAt.getTime() } });
}
