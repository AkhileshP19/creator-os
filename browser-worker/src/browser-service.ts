import { chromium } from "playwright";
import type {
  Browser,
  BrowserContext,
  Page,
} from "playwright";

const defaultCdpUrl =
  "http://127.0.0.1:9222";

const flowHostname =
  "flow.google.com";

let browser: Browser | null = null;

let browserContext:
  BrowserContext | null = null;

function isFlowPage(
  page: Page,
): boolean {
  try {
    const url = new URL(page.url());

    return (
      url.hostname === flowHostname
    );
  } catch {
    return false;
  }
}

async function connectToBrowser(): Promise<void> {
  if (
    browser &&
    browser.isConnected() &&
    browserContext
  ) {
    return;
  }

  browser = null;
  browserContext = null;

  const cdpUrl =
    process.env.CHROME_CDP_URL ??
    defaultCdpUrl;

  browser =
    await chromium.connectOverCDP(
      cdpUrl,
    );

  const contexts =
    browser.contexts();

  if (contexts.length === 0) {
    throw new Error(
      "No Chrome browser context found. Start Chrome with remote debugging enabled first.",
    );
  }

  browserContext =
    contexts[0] ?? null;

  if (!browserContext) {
    throw new Error(
      "Chrome browser context is not available.",
    );
  }
}

export async function getBrowserPage(): Promise<Page> {
  await connectToBrowser();

  if (!browserContext) {
    throw new Error(
      "Chrome browser context is not available.",
    );
  }

  const pages =
    browserContext.pages();

  const flowPage =
    pages.find(isFlowPage);

  if (flowPage) {
    return flowPage;
  }

  return browserContext.newPage();
}