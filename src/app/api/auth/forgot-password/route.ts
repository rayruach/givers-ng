import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { usersTable, passwordResetTokensTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const emailLower = email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, emailLower));

  // Always return success — prevents email enumeration
  if (!user) {
    return NextResponse.json({ success: true, message: "If an account exists with this email, a reset link has been sent." });
  }

  // Invalidate old tokens
  await db
    .update(passwordResetTokensTable)
    .set({ used: true })
    .where(eq(passwordResetTokensTable.userId, user.id));

  // Create new token (expires in 1 hour)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(passwordResetTokensTable).values({
    userId: user.id,
    token,
    expiresAt,
    used: false,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  // Send email via Resend
  try {
    await resend.emails.send({
      from: "Givers.ng <noreply@givers.ng>",
      to: emailLower,
      subject: "Reset your Givers.ng password",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#fdf8f6;font-family:Inter,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f6;padding:40px 20px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;padding:40px;border:1px solid #ffc2d8;">

                <!-- Logo -->
                <tr><td align="center" style="padding-bottom:24px;">
                  <span style="font-size:28px;font-weight:900;color:#f02d6a;letter-spacing:-0.04em;">Givers<span style="color:#d91758">.ng</span></span>
                  <div style="font-size:10px;color:#9ca3af;letter-spacing:0.12em;text-transform:uppercase;margin-top:2px;">BallHard Charities</div>
                </td></tr>

                <!-- Icon -->
                <tr><td align="center" style="padding-bottom:20px;">
                  <div style="width:64px;height:64px;background:#fff0f5;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;border:2px solid #ffc2d8;">
                    <span style="font-size:28px;">🔑</span>
                  </div>
                </td></tr>

                <!-- Body -->
                <tr><td style="text-align:center;padding-bottom:8px;">
                  <h1 style="margin:0;font-size:20px;font-weight:800;color:#1a1a2e;">Reset Your Password</h1>
                </td></tr>
                <tr><td style="text-align:center;padding-bottom:28px;">
                  <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                    Hi ${user.name}, we received a request to reset your password.<br>
                    Click the button below to choose a new one.
                  </p>
                </td></tr>

                <!-- CTA -->
                <tr><td align="center" style="padding-bottom:28px;">
                  <a href="${resetUrl}" style="display:inline-block;background:#f02d6a;color:#fff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.02em;">
                    Reset My Password
                  </a>
                </td></tr>

                <!-- Expiry note -->
                <tr><td style="text-align:center;padding-bottom:24px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">
                    This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
                  </p>
                </td></tr>

                <!-- Divider -->
                <tr><td style="border-top:1px solid #fce7f3;padding-top:20px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#d1d5db;">
                    Or copy this link: <a href="${resetUrl}" style="color:#f02d6a;word-break:break-all;">${resetUrl}</a>
                  </p>
                </td></tr>

                <!-- Footer -->
                <tr><td style="text-align:center;padding-top:20px;">
                  <p style="margin:0;font-size:11px;color:#d1d5db;">
                    © ${new Date().getFullYear()} Givers.ng · BallHard Charities · Nigeria
                  </p>
                </td></tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error("Resend email error:", err);
    // Don't expose email errors to the client
  }

  return NextResponse.json({
    success: true,
    message: "If an account exists with this email, a reset link has been sent.",
  });
}
