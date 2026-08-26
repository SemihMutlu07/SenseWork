import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createUserSchema } from "@/lib/validations";
import { clampPage, parsePositiveInt } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const requestedPage = Math.max(1, parsePositiveInt(searchParams.get("page"), 1) || 1);
  const pageSize = Math.min(50, Math.max(1, parsePositiveInt(searchParams.get("pageSize"), 10) || 10));
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

  const total = await prisma.user.count({ where });
  const { page, totalPages } = clampPage(requestedPage, total, pageSize);

  const users = await prisma.user.findMany({
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
  });

  return NextResponse.json({
    users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
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

    const existing = await prisma.user.findFirst({
      where: { email: { equals: parsed.data.email, mode: "insensitive" } },
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
