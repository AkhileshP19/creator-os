import { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";

export type WorkflowTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export function workflowError(message: string, statusCode: number): never {
  throw Object.assign(new Error(message), { statusCode });
}

// Prisma's ORM has no row-lock operator in this release. Use its parameterized
// raw lane on the same transaction so review actions never rewrite timestamps.
// Every video start and approval action locks these rows in the same query.
export async function lockOwnedContent(
  tx: WorkflowTransaction,
  contentId: string,
  userId: string,
) {
  const locked = await tx.query(
    db.raw.sql`
    SELECT c."id" AS "id"
    FROM public."contentIdea" c
    JOIN public."project" p ON p."id" = c."projectId"
    WHERE c."id" = ${contentId} AND p."ownerId" = ${userId}
      AND c."deletedAt" IS NULL AND p."deletedAt" IS NULL
    FOR UPDATE OF p, c
  `
      .returnsRow({ id: "pg/text@1" })
      .build(),
  );
  if (!locked.length)
    workflowError("Content not found or you do not have access to it", 404);
  const content = await tx.orm.public.ContentIdea.where({
    id: contentId,
    deletedAt: null,
  }).first();
  if (!content) workflowError("Content not found", 404);
  return content;
}
export async function ensureVideoApproval(
  tx: WorkflowTransaction,
  assetId: string,
  contentId: string,
) {
  const existing = await tx.orm.public.Approval.where({ assetId }).first();
  if (existing) return existing;
  return tx.orm.public.Approval.create({
    contentId,
    assetId,
    decision: "PENDING",
    reviewedById: null,
    reviewedAt: null,
    comment: null,
    regenerationWorkflowId: null,
  });
}

// Completion and review insertion commit together; retries preserve the asset
// and any decision already made for it.
export async function completeVideoWorkflow(
  workflowId: string,
  userId: string,
  storageUrl: string,
  executionTime: number,
) {
  if (!storageUrl.trim())
    workflowError("Generated video has no storage reference", 400);
  return db.transaction(async (tx) => {
    const workflow = await tx.orm.public.AIWorkflow.where({
      id: workflowId,
    }).first();
    if (!workflow) workflowError("Workflow not found", 404);
    if (workflow.workflowType !== "VIDEO_GENERATION")
      workflowError("Workflow is not a video generation workflow", 400);
    await lockOwnedContent(tx, workflow.contentId, userId);
    const existing = await tx.orm.public.Asset.where({
      workflowId,
      assetType: "VIDEO",
      deletedAt: null,
    }).first();
    const asset =
      existing ??
      (await tx.orm.public.Asset.create({
        workflowId,
        storageUrl,
        assetType: "VIDEO",
      }));
    await ensureVideoApproval(tx, asset.id, workflow.contentId);
    await tx.orm.public.AIWorkflow.where({ id: workflowId }).update({
      status: "COMPLETED",
      completedAt: Temporal.Now.instant(),
      updatedAt: Temporal.Now.instant(),
      executionTime,
      currentStep: "VIDEO_GENERATED",
      errorMessage: null,
    });
    return asset;
  });
}
