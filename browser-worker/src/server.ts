import "dotenv/config";

import express from "express";

import { approveAndInspectGeneration, generateVideoWithFlow, inspectApprovalControls, inspectCurrentAgentState, inspectGeneratedMedia, inspectSettingsRadioGroups, inspectSubmitButton, inspectVideoDownloadOptions, inspectVideoTile, testConfigureVideoSettings, testDownloadExistingVideo, testEnterPrompt, testOpenCreationSettings, testOpenFlowProject, testPrepareVideoGeneration, testSubmitAndInspectConfirmation } from "./flow-service.js";
import type { FlowVideoGenerationInput } from "./types.js";
import { getBrowserPage } from "./browser-service.js";

import fs from "node:fs/promises";
import path from "node:path";

const app = express();

const port = Number(process.env.PORT ?? 5100);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "SUCCESS",
    message: "Browser worker is running",
  });
});

// app.get("/setup-browser", async (_req, res) => {
//   try {
//     const page = await getBrowserPage();

//     await page.goto(process.env.FLOW_URL ?? "https://flow.google.com", {
//       waitUntil: "domcontentloaded",
//       timeout: 60_000,
//     });

//     res.status(200).json({
//       status: "SUCCESS",
//       message: "Browser opened. Sign into Google Flow if required.",
//     });
//   } catch (error: unknown) {
//     const errorMessage =
//       error instanceof Error ? error.message : "Unknown browser setup error";

//     res.status(500).json({
//       status: "ERROR",
//       message: errorMessage,
//     });
//   }
// });

