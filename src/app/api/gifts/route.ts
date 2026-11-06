import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { giftsTable, applicationsTable } from "@/lib/schema";
import { eq, desc, count } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/auth";
import type { GiftStatus } from "@/lib/types";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60)          return "just now";
  if (seconds < 3600)        return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)       return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 7)   return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-NG");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const state    = searchParams.get("state");
  const admin    = searchParams.get("admin") === "1";
  const mine     = searchParams.get("mine") === "1";

  const authUser = await getUserFromRequest(req);

  let whereClause = undefined;

  if (mine && authUser) {
    // Only gifts posted by this user (giver dashboard)
    whereClause = eq(giftsTable.userId, authUser.id);
  } else if (!admin) {
    // Public feed — only available gifts
    whereClause = eq(giftsTable.status, "available");
  }
  // admin=1 with no mine: returns all gifts (admin panel)

  const rows = await db
    .select()
    .from(giftsTable)
    .where(whereClause)
    .orderBy(desc(giftsTable.createdAt));

  // Get application counts per gift
  const appCounts = await db
    .select({ giftId: applicationsTable.giftId, count: count() })
    .from(applicationsTable)
    .groupBy(applicationsTable.giftId);

  const countMap = Object.fromEntries(appCounts.map(r => [r.giftId, Number(r.count)]));

  let results = rows.map((g) => ({
    ...g,
    timeAgo: timeAgo(g.createdAt),
    createdAt: g.createdAt.getTime(),
    images: g.images ?? [],
    applicationCount: countMap[g.id] ?? 0,
  }));

  if (category && category !== "All") results = results.filter((g) => g.category === category);
  if (state && state !== "all")       results = results.filter((g) => g.city === state);

  return NextResponse.json({ gifts: results });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, category, condition, city, area, donor, isAnonymous, description, image, images } = body;

  // Auth is optional for giving — if logged in we save their userId
  // But we require an account for the leaderboard to work properly
  const authUser = await getUserFromRequest(req);
  if (!authUser) {
    return NextResponse.json(
      { error: "You must be logged in to give an item." },
      { status: 401 }
    );
  }

  if (!title || !category || !city || !donor) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [gift] = await db
    .insert(giftsTable)
    .values({
      userId: authUser.id,
      title,
      category,
      condition: condition ?? "Gently Used",
      city,
      area: area ?? "",
      donor: isAnonymous ? "Anonymous" : donor,
      isAnonymous: !!isAnonymous,
      description: description ?? "",
      image: image ?? `https://placehold.co/600x400/f9f0eb/f02d6a?text=${encodeURIComponent(title)}`,
      images: images ?? (image ? [image] : []),
      status: "available",
    })
    .returning();

  return NextResponse.json({ gift }, { status: 201 });
}

export async function PATCH(req: Request) {
  const authUser = await getUserFromRequest(req);
  if (!authUser) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json();
  const { id, status, title, description, condition } = body as {
    id: number;
    status?: GiftStatus;
    title?: string;
    description?: string;
    condition?: string;
  };

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Fetch gift and verify ownership
  const [gift] = await db.select().from(giftsTable).where(eq(giftsTable.id, id));
  if (!gift) return NextResponse.json({ error: "Gift not found" }, { status: 404 });

  const isAdmin = req.headers.get("x-admin") === "1";
  if (!isAdmin && gift.userId !== authUser.id) {
    return NextResponse.json({ error: "Not your gift" }, { status: 403 });
  }

  // Build update payload
  const updates: Partial<typeof gift> = {};
  if (status) updates.status = status;
  if (title?.trim()) updates.title = title.trim();
  if (description !== undefined) updates.description = description;
  if (condition) updates.condition = condition;

  // Editing title/description/condition only allowed if not claimed/removed
  if ((title || description !== undefined || condition) &&
      (gift.status === "claimed" || gift.status === "removed")) {
    return NextResponse.json(
      { error: "Cannot edit a gift that has already been claimed or removed." },
      { status: 409 }
    );
  }

  const [updated] = await db
    .update(giftsTable)
    .set(updates)
    .where(eq(giftsTable.id, id))
    .returning();

  return NextResponse.json({ gift: updated });
}

export async function DELETE(req: Request) {
  const authUser = await getUserFromRequest(req);
  if (!authUser) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Fetch the gift
  const [gift] = await db.select().from(giftsTable).where(eq(giftsTable.id, id));
  if (!gift) return NextResponse.json({ error: "Gift not found" }, { status: 404 });

  // Only the owner can delete (or admin)
  const isAdmin = searchParams.get("admin") === "1";
  if (!isAdmin && gift.userId !== authUser.id) {
    return NextResponse.json({ error: "Not your gift" }, { status: 403 });
  }

  // Block deletion if anyone has paid
  if (gift.status === "claimed") {
    return NextResponse.json(
      { error: "This gift has already been claimed and paid for. You cannot delete it. Contact support if needed." },
      { status: 409 }
    );
  }

  // Block deletion if pending (someone selected and awaiting payment)
  if (gift.status === "pending") {
    return NextResponse.json(
      { error: "Someone has been selected and is awaiting payment for this gift. You cannot delete it right now." },
      { status: 409 }
    );
  }

  // Safe to delete — also clean up related applications
  await db.delete(applicationsTable).where(eq(applicationsTable.giftId, id));
  await db.delete(giftsTable).where(eq(giftsTable.id, id));

  return NextResponse.json({ success: true });
}
