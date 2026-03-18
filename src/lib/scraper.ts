import * as cheerio from "cheerio";
import { chromium } from "playwright";

export interface ScrapedProperty {
  title: string;
  price: string;
  location: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  description: string;
  condominium: string;
  iptu: string;
  images: string[];
  url: string;
  source: string;
  rawText: string;
}

function detectSource(url: string): string {
  if (url.includes("olx.com.br")) return "olx";
  if (url.includes("zapimoveis.com.br")) return "zap";
  if (url.includes("vivareal.com.br")) return "vivareal";
  if (url.includes("quintoandar.com.br")) return "quintoandar";
  if (url.includes("imovelweb.com.br")) return "imovelweb";
  return "unknown";
}

function extractStructured($: cheerio.CheerioAPI): Partial<ScrapedProperty> {
  const title = $("h1").first().text().trim();

  // Try multiple selectors for price
  let price = "";
  const priceSelectors = [
    '[data-testid="price-value"]',
    '[data-qa="POSTING_CARD_PRICE"]',
    '.price-value',
    '.posting-price',
    'span.price',
    '[class*="price"]',
    '[class*="Price"]',
  ];
  for (const sel of priceSelectors) {
    const text = $(sel).first().text().trim();
    if (text && /R\$/.test(text)) {
      price = text;
      break;
    }
  }
  if (!price) {
    $("*").each((_, el) => {
      const text = $(el).clone().children().remove().end().text().trim();
      if (!price && /^R\$\s*[\d.,]+/.test(text) && text.length < 30) {
        price = text;
      }
    });
  }

  // Location
  let location = "";
  const locationSelectors = [
    '[data-testid="ad-location"]',
    '[data-qa="POSTING_CARD_LOCATION"]',
    '.posting-location',
    '[class*="location"]',
    '[class*="Location"]',
    'address',
  ];
  for (const sel of locationSelectors) {
    const text = $(sel).first().text().trim();
    if (text && text.length > 3) {
      location = text;
      break;
    }
  }

  // Details from list items, spans, etc.
  const details: Record<string, string> = {};
  $("li, span, div").each((_, el) => {
    const text = $(el).clone().children().remove().end().text().trim();
    const fullText = $(el).text().trim();
    if ((text.includes("m²") || fullText.includes("m²")) && !details.area && fullText.length < 50) {
      details.area = fullText;
    }
    if (/quarto|dorm|suite/i.test(fullText) && !details.bedrooms && fullText.length < 50) {
      details.bedrooms = fullText;
    }
    if (/banheiro|wc/i.test(fullText) && !details.bathrooms && fullText.length < 50) {
      details.bathrooms = fullText;
    }
    if (/vaga|garage/i.test(fullText) && !details.parking && fullText.length < 50) {
      details.parking = fullText;
    }
    if (/condom[ií]nio/i.test(fullText) && /R\$/.test(fullText) && !details.condominium && fullText.length < 60) {
      details.condominium = fullText;
    }
    if (/iptu/i.test(fullText) && /R\$/.test(fullText) && !details.iptu && fullText.length < 60) {
      details.iptu = fullText;
    }
  });

  // Description
  let description = "";
  const descSelectors = [
    '[data-testid="ad-description"]',
    '[id*="description"]',
    '[class*="description"]',
    '[class*="Description"]',
  ];
  for (const sel of descSelectors) {
    const text = $(sel).first().text().trim();
    if (text && text.length > 20) {
      description = text.slice(0, 2000);
      break;
    }
  }
  if (!description) {
    description = $("meta[name='description']").attr("content") || "";
  }

  return { title, price, location, description, ...details };
}

async function fetchWithPlaywright(url: string): Promise<string> {
  const browser = await chromium.launch({
    headless: false, // Use headed mode to avoid Cloudflare detection
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
    ],
  });
  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      locale: "pt-BR",
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    // Remove webdriver flag to avoid bot detection
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      // @ts-ignore
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, "languages", {
        get: () => ["pt-BR", "pt", "en-US", "en"],
      });
    });

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Wait for Cloudflare challenge to auto-resolve
    // The challenge page has a specific title or content we can detect
    for (let i = 0; i < 15; i++) {
      const title = await page.title();
      const content = await page.content();

      // Cloudflare challenge indicators
      const isChallenge =
        title.includes("Just a moment") ||
        title.includes("Attention Required") ||
        content.includes("cf-challenge") ||
        content.includes("challenge-platform") ||
        content.includes("turnstile");

      if (!isChallenge) break;

      // Still on challenge page, wait and retry
      await page.waitForTimeout(2000);
    }

    // Extra wait for page content to fully render
    await page.waitForTimeout(3000);

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);

    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
}

async function fetchSimple(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function buildProperty(html: string, url: string): ScrapedProperty {
  const $ = cheerio.load(html);

  // Get raw text before removing elements
  const $clean = cheerio.load(html);
  $clean("script, style, noscript, svg, path, link, meta").remove();
  const rawText = $clean("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);

  const source = detectSource(url);
  const extracted = extractStructured($);

  const images: string[] = [];
  $("img[src*='http']").each((_, el) => {
    const src = $(el).attr("src");
    if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("svg") && images.length < 5) {
      images.push(src);
    }
  });

  return {
    title: extracted.title || "Imóvel não identificado",
    price: extracted.price || "Preço não encontrado",
    location: extracted.location || "Localização não encontrada",
    area: extracted.area || "Não informado",
    bedrooms: extracted.bedrooms || "Não informado",
    bathrooms: extracted.bathrooms || "Não informado",
    parking: extracted.parking || "Não informado",
    description: extracted.description || "",
    condominium: extracted.condominium || "Não informado",
    iptu: extracted.iptu || "Não informado",
    images,
    url,
    source,
    rawText,
  };
}

export async function scrapeProperty(url: string): Promise<ScrapedProperty> {
  // Try simple fetch first (faster, works for some sites)
  const simpleHtml = await fetchSimple(url);
  if (simpleHtml) {
    const property = buildProperty(simpleHtml, url);
    // If we got meaningful data, use it
    if (property.price !== "Preço não encontrado" || property.rawText.length > 500) {
      return property;
    }
  }

  // Fallback: use Playwright headless browser
  const html = await fetchWithPlaywright(url);
  return buildProperty(html, url);
}
