import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createUserSchema } from "@/lib/validations/user";
import { listUsers, toPublicUser } from "@/lib/users";
import { jsonError } from "@/lib/api";

async function requireAuth() {
  const session = await getSession();
  if (!session) {
    return null;
  }
  return session;
}

export async function GET(request: Request) {
  if (!(await requireAuth())) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const { searchParams } = new URL(request.url);
  const result = await listUsers(searchParams);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, {
      code: "INVALID_JSON",
      message: "Request body must be JSON",
    });
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, {
      code: "VALIDATION_ERROR",
      message: "Invalid user data",
      errors: parsed.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? "form"),
        message: issue.message,
      })),
    });
  }

  const data = parsed.data;

  try {
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        age: data.age,
        password: await hashPassword(data.password),
      },
    });

    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError(409, {
        code: "DUPLICATE_EMAIL",
        message: "Email already exists",
        errors: [{ field: "email", message: "Email already exists" }],
      });
    }
    throw error;
  }
}
