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

  await dismissFlowDialogs(page);
}

export async function testOpenCreationSettings(): Promise<void> {
  const page = await getBrowserPage();

  await dismissFlowDialogs(page);

  const tuneElement = page
    .getByText("tune", {
      exact: true,
    })
    .first();

  await tuneElement.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  console.log(
    "TUNE ELEMENT:",
    await tuneElement.evaluate((element) => ({
      tagName: element.tagName,
      className: element.getAttribute("class"),
      role: element.getAttribute("role"),
      ariaLabel: element.getAttribute("aria-label"),
      title: element.getAttribute("title"),
      parentTagName: element.parentElement?.tagName ?? null,
      parentClassName:
        element.parentElement?.getAttribute("class") ?? null,
      parentRole:
        element.parentElement?.getAttribute("role") ?? null,
      parentAriaLabel:
        element.parentElement?.getAttribute("aria-label") ?? null,
    })),
  );

  await tuneElement.click();

  await page.waitForTimeout(1_000);

  const pageText =
    await page.locator("body").innerText();

  const buttons =
    await page
      .getByRole("button")
      .allTextContents();

  const menuItems =
    await page
      .getByRole("menuitem")
      .allTextContents();

  const options =
    await page
      .getByRole("option")
      .allTextContents();

  const radios =
    await page
      .getByRole("radio")
      .allTextContents();

  console.log(
    "SETTINGS PAGE TEXT:",
    pageText.slice(-4000),
  );

  console.log(
    "SETTINGS BUTTONS:",
    buttons,
  );

  console.log(
    "SETTINGS MENU ITEMS:",
    menuItems,
  );

  console.log(
    "SETTINGS OPTIONS:",
    options,
  );

  console.log(
    "SETTINGS RADIOS:",
    radios,
  );
}

export async function inspectSettingsRadioGroups(): Promise<void> {
  const page = await getBrowserPage();

  const settingsButton =
    page.getByRole("button", {
      name: "Settings",
      exact: true,
    });

  await settingsButton.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  const agentSettingsVisible =
    await page
      .getByText("Agent settings", {
        exact: true,
      })
      .isVisible()
      .catch(() => false);

  if (!agentSettingsVisible) {
    await settingsButton.click();
    await page.waitForTimeout(500);
  }

  const radioGroups =
    page.getByRole("radiogroup");

  const radioGroupCount =
    await radioGroups.count();

  console.log(
    "RADIO GROUP COUNT:",
    radioGroupCount,
  );

  for (
    let index = 0;
    index < radioGroupCount;
    index += 1
  ) {
    const group =
      radioGroups.nth(index);

    console.log(
      `RADIO GROUP ${index}:`,
      await group.evaluate((element) => ({
        text: element.textContent?.trim() ?? "",
        ariaLabel:
          element.getAttribute("aria-label"),
        className:
          element.getAttribute("class"),
        parentText:
          element.parentElement
            ?.textContent
            ?.trim()
            .slice(0, 500) ?? "",
      })),
    );
  }

  const radios =
    page.getByRole("radio");

  const radioCount =
    await radios.count();

  for (
    let index = 0;
    index < radioCount;
    index += 1
  ) {
    const radio = radios.nth(index);

    console.log(
      `RADIO ${index}:`,
      await radio.evaluate((element) => ({
        text:
          element.textContent?.trim() ?? "",
        ariaLabel:
          element.getAttribute("aria-label"),
        checked:
          element.getAttribute("aria-checked"),
        name:
          element.getAttribute("name"),
        value:
          element.getAttribute("value"),
      })),
    );
  }
}

