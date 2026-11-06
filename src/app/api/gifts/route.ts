import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { giftsTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
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

  const rows = await db
    .select()
    .from(giftsTable)
    .where(!admin ? eq(giftsTable.status, "available") : undefined)
    .orderBy(desc(giftsTable.createdAt));

  // Normalize: add timeAgo, convert Date to number, ensure images is array
  let results = rows.map((g) => ({
    ...g,
    timeAgo: timeAgo(g.createdAt),
    createdAt: g.createdAt.getTime(),
    images: g.images ?? [],
  }));

  if (category && category !== "All") results = results.filter((g) => g.category === category);
  if (state && state !== "all")       results = results.filter((g) => g.city === state);

  return NextResponse.json({ gifts: results });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, category, condition, city, area, donor, description, image, images } = body;

  // Auth is optional for giving — if logged in, we save their userId
  const authUser = await getUserFromRequest(req);

  if (!title || !category || !city || !donor) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [gift] = await db
    .insert(giftsTable)
    .values({
      ...(authUser ? { userId: authUser.id } : {}),
      title,
      category,
      condition: condition ?? "Gently Used",
      city,
      area: area ?? "",
      donor,
      description: description ?? "",
      image: image ?? `https://placehold.co/600x400/f9f0eb/f02d6a?text=${encodeURIComponent(title)}`,
      images: images ?? (image ? [image] : []),
      status: "available",
    })
    .returning();

  return NextResponse.json({ gift }, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, status } = body as { id: number; status: GiftStatus };

  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const [updated] = await db
    .update(giftsTable)
    .set({ status })
    .where(eq(giftsTable.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Gift not found" }, { status: 404 });

  return NextResponse.json({ gift: updated });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.delete(giftsTable).where(eq(giftsTable.id, id));
  return NextResponse.json({ success: true });
}
