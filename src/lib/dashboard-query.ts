/**
 * Dashboard list query params are the source of truth for pagination/filters.
 * Malformed values are clamped/ignored rather than crashing.
 */

export type DashboardQuery = {
  page: number;
  pageSize: number;
  minAge: number | null;
  maxAge: number | null;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(value: string | undefined | null): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return n;
}

export function parseDashboardQuery(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): DashboardQuery {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? undefined;
    }
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };

  let page = parsePositiveInt(get("page")) ?? DEFAULT_PAGE;
  if (page < 1) page = DEFAULT_PAGE;

  let pageSize = parsePositiveInt(get("pageSize")) ?? DEFAULT_PAGE_SIZE;
  if (pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  let minAge = parsePositiveInt(get("minAge"));
  let maxAge = parsePositiveInt(get("maxAge"));

  if (minAge != null && minAge < 0) minAge = null;
  if (maxAge != null && maxAge < 0) maxAge = null;

  // Inverted range is treated as no age filter rather than an empty hard crash.
  if (minAge != null && maxAge != null && minAge > maxAge) {
    minAge = null;
    maxAge = null;
  }

  return { page, pageSize, minAge, maxAge };
}

export function buildDashboardSearchParams(query: {
  page?: number;
  pageSize?: number;
  minAge?: number | null;
  maxAge?: number | null;
}): string {
  const params = new URLSearchParams();
  const page = query.page && query.page > 1 ? query.page : undefined;
  if (page) params.set("page", String(page));
  if (query.pageSize && query.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(query.pageSize));
  }
  if (query.minAge != null) params.set("minAge", String(query.minAge));
  if (query.maxAge != null) params.set("maxAge", String(query.maxAge));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
