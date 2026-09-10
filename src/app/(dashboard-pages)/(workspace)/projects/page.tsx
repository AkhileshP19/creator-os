"use client";

import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { usePaginatedData } from "@/hooks/fetch/usePaginatedDataParams";
import { usePostData } from "@/hooks/fetch/usePostData";
import { ApiEndPoint } from "@/types/api/api-types";
import { ProjectData } from "@/types/dashboard-types";
import { Pencil, Trash } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ProjectsPage() {
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(
    null,
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [projectToEditId, setProjectToEditId] = useState<string | null>(null);
  const [selectedProjectData, setSelectedProjectData] =
    useState<ProjectData | null>(null);

  const { data: projectsData, refetch: refetchProjects } =
    usePaginatedData<ProjectData>({
      apiEndPoint: ApiEndPoint.GET_DASHBOARD_PROJECTS,
      queryKey: "projects",
      pagination: {
        pageNo: 1,
        pageSize: 5,
      },
    });

  const deleteProjectMutation = usePostData<any, any>(
    ApiEndPoint.DELETE_PROJECT,
    [],
    {
      projectToDeleteId,
    },
  );

  const handleDeleteProject = async (projectId: string) => {
    try {
      setProjectToDeleteId(projectId);
      await deleteProjectMutation.mutateAsync({});
      // Optionally, you can refetch the projects data after deletion
      refetchProjects();
      toast.success("Project deleted successfully");
      setProjectToDeleteId(null); // Reset the state after deletion
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    }
  };
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      {projectsData && projectsData.length > 0 ? (
        projectsData.map((project) => (
          <div key={project.id} className="border rounded-md p-4 mb-4">
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <Trash onClick={() => handleDeleteProject(project.id)} />
            <Pencil
              onClick={() => {
                setIsEditModalOpen(true);
                setSelectedProjectData(project);
              }}
            />
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
            <p className="text-sm text-muted-foreground">
              Status: {project.status}
            </p>
          </div>
        ))
      ) : (
        <p>No projects found.</p>
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
