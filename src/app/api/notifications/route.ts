import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notificationsTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const authUser = await getUserFromRequest(req);
  if (!authUser) return NextResponse.json({ notifications: [], unread: 0 });

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, authUser.id))
    .orderBy(desc(notificationsTable.createdAt));

  const unread = notifications.filter(n => !n.read).length;

  return NextResponse.json({
    notifications: notifications.map(n => ({
      ...n,
      createdAt: n.createdAt.getTime(),
    })),
    unread,
  });
}

export async function PATCH(req: Request) {
  const authUser = await getUserFromRequest(req);
  if (!authUser) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const body = await req.json();
  const { id, readAll } = body;

  if (readAll) {
    await db.update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.userId, authUser.id));
    return NextResponse.json({ success: true });
  }

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, Number(id)));

  return NextResponse.json({ success: true });
}
