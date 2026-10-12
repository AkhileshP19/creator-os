import fs from "node:fs/promises";
import path from "node:path";
import type {
  Locator,
  Page,
} from "playwright";
import { getBrowserPage } from "./browser-service.js";
import type {
  FlowVideoGenerationInput,
  FlowVideoGenerationResult,
} from "./types.js";
import { uploadVideoToB2 } from "./b2-storage-service.js";

interface DownloadedVideoResult {
  workflowId: string;
  fileName: string;
  localFilePath: string;
}

const flowUrl =
  process.env.FLOW_URL ??
  "https://flow.google.com";

const downloadsDirectory =
  path.resolve(
    process.cwd(),
    "downloads",
  );

const agentResponseTimeoutMs =
  3 * 60 * 1000;

const videoGenerationTimeoutMs =
  10 * 60 * 1000;

async function dismissFlowDialogs(
  page: Page,
): Promise<void> {
  const getStartedButton =
    page.getByRole("button", {
      name: "Get started",
      exact: true,
    });

  const isGetStartedVisible =
    await getStartedButton
      .isVisible()
      .catch(() => false);

  if (!isGetStartedVisible) {
    return;
  }

  await getStartedButton.click();

  await getStartedButton.waitFor({
    state: "hidden",
    timeout: 30_000,
  });
}

