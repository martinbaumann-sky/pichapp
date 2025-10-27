import { headers } from "next/headers";

import MatchesPageClient, { type MatchFilters } from "./MatchesPageClient";

type SearchParams = Record<string, string | string[] | undefined>;

const DEFAULT_FILTERS: MatchFilters = {
  comuna: "",
  from: "",
  level: "",
  page: 1,
  pageSize: 24,
};

async function buildBaseUrl() {
  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";

  return `${protocol}://${host}`;
}

function parseFilters(searchParams: SearchParams): MatchFilters {
  const filters: MatchFilters = { ...DEFAULT_FILTERS };

  if (typeof searchParams.comuna === "string") {
    filters.comuna = searchParams.comuna;
  }
  if (typeof searchParams.from === "string") {
    filters.from = searchParams.from;
  }
  if (typeof searchParams.level === "string") {
    filters.level = searchParams.level;
  }
  if (typeof searchParams.page === "string") {
    const parsed = Number.parseInt(searchParams.page, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      filters.page = parsed;
    }
  }
  if (typeof searchParams.pageSize === "string") {
    const parsed = Number.parseInt(searchParams.pageSize, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      filters.pageSize = parsed;
    }
  }

  return filters;
}

function buildQueryString(filters: MatchFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value == null) return;
    params.set(key, String(value));
  });

  return params.toString();
}

async function getInitialMatches(queryString: string) {
  const baseUrl = await buildBaseUrl();
  const url = queryString ? `${baseUrl}/api/matches?${queryString}` : `${baseUrl}/api/matches`;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    console.error("Failed to fetch matches", await response.text());
    return [];
  }

  const data = await response.json();
  return Array.isArray(data?.items) ? data.items : [];
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const filters = parseFilters(resolvedSearchParams);
  const queryString = buildQueryString(filters);
  const items = await getInitialMatches(queryString);

  return <MatchesPageClient initialFilters={filters} initialItems={items} />;
}

