import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { createToken, COOKIE_NAME } from "@/lib/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const emailLower = email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, emailLower));

  if (!user) {
    return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Check if user is blocked
  if (user.blocked) {
    return NextResponse.json(
      { error: "Your account has been blocked. Please contact support." },
      { status: 403 }
    );
  }

  const token = await createToken({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
  });

  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
  });

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return res;
}
