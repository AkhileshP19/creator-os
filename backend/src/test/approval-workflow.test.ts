import { afterEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import { Temporal } from "temporal-polyfill";
import {
  approvalQuerySchema,
  rejectionSchema,
} from "../schema/validation-schemas/approval-validation.js";
import type { WorkflowTransaction } from "../services/video-review-service.js";

process.env.GEMINI_MODEL = "test-script";
process.env.GEMINI_VIDEO_MODEL = "test-video";
process.env.GEMINI_API_KEY = "test-key-never-sent";
process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
const { db } = await import("../prisma/db.js");
const { default: approvals } = await import("../services/approval-service.js");
const { default: workflows } =
  await import("../services/ai-workflow-service.js");
const { default: execution } =
  await import("../services/workflow-execution-service.js");
const { completeVideoWorkflow } =
  await import("../services/video-review-service.js");

afterEach(() => mock.restoreAll());
type Row = Record<string, unknown>;
const now = Temporal.Now.instant();
function fixture() {
  const data: Record<string, Row[]> = {
    Project: [
      { id: "project", ownerId: "owner", deletedAt: null, updatedAt: now },
    ],
    ContentIdea: [
      { id: "content", projectId: "project", deletedAt: null, updatedAt: now },
    ],
    AIWorkflow: [
      {
        id: "source",
        contentId: "content",
        workflowType: "VIDEO_GENERATION",
        status: "COMPLETED",
      },
    ],
    Asset: [
      {
        id: "video",
        workflowId: "source",
        assetType: "VIDEO",
        storageUrl: "private/video.mp4",
        deletedAt: null,
      },
    ],
    Approval: [
      {
        id: "review",
        contentId: "content",
        assetId: "video",
        decision: "PENDING",
        comment: null,
        reviewedById: null,
        reviewedAt: null,
        regenerationWorkflowId: null,
      },
    ],
    WorkflowLog: [],
  };
  let serial = 0;
  const events: string[] = [];
  function collection(
    name: string,
    predicates: ((row: Row) => boolean)[] = [],
  ) {
    const rows = () =>
      data[name]!.filter((row) => predicates.every((p) => p(row)));
    return {
      where(
        condition:
          | Row
          | ((
              fields: Record<string, { in: (values: unknown[]) => boolean }>,
            ) => boolean),
      ) {
        const predicate =
          typeof condition === "function"
            ? (row: Row) =>
                condition(
                  new Proxy(
                    {},
                    {
                      get: (_target, key: string) => ({
                        in: (values: unknown[]) => values.includes(row[key]),
                      }),
                    },
                  ),
                )
            : (row: Row) =>
                Object.entries(condition).every(
                  ([key, value]) => row[key] === value,
                );
        return collection(name, [...predicates, predicate]);
      },
      async first() {
        return rows()[0] ?? null;
      },
      async create(input: Row) {
        const row = {
          id: `new-${++serial}`,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          ...input,
        };
        data[name]!.push(row);
        return row;
      },
      async update(input: Row) {
        events.push(`update:${name}`);
        const selected = rows();
        for (const row of selected) Object.assign(row, input);
        return selected;
      },
    };
  }
  const tx = {
    query: async (plan: any) => {
      const parts = plan.ast?.parts ?? [];
      const params = parts
        .filter((p: any) => typeof p === "object" && p !== null && "value" in p)
        .map((p: any) => p.value);
      const [contentId, userId] = params;
      events.push("lock:Project", "lock:ContentIdea");
      const content = data.ContentIdea!.find(
        (row) => row.id === contentId && row.deletedAt === null,
      );
      const project = data.Project!.find(
        (row) =>
          row.id === content?.projectId &&
          row.ownerId === userId &&
          row.deletedAt === null,
      );
      return content && project ? [{ id: content.id }] : [];
    },
    orm: {
      public: Object.fromEntries(
        Object.keys(data).map((name) => [name, collection(name)]),
      ),
    },
  } as unknown as WorkflowTransaction;
  mock.method(
    db,
    "transaction",
    async (fn: (transaction: WorkflowTransaction) => Promise<unknown>) =>
      fn(tx),
  );
  mock.method(approvals, "get", async () => data.Approval![0]);
  return { data, events, review: data.Approval![0]! };
}
const httpError = (status: number) => (error: unknown) =>
  error instanceof Error &&
  "statusCode" in error &&
  error.statusCode === status;

test("rejects malformed filters and comments; ALL stays an API-only filter", () => {
  assert.equal(approvalQuerySchema.parse({}).status, "ALL");
  assert.equal(approvalQuerySchema.parse({}).pageNo, 1);
  for (const input of [
    { pageNo: 0 },
    { pageSize: 1000 },
    { status: "REGENERATE" },
    { sortBy: "sql" },
    { timezone: "invalid/timezone" },
    { search: ["bad"] },
  ]) {
    assert.equal(approvalQuerySchema.safeParse(input).success, false);
  }
  assert.equal(
    rejectionSchema.safeParse({ comments: "x".repeat(2001) }).success,
    false,
  );
  assert.deepEqual(rejectionSchema.parse({ comments: "  feedback  " }), {
    comments: "feedback",
  });
});

test("approval records the authenticated reviewer and prevents repeated or reversed decisions", async () => {
  const f = fixture();
  await approvals.decide("review", "owner", "APPROVED");
  assert.equal(f.review.decision, "APPROVED");
  assert.equal(f.review.reviewedById, "owner");
  assert.ok(f.review.reviewedAt);
  assert.deepEqual(f.events.slice(0, 2), ["lock:Project", "lock:ContentIdea"]);
  await assert.rejects(
    approvals.decide("review", "owner", "APPROVED"),
    httpError(409),
  );
  await assert.rejects(
    approvals.decide("review", "owner", "REJECTED"),
    httpError(409),
  );
});

test("rejection retains feedback and cannot be directly approved", async () => {
  const f = fixture();
  await approvals.decide("review", "owner", "REJECTED", "Improve pacing");
  assert.equal(f.review.comment, "Improve pacing");
  await assert.rejects(
    approvals.decide("review", "owner", "APPROVED"),
    httpError(409),
  );
});

test("ownership, soft deletion, missing asset and missing approval are enforced", async () => {
  const f = fixture();
  await assert.rejects(
    approvals.decide("review", "other-user", "APPROVED"),
    httpError(404),
  );
  await assert.rejects(
    approvals.decide("missing", "owner", "APPROVED"),
    httpError(404),
  );
  f.data.Project![0]!.deletedAt = now;
  await assert.rejects(
    approvals.decide("review", "owner", "APPROVED"),
    httpError(404),
  );
  f.data.Project![0]!.deletedAt = null;
  f.data.ContentIdea![0]!.deletedAt = now;
  await assert.rejects(
    approvals.decide("review", "owner", "APPROVED"),
    httpError(404),
  );
  f.data.ContentIdea![0]!.deletedAt = null;
  f.data.Asset![0]!.deletedAt = now;
  await assert.rejects(
    approvals.decide("review", "owner", "APPROVED"),
    httpError(404),
  );
  assert.equal(f.review.decision, "PENDING");
});

test("regeneration creates a shared workflow, keeps history and blocks duplicate generation", async () => {
  const f = fixture();
  f.review.decision = "REJECTED";
  f.review.comment = "Keep this feedback";
  const workflow = await workflows.createWorkflow({
    contentId: "content",
    currentUserId: "owner",
    workflowType: "VIDEO_GENERATION",
    regenerationApprovalId: "review",
  });
  assert.equal(workflow.status, "QUEUED");
  assert.equal(f.review.decision, "REGENERATE");
  assert.equal(f.review.regenerationWorkflowId, workflow.id);
  assert.equal(f.review.comment, "Keep this feedback");
  assert.equal(f.data.WorkflowLog!.length, 1);
  for (const regenerationApprovalId of ["review", undefined]) {
    await assert.rejects(
      workflows.createWorkflow({
        contentId: "content",
        currentUserId: "owner",
        workflowType: "VIDEO_GENERATION",
        ...(regenerationApprovalId ? { regenerationApprovalId } : {}),
      }),
      httpError(409),
    );
  }
  assert.equal(f.data.AIWorkflow!.length, 2);
});

test("completion creates one pending review per replacement asset and is idempotent", async () => {
  const f = fixture();
  f.review.decision = "REGENERATE";
  f.data.AIWorkflow!.push({
    id: "replacement",
    contentId: "content",
    workflowType: "VIDEO_GENERATION",
    status: "RUNNING",
  });
  const first = await completeVideoWorkflow(
    "replacement",
    "owner",
    "private/replacement.mp4",
    100,
  );
  const second = await completeVideoWorkflow(
    "replacement",
    "owner",
    "private/replacement.mp4",
    100,
  );
  assert.equal(first.id, second.id);
  assert.equal(f.data.Asset!.length, 2);
  assert.equal(f.data.Approval!.length, 2);
  assert.equal(f.data.Approval![1]!.decision, "PENDING");
  assert.equal(f.data.Approval![1]!.reviewedById, null);
  assert.equal(f.review.decision, "REGENERATE");
  f.data.Approval![1]!.decision = "APPROVED";
  await completeVideoWorkflow(
    "replacement",
    "owner",
    "private/replacement.mp4",
    100,
  );
  assert.equal(f.data.Approval![1]!.decision, "APPROVED");
});

test("background validation/provider failure restores rejected state and allows retry", async () => {
  const f = fixture();
  f.review.decision = "REJECTED";
  f.review.comment = "Preserved";
  mock.method(execution, "executeVideoGeneration", async () => {
    throw new Error("Test provider failure");
  });
  mock.method(console, "error", () => undefined);
  await execution.startVideoGeneration("content", "owner", "review");
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(f.review.decision, "REJECTED");
  assert.equal(f.review.comment, "Preserved");
  assert.equal(f.data.AIWorkflow![1]!.status, "FAILED");
  const retry = await workflows.createWorkflow({
    contentId: "content",
    currentUserId: "owner",
    workflowType: "VIDEO_GENERATION",
    regenerationApprovalId: "review",
  });
  assert.equal(retry.status, "QUEUED");
});

test("list builds parameterized filtered count and paged queries with nulls last", async () => {
  const plans: unknown[] = [];
  mock.method(db.runtime(), "query", (plan: unknown) => {
    plans.push(plan);
    return Promise.resolve(plans.length === 1 ? [{ totalCount: 8 }] : []);
  });
  const result = await approvals.list(
    "owner",
    approvalQuerySchema.parse({
      pageNo: 2,
      pageSize: 6,
      status: "REJECTED",
      search: "50%_",
      projectId: "project",
      scheduledDateFilter: "TODAY",
      timezone: "Asia/Calcutta",
    }),
  );
  assert.equal(result.totalCount, 8);
  assert.equal(result.currentPage, 2);
  assert.equal(plans.length, 2);
  const count = JSON.stringify(plans[0]);
  const page = JSON.stringify(plans[1]);
  assert.match(count, /count/i);
  const pagePlan = plans[1] as {
    ast: {
      orderBy: { expr: { kind: string }; dir: string }[];
      limit: number;
      offset: number;
    };
    params: unknown[];
  };
  const countPlan = plans[0] as { ast: { projection: unknown[] } };
  assert.equal(countPlan.ast.projection.length, 1);
  assert.equal(pagePlan.ast.orderBy[0]?.expr.kind, "null-check");
  assert.equal(pagePlan.ast.orderBy[0]?.dir, "asc");
  assert.equal(pagePlan.ast.limit, 6);
  assert.equal(pagePlan.ast.offset, 6);
  assert.ok(pagePlan.params.includes("%50\\%\\_%"));
  assert.match(page, /REGENERATE/);
  assert.match(page, /owner/);
  assert.match(page, /scheduledDate/);
  assert.match(page, /offset/);
});

test("list handles scheduled latest, unscheduled and empty pages without client-side filtering", async () => {
  const plans: unknown[] = [];
  mock.method(db.runtime(), "query", (plan: unknown) => {
    plans.push(plan);
    return Promise.resolve(plans.length % 2 === 1 ? [{ totalCount: 0 }] : []);
  });
  const result = await approvals.list(
    "owner",
    approvalQuerySchema.parse({
      pageNo: 50,
      sortOrder: "DESC",
      scheduledDateFilter: "UNSCHEDULED",
    }),
  );
  assert.equal(result.currentPage, 1);
  assert.equal(result.totalPages, 0);
  const plan = plans[1] as {
    ast: { orderBy: { expr: { kind: string }; dir: string }[]; offset: number };
  };
  assert.equal(plan.ast.orderBy[0]?.expr.kind, "null-check");
  assert.equal(plan.ast.orderBy[1]?.dir, "desc");
  assert.equal(plan.ast.offset, 0);
});

test("all non-rejected states reject regeneration and missing video fails safely", async () => {
  const f = fixture();
  for (const decision of ["PENDING", "APPROVED", "REGENERATE"]) {
    f.review.decision = decision;
    await assert.rejects(
      workflows.createWorkflow({
        contentId: "content",
        currentUserId: "owner",
        workflowType: "VIDEO_GENERATION",
        regenerationApprovalId: "review",
      }),
      httpError(409),
    );
  }
  f.review.decision = "REJECTED";
  f.data.Asset![0]!.deletedAt = now;
  await assert.rejects(
    workflows.createWorkflow({
      contentId: "content",
      currentUserId: "owner",
      workflowType: "VIDEO_GENERATION",
      regenerationApprovalId: "review",
    }),
    httpError(404),
  );
  assert.equal(f.data.AIWorkflow!.length, 1);
});

test("detail never exposes private storage keys and reports unavailable playback", async () => {
  mock.method(db.runtime(), "query", () =>
    Promise.resolve([
      {
        approvalId: "review",
        storageUrl: "private/internal.mp4",
        assetDeletedAt: null,
        assetType: "VIDEO",
        workflowStatus: "FAILED",
        workflowId: null,
      },
    ]),
  );
  const result = await approvals.get("review", "owner");
  assert.equal("storageUrl" in result, false);
  assert.equal("assetDeletedAt" in result, false);
  assert.equal(result.videoUrl, null);
  assert.ok(result.playbackError);
});
