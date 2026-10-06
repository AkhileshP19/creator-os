import { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";
import {
  lockOwnedContent,
  workflowError,
  type WorkflowTransaction,
} from "./video-review-service.js";
import { lockIntegrationUser } from "./integration-service.js";
import { authorizedClient } from "./youtube-auth-service.js";
import type {
  CreatePublishJob,
  PublishJobQuery,
} from "../schema/validation-schemas/publish-validation.js";

export type PublishJob = NonNullable<Awaited<ReturnType<typeof findJob>>>;
export function findJob(id: string) {
  return db.orm.public.PublishJob.where({ id }).first();
}
export function presentJob(job: PublishJob) {
  const { uploadSession: _session, uploadSize: _size, ...safe } = job;
  void _session;
  void _size;
  return safe;
}
export async function validatePublishing(
  tx: WorkflowTransaction,
  userId: string,
  contentId: string,
  assetId: string,
  integrationId?: string,
) {
  const content = await lockOwnedContent(tx, contentId, userId);
  const asset = await tx.orm.public.Asset.where({
    id: assetId,
    deletedAt: null,
    assetType: "VIDEO",
  }).first();
  if (!asset?.storageUrl || /^https?:/i.test(asset.storageUrl))
    workflowError("Video asset is missing from storage", 409);
  const workflow = await tx.orm.public.AIWorkflow.where({
    id: asset.workflowId,
    contentId,
    status: "COMPLETED",
  }).first();
  if (!workflow)
    workflowError("Approved video not found for this content", 404);
  const approval = await tx.orm.public.Approval.where({
    contentId,
    assetId,
    decision: "APPROVED",
  }).first();
  if (!approval)
    workflowError("Only the approved video asset can be published", 409);
  const integration = await tx.orm.public.Integration.where({
    userId,
    provider: "YOUTUBE",
    ...(integrationId ? { id: integrationId } : {}),
  }).first();
  if (!integration?.accessToken || !integration.refreshToken)
    workflowError("Connect YouTube in Settings before publishing", 409);
  return { content, asset, integration };
}
export function futureSchedule(value: Temporal.Instant | null) {
  if (!value || Temporal.Instant.compare(value, Temporal.Now.instant()) <= 0)
    workflowError(
      "Set a future publication date in Content before scheduling or retrying",
      409,
    );
  return value;
}
async function preventDuplicate(
  tx: WorkflowTransaction,
  assetId: string,
  integrationId: string,
  except?: string,
) {
  const jobs = await tx.orm.public.PublishJob.where({
    assetId,
    integrationId,
  }).all();
  if (
    jobs.some(
      (job) =>
        job.id !== except &&
        (job.publishStatus !== "FAILED" ||
          job.uploadSession ||
          job.externalVideoId ||
          !job.retryAllowed),
    )
  )
    workflowError(
      "This video already has a publishing job. Use its retry action if available.",
      409,
    );
}
function ownedJobs(userId: string) {
  return db.sql.public.publishJob
    .innerJoin(db.sql.public.contentIdea, (f, op) =>
      op.eq(f.publishJob.contentId, f.contentIdea.id),
    )
    .innerJoin(db.sql.public.project, (f, op) =>
      op.eq(f.contentIdea.projectId, f.project.id),
    )
    .select()
    .where((f, op) =>
      op.and(
        op.eq(f.project.ownerId, userId),
        op.eq(f.project.deletedAt, null),
        op.eq(f.contentIdea.deletedAt, null),
      ),
    );
}
export const publishService = {
  async create(userId: string, input: CreatePublishJob) {
    return db.transaction(async (tx) => {
      await lockIntegrationUser(tx, userId);
      const { content, integration } = await validatePublishing(
        tx,
        userId,
        input.contentId,
        input.assetId,
      );
      const scheduledAt = futureSchedule(content.scheduledDate);
      await preventDuplicate(tx, input.assetId, integration.id);
      const job = await tx.orm.public.PublishJob.create({
        ...input,
        description: input.description ?? null,
        integrationId: integration.id,
        platform: "YOUTUBE",
        publishStatus: "QUEUED",
        scheduledAt,
      });
      return presentJob(job);
    });
  },
  async get(userId: string, id: string) {
    const rows = await db.runtime().query(
      ownedJobs(userId)
        .where((f, op) => op.eq(f.publishJob.id, id))
        .select((f) => ({ id: f.publishJob.id }))
        .build(),
    );
    if (!rows.length) workflowError("Publishing job not found", 404);
    const job = await findJob(id);
    if (!job) workflowError("Publishing job not found", 404);
    return presentJob(job);
  },
  async list(userId: string, filters: PublishJobQuery) {
    let query = ownedJobs(userId);
    if (filters.status !== "ALL")
      query = query.where((f, op) =>
        op.eq(f.publishJob.publishStatus, filters.status),
      );
    if (filters.contentId)
      query = query.where((f, op) =>
        op.eq(f.publishJob.contentId, filters.contentId!),
      );
    const count = await db
      .runtime()
      .query(query.select("totalCount", (_f, op) => op.count()).build());
    const totalCount = count[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / filters.pageSize);
    const currentPage = Math.min(filters.pageNo, Math.max(1, totalPages));
    const ids = await db.runtime().query(
      query
        .select((f) => ({ id: f.publishJob.id }))
        .orderBy((f) => f.publishJob.createdAt, { direction: "desc" })
        .limit(filters.pageSize)
        .offset((currentPage - 1) * filters.pageSize)
        .build(),
    );
    const jobs = await Promise.all(ids.map((row) => findJob(row.id)));
    return {
      responseData: jobs
        .filter((job): job is PublishJob => Boolean(job))
        .map(presentJob),
      totalCount,
      totalPages,
      currentPage,
    };
  },
  async retry(userId: string, id: string) {
    const initial = await publishService.get(userId, id);
    if (
      initial.publishStatus !== "FAILED" ||
      !initial.retryAllowed ||
      initial.externalVideoId
    )
      workflowError(
        "This job cannot be retried. Check its status in YouTube Studio.",
        409,
      );
    await authorizedClient(initial.integrationId);
    return db.transaction(async (tx) => {
      await lockIntegrationUser(tx, userId);
      const job = await tx.orm.public.PublishJob.where({ id }).first();
      if (
        !job ||
        job.publishStatus !== "FAILED" ||
        !job.retryAllowed ||
        job.externalVideoId
      )
        workflowError("Only failed jobs can be retried", 409);
      const { content } = await validatePublishing(
        tx,
        userId,
        job.contentId,
        job.assetId,
        job.integrationId,
      );
      // Existing resumable sessions already contain immutable YouTube scheduling metadata.
      const scheduledAt = futureSchedule(
        job.uploadSession ? job.scheduledAt : content.scheduledDate,
      );
      await preventDuplicate(tx, job.assetId, job.integrationId, job.id);
      await tx.orm.public.PublishJob.where({
        id,
        publishStatus: "FAILED",
      }).update({
        publishStatus: "QUEUED",
        scheduledAt,
        errorMessage: null,
        updatedAt: Temporal.Now.instant(),
      });
      return {
        ...presentJob(job),
        publishStatus: "QUEUED" as const,
        scheduledAt,
        errorMessage: null,
      };
    });
  },
};
