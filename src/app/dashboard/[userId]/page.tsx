import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserById } from "@/lib/users";

type PageProps = {
  params: Promise<{ userId: string }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function UserDetailPage({ params }: PageProps) {
  const { userId } = await params;

  if (!UUID_RE.test(userId)) {
    notFound();
  }

  const user = await getUserById(userId);
  if (!user) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-accent hover:underline"
        >
          ← Back to users
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {user.firstName} {user.lastName}
        </h1>
        <p className="mt-1 text-sm text-muted">User details</p>
      </div>

      <dl className="grid max-w-xl gap-4 rounded-lg border border-border bg-white p-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            First name
          </dt>
          <dd className="mt-1 text-sm font-medium">{user.firstName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Last name
          </dt>
          <dd className="mt-1 text-sm font-medium">{user.lastName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Email
          </dt>
          <dd className="mt-1 text-sm font-medium">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Age
          </dt>
          <dd className="mt-1 text-sm font-medium">{user.age}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">
            Created
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {new Date(user.createdAt).toLocaleString()}
          </dd>
        </div>
      </dl>
    </div>
  );
}
