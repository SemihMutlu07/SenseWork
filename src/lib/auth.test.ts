import { describe, expect, it } from "vitest";
import {
  createAuthToken,
  verifyAuthToken,
  JWT_TTL_SECONDS,
} from "@/lib/auth";
import { SignJWT } from "jose";
import { hashPassword, verifyPassword } from "@/lib/password";
import { beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

describe("password hashing", () => {
  it("never stores plaintext and verifies correctly", async () => {
    const hashed = await hashPassword("admin");
    expect(hashed).not.toBe("admin");
    expect(hashed.startsWith("$2")).toBe(true);
    expect(await verifyPassword("admin", hashed)).toBe(true);
    expect(await verifyPassword("wrong", hashed)).toBe(false);
  });
});

describe("JWT auth", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it("accepts a valid token", async () => {
    const token = await createAuthToken({
      id: "11111111-1111-4111-8111-111111111111",
      email: "admin",
    });
    const payload = await verifyAuthToken(token);
    expect(payload?.sub).toBe("11111111-1111-4111-8111-111111111111");
    expect(payload?.email).toBe("admin");
  });

  it("rejects a tampered token", async () => {
    const token = await createAuthToken({
      id: "11111111-1111-4111-8111-111111111111",
      email: "admin",
    });
    const parts = token.split(".");
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    );
    payload.email = "attacker@example.com";
    parts[1] = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const tampered = parts.join(".");
    expect(await verifyAuthToken(tampered)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ email: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("11111111-1111-4111-8111-111111111111")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(secret);

    expect(await verifyAuthToken(token)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await new SignJWT({ email: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("11111111-1111-4111-8111-111111111111")
      .setIssuedAt()
      .setExpirationTime(`${JWT_TTL_SECONDS}s`)
      .sign(new TextEncoder().encode("totally-different-secret"));

    expect(await verifyAuthToken(token)).toBeNull();
  });
});