async function configureVideoSettings(
  page: Page,
): Promise<void> {
  const settingsButton =
    page.getByRole("button", {
      name: "Settings",
      exact: true,
    });

  const settingsVisible = await page
    .getByText("Agent settings", {
      exact: true,
    })
    .isVisible()
    .catch(() => false);

  if (!settingsVisible) {
    await settingsButton.click();

    await page
      .getByText("Agent settings", {
        exact: true,
      })
      .waitFor({
        state: "visible",
        timeout: 30_000,
      });
  }

  const radioGroups =
    page.getByRole("radiogroup");

  const radioGroupCount =
    await radioGroups.count();

  if (radioGroupCount < 5) {
    throw new Error(
      `Expected at least 5 Flow settings radio groups, found ${radioGroupCount}.`,
    );
  }

  const confirmationGroup =
    radioGroups.nth(0);

  const videoAspectRatioGroup =
    radioGroups.nth(3);

  const videoCountGroup =
    radioGroups.nth(4);

  // Keep this ON while developing.
  // Flow must ask before spending generation credits.
  const alwaysConfirmation =
    confirmationGroup.getByText(
      "Always",
      {
        exact: true,
      },
    );

  await alwaysConfirmation.click();

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

  const selectedVideoCount =
    await singleVideo.getAttribute(
      "aria-checked",
    );

  console.log(
    "VIDEO ASPECT RATIO 9:16:",
    selectedAspectRatio,
  );

  console.log(
    "VIDEO COUNT x1:",
    selectedVideoCount,
  );

  if (selectedAspectRatio !== "true") {
    throw new Error(
      "Failed to select 9:16 video aspect ratio.",
    );
  }

  if (selectedVideoCount !== "true") {
    throw new Error(
      "Failed to select x1 video generation.",
    );
  }

  const omniModelVisible =
    await page
      .getByText("Omni 1.1 Flash", {
        exact: true,
      })
      .isVisible()
      .catch(() => false);

  if (!omniModelVisible) {
    throw new Error(
      "Expected Omni 1.1 Flash as the video model.",
    );
  }

  console.log(
    "VIDEO MODEL: Omni 1.1 Flash",
  );

  console.log(
    "Video settings configured successfully.",
  );

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

  await page
    .getByText("Agent settings", {
      exact: true,
    })
    .waitFor({
      state: "hidden",
      timeout: 30_000,
    });

  console.log(
    "Video settings saved successfully.",
  );

}

export async function testConfigureVideoSettings(): Promise<void> {
  const page = await getBrowserPage();

  await dismissFlowDialogs(page);

  await configureVideoSettings(page);
}

export async function testPrepareVideoGeneration(): Promise<void> {
  const page = await getBrowserPage();

  await dismissFlowDialogs(page);

  await configureVideoSettings(page);

  const promptEditor =
    page.locator(".ProseMirror").first();

  await promptEditor.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  const testPrompt = `
Create one 9:16 vertical short-form video using the finalized script below.

Do not rewrite, expand, summarize, or ask questions about the script.
Follow the supplied narration and visual direction.
Generate the video now.

TITLE:
Why Space Is Completely Silent

NARRATION:
Space is completely silent because there is no atmosphere to carry sound waves.

SCENE 1:
Duration: 4 seconds
Visual: Cinematic view of Earth from space, slowly moving away from the planet.
Voiceover: Space is completely silent
On-screen text: SPACE IS SILENT

SCENE 2:
Duration: 4 seconds
Visual: Astronaut floating in deep space with Earth in the background.
Voiceover: because there is no atmosphere to carry sound waves.
On-screen text: NO ATMOSPHERE

Do not add additional facts or scenes.
`;

  await promptEditor.fill(testPrompt);

  console.log(
    "VIDEO PROMPT:",
    await promptEditor.textContent(),
  );

  const sendButton =
    page
      .getByText("arrow_forward", {
        exact: true,
      })
      .first();

  await sendButton.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  console.log(
    "Generation request prepared successfully.",
  );

  console.log(
    "STOPPING BEFORE SUBMIT.",
  );
}

export async function inspectSubmitButton(): Promise<void> {
  const page = await getBrowserPage();

  const arrowIcon = page
    .getByText("arrow_forward", {
      exact: true,
    })
    .first();

  await arrowIcon.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  const details = await arrowIcon.evaluate((element) => {
    const parent = element.parentElement;

    return {
      tagName: element.tagName,
      className: element.getAttribute("class"),
      role: element.getAttribute("role"),
      ariaLabel: element.getAttribute("aria-label"),
      parentTagName: parent?.tagName ?? null,
      parentClassName:
        parent?.getAttribute("class") ?? null,
      parentRole:
        parent?.getAttribute("role") ?? null,
      parentAriaLabel:
        parent?.getAttribute("aria-label") ?? null,
      parentTitle:
        parent?.getAttribute("title") ?? null,
      parentDisabled:
        parent?.hasAttribute("disabled") ?? null,
    };
  });

  console.log(
    "SUBMIT BUTTON DETAILS:",
    details,
  );
}

