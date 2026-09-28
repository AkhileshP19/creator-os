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

export default function ProjectsPage() {
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(
    null,
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
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
    <div className="space-y-6 p-5 max-h-[80vh] w-full overflow-y-hidden">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      {projectsData && projectsData.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No projects found. Create a new project to get started.
        </div>
      ) : (
        <ProjectsTable
          projects={projectsData || []}
          setIsEditModalOpen={setIsEditModalOpen}
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
        key={`edit-${isEditModalOpen}-${selectedProjectData?.id ?? ""}`}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        mode="edit"
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
