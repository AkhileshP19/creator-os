"use client";

import { AddNewContentModal } from "@/components/content/add-new-content-modal";
import { Button } from "@/components/ui/button";
import {
  newContentFormSchema,
  createNewContentSchema,
} from "@/schema/validation-schemas/new-content-schema";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFetchData } from "@/hooks/fetch/useFetchData";
import { ApiEndPoint } from "@/types/api/api-types";
import { ProjectData } from "@/types/dashboard-types";
import { usePostData } from "@/hooks/fetch/usePostData";
import toast from "react-hot-toast";
import { usePaginatedData } from "@/hooks/fetch/usePaginatedDataParams";
import {
  ContentIdea,
  CreateContentIdeaRequest,
  CreateContentIdeaResponse,
  UpdateContentIdeaRequest,
} from "@/types/content-types";
import { ContentTable } from "@/components/content/content-table";
import { usePatchData } from "@/hooks/fetch/usePatchData";
import {
  GeneratedScript,
  GenerateScriptRequest,
  GenerateScriptResponse,
} from "@/types/generate-script-types";
import { GeneratedScriptModal } from "@/components/content/generated-script-modal";
import { GeneratedVideoModal } from "@/components/content/generated-video-modal";
import {
  GeneratedVideo,
  GenerateVideoRequest,
} from "@/types/generate-video-types";
import { QueryErrorState } from "@/components/ui/custom/query-error-state";

const emptyContentFormValues: z.infer<typeof newContentFormSchema> = {
  projectId: "",
  title: "",
  description: "",
  category: "",
  tags: [],
  scheduledDate: undefined as unknown as Date,
  scheduledTime: "",
  priority: "",
};

