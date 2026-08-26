import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UsersTable } from "@/components/users-table";
import { clampPage, parsePositiveInt } from "@/lib/pagination";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  ageMin?: string;
  ageMax?: string;
}>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const requestedPage = Math.max(1, parsePositiveInt(params.page, 1) || 1);
  const pageSize = Math.min(50, Math.max(1, parsePositiveInt(params.pageSize, 10) || 10));
  const ageMin =
    params.ageMin !== undefined && params.ageMin !== ""
      ? Number(params.ageMin)
      : undefined;
  const ageMax =
    params.ageMax !== undefined && params.ageMax !== ""
      ? Number(params.ageMax)
      : undefined;

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

  // Keep URL coherent with the rendered page (stale page + filter desync).
  if (page !== requestedPage) {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    if (params.pageSize) qs.set("pageSize", String(pageSize));
    if (params.ageMin !== undefined && params.ageMin !== "") qs.set("ageMin", params.ageMin);
    if (params.ageMax !== undefined && params.ageMax !== "") qs.set("ageMax", params.ageMax);
    redirect(`/dashboard?${qs.toString()}`);
  }

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

  const serialized = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-foreground/70">
          Paginated list with age filters via URL query params.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-foreground/60">Loading users…</div>}>
        <UsersTable
          users={serialized}
          pagination={{
            page,
            pageSize,
            total,
            totalPages,
          }}
          ageMin={params.ageMin}
          ageMax={params.ageMax}
        />
      </Suspense>
    </section>
  );
}