export async function testSubmitAndInspectConfirmation(): Promise<void> {
  const page = await getBrowserPage();

  const startGenerationButton =
    page.getByRole("button", {
      name: "Start generation",
    });

  await startGenerationButton.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  console.log("Submitting prompt to Flow...");

  await startGenerationButton.click();

  await waitForAgentResponse(page);

  const pageText =
    await page.locator("body").innerText();

  const buttons =
    await page
      .getByRole("button")
      .allTextContents();

  const links =
    await page
      .getByRole("link")
      .allTextContents();

  console.log(
    "AFTER AGENT PAGE TEXT:",
    pageText.slice(-6000),
  );

  console.log(
    "AFTER AGENT BUTTONS:",
    buttons,
  );

  console.log(
    "AFTER AGENT LINKS:",
    links,
  );

  console.log(
    "STOPPING BEFORE CONFIRMATION.",
  );
}

export async function inspectCurrentAgentState(): Promise<void> {
  const page = await getBrowserPage();

  await waitForAgentResponse(page);

  const pageText =
    await page.locator("body").innerText();

  const buttons =
    await page
      .getByRole("button")
      .allTextContents();

  const links =
    await page
      .getByRole("link")
      .allTextContents();

  console.log(
    "AGENT RESULT PAGE TEXT:",
    pageText.slice(-6000),
  );

  console.log(
    "AGENT RESULT BUTTONS:",
    buttons,
  );

  console.log(
    "AGENT RESULT LINKS:",
    links,
  );
}

async function ensureLoggedIn(page: Page): Promise<void> {
  const currentUrl = page.url();

  if (currentUrl.includes("accounts.google.com")) {
    throw new Error(
      "Google authentication is required. Open the browser worker once and sign into Google manually.",
    );
  }
}

async function waitForAgentResponse(
  page: Page,
): Promise<void> {
  const stopButton = page.getByRole("button", {
    name: "Stop",
    exact: true,
  });

  await stopButton
    .waitFor({
      state: "visible",
      timeout: 30_000,
    })
    .catch(() => undefined);

  console.log("Flow Agent is processing...");

  await stopButton.waitFor({
    state: "hidden",
    timeout: 120_000,
  });

  console.log("Flow Agent finished processing.");

  await page.waitForTimeout(1_000);
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

  await newProjectButton.click();

  await page.waitForTimeout(3_000);

  console.log(
    "PROJECT URL:",
    page.url(),
  );

  console.log(
    "PROJECT TITLE:",
    await page.title(),
  );

  const pageText =
    await page.locator("body").innerText();

  const buttons =
    await page
      .getByRole("button")
      .allTextContents();

  const textboxes =
    await page
      .getByRole("textbox")
      .count();

  console.log(
    "PROJECT PAGE TEXT:",
    pageText.slice(0, 4000),
  );

  console.log(
    "PROJECT BUTTONS:",
    buttons,
  );

  console.log(
    "PROJECT TEXTBOX COUNT:",
    textboxes,
  );
}

// temporary- for testing
export async function testOpenFlowProject(): Promise<void> {
  const page = await getBrowserPage();

  console.log(
    "1. Opening new Flow project",
  );

  await openProject(page);

  console.log(
    "2. Flow project opened successfully",
  );
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

  console.log(
    "PROMPT TEXT:",
    await promptEditor.textContent(),
  );
}

// temporary for testing
export async function testEnterPrompt(): Promise<void> {
  const page = await getBrowserPage();

  await dismissFlowDialogs(page);

  const promptEditor =
    page.locator(".ProseMirror").first();

  await promptEditor.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  const testPrompt =
    "Create a short vertical facts video about space.";

  await promptEditor.click();

  await promptEditor.fill(testPrompt);

  const promptText =
    await promptEditor.textContent();

  console.log(
    "PROMPT ENTERED:",
    promptText,
  );
}

