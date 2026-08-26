"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useTransition } from "react";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  createdAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function UsersTable({
  users,
  pagination,
  ageMin,
  ageMax,
}: {
  users: UserRow[];
  pagination: Pagination;
  ageMin?: string;
  ageMax?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams(searchParams.toString());
    const nextAgeMin = String(formData.get("ageMin") ?? "").trim();
    const nextAgeMax = String(formData.get("ageMax") ?? "").trim();

    if (nextAgeMin) params.set("ageMin", nextAgeMin);
    else params.delete("ageMin");

    if (nextAgeMax) params.set("ageMax", nextAgeMax);
    else params.delete("ageMax");

    params.set("page", "1");

    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={applyFilters}
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Min age</span>
          <input
            name="ageMin"
            type="number"
            min={0}
            defaultValue={ageMin ?? ""}
            className="rounded-md border border-border bg-white px-3 py-2 outline-none ring-accent focus:ring-2"
            placeholder="e.g. 18"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Max age</span>
          <input
            name="ageMax"
            type="number"
            min={0}
            defaultValue={ageMax ?? ""}
            className="rounded-md border border-border bg-white px-3 py-2 outline-none ring-accent focus:ring-2"
            placeholder="e.g. 65"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={() =>
              startTransition(() => {
                router.push("/dashboard");
              })
            }
            className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-surface-muted"
          >
            Clear
          </button>
        </div>
      </form>

      <div className={`overflow-x-auto rounded-xl border border-border bg-surface ${isPending ? "opacity-70" : ""}`}>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-muted text-foreground/80">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Age</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold"> </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-foreground/60">
                  No users match the current filters.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-border/80">
                  <td className="px-4 py-3 font-medium">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.age}</td>
                  <td className="px-4 py-3">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/${user.id}`}
                      className="font-medium text-accent hover:text-accent-strong"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground/70">
          Page {pagination.page} of {pagination.totalPages} · {pagination.total} users
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1 || isPending}
            onClick={() => goToPage(pagination.page - 1)}
            className="rounded-md border border-border bg-white px-3 py-2 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages || isPending}
            onClick={() => goToPage(pagination.page + 1)}
            className="rounded-md border border-border bg-white px-3 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
