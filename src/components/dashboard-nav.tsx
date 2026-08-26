"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Users" },
  { href: "/dashboard/add", label: "Add user" },
  { href: "/dashboard/addMany", label: "Bulk upload" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-accent text-white"
                : "bg-surface text-foreground hover:bg-surface-muted"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
