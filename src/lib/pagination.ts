/**
 * Clamp a 1-based page into the valid range for a known result set.
 * Prevents empty "no results" views caused by stale page + new filter.
 */
export function clampPage(requestedPage: number, total: number, pageSize: number): {
  page: number;
  totalPages: number;
} {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / safePageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  return { page, totalPages };
}

export function parsePositiveInt(raw: string | null | undefined, fallback: number): number {
  const n = Number(raw ?? fallback);
  if (!Number.isFinite(n) || Number.isNaN(n)) return fallback;
  return Math.trunc(n);
}
