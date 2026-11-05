import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { createToken, COOKIE_NAME } from "@/lib/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { name, email, phone, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }

  const emailLower = email.toLowerCase().trim();

  // Check if user already exists
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, emailLower));

  if (existing.length > 0) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  // Hash password
  const hashed = await bcrypt.hash(password, 10);

  // Create user
  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email: emailLower,
      phone: phone ?? "",
      password: hashed,
    })
    .returning();

  // Create JWT
  const token = await createToken({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  });

  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
  }, { status: 201 });

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  return res;
}
