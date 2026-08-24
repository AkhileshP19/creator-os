"use client"

import { auth } from "@clerk/nextjs/server";
import { DashboardHeader } from "@/components/custom/dashboard-content/dashboard-header";
import { useFetchData } from "@/hooks/fetch/useFetchData";
import { ApiEndPoint } from "@/types/api/api-types";
import { DashboardOverviewResponse } from "@/types/dashboard-types";
import { DashboardTiles } from "@/components/custom/dashboard-content/dashboard-tiles";
import { usePaginatedData } from "@/hooks/fetch/usePaginatedDataParams";
import Projects from "@/components/custom/dashboard-content/projects";

export default function DashboardPage() {

  const { data, isFetched } = useFetchData<DashboardOverviewResponse>(
    ApiEndPoint.GET_DASHBOARD_OVERVIEW,
    "dashboard-overview",
  )

  if (isFetched) {
    console.log("data", data);
  }

  const { data: projectsData, isFetched: projectsIsFetched } = usePaginatedData({
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
        <Projects data={projectsData} isFetched={projectsIsFetched} />
      </div>
    </main>
  );
}
