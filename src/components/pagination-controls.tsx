import Link from "next/link";
import { buildDashboardSearchParams } from "@/lib/dashboard-query";

type Props = {
  page: number;
  totalPages: number;
  minAge: number | null;
  maxAge: number | null;
};

export function PaginationControls({
  page,
  totalPages,
  minAge,
  maxAge,
}: Props) {
  function hrefFor(target: number) {
    return `/dashboard${buildDashboardSearchParams({
      page: target,
      minAge,
      maxAge,
    })}`;
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="rounded-md border border-border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-md border border-border px-3 py-1.5 text-sm text-slate-300">
            Previous
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="rounded-md border border-border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-md border border-border px-3 py-1.5 text-sm text-slate-300">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
