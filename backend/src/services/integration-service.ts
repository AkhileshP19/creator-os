import { youtube } from "googleapis/build/src/apis/youtube/index.js";
import { z } from "zod";
import { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";
import {
  authorizationUrl,
  oauthClient,
  youtubeScopes,
} from "./youtube-auth-service.js";
import {
  createOAuthState,
  verifyOAuthState,
  pkceVerifier,
  encryptToken,
  decryptToken,
  metadataObject,
} from "./publish-security.js";
import {
  workflowError,
  type WorkflowTransaction,
} from "./video-review-service.js";

export async function lockIntegrationUser(
  tx: WorkflowTransaction,
  userId: string,
) {
  const rows = await tx.query(
    db.raw
      .sql`SELECT "id" FROM public."user" WHERE "id" = ${userId} AND "deletedAt" IS NULL FOR UPDATE`
      .returnsRow({ id: "pg/text@1" })
      .build(),
  );
  if (!rows.length) workflowError("User not found", 404);
}
async function setConnected(
  tx: WorkflowTransaction,
  userId: string,
  connected: boolean,
) {
  const settings = await tx.orm.public.UserSettings.where({ userId }).first();
  if (settings)
    await tx.orm.public.UserSettings.where({ userId }).update({
      youtubeConnected: connected,
    });
  else
    await tx.orm.public.UserSettings.create({
      userId,
      youtubeConnected: connected,
      aiProvider: "GEMINI",
      notificationPreferences: {},
    });
}
export const integrationService = {
  async connect(userId: string) {
    const { state, nonce } = createOAuthState(userId);
    const url = authorizationUrl(state, nonce);
    // Check encryption configuration before sending the user to Google.
    encryptToken("configuration-check");
    await db.transaction(async (tx) => {
      await lockIntegrationUser(tx, userId);
      const existing = await tx.orm.public.Integration.where({
        userId,
        provider: "YOUTUBE",
      }).first();
      const metadata = {
        ...metadataObject(existing?.metadata),
        oauthNonce: nonce,
        oauthPending: null,
      };
      if (existing)
        await tx.orm.public.Integration.where({ id: existing.id }).update({
          metadata,
          updatedAt: Temporal.Now.instant(),
        });
      else
        await tx.orm.public.Integration.create({
          userId,
          provider: "YOUTUBE",
          accessToken: "",
          metadata,
        });
    });
    return { authorizationUrl: url, nonce };
  },
  async callback(state: string, code: string) {
    const { userId, nonce } = verifyOAuthState(state);
    // Consume once, across all backend instances, before exchanging the code.
    await db.transaction(async (tx) => {
      await lockIntegrationUser(tx, userId);
      const integration = await tx.orm.public.Integration.where({
        userId,
        provider: "YOUTUBE",
      }).first();
      const metadata = metadataObject(integration?.metadata);
      if (!integration || metadata.oauthNonce !== nonce)
        workflowError("Invalid or already used OAuth state", 400);
      delete metadata.oauthNonce;
      metadata.oauthPending = nonce;
      await tx.orm.public.Integration.where({ id: integration.id }).update({
        metadata: z.json().parse(metadata),
      });
    });
    const client = oauthClient();
    const { tokens } = await client.getToken({
      code,
      codeVerifier: pkceVerifier(nonce),
    });
    if (
      !tokens.access_token ||
      !youtubeScopes.every((scope) => tokens.scope?.split(" ").includes(scope))
    )
      workflowError("Required YouTube permissions were not granted", 409);
    client.setCredentials(tokens);
    const channels = await youtube({
      version: "v3",
      auth: client,
    }).channels.list({ part: ["snippet"], mine: true });
    const channel = channels.data.items?.[0];
    if (!channel?.id)
      workflowError("Create a YouTube channel before connecting", 409);
    await db.transaction(async (tx) => {
      await lockIntegrationUser(tx, userId);
      const existing = await tx.orm.public.Integration.where({
        userId,
        provider: "YOUTUBE",
      }).first();
      if (!existing) workflowError("YouTube connection was removed", 409);
      const previous = metadataObject(existing.metadata);
      if (previous.oauthPending !== nonce)
        workflowError("YouTube connection changed. Start again.", 409);
      // Never redirect an existing job to a different channel, even after disconnect.
      if (previous.channelId && previous.channelId !== channel.id) {
        if (!tokens.refresh_token)
          workflowError(
            "Grant offline consent when changing YouTube channels",
            409,
          );
        const job = await tx.orm.public.PublishJob.where({
          integrationId: existing.id,
        }).first();
        if (job)
          workflowError(
            "Reconnect the original channel for existing publishing jobs",
            409,
          );
      }
      const refreshToken = tokens.refresh_token
        ? encryptToken(tokens.refresh_token)
        : existing.refreshToken;
      if (!refreshToken)
        workflowError(
          "Offline access is required. Reconnect YouTube and grant consent",
          409,
        );
      await tx.orm.public.Integration.where({ id: existing.id }).update({
        accessToken: encryptToken(tokens.access_token!),
        refreshToken,
        expiresAt: tokens.expiry_date
          ? Temporal.Instant.fromEpochMilliseconds(tokens.expiry_date)
          : null,
        metadata: {
          channelId: channel.id!,
          channelTitle: channel.snippet?.title ?? "YouTube",
          scope: tokens.scope ?? "",
        },
        updatedAt: Temporal.Now.instant(),
      });
      await setConnected(tx, userId, true);
    });
  },
  async status(userId: string) {
    const integration = await db.orm.public.Integration.where({
      userId,
      provider: "YOUTUBE",
    }).first();
    const metadata = metadataObject(integration?.metadata);
    return {
      connected: Boolean(integration?.accessToken && integration.refreshToken),
      provider: "YOUTUBE",
      channelId:
        typeof metadata.channelId === "string" ? metadata.channelId : null,
      channelTitle:
        typeof metadata.channelTitle === "string"
          ? metadata.channelTitle
          : null,
    };
  },
  async disconnect(userId: string) {
    const token = await db.transaction(async (tx) => {
      await lockIntegrationUser(tx, userId);
      const integration = await tx.orm.public.Integration.where({
        userId,
        provider: "YOUTUBE",
      }).first();
      if (integration) {
        const uploading = await tx.orm.public.PublishJob.where({
          integrationId: integration.id,
          publishStatus: "UPLOADING",
        }).first();
        if (uploading)
          workflowError(
            "An upload is in progress. Disconnect after it finishes.",
            409,
          );
        await tx.orm.public.Integration.where({ id: integration.id }).update({
          accessToken: "",
          refreshToken: null,
          expiresAt: null,
          metadata: z.json().parse({
            channelId: metadataObject(integration.metadata).channelId ?? null,
            channelTitle:
              metadataObject(integration.metadata).channelTitle ?? null,
          }),
          updatedAt: Temporal.Now.instant(),
        });
        await tx.orm.public.PublishJob.where({
          integrationId: integration.id,
          publishStatus: "QUEUED",
        }).update({
          publishStatus: "FAILED",
          errorMessage:
            "YouTube disconnected. Reconnect the same channel before retrying.",
          updatedAt: Temporal.Now.instant(),
        });
      }
      await setConnected(tx, userId, false);
      return integration?.refreshToken ?? null;
    });
    if (token) {
      try {
        await oauthClient().revokeToken(decryptToken(token));
      } catch {
        /* Local disconnect is authoritative; never log credentials. */
      }
    }
    return { connected: false };
  },
};
