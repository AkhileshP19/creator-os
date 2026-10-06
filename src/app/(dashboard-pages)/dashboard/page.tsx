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
import { AddNewContentModal } from "@/components/content/add-new-content-modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  newContentFormSchema,
  createNewContentSchema,
} from "@/schema/validation-schemas/new-content-schema";
import { usePostData } from "@/hooks/fetch/usePostData";
import {
  CreateContentIdeaRequest,
  CreateContentIdeaResponse,
} from "@/types/content-types";
import toast from "react-hot-toast";

const emptyContentFormValues = {
  projectId: "",
  title: "",
  description: "",
  category: "",
  tags: [] as string[],
  scheduledDate: undefined as unknown as Date,
  scheduledTime: "",
  priority: "",
};

export default function DashboardPage() {
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState<boolean>(false);
  const [isAddContentModalOpen, setIsAddContentModalOpen] =
    useState<boolean>(false);
  const { search } = useDashboardSearch();
  const debouncedSearch = useDebounceSearch(search, 300);

  const form = useForm<z.infer<typeof newContentFormSchema>>({
    resolver: (values, context, options) => {
      const schema = createNewContentSchema(null);
      const resolver = zodResolver(schema);
      return resolver(
        values as Parameters<typeof resolver>[0],
        context,
        options as Parameters<typeof resolver>[2],
      );
    },
    mode: "onChange",
    defaultValues: emptyContentFormValues,
  });

  const { data: allProjectsData, isLoading: isLoadingProjects } =
    useFetchData<ProjectData[]>(
      ApiEndPoint.GET_ALL_PROJECTS,
      "all-projects",
      [],
      undefined,
      isAddContentModalOpen,
    );

  const { mutateAsync: createContentIdea, isPending: isSubmittingContent } =
    usePostData<CreateContentIdeaResponse, CreateContentIdeaRequest>(
      ApiEndPoint.CREATE_CONTENT_IDEA,
    );

  const {
    data,
    isLoading: isOverviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useFetchData<DashboardOverviewResponse>(
    ApiEndPoint.GET_DASHBOARD_OVERVIEW,
    "dashboard-overview",
  );

  const {
    data: projectsData,
    refetch: refetchProjects,
    isLoading: isProjectsLoading,
    error: projectsError,
  } = usePaginatedData<ProjectData>({
    apiEndPoint: ApiEndPoint.GET_DASHBOARD_PROJECTS,
    queryKey: "dashboard-projects",
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

  const {
    data: pendingReviewsData,
    totalCount,
    isLoading: isReviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
  } = usePaginatedData<PendingReviewsData>({
    apiEndPoint: ApiEndPoint.GET_PENDING_REVIEWS,
    queryKey: "pending-reviews",
    pagination: {
      pageNo: 1,
      pageSize: 5,
    },
    enabled: true,
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

  const getScheduledDateTime = (
    date: Date | undefined,
    time: string | undefined,
  ) => {
    if (!date || !time) return null;
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes, 0, 0);
    return scheduledDate.toISOString();
  };

  const handleCreateNewContent = async (
    formData: z.infer<typeof newContentFormSchema>,
  ) => {
    try {
      const payload: CreateContentIdeaRequest = {
        projectId: formData.projectId,
        title: formData.title,
        description: formData.description ?? null,
        category: formData.category ?? null,
        tags: formData.tags ?? [],
        scheduledDate: getScheduledDateTime(
          formData.scheduledDate,
          formData.scheduledTime,
        ),
        status: "PENDING",
        priority: formData.priority as CreateContentIdeaRequest["priority"],
      };
      await createContentIdea(payload);
      toast.success("Content idea created successfully");
      setIsAddContentModalOpen(false);
      form.reset(emptyContentFormValues);
    } catch (error) {
      console.error("Failed to create content idea:", error);
      toast.error("Failed to create content idea");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <DashboardHeader
        setIsCreateProjectModalOpen={setIsCreateProjectModalOpen}
        setIsAddContentModalOpen={setIsAddContentModalOpen}
      />
      <DashboardTiles
        data={data}
        isLoading={isOverviewLoading}
        error={overviewError}
        onRetry={refetchOverview}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2">
          <Projects
            data={projectsData}
            isLoading={isProjectsLoading}
            error={projectsError}
            onRetry={refetchProjects}
          />
        </div>
        <div className="col-span-1">
          <AIActivity data={aiActivityData} />
        </div>
      </div>
      <div>
        <PendingReviews
          data={pendingReviewsData}
          totalCount={totalCount}
          isLoading={isReviewsLoading}
          error={reviewsError}
          onRetry={refetchReviews}
        />
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

      <AddNewContentModal
        open={isAddContentModalOpen}
        onOpenChange={(nextOpen) => {
          setIsAddContentModalOpen(nextOpen);
          if (!nextOpen) {
            form.reset(emptyContentFormValues);
          }
        }}
        form={form}
        mode="create"
        onSubmit={handleCreateNewContent}
        allProjects={allProjectsData ?? []}
        isLoadingProjects={isLoadingProjects}
        isSubmitting={isSubmittingContent}
        isUpdating={false}
      />
    </div>
  );
}
