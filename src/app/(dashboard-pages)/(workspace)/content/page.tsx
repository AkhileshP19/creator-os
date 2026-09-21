"use client";

import { AddNewContentModal } from "@/components/content/add-new-content-modal";
import { Button } from "@/components/ui/button";
import { newContentFormSchema } from "@/schema/validation-schemas/new-content-schema";
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
} from "@/types/content-types";
import { ContentTable } from "@/components/content/content-table";
import { usePatchData } from "@/hooks/fetch/usePatchData";
import { GeneratedScript, GenerateScriptRequest, GenerateScriptResponse } from "@/types/generate-script-types";
import { GeneratedScriptModal } from "@/components/content/generated-script-modal";

const emptyContentFormValues: z.infer<typeof newContentFormSchema> = {
  projectId: "",
  title: "",
  description: "",
  category: "",
  tags: [],
  status: "",
  scheduledDate: undefined,
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
  const [isViewScriptModalOpen, setIsViewScriptModalOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof newContentFormSchema>>({
    resolver: zodResolver(newContentFormSchema),
    mode: "onChange",
    defaultValues: emptyContentFormValues,
  });

  const { data: allProjectsData } = useFetchData<ProjectData[]>(
    ApiEndPoint.GET_ALL_PROJECTS,
    "all-projects",
    [],
    undefined,
    isAddContentModalOpen,
  );

  const {
    data: contentIdeasData,
    refetch: refetchContentIdeas,
    totalPages: totalContentIdeasPages,
  } = usePaginatedData<ContentIdea>({
    apiEndPoint: ApiEndPoint.CREATE_CONTENT_IDEA,
    queryKey: "content-ideas",
    pagination: {
      pageNo: currentPage,
      pageSize: perPage,
    },
  });

  const { mutateAsync: createContentIdea, isPending: isSubmitting } =
    usePostData<CreateContentIdeaResponse, CreateContentIdeaRequest>(
      ApiEndPoint.CREATE_CONTENT_IDEA,
    );

  const { mutateAsync: updateContentMutation, isPending: isUpdating } =
    usePatchData<CreateContentIdeaResponse, CreateContentIdeaRequest>(
      ApiEndPoint.UPDATE_CONTENT_IDEA,
      [selectedContentData?.id ?? ""],
    );

  const deleteContentMutation = usePostData<CreateContentIdeaResponse, unknown>(
    ApiEndPoint.DELETE_CONTENT_IDEA,
    [contentToDeleteId ?? ""],
  );

  const {mutateAsync: generateScriptMutation, isPending: isGeneratingScript} = usePostData<GenerateScriptResponse, GenerateScriptRequest>(ApiEndPoint.GENERATE_SCRIPT);

  const {data: scriptData, isLoading: isFetchingScript} = useFetchData<GeneratedScript>(
    ApiEndPoint.GET_SCRIPT_BY_ID,
    "get-script",
    [selectedContentData?.script.workflowId ?? ""],
    undefined,
!!(selectedContentData?.script.workflowId && isViewScriptModalOpen)  )

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
      status: data.status as CreateContentIdeaRequest["status"],
      priority: data.priority as CreateContentIdeaRequest["priority"],
    };

    try {
      if (isCreateOrEditMode === "create") {
        await createContentIdea(payload);
      } else {
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
      toast.error("Failed to create content idea");
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
    const payload: GenerateScriptRequest = {
      contentId,
    };

    await generateScriptMutation(payload);

    toast.success("Script generated successfully");

    await refetchContentIdeas();
  } catch (error) {
    console.error("Failed to generate script", error);
    toast.error("Failed to generate script");
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
    <div className="space-y-6 p-5 max-h-[80vh] w-full">
      <div className="flex justify-between gap-4">
        <h1 className="text-2xl font-bold mb-4">Content</h1>
        <Button
          onClick={() => {
            setSelectedContentData(null);
            form.reset(emptyContentFormValues);
            setIsAddContentModalOpen(true);
            setIsCreateOrEditMode("create");
          }}
          className="px-4 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-md hover:cursor-pointer"
        >
          Add New Content
        </Button>
      </div>

      <div className="space-y-6 p-5 max-h-[80vh] w-full">
        <ContentTable
          contentIdeas={contentIdeasData}
          currentPage={currentPage}
          totalPages={totalContentIdeasPages}
          onPageChange={handleClickPage}
          perPage={perPage}
          onPerPageChange={handlePageSizeChange}
          setIsEditModalOpen={setIsAddContentModalOpen}
          setIsViewScriptModalOpen={setIsViewScriptModalOpen}
          setSelectedContentData={setSelectedContentData}
          setIsCreateOrEditMode={setIsCreateOrEditMode}
          onDeleteContent={handleDeleteContent}
          onGenerateScript={handleScriptGeneration}
          isGeneratingScript={isGeneratingScript}
        />
      </div>

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
        isSubmitting={isSubmitting}
        selectedContentData={selectedContentData!}
        isUpdating={isUpdating}
      />

      <GeneratedScriptModal open={isViewScriptModalOpen} onOpenChange={setIsAddContentModalOpen} scriptData={scriptData}/>
    </div>
  );
}
