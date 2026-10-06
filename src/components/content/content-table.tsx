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
  setIsViewVideoModalOpen: (isOpen: boolean) => void;
  setSelectedContentData: (project: ContentIdea | null) => void;
  setIsCreateOrEditMode: (value: "create" | "edit") => void;
  onDeleteContent: (contentId: string) => void;
  onGenerateScript: (contentId: string) => void;
  isGeneratingScript: string | null;
  onGenerateVideo: (contentId: string) => void;
  isGeneratingVideo: string | null;
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
  setIsViewVideoModalOpen,
  setSelectedContentData,
  setIsCreateOrEditMode,
  onDeleteContent,
  onGenerateScript,
  isGeneratingScript,
  onGenerateVideo,
  isGeneratingVideo,
}: ContentTableProps) => {
  const items = contentIdeas || [];

  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto w-full">
        <Table className="w-full min-w-[700px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-[180px] font-semibold text-xs">Title</TableHead>
              <TableHead className="w-[110px] font-semibold text-xs">Status</TableHead>
              <TableHead className="w-[120px] font-semibold text-xs">Scheduled Date</TableHead>
              <TableHead className="w-[110px] font-semibold text-xs">Scheduled Time</TableHead>
              <TableHead className="w-[90px] font-semibold text-xs">Actions</TableHead>
              <TableHead className="w-[130px] font-semibold text-xs">Script</TableHead>
              <TableHead className="w-[130px] font-semibold text-xs">Video</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  No content ideas found. Click &quot;Add New Content&quot; to get started.
                </TableCell>
              </TableRow>
            ) : (
              items.map((contentIdea) => (
                <TableRow
                  key={contentIdea.id}
                  className="hover:bg-indigo-50/20 transition-colors"
                >
                  <TableCell
                    className="text-indigo-600 font-semibold cursor-pointer hover:underline py-4 max-w-[220px] truncate"
                    onClick={() => {
                      setIsEditModalOpen(true);
                      setSelectedContentData(contentIdea);
                      setIsCreateOrEditMode("edit");
                    }}
                    title={contentIdea.title}
                  >
                    {contentIdea.title}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {contentIdea.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {contentIdea.scheduledDate
                      ? new Date(contentIdea.scheduledDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {contentIdea.scheduledDate
                      ? new Date(contentIdea.scheduledDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <button
                        type="button"
                        aria-label="Edit content"
                        onClick={() => {
                          setIsEditModalOpen(true);
                          setSelectedContentData(contentIdea);
                          setIsCreateOrEditMode("edit");
                        }}
                        className="p-1.5 rounded-md hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete content"
                        onClick={() => onDeleteContent(contentIdea.id)}
                        className="p-1.5 rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contentIdea.script.status === "NOT_GENERATED" && (
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 cursor-pointer shadow-2xs"
                        onClick={() => onGenerateScript(contentIdea.id)}
                        disabled={isGeneratingScript === contentIdea.id}
                      >
                        {isGeneratingScript === contentIdea.id && (
                          <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        )}
                        Generate Script
                      </Button>
                    )}

                    {contentIdea.script.status === "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs h-8 px-3 cursor-pointer"
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
                        size="sm"
                        variant="outline"
                        className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs h-8 px-3 cursor-pointer"
                        onClick={() => onGenerateScript(contentIdea.id)}
                        disabled={isGeneratingScript === contentIdea.id}
                      >
                        {isGeneratingScript === contentIdea.id && (
                          <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        )}
                        Retry Script
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {(!contentIdea.video ||
                      contentIdea.video.status === "NOT_GENERATED") && (
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 cursor-pointer shadow-2xs"
                        onClick={() => onGenerateVideo(contentIdea.id)}
                        disabled={
                          contentIdea.script.status !== "COMPLETED" ||
                          isGeneratingVideo === contentIdea.id
                        }
                        title={
                          contentIdea.script.status !== "COMPLETED"
                            ? "Please generate script first"
                            : undefined
                        }
                      >
                        {isGeneratingVideo === contentIdea.id && (
                          <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        )}
                        Generate Video
                      </Button>
                    )}

                    {(contentIdea.video?.status === "QUEUED" ||
                      contentIdea.video?.status === "RUNNING") && (
                      <Button
                        size="sm"
                        disabled
                        className="bg-indigo-600/80 text-white text-xs h-8 px-3 cursor-wait"
                      >
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Generating...
                      </Button>
                    )}

                    {contentIdea.video?.status === "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs h-8 px-3 cursor-pointer"
                        onClick={() => {
                          setIsViewVideoModalOpen(true);
                          setSelectedContentData(contentIdea);
                        }}
                      >
                        View Video
                      </Button>
                    )}

                    {contentIdea.video?.status === "FAILED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs h-8 px-3 cursor-pointer"
                        onClick={() => onGenerateVideo(contentIdea.id)}
                        disabled={isGeneratingVideo === contentIdea.id}
                      >
                        {isGeneratingVideo === contentIdea.id && (
                          <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        )}
                        Retry Video
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
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
