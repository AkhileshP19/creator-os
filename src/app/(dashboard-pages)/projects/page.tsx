"use client";

import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { ProjectSettingsModal } from "@/components/projects/project-settings-modal";
import { ProjectsTable } from "@/components/projects/projects-table";
import { useFetchData } from "@/hooks/fetch/useFetchData";
import { usePaginatedData } from "@/hooks/fetch/usePaginatedDataParams";
import { usePatchData } from "@/hooks/fetch/usePatchData";
import { usePostData } from "@/hooks/fetch/usePostData";
import { projectSettingsFormSchema } from "@/schema/validation-schemas/project-settings-schema";
import { ApiEndPoint } from "@/types/api/api-types";
import { ProjectData } from "@/types/dashboard-types";
import {
  ProjectSettings,
  ProjectSettingsRequest,
  ProjectSettingsResponse,
} from "@/types/project-settings-types";
import { CreateProjectResponse } from "@/types/project-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";
import { Button } from "@/components/ui/button";
import { QueryErrorState } from "@/components/ui/custom/query-error-state";

export default function ProjectsPage() {
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createOrEditMode, setCreateOrEditMode] = useState<"create" | "edit">(
    "create",
  );
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);
  const [projectSettingsMode, setProjectSettingsMode] = useState<
    "create" | "edit"
  >("create");
  const [selectedProjectData, setSelectedProjectData] =
    useState<ProjectData | null>(null);
  const emptyProjectSettingsFormValues: z.infer<
    typeof projectSettingsFormSchema
  > = {
    brandName: "",
    defaultDuration: 10,
    defaultAspectRatio: "9:16",
  };
  const [perPage, setPerPage] = useState<number>(7);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const projectSettingsForm = useForm<
    z.infer<typeof projectSettingsFormSchema>
  >({
    resolver: zodResolver(projectSettingsFormSchema),
    mode: "onChange",
    defaultValues: emptyProjectSettingsFormValues,
  });

  const deleteProjectMutation = usePostData<CreateProjectResponse, unknown>(
    ApiEndPoint.DELETE_PROJECT,
    [projectToDeleteId ?? ""],
  );

  const {
    data: projectsData,
    refetch: refetchProjects,
    totalPages: totalProjectsPages,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = usePaginatedData<ProjectData>({
    apiEndPoint: ApiEndPoint.GET_DASHBOARD_PROJECTS,
    queryKey: "projects",
    pagination: {
      pageNo: currentPage,
      pageSize: perPage,
    },
  });

  const {
    mutateAsync: createProjectSettings,
    isPending: isCreatingProjectSettings,
  } = usePostData<ProjectSettingsResponse, ProjectSettingsRequest>(
    ApiEndPoint.CREATE_PROJECT_SETTINGS,
    [selectedProjectData?.id ?? ""],
  );

  const {
    mutateAsync: updateProjectSettings,
    isPending: isUpdatingProjectSettings,
  } = usePatchData<ProjectSettingsResponse, ProjectSettingsRequest>(
    ApiEndPoint.UPDATE_PROJECT_SETTINGS,
    [selectedProjectData?.id ?? ""],
  );

  const {
    data: projectSettings,
    isLoading: isLoadingProjectSettings,
    refetch: refetchProjectSettings,
  } = useFetchData<ProjectSettings | null>(
    ApiEndPoint.GET_PROJECT_SETTINGS,
    `project-settings-${selectedProjectData?.id ?? ""}`,
    [selectedProjectData?.id ?? ""],
    undefined,
    isSettingsModalOpen && !!selectedProjectData?.id,
  );

  const handleDeleteProject = async (projectId: string) => {
    try {
      setProjectToDeleteId(projectId);
      await deleteProjectMutation.mutateAsync({});
      refetchProjects();
      toast.success("Project deleted successfully");
      setProjectToDeleteId(null); // Reset the state after deletion
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleClickPage = (page: number | string) => {
    if (typeof page === "number") {
      setCurrentPage(page);
    }
  };

  const handleProjectSettingsSubmit = async (
    data: z.infer<typeof projectSettingsFormSchema>,
  ) => {
    if (!selectedProjectData) {
      return;
    }

    const payload: ProjectSettingsRequest = {
      brandName: data.brandName,
      defaultDuration: data.defaultDuration,
      defaultAspectRatio: data.defaultAspectRatio,
    };

    try {
      if (projectSettingsMode === "create") {
        await createProjectSettings(payload);
      } else {
        await updateProjectSettings(payload);
      }

      refetchProjectSettings();

      toast.success(
        projectSettingsMode === "create"
          ? "Project settings created successfully"
          : "Project settings updated successfully",
      );

      setIsSettingsModalOpen(false);
      setProjectSettingsMode("create");
      setSelectedProjectData(null);

      projectSettingsForm.reset(emptyProjectSettingsFormValues);
    } catch (error) {
      console.error("Failed to save project settings:", error);
      toast.error("Failed to save project settings");
    }
  };

  const handlePageSizeChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!isSettingsModalOpen) {
      return;
    }

    if (projectSettings) {
      setProjectSettingsMode("edit");

      projectSettingsForm.reset({
        brandName: projectSettings.brandName,
        defaultDuration: projectSettings.defaultDuration,
        defaultAspectRatio: projectSettings.defaultAspectRatio,
      });

      return;
    }

    setProjectSettingsMode("create");
    projectSettingsForm.reset(emptyProjectSettingsFormValues);
  }, [isSettingsModalOpen, projectSettings, projectSettingsForm]);

  useEffect(() => {
    console.log("selected project data", selectedProjectData);
  })

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your video production projects, brand presets, and timelines.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedProjectData(null);
            setCreateOrEditMode("create");
            setIsCreateModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer self-start sm:self-auto h-10 px-4"
        >
          Add New Project
        </Button>
      </div>
      {projectsError ? (
        <QueryErrorState
          title="Failed to load projects"
          message="An error occurred while fetching your projects. Please try again."
          onRetry={refetchProjects}
        />
      ) : (
        <ProjectsTable
          projects={projectsData || []}
          isLoading={isLoadingProjects}
          setIsEditModalOpen={(isOpen) => {
            setIsCreateModalOpen(isOpen);
            if (isOpen) {
              setCreateOrEditMode("edit");
            }
          }}
          setSelectedProjectData={setSelectedProjectData}
          setIsSettingsModalOpen={setIsSettingsModalOpen}
          onDeleteProject={handleDeleteProject}
          currentPage={currentPage}
          totalPages={totalProjectsPages}
          onPageChange={handleClickPage}
          perPage={perPage}
          onPerPageChange={handlePageSizeChange}
        />
      )}

      <CreateProjectModal
        key={`project-modal-${isCreateModalOpen}-${createOrEditMode}-${selectedProjectData?.id ?? ""}`}
        open={isCreateModalOpen}
        onOpenChange={(nextOpen) => {
          setIsCreateModalOpen(nextOpen);
          if (!nextOpen) {
            setSelectedProjectData(null);
            setCreateOrEditMode("create");
          }
        }}
        mode={createOrEditMode}
        projectId={selectedProjectData?.id}
        incomingProjectName={selectedProjectData?.name}
        incomingProjectDesc={selectedProjectData?.description}
        refetchProjects={refetchProjects}
      />

      <ProjectSettingsModal
        open={isSettingsModalOpen}
        onOpenChange={(nextOpen) => {
          setIsSettingsModalOpen(nextOpen);

          if (!nextOpen) {
            setProjectSettingsMode("create");
            setSelectedProjectData(null);
            projectSettingsForm.reset(emptyProjectSettingsFormValues);
          }
        }}
        form={projectSettingsForm}
        onSubmit={handleProjectSettingsSubmit}
        mode={projectSettingsMode}
        selectedProject={selectedProjectData}
        isSubmitting={isCreatingProjectSettings || isUpdatingProjectSettings}
        isLoadingSettings={isLoadingProjectSettings}
      />
    </div>
  );
}
