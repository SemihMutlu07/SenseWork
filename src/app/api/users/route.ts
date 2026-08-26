import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createUserSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "10") || 10));
  const ageMinRaw = searchParams.get("ageMin");
  const ageMaxRaw = searchParams.get("ageMax");

  const ageMin = ageMinRaw !== null && ageMinRaw !== "" ? Number(ageMinRaw) : undefined;
  const ageMax = ageMaxRaw !== null && ageMaxRaw !== "" ? Number(ageMaxRaw) : undefined;

  const where: {
    age?: { gte?: number; lte?: number };
  } = {};

  if (
    (ageMin !== undefined && !Number.isNaN(ageMin)) ||
    (ageMax !== undefined && !Number.isNaN(ageMax))
  ) {
    where.age = {};
    if (ageMin !== undefined && !Number.isNaN(ageMin)) where.age.gte = ageMin;
    if (ageMax !== undefined && !Number.isNaN(ageMax)) where.age.lte = ageMax;
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        age: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        age: parsed.data.age,
        password: passwordHash,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        age: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
