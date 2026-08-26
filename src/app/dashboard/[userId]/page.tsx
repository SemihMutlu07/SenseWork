import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function UserDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      age: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  const fields = [
    { label: "ID", value: user.id },
    { label: "First name", value: user.firstName },
    { label: "Last name", value: user.lastName },
    { label: "Email", value: user.email },
    { label: "Age", value: String(user.age) },
    { label: "Created", value: user.createdAt.toLocaleString() },
    { label: "Updated", value: user.updatedAt.toLocaleString() },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-foreground/70">User details</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-muted"
        >
          Back to users
        </Link>
      </div>

      <dl className="grid gap-3 rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)] sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="rounded-lg bg-surface-muted/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
              {field.label}
            </dt>
            <dd className="mt-1 break-all text-sm font-medium">{field.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