export default function ContentPage() {
  const [isAddContentModalOpen, setIsAddContentModalOpen] =
    useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(7);
  const [selectedContentData, setSelectedContentData] =
    useState<ContentIdea | null>(null);
  const [isCreateOrEditMode, setIsCreateOrEditMode] = useState<
    "create" | "edit"
  >("create");
  const [contentToDeleteId, setContentToDeleteId] = useState<string | null>(
    null,
  );
  const [isViewScriptModalOpen, setIsViewScriptModalOpen] =
    useState<boolean>(false);
  const [generatingScriptId, setGeneratingScriptId] = useState<string | null>(
    null,
  );
  const [isViewVideoModalOpen, setIsViewVideoModalOpen] =
    useState<boolean>(false);
  const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(
    null,
  );

  const form = useForm<z.infer<typeof newContentFormSchema>>({
    resolver: (values, context, options) => {
      const originalDate =
        isCreateOrEditMode === "edit" && selectedContentData?.scheduledDate
          ? new Date(selectedContentData.scheduledDate)
          : null;
      const schema = createNewContentSchema(originalDate);
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

  const {
    data: contentIdeasData,
    isLoading: isLoadingContentIdeas,
    error: contentIdeasError,
    refetch: refetchContentIdeas,
    totalPages: totalContentIdeasPages,
  } = usePaginatedData<ContentIdea>({
    apiEndPoint: ApiEndPoint.CREATE_CONTENT_IDEA,
    queryKey: "content-ideas",
    pagination: {
      pageNo: currentPage,
      pageSize: perPage,
    },
    refetchInterval: (data) => {
      const items = data?.responseData ?? [];
      const hasGeneratingVideo = items.some(
        (item) =>
          item.video?.status === "QUEUED" || item.video?.status === "RUNNING",
      );
      return hasGeneratingVideo ? 3000 : false;
    },
  });

  const { mutateAsync: createContentIdea, isPending: isSubmitting } =
    usePostData<CreateContentIdeaResponse, CreateContentIdeaRequest>(
      ApiEndPoint.CREATE_CONTENT_IDEA,
    );

  const { mutateAsync: updateContentMutation, isPending: isUpdating } =
    usePatchData<CreateContentIdeaResponse, UpdateContentIdeaRequest>(
      ApiEndPoint.UPDATE_CONTENT_IDEA,
      [selectedContentData?.id ?? ""],
    );

  const deleteContentMutation = usePostData<CreateContentIdeaResponse, unknown>(
    ApiEndPoint.DELETE_CONTENT_IDEA,
    [contentToDeleteId ?? ""],
  );

  const { mutateAsync: generateScriptMutation, isPending: isGeneratingScript } =
    usePostData<GenerateScriptResponse, GenerateScriptRequest>(
      ApiEndPoint.GENERATE_SCRIPT,
    );

  const { data: scriptData, isLoading: isFetchingScript } =
    useFetchData<GeneratedScript>(
      ApiEndPoint.GET_SCRIPT,
      "get-script",
      [selectedContentData?.script.workflowId ?? ""],
      undefined,
      !!(selectedContentData?.script.workflowId && isViewScriptModalOpen),
    );

  const { mutateAsync: generateVideoMutation } =
    usePostData<any, any>(ApiEndPoint.GENERATE_VIDEO);

  const { data: videoData, isLoading: isFetchingVideo } =
    useFetchData<GeneratedVideo>(
      ApiEndPoint.GET_VIDEO,
      "get-video",
      [selectedContentData?.video?.workflowId ?? ""],
      undefined,
      !!(selectedContentData?.video?.workflowId && isViewVideoModalOpen),
    );

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
    data: z.infer<typeof newContentFormSchema>,
  ) => {
    try {
      if (isCreateOrEditMode === "create") {
        const payload: CreateContentIdeaRequest = {
          projectId: data.projectId,
          title: data.title,
          description: data.description ?? null,
          category: data.category ?? null,
          tags: data.tags ?? [],
          scheduledDate: getScheduledDateTime(
            data.scheduledDate,
            data.scheduledTime,
          ),
          status: "PENDING",
          priority: data.priority as CreateContentIdeaRequest["priority"],
        };
        await createContentIdea(payload);
      } else {
        const payload: UpdateContentIdeaRequest = {
          title: data.title,
          description: data.description ?? null,
          category: data.category ?? null,
          tags: data.tags ?? [],
          scheduledDate: getScheduledDateTime(
            data.scheduledDate,
            data.scheduledTime,
          ),
          priority: data.priority as UpdateContentIdeaRequest["priority"],
        };
        await updateContentMutation(payload);
      }
      refetchContentIdeas();
      toast.success(
        isCreateOrEditMode === "create"
          ? "Content idea created successfully"
          : "Content idea updated successfully",
      );
      setIsAddContentModalOpen(false);
      setSelectedContentData(null);
      setIsCreateOrEditMode("create");
      form.reset(emptyContentFormValues);
    } catch (error) {
      console.error("failed to create content idea", error);
      toast.error(
        isCreateOrEditMode === "create"
          ? "Failed to create content idea"
          : "Failed to update content idea",
      );
    }
  };

  const handleDeleteContent = async (projectId: string) => {
    try {
      setContentToDeleteId(projectId);
      await deleteContentMutation.mutateAsync({});
      refetchContentIdeas();
      toast.success("Content idea deleted successfully");
      setContentToDeleteId(null);
    } catch (error) {
      console.error("Failed to delete content idea:", error);
      toast.error("Failed to delete content idea");
    }
  };

  const handleScriptGeneration = async (contentId: string) => {
    try {
      setGeneratingScriptId(contentId);
      const payload: GenerateScriptRequest = {
        contentId,
      };

      await generateScriptMutation(payload);
      toast.success("Script generated successfully");
      refetchContentIdeas();
    } catch (error) {
      console.error("Failed to generate script", error);
      toast.error("Failed to generate script");
      refetchContentIdeas();
    } finally {
      setGeneratingScriptId(null);
    }
  };

  const handleVideoGeneration = async (contentId: string) => {
    try {
      setGeneratingVideoId(contentId);
      const payload: GenerateVideoRequest = {
        contentId,
      };
      await generateVideoMutation(payload);
      toast.success("Video generation started");
      refetchContentIdeas();
    } catch (error) {
      console.error("Failed to generate video", error);
      toast.error("Failed to start video generation");
      refetchContentIdeas();
    } finally {
      setGeneratingVideoId(null);
    }
  };

  const handleClickPage = (page: number | string) => {
    if (typeof page === "number") {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Content
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your content pipeline, script generation, and video creation.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedContentData(null);
            form.reset(emptyContentFormValues);
            setIsAddContentModalOpen(true);
            setIsCreateOrEditMode("create");
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer self-start sm:self-auto h-10 px-4"
        >
          Add New Content
        </Button>
      </div>

      {contentIdeasError ? (
        <QueryErrorState
          title="Failed to load content ideas"
          message="An error occurred while fetching your content ideas. Please try again."
          onRetry={refetchContentIdeas}
        />
      ) : (
        <ContentTable
          contentIdeas={contentIdeasData}
          isLoading={isLoadingContentIdeas}
          currentPage={currentPage}
          totalPages={totalContentIdeasPages}
          onPageChange={handleClickPage}
          perPage={perPage}
          onPerPageChange={handlePageSizeChange}
          setIsEditModalOpen={setIsAddContentModalOpen}
          setIsViewScriptModalOpen={setIsViewScriptModalOpen}
          setIsViewVideoModalOpen={setIsViewVideoModalOpen}
          setSelectedContentData={setSelectedContentData}
          setIsCreateOrEditMode={setIsCreateOrEditMode}
          onDeleteContent={handleDeleteContent}
          onGenerateScript={handleScriptGeneration}
          isGeneratingScript={generatingScriptId}
          onGenerateVideo={handleVideoGeneration}
          isGeneratingVideo={generatingVideoId}
        />
      )}

      <AddNewContentModal
        open={isAddContentModalOpen}
        onOpenChange={(nextOpen) => {
          setIsAddContentModalOpen(nextOpen);

          if (!nextOpen) {
            setSelectedContentData(null);
            setIsCreateOrEditMode("create");
            form.reset(emptyContentFormValues);
          }
        }}
        form={form}
        mode={isCreateOrEditMode}
        onSubmit={handleCreateNewContent}
        allProjects={allProjectsData ?? []}
        isLoadingProjects={isLoadingProjects}
        isSubmitting={isSubmitting}
        selectedContentData={selectedContentData!}
        isUpdating={isUpdating}
      />

      <GeneratedScriptModal
        open={isViewScriptModalOpen}
        onOpenChange={setIsViewScriptModalOpen}
        scriptData={scriptData}
        isLoading={isFetchingScript}
      />

      <GeneratedVideoModal
        open={isViewVideoModalOpen}
        onOpenChange={setIsViewVideoModalOpen}
        videoData={videoData}
        title={selectedContentData?.title}
        isLoading={isFetchingVideo}
      />
    </div>
  );
}
