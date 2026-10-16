export interface LiteratureRef {
  title: string;
  year: number | null;
  venue: string;
  citedBy: number;
  url: string;
  abstract: string;
}

export interface LiteratureSearchResult {
  source: string;
  papers: LiteratureRef[];
  errors: string[];
}

const UA = "RRStudio/1.0 (academic submission tool)";

/** OpenAlex 的摘要以倒排索引存储,重建为原文 */
function invertAbstract(inv: Record<string, number[]> | null | undefined): string {
  if (!inv) return "";
  const arr: string[] = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const i of positions) arr[i] = word;
  }
  return arr.filter(Boolean).join(" ");
}

async function searchOpenAlex(query: string, fromYear: number): Promise<LiteratureRef[]> {
  const url =
    `https://api.openalex.org/works?search=${encodeURIComponent(query)}` +
    `&filter=from_publication_date:${fromYear}-01-01&per-page=8`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
  const data = (await res.json()) as {
    results?: Array<{
      id?: string;
      doi?: string;
      display_name?: string;
      publication_year?: number | null;
      cited_by_count?: number;
      primary_location?: { source?: { display_name?: string } | null };
      abstract_inverted_index?: Record<string, number[]> | null;
    }>;
  };
  return (data.results ?? [])
    .filter((r) => r.display_name)
    .map((r) => ({
      title: r.display_name as string,
      year: r.publication_year ?? null,
      venue: r.primary_location?.source?.display_name ?? "",
      citedBy: r.cited_by_count ?? 0,
      url: r.doi
        ? `https://doi.org/${r.doi.replace(/^https?:\/\/doi\.org\//, "")}`
        : (r.id ?? ""),
      abstract: invertAbstract(r.abstract_inverted_index).slice(0, 600),
    }));
}

async function searchSemanticScholar(query: string, fromYear: number): Promise<LiteratureRef[]> {
  const url =
    `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}` +
    `&limit=8&fields=title,year,venue,citationCount,abstract,externalIds,url`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`SemanticScholar ${res.status}`);
  const data = (await res.json()) as {
    data?: Array<{
      title?: string;
      year?: number | null;
      venue?: string;
      citationCount?: number;
      abstract?: string | null;
      url?: string;
      externalIds?: { DOI?: string };
    }>;
  };
  return (data.data ?? [])
    .filter((r) => r.title && (r.year == null || r.year >= fromYear))
    .map((r) => ({
      title: r.title as string,
      year: r.year ?? null,
      venue: r.venue ?? "",
      citedBy: r.citationCount ?? 0,
      url: r.externalIds?.DOI
        ? `https://doi.org/${r.externalIds.DOI}`
        : (r.url ?? ""),
      abstract: (r.abstract ?? "").slice(0, 600),
    }));
}

const normTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "");

/**
 * 文献对标:多查询检索近三年真实文献,标题去重后按年份/被引排序。
 * OpenAlex 优先(无限额),失败逐查询回退 Semantic Scholar。
 */
export async function searchLiterature(queries: string[]): Promise<LiteratureSearchResult> {
  const fromYear = new Date().getUTCFullYear() - 3;
  const errors: string[] = [];
  const merged: LiteratureRef[] = [];
  let source = "OpenAlex";

  for (const query of queries.slice(0, 3)) {
    let papers: LiteratureRef[] = [];
    try {
      papers = await searchOpenAlex(query, fromYear);
    } catch (e) {
      errors.push(`OpenAlex(${query.slice(0, 40)}): ${e instanceof Error ? e.message : "failed"}`);
      try {
        source = "Semantic Scholar";
        papers = await searchSemanticScholar(query, fromYear);
      } catch (e2) {
        errors.push(`S2(${query.slice(0, 40)}): ${e2 instanceof Error ? e2.message : "failed"}`);
      }
    }
    merged.push(...papers);
  }

  const seen = new Set<string>();
  const papers = merged
    .filter((p) => {
      const key = normTitle(p.title);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    // 审稿依据优先有分量的论文:被引优先,近年其次
    .sort((a, b) => b.citedBy - a.citedBy || (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 10);

  return { source, papers, errors };
}
