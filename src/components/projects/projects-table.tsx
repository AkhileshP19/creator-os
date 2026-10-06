import { Pencil, Trash, Settings } from "lucide-react";
import { ProjectStatusBadge } from "../ui/custom/project-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ProjectData } from "@/types/dashboard-types";
import { PaginationController } from "../ui/custom/pagination-controller";

interface ProjectsTableProps {
  projects: ProjectData[];
  setIsEditModalOpen: (isOpen: boolean) => void;
  setSelectedProjectData: (project: ProjectData | null) => void;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  onDeleteProject: (projectId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
}

export const ProjectsTable = ({
  projects,
  setIsEditModalOpen,
  setSelectedProjectData,
  setIsSettingsModalOpen,
  onDeleteProject,
  currentPage,
  totalPages,
  onPageChange,
  perPage,
  onPerPageChange,
}: ProjectsTableProps) => {
  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto w-full">
        <Table className="w-full min-w-[650px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-[160px] font-semibold text-xs">Name</TableHead>
              <TableHead className="w-[120px] font-semibold text-xs">Status</TableHead>
              <TableHead className="w-[130px] font-semibold text-xs">Created Date</TableHead>
              <TableHead className="w-[120px] font-semibold text-xs">Created Time</TableHead>
              <TableHead className="w-[110px] font-semibold text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className="hover:bg-indigo-50/20 transition-colors"
              >
                <TableCell className="text-indigo-600 font-semibold py-4 max-w-[200px] truncate">
                  {project.name}
                </TableCell>
                <TableCell>
                  <ProjectStatusBadge status={project.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(project.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(project.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <button
                      type="button"
                      aria-label="Edit project"
                      onClick={() => {
                        setIsEditModalOpen(true);
                        setSelectedProjectData(project);
                      }}
                      className="p-1.5 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Project settings"
                      onClick={() => {
                        setSelectedProjectData(project);
                        setIsSettingsModalOpen(true);
                      }}
                      className="p-1.5 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <Settings className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete project"
                      onClick={() => onDeleteProject(project.id)}
                      className="p-1.5 rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash className="size-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationController
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        maxVisibleButtons={5}
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        perPageOptions={[1, 7, 10, 15]}
      />
    </div>
  );
};
