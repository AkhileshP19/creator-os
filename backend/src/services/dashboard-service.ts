import { Temporal } from "temporal-polyfill";
import { db } from "../prisma/db.js";

export interface MetricItem {
  value: number;
  change: string | null;
  changePeriod: string | null;
  trend: "up" | "down" | null;
}

export interface PendingReviewMetric {
  value: number;
  attentionRequired: boolean;
}

export interface DashboardOverviewData {
  user: {
    id: string;
    name: string;
    role: string;
  };
  metrics: {
    activeProjects: MetricItem;
    contentCreated: MetricItem;
    pendingReviews: PendingReviewMetric;
    published: MetricItem;
  };
}

export type ApprovalStatusType = "pending" | "approved" | "rejected";

export interface ApprovalMetadataType {
  source: "ai_generated";
  resolution: "1080x1920" | "1920x1080";
  durationSeconds: number;
}

export interface PendingReviewItem {
  id: string;
  contentId: string;
  projectId: string;
  title: string;
  status: ApprovalStatusType;
  thumbnailUrl: string;
  metadata: ApprovalMetadataType;
  createdAt: string;
}

export interface PaginatedPendingReviewsResult {
  responseData: PendingReviewItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

function calculateTrend(
  currentPeriodCount: number,
  previousPeriodCount: number,
): {
  change: string | null;
  changePeriod: string | null;
  trend: "up" | "down" | null;
} {
  if (currentPeriodCount === 0 && previousPeriodCount === 0) {
    return {
      change: null,
      changePeriod: null,
      trend: null,
    };
  }

  if (previousPeriodCount === 0) {
    return {
      change: `+${currentPeriodCount}`,
      changePeriod: "last 30 days",
      trend: "up",
    };
  }

  const diff = currentPeriodCount - previousPeriodCount;
  const percentage = Math.round((diff / previousPeriodCount) * 100);

  return {
    change: `${Math.abs(percentage)}%`,
    changePeriod: "vs last month",
    trend: percentage >= 0 ? "up" : "down",
  };
}

function ownedPendingApprovalsQuery(userId: string) {
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
    .select()
    .where((f, op) =>
      op.and(
        op.eq(f.project.ownerId, userId),
        op.eq(f.project.deletedAt, null),
        op.eq(f.contentIdea.deletedAt, null),
        op.eq(f.approval.decision, "PENDING"),
      ),
    );
}

const dashboardService = {
  getOverview: async (userId: string): Promise<DashboardOverviewData> => {
    const user = await db.orm.public.User.where({
      id: userId,
      deletedAt: null,
    }).first();

    const now = Temporal.Now.instant();
    const thirtyDaysAgo = now.subtract({ hours: 24 * 30 });
    const sixtyDaysAgo = now.subtract({ hours: 24 * 60 });

    // 1. activeProjects: count active/non-deleted projects owned by the user
    const projectBaseQuery = db.sql.public.project
      .select()
      .where((f, op) =>
        op.and(
          op.eq(f.project.ownerId, userId),
          op.eq(f.project.deletedAt, null),
        ),
      );

    const totalProjectsResult = await db
      .runtime()
      .query(
        projectBaseQuery.select("totalCount", (_f, op) => op.count()).build(),
      );
    const activeProjectsValue = Number(totalProjectsResult[0]?.totalCount ?? 0);

    const recentProjectsResult = await db.runtime().query(
      projectBaseQuery
        .where((f, op) => op.gte(f.project.createdAt, thirtyDaysAgo))
        .select("totalCount", (_f, op) => op.count())
        .build(),
    );
    const recentProjectsCount = Number(
      recentProjectsResult[0]?.totalCount ?? 0,
    );

    const prevProjectsResult = await db.runtime().query(
      projectBaseQuery
        .where((f, op) =>
          op.and(
            op.gte(f.project.createdAt, sixtyDaysAgo),
            op.lt(f.project.createdAt, thirtyDaysAgo),
          ),
        )
        .select("totalCount", (_f, op) => op.count())
        .build(),
    );
    const prevProjectsCount = Number(prevProjectsResult[0]?.totalCount ?? 0);

    const activeProjectsTrend = calculateTrend(
      recentProjectsCount,
      prevProjectsCount,
    );

    // 2. contentCreated: count active/non-deleted ContentIdeas owned through the user's projects
    const contentBaseQuery = db.sql.public.contentIdea
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

    const totalContentResult = await db
      .runtime()
      .query(
        contentBaseQuery.select("totalCount", (_f, op) => op.count()).build(),
      );
    const contentCreatedValue = Number(totalContentResult[0]?.totalCount ?? 0);

    const recentContentResult = await db.runtime().query(
      contentBaseQuery
        .where((f, op) => op.gte(f.contentIdea.createdAt, thirtyDaysAgo))
        .select("totalCount", (_f, op) => op.count())
        .build(),
    );
    const recentContentCount = Number(recentContentResult[0]?.totalCount ?? 0);

    const prevContentResult = await db.runtime().query(
      contentBaseQuery
        .where((f, op) =>
          op.and(
            op.gte(f.contentIdea.createdAt, sixtyDaysAgo),
            op.lt(f.contentIdea.createdAt, thirtyDaysAgo),
          ),
        )
        .select("totalCount", (_f, op) => op.count())
        .build(),
    );
    const prevContentCount = Number(prevContentResult[0]?.totalCount ?? 0);

    const contentCreatedTrend = calculateTrend(
      recentContentCount,
      prevContentCount,
    );

    // 3. pendingReviews: count Approval records with status PENDING belonging to content under user's projects
    const pendingReviewsQuery = db.sql.public.approval
      .innerJoin(db.sql.public.contentIdea, (f, op) =>
        op.eq(f.approval.contentId, f.contentIdea.id),
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
          op.eq(f.approval.decision, "PENDING"),
        ),
      );

    const pendingReviewsResult = await db
      .runtime()
      .query(
        pendingReviewsQuery
          .select("totalCount", (_f, op) => op.count())
          .build(),
      );
    const pendingReviewsValue = Number(
      pendingReviewsResult[0]?.totalCount ?? 0,
    );

    // 4. published: count content that reached confirmed publication (PublishJob.publishStatus === 'PUBLISHED')
    const publishedBaseQuery = db.sql.public.publishJob
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
          op.eq(f.publishJob.publishStatus, "PUBLISHED"),
        ),
      );

    const totalPublishedResult = await db
      .runtime()
      .query(
        publishedBaseQuery.select("totalCount", (_f, op) => op.count()).build(),
      );
    const publishedValue = Number(totalPublishedResult[0]?.totalCount ?? 0);

    const recentPublishedResult = await db.runtime().query(
      publishedBaseQuery
        .where((f, op) => op.gte(f.publishJob.publishedAt, thirtyDaysAgo))
        .select("totalCount", (_f, op) => op.count())
        .build(),
    );
    const recentPublishedCount = Number(
      recentPublishedResult[0]?.totalCount ?? 0,
    );

    const prevPublishedResult = await db.runtime().query(
      publishedBaseQuery
        .where((f, op) =>
          op.and(
            op.gte(f.publishJob.publishedAt, sixtyDaysAgo),
            op.lt(f.publishJob.publishedAt, thirtyDaysAgo),
          ),
        )
        .select("totalCount", (_f, op) => op.count())
        .build(),
    );
    const prevPublishedCount = Number(prevPublishedResult[0]?.totalCount ?? 0);

    const publishedTrend = calculateTrend(
      recentPublishedCount,
      prevPublishedCount,
    );

    return {
      user: {
        id: userId,
        name: user?.fullName ?? "Creator",
        role: user?.role ?? "CREATOR",
      },
      metrics: {
        activeProjects: {
          value: activeProjectsValue,
          ...activeProjectsTrend,
        },
        contentCreated: {
          value: contentCreatedValue,
          ...contentCreatedTrend,
        },
        pendingReviews: {
          value: pendingReviewsValue,
          attentionRequired: pendingReviewsValue > 0,
        },
        published: {
          value: publishedValue,
          ...publishedTrend,
        },
      },
    };
  },

  getPendingReviews: async (
    userId: string,
    pageNo: number,
    pageSize: number,
  ): Promise<PaginatedPendingReviewsResult> => {
    const query = ownedPendingApprovalsQuery(userId);

    const countRows = await db
      .runtime()
      .query(query.select("totalCount", (_f, op) => op.count()).build());
    const totalCount = Number(countRows[0]?.totalCount ?? 0);

    const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;
    const currentPage = Math.min(pageNo, Math.max(1, totalPages));
    const offset = (currentPage - 1) * pageSize;

    const rows = await db.runtime().query(
      query
        .select((f) => ({
          approvalId: f.approval.id,
          contentId: f.contentIdea.id,
          projectId: f.project.id,
          title: f.contentIdea.title,
          createdAt: f.approval.createdAt,
          storageUrl: f.asset.storageUrl,
          workflowId: f.aIWorkflow.id,
        }))
        .orderBy((f) => f.approval.createdAt, { direction: "desc" })
        .limit(pageSize)
        .offset(offset)
        .build(),
    );

    // Look up workflow duration if available
    const workflowIds = rows.flatMap((r) =>
      r.workflowId ? [r.workflowId] : [],
    );
    const durations = new Map<string, number>();

    if (workflowIds.length > 0) {
      const workflows = await db.orm.public.AIWorkflow.where((w) =>
        w.id.in(workflowIds),
      )
        .select("id")
        .include("aiRequests", (requests) =>
          requests
            .select("input")
            .orderBy((r) => r.createdAt.desc())
            .limit(1),
        )
        .all();

      for (const wf of workflows) {
        const input = wf.aiRequests[0]?.input;
        if (input && typeof input === "object" && !Array.isArray(input)) {
          const inputObj = input as Record<string, unknown>;
          if (typeof inputObj.durationSeconds === "number") {
            durations.set(wf.id, inputObj.durationSeconds);
          }
        }
      }
    }

    const responseData: PendingReviewItem[] = rows.map((row) => ({
      id: row.approvalId,
      contentId: row.contentId,
      projectId: row.projectId,
      title: row.title,
      status: "pending",
      thumbnailUrl: row.storageUrl ?? "",
      metadata: {
        source: "ai_generated",
        resolution: "1080x1920",
        durationSeconds: row.workflowId
          ? (durations.get(row.workflowId) ?? 10)
          : 10,
      },
      createdAt: row.createdAt
        ? String(row.createdAt)
        : new Date().toISOString(),
    }));

    return {
      responseData,
      totalCount,
      totalPages,
      currentPage,
    };
  },
};

export default dashboardService;
