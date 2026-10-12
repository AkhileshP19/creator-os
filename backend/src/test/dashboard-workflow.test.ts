import { afterEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import { Temporal } from "temporal-polyfill";

process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
const { default: dashboardService } = await import(
  "../services/dashboard-service.js"
);
const { db } = await import("../prisma/db.js");

afterEach(() => mock.restoreAll());

test("dashboard overview queries return valid envelope and owner-scoped metrics", async () => {
  mock.method(db.orm.public.User, "where", () => ({
    first: async () => ({
      id: "owner-1",
      fullName: "Test Creator",
      role: "CREATOR",
    }),
  }));

  mock.method(db, "runtime", () => ({
    query: async (plan: unknown) => {
      const planStr = JSON.stringify(plan ?? {});
      if (planStr.includes("totalCount")) {
        return [{ totalCount: 3 }];
      }
      return [];
    },
  }));

  const overview = await dashboardService.getOverview("owner-1");

  assert.equal(overview.user.id, "owner-1");
  assert.equal(overview.user.name, "Test Creator");
  assert.equal(overview.metrics.activeProjects.value, 3);
  assert.equal(overview.metrics.contentCreated.value, 3);
  assert.equal(overview.metrics.pendingReviews.value, 3);
  assert.equal(overview.metrics.pendingReviews.attentionRequired, true);
  assert.equal(overview.metrics.published.value, 3);
});

test("dashboard pending reviews returns paginated pending items", async () => {
  const now = Temporal.Now.instant();

  mock.method(db, "runtime", () => ({
    query: async (plan: unknown) => {
      const planStr = JSON.stringify(plan ?? {});
      if (planStr.includes("totalCount")) {
        return [{ totalCount: 1 }];
      }
      return [
        {
          approvalId: "app-1",
          contentId: "content-1",
          projectId: "proj-1",
          title: "My Short Video",
          createdAt: now,
          storageUrl: "https://example.com/video.mp4",
          workflowId: null,
        },
      ];
    },
  }));

  const result = await dashboardService.getPendingReviews("owner-1", 1, 5);

  assert.equal(result.totalCount, 1);
  assert.equal(result.totalPages, 1);
  assert.equal(result.currentPage, 1);
  assert.equal(result.responseData.length, 1);

  const item = result.responseData[0];
  assert.ok(item);
  assert.equal(item.id, "app-1");
  assert.equal(item.contentId, "content-1");
  assert.equal(item.projectId, "proj-1");
  assert.equal(item.title, "My Short Video");
  assert.equal(item.status, "pending");
  assert.equal(item.metadata.source, "ai_generated");
  assert.equal(item.metadata.durationSeconds, 10);
});

test("dashboard pending reviews supports search filtering by contentIdea title", async () => {
  const now = Temporal.Now.instant();
  let capturedQueryAst = "";

  mock.method(db, "runtime", () => ({
    query: async (plan: unknown) => {
      const planStr = JSON.stringify(plan ?? {});
      capturedQueryAst = planStr;
      if (planStr.includes("totalCount")) {
        return [{ totalCount: 1 }];
      }
      return [
        {
          approvalId: "app-1",
          contentId: "content-1",
          projectId: "proj-1",
          title: "Searched Title",
          createdAt: now,
          storageUrl: "https://example.com/video.mp4",
          workflowId: null,
        },
      ];
    },
  }));

  const result = await dashboardService.getPendingReviews(
    "owner-1",
    1,
    5,
    "Searched",
  );

  assert.equal(result.totalCount, 1);
  assert.equal(result.responseData[0]?.title, "Searched Title");
  assert.ok(capturedQueryAst.includes("Searched"));
});

