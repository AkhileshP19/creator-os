"use client"

import { DashboardHeader } from "@/components/dashboard-content/dashboard-header";
import { useFetchData } from "@/hooks/fetch/useFetchData";
import { ApiEndPoint } from "@/types/api/api-types";
import { AIActivityData, DashboardOverviewResponse, PendingReviewsData, ProjectData } from "@/types/dashboard-types";
import { DashboardTiles } from "@/components/dashboard-content/dashboard-tiles";
import { usePaginatedData } from "@/hooks/fetch/usePaginatedDataParams";
import Projects from "@/components/dashboard-content/projects";
import { AIActivity } from "@/components/dashboard-content/ai-activity";
import { PendingReviews } from "@/components/dashboard-content/pending-reviews";

export default function DashboardPage() {

  const { data, isFetched } = useFetchData<DashboardOverviewResponse>(
    ApiEndPoint.GET_DASHBOARD_OVERVIEW,
    "dashboard-overview",
  )

  if (isFetched) {
    console.log("data", data);
  }

  const { data: projectsData, isFetched: projectsIsFetched } = usePaginatedData<ProjectData>({
    apiEndPoint: ApiEndPoint.GET_DASHBOARD_PROJECTS,
    queryKey: "hello",
    pagination: {
      pageNo: 1,
      pageSize: 5
    }
  })

  const { data: aiActivityData, isFetched: aiActivityIsFetched } = usePaginatedData<AIActivityData>({
    apiEndPoint: ApiEndPoint.GET_AI_ACTIVITY,
    queryKey: "ai-activity",
    pagination: {
      pageNo: 1,
      pageSize: 5
    }
  })

  const { data: pendingReviewsData, totalCount, isFetched: pendingReviewsIsFetched } = usePaginatedData<PendingReviewsData>({
    apiEndPoint: ApiEndPoint.GET_PENDING_REVIEWS,
    queryKey: "pending-reviews",
    pagination: {
      pageNo: 1,
      pageSize: 5
    }
  })

  return (
    <main className="min-w-0 flex-1 overflow-y-auto p-6 space-y-6">
      <DashboardHeader />
      <DashboardTiles data={data!} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2">
          <Projects data={projectsData} />
        </div>
        <div className="col-span-1 md:col-span-1">
          <AIActivity data={aiActivityData} />
        </div>
      </div>
      <div>
        <PendingReviews data={pendingReviewsData} totalCount={totalCount} />
      </div>
    </main>
  );
}
