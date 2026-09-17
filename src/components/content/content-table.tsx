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
import { ContentIdea } from "@/types/content-types";
import { PaginationController } from "../ui/custom/pagination-controller";

interface ContentTableProps {
  contentIdeas: ContentIdea[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  setIsEditModalOpen: (isOpen: boolean) => void;
  setSelectedContentData: (project: ContentIdea | null) => void;
  setIsCreateOrEditMode: (value: "create" | "edit") => void;
  onDeleteContent: (projectId: string) => void;
}

export const ContentTable = ({
  contentIdeas,
  currentPage,
  totalPages,
  onPerPageChange,
  perPage,
  onPageChange,
  setIsEditModalOpen,
  setSelectedContentData,
  setIsCreateOrEditMode,
  onDeleteContent,
}: ContentTableProps) => {
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
          {contentIdeas.map((contentIdea, idx) => (
            <TableRow
              key={contentIdea.id}
              className={`${idx % 2 !== 0 ? "bg-muted" : "bg-background"}`}
            >
              <TableCell className="text-[#4f46e5] font-semibold py-6">
                {contentIdea.title}
              </TableCell>
              <TableCell>{contentIdea.status}</TableCell>
              <TableCell>
                {new Date(contentIdea.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(contentIdea.createdAt).toLocaleTimeString()}
              </TableCell>
              <TableCell className="flex items-center gap-8 py-6">
                <Pencil
                  onClick={() => {
                    setIsEditModalOpen(true);
                    setSelectedContentData(contentIdea);
                    setIsCreateOrEditMode("edit");
                  }}
                  className="cursor-pointer"
                />
                <Trash
                  onClick={() => onDeleteContent(contentIdea.id)}
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
