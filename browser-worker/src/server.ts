import "dotenv/config";

import express from "express";

import { generateVideoWithFlow } from "./flow-service.js";
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
