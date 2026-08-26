"use client";

import { useRouter, usePathname } from "next/navigation";
import { type FormEvent, useState } from "react";
import { buildDashboardSearchParams } from "@/lib/dashboard-query";

type Props = {
  minAge: number | null;
  maxAge: number | null;
};

export function AgeFilterForm({ minAge, maxAge }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  // Local draft state for typing; parent remounts via key when URL changes.
  const [min, setMin] = useState(minAge?.toString() ?? "");
  const [max, setMax] = useState(maxAge?.toString() ?? "");

  function apply(event: FormEvent) {
    event.preventDefault();
    const minVal = min.trim() === "" ? null : Number(min);
    const maxVal = max.trim() === "" ? null : Number(max);
    const qs = buildDashboardSearchParams({
      page: 1,
      minAge:
        minVal != null && Number.isFinite(minVal) && Number.isInteger(minVal)
          ? minVal
          : null,
      maxAge:
        maxVal != null && Number.isFinite(maxVal) && Number.isInteger(maxVal)
          ? maxVal
          : null,
    });
    router.push(`${pathname}${qs}`);
  }

  function clear() {
    setMin("");
    setMax("");
    router.push(pathname);
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-white p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="minAge" className="text-xs font-medium text-muted">
          Min age
        </label>
        <input
          id="minAge"
          name="minAge"
          inputMode="numeric"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="w-28 rounded-md border border-border px-3 py-2"
          placeholder="e.g. 20"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="maxAge" className="text-xs font-medium text-muted">
          Max age
        </label>
        <input
          id="maxAge"
          name="maxAge"
          inputMode="numeric"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-28 rounded-md border border-border px-3 py-2"
          placeholder="e.g. 40"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Apply filters
      </button>
      <button
        type="button"
        onClick={clear}
        className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
      >
        Clear
      </button>
    </form>
  );
}
