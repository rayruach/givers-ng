import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applicationsTable, giftsTable, usersTable, notificationsTable } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/auth";

/* ── GET: list applications for a gift (giver only) or user's own applications ── */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const giftId  = searchParams.get("giftId");
  const mine    = searchParams.get("mine") === "1"; // receiver's own applications
  const authUser = await getUserFromRequest(req);

  if (!authUser) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  if (mine) {
    // Receiver: get all their applications with gift info joined
    const apps = await db
      .select({
        id:          applicationsTable.id,
        giftId:      applicationsTable.giftId,
        reason:      applicationsTable.reason,
        delivery:    applicationsTable.delivery,
        status:      applicationsTable.status,
        paystackRef: applicationsTable.paystackRef,
        createdAt:   applicationsTable.createdAt,
        giftTitle:   giftsTable.title,
        giftImage:   giftsTable.image,
        giftDonor:   giftsTable.donor,
        giftStatus:  giftsTable.status,
      })
      .from(applicationsTable)
      .innerJoin(giftsTable, eq(applicationsTable.giftId, giftsTable.id))
      .where(eq(applicationsTable.userId, authUser.id))
      .orderBy(applicationsTable.createdAt);

    return NextResponse.json({ applications: apps.map(a => ({
      ...a,
      createdAt: a.createdAt.getTime(),
    })) });
  }

  if (!giftId) {
    return NextResponse.json({ error: "giftId required" }, { status: 400 });
  }

  // Giver: verify they own this gift
  const [gift] = await db.select().from(giftsTable).where(eq(giftsTable.id, Number(giftId)));
  if (!gift) return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  if (gift.userId !== authUser.id) {
    return NextResponse.json({ error: "Not your gift" }, { status: 403 });
  }

  // Get all applications with applicant info joined
  const apps = await db
    .select({
      id:             applicationsTable.id,
      giftId:         applicationsTable.giftId,
      userId:         applicationsTable.userId,
      reason:         applicationsTable.reason,
      delivery:       applicationsTable.delivery,
      status:         applicationsTable.status,
      paystackRef:    applicationsTable.paystackRef,
      createdAt:      applicationsTable.createdAt,
      applicantName:  usersTable.name,
      applicantEmail: usersTable.email,
      applicantPhone: usersTable.phone,
    })
    .from(applicationsTable)
    .innerJoin(usersTable, eq(applicationsTable.userId, usersTable.id))
    .where(eq(applicationsTable.giftId, Number(giftId)))
    .orderBy(applicationsTable.createdAt);

  return NextResponse.json({
    applications: apps.map(a => ({ ...a, createdAt: a.createdAt.getTime() })),
  });
}

/* ── POST: receiver applies for a gift ── */
export async function POST(req: Request) {
  const authUser = await getUserFromRequest(req);
  if (!authUser) {
    return NextResponse.json({ error: "You must be logged in to apply for a gift." }, { status: 401 });
  }

  const body = await req.json();
  const { giftId, reason, delivery } = body;

  if (!giftId || !reason?.trim()) {
    return NextResponse.json({ error: "giftId and reason are required" }, { status: 400 });
  }

  // Check gift is still available
  const [gift] = await db.select().from(giftsTable).where(eq(giftsTable.id, Number(giftId)));
  if (!gift) return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  if (gift.status !== "available") {
    return NextResponse.json({ error: "This gift is no longer available." }, { status: 409 });
  }

  // Check user hasn't already applied
  const existing = await db
    .select()
    .from(applicationsTable)
    .where(and(
      eq(applicationsTable.giftId, Number(giftId)),
      eq(applicationsTable.userId, authUser.id)
    ));

  if (existing.length > 0) {
    return NextResponse.json({ error: "You have already applied for this gift." }, { status: 409 });
  }

  // Create application
  const [app] = await db
    .insert(applicationsTable)
    .values({
      giftId:   Number(giftId),
      userId:   authUser.id,
      reason:   reason.trim(),
      delivery: delivery ?? "pickup",
      status:   "pending",
    })
    .returning();

  // Notify giver if gift has an owner
  if (gift.userId) {
    // Truncate reason to 80 chars for the notification preview
    const reasonPreview = reason.trim().length > 80
      ? reason.trim().slice(0, 80) + "..."
      : reason.trim();

    await db.insert(notificationsTable).values({
      userId:  gift.userId,
      type:    "applied",
      title:   "New Application",
      message: `${authUser.name} applied for your gift: "${gift.title}". Reason: "${reasonPreview}"`,
      giftId:  gift.id,
      appId:   app.id,
    });
  }

  return NextResponse.json({ application: { ...app, createdAt: app.createdAt.getTime() } }, { status: 201 });
}

/* ── PATCH: giver selects or rejects an application ── */
export async function PATCH(req: Request) {
  const authUser = await getUserFromRequest(req);
  if (!authUser) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json();
  const { appId, action } = body as { appId: number; action: "select" | "reject" };

  if (!appId || !["select", "reject"].includes(action)) {
    return NextResponse.json({ error: "appId and action (select/reject) required" }, { status: 400 });
  }

  // Get application + gift to verify ownership
  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, appId));

  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const [gift] = await db.select().from(giftsTable).where(eq(giftsTable.id, app.giftId));
  if (!gift || gift.userId !== authUser.id) {
    return NextResponse.json({ error: "Not your gift" }, { status: 403 });
  }

  if (action === "select") {
    // Update the selected application to "selected"
    await db.update(applicationsTable)
      .set({ status: "selected" })
      .where(eq(applicationsTable.id, appId));

    // Reject all other pending applications for this gift
    await db.update(applicationsTable)
      .set({ status: "rejected" })
      .where(and(
        eq(applicationsTable.giftId, app.giftId),
        eq(applicationsTable.status, "pending")
      ));

    // Lock the gift to pending
    await db.update(giftsTable)
      .set({ status: "pending" })
      .where(eq(giftsTable.id, app.giftId));

    // Notify selected receiver
    await db.insert(notificationsTable).values({
      userId:  app.userId,
      type:    "selected",
      title:   "You were selected!",
      message: `Great news! The Giver selected your application for "${gift.title}". Proceed to payment to claim your gift.`,
      giftId:  gift.id,
      appId:   app.id,
    });

    // Notify rejected applicants
    const otherApps = await db
      .select()
      .from(applicationsTable)
      .where(and(
        eq(applicationsTable.giftId, app.giftId),
        eq(applicationsTable.status, "rejected")
      ));

    for (const other of otherApps) {
      if (other.userId !== app.userId) {
        await db.insert(notificationsTable).values({
          userId:  other.userId,
          type:    "rejected",
          title:   "Application Update",
          message: `The Giver has selected another applicant for "${gift.title}". Keep checking for more gifts!`,
          giftId:  gift.id,
          appId:   other.id,
        });
      }
    }

  } else {
    // Reject just this one
    await db.update(applicationsTable)
      .set({ status: "rejected" })
      .where(eq(applicationsTable.id, appId));

    await db.insert(notificationsTable).values({
      userId:  app.userId,
      type:    "rejected",
      title:   "Application Update",
      message: `The Giver did not select your application for "${gift.title}". Keep browsing for more gifts!`,
      giftId:  gift.id,
      appId:   app.id,
    });
  }

  return NextResponse.json({ success: true });
}
