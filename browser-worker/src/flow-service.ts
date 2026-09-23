import fs from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright";

import { getBrowserPage } from "./browser-service.js";
import type {
  FlowVideoGenerationInput,
  FlowVideoGenerationResult,
} from "./types.js";

const flowUrl = process.env.FLOW_URL ?? "https://flow.google.com";

const downloadsDirectory = path.resolve(process.cwd(), "downloads");

async function openFlow(page: Page): Promise<void> {
  await page.goto(flowUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await page.waitForTimeout(3_000);
}

async function ensureLoggedIn(page: Page): Promise<void> {
  const currentUrl = page.url();

  if (currentUrl.includes("accounts.google.com")) {
    throw new Error(
      "Google authentication is required. Open the browser worker once and sign into Google manually.",
    );
  }
}

async function openProject(page: Page): Promise<void> {
  const newProjectButton = page.getByRole("button", {
    name: /new/i,
  });

  if (
    await newProjectButton
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await newProjectButton.first().click();

    await page.waitForTimeout(2_000);
  }
}

async function selectVideoMode(page: Page): Promise<void> {
  const videoButton = page.getByText("Video", {
    exact: true,
  });

  if (
    await videoButton
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await videoButton.first().click();

    await page.waitForTimeout(1_000);
  }
}

async function selectModel(page: Page): Promise<void> {
  const modelName = process.env.FLOW_MODEL ?? "Omni Flash";

  const modelOption = page.getByText(modelName, {
    exact: false,
  });

  if (
    await modelOption
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await modelOption.first().click();

    await page.waitForTimeout(1_000);
  }
}

async function enterPrompt(page: Page, prompt: string): Promise<void> {
  const promptTextbox = page.getByRole("textbox").last();

  await promptTextbox.waitFor({
    state: "visible",
    timeout: 20_000,
  });

  await promptTextbox.fill(prompt);
}

async function startGeneration(page: Page): Promise<void> {
  const generateButton = page.getByRole("button", {
    name: /generate/i,
  });

  await generateButton.last().waitFor({
    state: "visible",
    timeout: 20_000,
  });

  await generateButton.last().click();
}

async function waitForGeneratedVideo(page: Page): Promise<void> {
  const timeoutMs = 10 * 60 * 1000;

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const downloadText = page.getByText("Download", {
      exact: false,
    });

    const downloadVisible = await downloadText
      .first()
      .isVisible()
      .catch(() => false);

    if (downloadVisible) {
      return;
    }

    const failureText = page.getByText(/failed|couldn't generate|error/i);

    const failed = await failureText
      .first()
      .isVisible()
      .catch(() => false);

    if (failed) {
      throw new Error("Google Flow video generation failed");
    }

    await page.waitForTimeout(5_000);
  }

  throw new Error("Google Flow video generation timed out");
}

async function downloadVideo(
  page: Page,
  workflowId: string,
): Promise<FlowVideoGenerationResult> {
  await fs.mkdir(downloadsDirectory, {
    recursive: true,
  });

  const downloadPromise = page.waitForEvent("download", {
    timeout: 60_000,
  });

  const downloadButton = page.getByText("Download", {
    exact: false,
  });

  await downloadButton.first().click();

  const download = await downloadPromise;

  const fileName = `${workflowId}.mp4`;

  const localFilePath = path.join(downloadsDirectory, fileName);

  await download.saveAs(localFilePath);

  return {
    workflowId,
    fileName,
    localFilePath,
  };
}

export async function generateVideoWithFlow(
  input: FlowVideoGenerationInput,
): Promise<FlowVideoGenerationResult> {
  const page = await getBrowserPage();

  await openFlow(page);

  await ensureLoggedIn(page);

  await openProject(page);

  await selectVideoMode(page);

  await selectModel(page);

  await enterPrompt(page, input.prompt);

  await startGeneration(page);

  await waitForGeneratedVideo(page);

  return downloadVideo(page, input.workflowId);
}
