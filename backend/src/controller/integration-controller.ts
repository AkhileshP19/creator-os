import type { RequestHandler } from "express";
import { integrationService } from "../services/integration-service.js";
import { oauthCallbackSchema } from "../schema/validation-schemas/publish-validation.js";
import { requiredEnv, verifyOAuthState } from "../services/publish-security.js";
import { publishingHandler } from "./publishing-response.js";
const cookieOptions = () => ({
  httpOnly: true,
  secure: requiredEnv("GOOGLE_REDIRECT_URI").startsWith("https:"),
  sameSite: "lax" as const,
  path: "/api/integrations/youtube",
  maxAge: 600_000,
});
export const connectYouTube = publishingHandler(async (req, res) => {
  const { authorizationUrl, nonce } = await integrationService.connect(
    req.currentUser.id,
  );
  res.cookie("youtube_oauth_nonce", nonce, cookieOptions());
  res.setHeader("Cache-Control", "no-store");
  res.json({
    status: "SUCCESS",
    message: "YouTube authorization URL generated successfully",
    data: { responseData: { authorizationUrl } },
  });
});
export const youtubeStatus = publishingHandler(async (req, res) =>
  res.json({
    status: "SUCCESS",
    message: "YouTube connection status",
    data: { responseData: await integrationService.status(req.currentUser.id) },
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
    const browserNonce = req.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("youtube_oauth_nonce="))
      ?.slice("youtube_oauth_nonce=".length);
    if (!browserNonce || verifyOAuthState(state).nonce !== browserNonce)
      throw new Error("OAuth browser binding failed");
    await integrationService.callback(state, code);
    destination.searchParams.set("youtube", "connected");
  } catch {
    destination.searchParams.set("youtube", "error");
  }
  res.clearCookie("youtube_oauth_nonce", { path: "/api/integrations/youtube" });
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.redirect(destination.toString());
};
