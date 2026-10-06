import { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";
import {
  findJob,
  futureSchedule,
  validatePublishing,
} from "./publish-service.js";
import { lockIntegrationUser } from "./integration-service.js";
import { youtubePublishService } from "./youtube-publish-service.js";
import { safePublishError } from "./publish-security.js";

export async function claimPublishJob(id: string) {
  return db.transaction(async (tx) => {
    const initial = await tx.orm.public.PublishJob.where({
      id,
      publishStatus: "QUEUED",
    }).first();
    if (!initial) return null;
    const integration = await tx.orm.public.Integration.where({
      id: initial.integrationId,
    }).first();
    if (!integration) return null;
    await lockIntegrationUser(tx, integration.userId);
    const rows = await tx.query(
      db.raw
        .sql`UPDATE public."publishJob" SET "publishStatus" = 'UPLOADING', "attemptCount" = "attemptCount" + 1, "updatedAt" = NOW() WHERE "id" = ${id} AND "publishStatus" = 'QUEUED' RETURNING "id"`
        .returnsRow({ id: "pg/text@1" })
        .build(),
    );
    return rows.length ? tx.orm.public.PublishJob.where({ id }).first() : null;
  });
}
export async function processPublishJob(id: string) {
  const job = await claimPublishJob(id);
  if (!job) return;
  try {
    const objectKey = await db.transaction(async (tx) => {
      const integration = await tx.orm.public.Integration.where({
        id: job.integrationId,
      }).first();
      if (!integration) throw new Error("Missing integration");
      const { asset } = await validatePublishing(
        tx,
        integration.userId,
        job.contentId,
        job.assetId,
        job.integrationId,
      );
      if (!job.uploadSession) futureSchedule(job.scheduledAt);
      return asset.storageUrl;
    });
    const id = await youtubePublishService.upload(job, objectKey);
    await db.orm.public.PublishJob.where({
      id: job.id,
      publishStatus: "UPLOADING",
    }).update({
      publishStatus: "SCHEDULED",
      externalVideoId: id,
      externalVideoUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
      uploadedAt: Temporal.Now.instant(),
      errorMessage: null,
      retryAllowed: false,
      updatedAt: Temporal.Now.instant(),
    });
  } catch (error: unknown) {
    await db.orm.public.PublishJob.where({
      id: job.id,
      publishStatus: "UPLOADING",
    }).update({
      publishStatus: "FAILED",
      errorMessage: safePublishError(error),
      updatedAt: Temporal.Now.instant(),
    });
  }
}
export async function reconcilePublishJob(id: string) {
  const job = await findJob(id);
  if (
    !job ||
    job.publishStatus !== "SCHEDULED" ||
    !job.externalVideoId ||
    Temporal.Instant.compare(job.scheduledAt, Temporal.Now.instant()) > 0
  )
    return;
  try {
    const result = await youtubePublishService.status(job);
    const now = Temporal.Now.instant();
    if (result.public) {
      await db.transaction(async (tx) => {
        const updated = await tx.orm.public.PublishJob.where({
          id,
          publishStatus: "SCHEDULED",
        }).update({
          publishStatus: "PUBLISHED",
          publishedAt: result.publishedAt
            ? Temporal.Instant.from(result.publishedAt)
            : now,
          errorMessage: null,
          updatedAt: now,
        });
        if (updated) {
          await tx.orm.public.ContentIdea.where({
            id: job.contentId,
            deletedAt: null,
          }).update({
            status: "COMPLETED",
          });
        }
      });
    } else if (result.failed) {
      await db.orm.public.PublishJob.where({
        id,
        publishStatus: "SCHEDULED",
      }).update({
        publishStatus: "FAILED",
        retryAllowed: false,
        errorMessage:
          "YouTube rejected or could not process this video. Review it in YouTube Studio.",
        updatedAt: now,
      });
    } else {
      await db.orm.public.PublishJob.where({
        id,
        publishStatus: "SCHEDULED",
      }).update({
        errorMessage: result.missing
          ? "Video unavailable in YouTube. Check YouTube Studio."
          : "YouTube has not confirmed public visibility. Check processing, schedule, and API project restrictions in YouTube Studio.",
        updatedAt: now,
      });
    }
  } catch (error: unknown) {
    await db.orm.public.PublishJob.where({
      id,
      publishStatus: "SCHEDULED",
    }).update({
      errorMessage: safePublishError(error),
      updatedAt: Temporal.Now.instant(),
    });
  }
}
let timer: ReturnType<typeof setTimeout> | undefined;
let stopped = true;
let running: Promise<void> | undefined;
export async function publishWorkerTick() {
  // Upload HTTP requests have a ten-minute deadline. Twenty minutes is conservative crash recovery.
  const stale = Temporal.Now.instant().subtract({ minutes: 20 });
  await db.orm.public.PublishJob.where({ publishStatus: "UPLOADING" })
    .where((j) => j.updatedAt.lt(stale))
    .update({
      publishStatus: "FAILED",
      errorMessage:
        "Upload interrupted. Retry to recover the existing upload session.",
      updatedAt: Temporal.Now.instant(),
    });
  const jobs = await db.orm.public.PublishJob.where({ publishStatus: "QUEUED" })
    .orderBy((j) => j.createdAt.asc())
    .limit(5)
    .all();
  for (const job of jobs) await processPublishJob(job.id);
  const scheduled = await db.orm.public.PublishJob.where({
    publishStatus: "SCHEDULED",
  })
    .where((j) => j.scheduledAt.lte(Temporal.Now.instant()))
    .where((j) =>
      j.updatedAt.lte(Temporal.Now.instant().subtract({ minutes: 5 })),
    )
    .orderBy((j) => j.updatedAt.asc())
    .limit(20)
    .all();
  for (const job of scheduled) await reconcilePublishJob(job.id);
}
export function startPublishWorker() {
  if (!stopped) return;
  stopped = false;
  const configured = Number(process.env.PUBLISH_WORKER_INTERVAL_MS ?? 15_000);
  const interval = Number.isFinite(configured)
    ? Math.max(1000, configured)
    : 15_000;
  const tick = () => {
    running = publishWorkerTick()
      .catch((err) => {
        console.error(
          "Publishing worker cycle failed; it will retry next cycle.",
          err
        );
      })
      .finally(() => {
        running = undefined;
        if (!stopped) timer = setTimeout(tick, interval);
      });
  };
  tick();
}
export async function stopPublishWorker() {
  stopped = true;
  clearTimeout(timer);
  await running;
}
