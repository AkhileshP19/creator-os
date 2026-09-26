import { chromium } from "playwright";
import type { Browser, BrowserContext, Page } from "playwright";

let browser: Browser | null = null;
let browserContext: BrowserContext | null = null;

export async function getBrowserPage(): Promise<Page> {
  if (!browser) {
    browser = await chromium.connectOverCDP(
      process.env.CHROME_CDP_URL ??
      "http://127.0.0.1:9222",
    );

    const contexts = browser.contexts();

    if (contexts.length === 0) {
      throw new Error(
        "No Chrome browser context found.",
      );
    }

    browserContext = contexts[0]!;
  }

  if (!browserContext) {
    throw new Error(
      "Chrome browser context is not available.",
    );
  }

  const pages = browserContext.pages();

  if (pages.length > 0) {
    return pages[0]!;
  }

  return browserContext.newPage();
}