import { Loader2, Pencil, Trash } from "lucide-react";
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
import { Button } from "../ui/button";

interface ContentTableProps {
  contentIdeas: ContentIdea[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  setIsEditModalOpen: (isOpen: boolean) => void;
  setIsViewScriptModalOpen: (isOpen: boolean) => void;
  setSelectedContentData: (project: ContentIdea | null) => void;
  setIsCreateOrEditMode: (value: "create" | "edit") => void;
  onDeleteContent: (contentId: string) => void;
  onGenerateScript: (contentId: string) => void;
  isGeneratingScript: boolean;
}

export const ContentTable = ({
  contentIdeas,
  currentPage,
  totalPages,
  onPerPageChange,
  perPage,
  onPageChange,
  setIsEditModalOpen,
  setIsViewScriptModalOpen,
  setSelectedContentData,
  setIsCreateOrEditMode,
  onDeleteContent,
  onGenerateScript,
  isGeneratingScript
}: ContentTableProps) => {
  return (
    <div>
      <Table className="border-b border-border border-separate border-spacing-0">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">Name</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px]">Scheduled date</TableHead>
            <TableHead className="w-[100px]">Scheduled time</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
            <TableHead className="w-[100px]">Script</TableHead>
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
                {contentIdea.scheduledDate
                  ? new Date(contentIdea.scheduledDate).toLocaleDateString()
                  : "-"}
              </TableCell>
              <TableCell>
                {contentIdea.scheduledDate
                  ? new Date(contentIdea.scheduledDate).toLocaleTimeString()
                  : "-"}
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
              <TableCell>
                {contentIdea.script.status === "NOT_GENERATED" && (
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer py-4"
                    onClick={() => onGenerateScript(contentIdea.id)}
                    disabled={isGeneratingScript}
                  >
                    {isGeneratingScript && <Loader2 className="w-6 h-6 animate-spin mr-2" />}
                    Generate Script
                  </Button>
                )}

                {contentIdea.script.status === "COMPLETED" && (
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer py-4"
                    onClick={() => {
                      setIsViewScriptModalOpen(true);
                      setSelectedContentData(contentIdea);
                    }}
                  >
                    View Script
                  </Button>
                )}

                {contentIdea.script.status === "FAILED" && (
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer py-4"
                    onClick={() => onGenerateScript(contentIdea.id)}
                    disabled={isGeneratingScript}
                  >
                    {isGeneratingScript && <Loader2 className="w-6 h-6 animate-spin mr-2" />}
                    Retry Script
                  </Button>
                )}

                {/* {(contentIdea.script.status === "RUNNING" ||
                  contentIdea.script.status === "QUEUED") && (
                  <Button disabled>Generating...</Button>
                )} */}
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