app.get("/setup-browser", async (_req, res) => {
  try {
    const page = await getBrowserPage();

    await page.goto(process.env.FLOW_URL ?? "https://flow.google.com", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await page.waitForTimeout(3_000);

    const pageText = await page.locator("body").innerText();

    const buttons = await page.getByRole("button").allTextContents();

    const links = await page.getByRole("link").allTextContents();

    console.log("FLOW PAGE TEXT:", pageText.slice(0, 3000));

    console.log("FLOW BUTTONS:", buttons);

    console.log("FLOW LINKS:", links);

    res.status(200).json({
      status: "SUCCESS",
      message: "Flow opened successfully",
      data: {
        responseData: {
          url: page.url(),
          title: await page.title(),
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown browser setup error";

    res.status(500).json({
      status: "ERROR",
      message: errorMessage,
    });
  }
});

// temporary endpoint, just for testing
app.get("/test-flow-entry", async (_req, res) => {
  try {
    const page = await getBrowserPage();

    await page.goto(process.env.FLOW_URL ?? "https://flow.google.com", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await page.waitForTimeout(2_000);

    const createButton = page
      .getByRole("button", {
        name: /create with google flow/i,
      })
      .first();

    await createButton.click();

    await page.waitForTimeout(5_000);

    const pageText = await page.locator("body").innerText();

    console.log("FLOW ENTRY URL:", page.url());

    console.log("FLOW ENTRY TITLE:", await page.title());

    console.log("FLOW ENTRY TEXT:", pageText.slice(0, 2000));

    res.status(200).json({
      status: "SUCCESS",
      message: "Flow entry tested",
      data: {
        responseData: {
          url: page.url(),
          title: await page.title(),
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Flow entry error";

    console.error("Flow entry test failed:", error);

    res.status(500).json({
      status: "ERROR",
      message: errorMessage,
    });
  }
});

// temporary
app.get("/inspect-flow", async (_req, res) => {
  try {
    const page = await getBrowserPage();

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

    const textboxes =
      await page
        .getByRole("textbox")
        .count();

    console.log(
      "FLOW URL:",
      page.url(),
    );

    console.log(
      "FLOW TITLE:",
      await page.title(),
    );

    console.log(
      "FLOW PAGE TEXT:",
      pageText.slice(0, 4000),
    );

    console.log(
      "FLOW BUTTONS:",
      buttons,
    );

    console.log(
      "FLOW LINKS:",
      links,
    );

    console.log(
      "FLOW TEXTBOX COUNT:",
      textboxes,
    );

    res.status(200).json({
      status: "SUCCESS",
      message:
        "Authenticated Flow page inspected successfully",
      data: {
        responseData: {
          url: page.url(),
          title: await page.title(),
          textboxCount: textboxes,
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown Flow inspection error";

    console.error(
      "Flow inspection failed:",
      error,
    );

    res.status(500).json({
      status: "ERROR",
      message: errorMessage,
    });
  }
});

// for testing
app.get(
  "/test-open-project",
  async (_req, res) => {
    try {
      await testOpenFlowProject();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Flow project opened successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown Flow project error";

      console.error(
        "Flow project test failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

// temporary
app.get("/inspect-project-composer", async (_req, res) => {
  try {
    const page = await getBrowserPage();

    console.log("PROJECT URL:", page.url());

    const inputs = await page.locator("input").evaluateAll(
      (elements) =>
        elements.map((element) => ({
          type: element.getAttribute("type"),
          placeholder: element.getAttribute("placeholder"),
          ariaLabel: element.getAttribute("aria-label"),
          className: element.getAttribute("class"),
        })),
    );

    const textareas = await page.locator("textarea").evaluateAll(
      (elements) =>
        elements.map((element) => ({
          placeholder: element.getAttribute("placeholder"),
          ariaLabel: element.getAttribute("aria-label"),
          className: element.getAttribute("class"),
        })),
    );

    const contentEditables = await page
      .locator('[contenteditable="true"]')
      .evaluateAll((elements) =>
        elements.map((element) => ({
          tagName: element.tagName,
          text: element.textContent,
          ariaLabel: element.getAttribute("aria-label"),
          role: element.getAttribute("role"),
          className: element.getAttribute("class"),
        })),
      );

    const placeholders = await page
      .getByText("What do you want to create?", {
        exact: false,
      })
      .count();

    console.log("INPUTS:", inputs);
    console.log("TEXTAREAS:", textareas);
    console.log(
      "CONTENTEDITABLES:",
      contentEditables,
    );
    console.log(
      "PROMPT PLACEHOLDER MATCHES:",
      placeholders,
    );

    res.status(200).json({
      status: "SUCCESS",
      message: "Project composer inspected successfully",
      data: {
        responseData: {
          url: page.url(),
          inputCount: inputs.length,
          textareaCount: textareas.length,
          contentEditableCount:
            contentEditables.length,
          placeholderMatches: placeholders,
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown composer inspection error";

    console.error(
      "Composer inspection failed:",
      error,
    );

    res.status(500).json({
      status: "ERROR",
      message: errorMessage,
    });
  }
});

// testing
app.get("/test-enter-prompt", async (_req, res) => {
  try {
    await testEnterPrompt();

    res.status(200).json({
      status: "SUCCESS",
      message: "Flow prompt entered successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown prompt entry error";

    console.error(
      "Prompt entry test failed:",
      error,
    );

    res.status(500).json({
      status: "ERROR",
      message: errorMessage,
    });
  }
});

app.get(
  "/test-open-creation-settings",
  async (_req, res) => {
    try {
      await testOpenCreationSettings();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Flow creation settings opened successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown creation settings error";

      console.error(
        "Creation settings inspection failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.get(
  "/inspect-settings-radio-groups",
  async (_req, res) => {
    try {
      await inspectSettingsRadioGroups();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Flow settings radio groups inspected successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown radio group inspection error";

      console.error(
        "Radio group inspection failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.get(
  "/test-configure-video-settings",
  async (_req, res) => {
    try {
      await testConfigureVideoSettings();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Flow video settings configured successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown video settings error";

      console.error(
        "Video settings test failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.get(
  "/test-prepare-video-generation",
  async (_req, res) => {
    try {
      await testPrepareVideoGeneration();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Flow video generation prepared successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown video preparation error";

      console.error(
        "Video preparation test failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.get(
  "/inspect-submit-button",
  async (_req, res) => {
    try {
      await inspectSubmitButton();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Flow submit button inspected successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown submit button inspection error";

      console.error(
        "Submit button inspection failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
); app.get(
  "/inspect-submit-button",
  async (_req, res) => {
    try {
      await inspectSubmitButton();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Flow submit button inspected successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown submit button inspection error";

      console.error(
        "Submit button inspection failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.get(
  "/test-submit-and-inspect-confirmation",
  async (_req, res) => {
    try {
      await testSubmitAndInspectConfirmation();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Flow request submitted and confirmation inspected",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown Flow confirmation inspection error";

      console.error(
        "Flow confirmation inspection failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.get(
  "/inspect-current-agent-state",
  async (_req, res) => {
    try {
      await inspectCurrentAgentState();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Current Flow Agent state inspected",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown Flow Agent inspection error";

      console.error(
        "Agent state inspection failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.get(
  "/inspect-approval-controls",
  async (_req, res) => {
    try {
      await inspectApprovalControls();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Approval controls inspected successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown approval inspection error";

      console.error(
        "Approval inspection failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.get(
  "/approve-and-inspect-generation",
  async (_req, res) => {
    try {
      await approveAndInspectGeneration();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Video generation approved and state inspected",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown generation inspection error";

      console.error(
        "Generation inspection failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.get(
  "/inspect-generated-media",
  async (_req, res) => {
    try {
      await inspectGeneratedMedia();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Generated media inspected successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown generated media inspection error";

      console.error(
        "Generated media inspection failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.get(
  "/inspect-video-tile",
  async (_req, res) => {
    try {
      await inspectVideoTile();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Video tile inspected successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown video tile inspection error";

      console.error(
        "Video tile inspection failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.get(
  "/inspect-video-download-options",
  async (_req, res) => {
    try {
      await inspectVideoDownloadOptions();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Video download options inspected successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown download inspection error";

      console.error(
        "Download inspection failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.get(
  "/test-download-video",
  async (_req, res) => {
    try {
      const filePath =
        await testDownloadExistingVideo();

      res.status(200).json({
        status: "SUCCESS",
        message:
          "Existing Flow video downloaded successfully",
        data: {
          filePath,
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown video download error";

      console.error(
        "Video download failed:",
        error,
      );

      res.status(500).json({
        status: "ERROR",
        message: errorMessage,
      });
    }
  },
);

app.post("/generate-video", async (req, res) => {
  try {
    const input = req.body as FlowVideoGenerationInput;

    if (!input.workflowId || !input.prompt) {
      res.status(400).json({
        status: "ERROR",
        message: "workflowId and prompt are required",
      });

      return;
    }

    const result = await generateVideoWithFlow(input);

    res.status(200).json({
      status: "SUCCESS",
      message: "Video generated successfully",
      data: {
        responseData: result,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown browser worker error";

    console.error("Flow generation failed:", error);

    res.status(500).json({
      status: "ERROR",
      message: errorMessage,
    });
  }
});

app.listen(port, () => {
  console.log(`Browser worker running on http://localhost:${port}`);
});
