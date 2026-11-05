import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wishesTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const wishes = await db
    .select()
    .from(wishesTable)
    .orderBy(wishesTable.createdAt);

  return NextResponse.json({ wishes });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, item, category, city, urgency, story } = body;

  if (!name || !item || !city) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [wish] = await db
    .insert(wishesTable)
    .values({
      name,
      item,
      category: category ?? "Other",
      city,
      urgency:  urgency ?? "medium",
      story:    story ?? "",
      granted:  false,
    })
    .returning();

  return NextResponse.json({ wish }, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, granted } = body as { id: number; granted: boolean };

  const [updated] = await db
    .update(wishesTable)
    .set({ granted })
    .where(eq(wishesTable.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Wish not found" }, { status: 404 });

  return NextResponse.json({ wish: updated });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.delete(wishesTable).where(eq(wishesTable.id, id));
  return NextResponse.json({ success: true });
}
