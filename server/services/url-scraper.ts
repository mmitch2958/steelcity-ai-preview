import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  textContent: string;
  images: string[];
  price?: string;
  address?: string;
  details: Record<string, string>;
  metaTags: Record<string, string>;
}

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "social-media");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

async function downloadImage(imageUrl: string): Promise<string | null> {
  try {
    ensureUploadDir();
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("image")) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 5000) return null;
    const ext =
      contentType.includes("png") ? ".png" :
      contentType.includes("webp") ? ".webp" :
      contentType.includes("gif") ? ".gif" : ".jpg";
    const filename = `scraped-${crypto.randomBytes(8).toString("hex")}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    return `/uploads/social-media/${filename}`;
  } catch {
    return null;
  }
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

function isValidImageUrl(src: string): boolean {
  if (!src || src.length < 10) return false;
  if (src.startsWith("data:")) return false;
  if (/\.(svg|ico|gif)$/i.test(src)) return false;
  if (/logo|icon|favicon|sprite|badge|button|arrow|pixel|tracking|analytics|1x1/i.test(src)) return false;
  return true;
}

export async function scrapeUrl(url: string, maxImages: number = 5): Promise<ScrapedData> {
  console.log(`[SCRAPER] Fetching: ${url}`);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe, nav, footer, header").remove();

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "";

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    $("p").first().text().trim().slice(0, 500) ||
    "";

  const metaTags: Record<string, string> = {};
  $("meta").each((_, el) => {
    const name =
      $(el).attr("property") || $(el).attr("name") || "";
    const content = $(el).attr("content") || "";
    if (name && content && name.length < 50) {
      metaTags[name] = content;
    }
  });

  const details: Record<string, string> = {};

  const priceMatch = html.match(/\$[\d,]+(?:\.\d{2})?/);
  const price = priceMatch ? priceMatch[0] : metaTags["product:price:amount"] || "";
  if (price) details["price"] = price;

  const addressCandidates: string[] = [];
  $('[class*="address"], [class*="location"], [data-testid*="address"]').each(
    (_, el) => {
      const text = $(el).text().trim();
      if (text.length > 5 && text.length < 200) addressCandidates.push(text);
    }
  );
  const address = addressCandidates[0] || metaTags["og:street-address"] || "";
  if (address) details["address"] = address;

  $('[class*="detail"], [class*="feature"], [class*="spec"], [class*="info"], [class*="fact"]').each(
    (_, el) => {
      const text = $(el).text().trim();
      if (text.length > 3 && text.length < 300) {
        const key = $(el).attr("class")?.split(/\s+/)[0] || `detail_${Object.keys(details).length}`;
        if (Object.keys(details).length < 20) {
          details[key] = text;
        }
      }
    }
  );

  const mainContent: string[] = [];
  $("main, article, [role='main'], .content, .listing, .property, #content").each(
    (_, el) => {
      $(el)
        .find("p, li, h2, h3, h4, span, div")
        .each((_, child) => {
          const text = $(child).text().trim();
          if (text.length > 10 && text.length < 1000) {
            mainContent.push(text);
          }
        });
    }
  );
  if (mainContent.length < 3) {
    $("p, li").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 15 && text.length < 1000) {
        mainContent.push(text);
      }
    });
  }
  const uniqueContent = Array.from(new Set(mainContent));
  const textContent = uniqueContent.slice(0, 30).join("\n");

  const imageUrls: string[] = [];
  const seenUrls = new Set<string>();

  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage && isValidImageUrl(ogImage)) {
    const resolved = resolveUrl(url, ogImage);
    seenUrls.add(resolved);
    imageUrls.push(resolved);
  }

  $("img").each((_, el) => {
    if (imageUrls.length >= maxImages * 2) return;
    const src =
      $(el).attr("data-src") ||
      $(el).attr("data-lazy-src") ||
      $(el).attr("src") ||
      "";
    if (!isValidImageUrl(src)) return;
    const resolved = resolveUrl(url, src);
    if (seenUrls.has(resolved)) return;
    const width = parseInt($(el).attr("width") || "0", 10);
    const height = parseInt($(el).attr("height") || "0", 10);
    if ((width > 0 && width < 100) || (height > 0 && height < 100)) return;
    seenUrls.add(resolved);
    imageUrls.push(resolved);
  });

  $('[style*="background-image"]').each((_, el) => {
    if (imageUrls.length >= maxImages * 2) return;
    const style = $(el).attr("style") || "";
    const bgMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (bgMatch && isValidImageUrl(bgMatch[1])) {
      const resolved = resolveUrl(url, bgMatch[1]);
      if (!seenUrls.has(resolved)) {
        seenUrls.add(resolved);
        imageUrls.push(resolved);
      }
    }
  });

  console.log(`[SCRAPER] Found ${imageUrls.length} candidate images, downloading up to ${maxImages}...`);
  const downloadedImages: string[] = [];
  for (const imgUrl of imageUrls) {
    if (downloadedImages.length >= maxImages) break;
    const local = await downloadImage(imgUrl);
    if (local) downloadedImages.push(local);
  }
  console.log(`[SCRAPER] Downloaded ${downloadedImages.length} images`);

  return {
    url,
    title,
    description,
    textContent,
    images: downloadedImages,
    price: price || undefined,
    address: address || undefined,
    details,
    metaTags,
  };
}

export function extractScrapeUrl(text: string): { url: string; cleanedText: string } | null {
  const match = text.match(/\(scrape\s+(https?:\/\/[^\s)]+)\s*\)/i);
  if (!match) return null;
  const url = match[1];
  const cleanedText = text.replace(match[0], "").replace(/\s{2,}/g, " ").trim();
  return { url, cleanedText };
}

export function formatScrapedDataForAI(data: ScrapedData): string {
  const lines: string[] = [
    `=== SCRAPED CONTENT FROM: ${data.url} ===`,
  ];
  if (data.title) lines.push(`Title: ${data.title}`);
  if (data.address) lines.push(`Address: ${data.address}`);
  if (data.price) lines.push(`Price: ${data.price}`);
  if (data.description) lines.push(`Description: ${data.description}`);

  const detailEntries = Object.entries(data.details).filter(
    ([k]) => k !== "price" && k !== "address"
  );
  if (detailEntries.length > 0) {
    lines.push("\nKey Details:");
    for (const [, value] of detailEntries.slice(0, 10)) {
      lines.push(`- ${value}`);
    }
  }

  if (data.textContent) {
    lines.push(`\nPage Content:\n${data.textContent.slice(0, 2000)}`);
  }

  if (data.images.length > 0) {
    lines.push(`\n${data.images.length} images were scraped and will be attached to the post.`);
  }

  lines.push("=== END SCRAPED CONTENT ===");
  return lines.join("\n");
}
