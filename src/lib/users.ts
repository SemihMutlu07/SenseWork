import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  parseDashboardQuery,
  type DashboardQuery,
} from "@/lib/dashboard-query";

export type PublicUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  createdAt: string;
};

export function toPublicUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    age: user.age,
    createdAt: user.createdAt.toISOString(),
  };
}

export function ageFilterWhere(
  query: Pick<DashboardQuery, "minAge" | "maxAge">,
): Prisma.UserWhereInput {
  if (query.minAge == null && query.maxAge == null) return {};
  return {
    age: {
      ...(query.minAge != null ? { gte: query.minAge } : {}),
      ...(query.maxAge != null ? { lte: query.maxAge } : {}),
    },
  };
}

export async function listUsers(
  rawParams: URLSearchParams | Record<string, string | string[] | undefined>,
) {
  const query = parseDashboardQuery(rawParams);
  const where = ageFilterWhere(query);
  const total = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const skip = (page - 1) * query.pageSize;

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip,
    take: query.pageSize,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      age: true,
      createdAt: true,
    },
  });

  return {
    users: users.map(toPublicUser),
    pagination: {
      page,
      pageSize: query.pageSize,
      total,
      totalPages,
      minAge: query.minAge,
      maxAge: query.maxAge,
    },
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      age: true,
      createdAt: true,
    },
  });
  return user ? toPublicUser(user) : null;
}
