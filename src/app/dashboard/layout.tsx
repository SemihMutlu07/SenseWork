import { DashboardNav } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between animate-fade">
        <div>
          <p className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-accent-strong">
            SenseWork
          </p>
          <p className="mt-1 text-sm text-foreground/70">User management dashboard</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DashboardNav />
          <LogoutButton />
        </div>
      </header>
      <div className="animate-rise">{children}</div>
    </div>
  );
}
