import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "givers-auth";

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(s);
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
}

/** Create a signed JWT for a user */
export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(getSecret());
}

/** Verify a JWT and return the user payload */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

/** Extract user from request cookies (server-side) */
export async function getUserFromRequest(req: Request): Promise<AuthUser | null> {
  const cookies = req.headers.get("cookie") ?? "";
  const match = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return verifyToken(match[1]);
}

export { COOKIE_NAME };
