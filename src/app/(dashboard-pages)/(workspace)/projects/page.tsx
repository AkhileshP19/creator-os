"use client";

import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { ProjectsTable } from "@/components/projects/projects-table";
import { usePaginatedData } from "@/hooks/fetch/usePaginatedDataParams";
import { usePostData } from "@/hooks/fetch/usePostData";
import { ApiEndPoint } from "@/types/api/api-types";
import { ProjectData } from "@/types/dashboard-types";
import { CreateProjectResponse } from "@/types/project-types";
import { Pencil, Trash } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ProjectsPage() {
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(
    null,
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedProjectData, setSelectedProjectData] =
    useState<ProjectData | null>(null);
  const [perPage, setPerPage] = useState<number>(7);
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  const deleteProjectMutation = usePostData<CreateProjectResponse, unknown>(
    ApiEndPoint.DELETE_PROJECT,
    [projectToDeleteId ?? ""],
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

  const handlePageSizeChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 p-5 max-h-[80vh] w-full overflow-y-auto">
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
          onDeleteProject={handleDeleteProject}
          currentPage={currentPage}
          totalPages={totalProjectsPages}
          onPageChange={handleClickPage}
          perPage={perPage}
          onPerPageChange={handlePageSizeChange}
        />
      )}

      <CreateProjectModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        mode="edit"
        projectId={selectedProjectData?.id}
        incomingProjectName={selectedProjectData?.name}
        incomingProjectDesc={selectedProjectData?.description}
        refetchProjects={refetchProjects}
      />
    </div>
  );
}
