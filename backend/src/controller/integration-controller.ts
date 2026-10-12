import type { RequestHandler } from "express";
import { integrationService } from "../services/integration-service.js";
import { oauthCallbackSchema } from "../schema/validation-schemas/publish-validation.js";
import { requiredEnv } from "../services/publish-security.js";
import { publishingHandler } from "./publishing-response.js";

export const connectYouTube = publishingHandler(async (req, res) => {
  const { authorizationUrl } = await integrationService.connect(
    req.currentUser.id,
  );

  res.setHeader("Cache-Control", "no-store");

  res.json({
    status: "SUCCESS",
    message: "YouTube authorization URL generated successfully",
    data: {
      responseData: {
        authorizationUrl,
      },
    },
  });
});

export const youtubeStatus = publishingHandler(async (req, res) =>
  res.json({
    status: "SUCCESS",
    message: "YouTube connection status",
    data: {
      responseData: await integrationService.status(req.currentUser.id),
    },
  }),
);

export const disconnectYouTube = publishingHandler(async (req, res) =>
  res.json({
    status: "SUCCESS",
    message: "YouTube disconnected",
    data: {
      responseData: await integrationService.disconnect(req.currentUser.id),
    },
  }),
);

export const youtubeCallback: RequestHandler = async (req, res) => {
  let destination: URL;

  try {
    destination = new URL("/settings", requiredEnv("FRONTEND_URL"));
  } catch {
    res.status(500).send("Frontend URL is not configured");
    return;
  }

  try {
    const { state, code } = oauthCallbackSchema.parse(req.query);

    await integrationService.callback(state, code);

    destination.searchParams.set("youtube", "connected");
  } catch (error) {
    console.error("YouTube OAuth callback failed:", error);
    destination.searchParams.set("youtube", "error");
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.redirect(destination.toString());
};