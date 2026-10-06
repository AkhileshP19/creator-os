"use client";

import { DashboardHeader } from "@/components/dashboard-content/dashboard-header";
import { useFetchData } from "@/hooks/fetch/useFetchData";
import { ApiEndPoint } from "@/types/api/api-types";
import {
  AIActivityData,
  AutomationActivityData,
  DashboardOverviewResponse,
  PendingReviewsData,
  ProjectData,
} from "@/types/dashboard-types";
import { DashboardTiles } from "@/components/dashboard-content/dashboard-tiles";
import { usePaginatedData } from "@/hooks/fetch/usePaginatedDataParams";
import Projects from "@/components/dashboard-content/projects";
import { AIActivity } from "@/components/dashboard-content/ai-activity";
import { PendingReviews } from "@/components/dashboard-content/pending-reviews";
import { AutomationActivity } from "@/components/dashboard-content/automation-activity";
import { useState } from "react";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import useDebounceSearch from "@/hooks/optimization/useDebounceSearch";
import { useDashboardSearch } from "@/components/dashboard-search-context";

export default function DashboardPage() {
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState<boolean>(false);
  const { search } = useDashboardSearch();
  const debouncedSearch = useDebounceSearch(search, 300);

  const { data, isFetched } = useFetchData<DashboardOverviewResponse>(
    ApiEndPoint.GET_DASHBOARD_OVERVIEW,
    "dashboard-overview",
    [],
    undefined,
    false,
  );

  if (isFetched) {
    console.log("data", data);
  }

  const { data: projectsData, refetch: refetchProjects } =
    usePaginatedData<ProjectData>({
      apiEndPoint: ApiEndPoint.GET_DASHBOARD_PROJECTS,
      queryKey: "hello",
      pagination: {
        pageNo: 1,
        pageSize: 5,
      },
      search: debouncedSearch,
    });

  const { data: aiActivityData } = usePaginatedData<AIActivityData>({
    apiEndPoint: ApiEndPoint.GET_AI_ACTIVITY,
    queryKey: "ai-activity",
    pagination: {
      pageNo: 1,
      pageSize: 5,
    },
    enabled: false,
  });

  const { data: pendingReviewsData, totalCount } =
    usePaginatedData<PendingReviewsData>({
      apiEndPoint: ApiEndPoint.GET_PENDING_REVIEWS,
      queryKey: "pending-reviews",
      pagination: {
        pageNo: 1,
        pageSize: 5,
      },
      enabled: false,
    });

  const { data: automationData } = usePaginatedData<AutomationActivityData>({
    apiEndPoint: ApiEndPoint.GET_AUTOMATION_ACTIVITY,
    queryKey: "automation-activity",
    pagination: {
      pageNo: 1,
      pageSize: 5,
    },
    enabled: false,
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <DashboardHeader
        setIsCreateProjectModalOpen={setIsCreateProjectModalOpen}
      />
      <DashboardTiles data={data!} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2">
          <Projects data={projectsData} />
        </div>
        <div className="col-span-1">
          <AIActivity data={aiActivityData} />
        </div>
      </div>
      <div>
        <PendingReviews data={pendingReviewsData} totalCount={totalCount} />
      </div>
      <div>
        <AutomationActivity data={automationData} />
      </div>

      <CreateProjectModal
        key={`create-${isCreateProjectModalOpen}`}
        open={isCreateProjectModalOpen}
        onOpenChange={setIsCreateProjectModalOpen}
        mode="create"
        refetchProjects={refetchProjects}
      />
    </div>
  );
}
