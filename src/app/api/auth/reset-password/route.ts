import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersTable, passwordResetTokensTable } from "@/lib/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 */
export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  // Find valid token
  const [resetToken] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.token, token),
        eq(passwordResetTokensTable.used, false),
        gt(passwordResetTokensTable.expiresAt, new Date())
      )
    );

  if (!resetToken) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 }
    );
  }

  // Hash new password
  const hashed = await bcrypt.hash(password, 10);

  // Update user password
  await db
    .update(usersTable)
    .set({ password: hashed })
    .where(eq(usersTable.id, resetToken.userId));

  // Mark token as used
  await db
    .update(passwordResetTokensTable)
    .set({ used: true })
    .where(eq(passwordResetTokensTable.id, resetToken.id));

  return NextResponse.json({ success: true, message: "Password updated successfully. You can now log in." });
}
