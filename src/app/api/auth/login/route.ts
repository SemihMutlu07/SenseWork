import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createAuthToken,
  setAuthCookie,
} from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { loginSchema, normalizeEmail } from "@/lib/validations/user";
import { jsonError } from "@/lib/api";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, {
      code: "INVALID_JSON",
      message: "Request body must be JSON",
    });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, {
      code: "VALIDATION_ERROR",
      message: "Invalid credentials payload",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "form",
        message: issue.message,
      })),
    });
  }

  // Seeded admin uses email "admin"; normalize other emails for lookup.
  const emailInput = parsed.data.email.trim();
  const email =
    emailInput.toLowerCase() === "admin"
      ? "admin"
      : normalizeEmail(emailInput);

  const user = await prisma.user.findUnique({ where: { email } });

  // Constant-ish failure path: always run a compare when possible.
  const valid =
    user != null &&
    (await verifyPassword(parsed.data.password, user.password));

  if (!valid) {
    return jsonError(401, {
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    });
  }

  const token = await createAuthToken({ id: user.id, email: user.email });
  await setAuthCookie(token);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
}