async function openFlow(
  page: Page,
): Promise<void> {
  await page.goto(flowUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await dismissFlowDialogs(page);
}

async function ensureAuthenticated(
  page: Page,
): Promise<void> {
  if (
    page.url().includes(
      "accounts.google.com",
    )
  ) {
    throw new Error(
      "Google authentication is required. Sign into Google Flow manually in the Chrome profile connected through CDP.",
    );
  }
}

async function openProject(
  page: Page,
): Promise<void> {
  const newProjectButton =
    page.getByRole("button", {
      name: /new project/i,
    });

  await newProjectButton.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  await Promise.all([
    page.waitForURL(
      /flow\.google\.com\/project\//,
      {
        timeout: 60_000,
      },
    ),
    newProjectButton.click(),
  ]);

  await dismissFlowDialogs(page);

  const promptEditor =
    page.locator(".ProseMirror").first();

  await promptEditor.waitFor({
    state: "visible",
    timeout: 30_000,
  });
}

async function configureVideoSettings(
  page: Page,
): Promise<void> {
  const settingsButton =
    page.getByRole("button", {
      name: "Settings",
      exact: true,
    });

  await settingsButton.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  await settingsButton.click();

  const agentSettingsHeading =
    page.getByText(
      "Agent settings",
      {
        exact: true,
      },
    );

  await agentSettingsHeading.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  const radioGroups =
    page.getByRole("radiogroup");

  const radioGroupCount =
    await radioGroups.count();

  if (radioGroupCount < 5) {
    throw new Error(
      `Unexpected Google Flow settings structure. Expected at least 5 radio groups but found ${radioGroupCount}.`,
    );
  }

  const confirmationGroup =
    radioGroups.nth(0);

  const videoAspectRatioGroup =
    radioGroups.nth(3);

  const videoCountGroup =
    radioGroups.nth(4);

  const automaticGeneration =
    confirmationGroup.getByText(
      "Never",
      {
        exact: true,
      },
    );

  await automaticGeneration.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  await automaticGeneration.click();

  const verticalAspectRatio =
    videoAspectRatioGroup
      .getByRole("radio")
      .filter({
        hasText: "9:16",
      });

  await verticalAspectRatio.click();

  const singleVideo =
    videoCountGroup
      .getByRole("radio")
      .filter({
        hasText: "x1",
      });

  await singleVideo.click();

  const selectedAspectRatio =
    await verticalAspectRatio.getAttribute(
      "aria-checked",
    );

  if (
    selectedAspectRatio !== "true"
  ) {
    throw new Error(
      "Failed to configure Google Flow video aspect ratio to 9:16.",
    );
  }

  const selectedVideoCount =
    await singleVideo.getAttribute(
      "aria-checked",
    );

  if (
    selectedVideoCount !== "true"
  ) {
    throw new Error(
      "Failed to configure Google Flow to generate exactly one video.",
    );
  }

  const omniModel =
    page.getByText(
      "Omni 1.1 Flash",
      {
        exact: true,
      },
    );

  const isOmniModelVisible =
    await omniModel
      .isVisible()
      .catch(() => false);

  if (!isOmniModelVisible) {
    throw new Error(
      "Omni 1.1 Flash is not configured as the current Google Flow video model.",
    );
  }

  const saveButton =
    page.getByRole("button", {
      name: "Save",
      exact: true,
    });

  await saveButton.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  await saveButton.click();

  await agentSettingsHeading.waitFor({
    state: "hidden",
    timeout: 30_000,
  });
}

async function enterPrompt(
  page: Page,
  prompt: string,
): Promise<void> {
  const promptEditor =
    page.locator(".ProseMirror").first();

  await promptEditor.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  await promptEditor.click();

  await promptEditor.fill(prompt);

  const enteredPrompt =
    await promptEditor.textContent();

  if (
    !enteredPrompt ||
    enteredPrompt.trim().length === 0
  ) {
    throw new Error(
      "Failed to enter the video generation prompt into Google Flow.",
    );
  }
}

async function startGeneration(
  page: Page,
): Promise<void> {
  const startGenerationButton =
    page.getByRole("button", {
      name: "Start generation",
      exact: true,
    });

  await startGenerationButton.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  const isDisabled =
    await startGenerationButton.isDisabled();

  if (isDisabled) {
    throw new Error(
      "Google Flow Start generation button is disabled.",
    );
  }

  await startGenerationButton.click();
}

async function waitForAgentResponse(
  page: Page,
): Promise<void> {
  const stopButton =
    page.getByRole("button", {
      name: "Stop",
      exact: true,
    });

  await stopButton
    .waitFor({
      state: "visible",
      timeout: 30_000,
    })
    .catch(() => undefined);

  await stopButton
    .waitFor({
      state: "hidden",
      timeout:
        agentResponseTimeoutMs,
    })
    .catch(() => undefined);
}

async function waitForGeneratedVideo(
  page: Page,
): Promise<Locator> {
  const videoTiles =
    page.locator(
      "flow-grid-tile-container",
    );

  const failureMessage =
    page
      .getByText(
        /couldn't generate|failed to generate|generation failed/i,
      )
      .first();

  const startedAt = Date.now();

  while (
    Date.now() - startedAt <
    videoGenerationTimeoutMs
  ) {
    const generationFailed =
      await failureMessage
        .isVisible()
        .catch(() => false);

    if (generationFailed) {
      throw new Error(
        "Google Flow reported that video generation failed.",
      );
    }

    const tileCount =
      await videoTiles.count();

    if (tileCount > 0) {
      const videoTile =
        videoTiles.last();

      const isTileVisible =
        await videoTile
          .isVisible()
          .catch(() => false);

      if (isTileVisible) {
        await videoTile
          .scrollIntoViewIfNeeded()
          .catch(() => undefined);

        /*
         * IMPORTANT:
         *
         * Google Flow's grid lazily activates the video
         * when the generated media tile is hovered.
         *
         * Without this hover, the tile can already be
         * visibly generated while no <video> element is
         * mounted in the DOM yet.
         */
        await videoTile
          .hover({
            force: true,
          })
          .catch(() => undefined);

        await page.waitForTimeout(
          500,
        );

        const video =
          videoTile
            .locator("video")
            .first();

        const videoCount =
          await video.count();

        if (videoCount > 0) {
          const videoSource =
            await video
              .evaluate(
                (element) => {
                  if (
                    !(
                      element instanceof
                      HTMLVideoElement
                    )
                  ) {
                    return "";
                  }

                  return (
                    element.currentSrc ||
                    element.src ||
                    element
                      .querySelector(
                        "source",
                      )
                      ?.getAttribute(
                        "src",
                      ) ||
                    ""
                  );
                },
              )
              .catch(() => "");

          if (videoSource) {
            return videoTile;
          }
        }
      }
    }

    await page.waitForTimeout(
      2_000,
    );
  }

  throw new Error(
    "Google Flow video generation timed out after 10 minutes.",
  );
}

async function downloadGeneratedVideo(
  page: Page,
  workflowId: string,
  videoTile: Locator,
): Promise<DownloadedVideoResult> {
  await videoTile.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  await videoTile.scrollIntoViewIfNeeded();

  await videoTile.hover({
    force: true,
  });

  const moreOptionsButton =
    videoTile.getByRole("button", {
      name: "More options",
      exact: true,
    });

  await moreOptionsButton.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  await moreOptionsButton.click();

  const downloadMenuItem =
    page
      .getByRole("menuitem")
      .filter({
        hasText: "Download",
      })
      .first();

  await downloadMenuItem.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  await downloadMenuItem.hover();

  await page.waitForTimeout(500);

  const originalSizeOption =
    page
      .getByRole("menuitem")
      .filter({
        hasText:
          "720p Original size",
      })
      .first();

  await originalSizeOption.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  await fs.mkdir(
    downloadsDirectory,
    {
      recursive: true,
    },
  );

  const fileName =
    `${workflowId}.mp4`;

  const localFilePath =
    path.join(
      downloadsDirectory,
      fileName,
    );

  const [download] =
    await Promise.all([
      page.waitForEvent(
        "download",
        {
          timeout: 60_000,
        },
      ),

      /*
       * Normal click() waits for Playwright's
       * "stable" actionability check.
       *
       * Flow's Angular submenu is being dynamically
       * re-rendered, so dispatch the click directly.
       */
      originalSizeOption.dispatchEvent(
        "click",
      ),
    ]);

  const downloadFailure =
    await download.failure();

  if (downloadFailure) {
    throw new Error(
      `Google Flow video download failed: ${downloadFailure}`,
    );
  }

  await download.saveAs(
    localFilePath,
  );

  return {
    workflowId,
    fileName,
    localFilePath,
  };
}

export async function generateVideoWithFlow(
  input: FlowVideoGenerationInput,
): Promise<FlowVideoGenerationResult> {
  if (
    input.aspectRatio !== "9:16"
  ) {
    throw new Error(
      "Google Flow browser worker currently supports only 9:16 video generation.",
    );
  }

  if (
    input.durationSeconds <= 0
  ) {
    throw new Error(
      "durationSeconds must be greater than 0.",
    );
  }

  const page =
    await getBrowserPage();

  console.log(
    `[${input.workflowId}] Opening Google Flow.`,
  );

  await openFlow(page);

  await ensureAuthenticated(page);

  console.log(
    `[${input.workflowId}] Creating Flow project.`,
  );

  await openProject(page);

  console.log(
    `[${input.workflowId}] Configuring video settings.`,
  );

  await configureVideoSettings(page);

  console.log(
    `[${input.workflowId}] Entering finalized script.`,
  );

  await enterPrompt(
    page,
    input.prompt,
  );

  console.log(
    `[${input.workflowId}] Submitting generation request.`,
  );

  await startGeneration(page);

  console.log(
    `[${input.workflowId}] Waiting for Flow agent response.`,
  );

  await waitForAgentResponse(page);

  console.log(
    `[${input.workflowId}] Waiting for generated video.`,
  );

  const videoTile =
    await waitForGeneratedVideo(
      page,
    );

  console.log(
    `[${input.workflowId}] Video generated. Downloading 720p original.`,
  );

  const downloadResult =
    await downloadGeneratedVideo(
      page,
      input.workflowId,
      videoTile,
    );

  console.log(
    `[${input.workflowId}] Uploading video to Backblaze B2.`,
  );

  const uploadResult =
    await uploadVideoToB2({
      filePath:
        downloadResult.localFilePath,
      userId:
        input.userId,
      projectId:
        input.projectId,
      workflowId:
        input.workflowId,
    });

  console.log(
    `[${input.workflowId}] Video uploaded to B2: ${uploadResult.objectKey}`,
  );

  await fs.rm(
    downloadResult.localFilePath,
    {
      force: true,
    },
  );

  console.log(
    `[${input.workflowId}] Temporary local video deleted.`,
  );

  return {
    workflowId:
      downloadResult.workflowId,
    fileName:
      downloadResult.fileName,
    objectKey:
      uploadResult.objectKey,
  };
}