// temp
async function dismissFlowDialogs(
  page: Page,
): Promise<void> {
  const getStartedButton = page.getByRole(
    "button",
    {
      name: "Get started",
      exact: true,
    },
  );

  if (
    await getStartedButton
      .isVisible()
      .catch(() => false)
  ) {
    console.log(
      "Flow dialog detected. Closing...",
    );

    await getStartedButton.click();

    await page.waitForTimeout(500);

    console.log(
      "Flow dialog closed successfully.",
    );
  }
}

export async function inspectApprovalControls(): Promise<void> {
  const page = await getBrowserPage();

  const approveText = page
    .getByText("Approve", {
      exact: true,
    })
    .first();

  const alwaysApproveText = page
    .getByText("Always approve", {
      exact: true,
    })
    .first();

  const rejectText = page
    .getByText("Reject", {
      exact: true,
    })
    .first();

  const inspectElement = async (
    locator: typeof approveText,
  ) => {
    return locator.evaluate((element) => {
      const parent = element.parentElement;

      return {
        tagName: element.tagName,
        className:
          element.getAttribute("class"),
        role:
          element.getAttribute("role"),
        ariaLabel:
          element.getAttribute("aria-label"),

        parentTagName:
          parent?.tagName ?? null,
        parentClassName:
          parent?.getAttribute("class") ?? null,
        parentRole:
          parent?.getAttribute("role") ?? null,
        parentAriaLabel:
          parent?.getAttribute("aria-label") ?? null,
      };
    });
  };

  console.log(
    "APPROVE DETAILS:",
    await inspectElement(approveText),
  );

  console.log(
    "ALWAYS APPROVE DETAILS:",
    await inspectElement(alwaysApproveText),
  );

  console.log(
    "REJECT DETAILS:",
    await inspectElement(rejectText),
  );
}

export async function approveAndInspectGeneration(): Promise<void> {
  const page = await getBrowserPage();

  const approveRadio =
    page.getByRole("radio", {
      name: "Approve",
      exact: true,
    });

  await approveRadio.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  console.log(
    "Approval request detected.",
  );

  await approveRadio.click();

  console.log(
    "Video generation approved.",
  );

  await page.waitForTimeout(2_000);

  const pageText =
    await page.locator("body").innerText();

  const buttons =
    await page
      .getByRole("button")
      .allTextContents();

  const links =
    await page
      .getByRole("link")
      .allTextContents();

  const videoCount =
    await page.locator("video").count();

  console.log(
    "AFTER APPROVAL PAGE TEXT:",
    pageText.slice(-8000),
  );

  console.log(
    "AFTER APPROVAL BUTTONS:",
    buttons,
  );

  console.log(
    "AFTER APPROVAL LINKS:",
    links,
  );

  console.log(
    "AFTER APPROVAL VIDEO COUNT:",
    videoCount,
  );
}

export async function inspectGeneratedMedia(): Promise<void> {
  const page = await getBrowserPage();

  console.log(
    "Inspecting existing generated media...",
  );

  const pageText =
    await page.locator("body").innerText();

  console.log(
    "CURRENT PAGE TEXT:",
    pageText.slice(-8000),
  );

  const videos =
    await page.locator("video").evaluateAll(
      (elements) =>
        elements.map((element) => ({
          src: element.getAttribute("src"),
          poster: element.getAttribute("poster"),
          controls:
            element.hasAttribute("controls"),
          className:
            element.getAttribute("class"),
        })),
    );

  console.log(
    "VIDEO ELEMENTS:",
    videos,
  );

  const buttons =
    await page
      .getByRole("button")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          text:
            element.textContent?.trim() ?? "",
          ariaLabel:
            element.getAttribute("aria-label"),
          title:
            element.getAttribute("title"),
          className:
            element.getAttribute("class"),
        })),
      );

  console.log(
    "BUTTON DETAILS:",
    buttons,
  );
}

