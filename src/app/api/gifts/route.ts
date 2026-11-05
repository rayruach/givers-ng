import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { giftsTable } from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";
import type { GiftStatus } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category  = searchParams.get("category");
  const state     = searchParams.get("state");
  const admin     = searchParams.get("admin") === "1";

  const conditions = [];

  // Public feed only shows available gifts
  if (!admin) {
    conditions.push(eq(giftsTable.status, "available"));
  }

  const gifts = await db
    .select()
    .from(giftsTable)
    .where(conditions.length ? conditions[0] : undefined)
    .orderBy(giftsTable.createdAt);

  // JS-level filters for category + state (simple, avoids complex query building)
  let results = gifts;
  if (category && category !== "All") results = results.filter((g) => g.category === category);
  if (state && state !== "all")       results = results.filter((g) => g.city === state);

  return NextResponse.json({ gifts: results });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, category, condition, city, area, donor, description, image, images } = body;

  if (!title || !category || !city || !donor) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [gift] = await db
    .insert(giftsTable)
    .values({
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
