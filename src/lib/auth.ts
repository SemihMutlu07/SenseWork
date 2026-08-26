import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "auth_token";
export const JWT_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export type AuthTokenPayload = JWTPayload & {
  sub: string;
  email: string;
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set to a strong value (16+ chars)");
  }
  return new TextEncoder().encode(secret);
}

export async function createAuthToken(user: {
  id: string;
  email: string;
}): Promise<string> {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${JWT_TTL_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifyAuthToken(
  token: string,
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }

    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function authCookieOptions(maxAge = JWT_TTL_SECONDS) {
  // Prefer explicit COOKIE_SECURE; default to secure in production.
  // Local docker-compose over HTTP should set COOKIE_SECURE=false.
  const secure =
    process.env.COOKIE_SECURE != null
      ? process.env.COOKIE_SECURE === "true"
      : process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function setAuthCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, token, authCookieOptions());
}

export async function clearAuthCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, "", authCookieOptions(0));
}

export async function getSession(): Promise<AuthTokenPayload | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}
