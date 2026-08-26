import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-border bg-white px-6 py-16 text-center">
      <h1 className="text-xl font-semibold">User not found</h1>
      <p className="mt-2 text-sm text-muted">
        That user does not exist or the id is invalid.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
