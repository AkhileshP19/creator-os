import { Pencil, Trash } from "lucide-react";
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
  onDeleteProject,
  currentPage,
  totalPages,
  onPageChange,
  perPage,
  onPerPageChange,
}: ProjectsTableProps) => {
  return (
    <div>
      <Table className="border-b border-border border-separate border-spacing-0">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">Name</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px]">Created date</TableHead>
            <TableHead className="w-[100px]">Created time</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project, idx) => (
            <TableRow
              key={project.id}
              className={`${idx % 2 !== 0 ? "bg-muted" : "bg-background"}`}
            >
              <TableCell className="text-[#4f46e5] font-semibold py-6">
                {project.name}
              </TableCell>
              <TableCell>
                <ProjectStatusBadge status={project.status} />
              </TableCell>
              <TableCell>
                {new Date(project.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(project.createdAt).toLocaleTimeString()}
              </TableCell>
              <TableCell className="flex items-center gap-8 py-6">
                <Pencil
                  onClick={() => {
                    setIsEditModalOpen(true);
                    setSelectedProjectData(project);
                  }}
                  className="cursor-pointer"
                />
                <Trash
                  onClick={() => onDeleteProject(project.id)}
                  className="cursor-pointer"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
