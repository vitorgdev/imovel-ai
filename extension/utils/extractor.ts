export interface PageData {
  url: string;
  title: string;
  rawText: string;
}

export function extractPageData(): PageData {
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("script, style, noscript, svg, path, link, meta, iframe")
    .forEach((el) => el.remove());

  const rawText = (clone.textContent || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);

  return {
    url: window.location.href,
    title:
      document.querySelector("h1")?.textContent?.trim() || document.title,
    rawText,
  };
}
