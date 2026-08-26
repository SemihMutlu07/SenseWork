import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(31,107,74,0.18),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(20,82,57,0.12),transparent_30%),linear-gradient(135deg,#0f2f22_0%,#1f6b4a_42%,#d8eee3_100%)] opacity-90"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(243,246,244,0.92))]"
      />

      <section className="relative z-10 w-full max-w-md animate-rise rounded-2xl border border-white/40 bg-white/90 p-8 shadow-[var(--shadow)] backdrop-blur">
        <p className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-tight text-accent-strong">
          SenseWork
        </p>
        <h1 className="mt-3 text-xl font-semibold text-foreground">Sign in to continue</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Default seed credentials: <strong>admin</strong> / <strong>admin</strong>
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
