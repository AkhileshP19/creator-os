import { chromium } from "playwright";
import type { BrowserContext, Page } from "playwright";
import path from "node:path";

const browserProfilePath = path.resolve(process.cwd(), "browser-profile");

const isHeadless = process.env.BROWSER_HEADLESS === "true";

let browserContext: BrowserContext | null = null;

export async function getBrowserPage(): Promise<Page> {
  if (!browserContext) {
    browserContext = await chromium.launchPersistentContext(
      browserProfilePath,
      {
        headless: isHeadless,
        viewport: {
          width: 1440,
          height: 900,
        },
        acceptDownloads: true,
      },
    );
  }

  const existingPages = browserContext.pages();

  if (existingPages.length > 0) {
    return existingPages[0]!;
  }

  return browserContext.newPage();
}
