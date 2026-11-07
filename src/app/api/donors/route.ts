import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { giftsTable, usersTable } from "@/lib/schema";
import { eq, ne, and, count, desc } from "drizzle-orm";

export async function GET() {
  // Count only CLAIMED gifts per donor (actually given out, not just listed)
  const rows = await db
    .select({
      userId:    giftsTable.userId,
      donor:     giftsTable.donor,
      userName:  usersTable.name,
      giftCount: count(giftsTable.id),
    })
    .from(giftsTable)
    .leftJoin(usersTable, eq(giftsTable.userId, usersTable.id))
    .where(and(
      eq(giftsTable.status, "claimed"),
      eq(giftsTable.isAnonymous, false)
    ))
    .groupBy(giftsTable.userId, giftsTable.donor, usersTable.name)
    .orderBy(desc(count(giftsTable.id)))
    .limit(10);

  const donors = rows.map((r, i) => ({
    rank:      i + 1,
    name:      r.userName ?? r.donor,  // prefer account name, fall back to donor alias
    count:     Number(r.giftCount),
    verified:  !!r.userId,             // true = has an account
  }));

  return NextResponse.json({ donors });
}
