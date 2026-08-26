import Link from "next/link";
import { listUsers } from "@/lib/users";
import { AgeFilterForm } from "@/components/age-filter-form";
import { PaginationControls } from "@/components/pagination-controls";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { users, pagination } = await listUsers(params);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted">
            {pagination.total} user{pagination.total === 1 ? "" : "s"} total
            {pagination.minAge != null || pagination.maxAge != null
              ? " (filtered)"
              : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/add"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Add user
          </Link>
          <Link
            href="/dashboard/addMany"
            className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Bulk import
          </Link>
        </div>
      </div>

      <AgeFilterForm
        key={`filter-${pagination.minAge ?? ""}-${pagination.maxAge ?? ""}`}
        minAge={pagination.minAge}
        maxAge={pagination.maxAge}
      />

      {users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="font-medium text-slate-800">No users found</p>
          <p className="mt-1 text-sm text-muted">
            Try adjusting age filters or add a new user.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/${user.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {user.firstName} {user.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3 text-slate-700">{user.age}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationControls
        page={pagination.page}
        totalPages={pagination.totalPages}
        minAge={pagination.minAge}
        maxAge={pagination.maxAge}
      />
    </div>
  );
}
