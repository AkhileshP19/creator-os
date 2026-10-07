import { createHash } from "node:crypto";
import { auth } from "googleapis/build/src/apis/youtube/index.js";
import { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";
import {
  decryptToken,
  encryptToken,
  pkceVerifier,
  requiredEnv,
} from "./publish-security.js";
import { workflowError } from "./video-review-service.js";

export const youtubeScopes = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];
export function oauthClient() {
  return new auth.OAuth2({
    clientId: requiredEnv("GOOGLE_CLIENT_ID"),
    clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: requiredEnv("GOOGLE_REDIRECT_URI"),
    transporterOptions: { timeout: 30_000, retry: false },
  });
}
export function authorizationUrl(state: string, nonce: string) {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: youtubeScopes,
    state,
    code_challenge: createHash("sha256")
      .update(pkceVerifier(nonce))
      .digest("base64url"),
    code_challenge_method:
      "S256" as import("google-auth-library").CodeChallengeMethod,
  });
}
export async function authorizedClient(integrationId: string) {
  const integration = await db.orm.public.Integration.where({
    id: integrationId,
    provider: "YOUTUBE",
  }).first();
  if (!integration?.refreshToken || !integration.accessToken)
    workflowError("Reconnect your YouTube channel in Settings", 409);
  const client = oauthClient();
  client.setCredentials({
    refresh_token: decryptToken(integration.refreshToken),
  });
  try {
    const { credentials } = await client.refreshAccessToken();
    if (!credentials.access_token)
      workflowError("Reconnect your YouTube channel in Settings", 409);
    // A concurrent disconnect must never resurrect credentials.
    await db.orm.public.Integration.where({
      id: integration.id,
      refreshToken: integration.refreshToken,
    }).update({
      accessToken: encryptToken(credentials.access_token),
      expiresAt: credentials.expiry_date
        ? Temporal.Instant.fromEpochMilliseconds(credentials.expiry_date)
        : null,
      updatedAt: Temporal.Now.instant(),
    });
    return client;
  } catch {
    workflowError(
      "YouTube authorization could not be refreshed. Reconnect the same channel in Settings.",
      409,
    );
  }
}
