import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-start justify-center gap-4 px-4">
      <p className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-accent-strong">
        SenseWork
      </p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-foreground/70">The requested page does not exist.</p>
      <Link
        href="/dashboard"
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong"
      >
        Go to dashboard
      </Link>
    </main>
  );
}
