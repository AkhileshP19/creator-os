"use client"

import { DashboardHeader } from "@/components/dashboard-content/dashboard-header";
import { useFetchData } from "@/hooks/fetch/useFetchData";
import { ApiEndPoint } from "@/types/api/api-types";
import { DashboardOverviewResponse, ProjectData } from "@/types/dashboard-types";
import { DashboardTiles } from "@/components/dashboard-content/dashboard-tiles";
import { usePaginatedData } from "@/hooks/fetch/usePaginatedDataParams";
import Projects from "@/components/projects";

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

  return (
    <main className="min-w-0 flex-1 overflow-y-auto p-6 space-y-6">
      <DashboardHeader />
      <DashboardTiles data={data!} />
      <div className="border rounded-md p-4">
        <Projects data={projectsData} />
      </div>
    </main>
  );
}
