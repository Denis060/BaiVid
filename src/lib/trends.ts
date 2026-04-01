/**
 * Google Trends data fetcher with SerpAPI fallback.
 * Returns trending topics and search volume for a given niche.
 */

export interface TrendData {
  keyword: string;
  searchVolume: string;
  trendDirection: "rising" | "stable" | "declining";
  relatedQueries: string[];
}

/**
 * Fetch trending data for a niche using Google Trends via SerpAPI.
 */
export async function getTrendingData(
  niche: string,
  region: string = "US",
  limit: number = 10
): Promise<TrendData[]> {
  // Try SerpAPI Google Trends endpoint
  if (process.env.SERPAPI_API_KEY) {
    try {
      return await fetchFromSerpAPI(niche, region, limit);
    } catch (err) {
      console.error("SerpAPI failed, using fallback:", err);
    }
  }

  // Fallback: generate synthetic trend signals from Google Trends RSS
  return await fetchTrendsFallback(niche, region, limit);
}

async function fetchFromSerpAPI(
  niche: string,
  region: string,
  limit: number
): Promise<TrendData[]> {
  const params = new URLSearchParams({
    engine: "google_trends",
    q: niche,
    geo: region,
    data_type: "RELATED_QUERIES",
    api_key: process.env.SERPAPI_API_KEY!,
  });

  const res = await fetch(
    `https://serpapi.com/search.json?${params.toString()}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    throw new Error(`SerpAPI returned ${res.status}`);
  }

  const data = await res.json();
  const queries = data.related_queries?.rising || [];

  return queries.slice(0, limit).map(
    (q: { query: string; extracted_value?: number; value?: string }) => ({
      keyword: q.query,
      searchVolume: q.value || `${q.extracted_value || 0}%`,
      trendDirection: "rising" as const,
      relatedQueries: [],
    })
  );
}

async function fetchTrendsFallback(
  niche: string,
  _region: string,
  limit: number
): Promise<TrendData[]> {
  // Use Google Trends RSS for daily trending searches as fallback context
  try {
    const res = await fetch(
      "https://trends.google.com/trending/rss?geo=US",
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return generateSyntheticTrends(niche, limit);
    }

    const xml = await res.text();
    // Extract titles from RSS items
    const titleMatches = xml.match(/<title>([^<]+)<\/title>/g) || [];
    const titles = titleMatches
      .slice(1) // skip RSS channel title
      .map((t) => t.replace(/<\/?title>/g, ""))
      .filter((t) =>
        t.toLowerCase().includes(niche.toLowerCase()) ||
        niche.toLowerCase().split(" ").some((word) => t.toLowerCase().includes(word))
      )
      .slice(0, limit);

    if (titles.length > 0) {
      return titles.map((title) => ({
        keyword: title,
        searchVolume: "trending",
        trendDirection: "rising" as const,
        relatedQueries: [],
      }));
    }
  } catch {
    // Ignore fetch errors
  }

  return generateSyntheticTrends(niche, limit);
}

function generateSyntheticTrends(niche: string, limit: number): TrendData[] {
  // Return the niche itself as a trending keyword so Gemini has context
  return [
    {
      keyword: niche,
      searchVolume: "high",
      trendDirection: "rising" as const,
      relatedQueries: [],
    },
  ].slice(0, limit);
}