export async function inspectVideoTile(): Promise<void> {
  const page = await getBrowserPage();

  const video = page.locator("video").first();

  await video.waitFor({
    state: "attached",
    timeout: 30_000,
  });

  const details = await video.evaluate((element) => {
    const parents: Array<{
      tagName: string;
      className: string | null;
      role: string | null;
      ariaLabel: string | null;
    }> = [];

    let current: HTMLElement | null =
      element.parentElement;

    for (
      let index = 0;
      index < 6 && current;
      index += 1
    ) {
      parents.push({
        tagName: current.tagName,
        className:
          current.getAttribute("class"),
        role:
          current.getAttribute("role"),
        ariaLabel:
          current.getAttribute("aria-label"),
      });

      current = current.parentElement;
    }

    return parents;
  });

  console.log(
    "VIDEO PARENT CHAIN:",
    details,
  );

  await video.hover();

  await page.waitForTimeout(500);

  const buttonsAfterHover =
    await page
      .getByRole("button")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          text:
            element.textContent?.trim() ?? "",
          ariaLabel:
            element.getAttribute("aria-label"),
          className:
            element.getAttribute("class"),
        })),
      );

  console.log(
    "BUTTONS AFTER VIDEO HOVER:",
    buttonsAfterHover,
  );
}

export async function inspectVideoDownloadOptions(): Promise<void> {
  const page = await getBrowserPage();

  const video = page.locator("video").first();

  await video.waitFor({
    state: "attached",
    timeout: 30_000,
  });

  const videoTile = video.locator(
    "xpath=ancestor::flow-grid-tile-container[1]",
  );

  await videoTile.hover();

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

  console.log(
    "Video asset More options opened.",
  );

  const downloadItem =
    page.getByText("Download", {
      exact: true,
    });

  await downloadItem.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  await downloadItem.hover();

  await page.waitForTimeout(500);

  const pageText =
    await page.locator("body").innerText();

  console.log(
    "DOWNLOAD MENU PAGE TEXT:",
    pageText.slice(-4000),
  );

  const menuItems =
    await page
      .getByRole("menuitem")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          text:
            element.textContent
              ?.replace(/\s+/g, " ")
              .trim() ?? "",
          ariaLabel:
            element.getAttribute("aria-label"),
          role:
            element.getAttribute("role"),
          className:
            element.getAttribute("class"),
        })),
      );

  console.log(
    "DOWNLOAD MENU ITEMS:",
    menuItems,
  );
}

async function downloadGeneratedVideo(
  page: Page,
  workflowId: string,
): Promise<string> {
  const video = page.locator("video").first();

  await video.waitFor({
    state: "attached",
    timeout: 30_000,
  });

  const videoTile = video.locator(
    "xpath=ancestor::flow-grid-tile-container[1]",
  );

  await videoTile.hover();

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
    page.getByRole("menuitem").filter({
      hasText: "Download",
    });

  await downloadMenuItem.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  await downloadMenuItem.hover();

  const originalSizeOption =
    page.getByRole("menuitem").filter({
      hasText: "720p Original size",
    });

  await originalSizeOption.waitFor({
    state: "visible",
    timeout: 30_000,
  });

  const downloadsDirectory = path.resolve(
    process.cwd(),
    "downloads",
  );

  await fs.mkdir(downloadsDirectory, {
    recursive: true,
  });

  const filePath = path.join(
    downloadsDirectory,
    `${workflowId}.mp4`,
  );

  const downloadPromise =
    page.waitForEvent("download", {
      timeout: 60_000,
    });

  await originalSizeOption.click();

  const download = await downloadPromise;

  const downloadFailure =
    await download.failure();

  if (downloadFailure) {
    throw new Error(
      `Flow video download failed: ${downloadFailure}`,
    );
  }

  await download.saveAs(filePath);

  console.log(
    "Flow video downloaded:",
    filePath,
  );

  return filePath;
}

export async function testDownloadExistingVideo(): Promise<string> {
  const page = await getBrowserPage();

  return downloadGeneratedVideo(
    page,
    "test-flow-video",
  );
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
