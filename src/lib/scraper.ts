/**
 * URL scraper — extracts article content from URLs using Cheerio.
 */

import * as cheerio from "cheerio";

export interface ScrapedContent {
  title: string;
  summary: string;
  content: string;
  imageUrl: string | null;
  siteName: string | null;
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Baivid/1.0; +https://baivid.com)",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL (${res.status})`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Extract title
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled";

  // Extract description/summary
  const summary =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    $("p").first().text().trim().slice(0, 300) ||
    "";

  // Extract main content
  const contentSelectors = [
    "article",
    '[role="main"]',
    ".post-content",
    ".article-body",
    ".entry-content",
    "main",
  ];

  let content = "";
  for (const selector of contentSelectors) {
    const el = $(selector);
    if (el.length) {
      content = el
        .find("p, h2, h3, li")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((t) => t.length > 20)
        .join("\n\n");
      if (content.length > 100) break;
    }
  }

  // Fallback: all paragraphs
  if (content.length < 100) {
    content = $("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 30)
      .slice(0, 20)
      .join("\n\n");
  }

  // Extract image
  const imageUrl =
    $('meta[property="og:image"]').attr("content") ||
    $("article img").first().attr("src") ||
    null;

  const siteName =
    $('meta[property="og:site_name"]').attr("content") || null;

  return {
    title: title.slice(0, 200),
    summary: summary.slice(0, 500),
    content: content.slice(0, 5000),
    imageUrl,
    siteName,
  };
}
