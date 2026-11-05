import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersTable, claimsTable } from "@/lib/schema";
import { eq, count } from "drizzle-orm";

export async function GET() {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      blocked: usersTable.blocked,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.createdAt);

  // Get claim count per user
  const claimCounts = await db
    .select({
      email: claimsTable.claimerEmail,
      count: count(),
    })
    .from(claimsTable)
    .groupBy(claimsTable.claimerEmail);

  const claimMap = Object.fromEntries(
    claimCounts.map((c) => [c.email, Number(c.count)])
  );

  const result = users.map((u) => ({
    ...u,
    claimCount: claimMap[u.email] ?? 0,
  }));

  return NextResponse.json({ users: result });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, blocked } = body as { id: number; blocked: boolean };

  const [updated] = await db
    .update(usersTable)
    .set({ blocked })
    .where(eq(usersTable.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ user: updated });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.delete(usersTable).where(eq(usersTable.id, id));
  return NextResponse.json({ success: true });
}
