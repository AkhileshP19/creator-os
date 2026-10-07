import { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";
import { getB2SignedUrl } from "./b2-storage-service.js";
import workflowExecutionService from "./workflow-execution-service.js";
import { lockOwnedContent, workflowError } from "./video-review-service.js";
import type { ApprovalFilters } from "../schema/validation-schemas/approval-validation.js";

function ownedApprovals(userId: string) {
  return db.sql.public.approval
    .innerJoin(db.sql.public.contentIdea, (f, op) =>
      op.eq(f.approval.contentId, f.contentIdea.id),
    )
    .innerJoin(db.sql.public.project, (f, op) =>
      op.eq(f.contentIdea.projectId, f.project.id),
    )
    .outerLeftJoin(db.sql.public.asset, (f, op) =>
      op.eq(f.approval.assetId, f.asset.id),
    )
    .outerLeftJoin(db.sql.public.aIWorkflow, (f, op) =>
      op.eq(f.asset.workflowId, f.aIWorkflow.id),
    )
    .outerLeftJoin(db.sql.public.aIWorkflow.as("regeneration"), (f, op) =>
      op.eq(f.approval.regenerationWorkflowId, f.regeneration.id),
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

function selectReview(query: ReturnType<typeof ownedApprovals>) {
  return query.select((f) => ({
    approvalId: f.approval.id,
    status: f.approval.decision,
    comments: f.approval.comment,
    createdAt: f.approval.createdAt,
    updatedAt: f.approval.updatedAt,
    reviewedAt: f.approval.reviewedAt,
    contentId: f.contentIdea.id,
    title: f.contentIdea.title,
    tags: f.contentIdea.tags,
    description: f.contentIdea.description,
    category: f.contentIdea.category,
    scheduledDate: f.contentIdea.scheduledDate,
    projectId: f.project.id,
    projectName: f.project.name,
    workflowId: f.aIWorkflow.id,
    workflowStatus: f.aIWorkflow.status,
    assetId: f.asset.id,
    assetType: f.asset.assetType,
    assetDeletedAt: f.asset.deletedAt,
    storageUrl: f.asset.storageUrl,
    generatedAt: f.asset.createdAt,
    regenerationWorkflowId: f.regeneration.id,
    regenerationStatus: f.regeneration.status,
  }));
}

type ReviewRow = Awaited<ReturnType<typeof getRows>>[number];
async function getRows(query: ReturnType<typeof ownedApprovals>) {
  return db.runtime().query(selectReview(query).build());
}

async function getDurations(rows: ReviewRow[]) {
  const ids = rows.flatMap((row) => (row.workflowId ? [row.workflowId] : []));
  const durations = new Map<string, number>();
  if (!ids.length) return durations;
  const workflows = await db.orm.public.AIWorkflow.where((w) => w.id.in(ids))
    .select("id")
    .include("aiRequests", (requests) =>
      requests
        .select("input")
        .orderBy((r) => r.createdAt.desc())
        .limit(1),
    )
    .all();
  for (const workflow of workflows) {
    const input = workflow.aiRequests[0]?.input;
    if (input && typeof input === "object" && !Array.isArray(input)) {
      const inputObj = input as Record<string, unknown>;
      if (typeof inputObj.durationSeconds === "number") {
        durations.set(workflow.id, inputObj.durationSeconds);
      }
    }
  }
  return durations;
}

async function getPublishStates(rows: ReviewRow[]) {
  const assetIds = rows.flatMap((row) => (row.assetId ? [row.assetId] : []));

  const states = new Map<
    string,
    {
      publishJobId: string;
      publishStatus:
        "QUEUED" | "UPLOADING" | "SCHEDULED" | "PUBLISHED" | "FAILED";
      externalVideoUrl: string | null;
      publishError: string | null;
    }
  >();

  if (!assetIds.length) return states;

  const jobs = await db.orm.public.PublishJob.where((job) =>
    job.assetId.in(assetIds),
  )
    .orderBy((job) => job.createdAt.desc())
    .all();

  for (const job of jobs) {
    if (states.has(job.assetId)) continue;

    states.set(job.assetId, {
      publishJobId: job.id,
      publishStatus: job.publishStatus,
      externalVideoUrl: job.externalVideoUrl,
      publishError: job.errorMessage,
    });
  }

  return states;
}

type PublishState = {
  publishJobId: string;
  publishStatus: "QUEUED" | "UPLOADING" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  externalVideoUrl: string | null;
  publishError: string | null;
};

async function present(
  row: ReviewRow,
  durationSeconds: number | null = null,
  publishState: PublishState | null = null,
) {
  const { storageUrl, assetDeletedAt, assetType, ...review } = row;

  let videoUrl: string | null = null;

  if (
    storageUrl &&
    !assetDeletedAt &&
    assetType === "VIDEO" &&
    row.workflowStatus === "COMPLETED"
  ) {
    const signed = await getB2SignedUrl(storageUrl, 3600);

    if (/^https?:\/\//.test(signed)) {
      videoUrl = signed;
    }
  }

  return {
    ...review,
    durationSeconds,
    videoUrl,

    publishJobId: publishState?.publishJobId ?? null,
    publishStatus: publishState?.publishStatus ?? null,
    externalVideoUrl: publishState?.externalVideoUrl ?? null,
    publishError: publishState?.publishError ?? null,

    regenerationError:
      row.regenerationStatus === "FAILED"
        ? "Video generation failed. Please try again."
        : null,

    playbackError: videoUrl
      ? null
      : "Video playback is unavailable. Try refreshing the video.",
  };
}

const approvalService = {
  list: async (userId: string, filters: ApprovalFilters) => {
    let query = ownedApprovals(userId);
    if (filters.status !== "ALL") {
      const status = filters.status;
      query = query.where((f, op) =>
        status === "REJECTED"
          ? op.in(f.approval.decision, ["REJECTED", "REGENERATE"])
          : op.eq(f.approval.decision, status),
      );
    }
    if (filters.projectId)
      query = query.where((f, op) => op.eq(f.project.id, filters.projectId));
    if (filters.search) {
      const escaped = filters.search.replace(/[\\%_]/g, "\\$&");
      query = query.where((f, op) =>
        op.ilike(f.contentIdea.title, `%${escaped}%`),
      );
    }
    if (filters.scheduledDateFilter === "UNSCHEDULED") {
      query = query.where((f, op) => op.eq(f.contentIdea.scheduledDate, null));
    } else if (filters.scheduledDateFilter !== "ALL") {
      const today = Temporal.Now.zonedDateTimeISO(
        filters.timezone,
      ).startOfDay();
      const end = today.add({
        days: filters.scheduledDateFilter === "TODAY" ? 1 : 7,
      });
      query = query.where((f, op) =>
        op.and(
          op.gte(f.contentIdea.scheduledDate, today.toInstant()),
          op.lt(f.contentIdea.scheduledDate, end.toInstant()),
        ),
      );
    }
    // Count the filtered relation before paging, without materializing its rows.
    const countRows = await db
      .runtime()
      .query(query.select("totalCount", (_f, op) => op.count()).build());
    const totalCount = countRows[0]?.totalCount ?? 0;
    const totalPages = Math.ceil(totalCount / filters.pageSize);
    const currentPage = Math.min(filters.pageNo, Math.max(1, totalPages));
    if (filters.sortBy === "scheduledDate") {
      // This Prisma release drops the nulls option when building the AST.
      // Sort the IS NULL expression first to keep unscheduled items last in both directions.
      query = query.orderBy(
        (f, op) => op.eq(f.contentIdea.scheduledDate, null),
        { direction: "asc" },
      );
      query = query.orderBy((f) => f.contentIdea.scheduledDate, {
        direction: filters.sortOrder === "ASC" ? "asc" : "desc",
        nulls: "last",
      });
    }
    query = query
      .orderBy((f, op) => op.eq(f.asset.createdAt, null), { direction: "asc" })
      .orderBy((f) => f.asset.createdAt, {
        direction:
          filters.sortBy === "generatedAt" && filters.sortOrder === "ASC"
            ? "asc"
            : "desc",
        nulls: "last",
      })
      .orderBy((f) => f.approval.id, { direction: "desc" });
    const rows = await getRows(
      query
        .limit(filters.pageSize)
        .offset((currentPage - 1) * filters.pageSize),
    );
    const durations = await getDurations(rows);
    const publishStates = await getPublishStates(rows);

    return {
      responseData: await Promise.all(
        rows.map((row) =>
          present(
            row,
            durations.get(row.workflowId ?? "") ?? null,
            row.assetId ? (publishStates.get(row.assetId) ?? null) : null,
          ),
        ),
      ),
      totalCount,
      totalPages,
      currentPage,
    };
  },

  get: async (approvalId: string, userId: string) => {
    const [row] = await getRows(
      ownedApprovals(userId)
        .where((f, op) => op.eq(f.approval.id, approvalId))
        .limit(1),
    );

    if (!row) {
      workflowError("Approval not found or you do not have access to it", 404);
    }

    const durations = await getDurations([row]);
    const publishStates = await getPublishStates([row]);

    return present(
      row,
      durations.get(row.workflowId ?? "") ?? null,
      row.assetId ? (publishStates.get(row.assetId) ?? null) : null,
    );
  },

  decide: async (
    approvalId: string,
    userId: string,
    decision: "APPROVED" | "REJECTED",
    comments?: string,
  ) => {
    await db.transaction(async (tx) => {
      const initial = await tx.orm.public.Approval.where({
        id: approvalId,
      }).first();
      if (!initial) workflowError("Approval not found", 404);
      await lockOwnedContent(tx, initial.contentId, userId);
      const approval = await tx.orm.public.Approval.where({
        id: approvalId,
      }).first();
      if (!approval) workflowError("Approval not found", 404);
      if (approval.decision !== "PENDING")
        workflowError("Only pending videos can be approved or rejected", 409);
      if (!approval.assetId) workflowError("Video asset not found", 404);
      const asset = await tx.orm.public.Asset.where({
        id: approval.assetId,
        assetType: "VIDEO",
        deletedAt: null,
      }).first();
      if (!asset?.storageUrl) workflowError("Video asset not found", 404);
      const workflow = await tx.orm.public.AIWorkflow.where({
        id: asset.workflowId,
        contentId: approval.contentId,
        status: "COMPLETED",
      }).first();
      if (!workflow) workflowError("Video generation is not complete", 409);
      const now = Temporal.Now.instant();
      await tx.orm.public.Approval.where({
        id: approvalId,
        decision: "PENDING",
      }).update({
        decision,
        comment: decision === "REJECTED" ? comments || null : null,
        reviewedById: userId,
        reviewedAt: now,
        updatedAt: now,
      });
    });
    return approvalService.get(approvalId, userId);
  },

  regenerate: async (approvalId: string, userId: string) => {
    const approval = await approvalService.get(approvalId, userId);
    const workflow = await workflowExecutionService.startVideoGeneration(
      approval.contentId,
      userId,
      approvalId,
    );
    return { approvalId, workflowId: workflow.id, status: workflow.status };
  },
};
export default approvalService;
