import { youtube } from "googleapis/build/src/apis/youtube/index.js";
import { request } from "undici";
import { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";
import { b2PublishingStorage } from "./b2-storage-service.js";
import { authorizedClient } from "./youtube-auth-service.js";
import {
  decryptToken,
  encryptToken,
  metadataObject,
} from "./publish-security.js";
import { futureSchedule, type PublishJob } from "./publish-service.js";
import { workflowError } from "./video-review-service.js";

function sessionUrl(encrypted: string) {
  const url = new URL(decryptToken(encrypted));
  if (
    url.protocol !== "https:" ||
    url.hostname !== "www.googleapis.com" ||
    !url.pathname.startsWith("/upload/youtube/v3/videos")
  )
    throw new Error("Invalid upload session");
  return url.toString();
}
export const youtubePublishService = {
  async upload(job: PublishJob, objectKey: string): Promise<string> {
    const auth = await authorizedClient(job.integrationId);
    const access = (await auth.getAccessToken()).token;
    if (!access) workflowError("Reconnect YouTube in Settings", 409);
    let session = job.uploadSession;
    let offset = 0;
    if (session) {
      const response = await request(sessionUrl(session), {
        method: "PUT",
        headers: {
          authorization: `Bearer ${access}`,
          "content-length": "0",
          "content-range": `bytes */${job.uploadSize ?? "*"}`,
        },
        headersTimeout: 30_000,
        bodyTimeout: 30_000,
        signal: AbortSignal.timeout(60_000),
      });
      if (response.statusCode === 200 || response.statusCode === 201) {
        const body = metadataObject(await response.body.json());
        if (typeof body.id === "string") return body.id;
        throw new Error("Missing YouTube video ID");
      }
      await response.body.dump();
      if (response.statusCode !== 308) {
        if (response.statusCode === 404 || response.statusCode === 410) {
          await db.orm.public.PublishJob.where({ id: job.id }).update({
            retryAllowed: false,
          });
          workflowError(
            "Upload session expired. Check YouTube Studio for a possible upload; automatic retry is disabled to prevent duplicates.",
            409,
          );
        }
        workflowError(
          "YouTube could not confirm the previous upload. Retry later; no new video was created.",
          409,
        );
      }
      const range = response.headers.range;
      if (typeof range === "string") {
        const match = /^bytes=0-(\d+)$/.exec(range);
        if (!match?.[1]) throw new Error("Invalid upload range");
        offset = Number(match[1]) + 1;
      }
    }
    futureSchedule(job.scheduledAt);
    const object = await b2PublishingStorage.getObjectStream(objectKey, offset);
    try {
      const size = object.size + offset;
      if (job.uploadSize && job.uploadSize !== size)
        workflowError(
          "Stored video changed since upload began. Retry is unsafe.",
          409,
        );
      if (!session) {
        const response = await auth.request<unknown>({
          url: "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
          method: "POST",
          headers: {
            "X-Upload-Content-Length": String(size),
            "X-Upload-Content-Type": "video/mp4",
          },
          data: {
            snippet: {
              title: job.title,
              description: job.description ?? "",
              tags: job.tags,
            },
            status: {
              privacyStatus: "private",
              publishAt: job.scheduledAt.toString(),
              selfDeclaredMadeForKids: job.selfDeclaredMadeForKids,
              containsSyntheticMedia: job.containsSyntheticMedia,
            },
          },
          retry: false,
          timeout: 30_000,
        });
        const location = response.headers.get("location");
        if (!location)
          throw new Error("YouTube did not return an upload session");
        session = encryptToken(location);
        sessionUrl(session);
        // Persist before sending the first video byte. A crash can safely query this session.
        await db.orm.public.PublishJob.where({
          id: job.id,
          publishStatus: "UPLOADING",
        }).update({
          uploadSession: session,
          uploadSize: size,
          updatedAt: Temporal.Now.instant(),
        });
      }
      futureSchedule(job.scheduledAt);
      if (object.stream.errored || object.stream.destroyed)
        throw new Error("Video storage stream failed");
      const response = await request(sessionUrl(session), {
        method: "PUT",
        headers: {
          authorization: `Bearer ${access}`,
          "content-type": "video/mp4",
          "content-length": String(object.size),
          "content-range": `bytes ${offset}-${size - 1}/${size}`,
        },
        body: object.stream,
        headersTimeout: 600_000,
        bodyTimeout: 600_000,
        signal: AbortSignal.timeout(600_000),
      });
      const data: unknown = await response.body.json();
      if (response.statusCode !== 200 && response.statusCode !== 201)
        throw { response: { status: response.statusCode, data } };
      const body = metadataObject(data);
      if (typeof body.id !== "string")
        throw new Error("Missing YouTube video ID");
      return body.id;
    } finally {
      object.stream.destroy();
    }
  },
  async status(job: PublishJob) {
    const auth = await authorizedClient(job.integrationId);
    const result = await youtube({ version: "v3", auth }).videos.list({
      part: ["status", "processingDetails", "snippet"],
      id: [job.externalVideoId!],
    });
    const video = result.data.items?.[0];
    return {
      public: video?.status?.privacyStatus === "public",
      failed:
        ["failed", "rejected", "deleted"].includes(
          video?.status?.uploadStatus ?? "",
        ) || video?.processingDetails?.processingStatus === "failed",
      publishedAt: video?.snippet?.publishedAt ?? null,
      missing: !video,
    };
  },
};
